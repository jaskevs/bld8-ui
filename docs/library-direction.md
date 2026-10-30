# Community library direction

Updated 30 October 2026. This is the UI library's ordered backlog, not a claim of
feature parity, a dated delivery promise or a change to the master roadmap's hours.
The user requested a free community library with deeper components and blocks,
and first-class React/Next.js adoption. Keep the existing Workbench milestone and
exam-study commitments intact; select one small library increment at a time.

## Product promise

Editable React source, useful workflows and careful interaction details. All
original components, blocks and templates use MIT, including commercial use.
No account, licence key, checkout or mandatory donation. Premium is only the
existing collection label; it has no access or support advantage. Voluntary
sponsorship can be considered later, independently of access.

React is the common foundation, with Next.js guidance for client boundaries,
loading, routing and service connections. Keep the reusable packages independent
of Next.js. Do not create competing React and Next implementations of each control.
React Native and Angular need separate implementations and are outside this slice.

## Baseline and honest boundaries

- The starting library has 43 component guidance entries, eight blocks and three
  templates. Entries are not a count of independent primitives or example variants.
- Registry installation, a 14-control playground, React Hook Form and the Outline
  HTTP example exist. Packages are not published to npm.
- Tables support editing, selection, column controls and externally fetched data.
  The separate bounded windowed view and row grouping are documented below. The filter builder now
  supplies a typed flat all/any query group; nested groups remain future work.
- The compact legacy ProjectBoard retains its status-select API. The new Kanban
  control and TaskWorkspace provide pointer/touch sorting and keyboard moves.
- Calendar/date fields are not a scheduling product. The early metrics overview
  retains its illustrative bars. The new Chart is a bounded categorical comparison
  component, not a general charting engine. Templates do not supply production auth.
- This first expansion adds a Timeline component, an ActivityFeed block, React/Next
  and community guides, issue forms and installable source. Verification is recorded
  separately in verification.md; do not infer that subsequent backlog items shipped.

## Ordered increments

| Order | Components and behaviour | Blocks to prove the API | Done when |
| --- | --- | --- | --- |
| 1 · Implemented locally | Filter rules, multi-value facets and saved query state | Complete issue table | Typed query contract, URL round trip, empty/error recovery and HTTP/server-query guidance; verified below |
| 2 · Implemented locally | Reusable Kanban and sortable interactions | Task workspace with board and backlog views | Pointer/touch drag, keyboard move dialog, atomic-order save callback, rollback, retry and cancellation; no drag-only actions |
| 3 · Implemented locally | Stepper, number field and time picker | Session setup with workspace details, time preferences and review | Step validation, back navigation, tab-draft restoration, locale-aware values, limits, abortable save/retry and pending/error behaviour |
| 4 · Implemented locally | Tree and richer file metadata presentation | File browser and workspace navigation | Roving focus, expand/collapse, lazy-loading contract, selection and empty/error states |
| 5a · Implemented locally | Bounded chart primitives | Analytics dashboard | Exact data, keyboard exploration, null gaps, report recovery and measured representative data; verification recorded below |
| 5b · Implemented locally | Table virtualisation/grouping | Large issue table | Measured representative datasets, stable keyboard/selection behaviour and documented limitations |
| 6a · Implemented locally | Day agenda and bounded UTC availability | Schedule planner | Timezone/locale, repeated-hour labels, abortable booking/retry and host revision/overlap boundaries |
| 6b | Narrow rich-text integration | Comment composer | Sanitisation boundaries, keyboard flows and dependency/licence review |

Add authentication layouts, team/access settings, notification preferences, command
search and empty/error states as the earlier components expose reusable gaps. Then
assemble complete CRM, project-management and developer-console templates from the
same blocks. Prefer one complete workflow over many nearly identical screenshots.

## Release standard

Every new component needs a typed public API, matching prop guidance, meaningful
interaction tests, keyboard behaviour, both themes, reduced motion and mobile
containment. A block must demonstrate the service/state boundary and relevant
loading, error, empty, disabled and retry states. Do not label a frontend sample as
authentication, delivery, storage or a live service.

Every installable addition needs registry dependency/license checks and an actual
shadcn CLI consumer install/build. Verify React/Vite and Next.js independently
before widening compatibility claims. Keep migration notes for public API changes.
Check focus, reading order, visual alignment and real content manually; automated
axe scans do not establish accessibility certification.

## Adoption without lock-in

