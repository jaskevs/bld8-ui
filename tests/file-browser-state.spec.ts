import { expect, test } from '@playwright/test';
import { collectFileBrowserIds, findFileBrowserPath, formatFileBrowserSize, mergeFileBrowserChildren, sortFileBrowserEntries, validateFileBrowserEntries, type FileBrowserEntry } from '../packages/blocks/src/file-browser-state';

const sample: readonly FileBrowserEntry[] = [
  { id: 'root', label: 'Workspace', kind: 'folder', children: [
    { id: 'lazy', label: 'Archive', kind: 'folder', hasChildren: true },
    { id: 'known', label: 'notes2.txt', kind: 'file', size: 2048 },
    { id: 'unknown', label: 'notes10.txt', kind: 'file' },
    { id: 'zero', label: 'notes1.txt', kind: 'file', size: 0 },
  ] },
];

test('file metadata validates unique IDs globally and preserves empty versus unloaded folders', () => {
  expect(() => validateFileBrowserEntries(sample)).not.toThrow();
  expect(() => validateFileBrowserEntries([{ id: 'empty', label: 'Empty', kind: 'folder', children: [] }])).not.toThrow();
  expect(() => validateFileBrowserEntries([{ id: 'root', label: 'Duplicate', kind: 'file' }], collectFileBrowserIds(sample))).toThrow(/unique/);
  expect(() => validateFileBrowserEntries([{ id: 'a', label: 'A', kind: 'folder', children: [{ id: 'b', label: 'B', kind: 'file' }] }, { id: 'b', label: 'Again', kind: 'file' }])).toThrow(/unique/);
});

test('file metadata rejects malformed values and impossible file children', () => {
  for (const value of [null, {}, [{ id: '', label: 'File', kind: 'file' }], [{ id: 'a', label: '  ', kind: 'file' }], [{ id: 'a', label: 'File', kind: 'blob' }], [{ id: 'a', label: 'File', kind: 'file', children: [] }], [{ id: 'a', label: 'File', kind: 'file', hasChildren: true }], [{ id: 'a', label: 'File', kind: 'file', size: Number.NaN }], [{ id: 'a', label: 'File', kind: 'file', size: -1 }], [{ id: 'a', label: 'File', kind: 'file', size: Infinity }], [{ id: 'a', label: 'File', kind: 'file', disabled: 'true' }], [{ id: 'a', label: 'File', kind: 'file', modified: new Date() }]]) {
    expect(() => validateFileBrowserEntries(value)).toThrow();
  }
});

test('cyclic, shared and excessively deep metadata cannot enter the cache', () => {
  const cycle = { id: 'a', label: 'A', kind: 'folder', children: [] as unknown[] }; cycle.children.push(cycle);
  expect(() => validateFileBrowserEntries([cycle])).toThrow(/structure/);
  let deep: FileBrowserEntry = { id: 'end', label: 'End', kind: 'file' };
  for (let index = 0; index < 34; index++) deep = { id: 'deep-' + index, label: 'Level', kind: 'folder', children: [deep] };
  expect(() => validateFileBrowserEntries([deep])).toThrow(/bounded/);
  const shared = { id: 'shared', label: 'Shared', kind: 'file' };
  expect(() => validateFileBrowserEntries([shared, shared])).toThrow();
});

test('lazy response bounds include already known metadata', () => {
  const response = Array.from({ length: 2000 }, (_, index): FileBrowserEntry => ({ id: 'file-' + index, label: 'File ' + index, kind: 'file' }));
  expect(() => validateFileBrowserEntries(response)).not.toThrow();
  expect(() => validateFileBrowserEntries(response, new Set(['existing']))).toThrow(/structure/);
  response.push({ id: 'extra', label: 'Extra', kind: 'file' });
  expect(() => validateFileBrowserEntries(response)).toThrow(/structure/);
});

test('merging lazy children is immutable and an explicit newer loaded list wins', () => {
  const children: readonly FileBrowserEntry[] = [{ id: 'archived', label: 'Earlier.txt', kind: 'file' }];
  const cache = new Map([['lazy', children], ['root', [{ id: 'stale-root', label: 'Stale', kind: 'file' as const }]]]);
  const merged = mergeFileBrowserChildren(sample, cache);
  expect(sample[0].children![0].children).toBeUndefined();
  expect(findFileBrowserPath(merged, 'archived')?.map(entry => entry.id)).toEqual(['root', 'lazy', 'archived']);
  expect(findFileBrowserPath(merged, 'stale-root')).toBeNull();
  const replaced: readonly FileBrowserEntry[] = [{ id: 'lazy', label: 'Archive', kind: 'folder', children: [] }];
  expect(mergeFileBrowserChildren(replaced, cache)[0].children).toEqual([]);
});

test('whole-tree validation rejects cached children that exceed total depth', () => {
  let children: FileBrowserEntry = { id: 'leaf', label: 'Leaf', kind: 'file' };
  for (let index = 0; index < 20; index++) children = { id: 'child-' + index, label: 'Child', kind: 'folder', children: [children] };
  let root: FileBrowserEntry = { id: 'load-here', label: 'Load here', kind: 'folder', hasChildren: true };
  for (let index = 0; index < 20; index++) root = { id: 'ancestor-' + index, label: 'Ancestor', kind: 'folder', children: [root] };
  expect(() => validateFileBrowserEntries([root])).not.toThrow();
  expect(() => validateFileBrowserEntries([children])).not.toThrow();
  const candidate = mergeFileBrowserChildren([root], new Map([['load-here', [children]]]));
  expect(() => validateFileBrowserEntries(candidate)).toThrow(/bounded/);
});

test('file path lookup and IDs describe only the loaded tree', () => {
  expect(findFileBrowserPath(sample, 'known')?.map(entry => entry.label)).toEqual(['Workspace', 'notes2.txt']);
  expect(findFileBrowserPath(sample, 'missing')).toBeNull();
  expect([...collectFileBrowserIds(sample)]).toEqual(['root', 'lazy', 'known', 'unknown', 'zero']);
});

test('folder sorting is stable, numeric and places unknown sizes after known ones', () => {
  const children = sample[0].children!;
  expect(sortFileBrowserEntries(children, '', 'name-asc').map(entry => entry.id)).toEqual(['lazy', 'zero', 'known', 'unknown']);
  expect(sortFileBrowserEntries(children, '', 'name-desc').map(entry => entry.id)).toEqual(['lazy', 'unknown', 'known', 'zero']);
  expect(sortFileBrowserEntries(children, '', 'size-asc').map(entry => entry.id)).toEqual(['lazy', 'zero', 'known', 'unknown']);
  expect(sortFileBrowserEntries(children, '  NOTES2  ', 'name-asc').map(entry => entry.id)).toEqual(['known']);
  expect(children.map(entry => entry.id)).toEqual(['lazy', 'known', 'unknown', 'zero']);
});

test('size labels distinguish zero from unknown and stay bounded for huge byte counts', () => {
  expect(formatFileBrowserSize(undefined)).toBe('—');
  expect(formatFileBrowserSize(0)).toBe('0 B');
  expect(formatFileBrowserSize(1024)).toBe('1 KB');
  expect(formatFileBrowserSize(2048)).toBe('2 KB');
  expect(formatFileBrowserSize(1024 ** 4)).toBe('1 TB');
  expect(formatFileBrowserSize(Number.MAX_VALUE).length).toBeLessThan(16);
});
