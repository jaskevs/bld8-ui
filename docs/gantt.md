# Gantt task planning

Gantt displays supplied tasks on day or week scales, with progress, milestones
and finish-to-start dependency links. Horizontal arrows, pointer moves and edge
resizing create proposals. A review dialog edits the same dates, progress and
incoming dependencies. Saving always requires explicit confirmation.

## Dates and dependencies

Task startDay/endDay values are civil YYYY-MM-DD dates. The end is exclusive:
16 November through 18 November covers the 16th and 17th. A milestone has equal
start/end dates and no resize handles. Civil arithmetic never resolves a local
wall clock or creates a zone instant. Use ResourceScheduler for resource bookings
over supplied UTC instants; recurrence is a separate bounded module.

Each finish-to-start link has from/to stable task IDs and a nonnegative integer
lagDays. The successor starts on or after its predecessor's exclusive end plus
that lag. Duplicate links, missing endpoints, self links and cycles are rejected.
Editing a task validates its outgoing effects as well as its incoming links.
Other tasks never cascade or move silently. This version has no critical path,
working-day calendar, roll-up hierarchy, cross-project or resource-level engine.

## Reading and interaction

The contained timeline renders dependency arrows and focusable task bars.
Horizontal arrows move by one civil day. Shift resizes the end; Control or Command
resizes the start. Milestones always move as one date. Reading direction reverses
logical horizontal movement. Enter opens review and Escape discards an unsubmitted
proposal. Pointer actions snap to whole days, preview their position and open
review on release. Escape, cancellation and lost capture restore the previous
draft. Every operation has a keyboard and dialog counterpart.

Phones use Task list as the timeline alternative. Exact table exposes dates,
progress, revisions and complete incoming-link labels through ordinary table
semantics. Native scrolling and zoom remain available. Motion follows scoped
and live system reduced-motion settings. Display labels use the scoped locale;
canonical dates, task IDs and host-authored titles remain unchanged.

## Controlled persistence

Provide GanttSnapshot with a global revision, per-task revisions and dependencies.
onSave receives one GanttChange, AbortSignal and stable requestId. Authorise access
and atomically check revisions, dates and the entire dependency graph before
committing. Retain durable idempotency receipts. A replay of the same ID/payload
returns its previous result without another write; a changed payload needs a new
ID. Return the complete canonical snapshot. Successful acknowledgements must
identify the request/task and advance exactly the reviewed task and plan revision.

A validation rejection retains the editable proposal. A conflict shows the latest
dates and requires an explicit revision rebase. Transport errors or malformed
acknowledgements lock an uncertain proposal until the unchanged request is
reconciled. Stopping waiting aborts only the client wait, not a server transaction.
Replacing sourceKey or onSave ignores a detached service's late result; the old
service can still need reconciliation. Keep host callbacks stable.
An older successful receipt confirms its operation without replacing a newer
revision already supplied by the host. Conflict comparison also retains the
newest known plan revision.

createMemoryGantt is an illustrative single-process adapter with 100 receipts.
It resets on reload and supplies no authentication, durable storage or multi-user
service. Application services own those guarantees.

## Bounds

Supply at most 500 tasks, 1,000 dependency links and 84 visible civil days. Ordinary
tasks span 1 to 366 days; lag is 0 to 366 days; progress is an integer from 0 to 100.
The view clips tasks to the visible range. This is a bounded supplied-data view,
not row virtualization, automatic remote loading or an external project service.
