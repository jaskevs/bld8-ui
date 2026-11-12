import ts from 'typescript';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, posix, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {blocks, templates} from './library-catalog.mjs';
import {readComponentExamples} from './prepare-component-examples.mjs';
import {licenseCode,licenseMetadata} from './license-policy.mjs';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const guideFiles = [
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

export function buildAgentCatalog({root=defaultRoot, origin}={}) {
  const release = JSON.parse(read(root, 'apps/docs/public/releases/current.json'));
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
    const declarations = item.kind === 'component' ? api[item.id] : describeBlock(item.exportName);
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
    release:{version:release.version, status:release.status, snapshot:release.snapshot},
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
  return catalog;
}

function licenseMarkdown(metadata) {
  const fence=String.fromCharCode(96).repeat(3);
  return '## Licence and provenance\n\nLicence: '+metadata.license+'. Keep the included copyright and permission notices when copying source.\n\n'+fence+'json\n'+JSON.stringify(metadata.provenance,null,2)+'\n'+fence+'\n\n'+metadata.notices.map(({path,content})=>'### '+path+'\n\n'+fence+'text\n'+content.trim()+'\n'+fence).join('\n\n');
}

const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
function apiMarkdown(declarations) {
  return declarations.map(declaration => {
    const rows = declaration.properties.map(property => `| \`${cell(property.name)}\` | \`${cell(property.type)}\` | ${property.required ? 'Yes' : 'No'} | \`${cell(property.defaultValue)}\` | ${cell(property.description)}${property.native ? ' (Native React prop.)' : ''} |`);
    return `### ${declaration.name}\n\n${declaration.kind}.\n\n${declaration.definition ? '\x60\x60\x60ts\ntype '+declaration.name+' = '+declaration.definition+';\n\x60\x60\x60\n\n' : ''}${rows.length ? '| '+(declaration.kind==='Function parameters'?'Parameter':'Prop')+' | Type | Required | Default | Description |\n| --- | --- | --- | --- | --- |\n' + rows.join('\n') : 'No props.'}`;
  }).join('\n\n');
}

function examplesMarkdown(examples=[]) {
  const fence=String.fromCharCode(96).repeat(3);
  return examples.map(example=>['### '+example.title,example.description,'Example ID: '+example.id+'.',`[Interactive example](${example.documentationUrl}) · [Exact Markdown](${example.markdownUrl}) · [Install this composition](${example.registry.url})`,fence+'tsx\n'+example.code+'\n'+fence,'Registry source (adjust the default UI alias to your application):',fence+'tsx\n'+example.registryCode+'\n'+fence,'Keyboard: '+example.keyboard.join(' '),'States: '+example.states.join(' ')].join('\n\n')).join('\n\n')||'Complete integration source is available in the interactive documentation source panel and supplied starter.';
}

export function exampleMarkdown(example,catalog) {
  const fence=String.fromCharCode(96).repeat(3);
  return ['# '+example.title,example.description,`Example ID: ${example.id}. Component: ${example.componentId}. Complete client module.`,
    `Source version: ${catalog.release.version} (${catalog.release.status}); snapshot ${catalog.release.snapshot}.`,
    `[Interactive example](${example.documentationUrl}) · [Component reference](${catalog.homepage}/components/${example.componentId}) · [Registry composition](${example.registry.url})`,
    '## Install this example', 'React 19 and an initialised shadcn application are required.',fence+'sh\nnpx shadcn@latest add '+example.registry.url+'\n'+fence,
    'The registry composition installs the complete example and its actual source dependencies. Adjust the default UI alias when copying registry source into a different application. Host services and durable persistence remain the application’s responsibility.',
    '## Workspace source',fence+'tsx\n'+example.code+'\n'+fence,'## Registry source',fence+'tsx\n'+example.registryCode+'\n'+fence,
    '## Keyboard',example.keyboard.map(note=>'- '+note).join('\n'),'## States',example.states.map(note=>'- '+note).join('\n'),licenseMarkdown(example)].join('\n\n')+'\n';
}

export function entryMarkdown(entry, catalog) {
  return `# ${entry.title}\n\n${entry.description}\n\nKind: ${entry.kind}. Category: ${entry.category}. Licence: ${catalog.license}.\nSource version: ${catalog.release.version} (${catalog.release.status}); snapshot ${catalog.release.snapshot}.\n\n[Interactive documentation](${entry.documentationUrl}) · [Registry item](${entry.registry.url})\n\n## Install\n\nReact 19 and an initialised shadcn application are required.\n\n\`\`\`sh\nnpx shadcn@latest add ${entry.registry.url}\n\`\`\`\n\n${catalog.installation.notes.join('\n\n')}\n\nDirect runtime dependencies: ${entry.registry.dependencies.join(', ') || 'Resolved by the registry dependency graph.'}\nRegistry dependencies: ${entry.registry.registryDependencies.join(', ') || 'None.'}\n\n## Usage snippet\n\nThis snippet needs its named data, callbacks, state and imports. It is not a standalone application.\n\n\`\`\`tsx\n${entry.example.code}\n\`\`\`\n\n## Complete named examples\n\n${examplesMarkdown(entry.examples)}\n\n## Behaviour and boundaries\n\n${entry.notes}\n\n## Public API\n\nGenerated from the current public TypeScript exports. Native React props are marked explicitly.\n\n${apiMarkdown(entry.api)}\n\n${licenseMarkdown(entry)}\n`;
}

export function prepareAgentDocs(options={}) {
  const root = options.root ?? defaultRoot;
  const catalog = buildAgentCatalog({...options, root});
  const write = (path, value) => {
    const target = join(root, 'apps/docs/public', path);
    mkdirSync(dirname(target), {recursive:true});
    writeFileSync(target, value, 'utf8');
  };
  const blockApis=Object.fromEntries(catalog.entries.filter(entry=>entry.kind!=='component').map(entry=>[entry.id,entry.api]));
  const blockApiPath=join(root,'apps/docs/src/lib/generated/block-api.ts');mkdirSync(dirname(blockApiPath),{recursive:true});writeFileSync(blockApiPath,'export const blockApi = '+JSON.stringify(blockApis)+';\n');
  write('agent/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
  const documents = catalog.entries.map(entry => ({entry, markdown:entryMarkdown(entry, catalog)}));
  for (const {entry, markdown} of documents) write(`agent/${entry.kind}/${entry.id}.md`, markdown);
  const namedExamples=catalog.entries.flatMap(entry=>entry.examples);
  for(const example of namedExamples)write(`agent/example/${example.id}.md`,exampleMarkdown(example,catalog));
  for (const guide of catalog.guides) write(`agent/guides/${guide.id}.md`, guide.content);
  const introduction = `# BLD8 UI\n\n> Editable React components, reusable blocks and interface templates. All original source is free under MIT.\n\nCurrent source: ${catalog.release.version} (${catalog.release.status}). These documents describe the moving development source. Retained versions have their own immutable manifests and APIs; do not assume this catalogue matches an older installation.\n\n[Human and agent setup](${catalog.homepage}/agents) · [Machine-readable catalogue](${catalog.homepage}/agent/catalog.json) · [Source versions](${catalog.homepage}/releases)\n\n${catalog.installation.requirements.join(' ')} ${catalog.installation.notes[0]}\n`;
  const index = introduction + '\n## Guides\n\n' + catalog.guides.map(guide => `- [${guide.title}](${guide.markdownUrl})`).join('\n') + '\n\n' + ['component', 'block', 'template'].map(kind => `## ${kind[0].toUpperCase() + kind.slice(1)}s\n\n` + catalog.entries.filter(entry => entry.kind === kind).map(entry => `- [${entry.title}](${entry.markdownUrl}): ${entry.description}`).join('\n')).join('\n\n') + '\n\n## Complete named examples\n\n'+namedExamples.map(example=>`- [${example.title}](${example.markdownUrl}) (${example.id}, ${example.componentId}): ${example.description}`).join('\n')+'\n';
  write('llms.txt', index);
  write('llms-full.txt', introduction + '\n\n' + catalog.guides.map(guide => guide.content).join('\n\n---\n\n') + '\n\n---\n\n' + documents.map(document => document.markdown).join('\n\n---\n\n'));
  console.log(`Prepared agent documentation for ${catalog.entries.length} entries and ${catalog.guides.length} guides (${catalog.release.version}/${catalog.release.status}).`);
  return catalog;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) prepareAgentDocs();
