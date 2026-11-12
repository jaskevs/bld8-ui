import {readFileSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {byteHash} from './source-release.mjs';
import {releaseRepository,versionPattern,validateVersionCatalog,assertRetainedVersions,readPreparedRelease,publishPreparedRelease,verifyPublishedRelease,releaseAssetName} from './release-hosting.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export function githubReleaseClient(token,{fetcher=fetch}={}){
  if(typeof token!=='string'||!token)throw Error('A repository-scoped release token is required.');
  const api='https://api.github.com/repos/'+releaseRepository;
  async function request(url,{method='GET',body,accept='application/vnd.github+json',binary=false}={}){
    const parsed=new URL(url);if(parsed.protocol!=='https:'||!['api.github.com','uploads.github.com'].includes(parsed.hostname))throw Error('Unexpected GitHub API host.');
    const headers={Authorization:'Bearer '+token,Accept:accept,'User-Agent':'bld8-source-release','X-GitHub-Api-Version':'2026-03-10'};
    if(body!==undefined)headers['Content-Type']=binary?'application/octet-stream':'application/json';
    const response=await fetcher(url,{method,headers,body:body===undefined?undefined:binary?body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
    if(response.status===404&&method==='GET')return null;
    if(!response.ok){const detail=await response.json().catch(()=>null),message=typeof detail?.message==='string'?detail.message.replaceAll(token,'[redacted]').replace(/[\x00-\x1f]/g,' ').slice(0,200):'';throw Error('GitHub release request failed: HTTP '+response.status+' '+parsed.pathname+(message?' — '+message:''));}
    return accept==='application/octet-stream'?Buffer.from(await response.arrayBuffer()):response.status===204?null:response.json();
  }
  async function list(path){const values=[];for(let page=1;page<=30;page++){const batch=await request(api+path+`?per_page=100&page=${page}`);if(!Array.isArray(batch))throw Error('GitHub list response is invalid.');values.push(...batch);if(batch.length<100)return values;}throw Error('GitHub list exceeds the release bound.');}
  const client={
    async getRelease(tag){const published=await request(api+'/releases/tags/'+encodeURIComponent(tag));return published??(await list('/releases')).find(item=>item.tag_name===tag)??null;},
    listReleases:()=>list('/releases'),
    async getTagRevision(tag){const ref=await request(api+'/git/ref/tags/'+encodeURIComponent(tag));if(!ref)return null;let object=ref.object;for(let depth=0;depth<3&&object?.type==='tag';depth++){const value=await request(api+'/git/tags/'+object.sha);object=value?.object;}if(object?.type!=='commit'||!/^[a-f0-9]{40}$/.test(object.sha))throw Error('Unsupported release tag object.');return object.sha;},
    createDraft:body=>request(api+'/releases',{method:'POST',body}),
    listAssets:id=>list('/releases/'+id+'/assets'),
    uploadAsset:(id,asset)=>request(`https://uploads.github.com/repos/${releaseRepository}/releases/${id}/assets?name=${encodeURIComponent(asset.name)}`,{method:'POST',body:asset.bytes,binary:true}),
    publishDraft:id=>request(api+'/releases/'+id,{method:'PATCH',body:{draft:false,make_latest:'true'}}),
    readAsset:asset=>request(api+'/releases/assets/'+asset.id,{accept:'application/octet-stream'}),
    async assetDigest(asset){if(/^sha256:[a-f0-9]{64}$/.test(asset.digest??''))return asset.digest.slice(7);const bytes=await client.readAsset(asset);if(!bytes)throw Error('Release asset is missing.');return byteHash(bytes);},
  };
  return client;
}

export function assertPublisherContext(env){
  if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!==releaseRepository||env.GITHUB_REF!=='refs/heads/main'||!['push','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA??''))throw Error('Publication runs only in the main-branch job for '+releaseRepository+'.');
  if(!env.BLD8_RELEASE_TOKEN)throw Error('The repository-scoped Actions release token is missing.');
}
export async function publicReleaseAcceptance(version,manifest,{fetcher=fetch,pause=delay}={}){
  const selected=['manifest.json','r/button.json','r/outline.json','downloads/outline-vite.zip','capture-installation.mjs'];
  for(const path of selected){
    let passed=false;
    for(let attempt=0;attempt<6;attempt++){
      const response=await fetcher(`https://github.com/${releaseRepository}/releases/download/v${version}/${releaseAssetName(path)}`,{headers:{'User-Agent':'bld8-release-acceptance','Cache-Control':'no-cache'},signal:AbortSignal.timeout(60000)});
      if(response.ok){const bytes=Buffer.from(await response.arrayBuffer());if(path==='manifest.json'){const value=JSON.parse(bytes.toString('utf8'));passed=value.snapshot===manifest.snapshot;}else passed=byteHash(bytes)===manifest.artifacts.find(item=>item.path===path)?.sha256;if(passed)break;}
      if(attempt<5)await pause(5000);
    }
    if(!passed)throw Error('Public immutable artifact could not be verified: '+path);
  }
}
export async function publicationState(catalog,intent,client){
  validateVersionCatalog(catalog);assertRetainedVersions(catalog,await client.listReleases());
  if(!intent||intent.version===null)return {needsPublish:false};
  if(typeof intent.version!=='string'||!versionPattern.test(intent.version)||!catalog.versions.some(item=>item.version===intent.version))throw Error('Publication intent must name a retained catalogue version.');
  const release=await client.getRelease('v'+intent.version);
  if(release&&!release.draft){const manifest=await verifyPublishedRelease(release,intent.version,client);return {needsPublish:false,version:intent.version,manifest};}
  return {needsPublish:true,version:intent.version};
}
export async function publisherMain(args,env=process.env){
  if(args.some(arg=>arg!=='--check'))throw Error('Supported publisher option: --check');assertPublisherContext(env);
  const catalog=JSON.parse(readFileSync(join(root,'releases/catalog.json'),'utf8')),intent=JSON.parse(readFileSync(join(root,'releases/publish.json'),'utf8'));
  const client=githubReleaseClient(env.BLD8_RELEASE_TOKEN),state=await publicationState(catalog,intent,client);
  if(args.includes('--check')){
    if(!env.GITHUB_OUTPUT)throw Error('Actions output path is missing.');
    if(state.manifest)await publicReleaseAcceptance(state.version,state.manifest);
    appendFileSync(env.GITHUB_OUTPUT,`needsPublish=${state.needsPublish}\n`);console.log(state.needsPublish?'A new immutable source release is requested.':'Retained immutable source versions verified; no upload is needed.');return;
  }
  if(!state.needsPublish){console.log('The source version is already published and verified; nothing was changed.');return;}
  if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==env.GITHUB_SHA||execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim())throw Error('Publication needs the clean reviewed source revision.');
  // Preflight runs on a clean checkout before npm ci; preparation needs build dependencies.
  const {prepareSourceRelease}=await import('./prepare-source-release.mjs');
  const {destination}=prepareSourceRelease({bundle:true,version:state.version,status:'released',sourceRevision:env.GITHUB_SHA}),prepared=readPreparedRelease(destination);
  console.log(`Publishing ${prepared.assets.length} verified artifacts for ${state.version}.`);
  const release=await publishPreparedRelease(prepared,client,{pause:()=>delay(1100),onProgress:progress=>{if(progress.completed%20===0||progress.completed===progress.total)console.log(`Verified ${progress.completed}/${progress.total} assets.`);}});
  const manifest=await verifyPublishedRelease(release,state.version,client);await publicReleaseAcceptance(state.version,manifest);
  console.log(`Immutable BLD8 UI ${state.version} published from ${env.GITHUB_SHA}.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await publisherMain(process.argv.slice(2));}
  catch(error){
    const token=process.env.BLD8_RELEASE_TOKEN;let message=String(error?.message??error);
    if(token)message=message.replaceAll(token,'[redacted]');message=message.slice(0,2000);
    console.error(message);
    if(process.env.GITHUB_ACTIONS==='true')console.error('::error::'+message.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
    process.exitCode=1;
  }
}
