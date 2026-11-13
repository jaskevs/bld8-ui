# Large and hierarchical data

`DataGrid` keeps its default limit of 100 supplied records and 30 columns.
`virtualization={{height:480,rowHeight:64,overscan:4}}` opts into a fixed-height
row window over up to 20,000 already-loaded records. This does not fetch service
pages or virtualize columns. Use `AdvancedDataGrid` for a Scroll/Pages switch,
explicit tree loading, a separate expandable detail region and scoped summaries.

## Fixed rows, retained editors

Only the visible row window, overscan and up to three active/editor rows remain
mounted. Spacers retain logical positions; focused or editing rows keep their
native DOM identity while manually scrolling. Keyboard movement to an unmounted
row renders and focuses it before continuing. `navigationRef` exposes
`focusCell(id,key)` for programmatic navigation within the supplied view, returning
false for an unavailable cell or an active editor. Column pinning and logical
layout rules continue to apply. Virtual custom editors must fit one fixed row;
put complex content in a popup or the separate details region.

Uniform row heights are 56–96 pixels; viewport heights are 240–800. Full error
messages remain accessible even when their visual single-line label is truncated.
Copy/paste and bulk edits retain their existing limits: 100 records, 2,000 changed
cells, and the 100-by-20, 64 KiB clipboard boundary. A large selection is rejected,
never silently shortened. Writes, revision checks, draft history and atomic saves
remain with the host. Pages provide a sequential reading alternative over the
same supplied records. No frame-rate or assistive-technology certification is
implied by bounded DOM tests.

## A tree is explicitly loaded data

`tree.parentId(row)` returns null for a root and a supplied parent ID for a child.
IDs are unique, parents must exist, cycles are rejected and depth is at most eight.
`hasChildren` may mark a parent whose children are not loaded yet.
`loadChildren(parent,{signal})` returns at most 1,000 direct children per request.
The component validates identities and parentage before exposing a response.
Validation uses the latest accepted records and reserves identities before a
second child response can settle in the same render batch. A conflicting parent
receives retry feedback; its invalid batch never reaches `onChildrenLoaded`.

Loads are aborted on collapse, service replacement and unmount. Aborted or stale
responses cannot repopulate a newer source; changed parent revisions require a
fresh child response. Supply a stable loader and change `sourceKey` when the
account or service changes. Failures expose retry without clearing host drafts.
`onChildrenLoaded(parent,children)` lets controlled hosts retain these records;
supplied records override cached values, so the host remains responsible for
reflecting accepted edits. The cache is not durable storage.

Grid ranges cover only visible loaded records (or the current page). Collapsed
and unknown children are excluded. Expanding a parent does not select unloaded
descendants. The first column supports logical expand/collapse keys and parent
navigation; tree rows expose their depth and expansion to assistive technology.
`renderDetails` uses a separate reveal region, keeping virtual row heights fixed.

## Summaries state their scope

`summaries` specifies count, sum or average with stable IDs and field keys.
Local summaries cover the currently supplied visible records, including records
outside the mounted window, or only the current page in Pages mode. Absent numeric
values are excluded; invalid numbers fail explicitly. An empty average is absent.

`allMatchingSummary` is a separate host-computed snapshot containing a query key,
record count and matching summary values. Its query key must equal the current
`queryKey`; stale or malformed totals are rejected. The host owns service-side
aggregation, authorisation and query consistency. Page totals cannot be presented
as complete service totals. The hierarchy example's full-match snapshot is an
authored fixture, explicitly labelled as such.
