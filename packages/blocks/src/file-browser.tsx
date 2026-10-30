'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, ChevronRight, File, FileCode2, FileImage, FileText, Folder, FolderOpen, Layers, RefreshCw } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, Field, Icon, Input, Select, Skeleton, Tree, useReducedMotionPreference, type TreeNode } from '@bld8/ui';
import { collectFileBrowserIds, findFileBrowserPath, formatFileBrowserSize, mergeFileBrowserChildren, sortFileBrowserEntries, validateFileBrowserEntries, type FileBrowserEntry, type FileBrowserSort } from './file-browser-state.js';

export type { FileBrowserEntry, FileBrowserSort } from './file-browser-state.js';

export interface FileBrowserProps {
  /** Stable globally unique IDs. Changing the array starts a new browsing session. */
  entries?: readonly FileBrowserEntry[];
  /** Lazy metadata only. Honour the signal; stale or cancelled results are ignored. */
  loadChildren?: (parentId: string, context: { signal: AbortSignal }) => Promise<readonly FileBrowserEntry[]>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  defaultFolderId?: string;
  defaultExpandedIds?: readonly string[];
  onSelectionChange?: (entry: FileBrowserEntry | null) => void;
  className?: string;
}

export const fileBrowserSample: readonly FileBrowserEntry[] = [
  { id: 'workspace', label: 'Workspace', kind: 'folder', description: 'The current interface study.', modified: '29 Oct 2026', children: [
    { id: 'projects', label: 'Projects', kind: 'folder', modified: '29 Oct 2026', children: [
      { id: 'interface-kit', label: 'Interface kit', kind: 'folder', modified: '28 Oct 2026', children: [
        { id: 'interaction-notes', label: 'interaction-notes.md', kind: 'file', size: 4380, mediaType: 'text/markdown', modified: '28 Oct 2026', description: 'Notes on focus, spacing and the small transitions.' },
        { id: 'wireframe', label: 'wireframe.png', kind: 'file', size: 684032, mediaType: 'image/png', modified: '27 Oct 2026', description: 'An early layout reference.' },
      ] },
      { id: 'project-brief', label: 'project-brief.pdf', kind: 'file', size: 145408, mediaType: 'application/pdf', modified: '26 Oct 2026' },
      { id: 'empty-folder', label: 'Ideas', kind: 'folder', children: [], modified: '25 Oct 2026', description: 'A little room for the next idea.' },
    ] },
    { id: 'archive', label: 'Archive', kind: 'folder', hasChildren: true, modified: '20 Oct 2026', description: 'Earlier references, loaded when needed.' },
    { id: 'readme', label: 'README.md', kind: 'file', size: 1280, mediaType: 'text/markdown', modified: '29 Oct 2026', description: 'A short introduction to the workspace.' },
  ] },
];

/** Abortable sample metadata; no request is made to a storage service. */
export function loadSampleFileChildren(parentId: string, { signal }: { signal: AbortSignal }): Promise<readonly FileBrowserEntry[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const cancel = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      if (parentId !== 'archive') { reject(new Error('This sample does not contain that folder.')); return; }
      resolve([
        { id: 'archived-brief', label: 'archived-brief.pdf', kind: 'file', size: 96256, mediaType: 'application/pdf', modified: '20 Oct 2026', description: 'The previous project brief.' },
        { id: 'earlier-notes', label: 'earlier-notes.txt', kind: 'file', size: 2048, mediaType: 'text/plain', modified: '19 Oct 2026' },
      ]);
    }, 650);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

function entryType(entry: FileBrowserEntry): string {
  if (entry.kind === 'folder') return 'Folder';
  if (entry.mediaType === 'text/markdown' || /\.md$/i.test(entry.label)) return 'Markdown';
  if (entry.mediaType?.startsWith('image/')) return 'Image';
  if (entry.mediaType === 'application/pdf') return 'PDF';
  if (entry.mediaType?.startsWith('text/')) return 'Text';
  return 'File';
}
function entryIcon(entry: FileBrowserEntry, open = false) {
  if (entry.kind === 'folder') return open ? FolderOpen : Folder;
  const type = entryType(entry);
  return type === 'Image' ? FileImage : type === 'Markdown' ? FileCode2 : type === 'PDF' || type === 'Text' ? FileText : File;
}
function folderTree(entries: readonly FileBrowserEntry[]): TreeNode[] {
  return entries.filter(entry => entry.kind === 'folder').map(entry => ({
    id: entry.id, label: entry.label, disabled: entry.disabled, icon: Folder,
    children: entry.children === undefined ? undefined : folderTree(entry.children),
    hasChildren: entry.children === undefined ? entry.hasChildren : entry.children.some(child => child.kind === 'folder'),
    description: entry.children === undefined && entry.hasChildren ? 'Loads on demand' : undefined,
  }));
}
const easing = [.16, 1, .3, 1] as const;

