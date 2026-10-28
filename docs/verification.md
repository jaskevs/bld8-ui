## Setup controls and session workflow - 28 October 2026

Added Stepper, NumberField and TimePicker, plus the SessionSetup block. The
three-step workflow validates workspace details and session preferences before
review, retains values on back navigation, and restores drafts/current steps and
finished summaries from sessionStorage. A stable adapter or explicit page-only
mode can replace tab storage. Unsupported data is not overwritten until the user
edits; failed storage retains page values and explains the limitation.

NumberField uses the installed Base UI primitive for locale parsing and bounded
keyboard/button stepping. TimePicker uses shared Select behaviour, same-day
inclusive bounds and explicit intervals. Localised labels remain separate from
canonical HH:mm form values. Pure time-options and session-preferences subpaths
can be evaluated by server code without React client boundaries.

The optional save callback receives an AbortSignal and a requestId preserved for
retries of unchanged values in the mounted form. Failed saves retain the review;
cancellation ignores late completion. The host owns authenticated persistence,
server validation and idempotency. This is a preference workflow, not a calendar
reservation, availability service or date/DST resolver.

Shared easing introduces steps and completion markers without blur or resizing
hit areas. Desktop actions keep a stable position across steps; field heights and
metadata align. Phones stack the sequence, fields and summary. System reduced-
motion changes update the controls immediately. Recovery stays on quiet neutral
surfaces in the direction approved for task errors.

Validation:
- Production build passed with 90 generated routes, 49 component guidance entries,
  twelve blocks, three templates and 121 registry items. Workspace types passed.
- The full isolated Edge suite passed all 227 cases without retries or skips.
  After final storage-copy and native form-value assertions, all 30 affected
  session/framework cases passed again. The 21 new session cases cover canonical
  time/range/locale rules, safe draft parsing, numeric/keyboard limits, decimal
  commas, disabled/read-only controls, unavailable slots, step navigation, field
  focus, reload restoration, save retry identity, cancellation, storage failures,
  both-theme automated axe checks, stable actions, live reduced motion and
  1440/768/390/320 px containment. Existing controls and workflows remain green.
- The actual shadcn CLI installed the new graph into two fresh consumers. Both
  Next.js 16.3.8 and Vite 8.3.4/React 19.3.0 built independently; Vite used a custom
  UI alias. Next evaluated time choices and session validation in a Server
  Component. The final copy update was installed and both builds passed again.
  Vite emitted its expected module-level use-client warnings.
- A fresh session-setup-vite.zip extraction installed and built via the repeatable
  starter check. Its isolated browser run preserved an unsaved draft through an
  observed React Fast Refresh, restored the current step and finished summary
  after reload, retained canonical native form time, reacted to live reduced
  motion and stayed contained on a phone. No browser page errors were reported.
- All 32 archives passed CRC, safe-path, licence, environment/runtime-file and
  final-CSS audits. Internal registry dependencies resolve, targets respect UI
  aliases and public dependency URLs retain the production host. No new runtime
  dependencies or upstream source were added; existing notices remain intact.
- Workspace, preferences, review, phone and dark views were captured and reviewed.
  The desktop action row shared the same measured position across all three steps.
  CI now builds the actual session Vite archive; remote CI has not run for these
  uncommitted changes. Diff whitespace checks passed.

The complete Vite session starter retains a roughly 559 kB minified entry chunk
(183 kB gzip) and emits the unchanged size warning; code splitting is a follow-up.
Automated Edge/axe checks do not replace manual assistive-technology or other-
browser review. This is a local verified increment, not a published release.
No commit, push, deployment, npm publication or company/global settings changed.
Temporary registry/test/starter servers were stopped; the main development preview
remains at http://127.0.0.1:3120/blocks/session-setup.

## Task error-panel refinement - 28 October 2026

Refined the task recovery notices shown in the user's screenshot. Neutral surfaces,
dark headings, muted descriptions and a small error icon replace the broad red
fill. Retry actions occupy a separate aligned column on desktop and sit below the
copy on narrow screens. Shared easing adds a short entry transition; reduced
motion removes it. This is scoped to task recovery notices and their layout.

Production build and all 18 Kanban checks passed. Existing recovery, theme and
responsive cases now also inspect the error panel, action spacing and both-theme
automated accessibility. Desktop, phone and settled dark-mode captures were
reviewed; retry restored the board and no page errors were reported. All 30
archives passed the existing integrity/licence/final-CSS audit. The real shadcn
CLI updated the isolated Vite consumer, which built independently. No dependencies
or public component props changed. Diff whitespace checks passed.

Local refinement only; no commit, push or deployment. The development preview
remains at http://127.0.0.1:3120/blocks/task-workspace.

## Kanban, backlog and save recovery - 28 October 2026

Added a controlled Kanban primitive, the pure applyKanbanMove helper and a
TaskWorkspace block. Board and Backlog share ordered tasks. Pointer and touch
dragging use a dedicated handle; selecting that handle opens a keyboard-accessible
destination/position dialog. Escape and outside drops restore the original order.
Column limits reject overflowing moves, including pointer drops. The compact
legacy ProjectBoard keeps its original select-based API.

The block adds task creation and an abortable snapshot save callback with an
expected board revision. Rejected moves restore the prior order and offer retry;
rejected task creation retains the draft. Cancellation aborts the callback,
restores local state and ignores late completion. Consumers must authenticate,
authorise, validate limits and commit revisions atomically on their server. An
aborted network request may already have committed remotely; reload authoritative
state after an uncertain result. The default example is session-only memory.

White cards sit on neutral column surfaces with restrained shadows. Sortable
displacement and the drag overlay use shared easing; handles keep their size.
Board/backlog metadata shares a grid and narrow containers stack in reading order.
Focus returns to moved handles, including pointer moves. A shared motion preference
hook now responds live to system changes in the Kanban, task, filter and issue
interactions; reduced motion removes animated displacement and drop transitions.

Validation:
- Production build passed: 85 generated routes, 110 registry items, 46 component
  guidance entries, eleven blocks and three templates. All workspace types passed.
