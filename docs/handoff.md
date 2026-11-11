# Development handoff - 11 November 2026

## Complete core-component pass

The owner authorised the complete core-component plan in one pass. It is
implemented and verified locally as development 0.3.0/unreleased. The catalogue
contains 63 component families, 76 complete named examples, eighteen blocks and
three templates. Family, example, icon and registry counts are distinct.

The icon directory keeps gallery and common-button geometry independent of
selected size/stroke, and adds semantic/alias search, keyboard browsing, saved
icons, shareable settings, licensed SVG export and complete React usage.
Select, Combobox and MultiSelect now support rich stable-ID options and groups;
Dropdown supports grouped, nested, checked and radio actions. Existing simple
callers and the public MenuItem interface remain compatible.

ToggleGroup, TagInput, RangeSlider and OTPInput are new families. Field states,
native form values/reset, refs, validation and keyboard behaviour share documented
conventions. The OTP control uses one native input; host applications still own
code verification. Optional DataGrid layouts add order, visibility, resizing,
logical pinning, density and touch/keyboard multi-sort while preserving canonical
cell identity, drafts and outside focus.

Literal complete examples compile as real client modules. The website runs that
same source and exposes matching workspace/registry source, TypeScript APIs,
keyboard guidance and states to people, agent docs and the existing read-only
MCP server. Catalogue search/category/capability filters are URL-backed. Preview
fields become interactive only after their actual handlers hydrate. Registry and
starter CSS packaging include the shared control fragments.

Production build, all workspace/quality types, all 76 example modules, 398 pinned
browser-quality cases and clean Next.js/Vite source consumers passed. Themed
Next.js/Vite ZIPs independently installed, rebuilt and retained their theme in
real interactions. The 55-case affected-suite rerun passed after two stale test
queries in the full core run were corrected. See verification.md for exact scopes,
including the full-run result; no approved visual baseline was changed.

The local preview is running at http://127.0.0.1:3120/components. The owner has
authorised committing and pushing the verified source batch. Confirm GitHub
checks and production promotion against the resulting revision before treating
these additions as live. Verification was recorded against the working tree based
on 8e489a117c79f309245d3091c9e0ad6fa0841407. No new retained release is
requested; retained 0.2.0 bytes and personal identity/origin/hooks are unchanged. Private Workbench dates, exam window and
135-hour baseline remain separate. Physical iPhone keyboard/zoom/autofill and
screen-reader review remain real-device follow-up work.

## Earlier evidence

The sections below record preceding repairs and source handoffs. They are
historical; the current local capabilities and publication state are above.

## Deployment check repair

The approved batch was pushed as 96ec4ab. GitHub run 42906697903 failed
one of 678 core cases and one of 326 browser-quality cases, so the deployment
checks held production. The failing cases were catalogue preview alignment and
a WebKit quick-filter ResizeObserver error; the production build itself passed.

The local repair caps only quick-filter popup height against the viewport.
It removes the feedback between per-side available-height measurements and
popup resizing while retaining default collision handling and normal motion.
Returning to Fields restores search focus without scrolling. The optional
Popover sticky flag keeps these filter menus inside the viewport when their
anchor scrolls away; other consumers retain the default.
A new regression repeatedly shrinks and expands the picker/editor in short
viewports and retains the existing uncaught-browser-error guard.

Catalogue alignment is sampled in one rendered frame rather than across
separate asynchronous measurements, with the same 1 CSS pixel assertions.
The tab-motion test captures the native transition when it starts, verifies
intermediate movement and interruption, and retains keyboard/reduced-motion
checks. No product motion, visual baseline or test timeout was changed.

Final local acceptance passed: production build, workspace/quality types,
20 repeated alignment/motion checks, two unchanged Axe workflows, 57 pinned
popup/browser/visual checks, four clean Next.js/Vite source consumers and two
themed starter downloads. The local port 3120 preview is restored. The first
themed install attempt was interrupted by the host; its unchanged retry passed.

See docs/verification.md for repair acceptance and hosted status. Development
remains 0.3.0/unreleased; retained 0.2.0 assets are unchanged.

