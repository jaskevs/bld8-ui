import type { TableQuery } from './table-query.js';

/** A column's stable identity and the constraints needed to restore its layout. */
export interface TableViewColumn {
  key: string;
  hideable?: boolean;
  minWidth?: number;
  pinned?: 'start' | 'end';
  /** Set false when the column cannot be sorted by the host. */
  sortable?: boolean;
}

export interface TableViewOptions {
  columns: readonly TableViewColumn[];
  /** Facet keys accepted by the host. Unknown facets are dropped on restoration. */
  filterKeys?: readonly string[];
  /** Defaults to 5, 10, 20, 50 and 100. The first value is the initial page size. */
  pageSizes?: readonly number[];
}

/** Portable presentation state. Row order, selection and the current page belong to the host. */
export interface TableViewState {
  version: 1;
  query: Omit<TableQuery, 'page'>;
  columnOrderKeys: string[];
  visibleColumnKeys: string[];
  columnWidths: Record<string, number>;
  columnPinning: Record<string, 'start' | 'end'>;
  density: 'comfortable' | 'compact';
}

const MAX_COLUMNS = 100;
const MAX_FILTERS = 50;
const MAX_TEXT = 1_000;
const MAX_KEY = 128;
const MAX_WIDTH = 4_096;
const MAX_SERIALIZED = 65_536;
const DEFAULT_PAGE_SIZES = [5, 10, 20, 50, 100];
const reservedKeys = new Set(['__proto__', 'prototype', 'constructor']);

