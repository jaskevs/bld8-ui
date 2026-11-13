import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod/v4';

const text = z.string().max(200_000);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const entryKind = z.enum(['component', 'block', 'template']);
const distributionMapping=z.object({
  relativeTo:z.string().min(1).max(500),
  files:z.record(z.string().min(1).max(500),z.array(z.string().min(1).max(500)).min(1).max(10))
    .refine(files=>Object.keys(files).length<=1000,'Distribution mappings exceed the file limit.'),
  notes:z.string().max(20_000),
});
const licenseMetadata = {
  license:z.literal('MIT'),
  provenance:z.object({repository:text,sourcePaths:z.array(text).max(1000),upstream:z.object({
    repository:text,revision:text,license:text,copyright:text.optional(),licenseFile:text.optional(),notes:text.optional(),
    sourcePathScope:z.string().min(1).max(2000),
    distributionMappings:z.object({starter:distributionMapping,npm:distributionMapping,registry:distributionMapping}).strict(),
    files:z.array(z.object({source:text,sha256:text,adaptedIn:text})).max(1000),
  })}),
  notices:z.array(z.object({path:text,content:text})).min(1).max(50),
};
const property = z.object({
  name: text, type: text, required: z.boolean(), defaultValue: text.nullish(),
  description: text, native: z.boolean().optional(),
});
const entry = z.object({
  ...licenseMetadata,
  id, kind: entryKind, title: text, category: text, description: text, notes: text,
  documentationUrl: text, markdownUrl: text,
  registry: z.object({
    name: id, url: text, dependencies: z.array(text).max(100), registryDependencies: z.array(text).max(200),
    files: z.array(z.object({ path: text, target: text.optional(), type: text })).max(500),
  }).nullable(),
  example: z.object({ ...licenseMetadata,language: z.literal('tsx'), code: text, complete: z.boolean() }),
  examples:z.array(z.object({...licenseMetadata,id,componentId:id.optional(),title:text,description:text,documentationUrl:text.optional(),markdownUrl:text.optional(),registry:z.object({name:id,url:text}).optional(),language:z.literal('tsx'),code:text,registryCode:text,complete:z.literal(true),keyboard:z.array(text).max(50),states:z.array(text).max(50)})).max(100).default([]),
  api: z.array(z.object({ name: text, kind: text, definition:text.optional(), properties: z.array(property).max(2000) })).max(100),
});
const guide = z.object({ ...licenseMetadata,id, title: text, url: text, markdownUrl: text, content: text });
const schema = z.object({
  schemaVersion: z.literal(1), release: z.object({ version: text, status: text, snapshot: text, snapshotKind:z.enum(['manifest','source-graph']).optional(),sourceRevision:z.string().regex(/^[a-f0-9]{40}$/).optional() }),
  homepage: text, ...licenseMetadata,
  installation: z.object({ requirements: z.array(text).max(30), notes: z.array(text).max(30), registryBase: text }),
  entries: z.array(entry).max(2000), guides: z.array(guide).max(100),
});

export type Catalog = z.infer<typeof schema>;
export type Entry = Catalog['entries'][number];
export type Example = Entry['examples'][number];

export function validateCatalog(value: unknown): Catalog {
  const result = schema.parse(value);
  const entryKeys = result.entries.map(item => `${item.kind}:${item.id}`);
  const guideKeys = result.guides.map(item => item.id);
  const exampleKeys=result.entries.flatMap(item=>item.examples.map(example=>example.id));
  if (new Set(entryKeys).size !== entryKeys.length || new Set(guideKeys).size !== guideKeys.length || new Set(exampleKeys).size!==exampleKeys.length) {
    throw new Error('Duplicate documentation identifiers.');
  }
  for(const item of result.entries)for(const example of item.examples)if(example.componentId&&example.componentId!==item.id)throw new Error('Example component identity does not match its parent entry.');
  return result;
}

