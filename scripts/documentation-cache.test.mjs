import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync,readdirSync,lstatSync,realpathSync,rmSync,rmdirSync,symlinkSync,unlinkSync,truncateSync} from 'node:fs';
import {join,resolve,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createManifest} from './source-release.mjs';
import {readPreparedRelease,releaseAssetName} from './release-hosting.mjs';
import {DOCUMENTATION_ORIGIN,MAX_DOCUMENTATION_CATALOG_BYTES,MAX_DOCUMENTATION_MANIFEST_BYTES,documentationSnapshot} from './documentation-versions.mjs';
import {readCachedDocumentation,readPublishedDocumentation,syncDocumentation} from './documentation-cache.mjs';
import {syncMain} from './sync-documentation.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const version='0.4.0';
const versionCatalog={schemaVersion:1,versions:[{version:'0.3.0',tag:'v0.3.0',title:'Earlier source'},{version,tag:'v'+version,title:'Documentation source'}]};
function directory(t){
  const parent=join(root,'.local');mkdirSync(parent,{recursive:true});
  const folder=mkdtempSync(join(parent,'documentation-cache-test-'));
  t.after(()=>{const target=resolve(folder);assert.ok(target.startsWith(resolve(parent)+sep));assert.ok(!lstatSync(target).isSymbolicLink());assert.equal(realpathSync(target),target);rmSync(target,{recursive:true,force:true});});
  return folder;
}
function fixture({sourceVersion=version,status='released',note='Original',changeCatalog=value=>value}={}){
  const options={version:sourceVersion,status,sourceRevision:'a'.repeat(40),registryBase:`${DOCUMENTATION_ORIGIN}/releases/${sourceVersion}/r`,items:[{name:'button',dependencies:[],registryDependencies:[],files:[{target:'@ui/bld8/button.tsx',content:'source'}]}]};
  const graph=createManifest({...options,artifacts:{}});
  const catalog=changeCatalog({schemaVersion:1,homepage:DOCUMENTATION_ORIGIN,release:{version:sourceVersion,status,sourceRevision:options.sourceRevision,snapshotKind:'source-graph',snapshot:documentationSnapshot(graph)},installation:{registryBase:options.registryBase},entries:[],guides:[],note});
  const catalogBytes=Buffer.from(JSON.stringify(catalog));
  const manifest=createManifest({...options,artifacts:{'docs/catalog.json':catalogBytes,'documentation.zip':Buffer.from('zip fixture')}});
  return {manifest,catalog,manifestBytes:Buffer.from(JSON.stringify(manifest,null,2)),catalogBytes};
}
function fetcher(data,calls=[]){return async(url,init)=>{calls.push({url,init});return new Response(url.endsWith('/manifest.json')?data.manifestBytes:data.catalogBytes);};}
const options=cacheRoot=>({cacheRoot,versionCatalog});

test('only the catalog artifact receives the larger release size allowance',t=>{
  const folder=directory(t);
  function prepared(name,path,size){
    const directory=join(folder,name);mkdirSync(directory);
    const bytes=Buffer.alloc(size,120),base=fixture().manifest;
    const manifest=createManifest({version,status:'released',sourceRevision:base.sourceRevision,registryBase:base.registryBase,items:[{name:'button',files:[{target:'@ui/bld8/button.tsx',content:'source'}],dependencies:[],registryDependencies:[]}],artifacts:{[path]:bytes}});
    const file=join(directory,path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,bytes);writeFileSync(join(directory,'manifest.json'),JSON.stringify(manifest));
    return directory;
  }
  assert.equal(releaseAssetName('docs/catalog.json'),'docs--catalog.json');assert.equal(releaseAssetName('documentation.zip'),'documentation.zip');
  const expanded=prepared('expanded','docs/catalog.json',17*1024*1024);
  assert.equal(readPreparedRelease(expanded).assets.find(asset=>asset.path==='docs/catalog.json').bytes.length,17*1024*1024);
  assert.throws(()=>readPreparedRelease(prepared('oversized-catalog','docs/catalog.json',MAX_DOCUMENTATION_CATALOG_BYTES+1)),/Unexpected release artifact/);
  assert.throws(()=>readPreparedRelease(prepared('oversized-archive','documentation.zip',17*1024*1024)),/Unexpected release artifact/);
});

