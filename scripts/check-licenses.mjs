import ts from 'typescript';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {repositoryRoot,mitNotice,normalizeNotice,hasFullNotice,uiNoticeNames,distributionNotices,licenseCode,registryBaseNoticeNames,registryNoticeNamesForPackages} from './license-policy.mjs';
import {unzip,themeStarter} from './starter-archive.mjs';
import {blocks,templates} from './library-catalog.mjs';
import {readExportLiteral} from './literal-data.mjs';
import {validateManifest} from './source-release.mjs';

const fail=message=>{throw Error('Licence check: '+message);};
const text=value=>Buffer.from(value??'').toString('utf8');
const canonical=value=>JSON.stringify(Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])):value);
export const noticeDigest=value=>createHash('sha256').update(normalizeNotice(value)).digest('hex');
const same=(actual,expected,label)=>{if(canonical(actual)!==canonical(expected))fail(label+' differs from reviewed policy');};
export function requireNotice(actual,expected,label){if(actual===undefined||normalizeNotice(actual)!==normalizeNotice(expected))fail(label+' is missing, truncated or changed');}
export function requireCodeNotice(source,label){if(!hasFullNotice(text(source),mitNotice()))fail(label+' omits the complete Jaison MIT notice');}
function paths(root,directory){return readdirSync(join(root,directory),{withFileTypes:true}).flatMap(item=>item.isDirectory()?paths(root,directory+'/'+item.name):[directory+'/'+item.name]);}

/** Only the reviewed top-level directory/* patterns are supported; new patterns need policy review. */
export function discoverWorkspaceManifests(root,patterns){
  if(!Array.isArray(patterns)||new Set(patterns).size!==patterns.length||patterns.some(pattern=>typeof pattern!=='string'||!/^[a-zA-Z0-9_-]+\/\*$/.test(pattern)))fail('unsupported workspace patterns; review workspace discovery policy');
  return ['package.json',...patterns.flatMap(pattern=>{
    const folder=pattern.slice(0,-2);
    return readdirSync(join(root,folder),{withFileTypes:true}).filter(item=>item.isDirectory()&&existsSync(join(root,folder,item.name,'package.json'))).map(item=>folder+'/'+item.name+'/package.json');
  })];
}
export function checkWorkspaceInventory(lock,inventory,manifests){
  same(Object.keys(manifests).sort(),Object.keys(inventory.manifests).sort(),'workspace package inventory');
  const reviewedPatterns=inventory.manifests['package.json'].workspaces;
  same(manifests['package.json'].workspaces,reviewedPatterns,'root workspace patterns');
  same(lock.packages[''].workspaces,reviewedPatterns,'lockfile workspace patterns');
  const expectedPaths=Object.keys(manifests).map(path=>path==='package.json'?'':path.replace('/package.json','')).sort();
  const lockedPaths=Object.keys(lock.packages).filter(path=>!path.split('/').includes('node_modules')).sort();
  same(lockedPaths,expectedPaths,'lockfile workspace paths');
  same(Object.keys(inventory.workspaceMetadata).sort(),expectedPaths,'reviewed workspace metadata inventory');
  const expectedLinks={};
  for(const [path,pkg] of Object.entries(manifests)){
    const workspace=path==='package.json'?'':path.replace('/package.json',''),locked=lock.packages[workspace];
    for(const [label,value] of [[path,pkg],['lockfile '+path,locked]]){
      if(typeof value.name!=='string'||typeof value.version!=='string'||value.license!=='MIT')fail(label+' must include package name, version and MIT licence metadata');
      same({name:value.name,version:value.version,license:value.license},inventory.workspaceMetadata[workspace],label+' reviewed metadata');
    }
    if(workspace)expectedLinks['node_modules/'+pkg.name]={resolved:workspace,link:true};
  }
  const actualLinks=Object.fromEntries(Object.entries(lock.packages).filter(([,pkg])=>pkg.link).map(([path,pkg])=>[path,{resolved:pkg.resolved,link:pkg.link}]));
  same(actualLinks,expectedLinks,'lockfile workspace links');
}
export function checkDependencyInventory(lock,inventory,manifests){
  checkWorkspaceInventory(lock,inventory,manifests);
  const dependencies=Object.fromEntries(Object.entries(lock.packages).filter(([path,pkg])=>path.includes('node_modules/')&&!pkg.link).map(([path,pkg])=>[path,{version:pkg.version,license:pkg.license,integrity:pkg.integrity}]));
  for(const [path,pkg] of Object.entries(dependencies)){
    if(!inventory.dependencies[path])fail('unreviewed dependency '+path+'@'+pkg.version);
    same(pkg,inventory.dependencies[path],'dependency '+path);
    if(!pkg.license)fail('dependency has no reviewed licence: '+path);
  }
  same(Object.keys(dependencies).sort(),Object.keys(inventory.dependencies).sort(),'locked dependency inventory');
  for(const [path,pkg] of Object.entries(manifests)){
    if(pkg.license!=='MIT')fail(path+' must declare MIT');
    const declarations=Object.fromEntries(['workspaces','dependencies','devDependencies','peerDependencies','optionalDependencies'].filter(key=>pkg[key]).map(key=>[key,pkg[key]]));
    same(declarations,inventory.manifests[path],path+' dependencies');
    const workspace=path==='package.json'?'':path.replace('/package.json','');
    if(lock.packages[workspace]?.license!=='MIT')fail('lockfile '+path+' must declare MIT');
  }
}

