import {validateManifest} from './source-release.mjs';
import {DOCUMENTATION_ORIGIN,MAX_DOCUMENTATION_CATALOG_BYTES,MAX_DOCUMENTATION_MANIFEST_BYTES,supportsDocumentationVersion,documentationUrl,validateDocumentation} from './documentation-versions.mjs';

// Server-safe transport: no filesystem/cache paths or release-publisher imports.
const versionPattern=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const assetHosts=new Set(['release-assets.githubusercontent.com','objects.githubusercontent.com']);
function selectedVersion(version,versionCatalog){
  if(typeof version!=='string'||version.length>64||!versionPattern.test(version))throw Error('Choose an exact retained documentation version.');
  if(!versionCatalog||versionCatalog.schemaVersion!==1||!Array.isArray(versionCatalog.versions)||versionCatalog.versions.length>200)throw Error('Provide the retained source catalogue for documentation reads.');
  const seen=new Set();
  for(const entry of versionCatalog.versions){
    if(!entry||typeof entry.version!=='string'||entry.version.length>64||!versionPattern.test(entry.version)||entry.tag!=='v'+entry.version||typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>150||seen.has(entry.version))throw Error('Invalid retained documentation version catalogue.');
    seen.add(entry.version);
  }
  if(!seen.has(version))throw Error('Documentation version is not in the retained source catalogue.');
  if(!supportsDocumentationVersion(version))throw Error('This retained source version does not include version-matched documentation.');
}

function redirectAllowed(value,{version,path}){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash)return false;
  if(url.href===documentationUrl(version,path))return true;
  const asset=path.replaceAll('/','--');
  if(url.origin==='https://github.com')return url.pathname===`/jaskevs/bld8-ui/releases/download/v${version}/${asset}`&&!url.search;
  return assetHosts.has(url.hostname)&&url.pathname.startsWith('/github-production-release-asset');
}

function abortable(promise,signal){
  if(signal.aborted)return Promise.reject(Error('Documentation sync timed out.'));
  return new Promise((resolve,reject)=>{
    const abort=()=>reject(Error('Documentation sync timed out.'));
    signal.addEventListener('abort',abort,{once:true});
    Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
  });
}

async function download(version,path,limit,fetchImpl,signal){
  let url=documentationUrl(version,path);
  for(let redirects=0;redirects<=4;redirects++){
    if(!redirectAllowed(url,{version,path}))throw Error('Documentation download leaves its fixed release hosts.');
    const response=await abortable(fetchImpl(url,{method:'GET',redirect:'manual',headers:{Accept:'application/octet-stream','Cache-Control':'no-cache'},signal}),signal);
    if(response.redirected||(response.url&&response.url!==url))throw Error('Documentation fetch followed an unchecked redirect.');
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.get('location');void response.body?.cancel().catch(()=>{});
      if(!location||redirects===4)throw Error('Documentation download exceeds its redirect limit.');
      url=new URL(location,url).href;continue;
    }
    if(response.status===404)throw Error('Version-matched documentation is not published for this source version.');
    if(response.status!==200)throw Error('Documentation download failed: HTTP '+response.status+'.');
    const length=response.headers.get('content-length');
    if(length!==null&&(!/^\d+$/.test(length)||!Number.isSafeInteger(Number(length))||Number(length)>limit)){
      void response.body?.cancel().catch(()=>{});throw Error('Documentation download exceeds its size limit.');
    }
    if(!response.body)throw Error('Documentation download has no body.');
    const reader=response.body.getReader(),chunks=[];let count=0;
    try{
      while(true){
        const {done,value}=await abortable(reader.read(),signal);if(done)break;
        count+=value.byteLength;if(count>limit)throw Error('Documentation download exceeds its size limit.');
        chunks.push(Buffer.from(value));
      }
    }catch(error){void reader.cancel().catch(()=>{});throw error;}
    finally{reader.releaseLock();}
    if(!count)throw Error('Documentation download is empty.');
    return Buffer.concat(chunks,count);
  }
  throw Error('Documentation download exceeds its redirect limit.');
}

/** Exact bytes are exposed only to the separate cache sync operation. No filesystem access occurs here. */
export async function readPublishedDocumentationBytes(version,{fetchImpl=fetch,versionCatalog}={}){
  selectedVersion(version,versionCatalog);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const manifestBytes=await download(version,'manifest.json',MAX_DOCUMENTATION_MANIFEST_BYTES,fetchImpl,controller.signal);
    const manifest=validateManifest(JSON.parse(manifestBytes.toString('utf8')));
    if(manifest.version!==version||manifest.status!=='released'||!/^[a-f0-9]{40}$/.test(manifest.sourceRevision??'')||manifest.registryBase!==`${DOCUMENTATION_ORIGIN}/releases/${version}/r`)throw Error('Downloaded manifest does not identify the selected released source.');
    const record=manifest.artifacts.find(item=>item.path==='docs/catalog.json');
    if(!record||!manifest.artifacts.some(item=>item.path==='documentation.zip'))throw Error('This source manifest has no retained documentation.');
    if(record.bytes<1||record.bytes>MAX_DOCUMENTATION_CATALOG_BYTES)throw Error('Documentation download exceeds its size limit.');
    const catalogBytes=await download(version,'docs/catalog.json',MAX_DOCUMENTATION_CATALOG_BYTES,fetchImpl,controller.signal);
    const catalog=validateDocumentation(manifest,catalogBytes,{version});
    return {manifest,catalog,manifestBytes,catalogBytes};
  }finally{clearTimeout(timer);}
}

/** Fixed public release reads for the human server viewer. No cache reads or writes. */
export async function readPublishedDocumentation(version,options){
  const {manifest,catalog}=await readPublishedDocumentationBytes(version,options);
  return {manifest,catalog};
}