- Make previews, source, API tables and installation easy to find; no signup wall.
- Publish small coherent releases, a changelog and migrations when APIs change.
- Accept reproducible issues and use-case-driven requests; keep response-time
  expectations honest. Do not add a promised commercial support tier.
- Measure installation friction through voluntary feedback first. No invented
  usage, testimonials, star counts or telemetry. Consider any analytics separately.
- After the catalogue is stable, add machine-readable documentation and registry
  discovery so tools can find the same supported APIs. An MCP service is a later
  integration, not a prerequisite for a useful library.

Success means developers can install a useful workflow, adapt it to their product,
upgrade it safely and contribute a fix. Raw component counts alone are not evidence
of adoption or quality.

## Framework adoption update - 28 October 2026

Vite is now a first-class client-app option alongside Next.js: every catalogue
block/template has both starters, with the same BLD8 package source. The canonical
guide is /frameworks; existing /react-nextjs bookmarks remain supported. The two
HTTP integration archives still use their Next.js sample API. Keep server/routing
migration boundaries explicit and the independent Vite starter check in CI.

## Issue workflow increment - 28 October 2026

FilterBuilder and the IssueTable block implement the first ordered increment.
The catalogue now has 45 component guidance entries, ten blocks and three
templates, with 13 Vite and 15 Next.js ZIPs. The table includes search, sorting,
visible columns, density, multi-page selection, inline titles, creation, bulk
status changes and revision-checked undo. Applied view state is URL-shareable;
filter drafts stay separate until Apply. Saved views use browser storage.

Motion is part of the interaction contract: eased filter-row entry/removal,
filter-panel expansion, a shared saved-view indicator and steady loading rows.
Focus returns to a meaningful control after removal; exiting controls are inert.
Reduced-motion preferences remove the animated travel and delay.

The default issue repository is in memory: record changes reset on reload. The
typed HTTP adapter and pure query evaluator are documented at /integrations/issues;
authentication, authorisation, a database and a hosted issue API belong to the
consumer. One flat all/any group is supported, with no nested queries or SQL.
Scheduling and virtualisation increments remain planned; the later Kanban update
below records the separately verified second increment.
See verification.md for the actual local checks and adoption evidence.

## Kanban and backlog increment - 28 October 2026

The reusable Kanban control owns drag previews and the keyboard Move dialog;
applyKanbanMove is a pure immutable order helper. The TaskWorkspace composition
adds Board/Backlog views over the same data, task creation, a three-item active
work limit and abortable revision-checked snapshot saves. Rejected writes restore
the previous order, and a retry cannot silently replace a newer local snapshot.

Default tasks last for the current session. No database, authenticated API or
collaborative service is supplied. Consumers own atomic revision checks and
authorisation. Dragging is handle-only, and the same handle opens the keyboard
alternative. Narrow containers stack columns in reading order. The existing
ProjectBoard remains compatible with its older status-selection example.

White cards, quiet shadows and shared easing carry through the board and aligned
backlog. System reduced-motion changes now update the Motion-backed filter, issue
and task interactions without requiring a reload. The catalogue contains 46
component guidance entries, eleven blocks and three templates; 16 Next.js and
14 Vite ZIPs accompany 110 registry items. See verification.md for the local
checks. Number fields, time pickers, scheduling and later increments are not
claimed complete by this work.

## Setup controls and session preferences - 28 October 2026

Stepper, NumberField and TimePicker are independently installable. SessionSetup
composes them into workspace details, preferred session settings and review.
Values survive back navigation and, by default, tab reloads through sessionStorage.
Storage adapters and page-only mode are explicit; unsupported saved data is kept
until the user edits, and write failures retain values in the page.

NumberField uses Base UI locale parsing and bounded keyboard/button stepping.
Time labels can use 12/24-hour display while stored values remain HH:mm. This is
a date-free preference, not a reservation or a DST/availability engine. The save
callback receives an AbortSignal and requestId; host authentication, validation,
idempotency and persistence remain application responsibilities.

The desktop action row stays fixed across steps. White panels, neutral summaries,
quiet recovery notices and shared easing continue the established design. Live
reduced motion removes animated travel; phone layouts stack in reading order.
The catalogue now has 49 component guidance entries, twelve blocks and three
templates, with 121 registry items and 32 ZIPs (17 Next.js, 15 Vite). The next
ordered increment remains Tree/file-browser/navigation; scheduling, rich text,
virtualisation and later work are not claimed complete.


