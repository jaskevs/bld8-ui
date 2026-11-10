import {expect, test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAgentCatalog, entryMarkdown, readExportLiteral, type AgentCatalog} from '../scripts/prepare-agent-docs.mjs';

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
