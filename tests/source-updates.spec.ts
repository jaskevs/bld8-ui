import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync,symlinkSync,unlinkSync} from 'node:fs';
import {resolve,join,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import {createManifest,validateManifest,manifestHash,planUpdate,sourceHash,byteHash,selectedSource} from '../scripts/source-release.mjs';
import {localReader} from '../scripts/check-source-updates.mjs';
import {prepareSourceRelease} from '../scripts/prepare-source-release.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const registryBase='https://ui.bld8.dev/r';
function fixture(version='0.1.0',code='old',style='old-style',dependency='motion@1'){
  return createManifest({version,registryBase,items:[
    {name:'button',files:[{target:'@ui/bld8/button.tsx',content:code}],registryDependencies:[registryBase+'/styles.json'],dependencies:[dependency]},
    {name:'styles',files:[{target:'@ui/bld8/styles.css',content:style}],registryDependencies:[],dependencies:[]},
    {name:'unrelated',files:[{target:'@ui/bld8/unrelated.tsx',content:'unrelated'}],registryDependencies:[],dependencies:[]}
  ],artifacts:{'r/button.json':Buffer.from(code)}});
}
function workspace(){const parent=resolve(root,'.local');mkdirSync(parent,{recursive:true});return mkdtempSync(join(parent,'source-updates-'));}
function remove(path:string){const parent=resolve(root,'.local'),target=resolve(path);if(!target.startsWith(parent+sep)||!target.split(sep).at(-1)!.startsWith('source-updates-')||lstatSync(target).isSymbolicLink())throw Error('Unexpected source update fixture.');rmSync(target,{recursive:true,force:true});}
function write(path:string,value:string|Buffer){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,value);}

test('source manifests are deterministic, detect tampering and select shared dependencies',()=>{
  const manifest=fixture();expect(fixture()).toEqual(manifest);expect(sourceHash('a\r\nb')).toBe(sourceHash('a\nb'));
  const selected=selectedSource(manifest,['button']);expect([...selected.items].sort()).toEqual(['button','styles']);expect([...selected.files.keys()]).not.toContain('bld8/unrelated.tsx');
  const tampered=structuredClone(manifest);tampered.items[0].files[0].sha256='a'.repeat(64);expect(()=>validateManifest(tampered)).toThrow('snapshot digest');
  const traversal=structuredClone(manifest);traversal.items[0].files[0].path='bld8/../../private';traversal.snapshot=manifestHash(traversal);expect(()=>validateManifest(traversal)).toThrow('source path');
  const missing=structuredClone(manifest);missing.items[0].registryDependencies=['missing'];missing.snapshot=manifestHash(missing);expect(()=>validateManifest(missing)).toThrow('missing dependency');
});

test('the update report separates upstream changes, local customisations and dependency revisions',()=>{
  const before=fixture(),after=fixture('0.2.0','new','new-style','motion@2');
  const report=planUpdate(before,after,['button'],path=>sourceHash(path.endsWith('.tsx')?'customised':'old-style'));
  expect(report.files.map(file=>file.status)).toEqual(['conflict','update-available']);expect(report.dependencies).toEqual({added:['motion@2'],removed:['motion@1']});expect(report.reviewRequired).toBe(true);
  expect(planUpdate(before,before,['button'],()=>sourceHash('custom')).files.every(file=>file.status==='local-only')).toBe(true);
  expect(planUpdate(before,after,['button'],path=>sourceHash(path.endsWith('.tsx')?'new':'new-style')).files.every(file=>file.status==='current')).toBe(true);
  expect(planUpdate(before,after,['button']).mode).toBe('catalogue');expect(()=>planUpdate(before,after,['unknown'])).toThrow('Choose an item');
});

test('additions, collisions, removals and missing local files require explicit review',()=>{
  const before=fixture(),after=structuredClone(fixture('0.2.0'));
  after.items.find(item=>item.name==='button')!.files=[{path:'bld8/replacement.tsx',sha256:sourceHash('replacement')}];after.snapshot=manifestHash(after);
  const absent=planUpdate(before,after,['button'],()=>null);expect(absent.files.map(file=>file.status)).toEqual(['already-absent','add','missing']);
  const custom=planUpdate(before,after,['button'],()=>sourceHash('custom'));expect(custom.files.map(file=>file.status)).toEqual(['removal-conflict','collision','local-only']);
  const plain=planUpdate(before,after,['button'],path=>path.endsWith('button.tsx')?sourceHash('old'):null);expect(plain.files[0].status).toBe('removal-review');
});