## Release-quality foundation - 29 October 2026

The locally prepared workflow now requires clean Next.js/Vite registry consumers
and a separate pinned Linux visual/cross-browser suite behind one aggregate
release check. The Vercel production gate is configured; its next-deployment hold
and promotion remain to be observed. See verification.md and ci-and-vercel.md for
evidence and publication status. This does not complete the planned theme lab,
Tree/file-browser increment or any Workbench milestone, and it does not change
the fixed roadmap allocation.

## Theme lab - 29 October 2026

The local theme lab now implements three starting presets, colour and typography
choices, density, corner radius, shadows, isolated light/dark previews, shareable
URLs and portable CSS export. It uses the existing UI controls and theme tokens;
a pure helper is available to source and registry consumers without the lab.
Contrast, mobile geometry, reduced motion and themed body portals are checked.
See theme-lab.md for integration and verification.md for evidence.

This adds two routes and two registry entries, bringing the build to 92 routes
and 123 registry items. The 49 guidance entries, twelve blocks, three templates
and 32 starters remain. Tree/file-browser/navigation is the next ordered control
increment. Scheduling, rich text, virtualisation and Workbench remain separate
work; this increment does not change the fixed roadmap allocation.

## Tree and file metadata increment - 29 October 2026

Tree now supplies roving focus, explicit selection, keyboard/typeahead traversal,
controlled lazy-loading requests and smooth accessible expansion. FileBrowser
proves the API through folder navigation, breadcrumbs, local search/sort and a
metadata inspector. Its abortable loader rejects stale and invalid responses,
retains successful child data and provides quiet per-folder retry. It does not
read, host or transfer actual files. See file-browser.md and verification.md.

The local build now contains 50 guidance entries, thirteen blocks, three templates,
129 registry items and 34 starters (18 Next.js, 16 Vite). This does not mark
Workbench or roadmap milestones complete or change the fixed allocation. The
next ordered increment is accessible chart foundations and measured large-table
work; scheduling and rich text remain later work. No publication is implied.

## Charts and analytics increment - 29 October 2026

Chart adds line/bar/area views over the same labelled series, with signed values,
explicit null gaps, patterns, roving point focus and an exact data table. The
AnalyticsDashboard composition provides reporting periods, three derived metrics,
abortable source-scoped loading/retry and formula-safe CSV export. Its records
are illustrative until the host supplies loadReport; collection, aggregation,
permissions and time boundaries remain application responsibilities.

The rendered comparison is bounded to 366 observations and six series. It does
not interpolate dates, stream, stack or downsample larger data. Dense-data
measurements and validation are recorded in verification.md. Table virtualisation
and grouping remain the separate next increment, with scheduling/rich text later.
The catalogue contains 51 guidance entries, fourteen blocks and three templates;
135 registry items and 36 ZIP starters carry the same source (19 Next.js,17 Vite).
This source remains local until an authorised release.


## Grouped and large tables - 30 October 2026

DataTable now accepts optional row grouping. WindowedTable is a separate native
table view for complete bounded datasets, with fixed single-line rows, logical
keyboard navigation and supplied-record selection. LargeIssueTable composes
both reading views with shared selection and a parent-owned detail editor.
The existing paged IssueRepository protocol and inline editor remain compatible.
See large-tables.md for limits, group-count scope and callback ownership.

Representative 10,000/20,000-record checks and source installation evidence are
recorded in verification.md. Scheduling and rich text remain the next ordered
increment; this does not change Workbench milestones or the fixed allocation.


## Day agenda and availability - 30 October 2026

DayAgenda displays supplied windows and appointments using explicit UTC offsets.
SchedulePlanner combines date, zone and duration controls with a retained booking
draft and abortable callbacks. Host-supplied UTC instants avoid guessing how local
clock times map to instants; the pure model checks revisions, bounds and overlaps.
The host must make its authorisation and revision/overlap write atomic.

The day view is bounded to 200 availability windows and 500 appointments, each
at most 24 hours. Whole-minute source instants and 15–120 elapsed-minute bookings
are explicit limits. This adds no new dependency. Recurrence, resource scheduling,
calendar sync and rich text remain future work; the fixed allocation is unchanged.

The preceding mobile-preview fix changes the issue workspace to size itself from
its own container. Embedded narrow previews are now tested as well as actual
phone viewports; audit evidence and workflow checks are in verification.md.
