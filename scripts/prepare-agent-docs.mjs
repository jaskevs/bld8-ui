import {documentationFiles,licenseMarkdown} from './documentation-renderer.mjs';
export {entryMarkdown,exampleMarkdown,documentationFiles} from './documentation-renderer.mjs';
import ts from 'typescript';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, posix, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {blocks, templates} from './library-catalog.mjs';
import {readComponentExamples} from './prepare-component-examples.mjs';
import {licenseCode,licenseMetadata} from './license-policy.mjs';
import {supportsDocumentationVersion} from './documentation-versions.mjs';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const guideFiles = [
  ['recurrence','Finite timezone-aware recurrence and explicit edit scopes','docs/recurrence.md'],
  ['gantt','Civil-date Gantt tasks and dependency proposals','docs/gantt.md'],
  ['resource-scheduler','Resource scheduling and revision-checked proposals','docs/resource-scheduler.md'],
  ['visual-collection','Accessible visual components and native scrolling','docs/visual-collection.md'],
  ['input-pack','Color, phone and rating form contracts','docs/input-pack.md'],
  ['import-wizard','Reviewed CSV imports and host-owned batch saves','docs/import-wizard.md'],
  ['rich-text','Structured editing and async mentions','docs/rich-text.md'],
  ['advanced-data','Virtualised, hierarchical and summarised data workflows','docs/advanced-data.md'],
  ['scoped-interface-contracts','Scoped themes, portals and interface preferences','docs/scoped-interface-contracts.md'],
  ['resource-workspace','Reusable resources, attachments and recovery','docs/resource-workspace.md'],
  ['motion-and-charts','Composed motion and chart workflows','docs/motion-and-charts.md'],
  ['licensing','MIT licensing, copyright and upstream notices','docs/licensing.md'],
  ['core-components','Core controls and complete examples','docs/core-components.md'],
  ['data-workspace', 'Typed batch editing and durable data workflows', 'docs/data-workspace.md'],
  ['upload-workflows', 'Per-file upload and HTTP acknowledgement', 'docs/upload-workflows.md'],
  ['calendar-workflows', 'Week and month event workflows', 'docs/calendar-workflows.md'],
  ['cascader', 'Hierarchical selection and remote paths', 'docs/cascader.md'],
  ['agents', 'Use BLD8 with a coding agent', 'docs/agents.md'],
  ['mcp', 'Local read-only MCP discovery', 'docs/mcp.md'],
  ['registry', 'Source installation', 'docs/registry.md'],
  ['updating-source', 'Source versions and local updates', 'docs/updating-source.md'],
  ['large-tables', 'Tables and bounded datasets', 'docs/large-tables.md'],
  ['async-selection', 'Remote option loading and selected values', 'docs/async-selection.md'],
  ['nested-filters', 'Nested filters and query migration', 'docs/nested-filters.md'],
  ['table-views', 'Table ordering and reusable views', 'docs/table-views.md'],
  ['charts-and-analytics', 'Charts and reporting workflows', 'docs/charts-and-analytics.md'],
  ['workflow-integrations', 'Forms, tables and service adapters', 'docs/workflow-integrations.md'],
  ['design-and-motion', 'Design and motion', 'docs/design-and-motion.md'],
  ['theme-lab', 'Themes and starter downloads', 'docs/theme-lab.md'],
];
const read = (root, path) => readFileSync(join(root, path), 'utf8');

// Read only literal catalogue data. Importing a TypeScript module here would also
// execute unrelated code added to that module in a later change.
export {readExportLiteral} from './literal-data.mjs';
import {readExportLiteral} from './literal-data.mjs';

function blockApi(root) {
  const configPath = join(root, 'packages/blocks/tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw Error('Cannot read the block TypeScript configuration.');
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  const program = ts.createProgram(parsed.fileNames, {...parsed.options, noEmit:true});
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(join(root, 'packages/blocks/src/index.ts'));
  const module = source && checker.getSymbolAtLocation(source);
  if (!module) throw Error('Cannot read the public block exports.');
  const symbols = new Map(checker.getExportsOfModule(module).map(symbol => [symbol.name, symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol]));
  return name => {
    const symbol = symbols.get(name);
    const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    if (!symbol || !declaration) throw Error(`Missing public block export: ${name}`);
    const value = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const call = value.getCallSignatures()[0];
    if (!call) throw Error(`Block export is not callable: ${name}`);
    const parameter = call.getParameters()[0];
    const type = parameter && checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? declaration);
    const defaults = {};
    const binding = declaration.parameters?.[0]?.name;
    if (binding && ts.isObjectBindingPattern(binding)) for (const element of binding.elements) {
      if (element.initializer) defaults[element.propertyName?.getText() ?? element.name.getText()] = element.initializer.getText();
    }
    const properties = type ? checker.getPropertiesOfType(type).map(property => {
      const location = property.valueDeclaration ?? property.declarations?.[0] ?? declaration;
      return {
        name:property.name,
        type:checker.typeToString(checker.getTypeOfSymbolAtLocation(property, location), location, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),
        required:!(property.flags & ts.SymbolFlags.Optional),
        defaultValue:defaults[property.name] ?? '—',
        description:ts.displayPartsToString(property.getDocumentationComment(checker)),
        native:location.getSourceFile().fileName.replaceAll('\\', '/').includes('/@types/react/'),
      };
    }).sort((a, b) => Number(a.native) - Number(b.native) || Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)) : [];
    return [{name, kind:'Component props', properties}];
  };
}