- The full isolated Edge suite passed all 206 cases without skips or retries.
  After the final pointer-focus adjustment, a fresh build and all 18 Kanban cases
  passed again. They cover immutable moves, stale anchors, capacity, mouse sorting,
  empty destinations, touch events, Escape/outside cancellation, precise keyboard
  positions, focus, save failure/retry/cancellation, draft recovery, loading/error/
  empty states, both-theme axe scans, rigid overlays, live motion preferences,
  aligned geometry and 1440/768/390/320 px containment.
- Real shadcn CLI installs into two fresh consumers built independently: Next.js
  16.3.8 and Vite 8.3.4 with React 19.3.0. The Vite app used a custom UI alias.
  Next evaluated applyKanbanMove in a Server Component without a client boundary.
  Vite emitted its module-level use-client warnings; its client build succeeded.
- A fresh extraction of the final task-workspace-vite.zip installed and built via
  npm run check:starter:vite -- task-workspace. Its isolated browser run moved a
  task, retained the same order in Backlog, preserved a draft through an observed
  React Fast Refresh, reacted to a live reduced-motion change and stayed contained
  on a phone. Reload correctly reset sample tasks; no page errors were reported.
- All 30 ZIPs passed CRC, path, licence, runtime/environment-file and final-CSS
  audits. Registry dependency URLs resolve internally and retain production URLs;
  source targets respect the configured UI alias. dnd-kit MIT notices are included
  in packages, registry installs and archives; its three direct package licences
  were checked and match the included common licence.
- Desktop board/backlog, dark backlog and phone views were captured and visually
  reviewed, with no browser page errors. CI now checks the actual task-workspace
  Vite archive alongside Outline and IssueTable; remote CI has not run yet.

The full Vite task starter retains a roughly 603 kB minified entry chunk (196 kB
gzip) and emits Vite's size warning. Code splitting remains a later optimisation;
the warning is not hidden. Manual assistive-technology and non-Chromium reviews
remain separate from these automated checks. No hosted issue/task API, cloud
persistence or collaboration is claimed.

This increment remains local and uncommitted. No push, deployment, npm publication
or company/global account settings changed. Temporary test/registry/starter servers
were stopped; the main development preview remains on port 3120.

## Issue filters, saved views and motion - 28 October 2026

Added FilterBuilder, a pure validated query module and the complete IssueTable
block. Rules cover text, multi-value choices, numeric comparisons/ranges and
date-only ranges, in one all/any group. Draft conditions are applied explicitly.
Saved views retain search, filters, sort, columns, density and page size; share
links preserve unrelated host URL parameters and fragments. Storage failures keep
the save draft, and Escape no longer silently clears MultiSelect selections.

The table supports creation, inline title edits, selection across pages, bulk
status changes and one-step revision-checked undo. Async repositories receive
AbortSignals; stale reads are ignored and failed writes retain the edit draft.
The default sample repository is in memory; only views persist in browser
storage. The HTTP adapter is a reusable client contract, not a hosted service.
The integration guide documents server ownership, validation and revision checks.

Motion 14.7.1 supplies eased row entry/removal, panel expansion and the shared
view indicator. Loading keeps existing table geometry stable. Exiting conditions
are inert; focus moves to a nearby control after removal. Reduced-motion settings
make those transitions immediate. The MIT licence travels with source installs.

Validation:
- Production build passed: 82 generated routes, 103 registry items, 45 component
  guidance pages, ten blocks and three templates. All workspace types passed.
- The full isolated Edge suite passed all 188 checks without retries or skips.
  Eighteen new cases cover query validation/evaluation, real HTTP fixture requests,
  atomic revision conflicts, cancellation, saved-view/link restoration, storage
  failures, creation/editing, bulk undo, empty/error/retry states, keyboard focus,
  frame-sampled normal animation, reduced motion, both-theme automated axe scans
  and 1440/768/390/320 px containment. Existing controls/Outline remain green.
- The actual shadcn CLI installed the new graph into two fresh consumers with no
  preinstalled BLD8 source: Next.js 16.3.8 and Vite 8.3.4/React 19.3.0, the latter
  using a custom UI alias. Both independent builds passed. Next also evaluated
  the pure filter/issue modules in a Server Component. Vite emitted its expected
  module-level use-client warnings; the client build succeeded.
- The generated issue-table-vite.zip was independently extracted, installed and
  built using npm run check:starter:vite -- issue-table. Its browser run restored
  a saved view after reload, retained an unsaved draft through an observed React
  Fast Refresh, stayed contained on a phone and reported no browser page errors.
  The repeatable starter check is also added to CI; remote CI has not run yet.
- All 28 ZIPs passed CRC, safe-path, final-CSS, runtime/environment-file and licence
  checks, including Motion. Registry dependencies resolve internally, target the
  configured UI folder and keep production URLs with no loopback dependencies.
- Desktop, filtered desktop, phone and dark-mode screenshots were inspected. The
  new preview reported no browser page errors.

The complete Vite issue starter emits a warning for its roughly 648 kB minified
entry chunk (209 kB gzip). Code splitting remains a follow-up; the warning has
not been hidden. Automated axe and Edge coverage do not replace manual assistive-
technology or non-Chromium review. This increment remains local and uncommitted;
no push, deployment, npm publication or account/global settings changed. Preview:
http://127.0.0.1:3120/blocks/issue-table.

## Vite starter option - 28 October 2026

Every catalogue block and template now has Next.js and React + Vite download
choices: 12 Vite archives alongside the existing 14 Next.js archives. The two
HTTP-backed integration ZIPs retain their Next.js sample API; the Vite catalogue
starters remain client apps with no implied backend, authentication or router.
The source manifests keep the legacy download field and add explicit framework
download URLs. Both variants include the same editable BLD8 package source.

The shared guide is /frameworks. Existing /react-nextjs bookmarks still render
the guide with its canonical URL. Setup and migration guidance covers component
reuse, server boundaries, routing/images, public environment values, storage
origins and deployment. Download menus use the existing keyboard-aware Popover.

Validation:
- Production build and all workspace types passed; 79 generated routes and
  96 registry items. All 39 relevant browser cases passed without retries,
  covering downloads, the guide/legacy URL, both themes, keyboard focus,
  catalogue flows and 1440/768/390/320 px layouts.
