import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createManifest,byteHash,validateManifest} from './source-release.mjs';
import {blocks,templates} from './library-catalog.mjs';
import {distributionNotices} from './license-policy.mjs';
import {checkLicenses} from './check-licenses.mjs';
import {buildAgentCatalog,documentationFiles} from './prepare-agent-docs.mjs';
import {documentationArchive} from './documentation-archive.mjs';
import {documentationSnapshot,supportsDocumentationVersion,MAX_DOCUMENTATION_CATALOG_BYTES} from './documentation-versions.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path));
const json=path=>JSON.parse(read(path).toString('utf8'));
const write=(path,data)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,data);};
function candidateInventory(directory,artifacts){
  const expected=new Set(['manifest.json',...Object.keys(artifacts)]),found=new Set();
  function walk(folder,prefix=''){
    for(const name of readdirSync(folder)){
      const file=join(folder,name),path=prefix+name,info=lstatSync(file);
      if(info.isSymbolicLink())throw Error('Candidate contains a link; it will not be reused.');
      if(info.isDirectory()){if(![...expected].some(value=>value.startsWith(path+'/')))throw Error('Candidate contains an unexpected directory.');walk(file,path+'/');}
      else if(!info.isFile()||!expected.has(path))throw Error('Candidate contains an unexpected file.');
      else found.add(path);
    }
  }
  walk(directory);if(found.size!==expected.size)throw Error('Candidate inventory is incomplete; it will not be overwritten.');
}

export function releaseArtifacts(directory,version,base){
  const catalogue=JSON.parse(readFileSync(join(directory,'r/registry.json'),'utf8'));
  const original=catalogue.homepage.replace(/\/$/,'')+'/r',registryBase=base?base+'/r':original;
  for(const item of catalogue.items){
    const file=join(directory,'r',item.name+'.json');
    if(!/^[a-z0-9-]+$/.test(item.name)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink()||JSON.stringify(JSON.parse(readFileSync(file,'utf8')))!==JSON.stringify(item))throw Error('Registry item differs from its index: '+item.name);
  }
  const items=catalogue.items.map(item=>({...item,registryDependencies:item.registryDependencies.map(url=>{
    if(!url.startsWith(original+'/'))throw Error('Registry dependency leaves its origin.');
    return registryBase+url.slice(original.length);
  })}));
  const artifacts={};
  for(const item of items)artifacts['r/'+item.name+'.json']=Buffer.from(JSON.stringify(item,null,2));
  artifacts['r/registry.json']=Buffer.from(JSON.stringify({...catalogue,items},null,2));
  const entries=[...blocks,...templates];
  const allowed={downloads:new Set([...entries.flatMap(item=>[item.id+'.zip',item.id+'-vite.zip']),'outline-http.zip','react-hook-form.zip','upload-http.zip','data-workspace-http.zip','data-workspace-http-vite.zip']),sources:new Set(entries.map(item=>item.id+'.json'))};
  for(const folder of ['downloads','sources'])for(const filename of [...allowed[folder]].sort()){
    if(!(folder==='downloads'?/^[a-z0-9-]+\.zip$/:/^[a-z0-9-]+\.json$/).test(filename))throw Error('Unexpected release artifact name.');
    const file=join(directory,folder,filename);if(!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())throw Error('Release artifacts must be regular files.');
    let bytes=readFileSync(file);
    if(base&&folder==='sources'){
      const source=JSON.parse(bytes.toString('utf8'));
      if(source.download)source.download=base+source.download;
      if(source.downloads)source.downloads=Object.fromEntries(Object.entries(source.downloads).map(([key,path])=>[key,base+path]));
      bytes=Buffer.from(JSON.stringify(source,null,2));
    }
    artifacts[folder+'/'+filename]=bytes;
  }
  if(existsSync(join(directory,'r/index.json'))){
    const index=JSON.parse(readFileSync(join(directory,'r/index.json'),'utf8'));
    if(base)index.items=index.items.map(item=>({...item,url:base+item.url}));
    artifacts['r/index.json']=Buffer.from(JSON.stringify(index,null,2));
  }
  return {items,registryBase,artifacts};
}

