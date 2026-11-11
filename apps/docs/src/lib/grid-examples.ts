export const gridExamples = [
  {
    id:'data-grid-column-layout',componentId:'data-grid',title:'A portable column layout',
    description:'Order, visibility, pinning, widths and density share one presentation object. Editing remains a local draft.',
    keyboard:['Use Columns to show, hide, pin and reorder fields without dragging.','Tab to a column resize separator. Left and Right adjust by 10 pixels; Home uses the minimum and End uses the maximum.','Arrow keys move between visible cells. Shift extends a range; Enter edits and Escape cancels.','Pinned start and end follow the reading direction, including right-to-left layouts.'],
    states:['controlled view','column order','column visibility','logical pinning','pointer resize','keyboard resize','density','right-to-left layout','local draft editing'],
    source:`'use client';
import { useState } from 'react';
import { Button, DataGrid, createDataGridViewState, type DataColumn, type DataEdit, type DataGridViewState } from '@bld8/ui';

type RecordRow = { id: string; revision: number; title: string; status: string; owner: string; estimate: number };
const columns: DataColumn<RecordRow>[] = [
  { key: 'id', label: 'Record', type: 'text', hideable: false, pinned: 'start', width: 112, minWidth: 100, sortable: false },
  { key: 'title', label: 'Summary', type: 'text', editable: true, minWidth: 180 },
  { key: 'status', label: 'Stage', type: 'select', editable: true, minWidth: 140, options: [ { value: 'draft', label: 'Draft' }, { value: 'review', label: 'Review' }, { value: 'ready', label: 'Ready' } ] },
  { key: 'owner', label: 'Coordinator', type: 'text', editable: true, minWidth: 140 },
  { key: 'estimate', label: 'Points', type: 'number', editable: true, width: 100, minWidth: 88, pinned: 'end' }
];
const initialRows: RecordRow[] = [
  { id: 'REC-21', revision: 1, title: 'Review empty-state wording', status: 'review', owner: 'Remy Cole', estimate: 3 },
  { id: 'REC-22', revision: 1, title: 'Align the schedule toolbar', status: 'draft', owner: 'Imani Bell', estimate: 5 },
  { id: 'REC-23', revision: 1, title: 'Check keyboard return focus', status: 'ready', owner: 'Remy Cole', estimate: 2 }
];
export default function PortableGridLayoutExample() {
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState<DataGridViewState>(() => createDataGridViewState(columns));
  const [rtl, setRtl] = useState(false);
  function edit(edits: DataEdit<RecordRow>[]) {
    setRows(current => current.map(row => edits.filter(change => change.id === row.id).reduce((next, change) => {
      if (change.key === 'estimate') { const value = Number(change.value); return Number.isFinite(value) ? { ...next, estimate: value } : next; }
      if (change.key === 'title' || change.key === 'status' || change.key === 'owner') return { ...next, [change.key]: String(change.value) };
      return next;
    }, row)));
  }
  return <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button variant="secondary" size="sm" onClick={() => setRtl(current => !current)}>{rtl ? 'Use left-to-right layout' : 'Use right-to-left layout'}</Button>
      <Button variant="secondary" size="sm" onClick={() => setView(current => ({ ...current, visibleColumnKeys: current.visibleColumnKeys.includes('status') ? current.visibleColumnKeys.filter(key => key !== 'status') : [...current.visibleColumnKeys, 'status'] }))}>Toggle stage column</Button>
      <Button variant="ghost" size="sm" onClick={() => setView(createDataGridViewState(columns))}>Restore starting layout</Button>
    </div>
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ minWidth: 0 }}>
      <DataGrid label="Portable record layout" rows={rows} columns={columns} onEdit={edit} view={view} onViewChange={setView} layoutControls resizableColumns />
    </div>
    <output aria-label="Visible column keys" style={{ overflowWrap: 'anywhere' }}>{view.columnOrderKeys.filter(key => view.visibleColumnKeys.includes(key)).join(', ')}</output>
    <output aria-label="Current grid density">{view.density}</output>
    <p className="bui-hint">These edits stay in this example. A host application validates drafts and saves them separately from the view.</p>
  </div>;
}`
  },
  {
    id:'data-grid-priority-sorting',componentId:'data-grid',title:'Multi-sort without modifier keys',
    description:'Add, replace, reorder and remove sort rules with the same controls on touch and keyboard. The host applies the query.',
    keyboard:['Open Sort and use Add sort to create a rule. New rules receive focus.','Choose a column and direction, then use Raise or Lower sort priority to change precedence.','Remove sort returns focus to the remaining rule, or Add sort when none remain.','Column headings still support Shift-select as a shortcut.'],
    states:['controlled multi-sort','touch sort editor','keyboard priorities','host sorting','non-sortable identity','uncontrolled compact view'],
    source:`'use client';
import { useState } from 'react';
import { Button, DataGrid, createDataGridViewState, type DataColumn, type DataSort } from '@bld8/ui';

type Release = { id: string; revision: number; title: string; phase: string; priority: number };
const columns: DataColumn<Release>[] = [
  { key: 'id', label: 'Release', type: 'text', sortable: false, hideable: false, minWidth: 104, width: 104 },
  { key: 'title', label: 'Release summary', type: 'text', minWidth: 210 },
  { key: 'phase', label: 'Release phase', type: 'text', minWidth: 150 },
  { key: 'priority', label: 'Release priority', type: 'number', minWidth: 140 }
];
const rows: Release[] = [
  { id: 'REL-1', revision: 1, title: 'Calendar keyboard checks', phase: 'Review', priority: 2 },
  { id: 'REL-2', revision: 1, title: 'Upload retry messages', phase: 'Draft', priority: 3 },
  { id: 'REL-3', revision: 1, title: 'Chart legend contrast', phase: 'Review', priority: 3 },
  { id: 'REL-4', revision: 1, title: 'Toolbar spacing', phase: 'Ready', priority: 1 }
];
const compactView = { ...createDataGridViewState(columns), density: 'compact' as const };
export default function OrderedGridSortExample() {
  const [sorts, setSorts] = useState<DataSort[]>([{ key: 'priority', descending: true }, { key: 'title', descending: false }]);
  const orderedRows = [...rows].sort((left, right) => {
    for (const sort of sorts) {
      const a = left[sort.key as keyof Release], b = right[sort.key as keyof Release];
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
      if (result) return sort.descending ? -result : result;
    }
    return 0;
  });
  return <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
    <DataGrid label="Sorted release queue" rows={orderedRows} columns={columns} sorts={sorts} onSortsChange={setSorts} defaultView={compactView} />
    <div><Button variant="ghost" size="sm" onClick={() => setSorts([])}>Reset example sorting</Button></div>
    <output aria-label="Active sort rules" style={{ overflowWrap: 'anywhere' }}>{sorts.length ? sorts.map((sort, index) => (index + 1) + '. ' + sort.key + ' ' + (sort.descending ? 'descending' : 'ascending')).join('; ') : 'No sorting'}</output>
  </div>;
}`
  }
];