export function FileBrowser({ entries = fileBrowserSample, loadChildren, loading = false, error, onRetry, defaultFolderId, defaultExpandedIds, onSelectionChange, className }: FileBrowserProps) {
  const reduced = useReducedMotionPreference();
  const [folderId, setFolderId] = useState<string | null>(() => defaultFolderId ?? (entries === fileBrowserSample ? 'workspace' : null));
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>(() => [...(defaultExpandedIds ?? (entries === fileBrowserSample ? ['workspace', 'projects'] : []))]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<FileBrowserSort>('name-asc');
  const heading = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const focusIntent = useRef<{ origin: HTMLElement; target: 'heading' | 'search'; source: unknown } | null>(null);
  const [focusVersion, setFocusVersion] = useState(0);
  const [, refresh] = useState(0);
  const source = useMemo(() => {
    let invalid = false;
    try { validateFileBrowserEntries(entries); } catch { invalid = true; }
    return {
      entries: invalid ? [] as readonly FileBrowserEntry[] : entries,
      invalid,
      loader: loadChildren ?? (entries === fileBrowserSample ? loadSampleFileChildren : undefined),
      cache: new Map<string, readonly FileBrowserEntry[]>(),
      errors: new Map<string, string>(),
      pending: new Map<string, { controller: AbortController }>(),
    };
  }, [entries, loadChildren]);
  const currentSource = useRef(source);
  currentSource.current = source;
  const mounted = useRef(false);
  const tree = mergeFileBrowserChildren(source.entries, source.cache);
  const path = folderId ? findFileBrowserPath(tree, folderId) : null;
  const folder = path?.at(-1)?.kind === 'folder' ? path.at(-1)! : null;
  const activeFolderId = folder?.id ?? null;
  const contents = folder ? folder.children ?? [] : tree;
  const displayed = sortFileBrowserEntries(contents, query, sort);
  const selectedFile = contents.find(entry => entry.id === selectedFileId && entry.kind === 'file') ?? null;
  const detail = selectedFile ?? folder;
  const pending = activeFolderId ? source.pending.has(activeFolderId) : false;
  const folderError = activeFolderId ? source.errors.get(activeFolderId) : undefined;
  const unloaded = !!folder && folder.children === undefined && folder.hasChildren === true;
  const title = folder?.label ?? 'Files';

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    setFolderId(defaultFolderId ?? (entries === fileBrowserSample ? 'workspace' : null));
    setExpanded([...(defaultExpandedIds ?? (entries === fileBrowserSample ? ['workspace', 'projects'] : []))]);
    setSelectedFileId(null); setQuery('');
    return () => { for (const record of source.pending.values()) record.controller.abort(); source.pending.clear(); };
    // Initial navigation belongs to each data/loader session, not each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Only an action that owns focus may hand it off. Async results never move it.
  function handoffFocus(origin: HTMLElement, target: 'heading' | 'search') {
    if (!origin.contains(origin.ownerDocument.activeElement)) return;
    focusIntent.current = { origin, target, source };
    setFocusVersion(value => value + 1);
  }
  useLayoutEffect(() => {
    const intent = focusIntent.current;
    focusIntent.current = null;
    if (!intent || intent.source !== source) return;
    const active = intent.origin.ownerDocument.activeElement;
    if (active !== intent.origin && !(active === intent.origin.ownerDocument.body && !intent.origin.isConnected)) return;
    (intent.target === 'search' ? searchInput.current : heading.current)?.focus({ preventScroll: true });
  }, [focusVersion, source]);

  function repaint() { if (mounted.current && currentSource.current === source) refresh(value => value + 1); }
  function requestChildren(id: string) {
    if (loading || error || source.invalid || source.pending.has(id)) return;
    const parent = findFileBrowserPath(mergeFileBrowserChildren(source.entries, source.cache), id)?.at(-1);
    if (!parent || parent.disabled || parent.kind !== 'folder' || parent.children !== undefined || !parent.hasChildren) return;
    if (!source.loader) {
      source.errors.set(id, 'This folder needs a loadChildren callback from your application.'); repaint(); return;
    }
    source.errors.delete(id);
    const record = { controller: new AbortController() };
    source.pending.set(id, record); repaint();
    const stillCurrent = () => mounted.current && currentSource.current === source && source.pending.get(id) === record && !record.controller.signal.aborted;
    Promise.resolve().then(() => source.loader!(id, { signal: record.controller.signal })).then(children => {
      if (!stillCurrent()) return;
      const existing = collectFileBrowserIds(mergeFileBrowserChildren(source.entries, source.cache));
      try {
        validateFileBrowserEntries(children, existing);
        const candidate = new Map(source.cache); candidate.set(id, children);
        validateFileBrowserEntries(mergeFileBrowserChildren(source.entries, candidate));
      }
      catch { source.errors.set(id, 'The folder returned invalid metadata. Check its names, unique IDs and structure.'); return; }
      source.cache.set(id, children);
    }, () => { if (stillCurrent()) source.errors.set(id, 'The connection was interrupted. Your other folders are still available.'); }).finally(() => {
      if (source.pending.get(id) === record) { source.pending.delete(id); repaint(); }
    });
  }
  function selectFolder(id: string | null) {
    if (loading || error || source.invalid) return;
    const nextPath = id ? findFileBrowserPath(tree, id) : null;
    const next = nextPath?.at(-1);
    if (id && (!next || next.disabled || next.kind !== 'folder')) return;
    setFolderId(id); setSelectedFileId(null); setQuery('');
    if (nextPath) setExpanded(previous => [...new Set([...previous, ...nextPath.map(entry => entry.id)])]);
    if (id) requestChildren(id);
    onSelectionChange?.(next ?? null);
  }
  function expandFolders(ids: string[]) {
    setExpanded(ids);
    for (const [id, record] of source.pending) {
      const nodePath = findFileBrowserPath(tree, id);
      if (!nodePath?.every(node => node.kind !== 'folder' || ids.includes(node.id))) {
        source.pending.delete(id); record.controller.abort();
      }
    }
    repaint();
  }
  const busy = loading || pending;
  const blocked = loading || !!error || source.invalid;
  const detailsPath = selectedFile ? [...(path ?? []), selectedFile] : path ?? [];
  const contentsLabel = `${displayed.length} ${displayed.length === 1 ? 'item' : 'items'}${query.trim() ? ' found' : ''}`;
  const contentState = source.invalid ? 'invalid' : error ? 'error' : busy ? 'loading' : folderError ? 'folder-error' : unloaded ? 'unloaded' : displayed.length ? 'files' : query.trim() ? 'no-results' : 'empty';

  return <section className={['bblocks-panel', 'bblocks-files', className].filter(Boolean).join(' ')} aria-label="File browser" aria-busy={loading || undefined}>
    <div className="bblocks-heading bblocks-files-heading"><div><p className="bblocks-kicker">A PLACE FOR THE DETAILS</p><h2>Everything in its place.</h2><p className="bblocks-muted">Browse the folders. Keep the context close.</p></div><Badge>{entries === fileBrowserSample ? 'Sample metadata' : 'File metadata'}</Badge></div>
    <div className="bblocks-files-layout">
      <aside className="bblocks-files-sidebar" aria-label="Folder navigation">
        <div className="bblocks-files-sidebar-heading"><Icon icon={Layers} size={16} /><span>Workspace</span></div>
        <p className="bblocks-files-keyboard">Arrow keys to explore. Enter to select.</p>
        {folderTree(tree).length ? <Tree label="Workspace folders" nodes={folderTree(tree)} expandedIds={expanded} onExpandedChange={expandFolders} selectedId={activeFolderId} onSelectedChange={selectFolder} onLoadChildren={requestChildren} loadingIds={[...source.pending.keys()]} errors={Object.fromEntries(source.errors)} disabled={blocked} /> : <p className="bblocks-files-sidebar-empty">{source.invalid ? 'Folder data is unavailable.' : 'No folders yet.'}</p>}
        <div className="bblocks-files-sidebar-note"><span className="bblocks-files-local-dot" aria-hidden="true" /><span>Metadata only. No file contents.</span></div>
      </aside>
      <div className="bblocks-files-main">
        <div className="bblocks-files-location"><nav aria-label="Folder path"><ol><li><button type="button" onClick={event => { handoffFocus(event.currentTarget, 'heading'); selectFolder(null); }} disabled={blocked} aria-label="Show all files" aria-current={!folder ? 'page' : undefined}>Files</button></li>{path?.map((entry, index) => <li key={entry.id}><Icon icon={ChevronRight} size={12} />{index === path.length - 1 ? <span aria-current="page">{entry.label}</span> : <button type="button" aria-label={'Show ' + entry.label} disabled={blocked} onClick={event => { handoffFocus(event.currentTarget, 'heading'); selectFolder(entry.id); }}>{entry.label}</button>}</li>)}</ol></nav><Button variant="ghost" size="sm" leadingIcon={ArrowUp} aria-label="Up one folder" disabled={blocked || !folder} onClick={event => { handoffFocus(event.currentTarget, 'heading'); selectFolder(path && path.length > 1 ? path[path.length - 2].id : null); }}>Up</Button></div>
        <div className="bblocks-files-title"><div><h3 ref={heading} tabIndex={-1}>{title}</h3><p>{folder?.description ?? 'Folders and files from this workspace.'}</p></div><span className="bblocks-files-count" role="status">{busy ? 'Loading…' : blocked || folderError ? 'Unavailable' : unloaded ? 'Not loaded' : contentsLabel}</span></div>
        <div className="bblocks-files-toolbar"><Field label="Search this folder"><Input ref={searchInput} type="search" placeholder="Find a file or folder…" value={query} onChange={event => setQuery(event.target.value)} disabled={blocked || pending || unloaded} /></Field><Select label="Sort files" value={sort} options={[{ value: 'name-asc', label: 'Name A–Z' }, { value: 'name-desc', label: 'Name Z–A' }, { value: 'size-asc', label: 'Size small–large' }]} onValueChange={value => { if (value === 'name-asc' || value === 'name-desc' || value === 'size-asc') setSort(value); }} disabled={blocked || pending || unloaded} /></div>
        <div className="bblocks-files-content" aria-busy={busy || undefined} data-state={contentState} data-reduced-motion={reduced}>
          <motion.div key={(activeFolderId ?? 'root') + ':' + contentState} className="bblocks-files-content-body" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .2, ease: easing }}>
          {source.invalid ? <div className="bblocks-files-notice"><Alert title="File data could not be read" tone="neutral" live>Provide unique IDs, named files and folders, and valid metadata.</Alert>{onRetry && <Button variant="secondary" leadingIcon={RefreshCw} onClick={onRetry}>Retry workspace</Button>}</div>
            : error ? <div className="bblocks-files-notice"><Alert title="Workspace could not be loaded" tone="neutral" live>{error}</Alert>{onRetry && <Button variant="secondary" leadingIcon={RefreshCw} onClick={onRetry}>Retry workspace</Button>}</div>
            : busy ? <div className="bblocks-files-loading"><p role="status">Loading {loading ? 'workspace' : 'folder'}…</p>{[1, 2, 3, 4].map(item => <div key={item}><Skeleton width="24px" height="24px" /><Skeleton width={item % 2 ? '56%' : '42%'} /><Skeleton width="48px" /></div>)}</div>
            : folderError ? <div className="bblocks-files-notice"><Alert title="Folder could not be loaded" tone="neutral" live>{folderError}</Alert>{source.loader && <Button variant="secondary" leadingIcon={RefreshCw} onClick={event => { handoffFocus(event.currentTarget, 'heading'); if (activeFolderId) requestChildren(activeFolderId); }}>Retry folder</Button>}</div>
            : unloaded ? <EmptyState title="This folder is ready to load." action={<Button variant="secondary" onClick={event => { handoffFocus(event.currentTarget, 'heading'); if (activeFolderId) requestChildren(activeFolderId); }}>Load folder</Button>}>Its metadata is requested only when you open it.</EmptyState>
            : displayed.length === 0 ? <EmptyState title={query.trim() ? 'No matching files.' : 'Nothing in this folder yet.'} action={query.trim() ? <Button variant="secondary" onClick={event => { handoffFocus(event.currentTarget, 'search'); setQuery(''); }}>Clear file search</Button> : undefined}>{query.trim() ? 'Try another name or clear the search.' : 'New metadata from your application will appear here.'}</EmptyState>
            : <table className="bblocks-files-table"><caption className="bui-sr-only">{'Files in ' + title}</caption><thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col" className="bblocks-files-size">Size</th><th scope="col" className="bblocks-files-updated">Updated</th></tr></thead><tbody>{displayed.map(entry => <tr key={entry.id} data-selected={selectedFileId === entry.id || undefined} data-disabled={entry.disabled || undefined}><td><button type="button" disabled={entry.disabled} className="bblocks-files-name" aria-label={(entry.kind === 'folder' ? 'Open ' : 'Inspect ') + entry.label} aria-pressed={entry.kind === 'file' ? selectedFileId === entry.id : undefined} onClick={event => {
              if (entry.kind === 'folder') { handoffFocus(event.currentTarget, 'heading'); selectFolder(entry.id); }
              else { setSelectedFileId(entry.id); onSelectionChange?.(entry); }
            }}><span className="bblocks-files-entry-icon"><Icon icon={entryIcon(entry)} size={18} /></span><span>{entry.label}</span>{entry.kind === 'folder' && <Icon icon={ChevronRight} size={14} />}</button></td><td className="bblocks-files-type">{entryType(entry)}</td><td className="bblocks-files-size">{entry.kind === 'folder' ? '—' : formatFileBrowserSize(entry.size)}</td><td className="bblocks-files-updated">{entry.modified ?? '—'}</td></tr>)}</tbody></table>}
          </motion.div>
        </div>
        <div className="bblocks-files-footer"><span>{entries === fileBrowserSample ? 'Illustrative metadata. File contents are not stored or opened.' : 'File contents and storage are managed by your application.'}</span>{!blocked && !busy && !unloaded && <span>{contents.filter(entry => entry.kind === 'folder').length} {contents.filter(entry => entry.kind === 'folder').length === 1 ? 'folder' : 'folders'} · {contents.filter(entry => entry.kind === 'file').length} {contents.filter(entry => entry.kind === 'file').length === 1 ? 'file' : 'files'}</span>}</div>
      </div>
      <section className="bblocks-files-inspector" aria-label="File details"><div className="bblocks-files-inspector-heading"><span>Details</span><Badge>Metadata</Badge></div><AnimatePresence initial={false} mode="wait"><motion.div key={detail?.id ?? 'none'} className="bblocks-files-detail" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -3 }} transition={{ duration: reduced ? 0 : .18, ease: easing }}>
        {detail && !blocked ? <><div className="bblocks-files-detail-icon" aria-hidden="true"><Icon icon={entryIcon(detail, true)} size={28} /></div><h3>{detail.label}</h3><p className="bblocks-files-detail-copy">{detail.description ?? (detail.kind === 'folder' ? 'A folder in this workspace.' : 'Select another file to compare its details.')}</p><dl><div><dt>Type</dt><dd>{entryType(detail)}</dd></div>{detail.kind === 'file' && <div><dt>Size</dt><dd>{formatFileBrowserSize(detail.size)}</dd></div>}<div><dt>Updated</dt><dd>{detail.modified ?? 'Not provided'}</dd></div><div className="bblocks-files-detail-location"><dt>Location</dt><dd>{detailsPath.slice(0, -1).map(entry => entry.label).join(' / ') || 'Files'}</dd></div></dl><p className="bblocks-files-detail-note">Details describe the file. This example does not open its contents.</p></> : <><div className="bblocks-files-detail-icon" aria-hidden="true"><Icon icon={FolderOpen} size={28} /></div><h3>Keep the context.</h3><p className="bblocks-files-detail-copy">Select a file or folder to see its metadata here.</p></>}
      </motion.div></AnimatePresence></section>
    </div>
  </section>;
}
