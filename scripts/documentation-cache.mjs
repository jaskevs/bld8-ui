import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync,lstatSync,realpathSync,renameSync,unlinkSync,rmdirSync} from 'node:fs';
import {join,resolve,parse,sep,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {byteHash,validateManifest} from './source-release.mjs';
import {validateVersionCatalog} from './release-hosting.mjs';
import {MAX_DOCUMENTATION_CATALOG_BYTES,MAX_DOCUMENTATION_MANIFEST_BYTES,supportsDocumentationVersion,validateDocumentation} from './documentation-versions.mjs';
import {readPublishedDocumentationBytes} from './documentation-transport.mjs';
export {readPublishedDocumentation} from './documentation-transport.mjs';

export const DEFAULT_DOCUMENTATION_CACHE_ROOT=fileURLToPath(new URL('../.local/documentation-cache/',import.meta.url));
const versionPattern=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const cacheFiles=['catalog.json','manifest.json'];
const samePath=(a,b)=>process.platform==='win32'?a.toLowerCase()===b.toLowerCase():a===b;

function selectedVersion(version,versionCatalog){
  if(typeof version!=='string'||version.length>64||!versionPattern.test(version))throw Error('Choose an exact retained documentation version.');
  const catalog=validateVersionCatalog(versionCatalog??JSON.parse(readFileSync(new URL('../releases/catalog.json',import.meta.url),'utf8')));
  if(!catalog.versions.some(entry=>entry.version===version))throw Error('Documentation version is not in the retained source catalogue.');
  if(!supportsDocumentationVersion(version))throw Error('This retained source version does not include version-matched documentation.');
  return catalog;
}

/** Reject links at every existing ancestor, including Windows directory junctions. */
function checkedDirectory(directory,{optional=false}={}){
  const absolute=resolve(directory),root=parse(absolute).root;
  let current=root;
  for(const segment of absolute.slice(root.length).split(sep).filter(Boolean)){
    current=join(current,segment);
    let info;try{info=lstatSync(current);}catch(error){if(error.code==='ENOENT'&&optional)return null;throw error;}
    if(info.isSymbolicLink()||!info.isDirectory())throw Error('Documentation cache directories must be regular directories without links.');
  }
  const actual=realpathSync(absolute);
  if(!samePath(actual,absolute))throw Error('Documentation cache directory leaves its configured path.');
  return actual;
}

function boundedFile(directory,name,limit){
  const file=join(directory,name),info=lstatSync(file);
  if(info.isSymbolicLink()||!info.isFile()||info.size<1||info.size>limit||!samePath(realpathSync(file),resolve(file)))throw Error('Documentation cache files must be bounded regular files without links.');
  const bytes=readFileSync(file);
  if(bytes.length<1||bytes.length>limit)throw Error('Documentation cache file exceeds its size limit.');
  return bytes;
}

function readDirectory(directory,version){
  const actual=checkedDirectory(directory),names=readdirSync(actual).sort();
  if(JSON.stringify(names)!==JSON.stringify(cacheFiles))throw Error('Documentation cache version has an unexpected inventory.');
  const manifestBytes=boundedFile(actual,'manifest.json',MAX_DOCUMENTATION_MANIFEST_BYTES);
  const catalogBytes=boundedFile(actual,'catalog.json',MAX_DOCUMENTATION_CATALOG_BYTES);
  const manifest=validateManifest(JSON.parse(manifestBytes.toString('utf8')));
  const catalog=validateDocumentation(manifest,catalogBytes,{version});
  return {manifest,catalog,manifestBytes,catalogBytes};
}

/** A tool cannot supply a path: only allowlisted versions under the configured cache are read. */
export function readCachedDocumentation(version,{cacheRoot=DEFAULT_DOCUMENTATION_CACHE_ROOT,versionCatalog}={}){
  selectedVersion(version,versionCatalog);
  const root=checkedDirectory(cacheRoot,{optional:true});
  if(!root)return null;
  const directory=join(root,version);
  try{lstatSync(directory);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  const {manifest,catalog}=readDirectory(directory,version);
  return {manifest,catalog};
}

function createCacheRoot(cacheRoot){
  checkedDirectory(cacheRoot,{optional:true});
  mkdirSync(resolve(cacheRoot),{recursive:true,mode:0o700});
  return checkedDirectory(cacheRoot);
}

function removeOwnedStage(stage,root){
  if(!stage||!resolve(stage).startsWith(resolve(root)+sep)||!basename(stage).startsWith('.staging-'))return;
  let info;try{info=lstatSync(stage);}catch(error){if(error.code==='ENOENT')return;throw error;}
  if(info.isSymbolicLink()||!info.isDirectory()||!samePath(realpathSync(stage),resolve(stage)))return;
  const names=readdirSync(stage);
  if(names.some(name=>!cacheFiles.includes(name)))return;
  for(const name of names){const file=join(stage,name),details=lstatSync(file);if(details.isSymbolicLink()||!details.isFile())return;}
  for(const name of names)unlinkSync(join(stage,name));
  rmdirSync(stage);
}

/** Separate opt-in network operation. MCP handlers only call the cached reader above. */
export async function syncDocumentation(version,{fetchImpl=fetch,cacheRoot=DEFAULT_DOCUMENTATION_CACHE_ROOT,versionCatalog}={}){
  const selectedCatalog=selectedVersion(version,versionCatalog);
  // An invalid existing cache is an error, never an instruction to replace it.
  readCachedDocumentation(version,{cacheRoot,versionCatalog:selectedCatalog});
  const {manifest,catalog,manifestBytes,catalogBytes}=await readPublishedDocumentationBytes(version,{fetchImpl,versionCatalog:selectedCatalog});
  const root=createCacheRoot(cacheRoot),directory=join(root,version),lock=join(root,'.lock-'+version);
  try{mkdirSync(lock,{mode:0o700});}catch(error){if(error.code==='EEXIST')throw Error('Documentation sync for this version is already in progress.');throw error;}
  let stage;
  try{
    checkedDirectory(lock);
    let exists=false;try{lstatSync(directory);exists=true;}catch(error){if(error.code!=='ENOENT')throw error;}
    if(exists){
      const existing=readDirectory(directory,version);
      if(byteHash(existing.manifestBytes)!==byteHash(manifestBytes)||byteHash(existing.catalogBytes)!==byteHash(catalogBytes))throw Error('Cached documentation differs; the existing version was not overwritten.');
      return {manifest:existing.manifest,catalog:existing.catalog,cached:true};
    }
    stage=mkdtempSync(join(root,'.staging-'+version+'-'));
    checkedDirectory(stage);
    writeFileSync(join(stage,'manifest.json'),manifestBytes,{flag:'wx',mode:0o600});
    writeFileSync(join(stage,'catalog.json'),catalogBytes,{flag:'wx',mode:0o600});
    readDirectory(stage,version);
    // No overwrite path is used. Cooperating writers use the exclusive lock.
    try{lstatSync(directory);throw Error('Documentation cache destination appeared during sync.');}catch(error){if(error.code!=='ENOENT')throw error;}
    renameSync(stage,directory);stage=undefined;
    return {manifest,catalog,cached:false};
  }finally{
    removeOwnedStage(stage,root);
    if(!lstatSync(lock).isSymbolicLink()&&samePath(realpathSync(lock),resolve(lock)))rmdirSync(lock);
  }
}
