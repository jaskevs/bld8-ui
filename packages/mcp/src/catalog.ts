import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod/v4';

const text = z.string().max(200_000);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const entryKind = z.enum(['component', 'block', 'template']);
const property = z.object({
  name: text, type: text, required: z.boolean(), defaultValue: text.nullish(),
  description: text, native: z.boolean().optional(),
});
const entry = z.object({
  id, kind: entryKind, title: text, category: text, description: text, notes: text,
  documentationUrl: text, markdownUrl: text,
  registry: z.object({
    name: id, url: text, dependencies: z.array(text).max(100), registryDependencies: z.array(text).max(200),
    files: z.array(z.object({ path: text, target: text.optional(), type: text })).max(500),
  }).nullable(),
  example: z.object({ language: z.literal('tsx'), code: text, complete: z.boolean() }),
  api: z.array(z.object({ name: text, kind: text, definition:text.optional(), properties: z.array(property).max(2000) })).max(100),
});
const guide = z.object({ id, title: text, url: text, markdownUrl: text, content: text });
const schema = z.object({
  schemaVersion: z.literal(1), release: z.object({ version: text, status: text, snapshot: text }),
  homepage: text, license: z.literal('MIT'),
  installation: z.object({ requirements: z.array(text).max(30), notes: z.array(text).max(30), registryBase: text }),
  entries: z.array(entry).max(2000), guides: z.array(guide).max(100),
});

export type Catalog = z.infer<typeof schema>;
export type Entry = Catalog['entries'][number];

export function validateCatalog(value: unknown): Catalog {
  const result = schema.parse(value);
  const entryKeys = result.entries.map(item => `${item.kind}:${item.id}`);
  const guideKeys = result.guides.map(item => item.id);
  if (new Set(entryKeys).size !== entryKeys.length || new Set(guideKeys).size !== guideKeys.length) {
    throw new Error('Duplicate documentation identifiers.');
  }
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
  if (details.size > 25_000_000) throw new Error('The generated documentation catalog exceeds its size limit.');
  return validateCatalog(JSON.parse(await readFile(catalogPath, 'utf8')));
}

export function summarizeEntry(item: Entry) {
  return {
    id: item.id, kind: item.kind, title: item.title, category: item.category, description: item.description,
    documentationUrl: item.documentationUrl, markdownUrl: item.markdownUrl, registryUrl: item.registry?.url ?? null,
  };
}

export function catalogSummary(catalog: Catalog) {
  return {
    schemaVersion: catalog.schemaVersion, release: catalog.release, homepage: catalog.homepage,
    license: catalog.license, installation: catalog.installation, entries: catalog.entries.map(summarizeEntry),
    guides: catalog.guides.map(({ id, title, url, markdownUrl }) => ({ id, title, url, markdownUrl })),
  };
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
  const result: Record<string, unknown> = { release: catalog.release, ...summarizeEntry(item) };
  if (options.section === 'overview' || options.section === 'all') {
    Object.assign(result, { notes: item.notes, installation: catalog.installation, registry: item.registry });
  }
  if (options.section === 'example' || options.section === 'all') result.example = item.example;
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
