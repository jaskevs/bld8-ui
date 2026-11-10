import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,mkdir,readFile,writeFile,realpath,rm,lstat} from 'node:fs/promises';
import {join,dirname,relative,isAbsolute,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import {chromium,expect} from '@playwright/test';
import {unzip} from './starter-archive.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),npm=process.env.npm_execpath;
assert(npm,'Run npm run check:starter:uploads.');assert.equal(process.versions.node.split('.')[0],'22');
const local=await realpath(join(root,'.local'));
assert.equal(relative(await realpath(root),local),'.local');assert(!(await lstat(join(root,'.local'))).isSymbolicLink());
const workspace=await mkdtemp(join(local,'upload-http-check-'));
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
const cache=Object.entries(env).find(([name])=>name.toLowerCase()==='npm_config_cache')?.[1];
for(const name of Object.keys(env))if(/^npm_config_/i.test(name)||/^(NPM_TOKEN|NODE_AUTH_TOKEN|GH_TOKEN|GITHUB_TOKEN|BLD8_RELEASE_TOKEN)$/i.test(name))delete env[name];
Object.assign(env,{npm_config_userconfig:join(workspace,'user.npmrc'),npm_config_globalconfig:join(workspace,'global.npmrc'),npm_config_registry:'https://registry.npmjs.org/',npm_config_audit:'false',npm_config_fund:'false'});
if(cache)env.npm_config_cache=cache;
async function run(args){const child=spawn(process.execPath,[npm,...args],{cwd:workspace,env,stdio:'inherit',timeout:10*60*1000});const[code]=await once(child,'exit');assert.equal(code,0,'Upload starter '+args.join(' ')+' failed.');}
let app,browser;
try{
  for(const [name,content] of Object.entries(unzip(await readFile(join(root,'apps/docs/public/downloads/upload-http.zip'))))){
    assert(!isAbsolute(name)&&!name.split(/[\\/]/).includes('..'),'Safe archive path');const target=join(workspace,name);await mkdir(dirname(target),{recursive:true});await writeFile(target,content);
  }
  await writeFile(env.npm_config_userconfig,'');await writeFile(env.npm_config_globalconfig,'');
  const manifest=JSON.parse(await readFile(join(workspace,'package.json'),'utf8'));assert.equal(manifest.dependencies['@bld8/blocks'],undefined);assert.deepEqual(manifest.workspaces,['packages/ui']);
  await run(['install','--no-audit','--no-fund']);await run(['run','build']);
  const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(done=>socket.close(done));
  const origin='http://127.0.0.1:'+port;app=spawn(process.execPath,[join(workspace,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:workspace,env,stdio:'inherit'});
  let ready=false;for(let attempt=0;attempt<150;attempt++){assert.equal(app.exitCode,null);try{if((await fetch(origin,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await delay(200);}assert(ready,'Independent starter became ready');
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);
  const body=Buffer.from('A standalone upload receipt.\n');await page.locator('input[type=file]').setInputFiles({name:'receipt.txt',mimeType:'text/plain',buffer:body});
  const response=page.waitForResponse(value=>value.url()===origin+'/api/upload'&&value.request().method()==='POST');await page.getByRole('button',{name:'Start queued',exact:true}).click();const result=await response;assert.equal(result.status(),201);
  const receipt=await result.json();assert.equal(receipt.bytes,body.length);assert.equal(receipt.sha256,createHash('sha256').update(body).digest('hex'));await expect(page.locator('[data-upload-status=complete]')).toContainText('Acknowledged');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone layout stays contained');assert.deepEqual(errors,[]);await page.screenshot({path:join(local,'batch-upload-starter-phone.png'),fullPage:true});
  console.log('Independent upload HTTP starter installed, built and acknowledged real bytes on a phone layout.');
}finally{
  await browser?.close();if(app&&app.exitCode===null){app.kill();await Promise.race([once(app,'exit'),delay(5000).then(()=>app.kill('SIGKILL'))]);}
  const actual=await realpath(workspace),inside=relative(local,actual);assert(inside&&!inside.startsWith('..')&&!isAbsolute(inside)&&basename(actual).startsWith('upload-http-check-'));assert(!(await lstat(actual)).isSymbolicLink());
  await rm(actual,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