/** Canonical adaptation authorities map to each distribution's real layout. */
export function checkUpstreamMappings(upstream){
  if(typeof upstream.sourcePathScope!=='string'||!upstream.sourcePathScope.trim())fail('upstream canonical source path scope missing');
  const names=upstream.files.map(file=>file.adaptedIn),expected={starter:{},npm:{},registry:{}};
  for(const path of names){
    if(!/^src\/[a-z0-9-]+\.tsx?$/.test(path))fail('unsupported canonical adaptation path '+path);
    const module=path.slice(4).replace(/\.tsx?$/,'');
    expected.starter[path]=[path,'dist/'+module+'.js','dist/'+module+'.d.ts'];
    expected.npm[path]=['dist/'+module+'.js','dist/'+module+'.d.ts'];
    expected.registry[path]=['../'+path.slice(4)];
  }
  same(Object.keys(upstream.distributionMappings??{}).sort(),Object.keys(expected).sort(),'upstream distribution mapping inventory');
  for(const [kind,files] of Object.entries(expected)){
    const mapping=upstream.distributionMappings[kind];
    if(mapping.relativeTo!=='directory containing UPSTREAM.json'||typeof mapping.notes!=='string'||!mapping.notes.trim())fail('upstream '+kind+' mapping scope missing');
    same(mapping.files,files,'upstream '+kind+' path mappings');
  }
}
export function checkMetadata(value,notices,upstream,label){
  if(value?.license!=='MIT'||value.provenance?.repository!=='https://github.com/jaskevs/bld8-ui'||!Array.isArray(value.provenance?.sourcePaths)||!Array.isArray(value.notices))fail(label+' is missing licence/provenance metadata');
  same(value.provenance.upstream,upstream,label+' upstream provenance');
  for(const [path,content] of Object.entries(notices).filter(([path])=>!path.endsWith('.json'))){
    const matches=value.notices.filter(notice=>notice.path===path);
    if(matches.length!==1)fail(label+' requires one full notice '+path);
    requireNotice(matches[0].content,content,label+' '+path);
  }
}

