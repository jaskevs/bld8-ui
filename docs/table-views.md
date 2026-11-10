# Table layouts and saved views

Set `multiSort` on DataTable to enable Shift-click ordered sorting (up to five
columns). Optional `TableQuery.sorts` stores that order; `sort` mirrors the first
item. Legacy single-sort state and saved links remain valid. For cell ranges,
typed batch editing and service conflict recovery, use the separate
[Data Workspace](data-workspace.md) rather than making the ordinary table a grid.

DataTable exposes controlled column order, visibility, widths and logical-edge
pinning. A view is the presentation of records; record order and selected records
have separate ownership. TableViewState packages the portable settings so the
same state can be saved by a host or placed in a share link.

DataTable keeps ordering state and keyboard position controls without adding a
drag-and-drop dependency. Choose the optional SortableDataTable wrapper when a
workflow needs pointer/touch dragging as well. Both share the table props and
view-state helpers. Install that wrapper separately through the registry:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/sortable-table.json
```

## Connect a layout

Give every column a stable key. Keep the same key when its label changes. Use the
complete column order, including hidden columns, when saving a layout.

```tsx
import {
  SortableDataTable,
  createTableViewState,
  type TableViewOptions,
} from '@bld8/ui';

const viewOptions: TableViewOptions = {
  columns: [
    {key: 'id', minWidth: 100, pinned: 'start'},
    {key: 'title', minWidth: 220, hideable: false},
    {key: 'status', minWidth: 140},
  ],
  filterKeys: ['status'],
  pageSizes: [10, 25, 50],
};

// Inside a client component. `columns` supplies the actual cells and labels.
const [view, setView] = useState(() => createTableViewState(viewOptions));

<SortableDataTable
  caption="Issues"
  rows={rows}
  columns={columns}
  rowKey={row => row.id}
  columnVisibility
  reorderableColumns
  resizableColumns
  density={view.density}
  columnOrderKeys={view.columnOrderKeys}
  onColumnOrderKeysChange={columnOrderKeys =>
    setView(current => ({...current, columnOrderKeys}))}
  visibleColumnKeys={view.visibleColumnKeys}
  onVisibleColumnKeysChange={visibleColumnKeys =>
    setView(current => ({...current, visibleColumnKeys}))}
  columnWidths={view.columnWidths}
  onColumnWidthsChange={columnWidths =>
    setView(current => ({...current, columnWidths}))}
  columnPinning={view.columnPinning}
/>
```

Import `useState` from React in the consuming component. Source installations use
the equivalent exports under the configured `bld8` UI directory; the workspace
package in this example is not published on npm.

This example uses SortableDataTable for pointer/touch ordering in the Columns
menu. Each Move action also opens a position picker that works with the keyboard.
Use DataTable with the same props when those position controls are sufficient;
it does not include dragging. Widths and pinning remain associated with the key, including
when a column is hidden. `start` and `end` are logical edges, rather than names for
physical left and right. Pinned columns remain at their edge; order changes stay within a pin group. Update columnPinning in host state to pin or unpin a column. Set `sortable: false` in the view schema for columns the
host cannot sort; this prevents an old saved sort being restored for that column.

## Save and restore

Use `serializeTableViewState(view, viewOptions)` before saving. Restore with
`parseTableViewState(text, viewOptions)`, which returns a normalized state or
`null` for invalid or unsupported input. `tableViewKey(view, viewOptions)` returns
the canonical serialized representation for comparisons, such as a Modified
indicator. None of these functions accesses storage, the network or the URL.

Read browser storage in a client effect. Catch read/write failures and show a
useful message; unavailable storage should not stop the table working. Save only
after restoration has completed, so an initial render cannot overwrite an
existing layout. A URL can use a parameter owned by the host:

```ts
const url = new URL(window.location.href);
url.searchParams.set('tableView', serializeTableViewState(view, viewOptions));
window.history.replaceState(window.history.state, '', url);

const raw = new URL(window.location.href).searchParams.get('tableView');
const restored = raw === null ? null : parseTableViewState(raw, viewOptions);
```

Preserve unrelated URL parameters. Share links include the saved search and facet
values, so treat those as visible data and avoid putting secrets in them. They do
not include records, selection, page position or a saved-view name. Store private
view names and ownership separately when using a service.

For an externally controlled table, keep its current page separately and connect
`view.query` through DataTable's `server.query` contract. On query changes, remove
`page` before updating the portable view, and use that page for the current
request. A host still owns fetching, aborting stale requests, authentication and
authorization. The existing IssueTable block demonstrates saved names, shareable
views and service query handling; its earlier links remain supported.

## Schema changes and validation

The current envelope is `version: 1`. Keep it when storing or sharing a view;
unsupported versions return `null`. An application-specific older envelope needs
an explicit host migration before passing it to this parser.

- Removed columns, their widths and their pins are dropped. Sorts on removed or
  non-sortable columns and unknown facets are dropped too.
- Columns absent from the saved complete order are considered new, appended and
  shown. Already-known hidden columns remain hidden. New columns inherit their
  declared pin; an existing column's explicit unpinned state remains unpinned.
- Required columns remain visible. If a schema permits hiding every column, the
  first ordered column is restored when the saved layout hides them all.
- Widths are rounded and constrained by the current minimum and 4096 px maximum.
  The default minimum is 100 px. Unsupported page sizes use the schema's first
  configured size. Defaults are 5, 10, 20, 50 and 100.
- Parsing is bounded to 100 columns, 50 facets, 1000 characters per search or facet
  value, and 65536 characters of serialized input. Duplicate keys, malformed
  values and reserved prototype keys are rejected. These checks do not authorize
  a query or replace validation of allowed facet values in the host service.

Normalizing clones state; input objects are not mutated. Canonical maps follow
schema order, while facet keys are sorted. Column order itself remains meaningful.

## Manual record ordering

An optional `onRowMove` callback receives a stable-key intent:

```ts
{rowKey: 'issue-12', targetKey: 'issue-4', position: 'before'}
```

`applyTableRowMove(rows, move, rowKey)` returns an updated array without changing
the supplied array. Missing targets, duplicate record keys and self moves are
rejected. Activate a row's Move action to choose a position with the keyboard.
SortableDataTable also lets pointer/touch users drag its move handle. Moves are
scoped to the visible page.

The host owns applying and saving the order. Await persistence before replacing
rows, or restore the previous rows if an optimistic save fails. For a service,
validate the record identities and expected revision atomically and return the
confirmed result; an ordering UI cannot decide concurrent write policy. A rejected
callback keeps the move available for retry. Selection stays keyed to record IDs.

Manual moves are unavailable when DataTable has sorting, search, facets,
grouping or its externally controlled `server` query enabled. Those views need
explicit host ordering semantics. Loading and save-in-progress states also block
new moves. This does not add row reordering to WindowedTable or change its
bounded-data contract.
