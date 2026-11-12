export const gridBulkExamples = [
  {
    id:'grid-bulk-operations',componentId:'data-grid',title:'Fill a range in one draft transaction',
    description:'Fill down by column or apply the active value to a selection. Every destination validates first; read-only columns stay unchanged and one Undo reverses the batch.',
    keyboard:['Select a cell and use Shift+arrows to extend a loaded range. Escape collapses it.','Control or Command+D fills down from the top selected row; Control or Command+Enter applies the active value.','The toolbar provides the same actions without modifier keys. Incompatible destination columns reject the whole operation.','Undo reverses one host batch. Nothing is persisted until Save draft is chosen.'],
    states:['fill down','apply active value','atomic validation','read-only preservation','single-step undo','loaded-row bounds','explicit local save'],
    source:`'use client';
import { useRef, useState } from 'react';
import { Button, DataGrid, UIProvider, dataValuesEqual, parseDataValue, type DataColumn, type DataEdit } from '@bld8/ui';

type Task = { id: string; revision: number; title: string; estimate: number; approved: boolean; people: string[] };
const columns: DataColumn<Task>[] = [
  { key: 'id', label: 'Record', type: 'text', width: 112, minWidth: 112, hideable: false },
  { key: 'title', label: 'Task', type: 'text', editable: true, required: true, minWidth: 230 },
  { key: 'estimate', label: 'Estimate', type: 'number', editable: true, min: 0, max: 20 },
  { key: 'approved', label: 'Approved', type: 'boolean', editable: true },
  { key: 'people', label: 'People', type: 'multi-select', editable: true, options: [{ value: 'maya', label: 'Maya Chen' }, { value: 'sam', label: 'Sam Rivera' }], minWidth: 190 },
  { key: 'revision', label: 'Revision', type: 'number' }
];
const initial: Task[] = [
  { id: 'BULK-1', revision: 1, title: 'Review keyboard focus', estimate: 3, approved: true, people: ['maya'] },
  { id: 'BULK-2', revision: 2, title: 'Align field labels', estimate: 5, approved: false, people: ['sam'] },
  { id: 'BULK-3', revision: 3, title: 'Check narrow layouts', estimate: 8, approved: false, people: [] },
  { id: 'BULK-4', revision: 4, title: 'Prepare source notes', estimate: 13, approved: true, people: ['sam'] }
];
const clone = (rows: readonly Task[]) => rows.map(row => ({ ...row, people: [...row.people] }));
type History = { rows: Task[]; past: Task[][]; future: Task[][]; batches: number; lastBatch: number };
export default function GridBulkOperationsExample() {
  const [history, setHistory] = useState<History>(() => ({ rows: clone(initial), past: [], future: [], batches: 0, lastBatch: 0 }));
  const current = useRef(history); current.current = history;
  const [saved, setSaved] = useState(() => clone(initial)), [saves, setSaves] = useState(0), [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState('Select a range. Changes stay in the local draft.');
  function replace(next: History) { current.current = next; setHistory(next); }
  function edit(edits: DataEdit<Task>[]) {
    const before = current.current, next = clone(before.rows);
    // The host validates the full batch again before replacing its draft once.
    for (const edit of edits) {
      const row = next.find(row => row.id === edit.id), column = columns.find(column => column.key === edit.key);
      if (!row || !column) { setMessage('No draft values changed: a destination is no longer loaded.'); return; }
      const parsed = parseDataValue(column, edit.value);
      if (parsed.error) { setMessage('No draft values changed: ' + parsed.error); return; }
      Object.assign(row, { [edit.key]: parsed.value });
    }
    if (next.every((row, index) => columns.every(column => dataValuesEqual(row[column.key], before.rows[index][column.key])))) return;
    replace({ rows: next, past: [...before.past.slice(-49), clone(before.rows)], future: [], batches: before.batches + 1, lastBatch: edits.length });
    setMessage('One draft transaction received. Review before saving.');
  }
  function undo() { const before = current.current, previous = before.past.at(-1); if (!previous) return; replace({ ...before, rows: clone(previous), past: before.past.slice(0, -1), future: [clone(before.rows), ...before.future] }); setMessage('The entire last draft transaction was undone.'); }
  function redo() { const before = current.current, next = before.future[0]; if (!next) return; replace({ ...before, rows: clone(next), past: [...before.past, clone(before.rows)], future: before.future.slice(1) }); setMessage('The entire draft transaction was restored.'); }
  const dirty = history.rows.flatMap(row => columns.filter(column => !dataValuesEqual(row[column.key], saved.find(savedRow => savedRow.id === row.id)?.[column.key])).map(column => ({ id: row.id, key: column.key })));
  return <UIProvider><div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <p className="bui-hint">Fill down repeats each column's top selected value. Apply active value uses the active cell for every editable destination. Mixed types may reject the whole action.</p>
    <DataGrid label="Bulk draft grid" rows={history.rows} columns={columns} onEdit={edit} bulkEditing disabled={disabled} dirtyCells={dirty} onUndo={undo} onRedo={redo} canUndo={!!history.past.length} canRedo={!!history.future.length} defaultView={{ columnOrderKeys: columns.map(column => column.key), visibleColumnKeys: columns.map(column => column.key), columnWidths: {}, columnPinning: {}, density: 'compact' }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button size="sm" disabled={disabled || !dirty.length} onClick={() => { setSaved(clone(current.current.rows)); setSaves(count => count + 1); setMessage('Saved to this example only. No service request was made.'); }}>Save bulk draft</Button>
      <Button size="sm" variant="secondary" onClick={() => { replace({ rows: clone(initial), past: [], future: [], batches: 0, lastBatch: 0 }); setSaved(clone(initial)); setSaves(0); setMessage('Restored the example records.'); }}>Restore bulk example</Button>
      <Button size="sm" variant="ghost" onClick={() => setDisabled(value => !value)}>{disabled ? 'Enable grid editing' : 'Disable grid editing'}</Button>
    </div>
    <p role="status" className="bui-hint">{message}</p>
    <output aria-label="Bulk transaction counts" className="bui-hint">{JSON.stringify({ batches: history.batches, lastBatch: history.lastBatch, saves })}</output>
    <output aria-label="Bulk canonical values" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{JSON.stringify(history.rows)}</output>
    <p className="bui-hint">Only these four loaded records are editable. The application owns atomic history, permissions, durable storage and service writes.</p>
  </div></UIProvider>;
}`
  }
];