## Approved source handoff

The owner approved pushing the completed UI batch on 11 November: advanced data
workflows, typed grid editing, choice menus, quick filtering, developer/agent
documentation and read-only MCP discovery. The verification sections below
record the completed checks and the historical local state before this handoff.
Current source remains development 0.3.0/unreleased; retained 0.2.0 is unchanged.
GitHub checks and production promotion must be verified against the pushed
revision before treating these additions as live.

## Latest grid choice menus and quick filtering

DataGrid select columns now use Base UI menus rather than native browser selects.
They have compact selected checks, portalled positioning, neutral highlights,
stable cell boundaries and shared easing. Search is enabled by DataColumn's
optional searchable flag (automatic above seven choices); Issue Assignee enables
it explicitly. Choices write canonical IDs into the local draft. Keyboard
selection, Escape, Tab, outside focus, rapid reopening and exiting editors hidden
by a filter retain their context. Touch taps are handled once on touchend so
compatibility clicks cannot reach another cell; pans do not select an option.

The Issue workspace also has Add filter field search, explicit per-condition
apply, editable/removable summary chips, root Match all/any and Clear filters.
The existing Advanced builder still owns groups and negation. Quick edits retain
that tree and cannot replace unapplied advanced changes. Hidden row drafts remain
available for review. Shared query validation still governs numeric/date ranges.

Current production build and workspace/quality types pass. The 51-case focused
sweep and final 15-case menu/filter/overlay rerun pass. The final 30-case pinned
Chromium/Firefox/WebKit affected matrix passes, including both touch themes,
native scrolling, tap versus pan, single commits, focus and live reduced motion.
No browser error filtering or visual baseline updates were added. See
docs/verification.md and .local/grid-dropdown-*.log for exact scopes and the
earlier failures corrected during this pass. Registry source graphs and runnable
Next.js/Vite HTTP starters were checked; source and discovery docs regenerate
through the normal pipeline. Development remains 0.3.0/unreleased. No commit,
push, deployment, release or npm publication was performed.

The final light/dark menu and filter captures were visually reviewed, including
the phone field picker. The restored examples preview on 127.0.0.1:3120 reports
no page errors and the emulated phone page has no horizontal overflow. Final ZIP
starter acceptance also passes in .local/grid-dropdown-starters-verified.log.

## Latest inline editor and grid polish

The editor now shares the cell's single perimeter: its own border, inset shadow
and global focus outline are suppressed only inside DataGrid. Native editor text
selection uses a neutral highlight. Text alignment and row heights remain stable
when editing; pointer rows are 52px and coarse-pointer rows retain 60px targets
with at least 16px editor text. Grid lines, header contrast, ID/title hierarchy
and workspace status dots are quieter and more consistent. Toolbar controls and
repeated helper copy are more compact. Keyboard guidance remains accessible.

Production build and workspace/quality types pass. All 27 focused grid, workspace
and HTTP cases pass, plus all 18 pinned Chromium/Firefox/WebKit pointer/touch
checks in light/dark desktop/phone contexts. Evidence: .local/grid-polish-*.log
and docs/verification.md. Light/dark editor and workspace captures were visually
reviewed. Source, ZIPs and discovery docs were regenerated. No public API or
dependency changes, baseline updates, commits, pushes or deployments.

## Latest grid selection refinement

Selection now uses a neutral grey cell fill, one thin perimeter and a small
corner marker. Pointer dragging selects a bounded rectangle rather than browser
text; Shift-click and keyboard ranges still work. There is no automatic visible
selection before interaction. Native input selection and touch scrolling remain
available, and double-clicking an editor cannot reset its draft.

Production build, workspace/quality types, 25 focused regressions and 18 pinned
cross-browser pointer/touch checks pass. See .local/grid-selection-*.log and
verification.md. Light/dark selection captures were visually reviewed. Public
APIs and install dependencies are unchanged; source, ZIPs and discovery docs
were regenerated. This supersedes the selection styling in the earlier pass.
Changes remain local/uncommitted, with no push or deployment.