function originFor(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Documentation origin must be an HTTP(S) origin without credentials or a path.');
  return url.origin;
}

function publicGuide(content, file) {
  // Repository-relative guide links remain usable from the public Markdown copy.
  return content.replace(/\]\(([^)\s]+)\)/g, (whole, href) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) return whole;
    const path = posix.normalize(posix.join(posix.dirname(file), href));
    if (path.startsWith('../')) throw Error('A public guide link escapes the repository.');
    return `](https://github.com/jaskevs/bld8-ui/blob/main/${path})`;
  });
}

export function buildAgentCatalog({root=defaultRoot, origin, releaseOverride, documentationVersion, registryBase}={}) {
  const release = releaseOverride ?? JSON.parse(read(root, 'apps/docs/public/releases/current.json'));
  const homepage = originFor(origin ?? new URL(release.registryBase).origin);
  const components = readExportLiteral(read(root, 'apps/docs/src/lib/catalog.ts'), 'components');
  const api = readExportLiteral(read(root, 'apps/docs/src/lib/generated/api.ts'), 'api');
  const describeBlock = blockApi(root);
  const examples=readComponentExamples(root);
  const entries = [
    ...components.map(item => ({...item, kind:'component'})),
    ...blocks.map(item => ({...item, title:item.name, kind:'block'})),
    ...templates.map(item => ({...item, title:item.name, kind:'template'})),
  ].map(item => {
    if (!/^[a-z][a-z0-9-]*$/.test(item.id)) throw Error('Invalid public catalogue identifier.');
    const registry = JSON.parse(read(root, `apps/docs/public/r/${item.id}.json`));
    const group = item.kind === 'component' ? 'components' : item.kind === 'block' ? 'blocks' : 'templates';
    if (registry.name !== item.id) throw Error(`Registry identity does not match ${item.id}.`);
    const declarations = item.kind === 'component' ? api[item.id] : item.id==='data-workspace' ? [...describeBlock(item.exportName),...describeBlock('ResourceWorkspace'),...describeBlock('useResourceWorkspace')] : describeBlock(item.exportName);
    if (!Array.isArray(declarations) || !declarations.length) throw Error(`Missing generated API: ${item.id}`);
    const sourcePaths=registry.provenance?.sourcePaths?.length?registry.provenance.sourcePaths:[item.kind==='component'?'apps/docs/src/lib/catalog.ts':'packages/blocks/src/'+item.file];
    const attribution=licenseMetadata({sourcePaths,root});
    return {
      ...attribution,
      id:item.id, kind:item.kind, title:item.title, category:item.category,
      description:item.description, notes:item.notes,
      documentationUrl:`${homepage}/${group}/${item.id}`,
      markdownUrl:`${homepage}/agent/${item.kind}/${item.id}.md`,
      registry:{name:registry.name, url:`${homepage}/r/${registry.name}.json`, dependencies:registry.dependencies ?? [], registryDependencies:registry.registryDependencies ?? [], files:(registry.files ?? []).map(({path, target, type}) => ({path, target, type}))},
      example:{...attribution,language:'tsx', code:licenseCode(item.code ?? `<${item.exportName} />`,{standalone:true,sourcePath:item.kind==='component'?'apps/docs/src/lib/catalog.ts':'scripts/library-catalog.mjs',root}), complete:false},
      examples:item.kind==='component'?examples.filter(example=>example.componentId===item.id).map(({id,componentId,title,description,source,registrySource,keyboard,states,license,provenance,notices,documentationPath,registryName})=>{
        const exampleRegistry=JSON.parse(read(root,`apps/docs/public/r/${registryName}.json`));
        if(exampleRegistry.name!==registryName)throw Error(`Registry example identity does not match ${id}.`);
        return {id,componentId,title,description,license,provenance,notices,documentationUrl:homepage+documentationPath,markdownUrl:`${homepage}/agent/example/${id}.md`,registry:{name:registryName,url:`${homepage}/r/${registryName}.json`},language:'tsx',code:source,registryCode:registrySource,complete:true,keyboard,states};
      }):[],
      api:declarations,
    };
  }).sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  const identifiers = entries.map(entry => `${entry.kind}/${entry.id}`);
  if (new Set(identifiers).size !== identifiers.length) throw Error('Public catalogue identifiers must be unique.');
  const catalog = {
    schemaVersion:1,
    release:{version:release.version, status:release.status, snapshot:release.snapshot,...(release.snapshotKind?{snapshotKind:release.snapshotKind}:{}),...(release.sourceRevision?{sourceRevision:release.sourceRevision}:{})},
    homepage, ...licenseMetadata({sourcePaths:['apps/docs/src/lib/catalog.ts','scripts/library-catalog.mjs'],root}),
    installation:{
      requirements:['React 19', 'Initialise shadcn before registry installation.', 'Node 22 for the supplied starters and local documentation server.'],
      notes:['BLD8 npm packages are private and unpublished; use editable registry source or a supplied starter.', 'Registry source is installed under bld8/ within your configured UI alias.', 'Wrap overlays in UIProvider from bld8/overlays and set body { position: relative; }.', 'Compiled CSS is included. New utility classes require your own Tailwind setup or ordinary CSS.', 'Keep all included third-party licence notices.', 'Quick-reference examples are snippets. Named examples are complete client modules, typechecked during the build; include the stylesheet once in your app. Workspace examples use @bld8/ui; registry examples use the default local UI alias. API tables describe the actual exported props.'],
      registryBase:`${homepage}/r`,
    },
    entries,
    guides:guideFiles.map(([id, title, file]) => {const attribution=licenseMetadata({sourcePaths:[file],root});return {id,title,...attribution,url:`${homepage}/agent/guides/${id}.md`,markdownUrl:`${homepage}/agent/guides/${id}.md`,content:publicGuide(read(root,file),file)+'\n\n'+licenseMarkdown(attribution)};}),
  };
  const serialized = JSON.stringify(catalog);
  if (/(?<![a-z])[A-Za-z]:[\\/]|file:\/\/|\\\\Users\\/i.test(serialized)) throw Error('Public documentation must not contain local filesystem paths.');
  return documentationVersion?pinDocumentationCatalog(catalog,{version:documentationVersion,registryBase:registryBase??release.registryBase}):catalog;
}