- All 26 archives passed CRC, safe-path, licence, runtime/environment-file and
  final-CSS audits. The 12 Vite variants have no Next.js dependency or app routes.
- A fresh extraction of outline-vite.zip installed and built independently with
  Vite 8.3.4, React 19.3.0 and @vitejs/plugin-react 6.1.2. Both BLD8 packages were
  rebuilt from the included source and application types passed.
- The isolated Vite dev app saved preferences across reload. Editing src/App.tsx
  triggered React Fast Refresh without a page reload and preserved an unsaved
  form draft. Its phone layout stayed contained, with no browser page errors.
- Desktop/phone framework guides and the download chooser were captured and
  reviewed. No browser page errors were reported.
- npm run check:starter:vite independently extracts, installs and builds the
  actual ZIP. It passed locally and is added to the existing CI workflow; that
  remote workflow has not been run for these uncommitted changes.

The full Outline example emits a Vite warning for its approximately 648 kB
minified entry chunk (205 kB gzip). Code splitting is a follow-up optimisation;
the warning threshold has not been raised or hidden. This is a functional
compatibility check, not a performance or accessibility certification.

Local changes only. No commit, push, deployment, npm publication or global/account
settings changed. The showcase stays on Next.js at http://127.0.0.1:3120.

## Timeline alignment review - 28 October 2026

The Timeline detail preview now fills the panel content width instead of using
the generic centred 420 px control frame. Marker and connector positions share
one size token; the rail is centred on each marker, and the first title line
shares its vertical centre. Title/time layout uses grid, with dates stacking
according to the timeline's own container width. Logical positioning retains RTL.

- Production build passed, with regenerated registry CSS and all 14 starters.
- All 19 relevant browser cases passed, including eight geometry/containment
  checks for panel edges, marker/title axes, rail centring and equal gaps,
  1440/1104/768/390/320 px layouts, long wrapping titles, narrow containers,
  RTL and the smaller catalogue preview. Activity-feed behaviour and both-theme
  automated accessibility/reduced-motion checks passed in the same run.
- Desktop, compact-desktop, phone and ActivityFeed views were captured; desktop,
  phone and the reused activity layout were reviewed without browser page errors.
- The installed Next.js and Vite consumers also built with the updated styles.
  Registry dependency, archive CRC/path/licence and final-CSS audits passed again.

Local correction only; no commit, push, deployment or global setting change.

## Community library foundation - 28 October 2026

Added a reusable Timeline control and an ActivityFeed block composed from it.
The block has search, type filters, local reveal, explicit sample content and
loading/error/empty/retry states. It accepts ordered host records; no backend,
notification delivery, live subscription or server pagination is claimed.
The catalogue now has 44 guidance entries, nine blocks and three templates.

The React/Next.js guide covers the shared React foundation, source installation,
custom aliases, client boundaries, styling and service integrations. Community
guidance, bug/feature issue forms and a security policy support contributions.
All collections remain free under MIT, with no account, checkout or licence key.
The ordered backlog is in library-direction.md; planned controls are not shipped.

Validation:
- Final production build passed: 78 generated routes, 96 registry items and
  14 runnable ZIP starters. All workspace TypeScript checks passed.
- The initial 30 relevant browser cases passed 29; one existing multi-page
  light-theme axe scan hit its 30-second timeout under concurrent install load.
  Its isolated rerun passed in 9.2 seconds without changing its assertions.
- After the final fluid card-width adjustment, all 11 new cases passed again.
  These cover interaction, loading/retry/empty states, ordered timeline semantics,
  both-theme axe checks, reduced motion and 1440/768/390/320 px containment.
- Desktop and phone activity views and the framework/community pages were
  captured and reviewed. The review reported no browser page errors.
- The actual shadcn CLI installed Timeline and ActivityFeed into two fresh
  consumers with no preinstalled BLD8 source: Next.js 16.3.8/React 19.3.0 and
  Vite 8.3.4/React 19.3.0 with a custom UI alias. Both independent builds passed;
  final block CSS was refreshed and both builds passed again. Vite emitted
  its module-level use-client directive warnings; the client build succeeded.
- Registry dependency URLs resolve internally and retain the production host.
  All 14 ZIPs passed CRC, path, licence, runtime-file and final-CSS consistency
  checks. The new source manifest remains MIT with price zero.

This is a local verified increment, not a published release. No commit, push,
deployment, npm publication or cloud/account setting was changed. Development
preview: http://127.0.0.1:3120. Manual assistive-technology and non-Chromium review
remain separate; automated axe checks do not establish accessibility certification.

## Source release validation - 16 October 2026

- The production build, all workspace type checks and all 142 browser cases pass
  in a clean final run with no skips or retries. Coverage includes shared control
  geometry/material, keyboard and system-colour states, reduced motion, responsive
  layouts, table editing/drafts, forms, dates, file feedback and Outline workflows.
- Installed registry CSS matches the final package output and all 13 source ZIPs.
  The isolated consumer build passes; archive integrity, safe paths, licences and
  pending source/credential checks pass. Manual screen-reader/non-Chromium review
  remains separate from these automated checks.
- The source includes the GitHub validation workflow and connection guide. Source
  publication and Vercel production deployment are separate operations; verify the
  project's Git connection and required checks before assuming automatic release.
- The other seven active workspace repositories were checked against GitHub main
  and already match, with no pending changes. Personal identity, isolated SSH and
  the Melbourne commit-window guards remain in place.

## Borderless choices share the switch material - 16 October 2026

- Checkbox/radio faces now use the switch track's exact grey off fill, yellow
  selected fill and inset shadow tokens, with no border in ordinary themes.
  Radio dots use the switch thumb's highlight, resting/hover/press shadows and
  easing. Crisp ticks and 10 px radio dots retain their visual centres after
  border removal. Faces remain 20 px; label targets remain 44 px.
- Explicit keyboard focus and system-colour boundaries remain. Forced colours
  restore a 1 px system edge and compensate indicator positions without changing
  the outer size. Disabled, mixed checkbox and reduced-motion states remain.
