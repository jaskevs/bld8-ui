import { test, expect } from '@playwright/test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import {readFileSync} from 'node:fs';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';
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
    expect(tools.map(item => item.name).sort()).toEqual(['get_component','get_example','get_guide','list_components','search_components','search_examples']);
    for (const tool of tools) expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    const { resources } = await client.listResources();
    expect(resources).toHaveLength(1 + catalog.entries.length + catalog.guides.length+catalog.entries.reduce((count,item)=>count+item.examples.length,0));
    const { contents } = await client.readResource({ uri: 'bld8://catalog' });
    expect(contents[0]).toHaveProperty('mimeType', 'application/json');
    const summary = JSON.parse(String(contents[0].text));
    expect(summary.release).toEqual(catalog.release);
    expect(summary.entries).toHaveLength(catalog.entries.length);
    expect(summary.entries.map((item: { kind: string }) => item.kind)).toEqual(expect.arrayContaining(['component', 'block', 'template']));
    expect(summary.guides.map((item: { id: string }) => item.id)).toEqual(catalog.guides.map(item => item.id));
    expect(summary.examples).toHaveLength(catalog.entries.reduce((count,item)=>count+item.examples.length,0));
    expect(summary.examples.every((item:Record<string,unknown>)=>item.complete===true&&!('code' in item)&&!('registryCode' in item)&&!('notices' in item))).toBe(true);
    expect(summary).not.toHaveProperty('files');
    expect(Buffer.byteLength(String(contents[0].text))).toBeLessThan(250_000);
    expect(summary.entries.every((item:Record<string,unknown>)=>item.license==='MIT'&&!('notices' in item))).toBe(true);
    expect(summary.notices).toEqual(catalog.notices);
  });
});

test('documentation search is case-insensitive, bounded and consistent across pages and kinds', async () => {
  await withServer(async client => {
    const defaultResponse=responseJson(await client.callTool({name:'list_components',arguments:{}}));
    expect(Buffer.byteLength(JSON.stringify(defaultResponse))).toBeLessThan(100_000);
    expect(defaultResponse.entries.every((item:Record<string,unknown>)=>item.license==='MIT'&&!('notices' in item))).toBe(true);
    expect(defaultResponse.notices).toEqual(catalog.notices);
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
      { name:'get_example',arguments:{id:'../private'} },
      { name:'get_example',arguments:{id:'toolbar-editor-actions',source:'file'} },
      { name:'get_example',arguments:{id:'toolbar-editor-actions',path:'package.json'} },
      { name:'get_example',arguments:{id:'unknown-example'} },
      { name:'get_example',arguments:{id:'toolbar-editor-actions',componentId:'button'} },
      { name:'search_examples',arguments:{query:'x'.repeat(201)} },
      { name:'search_examples',arguments:{limit:51} },
    ]) {
      const result = await client.callTool(request);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toMatch(/DATABASE_URL|GROQ_API_KEY|AUTH_GITHUB_SECRET/u);
    }
    for (const uri of ['file:///etc/passwd', 'https://example.com', 'bld8://guide/../../.env', 'bld8://component/unknown','bld8://example/../../.env','bld8://example/unknown']) {
      await expect(client.readResource({ uri })).rejects.toThrow();
    }
    expect(responseJson(await client.callTool({ name: 'search_components', arguments: { query: 'button' } })).total).toBeGreaterThan(0);
  });
});