/** Rewrite reference metadata, never the complete example source bytes. */
export function pinDocumentationCatalog(catalog,{version,registryBase}){
  if(!supportsDocumentationVersion(version)||catalog.release.version!==version)throw Error('A supported matching documentation version is required.');
  const pinned=structuredClone(catalog),base=`${catalog.homepage}/docs/versions/${version}`;
  const registry=name=>`${registryBase}/${name}.json`;
  const link=(key,value,markdown=false)=>`${base}${markdown?'/markdown':''}?${key}=${encodeURIComponent(value)}`;
  for(const entry of pinned.entries){
    entry.documentationUrl=link('entry',entry.kind+':'+entry.id);entry.markdownUrl=link('entry',entry.kind+':'+entry.id,true);
    if(entry.registry){entry.registry.url=registry(entry.registry.name);entry.registry.registryDependencies=entry.registry.registryDependencies.map(value=>{const name=new URL(value).pathname.split('/').at(-1).replace(/\.json$/,'');return registry(name);});}
    for(const example of entry.examples){example.documentationUrl=link('example',example.id);example.markdownUrl=link('example',example.id,true);example.registry.url=registry(example.registry.name);}
  }
  pinned.installation.registryBase=registryBase;
  for(const guide of pinned.guides){guide.url=link('guide',guide.id);guide.markdownUrl=link('guide',guide.id,true);guide.content=guide.content.replaceAll(catalog.homepage+'/r/',registryBase+'/');if(catalog.release.sourceRevision)guide.content=guide.content.replaceAll('https://github.com/jaskevs/bld8-ui/blob/main/','https://github.com/jaskevs/bld8-ui/blob/'+catalog.release.sourceRevision+'/');guide.content='> This guide belongs to source '+version+'. Any links to unversioned interactive demos show the current website, not a retained runtime.\n\n'+guide.content;}
  return pinned;
}

export function prepareAgentDocs(options={}) {
  const root = options.root ?? defaultRoot;
  const catalog = buildAgentCatalog({...options, root});
  const blockApis=Object.fromEntries(catalog.entries.filter(entry=>entry.kind!=='component').map(entry=>[entry.id,entry.api]));
  const blockApiPath=join(root,'apps/docs/src/lib/generated/block-api.ts');mkdirSync(dirname(blockApiPath),{recursive:true});writeFileSync(blockApiPath,'export const blockApi = '+JSON.stringify(blockApis)+';\n');
  for(const [path,value] of Object.entries(documentationFiles(catalog))){const target=join(root,'apps/docs/public',path.startsWith('llms')?path:'agent/'+path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,value,'utf8');}
  console.log(`Prepared agent documentation for ${catalog.entries.length} entries and ${catalog.guides.length} guides (${catalog.release.version}/${catalog.release.status}).`);
  return catalog;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) prepareAgentDocs();