- Production build and all 30 affected checks pass with no skips or retries.
  The light/dark comparison checks verify identical rendered fill and shadow
  values for all three controls in both states. Keyboard, high contrast, mobile
  containment and table selection coverage passes; specimens were reviewed.
- The actual CLI updates the isolated consumer, whose production build passes.
  Installed CSS and all 13 source ZIPs match the final package output. Archive
  integrity, safe paths and licence checks pass.
- No commits, pushes or deployments were performed.

## Shared material across the library - 16 October 2026

- A warm grey canvas and borderless white panels now share restrained highlights
  and lower shadows. Fields use a light inset; actions have modest elevation;
  selected choices and calendar endpoints use yellow with dark indicators.
  Chip, file, navigation, progress and overlay surfaces use the same palette and
  shadow tokens. Public components carry the changes into blocks and templates.
- Checkbox/radio faces are 20 px with 44 px label targets. Switches remain
  44 x 26 px with a 20 px rigid thumb and even 3 px inset. Sliders have a 6 px
  recessed yellow/grey track and an 18 px solid thumb in a 44 px target. Regular,
  compact and large fields/actions retain 44 / 36 / 48 px heights.
- Hover and press change lighting without scaling the switch or slider thumb.
  Native dragging, keyboard behaviour, immediate focus, errors, disabled states,
  system-colour boundaries and reduced motion remain supported. Text and icons
  stay vector/DOM content with no blur filters.
- Production build and workspace type checks pass. The full 142-case Edge run
  passed 140 cases and found a system-colour switch-fill issue in two theme cases.
  Explicit system colours and immediate high-contrast changes fix that issue;
  all ten choice/motion/contrast rechecks, including both switch cases, pass.
  Coverage includes shared geometry, light/dark automated accessibility, mobile
  containment, focus return, tables, forms, date ranges, registry guidance,
  playgrounds and template workflows. No cases are skipped.
- Public light/dark control specimens and composed workflows were visually
  reviewed. The actual registry CLI installs eight stylesheet/licence files
  into a clean independent app, whose production build passes. Installed CSS and
  all 13 ZIPs match the final package output; archive integrity, safe paths and
  licence checks pass. Manual screen-reader/non-Chromium review remains open.
- No commits, pushes or deployments were performed.

## Recessed switch with rigid travel - 16 October 2026

- Switches now have a grey recessed track and a shaded white thumb in both
  states. The selected track stays yellow. A 20 px thumb has a uniform 3 px
  inset in the 44 x 26 px track. Hover and press change lighting only; the thumb
  never stretches, shrinks, bounces or overshoots. Dedicated switch shadows leave
  the approved checkbox/radio faces and indicators unchanged.
- Production build and workspace type checks pass. The 24 existing affected
  Edge checks and both revised light/dark switch checks pass without skips.
  The focus check tabs to the switch to exercise actual keyboard modality.
  Light/dark checks sample the actual thumb
  transition in both directions, verify constant dimensions and monotonic travel,
  test presses, custom sizes/insets and system-colour focus. Existing keyboard,
  rapid reversal, reduced-motion, accessibility and table-selection checks pass.
- Light/dark on/off specimens were visually inspected. The actual registry CLI
  installs eight stylesheet/licence files into an independent clean app, whose
  production build passes. Its installed styles and all 13 source ZIPs match the
  final package output; archive paths, integrity and licence checks pass.
- No commits, pushes or deployments were performed.

## Flush switch geometry and shared selected colours - 16 October 2026

- Switch tracks and thumbs have a continuous 1 px outline. Full-height thumbs
  meet the outside boundary at both ends, including when pressed; travel follows
  the width and height tokens. Selected radios and checkboxes now share the
  yellow switch face, dark indicator, dark edge and inset depth.
- Production build passes. The 24 existing affected checks pass, followed by
  both new light/dark boundary checks. The new checks initially compared viewport
  positions across automatic browser scrolling; they now compare document
  positions. They verify flush endpoints, press feedback, stable hit areas,
  custom sizes and matching selected colours. Keyboard, reduced-motion,
  forced-colour and table-selection coverage remains passing.
- Light/dark specimens were visually inspected. The actual registry CLI installs
  eight stylesheet/licence files into a clean app, whose independent production
  build passes. Installed styles and all 13 ZIPs match the final package output;
  archive integrity, safe paths and licence checks pass.
- No commits, pushes or deployments were performed.

## Active choice depth refinement - 15 October 2026

- Active switches, radios and checkboxes use a slightly deeper 2 px / 4 px inset
  upper edge and a quiet lower highlight. Shadow strength follows the surface:
  yellow tracks and inverse dark faces retain their approved colours and easing.
- Production build passes. All 24 affected control, motion, accessibility and
  table-selection checks pass with no skipped cases. Light/dark states were
  visually inspected; native keyboard, reduced-motion and drag feedback remain.
- The shared stylesheet registry item installs eight files into a clean app via
  the actual CLI, and its independent Next.js build passes. Installed styles and
  all 13 source downloads match the final package output. Safe paths and licence
  checks pass.
- No commits, pushes or deployments were performed.

## Inset depth and inverse selection - 15 October 2026

- Production build and workspace type checks pass. All 140 Edge cases pass in
  one clean run with no skips or retries. Five added cases check inverse selected
  colours, real box-shadow interpolation, switch inset transitions, stable control
  bounds, rendered slider hover feedback, pointer dragging, keyboard min/max/steps,
  reduced motion and system-colour focus/indicators in light and dark themes.
- Radio and checkbox faces invert to dark with yellow indicators. Switch tracks
  retain yellow with inset depth. Matching transparent inset layers at rest allow
  the shadow to interpolate instead of switching discretely. Slider feedback uses
  native range pseudos; no delayed value-following or extra runtime was added.
- The real registry CLI installs 32 files into a separate empty-source app. Its
  independent Next.js production build passes. Installed styles/tokens and every
  source ZIP match the final package output byte for byte; all 13 archives retain
  safe paths and licences. No publishing, commits or pushes were performed.
- Light/dark choice and native slider states were visually inspected. The local
  Foundations control specimen has a direct #control-states anchor.

## Whole control family and choice motion - 15 October 2026

