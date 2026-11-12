import {test,expect} from '@playwright/test';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync,lstatSync,symlinkSync,existsSync,copyFileSync} from 'node:fs';
import {join,resolve,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createManifest,byteHash} from '../scripts/source-release.mjs';
import {releaseAssetName,versionAssetUrl,assertRetainedVersions,readPreparedRelease,publishPreparedRelease,verifyPublishedRelease} from '../scripts/release-hosting.mjs';
import {publicationState,assertPublisherContext,publicReleaseAcceptance,githubReleaseClient} from '../scripts/publish-source-release.mjs';
import {sourceVersionAsset} from '../apps/docs/src/lib/source-versions';

const root=fileURLToPath(new URL('../',import.meta.url)),revision='a'.repeat(40),registryBase='https://ui.bld8.dev/releases/0.2.0/r';
const catalog={schemaVersion:1,versions:[{version:'0.2.0',tag:'v0.2.0',title:'First release'}]};
function prepared(){const bytes=Buffer.from('{}'),manifest=createManifest({version:'0.2.0',status:'released',sourceRevision:revision,registryBase,items:[{name:'button',files:[{target:'@ui/bld8/button.tsx',content:'source'}],registryDependencies:[],dependencies:[]}],artifacts:{'r/button.json':bytes}});return {manifest,assets:[{path:'manifest.json',name:'manifest.json',bytes:Buffer.from(JSON.stringify(manifest,null,2)),sha256:''},{path:'r/button.json',name:'r--button.json',bytes,sha256:byteHash(bytes)}].map(asset=>({...asset,sha256:byteHash(asset.bytes)}))};}
function clientFixture(){
  let release=null,tag=null;const stored=new Map(),calls=[];
  const client={getRelease:async()=>release,getTagRevision:async()=>tag,listReleases:async()=>release?[release]:[],createDraft:async body=>{calls.push('draft');release={...body,id:1,immutable:false};return release;},listAssets:async()=>[...stored.values()].map(({bytes,...asset})=>asset),uploadAsset:async(_id,asset)=>{calls.push('upload:'+asset.name);const remote={id:stored.size+1,name:asset.name,size:asset.bytes.length,state:'uploaded',digest:'sha256:'+asset.sha256,bytes:asset.bytes};stored.set(asset.name,remote);return remote;},assetDigest:async asset=>asset.digest.slice(7),readAsset:async asset=>stored.get(asset.name).bytes,publishDraft:async()=>{calls.push('publish');tag=revision;release={...release,draft:false,immutable:true};return release;}};
  return {client,calls,stored,setRelease:value=>release=value,setTag:value=>tag=value};
}
test('version paths are fixed, bounded and remain identical when another version is added',()=>{
  const before=versionAssetUrl(catalog,'0.2.0','r/button.json'),after=versionAssetUrl({...catalog,versions:[...catalog.versions,{version:'0.3.0',tag:'v0.3.0',title:'Next'}]},'0.2.0','r/button.json');expect(after).toBe(before);expect(sourceVersionAsset('0.2.0','r/button.json')).toBe(before);
  for(const value of ['../key','r/../../key','r/a.json?token=x','https://example.com','downloads/a.zip/extra','r/a%2fb.json'])expect(()=>releaseAssetName(value)).toThrow();
  for(const path of ['BRAND.md','licenses/inventory.json','scripts/license-policy.mjs','packages/ui/UPSTREAM.json','packages/ui/SHADCN_LICENSE','packages/blocks/LICENSE'])expect(sourceVersionAsset('0.2.0',path)).toBe(versionAssetUrl(catalog,'0.2.0',path));
  expect(sourceVersionAsset('unknown','manifest.json')).toBeNull();expect(sourceVersionAsset('0.2.0','../secret')).toBeNull();
  expect(()=>assertRetainedVersions({schemaVersion:1,versions:[]},[{tag_name:'v0.2.0',immutable:true,draft:false}])).toThrow('drop a retained');
});
test('publication verifies every draft asset before locking and never replaces a published version',async()=>{
  const fixture=clientFixture(),bundle=prepared();const release=await publishPreparedRelease(bundle,fixture.client);expect(fixture.calls).toEqual(['draft','upload:manifest.json','upload:r--button.json','publish']);expect(release.immutable).toBe(true);
  expect((await verifyPublishedRelease(release,'0.2.0',fixture.client)).sourceRevision).toBe(revision);
  await expect(publishPreparedRelease(bundle,fixture.client)).rejects.toThrow('already published');expect(fixture.calls.filter(value=>value==='publish')).toHaveLength(1);
  const state=await publicationState(catalog,{version:'0.2.0'},fixture.client);expect(state.needsPublish).toBe(false);expect(state.manifest.snapshot).toBe(bundle.manifest.snapshot);
});
test('an interrupted draft resumes identical bytes but rejects changed assets or another source revision',async()=>{
  const fixture=clientFixture(),bundle=prepared();fixture.setRelease({id:1,tag_name:'v0.2.0',draft:true,body:'<!-- bld8-source:'+revision+' -->'});await fixture.client.uploadAsset(1,bundle.assets[0]);fixture.calls.length=0;
  await publishPreparedRelease(bundle,fixture.client);expect(fixture.calls).toEqual(['upload:r--button.json','publish']);
  const changed=clientFixture();changed.setRelease({id:1,tag_name:'v0.2.0',draft:true,body:'<!-- bld8-source:'+revision+' -->'});await changed.client.uploadAsset(1,{...bundle.assets[0],sha256:'b'.repeat(64)});await expect(publishPreparedRelease(bundle,changed.client)).rejects.toThrow('not be overwritten');expect(changed.calls).not.toContain('publish');
  const other=clientFixture();other.setRelease({id:1,draft:true,body:'another revision'});await expect(publishPreparedRelease(bundle,other.client)).rejects.toThrow('another source');expect(other.calls).toEqual([]);
});
test('publication refuses tag collisions, extra assets and a non-immutable final response',async()=>{
  const tag=clientFixture();tag.setTag('b'.repeat(40));await expect(publishPreparedRelease(prepared(),tag.client)).rejects.toThrow('different source');expect(tag.calls).toEqual([]);
  const extra=clientFixture();extra.setRelease({id:1,draft:true,body:'<!-- bld8-source:'+revision+' -->'});extra.stored.set('unexpected',{id:1,name:'unexpected',state:'uploaded',size:1,digest:'sha256:'+byteHash('x'),bytes:Buffer.from('x')});await expect(publishPreparedRelease(prepared(),extra.client)).rejects.toThrow('Unexpected asset');expect(extra.calls).not.toContain('publish');
  const mutable=clientFixture();mutable.client.publishDraft=async()=>({draft:false,immutable:false});await expect(publishPreparedRelease(prepared(),mutable.client)).rejects.toThrow('immutable');
});
test('frozen artifact inventory rejects corruption and filesystem links before upload',()=>{
  const parent=join(root,'.local');mkdirSync(parent,{recursive:true});const directory=mkdtempSync(join(parent,'release-inventory-'));try{
    const bundle=prepared();for(const asset of bundle.assets){const path=join(directory,asset.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,asset.bytes);}
    expect(readPreparedRelease(directory).assets).toHaveLength(2);writeFileSync(join(directory,'r/button.json'),'changed');expect(()=>readPreparedRelease(directory)).toThrow('digest');writeFileSync(join(directory,'r/button.json'),bundle.assets[1].bytes);
    symlinkSync(join(directory,'r'),join(directory,'linked'),process.platform==='win32'?'junction':'dir');expect(()=>readPreparedRelease(directory)).toThrow('links');
  }finally{const target=resolve(directory);if(!target.startsWith(resolve(parent)+sep)||lstatSync(target).isSymbolicLink())throw Error('Unexpected release fixture.');rmSync(target,{recursive:true,force:true});}
});
test('publisher context cannot use a personal/company shell token or a pull request',()=>{
  expect(()=>assertPublisherContext({GH_TOKEN:'not-used'})).toThrow('main-branch');
  const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'jaskevs/bld8-ui',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_SHA:revision,BLD8_RELEASE_TOKEN:'scoped-fixture'};expect(()=>assertPublisherContext(env)).not.toThrow();expect(()=>assertPublisherContext({...env,GITHUB_EVENT_NAME:'pull_request'})).toThrow('main-branch');expect(()=>assertPublisherContext({...env,GITHUB_REPOSITORY:'other/repo'})).toThrow('main-branch');
});
test('public acceptance reads only fixed release URLs and stops on mismatching bytes',async()=>{
  const bundle=prepared(),calls=[];const fetcher=async url=>{calls.push(url);return new Response('{}',{status:200});};await expect(publicReleaseAcceptance('0.2.0',bundle.manifest,{fetcher,pause:async()=>{}})).rejects.toThrow('Public immutable artifact');expect(calls.every(url=>url.startsWith('https://github.com/jaskevs/bld8-ui/releases/download/v0.2.0/'))).toBe(true);
});

