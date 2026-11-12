export const gridEditorExamples = [
  {
    id:'grid-editor-mixed',componentId:'data-grid',title:'Dates, approval and people in one draft',
    description:'Date-only values, native checkbox edits and multiple assignees share validation, history and one host-owned save boundary.',
    keyboard:['Enter or F2 opens a cell. Dates and assignees keep a local buffer until Apply changes.','In an approval cell, Space toggles the checkbox; Enter or Tab commits and Escape cancels.','Escape dismisses an inner calendar or option list first. Cancel or Escape from the editor discards its buffer.','Copy and paste use canonical date strings, true/false and JSON arrays of option IDs, not display names.'],
    states:['date editor','boolean editor','multiple assignees','local buffers','undo and redo','canonical clipboard','atomic local save','revision conflict'],
    source:`'use client';
import { useState } from 'react';
import { Button, DataGrid, UIProvider, dataValuesEqual, parseDataValue, validateDataChanges, type DataCellError, type DataColumn, type DataChange, type DataEdit } from '@bld8/ui';

type Delivery = { id: string; revision: number; title: string; due: string; approved: boolean; assignees: string[] };
const people = [
  { value: 'maya', label: 'Maya Chen', description: 'Interface systems' },
  { value: 'oliver', label: 'Oliver Reed', description: 'Frontend platform' },
  { value: 'sam', label: 'Sam Rivera', description: 'Accessibility' },
  { value: 'retired', label: 'Former contributor', disabled: true }
];
const columns: DataColumn<Delivery>[] = [
  { key: 'id', label: 'Record', type: 'text', hideable: false, width: 104, minWidth: 104 },
  { key: 'title', label: 'Delivery title', type: 'text', editable: true, required: true, maxLength: 100, minWidth: 220 },
  { key: 'due', label: 'Due date', type: 'date', editable: true, minDate: '2026-01-01', maxDate: '2027-12-31', width: 170 },
  { key: 'approved', label: 'Approved', type: 'boolean', editable: true, width: 128 },
  { key: 'assignees', label: 'Assignees', type: 'multi-select', editable: true, required: true, maxSelections: 3, options: people, minWidth: 260 }
];
const initial: Delivery[] = [
  { id: 'REC-1', revision: 1, title: 'Keyboard focus review', due: '2026-11-20', approved: false, assignees: ['maya'] },
  { id: 'REC-2', revision: 1, title: 'Responsive field spacing', due: '', approved: true, assignees: ['oliver', 'sam'] }
];
const clone = (rows: Delivery[]) => rows.map(row => ({ ...row, assignees: [...row.assignees] }));
export default function DeliveryEditorExample() {
  const [saved, setSaved] = useState(() => clone(initial)), [rows, setRows] = useState(() => clone(initial));
  const [past, setPast] = useState<Delivery[][]>([]), [future, setFuture] = useState<Delivery[][]>([]);
  const [errors, setErrors] = useState<DataCellError[]>([]), [message, setMessage] = useState('Changes stay in this example.');
  const changes: DataChange<Delivery>[] = rows.flatMap(row => {
    const base = saved.find(item => item.id === row.id)!;
    const values: Partial<Omit<Delivery, 'id' | 'revision'>> = {};
    for (const column of columns.filter(column => column.editable)) if (!dataValuesEqual(row[column.key], base[column.key])) Object.assign(values, { [column.key]: row[column.key] });
    return Object.keys(values).length ? [{ id: row.id, expectedRevision: row.revision, values }] : [];
  });
  function edit(edits: DataEdit<Delivery>[]) {
    const next = clone(rows), invalid: DataCellError[] = [];
    for (const edit of edits) {
      const row = next.find(row => row.id === edit.id), column = columns.find(column => column.key === edit.key);
      if (!row || !column) { invalid.push({ id: edit.id, key: edit.key, message: 'Choose a loaded editable field.' }); continue; }
      const parsed = parseDataValue(column, edit.value);
      if (parsed.error) invalid.push({ id: edit.id, key: edit.key, message: parsed.error }); else Object.assign(row, { [edit.key]: parsed.value });
    }
    setErrors(invalid); if (invalid.length) { setMessage('The whole edit was kept out of the draft. Correct its values and retry.'); return; }
    if (next.every((row, index) => columns.every(column => dataValuesEqual(row[column.key], rows[index][column.key])))) return;
    setPast(current => [...current.slice(-49), clone(rows)]); setFuture([]); setRows(next); setMessage('Draft updated. Review before saving.');
  }
  function undo() { const previous = past.at(-1); if (!previous) return; setFuture(current => [clone(rows), ...current]); setRows(clone(previous)); setPast(current => current.slice(0, -1)); setErrors([]); }
  function redo() { const next = future[0]; if (!next) return; setPast(current => [...current, clone(rows)]); setRows(clone(next)); setFuture(current => current.slice(1)); setErrors([]); }
  function save() {
    const invalid = validateDataChanges(saved, columns, changes); setErrors(invalid); if (invalid.length) { setMessage('Correct the draft before saving.'); return; }
    if (changes.some(change => saved.find(row => row.id === change.id)?.revision !== change.expectedRevision)) { setMessage('A revision changed. Restore the saved records before retrying; nothing was saved.'); return; }
    const next = clone(rows).map(row => changes.some(change => change.id === row.id) ? { ...row, revision: row.revision + 1 } : row);
    setSaved(clone(next)); setRows(next); setPast([]); setFuture([]); setMessage('Saved together in this local example.');
  }
  const dirty = changes.flatMap(change => Object.keys(change.values).map(key => ({ id: change.id, key })));
  return <UIProvider><div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <DataGrid label="Delivery editor grid" rows={rows} columns={columns} onEdit={edit} cellErrors={errors} dirtyCells={dirty} onUndo={undo} onRedo={redo} canUndo={!!past.length} canRedo={!!future.length} layoutControls resizableColumns />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button size="sm" disabled={!changes.length} onClick={save}>Save delivery draft</Button>
      <Button size="sm" variant="secondary" onClick={() => { setRows(clone(saved)); setPast([]); setFuture([]); setErrors([]); setMessage('Restored the saved records.'); }}>Restore saved records</Button>
      <Button size="sm" variant="ghost" onClick={() => { setSaved(current => current.map((row, index) => index === 0 ? { ...row, revision: row.revision + 1 } : row)); setMessage('A local external revision was simulated. Save will reject stale changes atomically.'); }}>Simulate external revision</Button>
    </div>
    <p role="status" className="bui-hint">{message}</p>
    <output aria-label="Delivery canonical values" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{JSON.stringify(rows.map(({ id, due, approved, assignees }) => ({ id, due, approved, assignees })))}</output>
    <p className="bui-hint">This example keeps records in memory. Your application owns authentication, durable storage, revision checks and atomic writes.</p>
  </div></UIProvider>;
}`
  },
  {
    id:'grid-editor-custom',componentId:'data-grid',title:'A hierarchical custom cell editor',
    description:'Compose TreeSelect through the public render hooks. A custom popup keeps canonical leaf IDs and the same validation, focus and dismissal boundary.',
    keyboard:['Enter opens the custom team editor. Search or expand the tree and choose loaded leaf teams.','TreeSelect handles its own keyboard navigation; Tab reaches Apply teams and Cancel.','Apply teams validates canonical leaf IDs, finishes the exit motion and returns focus to the cell.','Escape or outside dismissal discards only the temporary editor value; outside focus is preserved.'],
    states:['custom cell display','custom editor hooks','TreeSelect composition','canonical leaf IDs','typed context','exit motion','validation','outside focus'],
    source:`'use client';
import { useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Button, DataGrid, TreeSelect, UIProvider, parseDataValue, type DataColumn, type DataEdit, type DataGridEditorContext, type TreeSelectNode } from '@bld8/ui';

type Ownership = { id: string; revision: number; title: string; teams: string[] };
const teams: TreeSelectNode[] = [
  { id: 'design', label: 'Design', children: [{ id: 'design-ui', label: 'Interface systems' }, { id: 'design-motion', label: 'Motion' }] },
  { id: 'platform', label: 'Platform', children: [{ id: 'platform-web', label: 'Web platform' }, { id: 'platform-a11y', label: 'Accessibility' }] }
];
const teamOptions = [{ value: 'design-ui', label: 'Interface systems' }, { value: 'design-motion', label: 'Motion' }, { value: 'platform-web', label: 'Web platform' }, { value: 'platform-a11y', label: 'Accessibility' }];
const columns: DataColumn<Ownership>[] = [
  { key: 'id', label: 'Record', type: 'text', width: 104, minWidth: 104 },
  { key: 'title', label: 'Ownership title', type: 'text', editable: true, required: true, minWidth: 220 },
  { key: 'teams', label: 'Teams', type: 'multi-select', editable: true, options: teamOptions, required: true, minWidth: 300 }
];
function TeamCellEditor({ context }: { context: DataGridEditorContext<Ownership> }) {
  const [open, setOpen] = useState(true), [error, setError] = useState('');
  const current = useRef(context); current.current = context;
  const pending = useRef<{ apply: boolean; value?: unknown; restore: boolean } | null>(null);
  function close(apply: boolean, restore = true) {
    if (pending.current) return;
    if (apply) { const parsed = parseDataValue(context.column, context.draftValue); if (parsed.error) { setError(parsed.error); return; } pending.current = { apply, value: parsed.value, restore }; }
    else pending.current = { apply, restore };
    setOpen(false);
  }
  return <Popover.Root open={open} onOpenChange={(next, details) => { if (!next) close(false, details.reason !== 'outside-press' && details.reason !== 'focus-out'); }} onOpenChangeComplete={next => {
    if (next || !pending.current) return;
    const action = pending.current; pending.current = null;
    if (action.apply) { if (!current.current.commit(action.value)) setOpen(true); } else current.current.cancel(action.restore);
  }}>
    <Popover.Trigger render={<Button variant="ghost" size="sm" aria-label={context.label}>Choose teams</Button>} />
    <Popover.Portal><Popover.Positioner className="bui-positioner" sideOffset={6} collisionPadding={12} align="start"><Popover.Popup {...context.portalProps} className="bui-popup" finalFocus={false} style={{ width: 'min(360px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - 24px)', overflow: 'auto', display: 'grid', gap: 16, padding: 20 }}>
      <Popover.Title style={{ margin: 0, fontSize: 15 }}>Choose delivery teams</Popover.Title>
      <Popover.Description className="bui-hint" style={{ margin: 0 }}>Changes stay temporary until you apply this cell.</Popover.Description>
      <TreeSelect label={context.label} nodes={teams} value={Array.isArray(context.draftValue) ? context.draftValue.filter((value): value is string => typeof value === 'string') : []} onValueChange={value => { setError(''); context.onValueChange(value); }} inputRef={context.inputRef} popupDataAttributes={context.portalProps} density="compact" clearable disabled={context.disabled} error={error || context.error} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button variant="ghost" size="sm" onClick={() => close(false)}>Cancel</Button><Button size="sm" onClick={() => close(true)}>Apply teams</Button></div>
    </Popover.Popup></Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
export default function CustomTeamEditorExample() {
  const [rows, setRows] = useState<Ownership[]>([{ id: 'OWN-1', revision: 1, title: 'Delivery checklist', teams: ['design-ui'] }, { id: 'OWN-2', revision: 1, title: 'Release handoff', teams: ['platform-web'] }]);
  const [message, setMessage] = useState('Edits stay in this local example.');
  function edit(edits: DataEdit<Ownership>[]) {
    const parsed = edits.map(edit => ({ ...edit, parsed: parseDataValue(columns.find(column => column.key === edit.key)!, edit.value) }));
    if (parsed.some(edit => edit.parsed.error)) { setMessage('No edits were applied: a value did not match its column.'); return; }
    setRows(current => current.map(row => parsed.filter(edit => edit.id === row.id).reduce((next, edit) => ({ ...next, [edit.key]: edit.parsed.value }), row))); setMessage('Canonical IDs applied to the local draft.');
  }
  return <UIProvider><div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <DataGrid label="Custom team editor grid" rows={rows} columns={columns} onEdit={edit} renderCell={context => context.column.key === 'teams' ? <span className="bui-data-grid-tags">{context.row.teams.map(id => <span className="bui-data-grid-tag" key={id}>{teamOptions.find(option => option.value === id)?.label ?? id}</span>)}</span> : undefined} renderEditor={context => context.column.key === 'teams' ? <TeamCellEditor context={context} /> : undefined} />
    <Button variant="secondary" size="sm" onClick={() => setMessage('Outside action kept focus.')}>Outside editor action</Button>
    <p role="status" className="bui-hint">{message}</p><output aria-label="Custom team canonical values" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{JSON.stringify(rows.map(row => ({ id: row.id, teams: row.teams })))}</output>
    <p className="bui-hint">Custom editors render UI; the grid validates column values. The host still owns saved records and service writes.</p>
  </div></UIProvider>;
}`
  }
];