- Final production build passes with 74 generated pages and the sample API.
  Workspace type checks pass. The final Edge run passes all 135 cases in one
  clean run, with no skips or retries, using two workers and a 90-second budget.
- Eleven added checks cover real radio/checkmark/switch transitions, switch
  reversal during travel, stable hit areas, reduced motion, forced-colour focus,
  long chips, required/search feedback, manual tab activation, unavailable tabs,
  pagination, scrolling dialog bodies, file errors/removal and progress bounds.
- Light/dark control specimens pass automated accessibility checks. Layouts stay
  contained at 320, 390, 768 and 1440 px. Choice depth, navigation, search and date
  specimens were visually inspected. Existing table, form, HTTP, upload, drawer,
  menu, keyboard and focus-return workflows all pass in the same run.
- The actual registry CLI installs 32 files into a clean independent application.
  Its Next.js production build passes with the new Combobox ref/feedback API,
  required selection, long chips, menu icons/shortcut hints, alerts, progress,
  files, overlays and Outline. The installed stylesheet includes the final choice
  shadows, transitions, disabled states and scrollable dialog body.
- All 13 source downloads pass CRC and safe-path checks and include final source,
  compiled styles and required licence notices. Project source/documentation
  scans find no design-reference branding. Functional registry schemas and legal
  attribution are preserved.
- These are automated Edge and build checks, with visual specimen review; no
  manual screen-reader or non-Chromium certification is claimed. Nothing in this
  pass was committed, pushed or deployed.

## Table layout and editing experience - 15 October 2026

- The final production build passes with 74 generated pages plus the sample API;
  workspace type checks pass. All 124 regression cases are verified across the
  full and focused runs, with no skipped cases.
- The full run passed 118 cases. Five multi-page accessibility cases exceeded
  their 30-second budgets during a concurrent consumer build; one HTTP mobile
  case exposed a sidebar first-paint overflow. All six pass in a serial rerun
  with a 90-second budget after the CSS fix. The final 16 sidebar/table cases also
  pass against the final styles. This was not a single clean 124-case run.
- Six new cases verify the actual header/value grid, 48 px selection column,
  numeric text edges, real resized widths, direct F2 editing, validation/cancel,
  row-menu focus return, density options and retained drafts during an HTTP refresh.
  Light/dark accessibility and mobile horizontal scrolling are included.
- Editable cells show their values, with no separate Edit label or pencil.
  Outline has one action menu per row for full details and deletion. Date display
  is readable; underlying date-only values and revision checks are unchanged.
- Headers, values and pinned offsets use measured column widths. Density and
  checkbox padding stay consistent; mobile resize handles stay within the scroll
  region. Relative cells contain their hidden keyboard descriptions, preventing
  those descriptions from causing page overflow.
- Narrow sidebar layouts are established by CSS before the client observer
  hydrates the drawer. The table scroll region uses a quiet inset keyboard focus
  edge, with a system-colour fallback.
- Existing rows stay mounted while updating or recovering from a refresh error.
  A visible updating state avoids replacing the table and discarding a draft.
- The official shadcn CLI installs Outline into a fresh independent Next.js
  consumer; that application builds successfully. The installer also updates the
  final CSS. All 13 archives pass CRC, source/style, path and licence checks,
  including the final containment fix.
- Desktop project/resource captures, dark mode and narrow layouts were reviewed.
  Whitespace and source-attribution scans pass; production registry dependencies
  still use https://ui.bld8.dev. The local preview remains on port 3120.

This refinement is local and uncommitted. No commit, push or deployment was made.
Manual screen-reader and non-Chromium review remain outstanding. Design rules
and editing guidance are recorded in design-and-motion.md and workflow-integrations.md.

## Complete control design pass - 15 October 2026

- The final production build passes with 74 generated pages plus the sample API.
  All workspace type checks pass.
- The final full regression suite passes all 118 tests without retries or skipped
  cases. It includes automated light/dark accessibility, keyboard interaction,
  reduced motion, touch targets, responsive layouts and Outline workflows.
- Control geometry is shared across buttons, fields, choices, menus and overlays.
  Radio/slider styling retains native keyboard behaviour; slider fill follows its
  min/max range. Choice labels and descriptions have distinct accessible bindings.
- The shadow refinement keeps panels borderless and adds restrained surface,
  resting-action, hover and overlay elevation. Hover/press targets stay still;
  field and menu focus feedback appears immediately. Shared easing remains in use.
- The Foundations Control states section uses public components. Light/dark and
  mobile specimen captures, plus the aligned Outline form, were visually reviewed.
  Isolated specimen exports hide fixed navigation only during capture; focus and
  navigation assertions run against the real interface.
- The official shadcn CLI installs Outline and Slider into an isolated consumer;
  its independent Next.js production build passes. The installed files include
  the final source, compiled styles, tokens and notices.
- All thirteen starter archives pass CRC, path, source/style and licence checks.
  Generated production registry URLs still point at https://ui.bld8.dev.
  Whitespace and source-attribution scans pass.

This pass is local and uncommitted. No commit, push or deployment was made.
Manual screen-reader and non-Chromium review have not been completed. The design
reference and reusable rules are recorded in design-and-motion.md. Existing GitHub
connection steps remain in ci-and-vercel.md.

## Shared focus, alignment and motion - 15 October 2026

- Production build succeeds with 74 generated pages plus the sample API.
- The 111-case full regression run passed 110 cases. The remaining case expected
  the old offset focus outline. Its revised assertion checks the continuous
  focus edge and forced-colours fallback; all nine affected cases pass.
- A further three checks pass after the final cell-select Escape guard, including
  resource-filter alignment and date/status field alignment. The extra Escape
  case verifies that closing an option menu preserves the edit until cancelled.
- Four new layout/motion checks verify shared 44px table controls, labelled Base UI
  filters, the actual invalid-date focus target, aligned project fields, mobile
  stacking and retained settings drafts while switching views. Reduced motion
  disables workspace entry animation.
- Automated light/dark accessibility checks pass across the changed examples.
  Desktop filter/project and mobile form captures were reviewed.
- The official shadcn CLI installed Outline into a fresh Next.js consumer; the
  independent application builds. All thirteen source archives pass integrity,
  path and local-artifact exclusion checks. Registry dependency URLs use the
  production origin again. Whitespace and source-attribution scans pass.