## Latest coordinated Data Workspace pass

The owner approved completing all four data-workflow priorities in one pass.
They are implemented locally: ordered multi-sort and a typed data-source
contract; atomic batch editing, validation and explicit conflict recovery;
keyboard/pointer ranges, bounded clipboard editing and local undo/redo; and the
complete Issue DataWorkspace with record forms, upload integration and runnable
Next.js/Vite HTTP references. Ordinary DataTable installs remain independent of
the optional grid. Earlier saved single-sort views remain valid.

DataWorkspace preserves drafts across query pages, freezes changes while a save
is unconfirmed, retries its original request ID and compares newer revisions
before an explicit rebase. Confirmed values stay visible during a slow refresh.
The shared local API uses locked atomic snapshot replacement and bounded replay
receipts; its timeout and abort checks cannot commit an unfinished request body.
The public HTTP example isolates tab sessions in memory and acknowledges actual
file bytes through the existing discard-only receiver.

The generated catalogue has 59 component guidance entries, 18 blocks, three
templates, 16 guides and 195 registry items. There are 47 ZIP starters: 25 Next.js
and 22 React + Vite, including both persistent Data Workspace references.
Human docs, prop tables, registry and local read-only MCP discovery are updated.

Verification is recorded in verification.md. The broad 659-case run had 657
passes: an unsorted Issue creation-order regression was corrected, and a trace
proved the async-selection failure was initial-label test setup. All 92 affected
checks subsequently pass, preserving the actual stale-response assertions.
The final save-paint change passes ten additional workspace/real-HTTP checks,
including a deliberately held post-save refresh. Production build and all
workspace/quality types pass. Clean shadcn Next.js/Vite installs build a 102-item
graph and pass both-theme workflows; both HTTP ZIPs independently build, save,
reload, restart/replay and reject partial stale batches. Those install checks
precede the final two-line confirmed-row paint change; its final build and
browser checks cover that internal change without changing the install graph.

The original pinned Linux matrix had 280/284 passes: three exposed the grid's
animation-frame focus race and one was a same-origin WebKit unload/prefetch
error. Synchronous focus fixed the grid. A fresh 18-case affected matrix passes
all browsers/themes/viewports and the unchanged touch check. All 20 approved
visual baselines pass unchanged. Final Edge tests also cover the later pointer
anchor guard. Four independent phone captures and the desktop/light plus
phone/dark workspace captures were visually reviewed.

The final production-prepared 0.3.0 snapshot before restoring the mutable dev
watcher is bb561bcca01f089c1faf79e633d2a14a255fdf53d577c2d69c1cdbff29c67d60.
Source remains uncommitted; main and the last verified hosted source are e21403b. No push, deployment,
release, npm publication or MCP registration was made. Retained 0.2.0 is unchanged.

The development preview is restored at http://127.0.0.1:3120. Open
/examples/data-workspace for the recovery fixtures, real HTTP example and both
reference downloads, or /blocks/data-workspace for the block. A live edit/review/
save, both grid instances, component/agent guides and both ZIP responses pass
without browser page errors. The owned dev parent PID is in .local/dev.pid.

The disk adapter is a single-server local reference, not a hosted database or
authentication service; never use an ephemeral/serverless disk for it. Upload
acknowledgements do not attach or host files. Physical iPhone keyboard review
remains separate. Preserve the fixed Workbench dates, exam allocation and
135-hour baseline. No effort-hour claim is made by this UI increment.

## Earlier completed capability batch

The approved four-part capability batch is complete, locally and uncommitted.
Development remains 0.3.0/unreleased; main and the hosted source remain e21403b.
No commit, push, deployment, npm publication or MCP client registration was made.
Retained 0.2.0 artifacts and release records are unchanged.

Preserve personal-account isolation and Jaison's author/committer identity. No
commits or pushes from 08:00 through 16:59 Melbourne time; never backdate them.
Keep the fixed Workbench roadmap, exam allocation and 135-hour baseline unchanged.

## Completed in order

