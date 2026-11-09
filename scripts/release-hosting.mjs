import {readFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {join,relative,sep} from 'node:path';
import {validateManifest,byteHash} from './source-release.mjs';

export const releaseRepository='jaskevs/bld8-ui';
export const versionPattern=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const roots=new Set(['manifest.json','CHANGELOG.md','UPDATING.md','LICENSE','check-source-updates.mjs','source-release.mjs','capture-installation.mjs']);
export function releaseAssetName(path){
  if(typeof path!=='string'||!(roots.has(path)||/^(r|sources)\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(path)||/^downloads\/[a-z0-9]+(?:-[a-z0-9]+)*\.zip$/.test(path)))throw Error('Unsupported release asset path.');
  return path.replace('/','--');
}
export function validateVersionCatalog(value){
  if(!value||value.schemaVersion!==1||!Array.isArray(value.versions)||value.versions.length>200)throw Error('Invalid source version catalogue.');
  const seen=new Set();for(const entry of value.versions){if(!entry||typeof entry.version!=='string'||!versionPattern.test(entry.version)||entry.tag!=='v'+entry.version||typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>150||seen.has(entry.version))throw Error('Invalid or repeated source version.');seen.add(entry.version);}
  return value;
}
export function versionAssetUrl(catalog,version,path){
  validateVersionCatalog(catalog);const entry=catalog.versions.find(item=>item.version===version);if(!entry)return null;
  return `https://github.com/${releaseRepository}/releases/download/${entry.tag}/${releaseAssetName(path)}`;
}
export function assertRetainedVersions(catalog,releases){
  validateVersionCatalog(catalog);
  for(const release of releases)if(!release.draft&&release.immutable&&/^v\d+\.\d+\.\d+$/.test(release.tag_name)&&!catalog.versions.some(item=>item.tag===release.tag_name))throw Error('The source catalogue would drop a retained version: '+release.tag_name);
}
export function readPreparedRelease(directory){
  const root=realpathSync(directory);if(!lstatSync(directory).isDirectory()||lstatSync(directory).isSymbolicLink())throw Error('Release candidate must be a regular directory.');
  const manifestPath=join(root,'manifest.json');if(lstatSync(manifestPath).isSymbolicLink()||lstatSync(manifestPath).size>8*1024*1024)throw Error('Invalid release manifest file.');
  const manifest=validateManifest(JSON.parse(readFileSync(manifestPath,'utf8')));
  if(manifest.status!=='released'||!manifest.sourceRevision||!/^[a-f0-9]{40}$/.test(manifest.sourceRevision))throw Error('A frozen source revision is required.');
  const expected=new Set(['manifest.json',...manifest.artifacts.map(item=>item.path)]),seen=new Set(),assets=[];
  const walk=folder=>{for(const name of readdirSync(folder)){const file=join(folder,name),info=lstatSync(file),path=relative(root,file).split(sep).join('/');if(info.isSymbolicLink())throw Error('Release links are not supported.');if(info.isDirectory()){if(![...expected].some(value=>value.startsWith(path+'/')))throw Error('Unexpected release directory.');walk(file);}else{if(!info.isFile()||!expected.has(path)||info.size>16*1024*1024)throw Error('Unexpected release artifact.');const bytes=readFileSync(file),sha256=byteHash(bytes),record=manifest.artifacts.find(item=>item.path===path);if(record&&(record.sha256!==sha256||record.bytes!==bytes.length))throw Error('Release artifact digest mismatch: '+path);seen.add(path);assets.push({path,name:releaseAssetName(path),bytes,sha256});}}};
  walk(root);if(seen.size!==expected.size)throw Error('Incomplete release inventory.');
  if(new Set(assets.map(item=>item.name)).size!==assets.length)throw Error('Colliding release asset names.');
  assets.sort((a,b)=>(a.path==='manifest.json'?-1:b.path==='manifest.json'?1:a.path.localeCompare(b.path)));
  return {manifest,assets};
}

/** All mutations are append-only: no tag moves, asset replacement or release deletion. */
export async function publishPreparedRelease(prepared,client,{pause=()=>Promise.resolve(),onProgress=()=>{}}={}){
  const {manifest,assets}=prepared,tag='v'+manifest.version;
  let release=await client.getRelease(tag);
  if(release&&!release.draft)throw Error('This source version is already published; use verification, never replacement.');
  if(release&&release.body?.includes('<!-- bld8-source:'+manifest.sourceRevision+' -->')!==true)throw Error('An existing draft belongs to another source revision.');
  const existingTag=await client.getTagRevision(tag);if(existingTag&&existingTag!==manifest.sourceRevision)throw Error('The version tag already points to different source.');
  if(!release)release=await client.createDraft({tag_name:tag,target_commitish:manifest.sourceRevision,name:'BLD8 UI '+tag,draft:true,body:`Source: ${manifest.sourceRevision}\n\nFree under MIT. Registry JSON, source manifests, starters and update tools are included.\n\n<!-- bld8-source:${manifest.sourceRevision} -->`});
  const remote=await client.listAssets(release.id),expected=new Map(assets.map(asset=>[asset.name,asset]));
  for(const asset of remote)if(!expected.has(asset.name))throw Error('Unexpected asset already exists in the draft.');
  for(let index=0;index<assets.length;index++){
    const asset=assets[index],found=remote.find(item=>item.name===asset.name);
    if(found){if(found.state!=='uploaded'||found.size!==asset.bytes.length||await client.assetDigest(found)!==asset.sha256)throw Error('Existing draft asset differs; it will not be overwritten: '+asset.name);}
    else{await pause();const uploaded=await client.uploadAsset(release.id,asset);if(uploaded.state!=='uploaded'||uploaded.size!==asset.bytes.length||await client.assetDigest(uploaded)!==asset.sha256)throw Error('Uploaded asset verification failed: '+asset.name);}
    onProgress({completed:index+1,total:assets.length,name:asset.name});
  }
  const checked=await client.listAssets(release.id);if(checked.length!==assets.length||checked.some(asset=>!expected.has(asset.name)))throw Error('Draft inventory changed before publication.');
  for(const asset of checked)if(asset.state!=='uploaded'||asset.size!==expected.get(asset.name).bytes.length||await client.assetDigest(asset)!==expected.get(asset.name).sha256)throw Error('Draft bytes changed before publication.');
  await pause();release=await client.publishDraft(release.id);
  if(release.draft||release.immutable!==true)throw Error('GitHub did not mark the published release immutable. Production must remain gated.');
  if(await client.getTagRevision(tag)!==manifest.sourceRevision)throw Error('Published tag does not match frozen source.');
  return release;
}

export async function verifyPublishedRelease(release,version,client){
  if(release.draft||release.immutable!==true||release.tag_name!=='v'+version)throw Error('Expected an immutable published release.');
  const assets=await client.listAssets(release.id),manifestAsset=assets.find(asset=>asset.name==='manifest.json');if(!manifestAsset)throw Error('Published release lacks its source manifest.');
  const manifest=validateManifest(JSON.parse(Buffer.from(await client.readAsset(manifestAsset)).toString('utf8')));
  if(manifest.status!=='released'||manifest.version!==version||!manifest.sourceRevision||await client.getTagRevision(release.tag_name)!==manifest.sourceRevision)throw Error('Published source identity differs from its tag.');
  const expected=new Map(manifest.artifacts.map(item=>[releaseAssetName(item.path),item]));expected.set('manifest.json',{sha256:byteHash(Buffer.from(await client.readAsset(manifestAsset))),bytes:manifestAsset.size});
  if(assets.length!==expected.size||assets.some(asset=>!expected.has(asset.name)))throw Error('Published inventory differs from its manifest.');
  for(const asset of assets){const record=expected.get(asset.name);if(asset.state!=='uploaded'||asset.size!==record.bytes||await client.assetDigest(asset)!==record.sha256)throw Error('Published asset digest differs: '+asset.name);}
  return manifest;
}
