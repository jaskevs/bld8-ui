'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Badge, Button, Checkbox, SortableDataTable as DataTable, Switch,
  applyTableRowMove, createTableViewState,
  type Column, type TableRowMove, type TableViewOptions,
} from '@bld8/ui';

interface Project { id: string; name: string; status: string; owner: string }
const initialProjects: Project[] = [
  {id: 'navigation', name: 'Navigation study', status: 'Review', owner: 'Maya'},
  {id: 'forms', name: 'Form patterns', status: 'Ready', owner: 'Sam'},
  {id: 'motion', name: 'Motion notes', status: 'Review', owner: 'Oliver'},
  {id: 'end', name: 'Icon audit', status: 'Draft', owner: 'Maya'},
];
const viewOptions: TableViewOptions = {
  columns: [{key: 'name', hideable: false, minWidth: 200}, {key: 'status', minWidth: 130}, {key: 'owner', minWidth: 130}],
  filterKeys: ['status'], pageSizes: [5],
};

/** Controlled rows are changed only after the simulated save confirms the move. */
export function TableOrderingDemo() {
  const [rows, setRows] = useState(() => initialProjects.map(row => ({...row})));
  const [selected, setSelected] = useState<string[]>([]);
  const [layout, setLayout] = useState(() => createTableViewState(viewOptions));
  const [failNext, setFailNext] = useState(false), [saving, setSaving] = useState(false), [reset, setReset] = useState(0);
  const failure = useRef(failNext), latestRows = useRef(rows), pending = useRef(false), mounted = useRef(true);
  failure.current = failNext; latestRows.current = rows;
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  const columns = useMemo<Column<Project>[]>(() => [
    {key: 'name', header: 'Project', width: 280, minWidth: 200, hideable: false, flex: 1, sortValue: row => row.name, cell: row => <strong>{row.name}</strong>},
    {key: 'status', header: 'Status', width: 150, minWidth: 130, sortValue: row => row.status, cell: row => <Badge tone={row.status === 'Ready' ? 'success' : 'neutral'}>{row.status}</Badge>},
    {key: 'owner', header: 'Owner', width: 150, minWidth: 130, sortValue: row => row.owner, cell: row => row.owner},
  ], []);

  async function moveRow(move: TableRowMove) {
    if (pending.current) throw new Error('A row save is already in progress.');
    const before = latestRows.current;
    const next = applyTableRowMove(before, move, row => row.id), reject = failure.current;
    pending.current = true; failure.current = false; setFailNext(false); setSaving(true);
    try {
      await new Promise<void>(resolve => window.setTimeout(resolve, 280));
      if (reject) throw new Error('The example save was rejected. Try the move again.');
      if (!mounted.current || latestRows.current !== before) throw new Error('The rows changed before the move finished.');
      setRows(next);
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return <section className="stack" aria-label="Table ordering example">
    <div><h2>Keep the order in your hands.</h2><p className="bui-hint">Drag a handle, or choose its position with the keyboard. Row saves use a local simulation; changes last for this session.</p></div>
    <div className="actions">
      <Switch label="Pin project column" checked={layout.columnPinning.name === 'start'} disabled={saving} onChange={event => {const columnPinning: Record<string, 'start' | 'end'> = event.target.checked ? {name: 'start'} : {}; setLayout(current => ({...current, columnPinning}));}}/>
      <Checkbox label="Fail next row save" checked={failNext} disabled={saving} onChange={event => {failure.current = event.target.checked; setFailNext(event.target.checked);}}/>
    </div>
    <DataTable key={reset} caption="Ordered projects" rows={rows} columns={columns} rowKey={row => row.id} rowLabel={row => row.name}
      searchText={row => row.name + ' ' + row.owner} pageSize={5}
      filters={[{key: 'status', label: 'Statuses', options: ['Review', 'Ready', 'Draft'].map(value => ({value, label: value})), value: row => row.status}]}
      selectable selectedKeys={selected} onSelectedKeysChange={setSelected}
      columnVisibility reorderableColumns resizableColumns
      columnOrderKeys={layout.columnOrderKeys} onColumnOrderKeysChange={columnOrderKeys => setLayout(current => ({...current, columnOrderKeys}))}
      visibleColumnKeys={layout.visibleColumnKeys} onVisibleColumnKeysChange={visibleColumnKeys => setLayout(current => ({...current, visibleColumnKeys}))}
      columnWidths={layout.columnWidths} onColumnWidthsChange={columnWidths => setLayout(current => ({...current, columnWidths}))}
      columnPinning={layout.columnPinning} onRowMove={moveRow}/>
    <Button size="sm" variant="ghost" disabled={saving} onClick={() => {setRows(initialProjects.map(row => ({...row}))); setSelected([]); setLayout(createTableViewState(viewOptions)); setFailNext(false); failure.current = false; setReset(value => value + 1);}}>Reset ordering example</Button>
  </section>;
}
