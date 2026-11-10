import { test, expect } from '@playwright/test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { loadCatalog, validateCatalog, type Catalog } from '../packages/mcp/src/catalog';

const entrypoint = fileURLToPath(new URL('../packages/mcp/dist/index.js', import.meta.url));
let catalog: Catalog;
test.beforeAll(async () => { catalog = await loadCatalog(); });

function responseJson(result: Awaited<ReturnType<Client['callTool']>>) {
  expect(result.isError).not.toBe(true);
  const block = result.content.find(item => item.type === 'text');
  if (!block || block.type !== 'text') throw new Error('Expected a text response.');
  return JSON.parse(block.text);
}

async function withServer(run: (client: Client) => Promise<void>) {
  const client = new Client({ name: 'bld8-documentation-check', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [entrypoint], cwd: os.tmpdir(), env: {}, stderr: 'pipe',
  });
  let diagnostics = '';
  transport.stderr?.on('data', chunk => { diagnostics += String(chunk); });
  try {
    await client.connect(transport);
    expect(client.getServerVersion()).toEqual({ name: 'bld8-ui-documentation', version: '0.1.0' });
    await run(client);
    expect(diagnostics).toBe('');
  } finally { await client.close(); }
}

test('documentation MCP initializes over stdio outside its checkout and advertises only read-only tools', async () => {
  await withServer(async client => {
    const { tools } = await client.listTools();
    expect(tools.map(item => item.name).sort()).toEqual(['get_component', 'get_guide', 'list_components', 'search_components']);
    for (const tool of tools) expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    const { resources } = await client.listResources();
    expect(resources).toHaveLength(1 + catalog.entries.length + catalog.guides.length);
    const { contents } = await client.readResource({ uri: 'bld8://catalog' });
    expect(contents[0]).toHaveProperty('mimeType', 'application/json');
    const summary = JSON.parse(String(contents[0].text));
    expect(summary.release).toEqual(catalog.release);
    expect(summary.entries).toHaveLength(catalog.entries.length);
    expect(summary.entries.map((item: { kind: string }) => item.kind)).toEqual(expect.arrayContaining(['component', 'block', 'template']));
    expect(summary.guides.map((item: { id: string }) => item.id)).toEqual(catalog.guides.map(item => item.id));
    expect(summary).not.toHaveProperty('files');
  });
});

test('documentation search is case-insensitive, bounded and consistent across pages and kinds', async () => {
  await withServer(async client => {
    const first = responseJson(await client.callTool({ name: 'list_components', arguments: { kind: 'component', limit: 5 } }));
    const second = responseJson(await client.callTool({ name: 'list_components', arguments: { kind: 'component', limit: 5, offset: first.nextOffset } }));
    expect(first.entries).toHaveLength(5);
    expect(first.total).toBe(catalog.entries.filter(item => item.kind === 'component').length);
    expect(new Set([...first.entries, ...second.entries].map(item => item.id)).size).toBe(10);
    expect(first.entries.every((item: { kind: string }) => item.kind === 'component')).toBe(true);
    const button = catalog.entries.find(item => item.id === 'button' && item.kind === 'component')!;
    const found = responseJson(await client.callTool({ name: 'search_components', arguments: { query: 'BUTTON', kind: 'component', limit: 1 } }));
    expect(found.entries[0].id).toBe(button.id);
    const empty = responseJson(await client.callTool({ name: 'search_components', arguments: { query: 'not-a-component-987654321' } }));
    expect(empty.total).toBe(0);
  });
});

test('component API pagination, native props and snippets match generated public documentation', async () => {
  await withServer(async client => {
    const item = catalog.entries.find(entry => entry.id === 'button' && entry.kind === 'component')!;
    const ownProps = item.api.flatMap(definition => definition.properties.filter(prop => !prop.native));
    const first = responseJson(await client.callTool({ name: 'get_component', arguments: { id: item.id, kind: item.kind, section: 'all', limit: 1 } }));
    expect(first.release).toEqual(catalog.release);
    expect(first.registry).toEqual(item.registry);
    expect(first.example).toEqual(item.example);
    expect(first.example.complete).toBe(false);
    expect(first.api.total).toBe(ownProps.length);
    expect(first.api.properties).toHaveLength(1);
    expect(first.api.properties[0].name).toBe(ownProps[0].name);
    const next = responseJson(await client.callTool({ name: 'get_component', arguments: { id: item.id, kind: item.kind, section: 'api', limit: 1, offset: 1 } }));
    expect(next.api.properties[0].name).toBe(ownProps[1].name);
    const allProps = responseJson(await client.callTool({ name: 'get_component', arguments: { id: item.id, kind: item.kind, section: 'api', includeNative: true, limit: 50 } }));
    expect(allProps.api.total).toBe(item.api.reduce((count, definition) => count + definition.properties.length, 0));
    expect(allProps.api.total).toBeGreaterThan(first.api.total);
    const { contents } = await client.readResource({ uri: `bld8://component/${item.id}` });
    expect(JSON.parse(String(contents[0].text))).toEqual({ release: catalog.release, ...item });
    const guide = catalog.guides[0];
    const result = responseJson(await client.callTool({ name: 'get_guide', arguments: { id: guide.id } }));
    expect(result.content).toBe(guide.content);
    expect((await client.readResource({ uri: `bld8://guide/${guide.id}` })).contents[0].text).toBe(guide.content);
  });
});

test('documentation MCP rejects traversal, arbitrary paths, malformed pagination and unknown IDs without losing the session', async () => {
  await withServer(async client => {
    for (const request of [
      { name: 'get_component', arguments: { id: '../.env.local' } },
      { name: 'get_component', arguments: { id: 'button', path: 'package.json' } },
      { name: 'get_guide', arguments: { id: 'https://example.com' } },
      { name: 'list_components', arguments: { limit: 5000 } },
      { name: 'list_components', arguments: { offset: -1 } },
      { name: 'search_components', arguments: { query: 'x'.repeat(201) } },
      { name: 'get_component', arguments: { id: 'not-a-real-component' } },
    ]) {
      const result = await client.callTool(request);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toMatch(/DATABASE_URL|GROQ_API_KEY|AUTH_GITHUB_SECRET/u);
    }
    for (const uri of ['file:///etc/passwd', 'https://example.com', 'bld8://guide/../../.env', 'bld8://component/unknown']) {
      await expect(client.readResource({ uri })).rejects.toThrow();
    }
    expect(responseJson(await client.callTool({ name: 'search_components', arguments: { query: 'button' } })).total).toBeGreaterThan(0);
  });
});

test('catalog validation rejects invalid schema versions, duplicate identities and unbounded content', () => {
  expect(() => validateCatalog({ ...catalog, schemaVersion: 2 })).toThrow();
  expect(() => validateCatalog({ ...catalog, entries: [...catalog.entries, catalog.entries[0]] })).toThrow(/Duplicate/u);
  expect(() => validateCatalog({ ...catalog, guides: [...catalog.guides, catalog.guides[0]] })).toThrow(/Duplicate/u);
  expect(() => validateCatalog({ ...catalog, entries: [{ ...catalog.entries[0], id: '../private' }] })).toThrow();
  expect(() => validateCatalog({ ...catalog, guides: [{ ...catalog.guides[0], content: 'x'.repeat(200_001) }] })).toThrow();
  const clean = validateCatalog({ ...catalog, privateFile: 'not-public', entries: catalog.entries.map(item => ({ ...item, privateFile: 'not-public' })) });
  expect(clean).not.toHaveProperty('privateFile');
  expect(clean.entries[0]).not.toHaveProperty('privateFile');
});
