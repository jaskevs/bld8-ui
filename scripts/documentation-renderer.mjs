export function licenseMarkdown(metadata) {
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

function examplesMarkdown(examples=[],catalog) {
  const exampleLabel=catalog?.release.snapshotKind==='source-graph'?'Source example':'Interactive example';
  const fence=String.fromCharCode(96).repeat(3);
  return examples.map(example=>['### '+example.title,example.description,'Example ID: '+example.id+'.',`[${exampleLabel}](${example.documentationUrl}) · [Exact Markdown](${example.markdownUrl}) · [Install this composition](${example.registry.url})`,fence+'tsx\n'+example.code+'\n'+fence,'Registry source (adjust the default UI alias to your application):',fence+'tsx\n'+example.registryCode+'\n'+fence,'Keyboard: '+example.keyboard.join(' '),'States: '+example.states.join(' ')].join('\n\n')).join('\n\n')||'Complete integration source is available in the interactive documentation source panel and supplied starter.';
}

export function exampleMarkdown(example,catalog) {
  const fence=String.fromCharCode(96).repeat(3);
  return ['# '+example.title,example.description,`Example ID: ${example.id}. Component: ${example.componentId}. Complete client module.`,
    `Source version: ${catalog.release.version} (${catalog.release.status}); snapshot ${catalog.release.snapshot}.`,
    `[${catalog.release.snapshotKind==='source-graph'?'Source example':'Interactive example'}](${example.documentationUrl}) · [Component reference](${catalog.entries.find(entry=>entry.id===example.componentId&&entry.kind==='component')?.documentationUrl??catalog.homepage+'/components/'+example.componentId}) · [Registry composition](${example.registry.url})`,
    '## Install this example', 'React 19 and an initialised shadcn application are required.',fence+'sh\nnpx shadcn@latest add '+example.registry.url+'\n'+fence,
    'The registry composition installs the complete example and its actual source dependencies. Adjust the default UI alias when copying registry source into a different application. Host services and durable persistence remain the application’s responsibility.',
    '## Workspace source',fence+'tsx\n'+example.code+'\n'+fence,'## Registry source',fence+'tsx\n'+example.registryCode+'\n'+fence,
    '## Keyboard',example.keyboard.map(note=>'- '+note).join('\n'),'## States',example.states.map(note=>'- '+note).join('\n'),licenseMarkdown(example)].join('\n\n')+'\n';
}

export function entryMarkdown(entry, catalog) {
  return `# ${entry.title}\n\n${entry.description}\n\nKind: ${entry.kind}. Category: ${entry.category}. Licence: ${catalog.license}.\nSource version: ${catalog.release.version} (${catalog.release.status}); snapshot ${catalog.release.snapshot}.\n\n[${catalog.release.snapshotKind==='source-graph'?'Selected source reference':'Interactive documentation'}](${entry.documentationUrl}) · [Registry item](${entry.registry.url})\n\n## Install\n\nReact 19 and an initialised shadcn application are required.\n\n\`\`\`sh\nnpx shadcn@latest add ${entry.registry.url}\n\`\`\`\n\n${catalog.installation.notes.join('\n\n')}\n\nDirect runtime dependencies: ${entry.registry.dependencies.join(', ') || 'Resolved by the registry dependency graph.'}\nRegistry dependencies: ${entry.registry.registryDependencies.join(', ') || 'None.'}\n\n## Usage snippet\n\nThis snippet needs its named data, callbacks, state and imports. It is not a standalone application.\n\n\`\`\`tsx\n${entry.example.code}\n\`\`\`\n\n## Complete named examples\n\n${examplesMarkdown(entry.examples,catalog)}\n\n## Behaviour and boundaries\n\n${entry.notes}\n\n## Public API\n\nGenerated from the selected public TypeScript exports. Native React props are marked explicitly.\n\n${apiMarkdown(entry.api)}\n\n${licenseMarkdown(entry)}\n`;
}

export function documentationFiles(catalog){
  const files={};const write=(path,value)=>{files[path]=value;};
  write('catalog.json', JSON.stringify(catalog, null, 2) + '\n');
  const documents = catalog.entries.map(entry => ({entry, markdown:entryMarkdown(entry, catalog)}));
  for (const {entry, markdown} of documents) write(`${entry.kind}/${entry.id}.md`, markdown);
  const namedExamples=catalog.entries.flatMap(entry=>entry.examples);
  for(const example of namedExamples)write(`example/${example.id}.md`,exampleMarkdown(example,catalog));
  for (const guide of catalog.guides) write(`guides/${guide.id}.md`, guide.content);
  const introduction = `# BLD8 UI\n\n> Editable React components, reusable blocks and interface templates. All original source is free under MIT.\n\n${catalog.release.snapshotKind==='source-graph'?'Retained source':'Current source'}: ${catalog.release.version} (${catalog.release.status}). ${catalog.release.snapshotKind==='source-graph'?'These documents describe this selected source graph and revision. The containing source manifest verifies the catalogue and archive bytes.':'These documents describe the moving development source. Retained versions have their own immutable manifests and APIs; do not assume this catalogue matches an older installation.'}\n\n[Human and agent setup](${catalog.guides.find(guide=>guide.id==='agents')?.url??catalog.homepage+'/agents'}) · [Machine-readable catalogue](${catalog.release.snapshotKind==='source-graph'?catalog.homepage+'/releases/'+catalog.release.version+'/docs/catalog.json':catalog.homepage+'/agent/catalog.json'}) · [Source versions](${catalog.homepage}/releases)\n\n${catalog.installation.requirements.join(' ')} ${catalog.installation.notes[0]}\n`;
  const index = introduction + '\n## Guides\n\n' + catalog.guides.map(guide => `- [${guide.title}](${guide.markdownUrl})`).join('\n') + '\n\n' + ['component', 'block', 'template'].map(kind => `## ${kind[0].toUpperCase() + kind.slice(1)}s\n\n` + catalog.entries.filter(entry => entry.kind === kind).map(entry => `- [${entry.title}](${entry.markdownUrl}): ${entry.description}`).join('\n')).join('\n\n') + '\n\n## Complete named examples\n\n'+namedExamples.map(example=>`- [${example.title}](${example.markdownUrl}) (${example.id}, ${example.componentId}): ${example.description}`).join('\n')+'\n';
  write('llms.txt', index);
  write('llms-full.txt', introduction + '\n\n' + catalog.guides.map(guide => guide.content).join('\n\n---\n\n') + '\n\n---\n\n' + documents.map(document => document.markdown).join('\n\n---\n\n'));
  return files;
}