test('GitHub adapter finds resumable drafts, resolves annotated tags and preserves upload bytes',async()=>{
  const calls=[],bytes=Buffer.from('exact artifact bytes'),token='scoped-fixture-token';
  const client=githubReleaseClient(token,{fetcher:async(url,options)=>{
    calls.push({url,options});expect(options.headers.Authorization).toBe('Bearer '+token);expect(options.headers['X-GitHub-Api-Version']).toBe('2026-03-10');
    const path=new URL(url).pathname;
    if(path.endsWith('/releases/tags/v0.2.0'))return new Response('{}',{status:404});
    if(path.endsWith('/releases'))return Response.json([{id:3,draft:true,tag_name:'v0.2.0'}]);
    if(path.includes('/git/ref/'))return Response.json({object:{type:'tag',sha:'b'.repeat(40)}});
    if(path.includes('/git/tags/'))return Response.json({object:{type:'commit',sha:revision}});
    if(options.method==='POST'){expect(Buffer.from(options.body)).toEqual(bytes);expect(options.headers['Content-Type']).toBe('application/octet-stream');return Response.json({id:8,name:'r--button.json',state:'uploaded',size:bytes.length,digest:'sha256:'+byteHash(bytes)});}
    if(path.endsWith('/releases/assets/8'))return new Response(bytes);
    throw Error('Unexpected fixture request.');
  }});
  expect((await client.getRelease('v0.2.0')).draft).toBe(true);expect(await client.getTagRevision('v0.2.0')).toBe(revision);
  const asset=await client.uploadAsset(3,{name:'r--button.json',bytes});expect(await client.assetDigest(asset)).toBe(byteHash(bytes));expect(await client.assetDigest({...asset,digest:null})).toBe(byteHash(bytes));
  expect(calls.some(call=>call.url==='https://uploads.github.com/repos/jaskevs/bld8-ui/releases/3/assets?name=r--button.json')).toBe(true);expect(calls.every(call=>['api.github.com','uploads.github.com'].includes(new URL(call.url).hostname))).toBe(true);
});

