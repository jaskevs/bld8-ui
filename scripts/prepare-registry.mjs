import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import { blocks, templates } from './library-catalog.mjs';
import { createSourceGraph } from './source-graph.mjs';
import {licenseCode,licenseMetadata} from './license-policy.mjs';
import {readComponentExamples} from './prepare-component-examples.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const graph = createSourceGraph(root);
const origin = (process.env.BLD8_REGISTRY_URL || 'https://ui.bld8.dev').replace(/\/$/, '');
const directory = join(root, 'apps/docs/public/r');
mkdirSync(directory, {recursive:true});
const items = [];
const url = name => `${origin}/r/${name}.json`;
const file = (path, content, target, type = 'registry:ui') => ({path, content, target, type});
function add(name, title, files, dependencies = [], registryDependencies = [], type = 'registry:ui') {
  const item = {...licenseMetadata({sourcePaths:files.map(file=>file.path.replace('registry/bld8/examples/react-hook-form-example.tsx','examples/react-hook-form/project-form.tsx').replace('registry/bld8/blocks/LICENSE','packages/blocks/LICENSE').replace('registry/bld8/blocks/','packages/blocks/src/').replace('registry/bld8/licenses/','packages/ui/').replace('registry/bld8/','packages/ui/src/')),root}), $schema:'https://ui.shadcn.com/schema/registry-item.json', name, type, title, description:title + ' with editable BLD8 source.', author:'Jaison (https://bld8.dev)', dependencies, registryDependencies:registryDependencies.map(url), files, docs:'React 19 is required. Source is installed inside your configured UI directory under bld8/. Styles are imported by the components. Wrap overlays in UIProvider from bld8/overlays and set body { position: relative; }. Keep the included licences. Compiled utilities cover the shipped components; use ordinary CSS or your own Tailwind build for new utility classes.'};
  if (name.startsWith('bld8-')) delete item.docs;
  items.push(item);
  writeFileSync(join(directory, `${name}.json`), JSON.stringify(item, null, 2));
}
add('bld8-styles', 'BLD8 styles and licences', [
  ...['styles.css','tokens.css','tailwind.css'].map(name => file('registry/bld8/'+name, licenseCode(read('packages/ui/dist/'+name),{standalone:true,sourcePath:'packages/ui/src/'+name,root}), '@ui/bld8/'+name, 'registry:file')),
  ...['LICENSE','LUCIDE_LICENSE','DAY_PICKER_LICENSE','SHADCN_LICENSE','MOTION_LICENSE','DND_KIT_LICENSE','THIRD_PARTY_NOTICES.md','UPSTREAM.json'].map(name => file('registry/bld8/licenses/'+name, read('packages/ui/'+name), '@ui/bld8/licenses/'+name, 'registry:file')),
]);
const uiPackage=JSON.parse(read('packages/ui/package.json'));
const dependencies = {...uiPackage.dependencies,'react-hook-form':uiPackage.devDependencies['react-hook-form']};
for (const [kind,folder] of [['ui','packages/ui/src'],['block','packages/blocks/src']]) {
  for (const name of readdirSync(join(root,folder)).filter(name => /\.tsx?$/.test(name))) {
    const key = basename(name).replace(/\.tsx?$/, '');
    const source = read(folder+'/'+name);
    const local = [...source.matchAll(/(?:from\s+|import\s*)['"]\.\/([^'"]+)\.js['"]/g)].map(match => `bld8-${kind === 'block' ? 'block-' : ''}${match[1]}`);
    const external = Object.entries(dependencies).filter(([dependency]) => source.includes(`'${dependency}'`) || source.includes(`'${dependency}/`)).map(([dependency,version]) => `${dependency}@${version}`);
    const rewritten = kind === 'block' ? graph.rewriteUiImports(source) : {source,modules:[]};
    let content = rewritten.source.replace(/(['"])\.\/([^'"]+)\.js\1/g, "'./$2'");
    for (const module of rewritten.modules) local.push('bld8-'+module);
    if (name.endsWith('.tsx')) content = content.replace(/(['"])use client\1;/, "$&\nimport './styles.css';");
    const subdirectory = kind === 'block' ? 'blocks/' : '';
    if (kind === 'block') local.push('bld8-block-styles');
    add(`bld8-${kind === 'block' ? 'block-' : ''}${key}`, `BLD8 ${key} source`, [file('registry/bld8/'+subdirectory+name, licenseCode(content,{standalone:true,sourcePath:folder+'/'+name,root}), '@ui/bld8/'+subdirectory+name)], external, [...new Set(['bld8-styles',...local])]);
  }
}
add('bld8-block-styles', 'BLD8 block styles', [file('registry/bld8/blocks/LICENSE',read('packages/blocks/LICENSE'),'@ui/bld8/blocks/LICENSE','registry:file'),file('registry/bld8/blocks/styles.css', licenseCode(read('packages/blocks/src/styles.css'),{standalone:true,sourcePath:'packages/blocks/src/styles.css',root}), '@ui/bld8/blocks/styles.css','registry:file')],[],['bld8-styles']);
const groups = {
  'faceted-filter':['faceted-filter'],fieldset:['fieldset'],'checkbox-group':['checkbox-group'],
  autocomplete:['autocomplete'], toolbar:['toolbar'], 'alert-dialog':['alert-dialog'], 'navigation-menu':['navigation-menu'], 'preview-card':['preview-card'],
  'toggle-group':['toggle-group'], 'tag-input':['tag-input'], 'range-slider':['range-slider'], 'otp-input':['otp-input'],
  'data-workspace-state':['data-workspace-state'], 'data-grid-state':['data-grid-state'], 'data-grid':['data-grid'], 'table-query':['table-query'],
  'upload-state':['upload-state'], 'upload-http':['upload-http'], 'upload-queue':['upload-queue'],
  'calendar-state':['calendar-state'], 'event-calendar':['event-calendar'],
  'cascader-state':['cascader-state'], cascader:['cascader'],
  'async-options':['async-options'], 'use-async-options':['use-async-options'], 'async-combobox':['async-combobox'], 'async-multi-select':['async-multi-select'],
  'day-agenda':['day-agenda'], 'schedule-state':['schedule-state'],
  'windowed-table':['windowed-table'], 'table-grouping':['table-grouping'], 'table-view-state':['table-view-state'], 'sortable-data-table':['sortable-table'],
  chart:['chart'], reveal:['reveal'],
  tree:['tree'], 'tree-select':['tree-select'],
  core:['button','icon-button','input','textarea','checkbox','switch','radio','slider','badge','alert','progress','loading','empty','avatar','card','breadcrumb','pagination','input-group'],
  controls:['select','combobox','tabs','accordion'], overlays:['dialog','sheet','popover','tooltip','dropdown','toast'],
  'data-table':['table','advanced-table'], calendar:['calendar','date-picker','date-range'], icons:['icon'],
  'theme-config':['theme-config'], 'number-field':['number-field'], 'time-options':['time-options'], 'time-picker':['time-picker'], stepper:['stepper'], kanban:['kanban'], 'kanban-state':['kanban-state'], 'filter-builder':['filter-builder'], 'filter-query':['filter-query'], timeline:['timeline'], 'multi-select':['multi-select'], command:['command'], 'file-upload':['file-upload'], drawer:['drawer'], 'context-menu':['context-menu'], sidebar:['sidebar'], form:['form'], 'editable-cell':['editable-cell'], 'react-hook-form':['react-hook-form'],
};
for (const [module,names] of Object.entries(groups)) {
  if (!items.some(item => item.name === `bld8-${module}`)) continue;
  for (const name of names) add(name, `BLD8 ${name}`, [file(`registry/bld8/${name}.tsx`, licenseCode(`'use client';\nexport * from './${module}';\n`,{standalone:true,sourcePath:'packages/ui/src/'+module+'.tsx',root}), `@ui/bld8/${name}.tsx`)],[],[`bld8-${module}`]);
}
// A public item with the same module name already owns that file; avoid a
// self-reexport overwriting the actual implementation during installation.
for (const [module,names] of Object.entries(groups)) for (const name of names) {
  if (name !== module) continue;
  const item = items.find(item => item.name === name);
  if (item) {item.files=[];writeFileSync(join(directory,`${name}.json`),JSON.stringify(item,null,2));}
}
for (const entry of [...blocks,...templates]) {
  add(entry.id, entry.name, [], [], ['bld8-block-'+entry.file.replace(/\.tsx$/, '')], 'registry:block');
}
add('outline-http','Outline HTTP adapter',[],[],['bld8-block-outline-http'],'registry:lib');
const rhfImports=graph.rewriteUiImports(read('examples/react-hook-form/project-form.tsx'));
let rhfExample=rhfImports.source
  .replaceAll("'@bld8/ui/react-hook-form'", "'../react-hook-form'")
  .replaceAll("'@bld8/ui'", "'../index'")
  .replaceAll("'@bld8/blocks/outline-repository'", "'../blocks/outline-repository'")
  .replaceAll("'@bld8/blocks'", "'../blocks/outline-http-demo'");
add('react-hook-form-example','React Hook Form example',[file('registry/bld8/examples/react-hook-form-example.tsx',licenseCode(rhfExample,{standalone:true,sourcePath:'examples/react-hook-form/project-form.tsx',root}),'@ui/bld8/examples/react-hook-form-example.tsx')],['react-hook-form@7.90.0'],[...rhfImports.modules].map(module=>'bld8-'+module).concat(['bld8-block-outline-http-demo','bld8-block-outline-repository']),'registry:block');
// Complete examples already use relative imports. Deliver their files verbatim:
// the CLI UI transformer drops leading licence comments when rewriting modules.
for(const example of readComponentExamples(root)) {
  const rewritten=graph.rewriteUiImports(example.source,'../');
  add(example.registryName,example.title,[file('registry/bld8/examples/'+example.id+'.tsx',rewritten.source,'@ui/bld8/examples/'+example.id+'.tsx','registry:file')],[],[...rewritten.modules].map(module=>'bld8-'+module),'registry:block');
  const item=items.at(-1);
  Object.assign(item,{description:example.description,provenance:example.provenance,notices:example.notices});
  item.docs='Complete React client module. Import its '+example.exportName+' export from your configured UI directory under bld8/examples/'+example.id+'.tsx. Keep included notices; use UIProvider from bld8/overlays when the example includes toast or overlay workflows. Documentation: '+origin+example.documentationPath;
}
// Keep provenance tied to real authorities, including dependency modules behind
// tiny public re-export items and composition-only block entries.
const byName=new Map(items.map(item=>[item.name,item]));
function sourcePaths(item,seen=new Set()) {
  if(seen.has(item.name))return [];seen.add(item.name);
  return [...new Set([...item.provenance.sourcePaths.filter(path=>existsSync(join(root,path))),...item.registryDependencies.flatMap(dependency=>{const entry=byName.get(dependency.split('/').at(-1).replace(/\.json$/,''));return entry?sourcePaths(entry,seen):[];})])].sort();
}
for(const item of items) {
  item.provenance.sourcePaths=sourcePaths(item);
  if(item.provenance.upstream.files.some(file=>item.provenance.sourcePaths.includes('packages/ui/'+file.adaptedIn)))item.author='Jaison (https://bld8.dev); includes source adapted from shadcn/ui (MIT, see notices)';
  writeFileSync(join(directory,item.name+'.json'),JSON.stringify(item,null,2));
}
const registry = {$schema:'https://ui.shadcn.com/schema/registry.json', name:'bld8', homepage:origin, items};
writeFileSync(join(directory,'registry.json'),JSON.stringify(registry,null,2));
console.log(`Prepared ${items.length} shadcn registry items at ${origin}/r.`);