1. Nested all/any filter groups and explicit negation share a bounded version-2
   query across FilterBuilder, IssueTable saved views and the HTTP adapter.
   Earlier version-1 queries and saved links remain valid; invalid drafts retain
   values and keyboard context. See nested-filters.md.
2. AsyncCombobox and AsyncMultiSelect share bounded paging, debounce, abort and
   stale-response guards. Selected IDs/labels survive search and paging; query,
   page and label-resolution retries have separate feedback. The canonical
   directory example uses real HTTP. See async-selection.md.
3. Cascader uses that async boundary for hierarchical browsing. Browsing does not
   commit a value; a leaf submits a validated JSON ID path. Labels, unavailable
   paths, keyboard drill/back, retry focus and paging are explicit. See cascader.md.
4. EventCalendar and CalendarWorkspace support week/month views, overlapping and
   multi-day UTC events, IANA display zones and an accessible mobile day agenda.
   The subsequent UploadQueue/HTTP adapter supports real byte progress, per-file
   cancellation, stable retry IDs and acknowledgement-only completion. The sample
   receiver hashes and discards bytes; it does not host files. See
   calendar-workflows.md and upload-workflows.md.

Existing DataTable layouts, opt-in SortableDataTable, portable saved views,
Outline workflows and all earlier uncommitted work are retained. Ordinary table
installs keep drag dependencies out. A final FileBrowser repair makes inspector
metadata follow the latest selection even when old animation frames are paused;
entry easing and reduced motion remain intact.

## Source and documentation

There are 58 component guidance entries, 17 blocks, three templates, 15 public
integration guides and 185 registry items. These are not counts of independent
primitives. The 43 ZIP starters comprise 23 Next.js and 20 React + Vite archives.
The new upload HTTP starter includes its actual Next.js receiver.

TypeScript APIs, registry metadata, public Markdown, /llms.txt, /llms-full.txt and
/agent/catalog.json share the same authorities. Related scalar unions remain
actual declarations rather than inherited JavaScript methods. The optional local
read-only stdio MCP server has four discovery tools; it performs no installations,
file writes or network fetches. Packages remain private/unpublished on npm.

## Verification

- Production build, all workspace types and quality-suite types pass.
- The 625-case sweep had 624 passes and one outdated catalogue assertion: searching
  combobox now correctly returns both local and async controls. That assertion is
  corrected; all 36 catalogue/developer/agent/MCP cases pass afterward.
- After the final inspector repair, all 64 affected file-browser, source-artifact,
  starter and discovery regression cases pass, including an added interrupted-frame
  test. The current regression suite therefore contains 626 cases.
- The pinned Linux 272-case matrix had 268 passes and exposed the inspector race,
  a calendar test sampling a replaced async transition and two WebKit floating-point
  geometry assertions. The race and test assumptions are corrected. All 36 affected
  Chromium/Firefox/WebKit x desktop/phone x light/dark cases pass. No approved visual
  baseline changed.
- Actual shadcn CLI installs in clean Next.js and custom-alias Vite consumers build
  and exercise both themes. Their 94-item graph includes the new controls. These
  checks preceded only the final FileBrowser animation repair; its API and dependency
  graph are unchanged and final build/regression/browser checks cover that repair.
- The calendar Vite ZIP installs and builds independently. The upload Next.js ZIP
  installs, builds and acknowledges real bytes with the exact SHA-256 on a phone
  layout. Four new preview views were visually reviewed without page errors.

Logs are in .local/batch-*.log. Read verification.md for precise run scope. The
existing broad Next.js starter filesystem-tracing and Vite use-client warnings
remain non-fatal. Physical iPhone keyboard/zoom acceptance remains a manual check.

## Continue from here

The local preview is running on http://127.0.0.1:3120 and its four new flows pass
a final dev-mode check. Use npm run dev; it rebuilds
editable UI and blocks on save. Read next-work.md before choosing another slice.
Calendar writes/resource views/recurrence, resumable storage transports and a
production authenticated upload service are outside this completed batch.
Publishing 0.3.0 remains separate; retain every frozen 0.2.0 byte on later releases.
