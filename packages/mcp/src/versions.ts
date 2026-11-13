import {readFileSync} from 'node:fs';
import {readCachedDocumentation} from '../../../scripts/documentation-cache.mjs';
import {supportsDocumentationVersion} from '../../../scripts/documentation-versions.mjs';
import {validateCatalog,type Catalog} from './catalog.js';

export interface DocumentationVersion {version:string;title:string;state:'cached'|'unsupported'|'not-cached'|'invalid-cache';sourceRevision?:string;snapshot?:string}
export interface DocumentationVersions {versions:DocumentationVersion[];catalogs:Map<string,Catalog>}

/** Startup-only local reads. Tool calls select these immutable in-memory objects. */
export function loadDocumentationVersions():DocumentationVersions{
  const source=JSON.parse(readFileSync(new URL('../../../releases/catalog.json',import.meta.url),'utf8'));
  if(source.schemaVersion!==1||!Array.isArray(source.versions)||source.versions.length>200)throw Error('Invalid source version catalogue.');
  const versions:DocumentationVersion[]=[],catalogs=new Map<string,Catalog>();
  for(const item of source.versions){
    if(typeof item.version!=='string'||!/^\d+\.\d+\.\d+$/.test(item.version)||item.tag!=='v'+item.version||typeof item.title!=='string')throw Error('Invalid source version.');
    const record:DocumentationVersion={version:item.version,title:item.title,state:supportsDocumentationVersion(item.version)?'not-cached':'unsupported'};
    if(record.state!=='unsupported')try{
      const cached=readCachedDocumentation(item.version);
      if(cached){const catalog=validateCatalog(cached.catalog);catalogs.set(item.version,catalog);Object.assign(record,{state:'cached',sourceRevision:cached.manifest.sourceRevision,snapshot:catalog.release.snapshot});}
    }catch{record.state='invalid-cache';}
    versions.push(record);
  }
  return {versions,catalogs};
}