test('the standalone checker accepts custom UI directories and never writes source',()=>{
  const directory=workspace();try{
    const before=fixture(),after=fixture('0.2.0','new');write(join(directory,'before.json'),JSON.stringify(before));write(join(directory,'after.json'),JSON.stringify(after));
    const ui=join(directory,'custom/ui');write(join(ui,'bld8/button.tsx'),'custom');write(join(ui,'bld8/styles.css'),'old-style');
    const args=['scripts/check-source-updates.mjs','--from',join(directory,'before.json'),'--to',join(directory,'after.json'),'--item','button','--ui-dir',ui,'--json'];
    const run=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});expect(run.status,run.stderr).toBe(2);expect(JSON.parse(run.stdout).files[0].status).toBe('conflict');expect(readFileSync(join(ui,'bld8/button.tsx'),'utf8')).toBe('custom');
    const same=spawnSync(process.execPath,['scripts/check-source-updates.mjs','--from',join(directory,'before.json'),'--to',join(directory,'before.json'),'--item','button'],{cwd:root,encoding:'utf8'});expect(same.status,same.stderr).toBe(0);
    const invalid=spawnSync(process.execPath,['scripts/check-source-updates.mjs','--overwrite'],{cwd:root,encoding:'utf8'});expect(invalid.status).toBe(1);
    write(join(directory,'huge.json'),' '.repeat(8*1024*1024+1));const huge=spawnSync(process.execPath,['scripts/check-source-updates.mjs','--from',join(directory,'huge.json'),'--to',join(directory,'after.json'),'--item','button'],{cwd:root,encoding:'utf8'});expect(huge.status).toBe(1);expect(huge.stderr).toContain('exceeds 8 MiB');
    write(join(directory,'invalid.json'),'private-fixture-value');const malformed=spawnSync(process.execPath,['scripts/check-source-updates.mjs','--from',join(directory,'invalid.json'),'--to',join(directory,'after.json'),'--item','button'],{cwd:root,encoding:'utf8'});expect(malformed.status).toBe(1);expect(malformed.stderr).not.toContain('private-fixture-value');
  }finally{remove(directory);}
});

test('source reads reject a directory link that escapes the configured UI root',()=>{
  const directory=workspace();try{
    const ui=join(directory,'ui'),outside=join(directory,'elsewhere');mkdirSync(join(ui,'bld8'),{recursive:true});write(join(outside,'private.tsx'),'private');
    symlinkSync(outside,join(ui,'bld8/escape'),process.platform==='win32'?'junction':'dir');expect(()=>localReader(ui)('bld8/escape/private.tsx')).toThrow('leaves the UI directory');
  }finally{remove(directory);}
});

test('the actual candidate pins every dependency and refuses altered existing output',()=>{
  const {manifest,destination}=prepareSourceRelease({bundle:true});expect(manifest.status).toBe('unreleased');expect(manifest.items).toHaveLength(151);
  for(const item of manifest.items){const json=JSON.parse(readFileSync(join(destination,'r',item.name+'.json'),'utf8'));for(const url of json.registryDependencies)expect(url).toMatch(new RegExp('^https://ui\\.bld8\\.dev/releases/'+manifest.version.replaceAll('.','\\.')+'/r/[a-z0-9-]+\\.json$'));}
  for(const file of manifest.artifacts)expect(byteHash(readFileSync(join(destination,file.path))),file.path).toBe(file.sha256);
  expect(manifest.artifacts.filter(file=>file.path.startsWith('downloads/'))).toHaveLength(40);
  expect(prepareSourceRelease({bundle:true}).manifest.snapshot).toBe(manifest.snapshot);
  const artifact=join(destination,'r/button.json'),original=readFileSync(artifact);try{writeFileSync(artifact,'altered');expect(()=>prepareSourceRelease({bundle:true})).toThrow('will not be overwritten');expect(readFileSync(artifact,'utf8')).toBe('altered');}finally{writeFileSync(artifact,original);}
  const extra=join(destination,'unexpected.txt');try{writeFileSync(extra,'fixture');expect(()=>prepareSourceRelease({bundle:true})).toThrow('unexpected file');}finally{unlinkSync(extra);}
});

test('the build manifest and downloaded checker match the actual served registry',async({page,request},testInfo)=>{
  const response=await request.get('/releases/current.json');expect(response.ok()).toBe(true);const manifest=validateManifest(await response.json());expect(manifest.status).toBe('unreleased');
  const item=await (await request.get('/r/bld8-core.json')).json();for(const file of item.files)expect(manifest.items.find(item=>item.name==='bld8-core')!.files.find(entry=>entry.path===file.target.slice(4))!.sha256).toBe(sourceHash(file.content));
  await page.goto('/releases');await expect(page.getByRole('heading',{name:'0.2.0 · Unreleased'})).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download source manifest'}).click();const download=await downloadPromise;const path=await download.path();expect(JSON.parse(readFileSync(path!,'utf8')).snapshot).toBe(manifest.snapshot);
  for(const name of ['check-source-updates.mjs','source-release.mjs']){const tool=await request.get('/releases/'+name);expect(tool.ok()).toBe(true);expect(await tool.body()).toEqual(readFileSync(join(root,'scripts',name)));}
  expect((await request.get('/releases/0.2.0/r/button.json')).status()).toBe(404);
  for(const mode of ['light','dark'])for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:1050});await page.goto('/releases');await page.evaluate(value=>{document.documentElement.dataset.uiTheme=value;},mode);await expect(page.locator('html')).toHaveAttribute('data-ui-theme',mode);await page.evaluate(()=>document.fonts.ready);
    await expect(page.getByRole('heading',{name:'Keep the parts you made yours.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);await page.screenshot({path:testInfo.outputPath(`source-updates-${mode}-${width}.png`)});
  }
});
