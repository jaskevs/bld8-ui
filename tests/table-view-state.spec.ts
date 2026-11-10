import { test, expect } from '@playwright/test';
import {
  createTableViewState, normalizeTableViewState, parseTableViewState, serializeTableViewState, tableViewKey,
  type TableViewOptions, type TableViewState,
} from '../packages/ui/src/table-view-state';

const options: TableViewOptions = {
  columns: [{ key: 'id', minWidth: 80, pinned: 'start' }, { key: 'title', hideable: false, minWidth: 180 }, { key: 'status', sortable: false }, { key: 'owner' }],
  filterKeys: ['status', 'owner'],
  pageSizes: [10, 25, 50],
};
const saved = (): TableViewState => ({
  ...createTableViewState(options),
  query: { search: 'dialog', filters: { status: 'review', owner: 'maya' }, sort: { key: 'title', descending: true }, pageSize: 25 },
  columnOrderKeys: ['status', 'title', 'id', 'owner'],
  visibleColumnKeys: ['status', 'title', 'id'],
  columnWidths: { title: 320, id: 112 },
  columnPinning: { status: 'start', id: 'end' },
  density: 'compact',
});

test('saved presentation round trips without leaking selection, current page or record data', () => {
  const input = { ...saved(), selectedKeys: ['private-record-id'], rowOrderKeys: ['private-record-id'], rows: [{ secret: 'private content' }] };
  const withPage = { ...input, query: { ...input.query, page: 9 } };
  const text = serializeTableViewState(withPage, options);
  const restored = parseTableViewState(text, options)!;
  expect(restored).toEqual(saved());
  expect(text).not.toMatch(/private|selectedKeys|rowOrderKeys|"page"|rows/);
  expect(restored).not.toBe(input);
  expect(restored.query).not.toBe(input.query);
  restored.columnWidths.title = 500;
  expect(input.columnWidths.title).toBe(320);
});

test('schema evolution retains intentional hidden columns and appends new visible columns', () => {
  const nextOptions: TableViewOptions = {
    ...options,
    columns: [options.columns[1], options.columns[2], options.columns[3], { key: 'updated', pinned: 'end' }],
    filterKeys: ['status'],
    pageSizes: [10, 50],
  };
  const restored = parseTableViewState(JSON.stringify(saved()), nextOptions)!;
  expect(restored.columnOrderKeys).toEqual(['status', 'title', 'owner', 'updated']);
  expect(restored.visibleColumnKeys).toEqual(['status', 'title', 'updated']);
  expect(restored.columnWidths).toEqual({ title: 320 });
  expect(restored.columnPinning).toEqual({ status: 'start', updated: 'end' });
  expect(restored.query.filters).toEqual({ status: 'review' });
  expect(restored.query.pageSize).toBe(10);
  expect(parseTableViewState(serializeTableViewState(restored, nextOptions), nextOptions)).toEqual(restored);
  expect(nextOptions.columns[2].key).toBe('owner');
});

test('restoration keeps required columns and a useful visible column in otherwise empty layouts', () => {
  expect(normalizeTableViewState({ ...saved(), visibleColumnKeys: [] }, options).visibleColumnKeys).toEqual(['title']);
  const allHideable = { ...options, columns: options.columns.map(column => ({ ...column, hideable: true })) };
  expect(normalizeTableViewState({ ...saved(), visibleColumnKeys: [] }, allHideable).visibleColumnKeys).toEqual(['status']);
  expect(normalizeTableViewState({ ...saved(), columnPinning: {} }, options).columnPinning).toEqual({});
});

test('widths respect current constraints and removed sorts cannot be restored', () => {
  const state = { ...saved(), columnWidths: { id: 0, title: 1_000_000, owner: 145.9 } };
  const result = normalizeTableViewState(state, options);
  expect(result.columnWidths).toEqual({ id: 80, title: 4096, owner: 146 });
  expect(normalizeTableViewState({ ...state, query: { ...state.query, sort: { key: 'status', descending: false } } }, options).query.sort).toBeNull();
  expect(normalizeTableViewState({ ...state, query: { ...state.query, sort: { key: 'old', descending: false } } }, options).query.sort).toBeNull();
  expect(state.columnWidths.title).toBe(1_000_000);
});

