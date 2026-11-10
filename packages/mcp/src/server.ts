import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { catalogSummary, entryDetails, entryKind, findEntry, searchCatalog, type Catalog } from './catalog.js';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const pagination = { offset: z.number().int().min(0).max(2000).default(0), limit: z.number().int().min(1).max(50).default(20) };
const search = { kind: entryKind.optional(), category: z.string().min(1).max(80).optional(), ...pagination };
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });

export function createDocumentationServer(catalog: Catalog): McpServer {
  const server = new McpServer({ name: 'bld8-ui-documentation', version: '0.1.0' }, {
    instructions: 'Read-only BLD8 UI documentation from this local checkout. Search or list entries, then request exact APIs, usage examples and installation metadata. Example snippets are fragments unless marked complete. Current development may differ from retained source releases. This server does not install code, run commands, edit projects or fetch URLs.',
  });
  server.registerTool('list_components', {
    title: 'List BLD8 UI components', description: 'List component, block and template guidance with optional kind/category filters and bounded pagination.',
    inputSchema: z.object(search).strict(), annotations,
  }, async options => json(searchCatalog(catalog, options)));
  server.registerTool('search_components', {
    title: 'Search BLD8 UI components', description: 'Search real component names, descriptions and behavior notes. Every query term must match; no regular expressions, paths or network access.',
    inputSchema: z.object({ query: z.string().trim().min(1).max(200), ...search }).strict(), annotations,
  }, async options => json(searchCatalog(catalog, options)));
  server.registerTool('get_component', {
    title: 'Read BLD8 UI component documentation', description: 'Read one exact catalog ID and kind. Choose overview, api, example or all. API properties are paginated; inherited native props are excluded unless includeNative is true.',
    inputSchema: z.object({ id, kind: entryKind.optional(), section: z.enum(['overview', 'api', 'example', 'all']).default('overview'), includeNative: z.boolean().default(false), ...pagination }).strict(), annotations,
  }, async options => {
    const item = findEntry(catalog, options.id, options.kind);
    if (!item) return { ...json({ error: 'No unique catalog entry matched. Use list_components and supply its exact ID and kind.' }), isError: true };
    return json(entryDetails(catalog, item, options));
  });
  server.registerTool('get_guide', {
    title: 'Read a BLD8 UI integration guide', description: 'Read an allowlisted guide by its catalog ID. List guide IDs in bld8://catalog; paths and URLs are not accepted.',
    inputSchema: z.object({ id }).strict(), annotations,
  }, async ({ id }) => {
    const guide = catalog.guides.find(item => item.id === id);
    if (!guide) return { ...json({ error: 'No guide matched. Read bld8://catalog for available guide IDs.' }), isError: true };
    return json({ release: catalog.release, ...guide });
  });
  server.registerResource('catalog', 'bld8://catalog', {
    title: 'BLD8 UI catalog', description: 'Available entries and guides, source identity and installation requirements.', mimeType: 'application/json',
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(catalogSummary(catalog)) }] }));
  for (const item of catalog.entries) {
    server.registerResource(`${item.kind}-${item.id}`, `bld8://${item.kind}/${item.id}`, {
      title: item.title, description: item.description, mimeType: 'application/json',
    }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ release: catalog.release, ...item }) }] }));
  }
  for (const guide of catalog.guides) {
    server.registerResource(`guide-${guide.id}`, `bld8://guide/${guide.id}`, { title: guide.title, mimeType: 'text/markdown' },
      async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: guide.content }] }));
  }
  return server;
}