- The GitHub workflow is prepared with Node 22, production build, workspace type
  checks and Chromium tests. YAML parsing succeeds with read-only repository
  permission. It has not run on GitHub; it activates only after source is pushed.

This refinement remains local and uncommitted. No code commit or push occurred
inside the 08:00–17:00 Melbourne window. The public site still serves the
previous verified release. Manual screen-reader and non-Chromium review remain
outstanding. See ci-and-vercel.md for connection and deployment-check steps.

## Playground and workflow integrations - 14 October 2026

- Production build passes: 74 generated pages plus the dynamic example API.
  All three workspace type checks pass. The catalogue has 43 guidance entries,
  fourteen playground controls, thirteen ZIP starters and 92 registry items.
- The full 107-test Playwright run passes in Edge (2.7 minutes). This covers
  configuration URLs and invalid values, overlay focus, disabled selections,
  calendar bounds, loading/error/empty states, TypeScript prop tables, inline
  validation/cancel/save/recovery, conflicting cell drafts, the real HTTP
  contract, cancellation and React Hook Form focus/controlled fields.
- Automated light/dark accessibility, existing interactions, reduced motion
  and responsive layout checks pass. After the final action-column spacing
  and service-footer refinement, all seven affected checks pass again.
- The official shadcn 4.21.4 CLI installed the new form example and HTTP adapter
  into a fresh Next.js 16.3.8 consumer. That consumer builds independently;
  browser interaction saved both an inline edit and a controlled form record
  through its own sample API, with no page errors.
- The extracted React Hook Form/HTTP starter installed and built independently,
  including its API route. All thirteen final archives pass CRC, path,
  licence-presence and local-artifact checks. A package dry run includes the
  optional form adapter, editable cell and licence.
- npm audit reports zero vulnerabilities. Public registry URLs were restored
  after local CLI testing. Git diff whitespace checks pass.
- Desktop table/inline-edit/prop docs and mobile date/form captures were
  reviewed; no page errors occurred during the capture run. No source text
  attributes generation to an assistant. Existing upstream notices remain.

The sample server stores bounded, temporary session data; the session header is
not authentication. Production ownership and atomic database writes remain the
host application's responsibility. Manual screen-reader review and broader
non-Chromium coverage are still pending. These checks completed before committing the source. This batch has not been
deployed to Vercel or published to npm. Preview: http://127.0.0.1:3120.

## Tailwind and navigation foundation - 13 October 2026

- Production build: 66 pages/routes; all three workspace typechecks pass.
  Catalogue: 40 guidance entries, eight blocks, three templates, eleven starters.
- Final full browser run: 81 passed, with one test expecting to read background
  status while a radio submenu was still open. The test now verifies selection,
  dismisses both menu levels and checks the status; that targeted case passes.
  No application change was needed for that final test correction.
- New coverage includes drawer focus containment/restoration and draft retention,
  real emulated touch swipe dismissal, context-menu keyboard activation,
  disabled/checkbox/radio actions, nested menus, responsive sidebar collapse,
  mobile selection/focus, dark/light axe and reduced motion.
- Existing workflow, icon, motion, layout and collection checks pass. The first
  migration run exposed link colours overridden by unlayered app resets;
  compatibility styles retain their previous priority and light/dark axe passes.
- A real utility edit was applied and restored in the local preview. Tailwind
  rebuilt and the browser updated without restarting. React may refresh the
  page for shared-module changes; persistence of unsaved preview state across
  every code edit is not promised.
- All eleven ZIPs pass CRC/path/source/license checks, including compiled
  Tailwind CSS and SHADCN_LICENSE. The Outline starter was independently
  extracted, installed from cache and built (UI + blocks + Next 16.3.8).
- npm pack --dry-run includes the new compiled controls, CSS and shadcn notice.
  npm audit reports zero vulnerabilities. Git diff whitespace checks pass.
- Final Outline desktop/mobile and drawer images reviewed in .local/previews.
  A development hydration warning was traced to screenshot caret-hiding styles;
  a clean interaction replay produced no browser errors.
- Local preview: http://127.0.0.1:3120. No commit, push, deployment or npm release.
  The /r manifests retain their own BLD8 schema; no shadcn CLI compatibility claim.
  Non-Chromium coverage and manual screen-reader testing remain outstanding.


# Verification - 28 September 2026

## Application workflows - 13 October 2026

- Production build succeeds with 63 generated pages/routes; all three workspace
  typechecks pass. There are 37 guidance entries, eight blocks, three templates
  and eleven generated starters.
- The full 71-test regression run passed. Final focus/clearable/compact refinements
  were checked in 54 affected cases: 53 passed together; one broad name match was
  made exact and passed separately. Three final capture/layout/axe checks also pass.
- Command search/actions/shortcut, focus restoration, multi-select form values,
  date bounds and keyboard movement, local date-only values, range clearing,
  file checks/removal and upload progress/cancel/retry were exercised.
- Table selection survives pages/filters, with mixed header state, visible columns,
  density and bulk actions. Resource CSV exports chosen metadata with quoting and
  formula escaping; archives can be undone. Outline retains edits across views.
  Project creation validates and updates the displayed table.
- Axe passes in light/dark themes and open command/range overlays. No page overflow
  at 1440/768/390/320 px; calendar popups fit the viewport. Desktop/mobile/dark
  Outline captures were reviewed and saved in the task's local preview folder.
- All eleven ZIPs pass CRC/safe-path checks and contain compiled/editable source
  and MIT/Lucide/DayPicker notices. They exclude environment files, credentials,
  parent paths and installed dependencies. The final Outline ZIP was extracted
  into a separate folder, installed from the offline cache and built independently.
- Local preview stays on 3120. No commit, push, npm publication, account change
  or deployment was made. Real persistence/uploads, non-Chromium coverage and
  manual screen-reader verification are not claimed.

## Icon foundation and control extensions - 13 October 2026

Verified against the final icon directory/mobile inspector implementation:

- Production build: 53 generated pages. UI/blocks compilation and all three
  workspace type checks passed.
