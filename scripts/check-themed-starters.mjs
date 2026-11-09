import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,realpath,mkdir,writeFile,rm,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,expect} from '@playwright/test';
import {unzip} from './starter-archive.mjs';
import {DEFAULT_THEME,serializeThemeConfig} from '../packages/ui/dist/theme-config.js';

const root=fileURLToPath(new URL('../',import.meta.url)),npm=process.env.npm_execpath;
assert(npm,'Use npm run check:starters:themes');assert.equal(process.versions.node.split('.')[0],'22');
const parent=await realpath(tmpdir()),workspace=await mkdtemp(join(parent,'bld8-themed-starters-'));
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
const cache=Object.entries(env).find(([name])=>name.toLowerCase()==='npm_config_cache')?.[1];
for(const name of Object.keys(env))if(/^npm_config_/i.test(name)||/^(NPM_TOKEN|NODE_AUTH_TOKEN)$/i.test(name))delete env[name];
Object.assign(env,{npm_config_userconfig:join(workspace,'user.npmrc'),npm_config_globalconfig:join(workspace,'global.npmrc'),npm_config_registry:'https://registry.npmjs.org/',npm_config_audit:'false',npm_config_fund:'false'});
if(cache)env.npm_config_cache=cache;
await writeFile(env.npm_config_userconfig,'');await writeFile(env.npm_config_globalconfig,'');
async function freePort(){const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(done=>server.close(done));return port;}
async function stop(child){if(!child||child.exitCode!==null)return;child.kill();await Promise.race([once(child,'exit'),delay(5000).then(()=>child.kill('SIGKILL'))]);}
async function ready(url,child){for(let attempt=0;attempt<150;attempt++){if(child.exitCode!==null)throw Error('Starter server exited early');try{const response=await fetch(url,{signal:AbortSignal.timeout(1000)});if(response.ok)return;}catch{}await delay(200);}throw Error('Starter server did not become ready');}
async function run(args,cwd){const child=spawn(process.execPath,[npm,...args],{cwd,env,stdio:'inherit',timeout:10*60*1000});const[code]=await once(child,'exit');assert.equal(code,0,'Independent starter '+args.join(' ')+' failed');}
let showcase,browser,app;
try{
  const port=await freePort(),origin='http://127.0.0.1:'+port;
  showcase=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'start','apps/docs','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env,stdio:'inherit'});
  await ready(origin,showcase);
  const selected=process.argv.slice(2);assert(selected.every(value=>['nextjs','vite'].includes(value)),'Choose nextjs, vite, or neither for both');
  const downloads=[];
  for(const [framework,id,typography,mode] of [['nextjs','outline','geometric','dark'],['vite','schedule-planner','standard','light']]){
    if(selected.length&&!selected.includes(framework))continue;
    const config={...DEFAULT_THEME,accent:'#c67436',primary:'#203b36',radius:9,density:'compact',typography};
    const query=new URLSearchParams({framework,mode,theme:serializeThemeConfig(config)}),response=await fetch(origin+'/api/starters/'+id+'?'+query);
    assert.equal(response.status,200);downloads.push({framework,id,mode,config,files:unzip(new Uint8Array(await response.arrayBuffer()))});
  }
  await stop(showcase);showcase=null;
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
  for(const item of downloads){
    const target=join(workspace,item.framework);await mkdir(target);
    for(const [file,bytes] of Object.entries(item.files)){
      const output=resolve(target,file);assert(output.startsWith(resolve(target)+sep));await mkdir(dirname(output),{recursive:true});await writeFile(output,bytes);
    }
    console.log('\nChecking downloaded '+item.id+' '+item.framework+' starter at '+target);
    await run(['install','--no-audit','--no-fund'],target);await run(['run','build'],target);
    const appPort=await freePort(),base='http://127.0.0.1:'+appPort;
    const command=item.framework==='nextjs'?[join(target,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(appPort)]:[join(target,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(appPort),'--strictPort'];
    app=spawn(process.execPath,command,{cwd:target,env,stdio:'inherit'});await ready(base,app);
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('html')).toHaveClass('bld8-theme');await expect(page.locator('html')).toHaveAttribute('data-ui-theme',item.mode);
    expect(await page.locator('html').evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-accent').trim())).toBe(item.config.accent);
    const font=item.framework==='nextjs'?'Manrope':'DM Sans';expect(await page.locator('body').evaluate(element=>getComputedStyle(element).fontFamily)).toContain(font);
    if(item.framework==='nextjs'){
      await page.getByRole('button',{name:'Find a view',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Outline navigation',exact:true});await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-accent').trim())).toBe(item.config.accent);await page.keyboard.press('Escape');
      await page.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
      const details=page.getByRole('dialog',{name:'Edit project',exact:true});await expect(details).toBeVisible();
      expect(await details.evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-accent').trim())).toBe(item.config.accent);
      await details.getByRole('textbox',{name:'Notes to self',exact:true}).fill('A themed starter draft.');await details.getByRole('button',{name:'Cancel',exact:true}).click();
      await details.getByRole('button',{name:'Keep draft & close',exact:true}).click();await expect(details).not.toBeVisible();
      await page.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
      await expect(details.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('A themed starter draft.');await details.getByRole('button',{name:'Save project',exact:true}).click();await expect(details).not.toBeVisible();
    }else{
      await expect(page.getByRole('heading',{name:'Make time for the next thing.',exact:true})).toBeVisible();
      await page.getByRole('button',{name:/^Book /}).first().click();await expect(page.getByRole('dialog',{name:'Book a time',exact:true})).toBeVisible();
    }
    await page.close();await stop(app);app=null;
  }
  console.log('Themed Next.js and Vite downloads installed, rebuilt and retained their theme in real interactions.');
}finally{
  if(browser)await browser.close();await stop(app);await stop(showcase);
  const actual=await realpath(workspace),inside=relative(parent,actual);assert(inside&&inside!=='..'&&!inside.startsWith('..'+sep)&&!isAbsolute(inside));assert.equal(dirname(actual),parent);assert(!(await lstat(actual)).isSymbolicLink());await rm(actual,{recursive:true,force:true,maxRetries:3,retryDelay:250});
}
