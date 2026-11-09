import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {zip,unzip} from '../scripts/starter-archive.mjs';
import {DEFAULT_THEME,serializeThemeConfig} from '../packages/ui/src/theme-config';
import {chooseOption} from './helpers/controls';

function graph(name:string){
  const seen=new Set<string>(),dependencies=new Set<string>();let files=0;
  const visit=(key:string)=>{if(seen.has(key))return;seen.add(key);const item=JSON.parse(readFileSync(join(process.cwd(),'apps/docs/public/r',key+'.json'),'utf8'));files+=item.files.length;for(const dependency of item.dependencies||[])dependencies.add(dependency.split('@').slice(0,-1).join('@'));for(const dependency of item.registryDependencies||[])visit(dependency.split('/').pop().replace(/\.json$/,''));};visit(name);return{seen,dependencies,files};
}

test('small registry blocks install only their own module dependencies',()=>{
  const signIn=graph('sign-in');expect(signIn.seen.has('bld8-index')).toBe(false);expect(signIn.seen.size).toBeLessThanOrEqual(10);expect(signIn.files).toBeLessThanOrEqual(18);
  for(const name of ['@dnd-kit/core','@dnd-kit/sortable','react-day-picker','motion','@base-ui/react'])expect(signIn.dependencies.has(name)).toBe(false);
  expect(signIn.dependencies.has('lucide-react')).toBe(true);
  const outline=graph('outline');expect(outline.seen.has('bld8-index')).toBe(false);expect(outline.dependencies.has('@dnd-kit/core')).toBe(false);expect(outline.dependencies.has('react-day-picker')).toBe(true);
});

test('starter archives reject traversal, duplicate or corrupt input',()=>{
  expect(()=>zip({'../private':'invalid'})).toThrow();expect(()=>zip({'C:/private':'invalid'})).toThrow();
  const valid=zip({'source.ts':'export const greeting="hello";'});expect(unzip(valid)['source.ts'].toString()).toContain('hello');
  const corrupt=Buffer.from(valid);corrupt[14]^=1;expect(()=>unzip(corrupt)).toThrow(/integrity/);
  const duplicate=zip({'first.ts':'one','other.ts':'two'}),second=30+8+duplicate.readUInt32LE(18);duplicate.write('first.ts',second+30);expect(()=>unzip(duplicate)).toThrow(/Duplicate/);
  expect(()=>unzip(Buffer.from('invalid'))).toThrow();
});

for(const framework of ['nextjs','vite'] as const)for(const typography of ['standard','geometric','system'] as const)test(`${framework} exports a complete ${typography} theme and focused source`,async({request})=>{
  const config={...DEFAULT_THEME,accent:'#c67436',primary:'#203b36',radius:9,density:'compact' as const,typography};
  const query=new URLSearchParams({framework,mode:'dark',theme:serializeThemeConfig(config)});
  const response=await request.get('/api/starters/sign-in?'+query);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toBe('application/zip');
  const files=unzip(await response.body()),base=framework==='nextjs'?'app':'src';
  const css=files[base+'/bld8-theme.css'].toString();expect(css).toContain('#c67436');expect(css).toContain('9px');expect(css).toContain('[data-ui-theme="dark"]');
  expect(files[framework==='nextjs'?'app/layout.tsx':'index.html'].toString()).toContain('data-ui-theme="dark"');
  expect(files[framework==='nextjs'?'app/layout.tsx':'src/main.tsx'].toString()).toContain("import './bld8-theme.css'");
  expect(JSON.parse(files['bld8-theme.json'].toString()).accent).toBe(config.accent);
  expect(!!files[base+'/fonts/manrope.woff2']).toBe(typography!=='system');expect(!!files[base+'/fonts/dm-sans.woff2']).toBe(typography==='standard');
  expect(files['font-licenses/manrope-OFL.txt'].toString()).toContain('SIL OPEN FONT LICENSE');
  expect(files['packages/ui/src/kanban.tsx']).toBeUndefined();expect(files['packages/ui/src/calendar.tsx']).toBeUndefined();expect(files['packages/blocks/src/schedule-planner.tsx']).toBeUndefined();
  expect(files['packages/blocks/src/sign-in.tsx']).toBeTruthy();
  expect(files['packages/ui/src/index.ts'].toString()).toMatch(/^'use client';/);expect(files['packages/ui/dist/index.js'].toString()).toMatch(/^'use client';/);
  const ui=JSON.parse(files['packages/ui/package.json'].toString());expect(ui.dependencies['@dnd-kit/core']).toBeUndefined();expect(ui.dependencies['react-day-picker']).toBeUndefined();expect(ui.exports['./schedule-state']).toBeUndefined();
  expect(JSON.parse(files['package.json'].toString()).dependencies.next!==undefined).toBe(framework==='nextjs');
});

