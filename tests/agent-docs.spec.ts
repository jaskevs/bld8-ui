import {expect, test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAgentCatalog, entryMarkdown, exampleMarkdown, readExportLiteral, type AgentCatalog} from '../scripts/prepare-agent-docs.mjs';
import {readComponentExamples} from '../scripts/prepare-component-examples.mjs';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
let catalog:AgentCatalog;
test.beforeAll(() => { catalog = buildAgentCatalog({root}); });

test('agent catalogue keeps source identities and APIs tied to the existing authorities', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'apps/docs/public/releases/current.json'), 'utf8'));
  expect(catalog.schemaVersion).toBe(1);
  expect(catalog.release).toEqual({version:manifest.version, status:manifest.status, snapshot:manifest.snapshot});
  const components = readExportLiteral(readFileSync(join(root, 'apps/docs/src/lib/catalog.ts'), 'utf8'), 'components') as {id:string}[];
  expect(catalog.entries.filter(entry => entry.kind === 'component').map(entry => entry.id).sort()).toEqual(components.map(entry => entry.id).sort());
  const generatedApi = readExportLiteral(readFileSync(join(root, 'apps/docs/src/lib/generated/api.ts'), 'utf8'), 'api') as Record<string, unknown>;
  for (const entry of catalog.entries) {
    const registry = JSON.parse(readFileSync(join(root, `apps/docs/public/r/${entry.id}.json`), 'utf8'));
    expect(entry.registry.name).toBe(registry.name);
    expect(entry.registry.dependencies).toEqual(registry.dependencies ?? []);
    expect(entry.registry.registryDependencies).toEqual(registry.registryDependencies ?? []);
    if (entry.kind === 'component') expect(entry.api).toEqual(generatedApi[entry.id]);
    expect(entry.api.length).toBeGreaterThan(0);
    expect(entry.example.complete).toBe(false);
  }
  const issue = catalog.entries.find(entry => entry.kind === 'block' && entry.id === 'issue-table')!;
  expect(issue.api[0].name).toBe('IssueTable');
  expect(issue.api[0].properties.some(property => property.name === 'repository')).toBe(true);
  const resources=catalog.entries.find(entry=>entry.kind==='block'&&entry.id==='data-workspace')!;expect(resources.api.map(section=>section.name)).toEqual(['DataWorkspace','ResourceWorkspace','useResourceWorkspace']);expect(resources.api[1].properties.map(property=>property.name)).toEqual(expect.arrayContaining(['dataSource','columns','fields','renderGrid','renderInspector','renderField','onSaveView','onShareView']));
});

test('exact example documents and registry compositions share the complete canonical source',()=>{
  const authorities=readComponentExamples(root),examples=catalog.entries.flatMap(entry=>entry.examples);
  expect(examples).toHaveLength(authorities.length);expect(new Set(examples.map(example=>example.id)).size).toBe(examples.length);
  for(const example of examples){
    const authority=authorities.find(item=>item.id===example.id)!;
    expect(example.componentId).toBe(authority.componentId);expect(example.documentationUrl).toBe(catalog.homepage+authority.documentationPath);expect(example.markdownUrl).toBe(catalog.homepage+'/agent/example/'+example.id+'.md');expect(example.registry).toEqual({name:authority.registryName,url:catalog.homepage+'/r/'+authority.registryName+'.json'});expect(example.code).toBe(authority.source);expect(example.registryCode).toBe(authority.registrySource);
    const registry=JSON.parse(readFileSync(join(root,'apps/docs/public/r/'+example.registry.name+'.json'),'utf8'));expect(registry.name).toBe(example.registry.name);
    // Installed example files live under bld8/examples and use relative UI imports;
    // the copyable source uses the default configured UI alias.
    const installed=registry.files.find((file:{path:string})=>file.path.endsWith('/'+example.id+'.tsx'))?.content as string;
    expect(installed).toBeTruthy();expect(hasFullNotice(installed,mitNotice())).toBe(true);
    const parsed=ts.createSourceFile(example.id+'.tsx',installed,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const declaration=parsed.statements.find(node=>ts.isFunctionDeclaration(node)&&node.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)&&(authority.exportName==='default'?node.modifiers.some(modifier=>modifier.kind===ts.SyntaxKind.DefaultKeyword):node.name?.text===authority.exportName));
    expect(declaration,'Installed export must match the canonical example '+authority.exportName).toBeDefined();
    const importedUi=authority.modules.filter(module=>!module.startsWith('block:'));
    for(const module of importedUi)expect(installed).toContain("'../"+module+"'");
    const markdown=exampleMarkdown(example,catalog);expect(markdown).toContain('npx shadcn@latest add '+example.registry.url);expect(markdown).toContain(example.documentationUrl);expect(markdown).toContain(example.code);expect(markdown).toContain(example.registryCode);expect(markdown).toContain(catalog.release.snapshot);expect(hasFullNotice(markdown,mitNotice())).toBe(true);expect(readFileSync(join(root,'apps/docs/public/agent/example/'+example.id+'.md'),'utf8')).toBe(markdown);
  }
});

test('literal catalogue reads refuse executable expressions and computed properties', () => {
  expect(readExportLiteral('export const entries = [{id:"valid",enabled:true,count:2}] as const;', 'entries')).toEqual([{id:'valid',enabled:true,count:2}]);
  expect(() => readExportLiteral('export const entries = malicious();', 'entries')).toThrow('literal value');
  expect(() => readExportLiteral('export const entries = {[malicious()]:"value"};', 'entries')).toThrow('literal properties');
  expect(() => readExportLiteral('export const entries = {...privateData};', 'entries')).toThrow('literal properties');
  expect(() => readExportLiteral('const privateData = "hidden";', 'privateData')).toThrow('Missing exported');
});

test('related scalar unions remain declarations rather than inherited string properties',()=>{
  const calendar=catalog.entries.find(entry=>entry.kind==='component'&&entry.id==='event-calendar')!;
  const view=calendar.api.find(section=>section.name==='CalendarView')!;
  expect(view.definition).toMatch(/['"]week['"]/);expect(view.definition).toMatch(/['"]month['"]/);
  expect(view.properties).toEqual([]);
  for(const entry of catalog.entries)for(const section of entry.api)for(const property of section.properties)expect(typeof property.defaultValue).toBe('string');
  expect(entryMarkdown(calendar,catalog)).toContain('type CalendarView =');
});

test('public agent documents expose complete props and public links without local paths', () => {
  const table = catalog.entries.find(entry => entry.kind === 'component' && entry.id === 'table')!;
  const markdown = entryMarkdown(table, catalog);
  expect(markdown).toContain(`npx shadcn@latest add ${table.registry.url}`);
  expect(markdown).toContain(catalog.release.snapshot);
  for (const declaration of table.api) for (const property of declaration.properties) expect(markdown).toContain(`\`${property.name}\``);
  expect(markdown).toContain('not a standalone application');
  expect(catalog.guides.length).toBeGreaterThan(0);
  for (const entry of catalog.entries) {
    expect(entry.markdownUrl).toBe(`${catalog.homepage}/agent/${entry.kind}/${entry.id}.md`);
    expect(entry.registry.files.every(file => !('content' in file))).toBe(true);
  }
  expect(JSON.stringify(catalog)).not.toMatch(/(?<![a-z])[A-Za-z]:[\\/]|file:\/\//i);
  expect(() => buildAgentCatalog({root, origin:'https://user:secret@example.com'})).toThrow('without credentials');
  expect(() => buildAgentCatalog({root, origin:'https://example.com/private'})).toThrow('without credentials');
});
