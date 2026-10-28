import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import { blocks, templates } from './library-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const origin = (process.env.BLD8_REGISTRY_URL || 'https://ui.bld8.dev').replace(/\/$/, '');
const directory = join(root, 'apps/docs/public/r');
mkdirSync(directory, {recursive:true});
const items = [];
const url = name => `${origin}/r/${name}.json`;
const file = (path, content, target, type = 'registry:ui') => ({path, content, target, type});
function add(name, title, files, dependencies = [], registryDependencies = [], type = 'registry:ui') {
  const item = {$schema:'https://ui.shadcn.com/schema/registry-item.json', name, type, title, description:title + ' with editable BLD8 source.', author:'Jaison (https://bld8.dev)', dependencies, registryDependencies:registryDependencies.map(url), files, docs:'React 19 is required. Source is installed inside your configured UI directory under bld8/. Styles are imported by the components. Wrap overlays in UIProvider from bld8/overlays and set body { position: relative; }. Keep the included licences. Compiled utilities cover the shipped components; use ordinary CSS or your own Tailwind build for new utility classes.'};
  if (name.startsWith('bld8-')) delete item.docs;
  items.push(item);
  writeFileSync(join(directory, `${name}.json`), JSON.stringify(item, null, 2));
}
add('bld8-styles', 'BLD8 styles and licences', [
  ...['styles.css','tokens.css','tailwind.css'].map(name => file('registry/bld8/'+name, read('packages/ui/dist/'+name), '@ui/bld8/'+name, 'registry:file')),
  ...['LICENSE','LUCIDE_LICENSE','DAY_PICKER_LICENSE','SHADCN_LICENSE','MOTION_LICENSE','DND_KIT_LICENSE','THIRD_PARTY_NOTICES.md'].map(name => file('registry/bld8/licenses/'+name, read('packages/ui/'+name), '@ui/bld8/licenses/'+name, 'registry:file')),
]);
const uiPackage=JSON.parse(read('packages/ui/package.json'));
const dependencies = {...uiPackage.dependencies,'react-hook-form':uiPackage.devDependencies['react-hook-form']};
for (const [kind,folder] of [['ui','packages/ui/src'],['block','packages/blocks/src']]) {
  for (const name of readdirSync(join(root,folder)).filter(name => /\.tsx?$/.test(name))) {
    const key = basename(name).replace(/\.tsx?$/, '');
    const source = read(folder+'/'+name);
    const local = [...source.matchAll(/(?:from\s+|import\s*)['"]\.\/([^'"]+)\.js['"]/g)].map(match => `bld8-${kind === 'block' ? 'block-' : ''}${match[1]}`);
    const external = Object.entries(dependencies).filter(([dependency]) => source.includes(`'${dependency}'`) || source.includes(`'${dependency}/`)).map(([dependency,version]) => `${dependency}@${version}`);
    let content = source.replace(/(['"])\.\/([^'"]+)\.js\1/g, "'./$2'").replace(/(['"])@bld8\/ui\1/g, "'../index'").replace(/(['"])@bld8\/ui\/filter-query\1/g, "'../filter-query'").replace(/(['"])@bld8\/ui\/time-options\1/g, "'../time-options'");
    if (name.endsWith('.tsx')) content = content.replace(/(['"])use client\1;/, "$&\nimport './styles.css';");
    const subdirectory = kind === 'block' ? 'blocks/' : '';
    if (kind === 'block' && source.includes('@bld8/ui')) local.push('bld8-index');
    if (kind === 'block' && source.includes('@bld8/ui/filter-query')) local.push('bld8-filter-query');
    if (kind === 'block' && source.includes('@bld8/ui/time-options')) local.push('bld8-time-options');
    if (kind === 'block') local.push('bld8-block-styles');
    add(`bld8-${kind === 'block' ? 'block-' : ''}${key}`, `BLD8 ${key} source`, [file('registry/bld8/'+subdirectory+name, content, '@ui/bld8/'+subdirectory+name)], external, [...new Set(['bld8-styles',...local])]);
  }
}
add('bld8-block-styles', 'BLD8 block styles', [file('registry/bld8/blocks/styles.css', read('packages/blocks/src/styles.css'), '@ui/bld8/blocks/styles.css','registry:file')],[],['bld8-styles']);
const groups = {
  core:['button','icon-button','input','textarea','checkbox','switch','radio','slider','badge','alert','progress','loading','empty','avatar','card','breadcrumb','pagination','input-group'],
  controls:['select','combobox','tabs','accordion'], overlays:['dialog','sheet','popover','tooltip','dropdown','toast'],
  'data-table':['table','advanced-table'], calendar:['calendar','date-picker','date-range'], icons:['icon'],
  'number-field':['number-field'], 'time-options':['time-options'], 'time-picker':['time-picker'], stepper:['stepper'], kanban:['kanban'], 'kanban-state':['kanban-state'], 'filter-builder':['filter-builder'], 'filter-query':['filter-query'], timeline:['timeline'], 'multi-select':['multi-select'], command:['command'], 'file-upload':['file-upload'], drawer:['drawer'], 'context-menu':['context-menu'], sidebar:['sidebar'], form:['form'], 'editable-cell':['editable-cell'], 'react-hook-form':['react-hook-form'],
};
for (const [module,names] of Object.entries(groups)) {
  if (!items.some(item => item.name === `bld8-${module}`)) continue;
  for (const name of names) add(name, `BLD8 ${name}`, [file(`registry/bld8/${name}.tsx`, `'use client';\nexport * from './${module}';\n`, `@ui/bld8/${name}.tsx`)],[],[`bld8-${module}`]);
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
let rhfExample=read('examples/react-hook-form/project-form.tsx')
  .replaceAll("'@bld8/ui/react-hook-form'", "'../react-hook-form'")
  .replaceAll("'@bld8/ui'", "'../index'")
  .replaceAll("'@bld8/blocks/outline-repository'", "'../blocks/outline-repository'")
  .replaceAll("'@bld8/blocks'", "'../blocks/outline-http-demo'");
add('react-hook-form-example','React Hook Form example',[file('registry/bld8/examples/react-hook-form-example.tsx',rhfExample,'@ui/bld8/examples/react-hook-form-example.tsx')],['react-hook-form@7.90.0'],['bld8-index','bld8-react-hook-form','bld8-block-outline-http-demo','bld8-block-outline-repository'],'registry:block');
const registry = {$schema:'https://ui.shadcn.com/schema/registry.json', name:'bld8', homepage:origin, items};
writeFileSync(join(directory,'registry.json'),JSON.stringify(registry,null,2));
console.log(`Prepared ${items.length} shadcn registry items at ${origin}/r.`);