test('GitHub adapter reports useful API failures without exposing its explicit token',async()=>{
  const token='private-fixture-token',client=githubReleaseClient(token,{fetcher:async()=>Response.json({message:'Permission denied '+token},{status:403})});
  await expect(client.listReleases()).rejects.toThrow('HTTP 403');try{await client.listReleases();}catch(error){expect(error.message).toContain('Permission denied [redacted]');expect(error.message).not.toContain(token);}
});
test('versioned HTTP routes redirect to retained assets and reject unsafe paths',async({request})=>{
  const response=await request.get('/releases/0.2.0/r/button.json',{maxRedirects:0});expect(response.status()).toBe(308);expect(response.headers().location).toBe('https://github.com/jaskevs/bld8-ui/releases/download/v0.2.0/r--button.json');expect(response.headers()['cache-control']).toContain('immutable');
  expect((await request.get('/releases/99.0.0/r/button.json',{maxRedirects:0})).status()).toBe(404);
  expect((await request.get('/releases/0.2.0/r/private.key',{maxRedirects:0})).status()).toBe(404);
});

test('publisher preflight runs before installation without build dependencies or preparation modules',()=>{
  const parent=resolve(tmpdir()),directory=mkdtempSync(join(parent,'bld8-publisher-preflight-'));
  try{
    mkdirSync(join(directory,'scripts'));mkdirSync(join(directory,'releases'));
    for(const name of ['publish-source-release.mjs','source-release.mjs','release-hosting.mjs'])copyFileSync(join(root,'scripts',name),join(directory,'scripts',name));
    const fixtureCatalog={schemaVersion:1,versions:[{version:'0.2.0',tag:'v0.2.0',title:'Retained'},{version:'0.3.0',tag:'v0.3.0',title:'Requested'}]};
    writeFileSync(join(directory,'releases/catalog.json'),JSON.stringify(fixtureCatalog));writeFileSync(join(directory,'releases/publish.json'),JSON.stringify({version:'0.3.0'}));
    const output=join(directory,'actions-output'),runner=join(directory,'preflight-fixture.mjs');
    const fixture=`import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {publisherMain} from './scripts/publish-source-release.mjs';
const root=process.cwd(),output=join(root,'actions-output'),calls=[],token='fixture-only-scoped-token';
assert.equal(existsSync(join(root,'node_modules')),false);assert.equal(existsSync(join(root,'scripts/prepare-source-release.mjs')),false);
globalThis.fetch=async(url,options={})=>{
  const parsed=new URL(url);assert.equal(parsed.origin,'https://api.github.com');assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer '+token);calls.push(parsed.pathname);
  if(parsed.pathname==='/repos/jaskevs/bld8-ui/releases'){assert.equal(parsed.searchParams.get('per_page'),'100');assert.equal(parsed.searchParams.get('page'),'1');return Response.json([{tag_name:'v0.2.0',draft:false,immutable:true}]);}
  if(parsed.pathname==='/repos/jaskevs/bld8-ui/releases/tags/v0.3.0')return new Response('{}',{status:404});
  throw Error('Unexpected preflight request: '+parsed.pathname);
};
const env={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'jaskevs/bld8-ui',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_SHA:'a'.repeat(40),BLD8_RELEASE_TOKEN:token,GITHUB_OUTPUT:output};
await assert.rejects(publisherMain(['--check'],{...env,GITHUB_EVENT_NAME:'pull_request'}),/main-branch/);assert.equal(calls.length,0);
await assert.rejects(publisherMain(['--check'],{...env,BLD8_RELEASE_TOKEN:''}),/repository-scoped/);assert.equal(calls.length,0);
await publisherMain(['--check'],env);assert.equal(readFileSync(output,'utf8'),['needsPublish=true',''].join(String.fromCharCode(10)));assert.deepEqual(calls,['/repos/jaskevs/bld8-ui/releases','/repos/jaskevs/bld8-ui/releases/tags/v0.3.0','/repos/jaskevs/bld8-ui/releases']);
writeFileSync(join(root,'releases/publish.json'),JSON.stringify({version:null}));await publisherMain(['--check'],env);assert.equal(readFileSync(output,'utf8'),['needsPublish=true','needsPublish=false',''].join(String.fromCharCode(10)));
console.log('Dependency-free preflight and context protection passed with GET-only fixtures.');
`;
    writeFileSync(runner,fixture);const result=spawnSync(process.execPath,[runner],{cwd:directory,encoding:'utf8',timeout:10000,env:{SystemRoot:process.env.SystemRoot??'',PATH:process.env.PATH??''}});
    expect(result.error).toBeUndefined();expect(result.status,result.stderr).toBe(0);expect(result.stdout).toContain('Dependency-free preflight and context protection passed');expect(readFileSync(output,'utf8')).toBe(['needsPublish=true','needsPublish=false',''].join(String.fromCharCode(10)));
    expect(existsSync(join(directory,'node_modules'))).toBe(false);expect(existsSync(join(directory,'scripts/prepare-source-release.mjs'))).toBe(false);
    const failure=spawnSync(process.execPath,[join(directory,'scripts/publish-source-release.mjs'),'--unsupported'],{cwd:directory,encoding:'utf8',timeout:10000,env:{SystemRoot:process.env.SystemRoot??'',GITHUB_ACTIONS:'true',BLD8_RELEASE_TOKEN:'fixture-cli-token'}});
    expect(failure.status).toBe(1);expect(failure.stderr).toContain('::error::Supported publisher option: --check');expect(failure.stderr).not.toContain('fixture-cli-token');
  }finally{
    const target=resolve(directory);if(!target.startsWith(parent+sep)||!target.slice(parent.length+1).startsWith('bld8-publisher-preflight-')||lstatSync(target).isSymbolicLink())throw Error('Unexpected publisher fixture.');rmSync(target,{recursive:true,force:true});
  }
});