test('published documentation reads work with all filesystem writes denied',async()=>{
  const data=fixture(),calls=[];
  assert.deepEqual(await readPublishedDocumentation(version,{versionCatalog,fetchImpl:fetcher(data,calls)}),{manifest:data.manifest,catalog:data.catalog});
  assert.equal(calls.length,2);
  const moduleUrl=new URL('./documentation-transport.mjs',import.meta.url).href;
  const childSource=`import {readPublishedDocumentation} from ${JSON.stringify(moduleUrl)};
    const manifest=Buffer.from(${JSON.stringify(data.manifestBytes.toString('base64'))},'base64');
    const catalog=Buffer.from(${JSON.stringify(data.catalogBytes.toString('base64'))},'base64');
    const result=await readPublishedDocumentation(${JSON.stringify(version)},{versionCatalog:${JSON.stringify(versionCatalog)},fetchImpl:async url=>new Response(url.endsWith('/manifest.json')?manifest:catalog)});
    console.log(JSON.stringify({version:result.manifest.version,keys:Object.keys(result).sort()}));`;
  const child=spawnSync(process.execPath,['--experimental-permission','--allow-fs-read=*','--input-type=module','-e',childSource],{cwd:root,env:{},encoding:'utf8',timeout:10000});
  assert.equal(child.status,0,child.stderr);
  assert.deepEqual(JSON.parse(child.stdout.trim()),{version,keys:['catalog','manifest']});
});

test('the web transport import graph cannot reach filesystem or private cache paths',()=>{
  const allowed=new Set(['documentation-transport.mjs','documentation-versions.mjs','source-release.mjs']),visited=new Set();
  function visit(file){
    const name=file.split(/[\\/]/).at(-1);assert.ok(allowed.has(name),'Unexpected web transport dependency: '+name);
    if(visited.has(name))return;visited.add(name);
    const source=readFileSync(file,'utf8');assert.doesNotMatch(source,/\.local[\\/]|node:fs|release-hosting\.mjs|documentation-cache\.mjs/);
    for(const match of source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)){
      if(match[1].startsWith('node:'))assert.equal(match[1],'node:crypto');
      else{assert.ok(match[1].startsWith('./'));visit(resolve(dirname(file),match[1]));}
    }
  }
  visit(fileURLToPath(new URL('./documentation-transport.mjs',import.meta.url)));
  assert.deepEqual([...visited].sort(),[...allowed].sort());
});

test('sync verifies fixed public bytes and retains an immutable two-file cache',async t=>{
  const folder=directory(t),cacheRoot=join(folder,'cache'),data=fixture(),calls=[];
  assert.equal(readCachedDocumentation(version,options(cacheRoot)),null);
  const first=await syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data,calls)});
  assert.equal(first.cached,false);assert.deepEqual(first.manifest,data.manifest);assert.deepEqual(first.catalog,data.catalog);
  assert.deepEqual(readCachedDocumentation(version,options(cacheRoot)),{manifest:data.manifest,catalog:data.catalog});
  assert.deepEqual(calls.map(call=>call.url),[`${DOCUMENTATION_ORIGIN}/releases/${version}/manifest.json`,`${DOCUMENTATION_ORIGIN}/releases/${version}/docs/catalog.json`]);
  for(const {init} of calls){assert.equal(init.method,'GET');assert.equal(init.redirect,'manual');assert.equal(init.headers.Authorization,undefined);assert.ok(init.signal instanceof AbortSignal);}
  const second=await syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data)});assert.equal(second.cached,true);
  const before=readFileSync(join(cacheRoot,version,'manifest.json'));
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(fixture({note:'Changed remote docs'}))}),/not overwritten/);
  assert.deepEqual(readFileSync(join(cacheRoot,version,'manifest.json')),before);
  assert.deepEqual(readdirSync(cacheRoot),[version]);assert.deepEqual(readdirSync(join(cacheRoot,version)).sort(),['catalog.json','manifest.json']);
});