- Final full browser suite: all 53 checks passed in 36.7 seconds. This includes
  the existing component/blocks tests and 11 icon/control/mobile checks.
- Full directory: 1,877 canonical Lucide 1.55.0 icons, excluding aliases, with
  generated 1.5/1.75/2 stroke SVG profiles and retained ISC/Feather MIT notices.
- Search, category filtering, pagination and empty-state reset; actual React-code
  copy and SVG copy; downloads preserve stroke settings and licence notices.
- Shared icon dimensions and stroke defaults; meaningful image labels,
  decorative button glyphs and the unchanged eight-dot BLD8 arrow artwork.
- InputGroup clear actions, native field labels, invalid descriptions and visible
  keyboard focus. Button/IconButton Lucide props work with existing variants.
- Automated axe checks in both themes for the directory, Icon and InputGroup;
  the open mobile inspector also passes. Escape restores focus to the tile that
  opened it. Existing accessibility/overlay and reduced-motion checks still pass.
- No page overflow at 1440/768/390/320 px. Desktop/mobile/dark screenshots were
  reviewed; mobile browsing remains visible ahead of its on-demand Sheet.
- Extracted a regenerated Studio starter, installed from the offline cache and
  built it independently with Lucide and the included LUCIDE_LICENSE file.

The first build exposed a JSX style-brace error in the preview helper; it was
corrected before these final checks. Generated icon assets stay out of Git and
out of ordinary application icon imports. No commits, pushes, deployment or npm
publication occurred. Manual assistive-technology review remains pending.

## Library expansion - 13 October 2026

Completed locally against the current source:

- Core UI and blocks compilation, Next.js production build (50 generated pages),
  and explicit TypeScript checks for all three workspaces.
- All 42 Playwright checks passed in the final full run (29.8 seconds). This
  includes the existing 26 checks plus 16 collection/blocks/template checks.
- Category, collection and text filtering; reset/empty results; full source and
  stylesheet views; all eight anonymous manifests and ZIP downloads.
- Sign-in validation without a real authentication claim; account validation and
  local saving; period/metric changes; activity filtering; duplicate-invitation
  rejection/local row creation; task creation/stage changes; template view
  navigation; dialog dismissal and focus return.
- Automated axe checks for new home, catalogues, plans, team, board and Studio
  in both themes. Existing component/overlay accessibility checks also pass.
- No horizontal page overflow at 1440, 768, 390 and 320 px across the new pages;
  no browser page errors. Mobile preview adapts to its container independently
  of the desktop viewport; reduced motion disables width transitions.
- Extracted Studio ZIP into a separate temporary workspace, installed using the
  existing offline npm cache, and successfully built the independent Next.js app.
  Repeated the build from the final generated ZIP after reusable style changes.
- All eight archives passed ZIP CRC, path allowlist and licence-presence checks.
  All original BLD8 source is MIT by the user's explicit choice; Base UI's notice
  is included. No environment files or workspace credentials are in the ZIPs.
- Reviewed desktop home/catalogue/Studio, mobile home and dark plans screenshots.
- A real temporary package CSS variable edit refreshed the open development page
  without navigation or reload. The edit was restored and removal was confirmed.

The first pass exposed ambiguous code locators and required labels whose visual
asterisk did not match an exact label-text selector. The tests now use accessible
names, and required fields propagate their native required state. Final checks
pass. Screenshot/validation artifacts stay outside the repository.

Local preview is running at http://127.0.0.1:3120. No commit, push, deployment or
npm publication occurred in this request. Manual screen-reader review,
Safari/Firefox, RTL/localisation and real backend integration remain pending.
Later historical sections below describe the earlier release.

Completed locally:

- Reusable library TypeScript build and Next.js production build; 28 component/pattern routes plus home, catalog, foundations, examples and installation guide.
- Type checks for both workspaces.
- All 19 Playwright checks passed after fixes. The final full run passed 18; the remaining toast test had an ambiguous code-example text selector and passed its targeted rerun after correction.
- Keyboard selection, combobox search/empty results, tabs, accordion, checkbox/switch state, menu actions, dialog validation/focus trap/focus return, sheet/popover dismissal, tooltips and toast dismissal.
- Data table filtering, sorting, pagination and empty results; the project example creates an actual in-memory record. The profile example validates email; an additional check confirmed empty display names are rejected.
- Automated axe checks of catalog, examples, foundations and an open dialog in light and dark themes. Additional checks of open tooltip/toast passed, including the tooltip description association.
- No horizontal overflow on the primary pages and table detail at 1440, 768, 390 and 320 px. No browser page errors in these route checks.
- Desktop home, light/dark examples and website project-panel screenshots reviewed.
- npm pack produced bld8-ui-0.1.0.tgz with compiled ESM, declarations, CSS and notices. The compiled entry point imports and renders outside Next.js.
- A real temporary CSS edit in packages/ui/src refreshed the open showcase without navigation or reload; the verification style was then removed.

The first pass identified a missing tooltip role/description link and a narrow-screen grid min-width issue. Both were corrected. Other initial failures were locator ambiguity between modal dialogs and toast dialogs, code samples and live messages, or Next.js route announcements.

Manual screen-reader review, Safari/Firefox, RTL/localisation, a second application's installation/build and longer-term API usage remain pending. No production-grade accessibility certification is implied. This is an initial local library, with advanced components listed in scope.md.

Preview: http://127.0.0.1:3120. The sibling website continues on port 3117. No Git repository, commit, push, npm publication or deployment was created for this library.
## Borderless surfaces and shared motion - 28 September 2026

Refined the library and showcase using the user's Carl Hauser reference: light-grey
canvas, white borderless cards, charcoal type and retained lime accents. Added shared
160/280/440 ms timing tokens, moving tab indicators, smooth switch/disclosure changes,
consistent overlay transitions, stable hover targets and loading buttons that keep
their dimensions. /motion provides four working studies; Home uses the same tab study.
Read design-and-motion.md for the implementation boundaries and interaction rules.

Validation on the final source:
- Library compilation and Next.js production build passed, generating 36 routes.
- All 23 Playwright checks passed in one final run.
- New normal-motion checks cover interrupted tab selections, keyboard selection,
  indicator alignment, stable loading dimensions, stable hover targets and overlay
  dismissal/focus return. Reduced-motion checks cover indicator, switch and dialog.