export function prepareSourceRelease({bundle=false,version,status,sourceRevision}={}) {
  const config=json('releases/next.json');
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(config.version)||config.status!=='unreleased'||!Array.isArray(config.changes)||config.changes.some(value=>typeof value!=='string'))throw Error('Expected an unreleased source version and release notes.');
  version??=config.version;status??=config.status;
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)||!['unreleased','released'].includes(status)||status==='released'&&(!bundle||!/^[a-f0-9]{40}$/.test(sourceRevision??'')))throw Error('A released bundle needs a valid version and source revision.');
  const publicDirectory=join(root,'apps/docs/public');
  const catalogue=json('apps/docs/public/r/registry.json');
  const base=bundle?catalogue.homepage.replace(/\/$/,'')+'/releases/'+version:undefined;
  const {items,registryBase,artifacts}=releaseArtifacts(publicDirectory,version,base);
  artifacts['check-source-updates.mjs']=read('scripts/check-source-updates.mjs');
  artifacts['source-release.mjs']=read('scripts/source-release.mjs');
  artifacts['capture-installation.mjs']=read('scripts/capture-installation.mjs');
  artifacts['CHANGELOG.md']=read('CHANGELOG.md');artifacts['UPDATING.md']=read('docs/updating-source.md');artifacts['LICENSE']=read('LICENSE');artifacts['BRAND.md']=read('BRAND.md');
  Object.assign(artifacts,distributionNotices({root}),{'licenses/inventory.json':read('licenses/inventory.json'),'scripts/license-policy.mjs':read('scripts/license-policy.mjs')});
  if(bundle&&supportsDocumentationVersion(version)){
    const source=createManifest({version,status,registryBase,items,artifacts,sourceRevision});
    const catalog=buildAgentCatalog({root,origin:catalogue.homepage,releaseOverride:{version,status,registryBase,snapshotKind:'source-graph',snapshot:documentationSnapshot(source),...(sourceRevision?{sourceRevision}:{})},documentationVersion:version,registryBase});
    const files=documentationFiles(catalog),bytes=Buffer.from(files['catalog.json']);
    if(bytes.length>MAX_DOCUMENTATION_CATALOG_BYTES)throw Error('Frozen documentation catalogue exceeds its size limit.');
    artifacts['docs/catalog.json']=bytes;
    const offline=Object.fromEntries(Object.entries(files).filter(([path])=>path!=='llms-full.txt'));
    offline['README.md']=`# BLD8 UI ${version} documentation\n\nSource status: ${status}. Source revision: ${sourceRevision??'not frozen'}.\nSource-graph snapshot: ${catalog.release.snapshot}.\n\nThe source manifest covers catalog.json and documentation.zip by exact byte digests. The catalogue snapshot identifies canonical source items, avoiding a circular artifact hash. This archive includes the exact public APIs, complete source examples, guides, notices and a Markdown index. It contains no retained runtime or interactive preview. Links to unversioned live demos show the current website.\n`;
    artifacts['documentation.zip']=documentationArchive(offline);
  }
  // Validate freshly generated portable copies before hashing. Agent documents
  // are produced afterwards because they identify this resulting snapshot.
  checkLicenses({root,generated:true,includeAgent:false,checkManifest:false,releaseArtifacts:artifacts});
  const manifest=createManifest({version,status,registryBase,items,artifacts,sourceRevision});
  if(bundle){
    const parent=join(root,'.local/release-candidates');mkdirSync(parent,{recursive:true});
    if(lstatSync(parent).isSymbolicLink()||!realpathSync(parent).startsWith(realpathSync(root)+sep))throw Error('Unexpected release output directory.');
    const destination=resolve(parent,version+'-'+manifest.snapshot.slice(0,16));
    if(!destination.startsWith(resolve(parent)+sep))throw Error('Unexpected release output path.');
    if(existsSync(destination)){
      if(!lstatSync(destination).isDirectory()||lstatSync(destination).isSymbolicLink())throw Error('Existing release output must be a regular directory.');
      candidateInventory(destination,artifacts);
      const existing=validateManifest(JSON.parse(readFileSync(join(destination,'manifest.json'),'utf8')));
      if(existing.snapshot!==manifest.snapshot||JSON.stringify(existing)!==JSON.stringify(manifest))throw Error('Existing candidate differs; it will not be overwritten.');
      for(const [path,bytes] of Object.entries(artifacts)){
        const file=join(destination,path);
        if(!existsSync(file)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink()||!realpathSync(file).startsWith(realpathSync(destination)+sep)||byteHash(readFileSync(file))!==byteHash(bytes))throw Error('Existing candidate artifact differs; it will not be overwritten: '+path);
      }
    }else{
      mkdirSync(destination);
      for(const [path,bytes] of Object.entries(artifacts))write(join(destination,path),bytes);
      write(join(destination,'manifest.json'),JSON.stringify(manifest,null,2));
    }
    console.log('Prepared '+status+' source bundle: '+destination);
    console.log('Registry URLs are reserved for '+base+'. Nothing has been uploaded.');
    return {manifest,destination};
  }
  write(join(publicDirectory,'releases/current.json'),JSON.stringify(manifest,null,2));
  for(const name of ['check-source-updates.mjs','source-release.mjs','capture-installation.mjs'])write(join(publicDirectory,'releases',name),artifacts[name]);
  write(join(root,'apps/docs/src/lib/generated/release.ts'),`// Prepared from the source registry and release notes.\nexport const sourceRelease = ${JSON.stringify({...config,snapshot:manifest.snapshot,items:items.length,downloads:manifest.artifacts.filter(item=>item.path.startsWith('downloads/')).length},null,2)} as const;\n`);
  console.log(`Prepared ${config.version} source manifest (${items.length} items; unreleased).`);
  return {manifest};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
  if(process.argv.slice(2).some(flag=>flag!=='--bundle'))throw Error('Supported option: --bundle');
  prepareSourceRelease({bundle:process.argv.includes('--bundle')});
}catch(error){console.error(error.message);process.exitCode=1;}}
