# Community library direction

Updated 28 October 2026. This is the UI library's ordered backlog, not a claim of
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
  Virtualisation and row grouping are not implemented. The filter builder now
  supplies a typed flat all/any query group; nested groups remain future work.
- The compact legacy ProjectBoard retains its status-select API. The new Kanban
  control and TaskWorkspace provide pointer/touch sorting and keyboard moves.
- Calendar/date fields are not a scheduling product. Charts are illustrative bar
  compositions, not a general chart library. Templates do not supply production auth.
- This first expansion adds a Timeline component, an ActivityFeed block, React/Next
  and community guides, issue forms and installable source. Verification is recorded
  separately in verification.md; do not infer that subsequent backlog items shipped.

## Ordered increments

| Order | Components and behaviour | Blocks to prove the API | Done when |
| --- | --- | --- | --- |
| 1 · Implemented locally | Filter rules, multi-value facets and saved query state | Complete issue table | Typed query contract, URL round trip, empty/error recovery and HTTP/server-query guidance; verified below |
| 2 · Implemented locally | Reusable Kanban and sortable interactions | Task workspace with board and backlog views | Pointer/touch drag, keyboard move dialog, atomic-order save callback, rollback, retry and cancellation; no drag-only actions |
| 3 · Implemented locally | Stepper, number field and time picker | Session setup with workspace details, time preferences and review | Step validation, back navigation, tab-draft restoration, locale-aware values, limits, abortable save/retry and pending/error behaviour |
| 4 | Tree and richer file metadata presentation | File browser and workspace navigation | Roving focus, expand/collapse, lazy-loading contract, selection and empty/error states |
| 5 | Chart primitives and table virtualisation/grouping | Analytics dashboard and large issue table | Real accessible summaries, measured representative datasets and documented limitations |
| 6 | Calendar scheduling and a narrow rich-text integration | Schedule and comment composer | Timezone/locale and sanitisation boundaries, keyboard flows, dependency/license review |

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