test('catalog validation rejects invalid schema versions, duplicate identities and unbounded content', () => {
  expect(() => validateCatalog({ ...catalog, schemaVersion: 2 })).toThrow();
  expect(() => validateCatalog({ ...catalog, entries: [...catalog.entries, catalog.entries[0]] })).toThrow(/Duplicate/u);
  expect(() => validateCatalog({ ...catalog, guides: [...catalog.guides, catalog.guides[0]] })).toThrow(/Duplicate/u);
  const exampleEntry=catalog.entries.find(item=>item.examples.length)!;
  expect(()=>validateCatalog({...catalog,entries:[{...exampleEntry,examples:[...exampleEntry.examples,exampleEntry.examples[0]]}]})).toThrow(/Duplicate/u);
  expect(()=>validateCatalog({...catalog,entries:[{...exampleEntry,examples:[{...exampleEntry.examples[0],componentId:'another-family'}]}]})).toThrow(/parent entry/u);
  expect(() => validateCatalog({ ...catalog, entries: [{ ...catalog.entries[0], id: '../private' }] })).toThrow();
  expect(() => validateCatalog({ ...catalog, guides: [{ ...catalog.guides[0], content: 'x'.repeat(200_001) }] })).toThrow();
  const clean = validateCatalog({ ...catalog, privateFile: 'not-public', entries: catalog.entries.map(item => ({ ...item, privateFile: 'not-public' })) });
  expect(clean).not.toHaveProperty('privateFile');
  expect(clean.entries[0]).not.toHaveProperty('privateFile');
});

test('complete example discovery is bounded and exact source returns match the generated authority',async()=>{
  await withServer(async client=>{
    const first=responseJson(await client.callTool({name:'search_examples',arguments:{limit:3}}));
    const second=responseJson(await client.callTool({name:'search_examples',arguments:{limit:3,offset:first.nextOffset}}));
    expect(first.total).toBe(catalog.entries.reduce((count,item)=>count+item.examples.length,0));expect(new Set([...first.examples,...second.examples].map(item=>item.id)).size).toBe(6);expect(first.notices).toEqual(catalog.notices);expect(first.examples.every((item:Record<string,unknown>)=>!('code' in item)&&!('registryCode' in item)&&!('notices' in item))).toBe(true);
    const result=responseJson(await client.callTool({name:'search_examples',arguments:{query:'TOOLBAR-EDITOR-ACTIONS',componentId:'toolbar'}}));expect(result.total).toBe(1);const summary=result.examples[0];expect(summary.registryName).toBe('example-toolbar-editor-actions');expect(summary.registryUrl).toContain('/r/example-toolbar-editor-actions.json');expect(summary.documentationUrl).toContain('/components/toolbar/examples/toolbar-editor-actions');expect(summary.markdownUrl).toContain('/agent/example/toolbar-editor-actions.md');
    const item=catalog.entries.find(item=>item.id==='toolbar'&&item.kind==='component')!,example=item.examples.find(example=>example.id===summary.id)!;
    const exact=responseJson(await client.callTool({name:'get_example',arguments:{id:summary.id}}));expect(exact.complete).toBe(true);expect(exact.code).toBe(example.code);expect(exact.registryCode).toBe(example.registryCode);expect(exact.keyboard).toEqual(example.keyboard);expect(exact.states).toEqual(example.states);expect(exact.license).toBe('MIT');expect(exact.provenance).toEqual(example.provenance);expect(exact.notices).toEqual(example.notices);expect(hasFullNotice(exact.code,mitNotice())).toBe(true);expect(hasFullNotice(exact.registryCode,mitNotice())).toBe(true);expect(exact.release).toEqual(catalog.release);
    const registry=responseJson(await client.callTool({name:'get_example',arguments:{id:summary.id,source:'registry'}}));expect(registry).not.toHaveProperty('code');expect(registry.registryCode).toBe(example.registryCode);expect(registry.notices).toEqual(example.notices);
    const workspace=responseJson(await client.callTool({name:'get_example',arguments:{id:summary.id,source:'workspace'}}));expect(workspace).not.toHaveProperty('registryCode');expect(workspace.code).toBe(example.code);expect(workspace.notices).toEqual(example.notices);
    const resource=JSON.parse(String((await client.readResource({uri:summary.resourceUri})).contents[0].text));expect(resource).toEqual(exact);
    expect(responseJson(await client.callTool({name:'search_examples',arguments:{query:'no-example-987654321'}})).total).toBe(0);
  });
});