/** Read the one generated public catalog; callers cannot supply file paths or URLs. */
export async function loadCatalog(): Promise<Catalog> {
  const publicDirectory = fileURLToPath(new URL('../../../apps/docs/public/', import.meta.url));
  const catalogPath = path.join(publicDirectory, 'agent', 'catalog.json');
  const [publicRealPath, catalogRealPath, details] = await Promise.all([
    realpath(publicDirectory), realpath(catalogPath), lstat(catalogPath),
  ]);
  const relative = path.relative(publicRealPath, catalogRealPath);
  if (relative.startsWith('..') || path.isAbsolute(relative) || details.isSymbolicLink() || !details.isFile()) {
    throw new Error('The generated catalog must be a regular file inside the public documentation directory.');
  }
  if (details.size > 32*1024*1024) throw new Error('The generated documentation catalog exceeds its size limit.');
  return validateCatalog(JSON.parse(await readFile(catalogPath, 'utf8')));
}

export function summarizeEntry(item: Entry) {
  return {
    license:item.license,provenance:{repository:item.provenance.repository,upstream:{repository:item.provenance.upstream.repository,revision:item.provenance.upstream.revision}},
    id: item.id, kind: item.kind, title: item.title, category: item.category, description: item.description,
    documentationUrl: item.documentationUrl, markdownUrl: item.markdownUrl, registryUrl: item.registry?.url ?? null,
    exampleCount:item.examples.length,
  };
}

export function catalogSummary(catalog: Catalog) {
  return {
    schemaVersion: catalog.schemaVersion, release: catalog.release, homepage: catalog.homepage,
    license: catalog.license, provenance:catalog.provenance,notices:catalog.notices,installation: catalog.installation, entries: catalog.entries.map(summarizeEntry),
    examples:catalog.entries.flatMap(item=>item.examples.map(example=>summarizeExample(item,example))),
    guides: catalog.guides.map(({ id, title, url, markdownUrl }) => ({ id, title, url, markdownUrl })),
  };
}

/** Complete example discovery remains separate from the stable entry kind enum. */
export function summarizeExample(item:Entry,example:Example) {
  return {id:example.id,componentId:example.componentId??item.id,title:example.title,description:example.description,
    category:item.category,complete:true,license:example.license,
    documentationUrl:example.documentationUrl??item.documentationUrl,markdownUrl:example.markdownUrl??null,
    registryName:example.registry?.name??null,registryUrl:example.registry?.url??null,resourceUri:`bld8://example/${example.id}`};
}

export interface ExampleSearchOptions {query?:string;componentId?:string;category?:string;offset?:number;limit?:number}
export function searchExamples(catalog:Catalog,options:ExampleSearchOptions) {
  const terms=(options.query??'').trim().toLocaleLowerCase('en-US').split(/\s+/u).filter(Boolean),needle=(options.query??'').trim().toLocaleLowerCase('en-US');
  const matches=catalog.entries.flatMap(item=>item.examples.map(example=>({item,example}))).filter(({item,example})=>{
    if(options.componentId&&(example.componentId??item.id)!==options.componentId)return false;
    if(options.category&&item.category.toLocaleLowerCase('en-US')!==options.category.toLocaleLowerCase('en-US'))return false;
    const haystack=[example.id,example.title,example.description,item.id,item.title,item.category,...example.keyboard,...example.states].join(' ').toLocaleLowerCase('en-US');
    return terms.every(term=>haystack.includes(term));
  });
  matches.sort((a,b)=>Number(b.example.id===needle||b.example.title.toLocaleLowerCase('en-US')===needle)-Number(a.example.id===needle||a.example.title.toLocaleLowerCase('en-US')===needle));
  const offset=options.offset??0,limit=options.limit??20;
  return {release:catalog.release,license:catalog.license,provenance:catalog.provenance,notices:catalog.notices,total:matches.length,offset,limit,nextOffset:offset+limit<matches.length?offset+limit:null,examples:matches.slice(offset,offset+limit).map(({item,example})=>summarizeExample(item,example))};
}

