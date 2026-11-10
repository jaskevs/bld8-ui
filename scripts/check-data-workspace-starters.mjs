import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,mkdir,readFile,writeFile,realpath,rm,lstat} from 'node:fs/promises';
import {join,dirname,relative,isAbsolute,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {chromium,expect} from '@playwright/test';
import {unzip} from './starter-archive.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),npm=process.env.npm_execpath;
assert(npm,'Run npm run check:starters:data-workspace.');assert.equal(process.versions.node.split('.')[0],'22');
const local=await realpath(join(root,'.local'));assert.equal(relative(await realpath(root),local),'.local');assert(!(await lstat(join(root,'.local'))).isSymbolicLink());
const workspace=await mkdtemp(join(local,'data-workspace-check-'));
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
const cache=Object.entries(env).find(([name])=>name.toLowerCase()==='npm_config_cache')?.[1];
for(const name of Object.keys(env))if(/^npm_config_/i.test(name)||/^(NPM_TOKEN|NODE_AUTH_TOKEN|GH_TOKEN|GITHUB_TOKEN|BLD8_RELEASE_TOKEN)$/i.test(name))delete env[name];
Object.assign(env,{npm_config_userconfig:join(workspace,'user.npmrc'),npm_config_globalconfig:join(workspace,'global.npmrc'),npm_config_registry:'https://registry.npmjs.org/',npm_config_audit:'false',npm_config_fund:'false',npm_config_prefer_offline:'true'});if(cache)env.npm_config_cache=cache;
await writeFile(env.npm_config_userconfig,'');await writeFile(env.npm_config_globalconfig,'');
const processes=new Set();let browser;
function start(cwd,args,extra={}){const child=spawn(process.execPath,args,{cwd,env:{...env,...extra},stdio:'inherit'});processes.add(child);child.once('exit',()=>processes.delete(child));return child;}
async function stop(child){if(child?.exitCode===null){child.kill();await Promise.race([once(child,'exit'),delay(5000).then(()=>{if(child.exitCode===null)child.kill('SIGKILL');})]);}}
async function run(cwd,args){const child=start(cwd,[npm,...args]),[code]=await once(child,'exit');assert.equal(code,0,'Data Workspace starter '+args.join(' ')+' failed.');}
async function port(){const socket=createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const value=socket.address().port;await new Promise(done=>socket.close(done));return value;}
async function ready(origin,child){let passed=false;for(let attempt=0;attempt<200;attempt++){assert.equal(child.exitCode,null,'The starter process must stay running');try{if((await fetch(origin,{signal:AbortSignal.timeout(1000)})).ok){passed=true;break;}}catch{}await delay(200);}assert(passed,'The independent starter became ready.');}
const query={search:'',filters:{version:1,match:'all',rules:[]},sorts:[],page:1,pageSize:100};
async function readRows(origin){const response=await fetch(origin+'/api/issues?'+new URLSearchParams({query:JSON.stringify(query)}));assert.equal(response.status,200);return (await response.json()).rows;}
async function patch(origin,body){const response=await fetch(origin+'/api/issues',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,value:await response.json()};}
async function editTitle(page,id,value){const cell=page.getByRole('gridcell',{name:'Title for '+id,exact:true});await cell.focus();await cell.press('Enter');const input=page.getByRole('textbox',{name:'Title for '+id,exact:true});await input.fill(value);await input.press('Enter');await expect(cell).toContainText(value);}

try{
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
  for(const framework of ['next','vite']){
    const target=join(workspace,framework);await mkdir(target);
    const archive=framework==='next'?'data-workspace-http.zip':'data-workspace-http-vite.zip';
    for(const [name,content]of Object.entries(unzip(await readFile(join(root,'apps/docs/public/downloads',archive))))){assert(!isAbsolute(name)&&!name.split(/[\\/]/).includes('..'),'Safe archive paths');const path=join(target,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,content);}
    await run(target,['install','--no-audit','--no-fund']);await run(target,['run','build']);
    const webPort=await port(),apiPort=await port(),origin='http://127.0.0.1:'+webPort;
    let app,api;
    const launch=()=>framework==='next'?start(target,[join(target,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(webPort)],{APP_ORIGIN:origin}):start(target,[join(target,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(webPort),'--strictPort'],{API_PORT:String(apiPort)});
    if(framework==='vite'){api=start(target,['server/server.mjs'],{API_PORT:String(apiPort),APP_ORIGIN:origin});await ready('http://127.0.0.1:'+apiPort+'/api/issues?'+new URLSearchParams({query:JSON.stringify(query)}),api);}
    app=launch();await ready(origin,app);
    const page=await browser.newPage({viewport:{width:1280,height:950},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);await expect(page.getByRole('grid',{name:'Issue data grid'})).toBeVisible();
    const initial=await readRows(origin),ids=initial.slice(0,2).map(row=>row.id);
    for(let index=0;index<ids.length;index++)await editTitle(page,ids[index],framework+' saved title '+index);
    await page.getByRole('button',{name:'Review changes',exact:true}).click();const saveResponse=page.waitForResponse(response=>response.request().method()==='PATCH'&&response.url().endsWith('/api/issues'));await page.getByRole('button',{name:'Save 2 records',exact:true}).click();const response=await saveResponse;if(response.status()!==200)throw new Error('Save returned '+response.status()+': '+await response.text().catch(()=>'(body unavailable)'));await expect(page.getByRole('dialog',{name:'Review pending changes'})).toBeHidden();
    await page.reload();for(let index=0;index<ids.length;index++)await expect(page.getByRole('gridcell',{name:'Title for '+ids[index],exact:true})).toContainText(framework+' saved title '+index);
    for(const mode of ['light','dark']){await page.evaluate(value=>{document.documentElement.dataset.uiTheme=value;},mode);await page.setViewportSize({width:390,height:844});await expect(page.getByRole('grid')).toBeVisible();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone document stays contained');await page.screenshot({path:join(local,'data-workspace-'+framework+'-'+mode+'-phone.png'),fullPage:true});}
    assert.deepEqual(errors,[],'The independent starter has no page errors');
    const saved=await readRows(origin),first=saved.find(row=>row.id===ids[0]),second=saved.find(row=>row.id===ids[1]);assert.equal(first.revision,2);assert.equal(second.revision,2);
    const request={requestId:randomUUID(),changes:[{id:first.id,expectedRevision:first.revision,values:{estimate:first.estimate+1}}]},receipt=await patch(origin,request);assert.equal(receipt.status,200);assert.equal(receipt.value.rows[0].revision,3);
    if(framework==='next'){await stop(app);app=launch();await ready(origin,app);}else{await stop(api);api=start(target,['server/server.mjs'],{API_PORT:String(apiPort),APP_ORIGIN:origin});await ready('http://127.0.0.1:'+apiPort+'/api/issues?'+new URLSearchParams({query:JSON.stringify(query)}),api);}
    const replay=await patch(origin,request);assert.deepEqual(replay,receipt,'Saved retry receipts survive an actual process restart');
    const conflict=await patch(origin,{requestId:randomUUID(),changes:[{id:first.id,expectedRevision:first.revision,values:{title:'Stale title'}},{id:second.id,expectedRevision:second.revision,values:{title:'Do not partially save'}}]});assert.equal(conflict.status,409);assert.equal(conflict.value.ok,false);const after=await readRows(origin);assert.equal(after.find(row=>row.id===second.id).title,second.title);assert.equal(after.find(row=>row.id===first.id).revision,3);
    await page.close();await stop(app);await stop(api);
    console.log(framework+': independent install/build, two-row browser batch, reload, both phone themes, real restart/replay and atomic conflict recovery passed.');
  }
}finally{
  await browser?.close();for(const child of [...processes])await stop(child);
  const actual=await realpath(workspace),inside=relative(local,actual);assert(inside&&!inside.startsWith('..')&&!isAbsolute(inside)&&basename(actual).startsWith('data-workspace-check-'));assert(!(await lstat(actual)).isSymbolicLink());await rm(actual,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