- Existing behaviour checks remain green. Automated axe scans now include /motion
  in both light and dark themes. Responsive checks include the new page at 1440,
  768, 390 and 320 px, with no horizontal overflow or browser page errors.
- Desktop Home, catalog, light/dark motion studies and the 320 px motion page were
  visually reviewed in isolated Edge. No user browser profile was used.
- Rapid tab switching initially left outgoing panels in layout during their final
  animation frame. Outgoing panels now leave layout immediately; the new check
  confirms only the active panel is visible. A test scrolling issue was also fixed.

No commit, push, publication or deployment. Manual screen-reader and cross-browser
review remain pending as recorded above. Live development stays on port 3120.
## Yellow, black and neutral surfaces - 28 September 2026

The user requested yellow/black contrast with white and light-grey foundations.
Replaced the library's lime palette with near-black primary actions (#171717) and
warm yellow accents (#ffe24a), including a typed accent Button variant. Neutral
surface tokens no longer have a green tint. Dark mode keeps equivalent contrast.
The portfolio website's separate palette was not changed.

Shared gutters align header, page content and footer. Catalog cards now stretch
consistently and align caption dividers. Panel padding, radii and grid gaps share
values. The small brand mark is an aligned SVG, and text-link underlines use the
same eased timing as the component interactions. Borderless white cards remain.
Updated foundation examples, button usage guidance and contributor guidance.

Validation:
- Library and showcase production build passed; 36 generated routes.
- All 23 browser checks passed, covering responsive layouts, normal/reduced motion,
  keyboard behaviour and automated axe scans in both light and dark themes.
- Additional browser measurements confirmed matching header/content/footer edges
  at 1440, 768, 390 and 320 px, no overflow and the intended primary/accent colours.
- Desktop home, motion studies, catalog and phone motion screenshots were reviewed.
- The local installable tarball was refreshed successfully using npm pack offline.

Port 3121 was occupied by another local server, which was preserved. The test
configuration now accepts BLD8_UI_TEST_PORT; this run used a fresh server on 3122.
The development preview remains on 3120. No commit, push, publication or deployment.
## Public first edition and floating menu - 28 September 2026

The showcase is now live at https://bld8-ui.vercel.app. This supersedes the earlier
local-only deployment status above. See deployment.md for settings and ownership.
Added sticky desktop/mobile navigation, active-link treatment, mobile dismissal
and focus return, a public usage/audience explanation, site icon, robots and sitemap.
The final menu correction keeps a white border and no shadow at the top, adds a
soft eased shadow while scrolling, and removes it when returning to the top.

- The initial floating-header implementation passed all 26 Playwright checks in
  one run, including existing component, normal/reduced motion and automated axe
  checks, plus three new navigation checks.
- After the final white-border and live-URL changes, the local production build
  passed (39 generated routes) and all three navigation checks passed again.
- Vercel production build completed successfully with the corrected workspace
  installation. Production state: READY.
- Anonymous requests to the primary pages, Button detail, icon, robots and
  sitemap all returned 200. All 34 sitemap URLs use the chosen Vercel host.
- Public-site Edge checks at 1440 and 390 px verified the white border in both
  states, no shadow at the top, a visible shadow after scrolling, pinned overlay
  placement, shadow removal on return to top, and mobile navigation. No horizontal
  overflow or browser page errors. Both viewport screenshots reviewed.

The custom domain is deferred at the user's request. No Git repository, commit,
push or npm publication was made. Automatic Git deployment is not configured
for this new project. Manual assistive-technology and cross-browser review remain
pending. The local development preview remains on port 3120.

## Initial Git release verification - 30 September 2026

The library/showcase build, explicit type checks and all 26 existing Playwright
checks passed before the first source commit. Tests used an isolated Edge profile
and their own server on port 3122. Existing development servers were preserved.
Generated output, test results, local artifacts, .env files and .vercel metadata
are excluded from Git. Personal identity and work-hour hooks apply to this new
repository; no npm publication or new deployment is part of the source push.


## Registry, playground and Outline - 14 October 2026

- Production build passed with 69 generated pages; all three workspace type checks passed.
- The final 92-check Edge suite passed 91 checks in its full run. The remaining
  persistence/deletion test used an ambiguous cell selector; after making that
  selector exact, its targeted rerun passed. No application change was needed.
- Checks include real project persistence, duplicate validation, rejected-save
  recovery, dirty-draft dismissal, record-version conflicts, selection across
  fetched pages, resizing, preferences/resources across reloads and deletion.
- Automated axe checks passed for both themes. Responsive checks passed at 320,
  390, 768 and 1440 px. Desktop/mobile playground, Outline and editor captures
  were reviewed; the final capture reported no browser page errors.
- The actual shadcn 4.21.4 CLI installed Outline into a clean Next.js 16.3.8 app,
  which built independently. Namespace installation into a Vite 8.3.4 app with
  a custom UI alias also built. Vite emitted expected RSC directive warnings.
- All eleven starter archives passed CRC, path, compiled/source-file and licence
  checks. Registry items have resolvable internal dependency URLs and scoped targets.
- Production dependency audit reported zero vulnerabilities. Diff whitespace
  checks passed. Required third-party notices remain intact in packages, registry files and starters.

The example uses browser storage, not a cloud backend. Automated checks do not
constitute accessibility certification or full cross-browser coverage. No commits
or pushes were created during the restricted Melbourne work-time window.


The public registry at ui.bld8.dev was also installed with the real CLI into the
independent Next.js consumer, which built successfully. Anonymous HTTPS checks
returned 200 for the home, registry, playground, Outline, Form, registry item/index,
ZIP download and sitemap routes. The public registry has 84 items and no local
host dependency URLs. The custom domain resolves normally on this workstation.


The final catalogue registration uses the same FormDemo as the detail page. Its
behaviour test and eight affected accessibility/responsive checks passed after
rebuilding the catalogue. The suite now contains 93 checks. The local development
preview is available on port 3120; temporary registry and production-preview
servers were stopped.
