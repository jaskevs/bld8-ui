export const resourceWorkspaceExamples = [
  {
    id:'resource-inventory-drafts',componentId:'data-grid',title:'Inventory with reviewed batch saves',
    description:'Use the same typed source controller for another domain: inventory quantities, dates, approval and multiple owners. Changes across pages stay in one draft until review.',
    keyboard:['Arrow keys move between grid cells. Enter opens the appropriate editor; Escape cancels it.','Open record edits the complete item, including multiple owners and approval.','Review changes opens one batch confirmation; Undo draft reverses the last draft operation.','Save current view stores view settings only. Share current view puts filters and layout in the URL, never draft values.'],
    states:['typed inventory schema','paged source','canonical dates and booleans','multiple owners','explicit batch review','host-owned saved views','safe share URL','one-step draft undo'],
    source:`'use client';
import { useEffect, useState } from 'react';
import { ResourceWorkspace, createMemoryResourceDataSource, parseResourceWorkspaceView, serializeResourceWorkspaceView, resourceWorkspaceViewUrl, type ResourceFilterField, type ResourceWorkspaceView, type SavedResourceView } from '@bld8/blocks';
import { UIProvider, type DataColumn } from '@bld8/ui';

type Item = { id: string; revision: number; name: string; stock: number; restock: string; approved: boolean; owners: string[] };
const owners = [{ value: 'maya', label: 'Maya Chen' }, { value: 'sam', label: 'Sam Rivera' }, { value: 'oliver', label: 'Oliver Reed' }];
const columns: DataColumn<Item>[] = [
  { key: 'id', label: 'SKU', type: 'text', hideable: false, minWidth: 120 },
  { key: 'name', label: 'Product', type: 'text', editable: true, required: true, minLength: 3, minWidth: 230 },
  { key: 'stock', label: 'Stock', type: 'number', editable: true, min: 0, max: 10000 },
  { key: 'restock', label: 'Restock date', type: 'date', editable: true },
  { key: 'approved', label: 'Approved', type: 'boolean', editable: true },
  { key: 'owners', label: 'Owners', type: 'multi-select', editable: true, options: owners, maxSelections: 3, minWidth: 220 }
];
const fields: ResourceFilterField<Item>[] = [
  { id: 'name', label: 'Product', kind: 'text' }, { id: 'stock', label: 'Stock', kind: 'number' },
  { id: 'restock', label: 'Restock date', kind: 'date' },
  { id: 'approved', label: 'Approved', kind: 'select', options: [{ value: 'true', label: 'Approved' }, { value: 'false', label: 'Needs approval' }] }
];
const initial: Item[] = Array.from({ length: 16 }, (_, index) => ({ id: 'SKU-' + (101 + index), revision: 1, name: ['Studio headphones', 'Desk speakers', 'Portable display', 'USB microphone'][index % 4] + (index > 3 ? ' ' + (index + 1) : ''), stock: 12 + index * 3, restock: '2026-12-' + String(index + 1).padStart(2, '0'), approved: index % 2 === 0, owners: index % 3 ? ['sam'] : ['maya', 'oliver'] }));
export default function InventoryDraftsExample() {
  const [source] = useState(() => createMemoryResourceDataSource({ rows: initial, columns, fields, searchKeys: ['id', 'name'] }));
  const [views, setViews] = useState<SavedResourceView[]>([]), [restored, setRestored] = useState<{ view?: ResourceWorkspaceView } | null>(null);
  useEffect(() => {
    const query = new URL(window.location.href).searchParams.get('inventoryView');
    const view = query ? parseResourceWorkspaceView(query, columns, fields) ?? undefined : undefined;
    try { const saved = localStorage.getItem('inventory-example-view'); if (saved) { const parsed = parseResourceWorkspaceView(saved, columns, fields); if (parsed) setViews([{ id: 'saved', label: 'My inventory view', view: parsed }]); } } catch { /* Host storage can be unavailable. */ }
    setRestored({ view });
  }, []);
  if (!restored) return <p role="status">Preparing inventory view…</p>;
  return <UIProvider><ResourceWorkspace dataSource={source} columns={columns} fields={fields} defaultView={restored.view} savedViews={views}
    labels={{ label: 'Inventory workspace', title: 'Keep stock changes together.', searchLabel: 'Search inventory', searchPlaceholder: 'SKU or product…', gridLabel: 'Inventory data grid', recordName: 'Item', emptyTitle: 'No matching inventory.' }}
    onSaveView={view => { localStorage.setItem('inventory-example-view', serializeResourceWorkspaceView(view, columns, fields)); setViews([{ id: 'saved', label: 'My inventory view', view }]); }}
    onShareView={view => { const href = resourceWorkspaceViewUrl(window.location.href, view, columns, fields, 'inventoryView'); window.history.replaceState(null, '', href); }}
  /></UIProvider>;
}`
  },
  {
    id:'resource-issues-shared-controller',componentId:'data-grid',title:'Issue editing on the same resource controller',
    description:'Keep the issue schema and existing HTTP boundary while sharing the resource draft, retry, conflict and undo lifecycle. This example uses the issue adapter in memory.',
    keyboard:['Use the search field and pagination to move between loaded issue pages. Drafts from other pages are kept.','Enter edits a grid cell; Open record opens the issue inspector.','Review changes and Save confirm the whole batch. Keep editing returns without writing.'],
    states:['existing issue adapter','shared generic controller','stable issue wrapper','draft undo','review before write','typed filter schema'],
    source:`'use client';
import { useState } from 'react';
import { ResourceWorkspace, createMemoryIssueDataSource, issueDataColumns, issueFields, type Issue, type ResourceFilterField } from '@bld8/blocks';
import { UIProvider } from '@bld8/ui';
export default function ResourceIssuesExample() {
  const [source] = useState(() => createMemoryIssueDataSource());
  return <UIProvider><ResourceWorkspace dataSource={source} columns={issueDataColumns} fields={issueFields as readonly ResourceFilterField<Issue>[]}
    labels={{ label: 'Shared issue workspace', gridLabel: 'Shared issue grid', recordName: 'Issue', searchLabel: 'Search issues', title: 'One review for the issue draft.' }}
  /></UIProvider>;
}`
  },
  {
    id:'resizable-workspace-panes',componentId:'resizable-panels',title:'Adjustable workspace with a readable mobile fallback',
    description:'Resize the list and inspector by pointer or keyboard. Collapse and restore the inspector; the host stores committed layouts, and narrow screens show both panels in order.',
    keyboard:['Tab to the separator. Left and Right adjust by two percent; Shift adjusts by ten.','Home and End move to the allowed limits. Enter collapses or restores the adjacent inspector.','Pointer dragging follows the pointer directly. Escape cancels an active drag.','Scroll regions enter the tab order only when their content overflows. Native arrow-key and touch scrolling remain available.'],
    states:['pointer and touch resize','keyboard constraints','collapse and restore','controlled layout','host persistence','mobile stack','reduced motion','native scroll regions'],
    source:`'use client';
import { useEffect, useState } from 'react';
import { Checkbox, ResizablePanels, ScrollArea, UIProvider, normalizePanelLayout, type PanelLayout } from '@bld8/ui';
const constraints = [{ id: 'records', label: 'Records', minSize: 30, maxSize: 100, defaultSize: 65 }, { id: 'inspector', label: 'Inspector', minSize: 15, maxSize: 70, defaultSize: 35, collapsible: true }];
export default function ResizableWorkspaceExample() {
  const [layout, setLayout] = useState<PanelLayout>(() => normalizePanelLayout(constraints)), [status, setStatus] = useState('Drag the divider or use its keyboard controls.'), [disabled, setDisabled] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem('workspace-example-layout'); if (saved) setLayout(normalizePanelLayout(constraints, JSON.parse(saved))); } catch { /* Ignore stale or unavailable host storage. */ } }, []);
  return <UIProvider><div style={{ minWidth: 0 }}><Checkbox label="Disable resizing" checked={disabled} onCheckedChange={setDisabled}/><ResizablePanels disabled={disabled} label="Workspace panels" layout={layout} onLayoutChange={setLayout}
    onLayoutCommit={next => { try { localStorage.setItem('workspace-example-layout', JSON.stringify(next)); setStatus('Panel layout saved by this example.'); } catch { setStatus('Layout changed. Browser storage is unavailable.'); } }}
    panels={constraints.map(panel => ({ ...panel, children: <div style={{ padding: 20, background: 'var(--bui-surface)', borderRadius: 6 }}><h3>{panel.label}</h3><ScrollArea label={panel.label + ' content'} style={{ height: 280 }}><div style={{ display: 'grid', gap: 14 }}>{Array.from({ length: panel.id === 'records' ? 24 : 10 }, (_, index) => <p key={index}>{panel.id === 'records' ? 'Record ' + (index + 1) + ' — review keyboard focus and field spacing.' : 'Inspector detail ' + (index + 1) + '. The host owns the selected record.'}</p>)}</div></ScrollArea></div> }))}/>
    <p role="status" className="bui-hint">{status}</p><output aria-label="Current panel layout">{JSON.stringify(layout)}</output>
  </div></UIProvider>;
}`
  },
  {
    id:'scroll-area-native-region',componentId:'scroll-area',title:'Native scrolling without a second interaction model',
    description:'Keep platform momentum, wheel, touch and keyboard scrolling. The named region is keyboard-focusable only while content overflows.',
    keyboard:['Tab to the overflowing region and use Arrow keys, Page Up, Page Down, Home and End.','Scroll naturally with a wheel or touch gesture. Pinch zoom remains available.','The region drops out of the tab order when the content fits.'],
    states:['native momentum','named region','automatic keyboard entry','horizontal and vertical overflow','dynamic content','unrestricted browser zoom'],
    source:`'use client';
import { useState } from 'react';
import { Button, ScrollArea, UIProvider } from '@bld8/ui';
export default function NativeScrollAreaExample() {
  const [expanded, setExpanded] = useState(true);
  return <UIProvider><div style={{ display: 'grid', gap: 16, minWidth: 0 }}><Button variant="secondary" onClick={() => setExpanded(value => !value)}>{expanded ? 'Show short content' : 'Show overflowing content'}</Button>
    <ScrollArea label="Reference notes" orientation="both" style={{ height: 240, maxWidth: '100%', border: '1px solid var(--bui-line)', borderRadius: 6, padding: 16 }}>
      <div style={{ minWidth: expanded ? 680 : 0 }}>{Array.from({ length: expanded ? 18 : 1 }, (_, index) => <p key={index} style={{ marginBottom: 16 }}>Reference {index + 1} — keep the source, keyboard behaviour and expected result together.</p>)}</div>
    </ScrollArea></div></UIProvider>;
}`
  }
] as const;