test('unknown, legacy and malformed versions fail before any network access',async t=>{
  const cacheRoot=join(directory(t),'cache');let requests=0;const fetchImpl=async()=>{requests++;throw Error('Unexpected fetch');};
  for(const invalid of ['../private','0.4.0/extra','https://example.com','0.04.0','0.5.0','9'.repeat(100)+'.0.0'])await assert.rejects(syncDocumentation(invalid,{...options(cacheRoot),fetchImpl}),/version|catalogue/);
  await assert.rejects(syncDocumentation('0.3.0',{...options(cacheRoot),fetchImpl}),/does not include version-matched documentation/);
  assert.equal(requests,0);assert.equal(existsSync(cacheRoot),false);
  await assert.rejects(syncMain(['--version',version,'--origin','https://example.com'],{sync:async()=>{throw Error('Unexpected sync');}}),/only --version/);
  const messages=[];assert.equal(await syncMain(['--help'],{log:value=>messages.push(value)}),0);assert.match(messages[0],/No API key/);
});

test('downloads enforce actual stream limits as well as declared size',async t=>{
  const cacheRoot=join(directory(t),'cache'),data=fixture();
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async()=>new Response('{}',{headers:{'Content-Length':String(MAX_DOCUMENTATION_MANIFEST_BYTES+1)}})}),/size limit/);
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async url=>url.endsWith('/manifest.json')?new Response(data.manifestBytes):new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_DOCUMENTATION_CATALOG_BYTES+1));controller.close();}}),{headers:{'Content-Length':'1'}})}),/size limit/);
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async()=>new Response(null)}),/no body/);
  assert.equal(existsSync(cacheRoot),false);
});

test('the overall timeout also bounds a fetch implementation that ignores cancellation',async t=>{
  const cacheRoot=join(directory(t),'cache');
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=syncDocumentation(version,{...options(cacheRoot),fetchImpl:()=>new Promise(()=>{})});
  t.mock.timers.tick(20001);
  await assert.rejects(pending,/timed out/);
  assert.equal(existsSync(cacheRoot),false);
});

test('only bounded manual redirects through fixed release paths and asset hosts are accepted',async t=>{
  const cacheRoot=join(directory(t),'cache'),data=fixture(),calls=[];
  const fetchImpl=async(url,init)=>{
    calls.push({url,init});
    if(url.startsWith(DOCUMENTATION_ORIGIN)){const asset=url.endsWith('/manifest.json')?'manifest.json':'docs--catalog.json';return new Response(null,{status:308,headers:{Location:`https://github.com/jaskevs/bld8-ui/releases/download/v${version}/${asset}`}});}
    if(url.startsWith('https://github.com/')){const asset=url.split('/').at(-1);return new Response(null,{status:302,headers:{Location:'https://release-assets.githubusercontent.com/github-production-release-asset/1397384824/'+asset+'?signed=fixture'}});}
    return new Response(url.includes('manifest.json')?data.manifestBytes:data.catalogBytes);
  };
  await syncDocumentation(version,{...options(cacheRoot),fetchImpl});assert.equal(calls.length,6);
  for(const bad of ['http://ui.bld8.dev/secret','https://example.com/private','https://ui.bld8.dev.evil.test/private','https://user:secret@github.com/jaskevs/bld8-ui/releases/download/v0.4.0/manifest.json','https://github.com/other/repository/releases/download/v0.4.0/manifest.json','https://release-assets.githubusercontent.com/private']){
    await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async()=>new Response(null,{status:302,headers:{Location:bad}})}),/fixed release hosts/);
  }
  let loops=0;await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async url=>{loops++;return new Response(null,{status:302,headers:{Location:url}});}}),/redirect limit/);assert.equal(loops,5);
  const followed=new Response('{}');Object.defineProperty(followed,'redirected',{value:true});
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async()=>followed}),/unchecked redirect/);
});

