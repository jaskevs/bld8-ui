import {byteHash,validateManifest} from './source-release.mjs';

export const DOCUMENTATION_ORIGIN='https://ui.bld8.dev';
export const MAX_DOCUMENTATION_CATALOG_BYTES=32*1024*1024;
export const MAX_DOCUMENTATION_MANIFEST_BYTES=8*1024*1024;
export const MAX_DOCUMENTATION_ARCHIVE_BYTES=16*1024*1024;
const versionPattern=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const identifier=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function supportsDocumentationVersion(version){
  if(typeof version!=='string'||version.length>64||!versionPattern.test(version))return false;
  const parts=version.split('.').map(Number);if(!parts.every(Number.isSafeInteger))return false;const [major,minor]=parts;return major>0||minor>=4;
}
export function documentationUrl(version,path){
  if(typeof version!=='string'||version.length>64||!versionPattern.test(version)||!['manifest.json','docs/catalog.json','documentation.zip'].includes(path))throw Error('Unsupported documentation version or artifact.');
  return `${DOCUMENTATION_ORIGIN}/releases/${version}/${path}`;
}
/** Manifest items are already canonicalised by createManifest. No artifact hash participates. */
export function documentationSnapshot(manifest){return byteHash(JSON.stringify(manifest.items));}

export function validateDocumentation(manifest,catalogBytes,{version=manifest?.version}={}){
  validateManifest(manifest);
  if(!supportsDocumentationVersion(version))throw Error('This source version does not include retained documentation.');
  if(manifest.version!==version||manifest.status!=='released'||!/^[a-f0-9]{40}$/.test(manifest.sourceRevision??''))throw Error('Retained documentation requires the exact released source identity.');
  const registryBase=`${DOCUMENTATION_ORIGIN}/releases/${version}/r`;
  if(manifest.registryBase!==registryBase)throw Error('Retained documentation registry leaves its fixed version.');
  const bytes=Buffer.from(catalogBytes);
  if(bytes.length>MAX_DOCUMENTATION_CATALOG_BYTES)throw Error('Documentation catalogue exceeds its size limit.');
  const record=manifest.artifacts.find(item=>item.path==='docs/catalog.json');
  const archive=manifest.artifacts.find(item=>item.path==='documentation.zip');
  if(!record||!archive)throw Error('This source manifest has no retained documentation.');
  if(record.bytes!==bytes.length||record.sha256!==byteHash(bytes)||archive.bytes>MAX_DOCUMENTATION_ARCHIVE_BYTES)throw Error('Documentation artifact digest or size differs from the manifest.');
  const catalog=JSON.parse(bytes.toString('utf8'));
  if(catalog?.schemaVersion!==1||catalog.homepage!==DOCUMENTATION_ORIGIN||catalog.release?.version!==version||catalog.release.status!=='released'||catalog.release.sourceRevision!==manifest.sourceRevision||catalog.release.snapshotKind!=='source-graph'||catalog.release.snapshot!==documentationSnapshot(manifest)||catalog.installation?.registryBase!==registryBase)throw Error('Documentation does not match the selected source graph and revision.');
  if(!Array.isArray(catalog.entries)||catalog.entries.length>2000||!Array.isArray(catalog.guides)||catalog.guides.length>100)throw Error('Invalid retained documentation catalogue.');
  const itemNames=new Set(manifest.items.map(item=>item.name));
  const keys=new Set(),examples=new Set(),guides=new Set();
  const registryUrl=name=>`${registryBase}/${name}.json`;
  const viewer=new URL(`${DOCUMENTATION_ORIGIN}/docs/versions/${version}`);
  const checkViewer=value=>{const url=new URL(value);if(url.origin!==viewer.origin||![viewer.pathname,viewer.pathname+'/markdown'].includes(url.pathname)||url.username||url.password||url.hash)throw Error('Documentation link leaves the selected version.');};
  for(const entry of catalog.entries){
    const key=entry.kind+':'+entry.id;
    if(!entry||!['component','block','template'].includes(entry.kind)||typeof entry.id!=='string'||!identifier.test(entry.id)||keys.has(key)||!Array.isArray(entry.api)||entry.api.length>100||!Array.isArray(entry.examples)||entry.examples.length>100)throw Error('Invalid retained documentation entry.');
    keys.add(key);checkViewer(entry.documentationUrl);checkViewer(entry.markdownUrl);
    if(entry.registry){if(!itemNames.has(entry.registry.name)||entry.registry.url!==registryUrl(entry.registry.name)||!Array.isArray(entry.registry.registryDependencies)||entry.registry.registryDependencies.some(url=>{const name=url.startsWith(registryBase+'/')?url.slice(registryBase.length+1).replace(/\.json$/,''):'';return !itemNames.has(name)||url!==registryUrl(name);}))throw Error('Documentation registry metadata leaves the selected version.');}
    for(const example of entry.examples){if(!example||typeof example.id!=='string'||!identifier.test(example.id)||examples.has(example.id)||example.componentId!==entry.id||!itemNames.has(example.registry?.name)||example.registry.url!==registryUrl(example.registry.name))throw Error('Invalid retained example identity.');examples.add(example.id);checkViewer(example.documentationUrl);checkViewer(example.markdownUrl);}
  }
  for(const guide of catalog.guides){if(!guide||typeof guide.id!=='string'||!identifier.test(guide.id)||guides.has(guide.id)||typeof guide.content!=='string'||guide.content.length>200000)throw Error('Invalid retained guide.');guides.add(guide.id);checkViewer(guide.url);checkViewer(guide.markdownUrl);}
  return catalog;
}
