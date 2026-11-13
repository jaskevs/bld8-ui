# Resource workspaces and adjustable layouts

Development 0.4.0/unreleased. Retained 0.3.0 installs keep their published source.

`ResourceWorkspace<T>` composes the existing DataGrid with a source-bound draft,
filters, pagination, inspector, review dialog and explicit atomic batch save.
`DataWorkspace` and its `IssueDataWorkspace` alias retain the issue-specific API;
they now use the same controller as the inventory example. Neither grid nor
workspace writes automatically when a field changes.

## Define the domain

Every record has a stable `id` and positive integer `revision`. Define
`DataColumn<T>[]` and `ResourceFilterField<T>[]`; filter IDs must reference that
record's configured columns. Writable columns explicitly set `editable: true`.
Identity and revision remain read-only even if configured otherwise.

```tsx
import {useState} from 'react';
import {ResourceWorkspace, createMemoryResourceDataSource,
  type ResourceFilterField} from '@bld8/blocks';
import {UIProvider, type DataColumn} from '@bld8/ui';

type Item = {id: string; revision: number; name: string; stock: number};
const columns: DataColumn<Item>[] = [
  {key: 'id', label: 'SKU', type: 'text', hideable: false},
  {key: 'name', label: 'Product', type: 'text', editable: true, required: true},
  {key: 'stock', label: 'Stock', type: 'number', editable: true, min: 0},
];
const fields: ResourceFilterField<Item>[] = [
  {id: 'name', label: 'Product', kind: 'text'},
  {id: 'stock', label: 'Stock', kind: 'number'},
];

export function Inventory({rows}: {rows: Item[]}) {
  const [source] = useState(() => createMemoryResourceDataSource({rows, columns, fields}));
  return <UIProvider><ResourceWorkspace dataSource={source} columns={columns}
    fields={fields} labels={{label: 'Inventory', gridLabel: 'Inventory grid',
      title: 'Review stock changes together.', recordName: 'Item'}} /></UIProvider>;
}
```

The memory adapter is for examples and local state. It provides atomic validation,
revision checks and bounded in-memory request receipts; it is not durable storage
or an authorization layer. Keep its identity stable. Replacing the source or
schema establishes a new draft boundary, and an unresolved prior save is reported
for reconciliation with the previous service.

For production, pass your stable `DataSource<T>` with the existing `load(query,
{signal})` and `save({requestId, changes}, {signal})` methods. The host must validate
permissions, query fields, body size, canonical values and expected revisions,
then persist the whole batch atomically with durable idempotency receipts. The
existing Issue HTTP adapter and Next/Vite reference routes retain their bounded
body, response, revision and receipt checks. A generic TypeScript interface does
not validate remote JSON or grant access to records.

## Draft and save lifecycle

The controller accepts at most 100 loaded records per page, 30 columns, 100 drafted
records, 2,000 cells per edit action and 50 draft undo steps. A bulk operation
validates all loaded/editable destinations before changing the draft once. Invalid
field values can remain visible in a draft with linked errors; they cannot be
saved. The default inspector handles text, numbers, date-only values, booleans and
ordered arrays of option IDs. Arrays are copied rather than shared between rows.

Review is required before a service write. A valid success must acknowledge every
changed ID, a newer revision and the requested values. A lost, partial or malformed
acknowledgement preserves and locks the unchanged draft. Retry sends the same
request ID. Stopping a wait aborts the client request without claiming the service
rolled back. A late result cannot overwrite a newer request or a replacement
source. Conflicts require an explicit rebase; expected revisions update while
pending values remain available for another review. Draft undo never rewrites
already saved service history.

Use `useResourceWorkspace(options)` for a custom composition or
`createResourceWorkspaceController(options)` outside React. The controller exposes
`getSnapshot`, `subscribe`, `start`/`stop`, `setQuery`, `reload`, `edit`, `undo`,
`redo`, `save`, `stopWaiting`, `rebase`, `discard` and `getRecord`. Pair lifecycle
methods, do not mutate snapshots, and keep source/schema bindings stable.

## Customize the interface

