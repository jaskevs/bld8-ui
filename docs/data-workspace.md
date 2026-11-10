# Data Workspace

Development 0.3.0/unreleased. These APIs are not included in retained 0.2.0.

`DataGrid` is an optional editable grid. `DataWorkspace` composes it with Issue
queries, filters, paging, record details, a change review and one atomic save.
The ordinary `DataTable` stays separate and does not import grid or drag code.

## Choose the integration

- Use DataTable for readable rows, selection and individual actions. Set
  `multiSort` to enable Shift-click sorting by up to five columns. Existing
  `TableQuery.sort` and version-1 saved links remain supported; optional `sorts`
  holds the ordered criteria and `sort` mirrors the first criterion.
- Use DataGrid when people need keyboard cell ranges and spreadsheet paste.
  Supply loaded rows, typed columns, `onEdit`, cell errors, dirty cells and host
  undo/redo callbacks. Set `editable: true` on writable columns; omission keeps
  them read-only. It never writes to a service by itself.
- Use DataWorkspace for the complete Issue workflow. Its default source contains
  illustrative in-memory records. Pass a stable `DataSource<Issue>` to connect
  your own service. The HTTP reference uses the same contract in Next.js and Vite.

```tsx
'use client';
import {useMemo} from 'react';
import {DataWorkspace} from '@bld8/blocks';
import {createIssueDataHttpSource} from '@bld8/blocks/issue-data-source';

export default function Issues() {
  const source = useMemo(() => createIssueDataHttpSource('/api/issues'), []);
  return <DataWorkspace dataSource={source} />;
}
```

The repository-package import above is for the workspace starters. Registry
installs use the installed `bld8/blocks/data-workspace` and
`bld8/blocks/issue-data-source` modules under your configured UI alias. Wrap
overlays in UIProvider and include the shipped UI/block styles.

## Query and atomic save contract

The workspace's Add filter menu searches field names and edits one condition at
a time. Confirm Apply filter to update the query; editing values alone does not
reload records. Applied conditions appear as editable chips with individual
remove actions, Match all/any and Clear filters. Numeric/date ranges share the
same validation as advanced conditions. Filtering preserves unsaved row drafts.

Advanced opens the full grouped builder. Quick chips represent only direct root
conditions, while nested groups remain grouped and keep their negation/match
semantics. Group summaries reopen Advanced. Unapplied advanced edits temporarily
disable quick changes until they are applied or cleared, so the two editors do
not silently replace one another's pending configuration.

`DataQuery` contains search, a bounded `AnyFilterQuery`, ordered `sorts`, a
one-based page and pageSize. Filtering and sorting happen before service paging.
Nested queries use the same evaluator as the existing Issue workspace.

`DataSource<T>.load(query, {signal})` returns `{rows, total}`.
`save({requestId, changes}, {signal})` returns a discriminated `BatchResult<T>`:

```ts
{ok: true, rows: updatedRecords}
// or: no record in the batch was written
{ok: false, code: 'validation', errors: [{id, key, message}]}
{ok: false, code: 'conflict', conflicts: currentServerRecords}
```

Each change has a stable id, expectedRevision and typed field values. The server
must authenticate the caller, authorise every row/field, validate the entire
request and check all revisions inside the same transaction as its writes.
Do not implement a batch as independent requests or `Promise.all` updates.

The Issue adapter edits title, status, priority, assignee, estimate and due date.
IDs and revisions are read-only. Dates are civil `YYYY-MM-DD` values, not inferred
UTC instants. Numeric values are parsed and bounded before saving. Choice values
use stable IDs rather than display labels.

## Editing and recovery

Drag across loaded cells to select a rectangle, or use Shift+click to extend it.
Arrow keys move between cells; Shift+arrows extends a rectangular range.
The range uses a quiet neutral fill and one perimeter outline. Display cells do
not start a competing native text selection; native selection stays available
inside editors, and touch gestures retain normal scrolling.
Enter/F2 opens a native editor, Escape cancels it, and Tab completes the editor
before moving. Native text selection and editor undo keep their normal behaviour.
The editor shares the cell's single focus boundary; it adds no nested input ring.
Its text stays aligned with the display value, and entering edit mode preserves
the row height. Touch editors retain at least 16px text and a larger target.
Select columns use portalled choice menus with selected checks, keyboard
navigation and collision handling. Choosing a value updates the local draft and
returns focus to the cell. Escape cancels; Tab and Shift+Tab move to neighbouring
cells. Set `DataColumn.searchable` for a searchable menu; more than seven options
enable search by default. Search filters labels but writes canonical option IDs.
The Issue workspace enables it for Assignee. Menus leave page scrolling unlocked.
Copy/paste uses quoted TSV and stays inside the currently loaded page. Bounds and
read-only fields are checked before applying a paste; there is no partial paste
on a structural error. Invalid typed values remain in the draft for correction.

Review lists the changed fields before saving. Undo/redo affects local draft
edits, including a whole paste as one step. A successful save starts a fresh
history; it does not rewind committed service data. Drafts remain while changing
query pages. They are session-local rather than browser-persisted sensitive data.
Changing the source deliberately resets the workspace.
Create a new adapter when the authenticated account or workspace scope changes;
a stable object whose hidden credentials change cannot identify that boundary.

Network errors retain the exact pending request ID and values for safe retry.
Editing, history and discard actions stay locked while that result is unconfirmed.
If a client stops waiting, a remote write may still have committed: retry the
same transaction to reconcile before submitting a different one. Conflict
feedback preserves local values and displays the newer server snapshot. Rebase
is explicit and adopts a newer expectedRevision while keeping the proposed
values; it does not silently overwrite another user's changes. Review again.

An optional `onUploadFile(file, context)` includes the inspected `recordId`.
Upload receipts report acknowledgement only. The host must separately implement
storage, authorised attachment ownership and a record-attachment transaction.

## Durable local HTTP reference

Download `/downloads/data-workspace-http.zip` for Next.js or
`/downloads/data-workspace-http-vite.zip` for React + Vite. Both include editable
packages and the same server-only handler and persistent store. Install with
Node 22. Next uses a Node API route. Vite runs a separate loopback Node API and
forwards `/api/issues` through its development proxy; consult the ZIP README.

The reference persists records and bounded request replay receipts to a private
local snapshot. A serialized transaction acquires an exclusive lock, rereads the
snapshot, validates all changes and revisions, then atomically replaces it.
While retained, retries of the same request and payload return the saved result
across a restart. The reference retains the latest 100 successful batch receipts;
older retries still encounter revision checks rather than silently duplicating writes.
Do not delete a leftover lock until you establish that no writer is active.
Corrupt snapshots are rejected rather than overwritten with seed data.

This is a single-server reference, not a distributed database or authentication
service. Use a transactional database and real ownership checks for hosted data.
An ephemeral/serverless filesystem is unsuitable for this adapter. The public
showcase uses in-memory sample data and does not expose this local disk service.

## Adoption checks

Check a valid multi-row paste, invalid number/choice/date values, draft undo/redo,
service paging, a rejected save, a lost-response retry, two stale clients and
explicit conflict rebase. Verify keyboard focus, mobile containment, both themes
and live reduced motion. Do not infer physical iPhone keyboard behaviour from
desktop WebKit. For discovery, use the generated component/block Markdown, the
structured catalogue or the optional local read-only MCP server.
