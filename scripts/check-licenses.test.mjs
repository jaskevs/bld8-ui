import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {mitNotice,licenseCode,licenseMetadata,distributionNotices,repositoryRoot,uiNoticeNames,registryOptionalNoticeNames} from './license-policy.mjs';
import {requireNotice,requireCodeNotice,checkDependencyInventory,checkWorkspaceInventory,discoverWorkspaceManifests,checkUpstreamMappings,checkMetadata,checkRegistry,checkStarter,checkReleaseArtifacts} from './check-licenses.mjs';
import {zip,unzip} from './starter-archive.mjs';
import {releaseAssetName,versionAssetUrl} from './release-hosting.mjs';
const root=repositoryRoot,notices=distributionNotices({root}),metadata=()=>licenseMetadata({sourcePaths:['packages/ui/src/sidebar.tsx'],root}),upstream=metadata().provenance.upstream;
const clone=value=>structuredClone(value),bad=/Licence check:/;
const registry=()=>[
  {...metadata(),name:'styles',registryDependencies:[],files:uiNoticeNames.map(name=>({path:'registry/bld8/licenses/'+name,target:'@ui/bld8/licenses/'+name,content:notices['packages/ui/'+name].toString()}))},
  {...metadata(),name:'button',registryDependencies:['https://ui.bld8.dev/r/styles.json'],files:[{path:'registry/bld8/button.tsx',target:'@ui/bld8/button.tsx',content:licenseCode("'use client';\nexport const Button=()=>null;",{standalone:true,root})}]},
];

const registryWithoutOptional=()=>{const items=registry();items[0].files=items[0].files.filter(file=>!registryOptionalNoticeNames.some(name=>file.target.endsWith('/'+name)));return items;};
const optionalRegistry=(notice,specifier,declaredOnly=false)=>{
  const items=registryWithoutOptional();
  items.push({...metadata(),name:'package-owner',dependencies:declaredOnly?[specifier]:[],registryDependencies:['https://ui.bld8.dev/r/styles.json'],files:[
    {path:'registry/bld8/package-owner.ts',target:'@ui/bld8/package-owner.ts',content:licenseCode((declaredOnly?'':"import {example} from '"+specifier+"';\n")+'export const Value=1;',{standalone:true,root})},
    {path:'registry/bld8/licenses/'+notice,target:'@ui/bld8/licenses/'+notice,content:notices['packages/ui/'+notice].toString()}
  ]});
  items.push({...metadata(),name:'consumer',registryDependencies:['https://ui.bld8.dev/r/package-owner.json'],files:[{path:'registry/bld8/consumer.ts',target:'@ui/bld8/consumer.ts',content:licenseCode("export {Value} from './package-owner';",{standalone:true,root})}]});
  return items;
};
const optionalCases=[['EDITOR_LICENSES','@tiptap/core'],['PHONE_LICENSE','libphonenumber-js/max'],['RECURRENCE_LICENSES','@js-temporal/polyfill']];