function record(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validKey(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= MAX_KEY && !reservedKeys.has(value);
}

function keys(value: unknown, maximum: number, label: string): string[] {
  if (!Array.isArray(value) || value.length > maximum || !Array.from(value).every(validKey) || new Set(value).size !== value.length) {
    throw new Error(`${label} must contain at most ${maximum} unique stable keys.`);
  }
  return [...value];
}

function configuration(options: TableViewOptions) {
  if (!options || !Array.isArray(options.columns) || !options.columns.length || options.columns.length > MAX_COLUMNS) {
    throw new Error(`Provide from 1 to ${MAX_COLUMNS} table columns.`);
  }
  const columnKeys = keys(options.columns.map(column => column?.key), MAX_COLUMNS, 'Columns');
  for (const column of options.columns) {
    if (!record(column) || column.hideable !== undefined && typeof column.hideable !== 'boolean'
      || column.sortable !== undefined && typeof column.sortable !== 'boolean'
      || column.minWidth !== undefined && (typeof column.minWidth !== 'number' || !Number.isFinite(column.minWidth) || column.minWidth < 1 || column.minWidth > MAX_WIDTH)
      || column.pinned !== undefined && column.pinned !== 'start' && column.pinned !== 'end') {
      throw new Error('Invalid table column constraints.');
    }
  }
  const filterKeys = keys(options.filterKeys ?? [], MAX_FILTERS, 'Filters');
  const pageSizes = options.pageSizes ?? DEFAULT_PAGE_SIZES;
  if (!Array.isArray(pageSizes) || !pageSizes.length || pageSizes.length > 20 || new Set(pageSizes).size !== pageSizes.length
    || pageSizes.some(value => !Number.isSafeInteger(value) || value < 1 || value > 1_000)) {
    throw new Error('Provide unique page sizes from 1 to 1000.');
  }
  return { columnKeys, filterKeys, pageSizes };
}

function boundedMap(value: unknown, maximum: number, label: string): [string, unknown][] {
  if (!record(value)) throw new Error(`${label} must be a plain object.`);
  const entries = Object.entries(value);
  if (entries.length > maximum || entries.some(([key]) => !validKey(key))) throw new Error(`Invalid ${label.toLowerCase()} keys.`);
  return entries;
}

/** Create independent defaults for the supplied schema. No browser storage is accessed. */
export function createTableViewState(options: TableViewOptions): TableViewState {
  const { columnKeys, pageSizes } = configuration(options);
  return {
    version: 1,
    query: { search: '', filters: {}, sort: null, pageSize: pageSizes[0] },
    columnOrderKeys: [...columnKeys],
    visibleColumnKeys: [...columnKeys],
    columnWidths: {},
    columnPinning: Object.fromEntries(options.columns.flatMap(column => column.pinned ? [[column.key, column.pinned]] : [])),
    density: 'comfortable',
  };
}

/**
 * Validate and reconcile a saved schema without changing the input. Removed columns
 * disappear; columns absent from the saved complete order are appended and shown.
 * Keep every known column in columnOrderKeys, including hidden columns, so a hidden
 * column can be distinguished from a newly introduced column on the next restore.
 */
export function normalizeTableViewState(state: TableViewState, options: TableViewOptions): TableViewState {
  const { columnKeys, filterKeys, pageSizes } = configuration(options);
  if (!record(state) || state.version !== 1 || !record(state.query)
    || typeof state.query.search !== 'string' || state.query.search.length > MAX_TEXT
    || state.density !== 'comfortable' && state.density !== 'compact'
    || !Number.isSafeInteger(state.query.pageSize) || state.query.pageSize < 1 || state.query.pageSize > 1_000) {
    throw new Error('Invalid table view configuration.');
  }
  const savedOrder = keys(state.columnOrderKeys, MAX_COLUMNS, 'Column order');
  const savedVisible = keys(state.visibleColumnKeys, MAX_COLUMNS, 'Visible columns');
  if (savedVisible.some(key => !savedOrder.includes(key))) throw new Error('Visible columns must belong to the saved column order.');
  const added = columnKeys.filter(key => !savedOrder.includes(key));
  const order = [...savedOrder.filter(key => columnKeys.includes(key)), ...added];
  const visible = order.filter(key => savedVisible.includes(key) || added.includes(key) || options.columns.find(column => column.key === key)?.hideable === false);
  if (!visible.length) visible.push(order[0]);

  const widthEntries = boundedMap(state.columnWidths, MAX_COLUMNS, 'Column widths');
  if (widthEntries.some(([key, value]) => !savedOrder.includes(key) || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000)) {
    throw new Error('Column widths must be finite nonnegative numbers for saved columns.');
  }
  const widths = new Map(widthEntries as [string, number][]);
  const columnWidths = Object.fromEntries(columnKeys.flatMap(key => {
    const value = widths.get(key);
    if (value === undefined) return [];
    const minimum = options.columns.find(column => column.key === key)?.minWidth ?? 100;
    return [[key, Math.max(minimum, Math.min(MAX_WIDTH, Math.round(value)))]];
  }));
  const pinEntries = boundedMap(state.columnPinning, MAX_COLUMNS, 'Column pinning');
  if (pinEntries.some(([key, value]) => !savedOrder.includes(key) || value !== 'start' && value !== 'end')) {
    throw new Error('Column pinning must use start or end for saved columns.');
  }
  const pins = new Map(pinEntries);
  const columnPinning = Object.fromEntries(columnKeys.flatMap(key => {
    const value = added.includes(key) ? options.columns.find(column => column.key === key)?.pinned : pins.get(key);
    return value ? [[key, value as 'start' | 'end']] : [];
  }));
  const facets = boundedMap(state.query.filters, MAX_FILTERS, 'Query filters');
  if (facets.some(([, value]) => typeof value !== 'string' || value.length > MAX_TEXT)) throw new Error('Query filter values must be bounded strings.');
  const filters = Object.fromEntries([...facets].filter(([key]) => filterKeys.includes(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) as Record<string, string>;
  let sort: TableQuery['sort'] = null;
  if (state.query.sort !== null) {
    if (!record(state.query.sort) || !validKey(state.query.sort.key) || typeof state.query.sort.descending !== 'boolean') throw new Error('Invalid table sort configuration.');
    if (options.columns.some(column => column.key === state.query.sort?.key && column.sortable !== false)) {
      sort = { key: state.query.sort.key, descending: state.query.sort.descending };
    }
  }
  let sorts: TableQuery['sorts'];
  if(state.query.sorts!==undefined){
    if(!Array.isArray(state.query.sorts)||state.query.sorts.length>5||Array.from(state.query.sorts).some(item=>!record(item)||!validKey(item.key)||typeof item.descending!=='boolean')||new Set(state.query.sorts.map(item=>item.key)).size!==state.query.sorts.length)throw new Error('Provide up to five unique sort criteria.');
    sorts=state.query.sorts.filter(item=>options.columns.some(column=>column.key===item.key&&column.sortable!==false)).map(item=>({key:item.key,descending:item.descending}));
    sort=sorts[0]??null;
  }
  return {
    version: 1,
    query: { search: state.query.search, filters, sort,...(sorts?{sorts}:{}), pageSize: pageSizes.includes(state.query.pageSize) ? state.query.pageSize : pageSizes[0] },
    columnOrderKeys: order,
    visibleColumnKeys: visible,
    columnWidths,
    columnPinning,
    density: state.density,
  };
}

/** Parse bounded untrusted URL/storage data. Invalid or unsupported versions return null. */
export function parseTableViewState(text: string, options: TableViewOptions): TableViewState | null {
  if (typeof text !== 'string' || text.length > MAX_SERIALIZED) return null;
  try { return normalizeTableViewState(JSON.parse(text) as TableViewState, options); }
  catch { return null; }
}

/** Canonical JSON is suitable for a URL parameter or the host's saved-view record. */
export function serializeTableViewState(state: TableViewState, options: TableViewOptions): string {
  const text = JSON.stringify(normalizeTableViewState(state, options));
  if (text.length > MAX_SERIALIZED) throw new Error('The table view configuration is too large.');
  return text;
}

/** Compare only portable state; transient row selection and page position are excluded. */
export function tableViewKey(state: TableViewState, options: TableViewOptions): string {
  return serializeTableViewState(state, options);
}