test('individual MCP examples and resources preserve portable notices and upstream provenance', async () => {
  await withServer(async client => {
    const response = responseJson(await client.callTool({ name:'get_component', arguments:{id:'button',kind:'component',section:'example'} }));
    expect(response.license).toBe('MIT');
    expect(response.provenance.repository).toBe('https://github.com/jaskevs/bld8-ui');
    const upstream=JSON.parse(readFileSync(new URL('../packages/ui/UPSTREAM.json',import.meta.url),'utf8'));
    expect(catalog.provenance.upstream).toEqual(upstream);
    expect(response.provenance.upstream).toEqual(upstream);
    expect(response.example.provenance.upstream).toEqual(upstream);
    expect(response.provenance.upstream.distributionMappings.registry.files['src/sidebar.tsx']).toEqual(['../sidebar.tsx']);
    expect(response.notices.map((notice:{path:string})=>notice.path)).toEqual(expect.arrayContaining(['LICENSE','packages/blocks/LICENSE','packages/ui/SHADCN_LICENSE']));
    expect(hasFullNotice(response.example.code,mitNotice())).toBe(true);
    expect(response.examples.length).toBeGreaterThan(0);
    for(const example of response.examples){
      expect(example.license).toBe('MIT');
      expect(example.provenance.sourcePaths.length).toBeGreaterThan(0);
      expect(example.notices).toEqual(catalog.entries.find(item=>item.id==='button'&&item.kind==='component')!.examples.find(item=>item.id===example.id)!.notices);
      expect(hasFullNotice(example.code,mitNotice())).toBe(true);
      expect(hasFullNotice(example.registryCode,mitNotice())).toBe(true);
    }
    const resource=JSON.parse(String((await client.readResource({uri:'bld8://component/button'})).contents[0].text));
    expect(resource.license).toBe('MIT');
    expect(resource.notices).toEqual(response.notices);
    expect(resource.provenance.upstream).toEqual(upstream);
    const guide=catalog.guides[0];
    const guideResponse=responseJson(await client.callTool({name:'get_guide',arguments:{id:guide.id}}));
    expect(guideResponse.license).toBe('MIT');
    expect(guideResponse.provenance.sourcePaths).toEqual(guide.provenance.sourcePaths);
    expect(guideResponse.notices).toEqual(guide.notices);
    expect(String((await client.readResource({uri:`bld8://guide/${guide.id}`})).contents[0].text)).toContain('## Licence and provenance');
    expect(hasFullNotice(guideResponse.content,mitNotice())).toBe(true);
  });
});

test('MCP catalogue validation cannot silently strip mandatory per-response licence metadata',()=>{
  const entry=catalog.entries[0];
  for(const key of ['license','provenance','notices']){
    const invalid={...entry};delete (invalid as Record<string,unknown>)[key];
    expect(()=>validateCatalog({...catalog,entries:[invalid]})).toThrow();
    const example={...entry.example};delete (example as Record<string,unknown>)[key];
    expect(()=>validateCatalog({...catalog,entries:[{...entry,example}]})).toThrow();
  }
});

test('older schema-one catalogues keep their entry API and gain example discovery without fabricated install links',()=>{
  const item=catalog.entries.find(item=>item.examples.length)!;
  const examples=item.examples.map(({componentId,documentationUrl,markdownUrl,registry,...example})=>example);
  const prior=validateCatalog({...catalog,entries:[{...item,examples}]});
  expect(prior.entries[0].examples[0].code).toBe(item.examples[0].code);expect(prior.entries[0].examples[0]).not.toHaveProperty('registry');expect(prior.entries[0].kind).toBe(item.kind);
});


test('MCP provenance requires explicit bounded mappings for each portable layout',()=>{
  const upstream=catalog.provenance.upstream;
  for(const key of ['sourcePathScope','distributionMappings']){
    const invalid={...upstream};delete (invalid as Record<string,unknown>)[key];
    expect(()=>validateCatalog({...catalog,provenance:{...catalog.provenance,upstream:invalid}})).toThrow();
  }
  const invalid={...upstream,distributionMappings:{...upstream.distributionMappings,registry:{...upstream.distributionMappings.registry,files:{'src/sidebar.tsx':Array(11).fill('../sidebar.tsx')}}}};
  expect(()=>validateCatalog({...catalog,provenance:{...catalog.provenance,upstream:invalid}})).toThrow();
  expect(()=>validateCatalog({...catalog,provenance:{...catalog.provenance,upstream:{...upstream,sourcePathScope:'x'.repeat(2001)}}})).toThrow();
});