export function checkRegistry(items,notices,upstream){
  checkUpstreamMappings(upstream);
  const byName=new Map(items.map(item=>[item.name,item]));
  if(byName.size!==items.length||!items.length)fail('registry item inventory is empty or duplicated');
  const expected=new Map(uiNoticeNames.map(name=>['@ui/bld8/licenses/'+name,notices['packages/ui/'+name]]));
  const importCache=new Map();
  const packageImports=file=>{
    if(!/\.(?:tsx?|jsx?|mjs)$/.test(file.path))return [];
    if(importCache.has(file.content))return importCache.get(file.content);
    const packages=new Set(),tree=ts.createSourceFile(file.path,text(file.content),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const visit=node=>{
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))packages.add(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))packages.add(node.arguments[0].text);
      ts.forEachChild(node,visit);
    };visit(tree);const result=[...packages];importCache.set(file.content,result);return result;
  };
  for(const item of items){
    checkMetadata(item,notices,upstream,'registry '+item.name);
    for(const file of item.files??[]){
      if(/\.(?:tsx?|css)$/.test(file.path))requireCodeNotice(file.content,'registry '+item.name+' '+file.path);
      const original=expected.get(file.target);
      if(original!==undefined)requireNotice(file.content,original,'registry '+file.target);
      if(file.target==='@ui/bld8/blocks/LICENSE')requireNotice(file.content,notices['packages/blocks/LICENSE'],'registry blocks LICENSE');
      const adapted=upstream.files.find(entry=>'@ui/bld8/'+entry.adaptedIn.replace(/^src\//,'')===file.target);
      if(adapted&&!hasFullNotice(file.content,notices['packages/ui/SHADCN_LICENSE']))fail('adapted registry source loses shadcn notice: '+file.target);
    }
    const seen=new Set(),files=new Map(),packages=new Set();
    function visit(name){
      if(seen.has(name))return;seen.add(name);
      const current=byName.get(name);if(!current)fail('missing registry dependency '+name);
      for(const dependency of current.dependencies??[])packages.add(dependency);
      for(const dep of current.registryDependencies??[]){const match=/\/r\/([a-z0-9-]+)\.json$/.exec(dep);if(!match)fail('unexpected registry dependency URL '+dep);visit(match[1]);}
      for(const file of current.files??[]){for(const specifier of packageImports(file))packages.add(specifier);if(files.has(file.target)&&files.get(file.target)!==file.content)fail('conflicting registry file '+file.target);files.set(file.target,file.content);}
    }
    visit(item.name);
    for(const notice of [...registryBaseNoticeNames,...registryNoticeNamesForPackages(packages)]){const target='@ui/bld8/licenses/'+notice;requireNotice(files.get(target),expected.get(target),item.name+' dependency closure '+target);}
    if([...files.keys()].some(path=>path.startsWith('@ui/bld8/blocks/')&&!path.endsWith('/LICENSE')))requireNotice(files.get('@ui/bld8/blocks/LICENSE'),notices['packages/blocks/LICENSE'],item.name+' blocks dependency closure');
  }
}

/** Validate the actual archive bytes, including specialised HTTP starters. */
export function checkStarter(files,{notices,root,label='starter',themes=true}){
  const hasBlocks=Object.keys(files).some(path=>path.startsWith('packages/blocks/'));
  for(const [path,content] of Object.entries(notices)){if(path==='packages/blocks/LICENSE'&&!hasBlocks)continue;requireNotice(files[path],content,label+' '+path);}
  for(const path of ['package.json','packages/ui/package.json',...(hasBlocks?['packages/blocks/package.json']:[])]){
    let pkg;try{pkg=JSON.parse(text(files[path]));}catch{fail(label+' missing package metadata '+path);}
    if(pkg.license!=='MIT')fail(label+' '+path+' must declare MIT');
  }
  for(const [path,bytes] of Object.entries(files))if(path.endsWith('.woff2')){
    const font=/\/(dm-sans|manrope)\.woff2$/.exec(path)?.[1];if(!font)fail(label+' unreviewed font '+path);
    if(!Buffer.from(bytes).equals(readFileSync(join(root,'node_modules/@fontsource-variable/'+font+'/files/'+font+'-latin-wght-normal.woff2'))))fail(label+' unreviewed font bytes '+path);
    requireNotice(files['font-licenses/'+font+'-OFL.txt'],readFileSync(join(root,'node_modules/@fontsource-variable/'+font+'/LICENSE')),label+' '+font+' full OFL notice');
  }
  const portableUpstream=JSON.parse(text(files['packages/ui/UPSTREAM.json']));checkUpstreamMappings(portableUpstream);
  for(const targets of Object.values(portableUpstream.distributionMappings.starter.files)){
    const selected=targets.map(path=>'packages/ui/'+path);
    if(selected.some(path=>files[path]))for(const path of selected)if(!files[path])fail(label+' selected adaptation mapping target missing '+path);
  }
  // Package files (including tiny generated barrels and HTTP code) inherit their complete
  // package/root sidecars. No size heuristic or arbitrary source regex defines substantiality.
  for(const entry of JSON.parse(text(files['packages/ui/UPSTREAM.json'])).files){
    const path='packages/ui/'+entry.adaptedIn;
    if(files[path]&&!text(files[path]).includes('SPDX-FileCopyrightText: 2023 shadcn')&&!text(files[path]).includes('Copyright (c) 2023 shadcn'))fail(label+' adapted source attribution '+path);
  }
  if(themes){
    const framework=files['app/layout.tsx']?'nextjs':'vite';
    for(const typography of ['standard','geometric','system'])for(const mode of ['light','dark']){
      const themed=themeStarter(files,{framework,config:{typography},mode,css:'/* theme transformation licence fixture */',serialized:JSON.stringify({typography})});
      checkStarter(themed,{notices,root,label:label+' '+typography+'/'+mode,themes:false});
    }
  }
}

export function checkReleaseArtifacts(artifacts,{notices}){
  for(const [path,content] of Object.entries(notices))requireNotice(artifacts[path],content,'release artifact '+path);
  for(const path of ['licenses/inventory.json','scripts/license-policy.mjs'])if(!artifacts[path])fail('release artifact '+path+' is missing');
}

export function checkLicenses({root=repositoryRoot,generated=true,includeAgent=true,checkManifest=true,releaseArtifacts}={}){
  const read=path=>readFileSync(join(root,path),'utf8'),json=path=>JSON.parse(read(path));
  const inventory=json('licenses/inventory.json');if(inventory.schemaVersion!==1)fail('inventory schema');
  for(const path of inventory.ownership.noticePaths)requireNotice(read(path),mitNotice(),path);
  for(const notice of inventory.notices)if(noticeDigest(read(notice.path))!==notice.normalizedSha256)fail(notice.path+' differs from reviewed complete notice');
  const upstream=json('packages/ui/UPSTREAM.json'),notices=distributionNotices({root});
  checkUpstreamMappings(upstream);
  same(upstream,inventory.adaptations,'portable upstream ledger');
  const historical=json('docs/upstream.json');
  same({repository:historical.repository,revision:historical.revision,files:historical.files.map(file=>({...file,adaptedIn:file.adaptedIn.replace(/^packages\/ui\//,'')}))},{repository:upstream.repository,revision:upstream.revision,files:upstream.files},'repository/portable upstream ledgers');
  same(json('package.json').workspaces,inventory.manifests['package.json'].workspaces,'root workspace patterns');
  const manifestPaths=discoverWorkspaceManifests(root,inventory.manifests['package.json'].workspaces);
  same(manifestPaths.sort(),Object.keys(inventory.manifests).sort(),'workspace package inventory');
  checkDependencyInventory(json('package-lock.json'),inventory,Object.fromEntries(Object.keys(inventory.manifests).map(path=>[path,json(path)])));
  const ui=json('packages/ui/package.json');for(const name of uiNoticeNames)if(!ui.files.includes(name))fail('UI package omits '+name);
  for(const folder of ['packages/ui/src','packages/blocks/src','examples'])for(const path of paths(root,folder).filter(path=>/\.(tsx?|css)$/.test(path))){
    const source=read(path);if(!source.slice(0,400).includes('SPDX-License-Identifier: MIT')||!source.slice(0,400).includes('SPDX-FileCopyrightText: 2026 Jaison'))fail('source attribution missing '+path);
  }
  for(const file of upstream.files)if(!read('packages/ui/'+file.adaptedIn).slice(0,700).includes('SPDX-FileCopyrightText: 2023 shadcn'))fail('upstream attribution missing '+file.adaptedIn);
  if(generated){
    const directory='apps/docs/public',registry=json(directory+'/r/registry.json');
    same(readdirSync(join(root,directory,'r')).filter(name=>name.endsWith('.json')&&!['registry.json','index.json'].includes(name)).sort(),registry.items.map(item=>item.name+'.json').sort(),'actual exported registry inventory');
    same(readdirSync(join(root,directory,'sources')).filter(name=>name.endsWith('.json')).sort(),[...blocks,...templates].map(item=>item.id+'.json').sort(),'actual source manifest inventory');
    for(const item of registry.items)same(json(directory+'/r/'+item.name+'.json'),item,'registry index '+item.name);
    checkRegistry(registry.items,notices,upstream);
    const expectedDownloads=[...[...blocks,...templates].flatMap(item=>[item.id+'.zip',item.id+'-vite.zip']),'outline-http.zip','react-hook-form.zip','upload-http.zip','data-workspace-http.zip','data-workspace-http-vite.zip'];
    same(readdirSync(join(root,directory,'downloads')).filter(name=>name.endsWith('.zip')).sort(),expectedDownloads.sort(),'actual starter ZIP inventory');
    for(const name of expectedDownloads)checkStarter(unzip(readFileSync(join(root,directory,'downloads',name))),{notices,root,label:name});
    for(const entry of [...blocks,...templates]){
      const source=json(directory+'/sources/'+entry.id+'.json');checkMetadata(source,notices,upstream,'source '+entry.id);
      for(const [path,content] of Object.entries(notices))requireNotice(source.files.find(file=>file.path===path)?.content,content,'source '+entry.id+' '+path);
      for(const file of source.files)if(/\.(tsx?|css)$/.test(file.path))requireCodeNotice(file.content,'source '+entry.id+' '+file.path);
    }
    const humanSources=readExportLiteral(read('apps/docs/src/lib/generated/sources.ts'),'sources');
    for(const [id,source] of Object.entries(humanSources)){requireCodeNotice(source.component,'human source '+id);requireCodeNotice(source.styles,'human styles '+id);}
    const sourceBanner=readExportLiteral(read('apps/docs/src/lib/generated/source-notice.ts'),'sourceNoticeBanner');
    requireNotice(sourceBanner,licenseCode('',{standalone:true,root}),'browser copied-source canonical banner');
    const workflows=readExportLiteral(read('apps/docs/src/lib/generated/playground-workflows.ts'),'workflowSources');
    for(const [name,source] of Object.entries(workflows))requireCodeNotice(source,'playground workflow '+name);
    const examples=readExportLiteral(read('apps/docs/src/lib/generated/component-examples-data.ts'),'componentExamples');
    for(const example of examples){checkMetadata(example,notices,upstream,'human example '+example.id);requireCodeNotice(example.source,'human example '+example.id);requireCodeNotice(example.registrySource,'human registry example '+example.id);}
    const iconDirectory=join(root,directory,'icon-assets'),iconNames=readdirSync(iconDirectory),iconLicense=read('packages/ui/LUCIDE_LICENSE');
    requireNotice(readFileSync(join(iconDirectory,'LICENSE.txt')),iconLicense,'SVG licence sidecar');
    if(!iconNames.some(name=>name.endsWith('.svg')))fail('no generated SVG icons');
    for(const name of iconNames.filter(name=>name.endsWith('.svg')))if(!hasFullNotice(readFileSync(join(iconDirectory,name)),iconLicense.replaceAll('--','—')))fail('SVG '+name+' loses full Lucide/Feather notices');
    if(includeAgent){
      const catalog=json(directory+'/agent/catalog.json');checkMetadata(catalog,notices,upstream,'agent catalog');
      for(const entry of catalog.entries){checkMetadata(entry,notices,upstream,'agent '+entry.id);checkMetadata(entry.example,notices,upstream,'agent snippet '+entry.id);requireCodeNotice(entry.example.code,'agent snippet '+entry.id);for(const example of entry.examples??[]){checkMetadata(example,notices,upstream,'agent example '+example.id);requireCodeNotice(example.code,'agent example '+example.id);requireCodeNotice(example.registryCode,'agent registry example '+example.id);}}
    }
    if(includeAgent)for(const guide of json(directory+'/agent/catalog.json').guides)checkMetadata(guide,notices,upstream,'agent guide '+guide.id);
    if(checkManifest){
      const manifest=validateManifest(json(directory+'/releases/current.json')),artifacts=new Map(manifest.artifacts.map(artifact=>[artifact.path,artifact]));
      for(const [path,content] of Object.entries({...notices,'licenses/inventory.json':read('licenses/inventory.json'),'scripts/license-policy.mjs':read('scripts/license-policy.mjs')})){
        const artifact=artifacts.get(path);if(!artifact||artifact.sha256!==createHash('sha256').update(content).digest('hex')||artifact.bytes!==Buffer.byteLength(content))fail('source manifest licence artifact '+path+' missing or stale');
      }
    }
  }
  if(releaseArtifacts){checkReleaseArtifacts(releaseArtifacts,{notices});requireNotice(releaseArtifacts['licenses/inventory.json'],read('licenses/inventory.json'),'release inventory');requireNotice(releaseArtifacts['scripts/license-policy.mjs'],read('scripts/license-policy.mjs'),'release policy');}
  return {dependencies:Object.keys(inventory.dependencies).length,notices:inventory.notices.length,generated};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
  if(process.argv.slice(2).some(flag=>flag!=='--source-only'))fail('supported option: --source-only');
  const report=checkLicenses({generated:!process.argv.includes('--source-only')});console.log(`Licence integrity passed: ${report.dependencies} reviewed dependencies, ${report.notices} complete notices${report.generated?', registry closures, all starter ZIPs/themes/fonts, SVGs, source/agent payloads and release manifest':''}.`);
}catch(error){console.error(error.message);process.exitCode=1;}}
