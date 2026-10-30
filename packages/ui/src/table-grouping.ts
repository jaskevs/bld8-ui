/** Framework-independent grouping and bounded table-window helpers. */
export interface TableGrouping<T> {
  key: (row: T) => string;
  label: (key: string) => string;
}

export type TableRowNode<T> =
  | { kind: 'row'; id: string; key: string; row: T; groupKey?: string }
  | { kind: 'group'; id: string; key: string; label: string; rows: readonly T[] };

const MAX_ROWS = 20_000;
const MAX_NODES = MAX_ROWS * 2;
const MAX_TEXT_LENGTH = 256;
const MAX_OVERSCAN = 100;

function text(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT_LENGTH) {
    throw new Error(`${name} must be a nonblank string of at most ${MAX_TEXT_LENGTH} characters.`);
  }
}

function integer(value: number, name: string, minimum: number, maximum = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
}

/**
 * Groups retain first-occurrence order and the input order within each group.
 * Group rows contain every supplied member, including collapsed members.
 * Unknown collapsed keys are harmless when filters replace the supplied rows.
 */
export function buildTableRows<T>(
  rows: readonly T[],
  rowKey: (row: T) => string,
  grouping?: TableGrouping<T>,
  collapsedGroupKeys: readonly string[] = [],
): TableRowNode<T>[] {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new Error(`Supply at most ${MAX_ROWS} table rows.`);
  if (typeof rowKey !== 'function') throw new Error('Provide a row-key function.');
  if (grouping !== undefined && (!grouping || typeof grouping.key !== 'function' || typeof grouping.label !== 'function')) {
    throw new Error('Provide group-key and group-label functions.');
  }
  if (!Array.isArray(collapsedGroupKeys) || collapsedGroupKeys.length > MAX_ROWS) throw new Error('Invalid collapsed group keys.');
  const collapsed = new Set<string>();
  for (const key of collapsedGroupKeys) {
    text(key, 'Collapsed group key');
    if (collapsed.has(key)) throw new Error('Collapsed group keys must be unique.');
    collapsed.add(key);
  }

  const keys = new Set<string>();
  const plain: TableRowNode<T>[] = [];
  const groups = new Map<string, { header: Extract<TableRowNode<T>, { kind: 'group' }>; children: TableRowNode<T>[] }>();
  for (const row of rows) {
    const key = rowKey(row);
    text(key, 'Row key');
    if (keys.has(key)) throw new Error('Table row keys must be unique.');
    keys.add(key);
    if (!grouping) {
      plain.push({ kind: 'row', id: 'row:' + key, key, row });
      continue;
    }
    const groupKey = grouping.key(row);
    text(groupKey, 'Group key');
    let group = groups.get(groupKey);
    if (!group) {
      const label = grouping.label(groupKey);
      text(label, 'Group label');
      group = { header: { kind: 'group', id: 'group:' + groupKey, key: groupKey, label, rows: [] }, children: [] };
      groups.set(groupKey, group);
    }
    // This array belongs to the model; the caller's row array is never changed.
    (group.header.rows as T[]).push(row);
    group.children.push({ kind: 'row', id: 'row:' + key, key, row, groupKey });
  }
  if (!grouping) return plain;
  const result: TableRowNode<T>[] = [];
  for (const [key, group] of groups) {
    result.push(group.header);
    if (!collapsed.has(key)) result.push(...group.children);
  }
  return result;
}

/**
 * Zero-based contiguous range [start, end), plus at most one retained index.
 * Finite scroll offsets are clamped to the content. Invalid retained indices
 * outside the current dataset are ignored, allowing focus to survive filtering.
 */
export function getTableWindow(
  count: number,
  scrollTop: number,
  height: number,
  rowHeight: number,
  overscan: number,
  retainedIndex?: number,
): { start: number; end: number; indices: number[] } {
  integer(count, 'Table node count', 0, MAX_NODES);
  if (!Number.isFinite(scrollTop)) throw new Error('Scroll offset must be finite.');
  if (!Number.isFinite(height) || height <= 0) throw new Error('Window height must be positive and finite.');
  if (!Number.isFinite(rowHeight) || rowHeight <= 0) throw new Error('Row height must be positive and finite.');
  integer(overscan, 'Overscan', 0, MAX_OVERSCAN);
  if (retainedIndex !== undefined && !Number.isSafeInteger(retainedIndex)) throw new Error('Retained row index must be an integer.');
  const extent = count * rowHeight;
  if (!Number.isFinite(extent) || extent > Number.MAX_SAFE_INTEGER) throw new Error('Table pixel extent is too large.');
  if (!count) return { start: 0, end: 0, indices: [] };
  const offset = Math.min(Math.max(0, scrollTop), Math.max(0, extent - height));
  const start = Math.max(0, Math.floor(offset / rowHeight) - overscan);
  const end = Math.min(count, Math.ceil((offset + height) / rowHeight) + overscan);
  const indices = Array.from({ length: end - start }, (_, index) => start + index);
  if (retainedIndex !== undefined && retainedIndex >= 0 && retainedIndex < count) {
    if (retainedIndex < start) indices.unshift(retainedIndex);
    else if (retainedIndex >= end) indices.push(retainedIndex);
  }
  return { start, end, indices };
}

/**
 * Page ranges count the supplied flattened entries, with an exclusive end.
 * A group header prepended for context is not added to start/end/total.
 */
export function getTablePage<T>(
  nodes: readonly TableRowNode<T>[],
  page: number,
  pageSize: number,
): { nodes: TableRowNode<T>[]; page: number; pages: number; start: number; end: number; total: number } {
  if (!Array.isArray(nodes) || nodes.length > MAX_NODES) throw new Error(`Supply at most ${MAX_NODES} table nodes.`);
  integer(page, 'Page', 1);
  integer(pageSize, 'Page size', 1);
  const total = nodes.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activePage = Math.min(page, pages);
  const start = (activePage - 1) * pageSize;
  const end = Math.min(total, start + pageSize);
  const result = nodes.slice(start, end);
  const first = result[0];
  if (first?.kind === 'row' && first.groupKey !== undefined) {
    for (let index = start - 1; index >= 0; index--) {
      const candidate = nodes[index];
      if (candidate.kind !== 'group') continue;
      if (candidate.key === first.groupKey) result.unshift(candidate);
      break;
    }
  }
  return { nodes: result, page: activePage, pages, start, end, total };
}
