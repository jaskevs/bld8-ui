/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
/** The host owns record order and persistence. Keys describe the current unsorted page. */
export interface TableRowMove {rowKey: string; targetKey: string; position: 'before' | 'after'}

/** Apply an explicit move without mutating the source. Missing or duplicate keys reject it. */
export function applyTableRowMove<T>(rows: readonly T[], move: TableRowMove, rowKey: (row: T) => string): T[] {
  if (!Array.isArray(rows) || typeof rowKey !== 'function' || !move || typeof move !== 'object') throw new Error('The row position is no longer available.');
  const keys = rows.map(rowKey);
  if (new Set(keys).size !== keys.length || keys.some(key => typeof key !== 'string' || !key.trim() || key.length > 128)
    || !keys.includes(move.rowKey) || !keys.includes(move.targetKey) || move.rowKey === move.targetKey
    || !['before', 'after'].includes(move.position)) throw new Error('The row position is no longer available.');
  const next = rows.filter(row => rowKey(row) !== move.rowKey), index = next.findIndex(row => rowKey(row) === move.targetKey);
  next.splice(index + (move.position === 'after' ? 1 : 0), 0, rows[keys.indexOf(move.rowKey)]);
  return next;
}