const starter=()=>({...notices,'package.json':JSON.stringify({license:'MIT'}),'packages/ui/package.json':JSON.stringify({license:'MIT'}),'packages/blocks/package.json':JSON.stringify({license:'MIT'}),'packages/ui/src/index.ts':"export * from './core.js';\n"});
test('canonical MIT requires every word and exact copyright, allowing line wrapping',()=>{
  requireNotice(mitNotice().replaceAll('\n','\r\n'),mitNotice(),'fixture');
  assert.throws(()=>requireNotice(mitNotice().replace('2026 Jaison','2025 Other'),mitNotice(),'fixture'),bad);
  assert.throws(()=>requireNotice(mitNotice().slice(0,-40),mitNotice(),'fixture'),bad);
  assert.throws(()=>requireNotice(undefined,mitNotice(),'fixture'),bad);
});
test('standalone TSX and CSS receive an idempotent complete MIT notice',()=>{
  for(const source of ["'use client';\nexport const View=()=>null;",'.fixture{display:block}']){
    const licensed=licenseCode(source,{standalone:true,root});requireCodeNotice(licensed,'fixture');assert(licensed.endsWith(source));assert.equal(licenseCode(licensed,{standalone:true,root}),licensed);
  }
  assert.throws(()=>requireCodeNotice('/* SPDX-License-Identifier: MIT */\nexport const X=1','fixture'),bad);
});
test('standalone adapted source includes both full notices with portable source paths',()=>{
  const source=licenseCode("'use client';\nexport const Sidebar=()=>null;",{standalone:true,sourcePath:'packages/ui/src/sidebar.tsx',root});
  assert(source.includes('Copyright (c) 2023 shadcn'));assert(source.includes(mitNotice().trim()));
  assert.equal(licenseCode(source,{standalone:true,sourcePath:'packages/ui/src/sidebar.tsx',root}),source);
});
const dependencyFixture=()=>({lock:{packages:{'':{name:'fixture',version:'1.0.0',license:'MIT',workspaces:[]},'node_modules/example':{version:'1.0.0',license:'MIT',integrity:'sha512-reviewed'}}},inventory:{workspaceMetadata:{'':{name:'fixture',version:'1.0.0',license:'MIT'}},dependencies:{'node_modules/example':{version:'1.0.0',license:'MIT',integrity:'sha512-reviewed'}},manifests:{'package.json':{workspaces:[],dependencies:{example:'1.0.0'}}}},manifests:{'package.json':{name:'fixture',version:'1.0.0',license:'MIT',workspaces:[],dependencies:{example:'1.0.0'}}}});
const dependencyCheck=fixture=>checkDependencyInventory(fixture.lock,fixture.inventory,fixture.manifests);
test('reviewed package and declaration fixture passes',()=>dependencyCheck(dependencyFixture()));
for(const key of ['version','license','integrity'])test('changed dependency '+key+' requires review',()=>{const f=dependencyFixture();f.lock.packages['node_modules/example'][key]='changed';assert.throws(()=>dependencyCheck(f),bad);});
test('new direct or transitive locked package is rejected',()=>{const f=dependencyFixture();f.lock.packages['node_modules/new']={version:'1.0.0',license:'MIT'};assert.throws(()=>dependencyCheck(f),/unreviewed dependency/);});
test('new dependency declaration is rejected even before lock changes',()=>{const f=dependencyFixture();f.manifests['package.json'].dependencies.new='1.0.0';assert.throws(()=>dependencyCheck(f),bad);});
test('metadata preserves full notices and exact pinned adaptation ledger',()=>{
  checkMetadata(metadata(),notices,upstream,'fixture');
  const truncated=metadata();truncated.notices[0].content='MIT';assert.throws(()=>checkMetadata(truncated,notices,upstream,'fixture'),bad);
  const drift=metadata();drift.provenance.upstream.revision='0'.repeat(40);assert.throws(()=>checkMetadata(drift,notices,upstream,'fixture'),bad);
});
test('registry dependency closure supplies complete sidecars',()=>{checkRegistry(registry(),notices,upstream);checkRegistry(registryWithoutOptional(),notices,upstream);for(const[notice,specifier]of optionalCases){checkRegistry(optionalRegistry(notice,specifier),notices,upstream);checkRegistry(optionalRegistry(notice,specifier+'@1.0.0',true),notices,upstream);}});
test('registry missing closure sidecar is rejected',()=>{const f=registry();f[0].files=f[0].files.filter(file=>!file.path.endsWith('/SHADCN_LICENSE'));assert.throws(()=>checkRegistry(f,notices,upstream),bad);for(const[notice,specifier]of optionalCases)for(const declaredOnly of[false,true]){const items=optionalRegistry(notice,declaredOnly?specifier+'@1.0.0':specifier,declaredOnly);items.find(item=>item.name==='package-owner').files.pop();assert.throws(()=>checkRegistry(items,notices,upstream),new RegExp(notice));}});
test('registry truncated sidecar is rejected despite filename and SPDX metadata',()=>{const f=registry();f[0].files.find(file=>file.path.endsWith('/LICENSE')).content='MIT License';assert.throws(()=>checkRegistry(f,notices,upstream),bad);for(const[notice,specifier]of optionalCases){const items=optionalRegistry(notice,specifier);items.find(item=>item.name==='package-owner').files.at(-1).content='MIT License';assert.throws(()=>checkRegistry(items,notices,upstream),new RegExp(notice));}});
test('registry adapted source cannot lose full upstream notice',()=>{const f=registry();f[1].files[0].path='registry/bld8/sidebar.tsx';f[1].files[0].target='@ui/bld8/sidebar.tsx';assert.throws(()=>checkRegistry(f,notices,upstream),/shadcn notice/);});
test('actual ZIP round trip preserves complete notices and permits tiny generated barrel',()=>checkStarter(unzip(zip(starter())),{notices,root,themes:false}));
test('ZIP missing root notice is rejected',()=>{const f=starter();delete f.LICENSE;assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),bad);});
test('ZIP mismatched block copyright is rejected',()=>{const f=starter();f['packages/blocks/LICENSE']=mitNotice('Copyright (c) 2025 Someone');assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),bad);});
test('ZIP copied font requires its entire OFL notice',()=>{
  const f=starter();f['src/fonts/manrope.woff2']=readFileSync(join(root,'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'));f['font-licenses/manrope-OFL.txt']=readFileSync(join(root,'node_modules/@fontsource-variable/manrope/LICENSE'));
  checkStarter(unzip(zip(f)),{notices,root,themes:false});f['font-licenses/manrope-OFL.txt']='SIL OPEN FONT LICENSE Version 1.1';assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),bad);
});
test('release artifacts require notice content and review policy artifacts',()=>{
  const f={...notices,'licenses/inventory.json':'{}','scripts/license-policy.mjs':'fixture'};checkReleaseArtifacts(f,{notices});delete f['packages/ui/SHADCN_LICENSE'];assert.throws(()=>checkReleaseArtifacts(f,{notices}),bad);
});

test('ZIP cannot relabel unreviewed font bytes with an approved font name',()=>{const f=starter();f['src/fonts/manrope.woff2']=Buffer.from('different font');assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),/unreviewed font bytes/);});