export function findExample(catalog:Catalog,exampleId:string,componentId?:string) {
  const matches=catalog.entries.flatMap(item=>item.examples.filter(example=>example.id===exampleId&&(!componentId||(example.componentId??item.id)===componentId)).map(example=>({item,example})));
  return matches.length===1?matches[0]:undefined;
}

export function exampleDetails(catalog:Catalog,item:Entry,example:Example,source:'workspace'|'registry'|'both'='both') {
  const {code,registryCode,...metadata}=example;
  return {release:catalog.release,...metadata,componentId:example.componentId??item.id,source,
    ...(source!=='registry'?{code}:{}),...(source!=='workspace'?{registryCode}:{}),
    entry:{id:item.id,kind:item.kind,title:item.title,documentationUrl:item.documentationUrl},
    installation:catalog.installation,resourceUri:`bld8://example/${example.id}`};
}

export interface SearchOptions {
  query?: string; kind?: Entry['kind']; category?: string; offset?: number; limit?: number;
}

export function searchCatalog(catalog: Catalog, options: SearchOptions) {
  const terms = (options.query ?? '').trim().toLocaleLowerCase('en-US').split(/\s+/u).filter(Boolean);
  const matches = catalog.entries.filter(item => {
    if (options.kind && item.kind !== options.kind) return false;
    if (options.category && item.category.toLocaleLowerCase('en-US') !== options.category.toLocaleLowerCase('en-US')) return false;
    const haystack = `${item.id} ${item.title} ${item.category} ${item.description} ${item.notes}`.toLocaleLowerCase('en-US');
    return terms.every(term => haystack.includes(term));
  });
  // Exact title/ID matches lead; equal scores keep the source catalog order.
  const needle = (options.query ?? '').trim().toLocaleLowerCase('en-US');
  matches.sort((a, b) => Number(b.id === needle || b.title.toLocaleLowerCase('en-US') === needle) - Number(a.id === needle || a.title.toLocaleLowerCase('en-US') === needle));
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 20;
  return {
    license:catalog.license,provenance:catalog.provenance,notices:catalog.notices,
    release: catalog.release, total: matches.length, offset, limit,
    nextOffset: offset + limit < matches.length ? offset + limit : null,
    entries: matches.slice(offset, offset + limit).map(summarizeEntry),
  };
}

export function findEntry(catalog: Catalog, entryId: string, kind?: Entry['kind']): Entry | undefined {
  const matches = catalog.entries.filter(item => item.id === entryId && (!kind || item.kind === kind));
  return matches.length === 1 ? matches[0] : undefined;
}

export function entryDetails(catalog: Catalog, item: Entry, options: {
  section: 'overview' | 'api' | 'example' | 'all'; includeNative: boolean; offset: number; limit: number;
}) {
  const result: Record<string, unknown> = { release: catalog.release, ...summarizeEntry(item), license:item.license,provenance:item.provenance,notices:item.notices };
  if (options.section === 'overview' || options.section === 'all') {
    Object.assign(result, { notes: item.notes, installation: catalog.installation, registry: item.registry });
  }
  if (options.section === 'example' || options.section === 'all') {result.example = item.example;result.examples=item.examples;}
  if (options.section === 'api' || options.section === 'all') {
    const properties = item.api.flatMap(definition => definition.properties
      .filter(prop => options.includeNative || !prop.native)
      .map(prop => ({ definition: definition.name, ...prop })));
    result.api = {
      definitions: item.api.map(({ name, kind, definition }) => ({ name, kind, ...(definition?{definition}:{}) })), includeNative: options.includeNative,
      total: properties.length, offset: options.offset, limit: options.limit,
      nextOffset: options.offset + options.limit < properties.length ? options.offset + options.limit : null,
      properties: properties.slice(options.offset, options.offset + options.limit),
    };
  }
  return result;
}