test('download options cannot address arbitrary files or inject theme CSS',async({request})=>{
  for(const path of ['/api/starters/missing','/api/starters/package.json'])expect((await request.get(path)).status()).toBe(404);
  for(const query of ['framework=other','mode=other','theme=%7Bbad','framework=vite&framework=nextjs','extra=anything','theme='+encodeURIComponent(JSON.stringify({version:1,...DEFAULT_THEME,accent:'red;display:none'}))])expect((await request.get('/api/starters/sign-in?'+query)).status()).toBe(400);
});

test('theme choice previews the actual starter and exports matching settings',async({page})=>{
  await page.goto('/themes?starter=sign-in&framework=vite');
  const frame=page.frameLocator('iframe[title="Theme preview"]');
  await expect(frame.getByRole('heading',{name:'Welcome back.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/^Sage /}).click();await page.getByRole('button',{name:'Dark preview',exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download starter',exact:true}).click()]);
  expect(download.suggestedFilename()).toBe('sign-in-vite-themed.zip');const file=await download.path();expect(file).toBeTruthy();
  const files=unzip(readFileSync(file!));expect(files['index.html'].toString()).toContain('data-ui-theme="dark"');expect(JSON.parse(files['bld8-theme.json'].toString()).typography).toBe('system');
  expect(await frame.locator('html').getAttribute('data-ui-theme')).toBe('dark');
  await page.reload();await expect(frame.getByRole('heading',{name:'Welcome back.',exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'Starter framework',exact:true})).toContainText('React + Vite');
});

test('download failure preserves choices and offers a working retry',async({page})=>{
  await page.goto('/themes?starter=sign-in');let calls=0;
  await page.route('**/api/starters/**',async route=>{if(++calls===1)await route.fulfill({status:503,contentType:'application/json',body:'{}'});else await route.continue();});
  await page.getByRole('button',{name:'Download starter',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Could not prepare the starter.'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Starter',exact:true})).toContainText('Sign-in form');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download starter',exact:true}).click()]);expect(download.suggestedFilename()).toBe('sign-in-nextjs-themed.zip');
});

test('changing export options cancels the earlier download',async({page})=>{
  await page.goto('/themes?starter=sign-in');let first=true,release=()=>{},finished=()=>{};
  const paused=new Promise<void>(resolve=>{release=resolve;}),completed=new Promise<void>(resolve=>{finished=resolve;});const downloads:string[]=[];
  page.on('download',download=>downloads.push(download.suggestedFilename()));
  await page.route('**/api/starters/**',async route=>{
    if(!first){await route.continue();return;}first=false;
    try{const response=await route.fetch();await paused;await route.fulfill({response});}catch{/* The old request was intentionally cancelled. */}finally{finished();}
  });
  try{
    const button=page.getByRole('button',{name:'Download starter',exact:true});await button.click();await expect(button).toHaveAttribute('aria-busy','true');
    await chooseOption(page,page.getByRole('combobox',{name:'Starter framework',exact:true}),'React + Vite');
    await expect(button).toBeEnabled();release();await completed;expect(downloads).toEqual([]);
    const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);expect(download.suggestedFilename()).toBe('sign-in-vite-themed.zip');
  }finally{release();}
});

for(const width of [320,390])test(`starter selection and preview fit at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.goto('/themes?starter=sign-in');
  await chooseOption(page,page.getByRole('combobox',{name:'Starter framework',exact:true}),'React + Vite');
  await expect(page.frameLocator('iframe[title="Theme preview"]').getByRole('heading',{name:'Welcome back.',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const frame=page.frameLocator('iframe[title="Theme preview"]');expect(await frame.locator('html').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('button',{name:'Download starter',exact:true})).toBeEnabled();
  await page.locator('.theme-starter').screenshot({path:info.outputPath('starter-controls.png')});
});

test('all starter packages expose only files included in their archive',()=>{
  const names=JSON.parse(readFileSync('apps/docs/public/r/index.json','utf8')).items.map((item:{id:string})=>item.id);
  for(const name of [...names,'outline-http','react-hook-form'])for(const suffix of ['','-vite']){
    if(suffix&&['outline-http','react-hook-form'].includes(name))continue;
    const files=unzip(readFileSync('apps/docs/public/downloads/'+name+suffix+'.zip'));
    for(const folder of ['packages/ui','packages/blocks']){
      const manifest=JSON.parse(files[folder+'/package.json'].toString());
      for(const value of Object.values(manifest.exports) as (string|{import:string;types:string})[])for(const path of typeof value==='string'?[value]:[value.import,value.types])expect(files[folder+'/'+path.slice(2)],name+' '+path).toBeTruthy();
    }
  }
});
