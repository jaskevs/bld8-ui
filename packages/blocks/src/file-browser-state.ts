/** File metadata only. A host service owns contents, access control and persistence. */
export interface FileBrowserEntry {
  id: string;
  label: string;
  kind: 'folder' | 'file';
  children?: readonly FileBrowserEntry[];
  /** True with omitted children means the folder has not been fetched yet. */
  hasChildren?: boolean;
  disabled?: boolean;
  description?: string;
  /** A non-negative byte count, when known. */
  size?: number;
  /** Deterministic display text supplied by the host, not parsed in the browser. */
  modified?: string;
  mediaType?: string;
}

/** Reject malformed, cyclic, excessively deep and duplicate-ID service responses. */
export function validateFileBrowserEntries(value: unknown, unavailableIds: ReadonlySet<string> = new Set()): asserts value is readonly FileBrowserEntry[] {
  const ids = new Set(unavailableIds), objects = new Set<object>();
  let count = unavailableIds.size;
  const shortText = (input: unknown, max: number, required = false) => input === undefined ? !required : typeof input === 'string' && input.length <= max && (!required || input.trim().length > 0);
  const visit = (nodes: unknown, depth: number) => {
    if (!Array.isArray(nodes) || depth > 32) throw new Error('Folder data must contain a bounded list of file metadata.');
    for (const node of nodes) {
      if (++count > 2000 || typeof node !== 'object' || node === null || Array.isArray(node) || objects.has(node)) throw new Error('Folder data contains an unsupported structure.');
      objects.add(node);
      const item = node as Record<string, unknown>;
      if (!shortText(item.id, 200, true) || !shortText(item.label, 200, true) || (item.kind !== 'folder' && item.kind !== 'file') || ids.has(item.id as string)) throw new Error('File and folder IDs must be unique and names must be present.');
      ids.add(item.id as string);
      if (!shortText(item.description, 500) || !shortText(item.modified, 200) || !shortText(item.mediaType, 120) || (item.disabled !== undefined && typeof item.disabled !== 'boolean') || (item.hasChildren !== undefined && typeof item.hasChildren !== 'boolean')) throw new Error('Folder metadata contains an unsupported value.');
      if (item.size !== undefined && (typeof item.size !== 'number' || !Number.isFinite(item.size) || item.size < 0)) throw new Error('File sizes must be finite, non-negative byte counts.');
      if (item.kind === 'file' && (item.children !== undefined || item.hasChildren === true)) throw new Error('Files cannot contain child entries.');
      if (item.children !== undefined) visit(item.children, depth + 1);
    }
  };
  visit(value, 0);
}

export function mergeFileBrowserChildren(entries: readonly FileBrowserEntry[], cache: ReadonlyMap<string, readonly FileBrowserEntry[]>): FileBrowserEntry[] {
  return entries.map(entry => {
    const children = entry.children ?? cache.get(entry.id);
    return children === undefined ? entry : { ...entry, children: mergeFileBrowserChildren(children, cache) };
  });
}

export function findFileBrowserPath(entries: readonly FileBrowserEntry[], id: string): FileBrowserEntry[] | null {
  for (const entry of entries) {
    if (entry.id === id) return [entry];
    const child = entry.children && findFileBrowserPath(entry.children, id);
    if (child) return [entry, ...child];
  }
  return null;
}

export function collectFileBrowserIds(entries: readonly FileBrowserEntry[]): Set<string> {
  const ids = new Set<string>();
  const visit = (nodes: readonly FileBrowserEntry[]) => { for (const node of nodes) { ids.add(node.id); if (node.children) visit(node.children); } };
  visit(entries);
  return ids;
}

export type FileBrowserSort = 'name-asc' | 'name-desc' | 'size-asc';
export function sortFileBrowserEntries(entries: readonly FileBrowserEntry[], query: string, sort: FileBrowserSort): FileBrowserEntry[] {
  const term = query.trim().toLocaleLowerCase('en');
  return entries.filter(entry => !term || [entry.label, entry.description, entry.mediaType].some(value => value?.toLocaleLowerCase('en').includes(term))).slice().sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    const byName = a.label.localeCompare(b.label, 'en', { numeric: true, sensitivity: 'base' }) || a.id.localeCompare(b.id, 'en');
    if (sort === 'size-asc') return (a.size ?? Number.MAX_VALUE) - (b.size ?? Number.MAX_VALUE) || byName;
    return sort === 'name-desc' ? -byName : byName;
  });
}

export function formatFileBrowserSize(size: number | undefined): string {
  if (size === undefined) return '—';
  if (size === 0) return '0 B';
  if (size < 1024) return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(size) + ' B';
  if (size >= 1024 ** 6) return size.toExponential(1).replace('.0e', 'e') + ' B';
  const unit = Math.min(5, Math.floor(Math.log(size) / Math.log(1024)));
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(size / 1024 ** unit) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB', 'PB'][unit];
}