`labels` sets the resource identity, heading, search, grid, empty-state and upload
copy. `formatValue(column, value)` formats review values. `renderField(context)`
can return a custom field or `undefined` for the built-in control;
`renderInspector(context)` replaces the inspector field collection. The context
includes the record, draft values, errors, disabled state and `setValue`. Render
fields rather than a nested form, respect the disabled state, and keep canonical
values intact. Validation and the single batch boundary remain in the controller.

`renderGrid(props)` can compose another grid while preserving that controller.
The supplied props include pending values, cell errors, bulk editing, undo/redo,
sort callbacks and the current controlled layout. It does not turn a paged source
into a complete local dataset: only loaded rows are eligible for a new edit.

`onUploadFile(file, {...context, recordId})` stays separate from batch save. The
host owns upload permission, size enforcement, storage and attachment linkage.
An upload acknowledgement never implies the record batch was saved.

## Saved and shareable views

`gridView` / `onGridViewChange` control column order, visibility, widths, pinning
and density. `defaultView` supplies an initial query and grid presentation.
`savedViews`, `onSaveView` and `onShareView` let the host own storage and URL updates.
The workspace does not mutate localStorage or the browser URL itself.

Create, parse and serialize views with `createResourceWorkspaceView`,
`parseResourceWorkspaceView` and `serializeResourceWorkspaceView`.
`resourceWorkspaceViewUrl` adds the serialized view while preserving unrelated
parameters and the hash. Only allowlisted filters, search, sorts, page size and
grid layout are included. Draft values, selection, row data, caches and current
page are excluded. Parsing is bounded to 48 KiB and the current schema; invalid
query fields reject the view and stale columns are reconciled. Search/filter text
is still URL content: the host should avoid putting confidential search terms in
shared links and must enforce access when loading the view.

## ResizablePanels

`ResizablePanels` accepts two to six stable-ID panels with labels, children,
percentage `minSize` / `maxSize`, optional `defaultSize` and `collapsible`.
`layout` / `onLayoutChange` implement controlled state; `defaultLayout` is the
uncontrolled alternative. `onLayoutCommit` is the host's persistence boundary.
No browser storage is accessed. The example saves only committed layouts.

The divider exchanges space only between adjacent panels. Pointer and touch
dragging track directly; keyboard, collapse and restore changes use eased motion.
Left/Right (Up/Down vertically) adjust by 2%, Shift by 10%, Home/End move within
constraints and Enter toggles an adjacent collapsible panel. Escape cancels an
active drag and restores its starting proposal without committing it. Horizontal
arrows and pointer movement follow the scoped direction in RTL.

Collapsing is refused when remaining panels cannot fill 100% within their maximum
sizes. Restoring recovers the remembered size within current constraints. Hidden
panel content is inert. Set `showControls={false}` only when keyboard separator
controls or your own external buttons provide the required restoration path.
`normalizePanelLayout`, `resizePanelPair` and `togglePanelLayout` are pure helpers
for validating host persistence and controlled proposals.

Horizontal groups narrower than `mobileBreakpoint` (640px by default, measured
from the component's container) stack every panel in source order and remove
dividers. Their desktop layout is retained for the wider view. This is a readable
fallback, including content collapsed on desktop. For a vertical group, give the
component a definite height; percentages then divide that available height.
System reduced-motion and scoped `motion="reduced"` remove eased transitions.

## ScrollArea

`ScrollArea` keeps native browser scrolling and platform momentum, wheel, touch,
keyboard and pinch zoom. Supply a `label`, a bounded height/width through style
or your layout, and `orientation="vertical"`, `"horizontal"` or `"both"`.
The named region enters the tab order only when content overflows; an explicit
`tabIndex` overrides that behavior. A ResizeObserver follows container and content
changes, and `onOverflowChange` reports the two overflow axes. The forwarded ref
points to the actual scrollable element, not a wrapper or simulated thumb.

Include the shipped UI/block styles once. Registry installations use the generated
modules under your configured UI alias; package imports in these examples target
the workspace and downloaded Next.js/Vite starters. New controls and examples
must pass the same verified release process as the rest of the library.