test('equivalent dictionaries compare canonically while order changes remain meaningful', () => {
  const first = saved(), second = { ...saved(), query: { ...saved().query, filters: { owner: 'maya', status: 'review' } }, columnWidths: { id: 112, title: 320 }, columnPinning: { id: 'end' as const, status: 'start' as const } };
  expect(tableViewKey(first, options)).toBe(tableViewKey(second, options));
  expect(tableViewKey(first, options)).not.toBe(tableViewKey({ ...second, columnOrderKeys: ['title', 'status', 'id', 'owner'] }, options));
  const before = JSON.stringify(first);
  Object.freeze(first); Object.freeze(first.query); Object.freeze(first.columnOrderKeys); Object.freeze(first.columnWidths);
  expect(() => serializeTableViewState(first, options)).not.toThrow();
  expect(JSON.stringify(first)).toBe(before);
});

test('untrusted links reject malformed, unsupported, duplicate and inconsistent state', () => {
  const state = saved();
  const invalid: unknown[] = [null, [], {}, { ...state, version: 2 }, { ...state, query: null }, { ...state, density: 'dense' },
    { ...state, query: { ...state.query, search: 'x'.repeat(1001) } },
    { ...state, query: { ...state.query, pageSize: 0 } },
    { ...state, query: { ...state.query, pageSize: 1001 } },
    { ...state, query: { ...state.query, sort: { key: 'title', descending: 'yes' } } },
    { ...state, query: { ...state.query, filters: { status: ['review'] } } },
    { ...state, query: { ...state.query, filters: { status: 'x'.repeat(1001) } } },
    { ...state, columnOrderKeys: ['id', 'id'] }, { ...state, columnOrderKeys: [''] },
    { ...state, visibleColumnKeys: ['missing'] }, { ...state, columnWidths: { missing: 300 } },
    { ...state, columnWidths: { title: -1 } }, { ...state, columnWidths: { title: '200' } },
    { ...state, columnPinning: { id: 'left' } }, { ...state, columnPinning: [] },
  ];
  for (const value of invalid) expect(parseTableViewState(JSON.stringify(value), options), JSON.stringify(value)).toBeNull();
  expect(parseTableViewState('{broken', options)).toBeNull();
  expect(parseTableViewState(' '.repeat(65_537), options)).toBeNull();
  expect(parseTableViewState(JSON.stringify({ ...state, columnOrderKeys: Array.from({ length: 101 }, (_, i) => `col-${i}`) }), options)).toBeNull();
});

test('prototype keys and inherited payloads cannot populate saved dictionaries', () => {
  const state = saved();
  for (const property of ['columnWidths', 'columnPinning']) {
    const text = JSON.stringify(state).replace(`"${property}":${JSON.stringify(state[property as 'columnWidths' | 'columnPinning'])}`, `"${property}":{"__proto__":100}`);
    expect(parseTableViewState(text, options)).toBeNull();
  }
  const inherited = Object.create(state) as TableViewState;
  expect(() => normalizeTableViewState(inherited, options)).toThrow();
  expect(() => createTableViewState({ columns: [{ key: '__proto__' }] })).toThrow();
  expect(({} as { polluted?: string }).polluted).toBeUndefined();
});

test('invalid developer schemas fail early and defaults are independent between consumers', () => {
  for (const bad of [{ columns: [] }, { columns: [{ key: 'id' }, { key: 'id' }] }, { ...options, pageSizes: [5, 5] }, { ...options, pageSizes: [1001] }, { ...options, filterKeys: ['owner', 'owner'] }, { columns: [{ key: 'id', minWidth: Infinity }] }]) {
    expect(() => createTableViewState(bad)).toThrow();
  }
  const first = createTableViewState(options), second = createTableViewState(options);
  first.columnOrderKeys.reverse(); first.query.filters.status = 'done'; first.columnPinning.id = 'end';
  expect(second.columnOrderKeys).toEqual(['id', 'title', 'status', 'owner']);
  expect(second.query.filters).toEqual({}); expect(second.columnPinning).toEqual({ id: 'start' });
});