test('lean UI-only HTTP starter retains its own notices without adding blocks',()=>{const f=starter();for(const path of Object.keys(f).filter(path=>path.startsWith('packages/blocks/')))delete f[path];f['lib/upload-http.ts']='export async function receive(request: Request) { return new Response(await request.text()); }';checkStarter(unzip(zip(f)),{notices,root,themes:false});});
test('starter containing block code cannot omit the blocks licence',()=>{const f=starter();delete f['packages/blocks/LICENSE'];assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),/packages\/blocks\/LICENSE/);});

test('new nested licence assets have safe portable names while retained names stay unchanged',()=>{
  for(const path of [...Object.keys(notices),'BRAND.md','licenses/inventory.json','scripts/license-policy.mjs'])assert.equal(releaseAssetName(path),path.replaceAll('/','--'));
  const catalog={schemaVersion:1,versions:[{version:'0.2.0',tag:'v0.2.0',title:'Retained'}]};
  assert.equal(versionAssetUrl(catalog,'0.2.0','r/button.json'),'https://github.com/jaskevs/bld8-ui/releases/download/v0.2.0/r--button.json');
  for(const path of ['packages/ui/../../secret','packages/ui/private.key','licenses/arbitrary.json','scripts/run.mjs','packages/ui/LICENSE?token=x'])assert.throws(()=>releaseAssetName(path));
});

const workspaceFixture=()=>{const f=dependencyFixture();f.manifests['package.json'].workspaces=['packages/*','apps/*'];f.inventory.manifests['package.json'].workspaces=['packages/*','apps/*'];f.lock.packages[''].workspaces=['packages/*','apps/*'];f.manifests['packages/ui/package.json']={name:'@fixture/ui',version:'1.0.0',license:'MIT'};f.inventory.manifests['packages/ui/package.json']={};f.inventory.workspaceMetadata['packages/ui']={name:'@fixture/ui',version:'1.0.0',license:'MIT'};f.lock.packages['packages/ui']={name:'@fixture/ui',version:'1.0.0',license:'MIT'};f.lock.packages['node_modules/@fixture/ui']={resolved:'packages/ui',link:true};return f;};
test('reviewed workspace metadata, paths, links and declarations pass',()=>dependencyCheck(workspaceFixture()));
test('new tools workspace pattern fails even with empty dependencies and matching link',()=>{const f=workspaceFixture();f.manifests['package.json'].workspaces.push('tools/*');f.lock.packages[''].workspaces.push('tools/*');f.lock.packages['tools/new']={name:'new',version:'1.0.0',license:'MIT'};f.lock.packages['node_modules/new']={resolved:'tools/new',link:true};assert.throws(()=>dependencyCheck(f),/workspace patterns/);});
test('new linked package outside reviewed workspace directories fails',()=>{const f=workspaceFixture();f.lock.packages['tools/new']={name:'new',version:'1.0.0',license:'MIT'};f.lock.packages['node_modules/new']={resolved:'tools/new',link:true};assert.throws(()=>dependencyCheck(f),/workspace paths/);});
test('extra link to an unreviewed package fails without a new workspace row',()=>{const f=workspaceFixture();f.lock.packages['node_modules/new']={resolved:'tools/new',link:true};assert.throws(()=>dependencyCheck(f),/workspace links/);});
test('changed or nested root patterns fail before workspace discovery',()=>{const f=workspaceFixture();f.manifests['package.json'].workspaces=['packages/*/*','apps/*'];assert.throws(()=>dependencyCheck(f),/workspace patterns/);assert.throws(()=>discoverWorkspaceManifests(root,['packages/*/*']),/unsupported workspace patterns/);});
test('lockfile-only workspace pattern changes cannot escape review',()=>{const f=workspaceFixture();f.lock.packages[''].workspaces.push('tools/*');assert.throws(()=>dependencyCheck(f),/workspace patterns/);});
test('workspace licence is required in the manifest and lockfile metadata',()=>{for(const location of ['manifest','lock']){const f=workspaceFixture();delete (location==='manifest'?f.manifests['packages/ui/package.json']:f.lock.packages['packages/ui']).license;assert.throws(()=>dependencyCheck(f),/MIT licence metadata/);}});
test('workspace name or version changes require reviewed metadata',()=>{for(const key of ['name','version']){const f=workspaceFixture();f.manifests['packages/ui/package.json'][key]='changed';assert.throws(()=>dependencyCheck(f),/reviewed metadata/);}});

test('portable upstream mappings distinguish canonical source from installed layouts',()=>checkUpstreamMappings(upstream));
test('incorrect registry relative path and npm source paths are rejected',()=>{for(const kind of ['registry','npm']){const changed=clone(upstream);changed.distributionMappings[kind].files['src/sidebar.tsx']=['src/sidebar.tsx'];assert.throws(()=>checkUpstreamMappings(changed),/path mappings/);}});
test('selected starter adaptation must include every declared source and compiled target',()=>{const f=starter();f['packages/ui/src/sidebar.tsx']='/* SPDX-FileCopyrightText: 2023 shadcn */';assert.throws(()=>checkStarter(unzip(zip(f)),{notices,root,themes:false}),/selected adaptation mapping target missing/);});
