import {createHash} from 'node:crypto';

export const sourceHash = value => createHash('sha256').update(Buffer.from(value).toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
export const byteHash = value => createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(Array.isArray(value) ? value.map(value=>JSON.parse(canonical(value))) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])) : value);
export const manifestHash = manifest => byteHash(canonical(Object.fromEntries(Object.entries(manifest).filter(([key])=>key!=='snapshot'))));
const namePattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const validPath = value => typeof value==='string' && value.length<=240 && /^(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/.test(value) && value.split('/').every(part=>part!=='.'&&part!=='..');
const fail = message => {throw Error('Invalid source manifest: '+message);};

export function validateManifest(value) {
  if(!value || value.schemaVersion!==1 || typeof value.version!=='string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value.version) || !['unreleased','released'].includes(value.status))fail('version');
  if(typeof value.registryBase!=='string'||!/^https:\/\/[^\s?#]+$/.test(value.registryBase))fail('registry URL');
  if(!Array.isArray(value.items)||!value.items.length||value.items.length>1000||!Array.isArray(value.artifacts)||value.artifacts.length>2000)fail('catalogue size');
  const names=new Set(),paths=new Map(),hash=/^[a-f0-9]{64}$/;
  for(const item of value.items){
    if(!item||typeof item.name!=='string'||!namePattern.test(item.name)||names.has(item.name))fail('item name');names.add(item.name);
    if(!Array.isArray(item.dependencies)||item.dependencies.length>100||item.dependencies.some(dependency=>typeof dependency!=='string'||dependency.length>200)||!Array.isArray(item.registryDependencies)||item.registryDependencies.length>100||item.registryDependencies.some(name=>typeof name!=='string'||!namePattern.test(name))||!Array.isArray(item.files)||item.files.length>100)fail('item fields');
    if(new Set(item.registryDependencies).size!==item.registryDependencies.length)fail('duplicate dependency');
    const ownPaths=new Set();
    for(const file of item.files){
      if(!file||!validPath(file.path)||!file.path.startsWith('bld8/')||!hash.test(file.sha256)||ownPaths.has(file.path))fail('source path or digest');ownPaths.add(file.path);
      if(paths.has(file.path)&&paths.get(file.path)!==file.sha256)fail('conflicting source target');paths.set(file.path,file.sha256);
    }
  }
  for(const item of value.items)if(item.registryDependencies.some(name=>!names.has(name)))fail('missing dependency');
  const artifacts=new Set();
  for(const artifact of value.artifacts){
    if(!artifact||!validPath(artifact.path)||artifacts.has(artifact.path)||!hash.test(artifact.sha256)||!Number.isSafeInteger(artifact.bytes)||artifact.bytes<0)fail('artifact');artifacts.add(artifact.path);
  }
  if(!hash.test(value.snapshot)||manifestHash(value)!==value.snapshot)fail('snapshot digest');
  return value;
}

export function createManifest({version,status='unreleased',registryBase,items,artifacts}) {
  const manifest={schemaVersion:1,version,status,registryBase,
    items:items.map(item=>({name:item.name,dependencies:[...item.dependencies??[]].sort(),registryDependencies:(item.registryDependencies??[]).map(url=>{
      if(!url.startsWith(registryBase+'/'))throw Error('Registry dependency leaves release: '+item.name);
      return url.slice(registryBase.length+1).replace(/\.json$/,'');
    }).sort(),files:(item.files??[]).map(file=>{
      if(!file.target?.startsWith('@ui/'))throw Error('Unexpected registry target: '+item.name);
      return {path:file.target.slice(4),sha256:sourceHash(file.content)};
    }).sort((a,b)=>a.path.localeCompare(b.path))})).sort((a,b)=>a.name.localeCompare(b.name)),
    artifacts:Object.entries(artifacts).map(([path,bytes])=>({path,sha256:byteHash(bytes),bytes:Buffer.byteLength(bytes)})).sort((a,b)=>a.path.localeCompare(b.path))};
  manifest.snapshot=manifestHash(manifest);return validateManifest(manifest);
}

export function selectedSource(manifest,selected) {
  const items=new Map(manifest.items.map(item=>[item.name,item])),seen=new Set(),files=new Map(),dependencies=new Set();
  function visit(name){if(seen.has(name))return;const item=items.get(name);if(!item)return;seen.add(name);for(const dependency of item.registryDependencies)visit(dependency);for(const file of item.files)files.set(file.path,file.sha256);for(const dependency of item.dependencies)dependencies.add(dependency);}
  selected.forEach(visit);return {items:seen,files,dependencies};
}

/** Local reads are supplied by the CLI; this planner never changes source. */
export function planUpdate(from,to,selected,readLocal) {
  validateManifest(from);validateManifest(to);
  if(!selected.length||selected.some(name=>!from.items.some(item=>item.name===name)&&!to.items.some(item=>item.name===name)))throw Error('Choose an item present in either source manifest.');
  const before=selectedSource(from,selected),after=selectedSource(to,selected),files=[];
  for(const path of [...new Set([...before.files.keys(),...after.files.keys()])].sort()){
    const previous=before.files.get(path),next=after.files.get(path),local=readLocal?readLocal(path):undefined;
    let status;
    if(!readLocal)status=previous===next?'unchanged':!previous?'added':!next?'removed':'changed';
    else if(local===next&&next)status='current';
    else if(!previous)status=local===null?'add':'collision';
    else if(!next)status=local===null?'already-absent':local===previous?'removal-review':'removal-conflict';
    else if(local===null)status='missing';
    else if(previous===next)status='local-only';
    else status=local===previous?'update-available':'conflict';
    files.push({path,status,previous:previous??null,next:next??null,...(readLocal?{local}: {})});
  }
  const dependencies={added:[...after.dependencies].filter(value=>!before.dependencies.has(value)).sort(),removed:[...before.dependencies].filter(value=>!after.dependencies.has(value)).sort()};
  return {schemaVersion:1,from:{version:from.version,snapshot:from.snapshot},to:{version:to.version,snapshot:to.snapshot},items:selected,mode:readLocal?'local-source':'catalogue',files,dependencies,reviewRequired:files.some(file=>!['unchanged','current','local-only','already-absent'].includes(file.status))||dependencies.added.length>0||dependencies.removed.length>0};
}