test('source identity and catalog tampering are rejected without publishing partial cache data',async t=>{
  const cacheRoot=join(directory(t),'cache'),data=fixture();
  for(const invalid of [fixture({sourceVersion:'0.4.1'}),fixture({status:'unreleased'}),fixture({changeCatalog:catalog=>({...catalog,release:{...catalog.release,snapshot:'0'.repeat(64)}})})]){
    await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(invalid)}),/selected|source graph/);
  }
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async url=>new Response(url.endsWith('/manifest.json')?data.manifestBytes:Buffer.from('{}'))}),/digest/);
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async url=>{if(url.endsWith('/manifest.json'))return new Response(data.manifestBytes);throw Error('Fixture connection failed');}}),/connection failed/);
  assert.equal(existsSync(cacheRoot),false);
});

test('cached corruption, unexpected files and oversized files never fall back to current documentation',async t=>{
  const cacheRoot=join(directory(t),'cache'),data=fixture();await syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data)});
  const catalogPath=join(cacheRoot,version,'catalog.json');writeFileSync(catalogPath,'{}');
  assert.throws(()=>readCachedDocumentation(version,options(cacheRoot)),/digest/);
  let requests=0;await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:async()=>{requests++;throw Error('Unexpected fetch');}}),/digest/);assert.equal(requests,0);
  writeFileSync(catalogPath,data.catalogBytes);writeFileSync(join(cacheRoot,version,'unexpected.env'),'not read');
  assert.throws(()=>readCachedDocumentation(version,options(cacheRoot)),/unexpected inventory/);unlinkSync(join(cacheRoot,version,'unexpected.env'));
  truncateSync(catalogPath,MAX_DOCUMENTATION_CATALOG_BYTES+1);assert.throws(()=>readCachedDocumentation(version,options(cacheRoot)),/bounded regular files/);
});

test('cache roots and version folders cannot redirect reads through directory links',async t=>{
  const folder=directory(t),actual=join(folder,'actual'),data=fixture();await syncDocumentation(version,{...options(actual),fetchImpl:fetcher(data)});
  const link=join(folder,'cache-link');symlinkSync(actual,link,process.platform==='win32'?'junction':'dir');
  try{assert.throws(()=>readCachedDocumentation(version,options(link)),/without links/);}finally{unlinkSync(link);}
  const other=join(folder,'other');mkdirSync(other);const versionLink=join(other,version);symlinkSync(join(actual,version),versionLink,process.platform==='win32'?'junction':'dir');
  try{assert.throws(()=>readCachedDocumentation(version,options(other)),/without links/);}finally{unlinkSync(versionLink);}
});

test('a held writer lock is preserved and simultaneous successful syncs converge without replacement',async t=>{
  const cacheRoot=join(directory(t),'cache'),data=fixture();mkdirSync(cacheRoot);const lock=join(cacheRoot,'.lock-'+version);mkdirSync(lock);
  await assert.rejects(syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data)}),/already in progress/);assert.equal(existsSync(lock),true);
  // This test owns the empty fixture lock; remove it before the real concurrent operations.
  rmdirSync(lock);const results=await Promise.all([syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data)}),syncDocumentation(version,{...options(cacheRoot),fetchImpl:fetcher(data)})]);
  assert.deepEqual(results.map(result=>result.cached).sort(),[false,true]);assert.deepEqual(readdirSync(cacheRoot),[version]);
});
