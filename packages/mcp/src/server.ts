import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { catalogSummary, entryDetails, entryKind, exampleDetails, findEntry, findExample, searchCatalog, searchExamples, type Catalog } from './catalog.js';
import type {DocumentationVersions} from './versions.js';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const pagination = { offset: z.number().int().min(0).max(2000).default(0), limit: z.number().int().min(1).max(50).default(20) };
const selection={version:z.union([z.literal('current'),z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/).max(64)]).default('current')};
const search = { kind: entryKind.optional(), category: z.string().min(1).max(80).optional(), ...pagination,...selection };
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });

export function createDocumentationServer(catalog: Catalog,versions:DocumentationVersions={versions:[],catalogs:new Map()}): McpServer {
  const withCatalog=(version:string,read:(catalog:Catalog)=>ReturnType<typeof json>|(ReturnType<typeof json>&{isError:boolean}))=>{
    if(version==='current')return read(catalog);
    const retained=versions.catalogs.get(version);
    if(retained)return read(retained);
    const record=versions.versions.find(item=>item.version===version);
    return {...json({error:record?.state==='unsupported'?'This retained source version did not ship versioned documentation.':record?.state==='invalid-cache'?'The local documentation cache failed verification.':record?'Retained documentation is not cached. Run the separate documentation sync command, then restart this connection.':'This source version is not in the allowlisted release catalogue.',version,currentFallback:false}),isError:true};
  };
  const server = new McpServer({ name: 'bld8-ui-documentation', version: '0.1.0' }, {
    instructions: 'Read-only BLD8 UI documentation from this local checkout. Search or list entries, then request exact APIs and installation metadata. Use search_examples for lightweight discovery of complete named examples and get_example for one exact client module and its real registry composition. Quick-reference entry snippets are fragments unless marked complete. Preserve the returned licence, upstream provenance and full copyright/permission notices when copying code. Current development may differ from retained source releases. This server does not install code, run commands, edit projects or fetch URLs.',
  });
  server.registerTool('list_versions',{
    title:'List documentation source versions',description:'List the explicit moving current source and locally verified retained versions. Unsupported, missing or invalid retained caches never fall back to current APIs.',inputSchema:z.object({}).strict(),annotations,
  },async()=>json({current:{id:'current',...catalog.release},versions:versions.versions}));
  server.registerTool('list_components', {
    title: 'List BLD8 UI components', description: 'List component, block and template guidance with optional kind/category filters and bounded pagination.',
    inputSchema: z.object(search).strict(), annotations,
  }, async options => withCatalog(options.version,active=>json(searchCatalog(active, options))));
  server.registerTool('search_components', {
    title: 'Search BLD8 UI components', description: 'Search real component names, descriptions and behavior notes. Every query term must match; no regular expressions, paths or network access.',
    inputSchema: z.object({ query: z.string().trim().min(1).max(200), ...search }).strict(), annotations,
  }, async options => withCatalog(options.version,active=>json(searchCatalog(active, options))));
  server.registerTool('get_component', {
    title: 'Read BLD8 UI component documentation', description: 'Read one exact catalog ID and kind. Choose overview, api, example or all. API properties are paginated; inherited native props are excluded unless includeNative is true.',
    inputSchema: z.object({ id, kind: entryKind.optional(), section: z.enum(['overview', 'api', 'example', 'all']).default('overview'), includeNative: z.boolean().default(false), ...pagination,...selection }).strict(), annotations,
  }, async options => withCatalog(options.version,active=>{
    const item = findEntry(active, options.id, options.kind);
    if (!item) return { ...json({ error: 'No unique catalog entry matched. Use list_components and supply its exact ID and kind.' }), isError: true };
    return json(entryDetails(active, item, options));
  }));
  server.registerTool('get_guide', {
    title: 'Read a BLD8 UI integration guide', description: 'Read an allowlisted guide by its catalog ID. List guide IDs in bld8://catalog; paths and URLs are not accepted.',
    inputSchema: z.object({ id,...selection }).strict(), annotations,
  }, async ({ id,version }) => withCatalog(version,active=>{
    const guide = active.guides.find(item => item.id === id);
    if (!guide) return { ...json({ error: 'No guide matched. Read bld8://catalog for available guide IDs.' }), isError: true };
    return json({ release: active.release, ...guide });
  }));
  server.registerTool('search_examples', {
    title:'Search complete BLD8 UI examples',description:'Find complete named client examples by plain text, component ID or category. Returns bounded summaries without source code; use get_example for the exact module and its registry composition.',
    inputSchema:z.object({query:z.string().trim().max(200).optional(),componentId:id.optional(),category:z.string().min(1).max(80).optional(),...pagination,...selection}).strict(),annotations,
  },async options=>withCatalog(options.version,active=>json(searchExamples(active,options))));
  server.registerTool('get_example', {
    title:'Read one complete BLD8 UI example',description:'Read one exact named example with workspace and/or registry source, keyboard and state notes, real installation links, full notices and provenance. Accepts catalog IDs only.',
    inputSchema:z.object({id,componentId:id.optional(),source:z.enum(['workspace','registry','both']).default('both'),...selection}).strict(),annotations,
  },async options=>withCatalog(options.version,active=>{
    const match=findExample(active,options.id,options.componentId);
    if(!match)return {...json({error:'No unique complete example matched. Use search_examples and supply its exact ID.'}),isError:true};
    return json(exampleDetails(active,match.item,match.example,options.source));
  }));
  server.registerResource('catalog', 'bld8://catalog', {
    title: 'BLD8 UI catalog', description: 'Available entries and guides, source identity and installation requirements.', mimeType: 'application/json',
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(catalogSummary(catalog)) }] }));
  for (const item of catalog.entries) {
    server.registerResource(`${item.kind}-${item.id}`, `bld8://${item.kind}/${item.id}`, {
      title: item.title, description: item.description, mimeType: 'application/json',
    }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ release: catalog.release, ...item }) }] }));
    for(const example of item.examples)server.registerResource(`example-${example.id}`,`bld8://example/${example.id}`,{
      title:example.title,description:example.description,mimeType:'application/json',
    },async uri=>({contents:[{uri:uri.href,mimeType:'application/json',text:JSON.stringify(exampleDetails(catalog,item,example))}]}));
  }
  for (const guide of catalog.guides) {
    server.registerResource(`guide-${guide.id}`, `bld8://guide/${guide.id}`, { title: guide.title, mimeType: 'text/markdown' },
      async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: guide.content }] }));
  }
  return server;
}
