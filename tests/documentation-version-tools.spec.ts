import {test,expect} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
test('versioned documentation transport, archives and cache keep their bounded source identity',()=>{
  const result=spawnSync(process.execPath,['--test','scripts/documentation-versions.test.mjs','scripts/documentation-cache.test.mjs'],{cwd:root,encoding:'utf8',timeout:30000,env:{...process.env}});
  expect(result.status,result.stdout+'\n'+result.stderr).toBe(0);
});

test('human documentation separates development preview from unsupported retained APIs',async({request})=>{
  const earlier=await request.get('/docs/versions/0.2.0?entry=component%3Abutton');
  expect(earlier.status()).toBe(200);expect(await earlier.text()).toContain('Verified documentation is unavailable');
  const current=await request.get('/docs/versions/development?entry=component%3Abutton');
  expect(current.status()).toBe(200);expect(await current.text()).toContain('UNRELEASED DEVELOPMENT PREVIEW');
  const markdown=await request.get('/docs/versions/development/markdown?entry=component%3Abutton');
  expect(markdown.status()).toBe(200);expect(markdown.headers()['content-type']).toContain('text/markdown');expect(await markdown.text()).toContain('## Public API');
  expect((await request.get('/docs/versions/0.2.0/markdown?entry=component%3Abutton')).status()).toBe(404);
  expect((await request.get('/docs/versions/development/markdown?entry=component%3Aunknown')).status()).toBe(404);
});
