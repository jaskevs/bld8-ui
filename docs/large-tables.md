# Grouped and large tables

Use DataTable for ordinary pages, inline editing and service-backed queries.
Use WindowedTable when the browser already has a complete, bounded dataset and
only a small portion needs to be mounted. Both accept the same Column<T> shape.
The examples at /components/windowed-table and /blocks/large-issue-table offer
Scroll and Pages over the same supplied records and selected IDs.

## Group ordinary pages

```tsx
import {DataTable} from '@bld8/ui';

<DataTable caption="Issues" rows={issues} columns={columns}
  rowKey={issue=>issue.id} pageSize={20}
  grouping={{key:issue=>issue.status,label:key=>statusLabels[key]}}
  selectable selectedKeys={selected} onSelectedKeysChange={setSelected}/>
```

Groups preserve first occurrence and source order. Local group counts and group
selection cover every supplied, filtered member, including members on other
pages or in collapsed groups. The page checkbox selects only that page's records.
When server is supplied, group counts and group selection describe only the
supplied service page; they do not imply a query-wide server selection.

Grouped pagination counts flattened entries, including group headings. A page
starting inside a group repeats its heading for context without counting it
again. A boundary heading can also appear at the end of the preceding page.
Collapsing a group preserves selection and returns focus to its disclosure.
The disclosure refuses to collapse a group containing an active EditableCell;
save or cancel that edit first. Hosts controlling collapsed keys must apply the
same draft policy before changing them programmatically.

## Window a complete dataset

```tsx
import {WindowedTable} from '@bld8/ui';

<WindowedTable caption="Issues" rows={filteredAndSortedIssues}
  columns={columns} rowKey={issue=>issue.id} rowLabel={issue=>issue.id}
  height={480} rowHeight={56} overscan={5}
  grouping={{key:issue=>issue.status,label:key=>statusLabels[key]}}
  selectable selectedKeys={selected} onSelectedKeysChange={setSelected}
  onRowAction={issue=>openDetails(issue)}
  sort={sort} onSortChange={setSort}/>
```

Column widths, minimum widths, flex, alignment and pinning are supported. Pass
already chosen columns; the windowed view does not provide column visibility or
resizing controls.

The host filters and sorts records; onSortChange reports intent and does not
reorder them. Supply stable, unique nonblank record/group keys of at most 256
characters. Limits are 20,000 supplied records, 40,000 flattened entries,
240–800px viewport height, 44–96px fixed row height and 0–12 overscan rows.
This is a single-line display view. Keep forms, variable-height content and
EditableCell outside its rows. It does not fetch pages, estimate variable sizes,
provide infinite loading, aggregate server queries or support nested groups.

The native table exposes logical row indices/counts; hidden spacer rows are not
data. Arrow keys move between logical rows, Home/End jump, PageUp/PageDown move
by the viewport, Space selects and Enter opens details. Group disclosures also
support Left/Right. Header and group checkboxes act on all supplied records or
all supplied group members, rather than only mounted rows. One active row may
remain mounted outside the visible window to preserve focus and a dialog trigger.

Scrolling follows the pointer or keyboard immediately. New rows do not animate
their position. Hover, focus, disclosures and the view indicator use shared
easing; reduced motion removes decorative travel. Offer an ordinary paged view
for sequential reading and verify assistive technology with your actual data.
Automated accessibility checks are not accessibility certification.

The pure helpers buildTableRows, getTableWindow and getTablePage are exported
from @bld8/ui/table-grouping, including in Server Components. Registry installs
use the equivalent bld8/table-grouping file.

## Large issue workspace

```tsx
import {LargeIssueTable} from '@bld8/blocks';

<LargeIssueTable loadRows={loadCompleteIssues} onSaveIssue={saveIssue}/>
```

Keep both callback identities stable, for example with useCallback. loadRows
receives {signal} and returns the complete Issue[] dataset, up to 20,000 records.
It is distinct from IssueRepository.list, which returns a service page. Do not
pass a page to this block while describing it as a complete queue. The existing
IssueTable, HTTP adapter and their page limits remain compatible.

onSaveIssue receives {id,expectedRevision,patch} and {signal}. Return the complete
saved Issue with the same ID, the submitted title/status and a newer positive
revision. The host must validate permissions and atomically check the expected
revision before committing. The UI validates responses, ignores stale/aborted
completions and retains rejected drafts. Cancelling a pending save aborts the
client request; a server may already have committed, so reload to reconcile.

Detail drafts live outside windowed rows. Scroll/Pages share selection, filters,
sort and collapsed groups. Selected records outside the filter remain visible
in the selection summary and can be cleared or exported. CSV exports explicit
scalar values, escapes spreadsheet formula prefixes and includes the selected
loaded records only. Source reload clears selection and rejects stale drafts.

Without callbacks, 10,000 deterministic illustrative records and edits last for
the page session. With loadRows alone, edits still stay in this page. No API,
account, database, ownership service or collaborative synchronisation is supplied.

Install the component or block source:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/windowed-table.json
npx shadcn@latest add https://ui.bld8.dev/r/large-issue-table.json
```

The block also includes Next.js and Vite starters. Public URLs contain the
published version; locally prepared additions become available after release.
