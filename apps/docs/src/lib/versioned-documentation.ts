import {lstat,readFile,realpath} from 'node:fs/promises';
import {join,relative,isAbsolute} from 'node:path';
import {readPublishedDocumentation} from '../../../../scripts/documentation-transport.mjs';
import {MAX_DOCUMENTATION_CATALOG_BYTES,supportsDocumentationVersion} from '../../../../scripts/documentation-versions.mjs';
import type {AgentCatalog} from '../../../../scripts/prepare-agent-docs.mjs';
import {sourceVersions} from './source-versions';

const retained=new Map<string,{catalog:AgentCatalog;manifestSnapshot:string}>();
const pending=new Map<string,Promise<{catalog:AgentCatalog;manifestSnapshot:string}>>();
export function hasDocumentationVersion(version:string){return version==='development'||sourceVersions.some(item=>item.version===version);}
export async function versionedDocumentation(version:string){
  if(version==='development'){
    // Only the generated catalogue is deployed through explicit tracing includes.
    // Keep runtime symlink checks without tracing arbitrary realpath targets.
    for(const folder of [join(process.cwd(),'public'),join(process.cwd(),'apps/docs/public')])try{
      const file=join(folder,'agent/catalog.json'),[root,path,info]=await Promise.all([realpath(/*turbopackIgnore: true*/ folder),realpath(/*turbopackIgnore: true*/ file),lstat(file)]),inside=relative(root,path);
      if(info.isSymbolicLink()||!info.isFile()||info.size>MAX_DOCUMENTATION_CATALOG_BYTES||inside.startsWith('..')||isAbsolute(inside))throw Error('Invalid development catalogue.');
      const catalog=JSON.parse(await readFile(file,'utf8')) as AgentCatalog;
      if(catalog.schemaVersion!==1||catalog.release.status!=='unreleased'||!Array.isArray(catalog.entries))throw Error('Invalid development catalogue.');
      return {catalog,manifestSnapshot:catalog.release.snapshot,preview:true};
    }catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    throw Error('Development catalogue has not been built.');
  }
  if(!hasDocumentationVersion(version)||!supportsDocumentationVersion(version))throw Error('This source version did not include retained documentation.');
  let result=retained.get(version);
  if(!result){
    let operation=pending.get(version);
    if(!operation){
      if(pending.size>=3)throw Error('Documentation verification is busy.');
      operation=readPublishedDocumentation(version,{versionCatalog:{schemaVersion:1,versions:sourceVersions}}).then(({manifest,catalog})=>{const value={catalog:catalog as AgentCatalog,manifestSnapshot:manifest.snapshot};if(retained.size>=2)retained.delete(retained.keys().next().value!);retained.set(version,value);return value;}).finally(()=>pending.delete(version));
      pending.set(version,operation);
    }
    result=await operation;
  }
  return {...result,preview:false};
}
