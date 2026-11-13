# Grid editor startup focus repair before publication — 13 November 2026

GitHub run https://github.com/jaskevs/bld8-ui/actions/runs/43407470087 passed
all 734 browser-quality cases, including the earlier calendar failure. Core
validation passed 944 of 945 cases; the remaining fast reopen-and-Tab case left
the next grid cell inactive. Publication was skipped and production stayed on
the prior verified release.

The controlled scheduling diagnostic found a keyboard ownership gap: an editor
was open while focus remained on its grid cell, before queued popup focus. A Tab
at that point missed the editor's existing Tab handler. The bounded repair hands
focus to the actual editor trigger during layout, only while its own grid cell
still owns focus. The existing session/commit/dismissal path handles the key;
outside and popup-control focus are preserved.

The earlier exact-commit 945-core/734-quality pass belongs to the preceding
source. This repair requires its own ordinary regressions, fresh unchanged
20-check guard and full GitHub checks before another push/publication claim.
The source version remains 0.4.0/unreleased; retained assets remain unchanged.

---

# Date-popup focus repair before publication — 13 November 2026

The first protected 0.4.0 run passed core validation and 733 of 734 browser-quality
cases. The remaining phone/light range case left the calendar open after Cancel;
publication was skipped and production remained on the prior verified release.
Run: https://github.com/jaskevs/bld8-ui/actions/runs/43394374231.

A controlled scheduling reproduction found competing initial focus owners:
DayPicker focused a day, while a queued popup request could later focus a preset
and scroll the Cancel button during pointer activation. The repair assigns initial
day focus to the popup alone. Existing commit, dismissal, keyboard and return-focus
contracts remain. The reproduction establishes that race; it does not establish
the unavailable historical CI trace's exact event order.

The earlier local 943-core/734-quality pass belongs to the preceding source.
This repair requires fresh focused regression evidence, a clean exact-commit
20-check receipt, and the normal protected CI/publication/deployment checks.
No release is claimed until its immutable assets and live routes are verified.

---

# Frozen 0.4.0 release preparation — 13 November 2026

The owner has authorised publication of the frozen application-foundations
0.4.0 source through the regular protected release pathway. Keep the later
0.5.0 content/import/planning work separate. The development descriptor remains
0.4.0/unreleased; adding the catalogue entry and publication intent requests a
release and does not establish that publication or deployment has succeeded.

Historical local acceptance recorded 943 core cases and 734 browser-quality
cases for the frozen working tree. Those results remain accurate historical
evidence. Release-metadata and narrow documentation-tracing changes still need
the clean exact-commit verification guard and the normal protected CI checks.
The tag, immutable assets, production promotion and public acceptance are pending.
Preserve retained 0.2.0/0.3.0 bytes, personal identity and the permitted actual
Melbourne commit/push hours. This section supersedes older publication-authority
statements below; the earlier implementation record remains unchanged.

---

# Local development handoff — 13 November 2026

The authorised application-foundations batch is implemented in **0.4.0/unreleased**.
Final integrated local acceptance passes. The current section supersedes
older feature/release plans below; historical evidence remains after the divider.
No commit, push, deployment or retained 0.4.0 publication is authorised by this
feature pass. Preserve the personal account isolation, identity hooks and daily
08:00–17:00 Australia/Melbourne restriction. Retained 0.2.0 and 0.3.0 source assets
must keep their original bytes.

## Current implementation

- **Reusable resource workflows.** ResourceWorkspace and its controller share
  typed drafts, review, atomic batch saves, acknowledgement recovery, explicit
  conflict rebase and guarded undo. The issue-specific DataWorkspace API remains
  available. The controller bounds loaded pages and drafted records to 100,
  columns to 30 and edit actions to 2,000 cells. Saved/shareable views contain
  presentation and allowed queries, not drafts or records. Upload acknowledgements
  remain separate from record saves. Authentication, storage, durable idempotency
  and server-side atomic revision checks remain host responsibilities.
- **Larger and hierarchical data.** DataGrid keeps its ordinary 100-record default;
  optional fixed-height row virtualization handles up to 20,000 supplied records.
  AdvancedDataGrid adds Scroll/Pages reading, retained editors/focus, separate
  details, bounded lazy children, cancellation/retry and explicitly scoped
  summaries. Trees allow eight levels and 1,000 direct children per response.
  This is row virtualization over supplied data, not column virtualization or an
  automatic remote paging/aggregation service. Clipboard/bulk writes retain
  their smaller existing bounds.
- **Scoped configuration.** UIProvider supports local themes/tokens, locale,
  explicit direction, message overrides, reduced-motion policy and portal hosts.
  Nested and externally portalled controls retain their owning configuration.
  Existing unconfigured providers retain their presentation. English fallback and
  common Arabic messages cover defined interface paths; application labels and
  business errors remain host-owned. This is not a claim that all controls are
  fully translated or every RTL/assistive-technology combination is certified.
- **Date/time interaction.** Editable TimePicker keeps strict HH:mm drafts,
  optional explicit confirmation, canonical native-form values, reset and
  read-only contracts. Its slot-only default remains available. Calendar/date
  controls add bounded dropdown navigation, up to three months and explicit
  unavailable-day rules. Civil dates and date-free times do not perform instant
  conversion, timezone resolution or service availability checks.
- **Adjustable layouts and motion.** ResizablePanels supports two to six stable
  panels, bounded controlled layouts, pointer/touch and keyboard resizing,
  collapse/restore and a readable narrow-container fallback. ScrollArea preserves
  native scrolling and zoom. AnimatedList, AnimatedNumber, AutoHeight and grouped
  layout transitions preserve native state/focus where their contracts apply and
  respect system/scoped reduced motion. AnimatedList is bounded to 200 rows;
  these controls make no frame-rate guarantee.
- **Additional charts.** DonutChart, Sparkline and StackedBarChart expose exact
  values alongside colour, legends or compact trends. Bounds are 24 categories,
  366 observations and 100 rows/six series respectively. Null/missing values stay
  distinct; displayed percentages do not replace source values. Some built-in
  chart table captions still use English.
- **Version-matched reference.** Future retained releases from 0.4.0 include
  manifest-covered docs/catalog.json and one documentation.zip. A source-graph
  snapshot plus source revision avoids circular hashing. Human reference pages
  verify a selected version; development is labelled unreleased. MCP discovery
  accepts explicit versions from verified local caches. The separate sync command
  performs bounded fixed-origin downloads; MCP handlers never fetch or write.
  Old 0.2.0/0.3.0 references report unsupported rather than using current APIs.

Current authorities contain **81 component families, 136 complete examples,
18 blocks, 3 templates, 388 registry items, 102 agent entries and 22 guides**.
Families, examples and distribution items are separate counts. No dependency was
added. Canonical examples, registry source and human/agent APIs share the same
source authorities and portable notices.

Read advanced-data.md, scoped-interface-contracts.md, resource-workspace.md and
motion-and-charts.md for the public contracts and limitations. Application
foundations are also introduced at /docs/application-foundations.

## Acceptance and continuation

**Local acceptance passes:** 943 core checks, 734 browser-quality checks,
production/types, clean Next.js/Vite source installations, eight independent Vite
builds, themed downloads, HTTP references, licence integrity and the draft
documentation/archive audit. Read verification.md for exact logs and boundaries.
The local development overview is /docs/application-foundations. Source remains
0.4.0/unreleased; local preparation does not publish a release.

Follow next-work.md after acceptance. This is additional UI scope: the fixed
Workbench milestones, exam window and 135-hour baseline are unchanged. No effort
hours, external adoption or completed private milestones have been inferred.

---

## Dependency-free release preflight — 12 November 2026

Commit d2e30c4 passed all 877 core cases and 650 browser-quality cases in GitHub
run 43173433397, including real clean Next.js/Vite installations and themed
downloads. Publication then failed before dependency installation: the publisher
statically imported preparation, which loaded the TypeScript literal reader.
A clean checkout reproduced ERR_MODULE_NOT_FOUND for typescript. Vercel correctly
kept production gated on the failed aggregate; the Git link was working.

Preparation is now imported only after the preflight/no-upload returns and the
clean reviewed Git revision check. Full licence, artifact and immutable-source
checks still run before upload. An isolated subprocess with only three publisher
modules, no preparation module or node_modules and GET-only HTTP fixtures proves
the real --check path and context guards. Both subprocesses have ten-second
bounds. CLI failures also emit bounded, token-redacted GitHub error annotations.

All 11 retained-release cases, 38 licence fixtures and the generated integrity
guard pass. The 0.3.0-5f011dca44c3c8b6 candidate is unchanged. Evidence:
.local/core-plan-linux/b061328b-04b9-4865-888b-3bf28f73ff5f/publisher-preflight-repair.log.
There are now 878 core cases. The next normal main push must pass the complete
pipeline before immutable 0.3.0 publication and production promotion are claimed.
No application API, release asset, gate setting or unrelated project changed.

## Function references and catalogue regression checks — 12 November 2026

Final review found a documentation-generation defect: multi-argument bulk helpers
were being described using the Array members of their first argument. The API
generator now emits real parameters and a complete function type/return value.
Human tables and agent Markdown label these as parameters; ordinary component
prop tables retain their existing behavior. Core helper implementations and
installable source are unchanged.

Production build, all workspace/quality types and 16 focused human/agent/MCP
reference cases pass. The 38 licence tests and complete generated guard pass.
Preparing the source candidate reuses the exact existing
0.3.0-5f011dca44c3c8b6 inventory: this correction changes no installable artifact
bytes. Evidence: .local/function-reference-build.log and
.local/core-plan-linux/b061328b-04b9-4865-888b-3bf28f73ff5f/function-reference-{docs,guard}.log.

The first normal push, 0155aa6, passed all 650 cloud browser-quality cases but
failed the core interaction step in run 43168663395. Detailed logs required
authentication. A full local run with CI's two workers reproduced two stale
catalogue assumptions: offscreen Form and Timeline previews were queried before
discovery. The other 875 core cases passed. Tests now use search and viewport
entry before the unchanged functional assertions; colour alignment also waits
for real mounted controls. All 29 cases across the three affected specifications
pass. Evidence: function-reference-{core,fixtures}.log in the same output folder.

The next normal run adds Playwright's built-in GitHub reporter alongside the
existing reporters. Its additive option was exercised locally. Assertions,
retries, screenshots, permissions and release gates are unchanged. README now
directs installers to published versions rather than a reserved release path.
There are 877 core cases. Actual publication and promotion still depend on the
passing regular pipeline; remote outcome evidence belongs in
.local/release-0.3.0-acceptance.json.

## Core workflows and regular 0.3.0 release — 12 November 2026

The owner authorised the complete core workflow pass and regular publication.
This source requests 0.3.0 through the protected main-branch pipeline. These
committed notes record local acceptance; actual publication is established by
the exact GitHub Actions run, immutable release and production manifest, not
by local preparation. Local remote-outcome evidence, when available, is recorded
separately in .local/release-0.3.0-acceptance.json.

### Delivered

- Components and Examples share a compact library heading and clear link
  navigation. Category, capability and search controls form one aligned panel;
  the competing sidebar is removed. URL restoration precedes live previews.
  Offscreen previews activate on viewport entry or card focus, then retain state
  while their keyed card remains visible through filtering. Metadata stays
  server-rendered. No five-second readiness assertion was relaxed.
- FacetedFilter reuses checked hierarchy behavior for supplied groups, counts,
  compact summaries and removable selections. Group scope includes every supplied
  enabled option, even when search hides it; partial groups are mixed. Stable
  values, native reset/form ownership, read-only values and chip-removal focus
  are explicit. Complete table, resource and people examples show OR within a
  facet and AND between facets.
- Fieldset and CheckboxGroup provide native grouping, repeated canonical values,
  external forms, read-only/disabled handling, required/min/max group validation
  and reset cancellation. Validation anchors clear when options reorder. Linked
  FormErrorSummary messages focus the relevant field. A complete React Hook Form
  request includes conditional reviewers, repeatable rows, retained drafts,
  server-error recovery and an abortable local save; no message is sent.
- AsyncCombobox and AsyncMultiSelect add external form/readOnly parity. Native
  reset restores only uncontrolled defaults without a change callback; cancelled
  reset preserves state. The shared nonmodal popup keeps nearby Reset/Lock
  controls accessible, while query generations prevent stale responses.
- Opt-in DataGrid Fill down and Apply value resolve all destination validation
  before one host edit batch. Identity/revision/read-only cells are preserved;
  ranges stay within loaded bounds, one Undo reverses the batch and persistence
  stays explicit. DataWorkspace enables these actions. Mobile actions pair into
  aligned 44px targets rather than full-width rows for every button.
- 72 component families, 117 complete examples, 344 registry items, 93 agent
  entries and 18 guides. Human API/example pages, exact registry source and
  read-only MCP discovery derive from those same authorities. No new dependency
  was added; 0.2.0 remains immutable.
- The regular release intent names 0.3.0. Core/quality job budgets are 45 minutes
  based on measured suite growth; assertions, retries, visual tolerances, source
  publication and production checks remain enforced. Community feedback has a
  version/framework/install-path issue form, without claiming reports or users
  that do not exist.

### Local evidence

- Final production UI/docs/MCP build, workspace types and quality types pass.
- Broad core sweep: 869 passed of 875. All six failures were stale guide/category
  labels or unscoped Kanban fixtures after adding complete examples; preserving
  the behavioral assertions, the repaired specs pass 56 + 9 cases. The final
  catalogue/facet/grid/filter run passes 34, including a new viewport-activation
  state-retention case. There are now 876 core cases for CI.
- Broad quality sweep: 649 passed of 650, including all 20 approved visuals and
  every async/form/grid workflow. The sole failure exposed mounting 72 catalogue
  demos before query restoration. After deferral, all 102 targeted navigation,
  grouped-discovery and touch cases pass across Chromium/Firefox/WebKit, both
  themes and desktop/phone. Three fresh local Firefox contexts observed 461,
  337 and 276ms readiness with restored queries, no overflow or page errors;
  these are observations, not a controlled benchmark. No golden was changed.
- Additional focused form acceptance passes 9; async acceptance passes 21;
  composed five-example adoption workflows pass 12 cross-engine cases.
- Real shadcn 4.21.4 installs pass in clean Next.js and custom-alias Vite consumers:
  147-item graphs, 14 actual installed complete examples, independent production
  builds, both themes, source byte/full-notice checks and receipt conflict proofs.
- Themed Outline/Next.js and Schedule/Vite downloads independently install,
  rebuild and retain selected tokens/fonts through real interactions.
- 38 licence tests and the generated-artifact guard pass: 162 reviewed
  dependencies, 12 full notices, all source/registry/agent payloads and 47 ZIPs.
- Final visual review covers 10 repaired desktop/320/390 states with no overflow,
  label clipping or page errors. Emulation is not physical-phone or assistive
  technology certification.

Evidence is .local/core-plan-linux/b061328b-04b9-4865-888b-3bf28f73ff5f/:
adoption-{core,quality,focused,async,consumers,starters,licences,candidate}.log,
adoption-final-quality.log, repair-core-fixtures-final.log, repair-vite-fixture.log,
form-workflows-focused.log, form-workflows-quality.log, corresponding reports,
adoption-firefox-readiness.json and bulk-facet-nav-visual/final/.
The final build log is .local/release-pass-build.log. Source review records no
credential/private-path findings in .local/adoption-tree-review.json. Personal
identity, isolated SSH/hooks and the ordinary commit-time rule are preserved.

## Grouped example filters acceptance — 12 November 2026

The example browser filter form is complete locally. Development remains
0.3.0/unreleased. No commit, push, deployment or publication was performed.

- Search, component families and categories share aligned 48px controls in a
  white panel. Layout stacks at narrow widths; long selected labels preserve
  their leading text and truncate at the end. Selected-picker clear actions
  have 44px targets and chevrons remain aligned at the right.
- Both pickers accept multiple selections. Family parents select every family
  in the group, including members hidden by a picker search. Partial parents
  expose mixed checked states. Choices stay open for successive selections;
  Done/Escape closes and restores focus.
- Alternatives within one filter are combined with OR; families, categories
  and query terms narrow results together. Repeated component/category URL
  keys preserve single-value links, reload and Back/Forward. Unrelated repeated
  parameters and fragments survive. Search updates replace history; choices
  add history entries. Empty results allow category-only or full recovery.
- Pure filter normalization/search/URL logic is separated from the form.
  Invalid IDs recover, duplicate values collapse and query length is bounded.
  Controls wait for initial URL restoration before accepting edits.
- Final pinned-Linux acceptance passes: production build, workspace and quality
  types; 17 focused browser/source/filter cases; 24 Chromium/Firefox/WebKit
  catalogue cases across light/dark and desktop/phone; 38 licence tests and the
  full generated-artifact licence guard. No visual baseline was changed.
- The final 14-view visual review follows the initial 30-view desktop/390px/320px sweep.
  The sweep found a Button-wrapper summary alignment issue and singular-count
  wording; both were repaired and covered by focused regressions.

Evidence: .local/core-plan-linux/d35dc714-736c-4515-ac0a-6f6210b01b15/
catalog-filters-{core,quality,licences}.log, Playwright reports and
catalog-filters-visual captures. Native local preview returns HTTP 200 on
http://127.0.0.1:3120/components/examples. These are local/emulated checks;
CI, production and physical-phone verification have not run this pass.

This is app-only reuse of the existing TreeSelect; public APIs, dependencies,
69 family/107 example counts and retained 0.2.0 assets are unchanged. The next
source-grounded priorities are recorded at the top of next-work.md: reusable
faceted selection, the shared form contract, remote-choice form parity, bounded
grid bulk edits and an explicitly authorised reviewed release.

## Component and example expansion acceptance — 12 November 2026

The approved core-library batch is complete locally. Development remains
0.3.0/unreleased. Nothing was committed, pushed, deployed or published. Retained
0.2.0 assets and unrelated repositories are unchanged.

### Delivered source and discovery

- Five Base UI compositions: Autocomplete, Toolbar, AlertDialog, NavigationMenu
  and PreviewCard. Each has explicit public types, styles, complete examples and
  keyboard/focus contracts. Autocomplete is optional free-text suggestion entry;
  Combobox remains a selected-record control. No dependency upgrade was needed.
- 69 component families and 107 complete named examples, counted separately.
  The example catalogue searches behavior, IDs, keyboard notes and covered
  states. Family/category/query URLs restore across reload and history. Exact
  pages use /components/<family>/examples/<example>, and source is generated from
  the same modules as the live preview.
- Every complete example has a real example-<id> registry composition. Modules
  install under bld8/examples with relative imports and their actual dependency
  graph, including custom UI aliases. Source imports and client boundaries are
  checked in clean Next.js and Vite applications.
- Three focused local recovery examples: dependent reviewer lookup with parent
  invalidation and cancellation; measured file reading/hash with explicit
  processing acknowledgement, cancel and stable retry identity; and optimistic
  Kanban saves with rollback, exact-intent retry and cancellation. These are
  labelled local adapters; authentication and durable services remain host-owned.
- Human APIs include all public parts of the new controls. Exact example
  Markdown, lightweight discovery metadata, global search and sitemap routes
  share the canonical example authorities. MCP adds bounded search_examples and
  get_example tools plus bld8://example/<id> resources without changing existing
  entry kinds. Exact source responses retain full notices and provenance.

### Repairs and verification

- Production UI/docs/MCP build, all workspace types, quality types and 107
  complete example modules pass on Node 22 in the pinned Linux environment.
- 94 focused browser/source cases pass, covering the new controls/workflows,
  exact examples, source registry, agent/MCP discovery and existing menu/form/
  table/command behavior. Ten additional focused Edge Autocomplete cases pass.
- 92 quality cases pass: 72 normal-motion checks across Chromium, Firefox and
  WebKit, light/dark and desktop/phone sizes, plus all 20 approved visual
  comparisons. No golden was changed. The last distribution/API-reference
  adjustment changed no control implementation; core and licence checks were
  rerun after it.
- 38 licence policy/distribution cases and the full generated-artifact guard
  pass: 162 reviewed dependencies, 12 canonical notices, all registry closures,
  47 starter ZIPs and their theme/font transformations, SVG exports, source/
  agent payloads and source-manifest hashes.
- Real shadcn 4.21.4 installations, independent production builds and both-theme
  interactions pass in clean Next.js and Vite consumers. Nine installed example
  entries cover all five new controls and the three recovery workflows.
  Complete example source must remain byte-identical after the CLI copies it.
- Themed Outline/Next.js and Schedule planner/Vite downloads install, rebuild
  and retain selected tokens/fonts in real interactions. The existing Vite
  chunk-size advisory remains; no new package dependency was added.
- Repaired Autocomplete acceptance, native Tab/blank-click dismissal and IME
  behavior through public primitive events; dirty-exit focus returns to the
  appropriate enabled action. Header actions wait for attached handlers. Copy
  feedback keeps a persistent live region without exposing empty status roles.
- Mobile toolbars retain single-line toggle labels in their own horizontal
  scroller. Reviewed 13 desktop/mobile views and two repaired 320/390 toolbar
  captures; repaired toolbars are 50px tall with no page overflow or errors.
- A real CLI install proved that code transformation stripped a leading licence
  comment. Complete examples now use registry:file delivery inside their
  registry:block composition: relative imports need no rewriting, source bytes
  and full copyright/permission text survive. No notice check was weakened.

Evidence: .local/core-plan-linux/f9ade5c7-f2ca-4b57-8240-8c4c96f15b24/component-expansion-{core,quality,licences,consumers,starters}.log,
the corresponding Playwright reports, component-expansion-visual captures and
notice-cli-proof before/after files. Edge evidence is
.local/autocomplete-proof/final.log. Browser emulation is not a physical iPhone
keyboard/zoom check or assistive-technology certification. CI and production have
not run this local batch. The local development preview is on port 3120.

## Licence integrity and marketing acceptance — 12 November 2026

The authorised MIT hardening and initial copy/navigation/marketing pass are
complete locally. Original MIT terms and upstream authorship are preserved;
no visible-credit requirement, access key or anti-fork condition was added.
Development remains 0.3.0/unreleased. No commit, push, deployment, npm publication
or retained release was performed. Retained 0.2.0 files and catalogue are unchanged.

### Source and distribution

122 UI/block/canonical example modules carry SPDX attribution; the four shadcn
adaptations retain their original copyright alongside BLD8 modifications.
Complete copied modules retain full permission notices. Registry, starters,
source JSON, complete examples, playground exports, icon React usage and
individual agent/MCP responses carry the applicable notices and provenance.
Portable provenance distinguishes canonical source paths from starter/npm/
registry installation paths. Search/catalog MCP summaries share notices once
instead of repeating them in every entry. The local MCP package has a LICENSE.

The review inventory and CI guard pin workspace patterns and linked package
identities, dependency metadata, full notice contents and provenance mappings.
Checks run after generation and before publication; release preparation checks
portable artifacts before hashing. Future source bundles include the licence
inventory/policy and brand guidance, without changing retained asset names.

### Website and documentation

The homepage uses white surfaces, near-black type and #FFD900 accents, with
real form/table/checklist previews. Preview height changes use shared easing,
retain the currently rendered height on interruption and cancel for live
reduced motion. Natural layout and popup overflow return after settling.
Section reveals remain readable without animation and reveal on keyboard focus.

Primary navigation is Components, Blocks, Templates, Icons, Themes and Docs.
The Docs hub groups installation, styling, workflows and reference. The footer
has Library/Documentation/Project groups. Public badges say MIT · Free;
Focused/Complete indicate scope while existing machine tier IDs stay compatible.
The usage page explains notices and commercial use without implying copyright
transfer. /licensing redirects to the existing /plans page for portable links.
The ordered next copy/navigation pass is in next-work.md. Contributor and agent
licensing instructions are in AGENTS.md, licensing.md and agents.md.

### Verification and repairs

- Node 22 production UI/docs/MCP builds, workspace and quality types, and all
  83 complete example modules pass.
- 38 licence-policy/distribution tests pass. The full guard passes for 162
  reviewed locked dependencies, 12 canonical notices, 211 registry items and
  their closures, all 47 ZIPs plus six theme/mode transformations each, font
  notices, 5,631 SVG exports, source/agent payloads and manifest notice hashes.
- The affected 14-suite browser/source sweep passed 132 cases after repairs.
  It covers navigation, collections/accessibility, icons, adoption, starter
  exports, source updates/retained assets, agent/MCP data, complete examples and
  generated playground code. This sweep precedes the final measured preview
  height animation and the date recovery repair; the following checks cover
  those later changes. No full core or full browser matrix is claimed.
- Final marketing/documentation checks passed 51 cases across Chromium,
  Firefox and WebKit. They cover 320/390/768/1440px layouts in both themes,
  native form validation/reset, keyboard tabs, source-scope labels, card/title
  alignment, single-line checklist indices, interrupted height animation and
  live reduced motion. The portable /licensing alias also passes its three-browser follow-up checks.
- Seven viewport/theme captures were reviewed, including tablet layout, form
  and workflow states. No document overflow or uncaught page errors occurred.
  Marketing screenshots/metrics are in the evidence directory below.
- Real shadcn CLI source installations into clean Next.js and configured-alias
  Vite applications passed their independent builds and both-theme interactions.
  The 122-item graph, lean sign-in dependency boundary, receipt checks, current
  typed editors, source provenance and stylesheet/provider behaviour were kept.

Initial local failures were retained as evidence. The expanded footer overflowed
at tablet width; grouped responsive footer columns fixed it. Intrinsic artwork
heights and wrapping checklist indices were corrected with shared grid rows and
nonshrinking indices. Starter tests incorrectly required use-client to be the
first bytes; TypeScript AST checks now require it to remain the first statement
after licence comments. No client boundary assertion was removed.

The first marketing cross-browser pass hit WebKit errors when forced document
navigation aborted same-origin Next route prefetches. Each tested document now
stays alive through its layout/error assertions; the full page-error guard
remains, and no errors are filtered. The 51-case rerun passes.

A clean Vite dark install exposed a genuine date editor race: capture-phase
measurement updates restored old controlled input text before its change handler.
Native input/setter tracing reproduced it; moving measurement to the bubbling
input handler fixes the ordering. The shared recovery helper now checks the new
native value immediately, and a deterministic pending-frame regression preserves
the invalid-value guard, unchanged Apply position, canonical commit and focus.
Three focused core cases and all twelve normal-motion browser/theme/viewport
mixed-grid cases pass. A final proper-dark native trace confirms all three valid
recovery values reach the input bubble unchanged, with zero browser errors.
The initial standalone trace used the wrong theme attribute and represents
default light; the original installed-source failure was Vite dark.

Evidence: .local/license-marketing-*-linux.log and
.local/core-plan-linux/2ae10063-ee09-42d7-bb84-c189c879eb9c/.
The marketing-review/ directory contains captures and metrics;
date-recovery-accepted/ contains core/quality logs and the fixed native trace.
Browser reports and failure traces are retained before removing the owned
verification container. No approved visual baseline was changed.

Local preview: http://127.0.0.1:3120/ and /docs. The existing dev service is
preserved. Hosted CI/production promotion and physical iPhone/assistive-technology
review are separate; emulated browser checks are not device certification.
Private Workbench dates, exam window and 135-hour baseline remain unchanged.

---

# Development handoff - 12 November 2026

## Calendar selection spacing - 12 November 2026

The compact event calendar now keeps a 2px selection inset on every edge.
Stretching its date tile fixes the former 2px top/sides and 8px bottom mismatch.
Event counts sit below the centred date without shifting its baseline; selected
accent colour remains stable while hovered. Month/week views, gallery cards and
320/390px detail layouts share the same geometry in light and dark.

Production UI/docs/MCP builds, workspace types, quality types and all 83 complete
examples passed. All eighteen focused calendar checks passed: twelve existing
Chromium calendar/state/accessibility cases and six geometry cases spanning
Chromium, Firefox and WebKit in both themes. The first geometry run passed 15/18;
its three light-theme setups incorrectly assumed an explicit theme attribute.
The application defaults to light when that attribute is absent; correcting the
setup preserved every geometry, hover, focus and error assertion. The final
18-case run passed without retries, timeout extensions or baseline updates.
The full core and browser matrices were not repeated for this scoped CSS repair.

Evidence: .local/calendar-spacing-build-linux.log,
.local/calendar-spacing-tests-accepted-linux.log and the before/after images and
metrics in .local/calendar-spacing-20261112/. Reports are under the owned
60741bd7-525a-4619-8fc2-e56932b287bd verification directory. No API/dependency,
retained-release, commit, push or deployment changes were made for this repair.

## Dates, typed grid editing and checked hierarchies

All three authorised core priorities are implemented and verified locally as
0.3.0/unreleased, based on fcc1de91ffc5a0d593a73ff572f90d253cb3ca72.
No new commit, push, deployment or retained release was requested for this pass.
The catalogue now contains 64 families and 83 complete named examples; eighteen
blocks, three templates, 211 registry items and 1,877 canonical icons remain
distinct counts. Agent discovery contains 85 entries and seventeen guides.

DataGrid adds buffered date and multi-assignee editors, native checkbox editing,
canonical parsing/quoted TSV round trips and typed display/editor hooks. A custom
TreeSelect editor demonstrates portal ownership, Apply/Cancel, validation and
outside-focus handling. Live permission/schema checks and edit-session identities
reject stale callbacks; host applications still own revisions and atomic saves.

DatePicker supports opt-in ISO keyboard entry with native form ownership,
required/bounds validation, refs, controlled values and prevented reset.
DateRangePicker adds host-supplied presets and explicit Apply/Cancel drafts while
preserving immediate selection by default. The guide explains native validation
and form-controller boundaries without changing existing button ref contracts.

TreeSelect adds leaf-ID selection, mixed parents, loaded-item/alias search,
keyboard navigation and bounded abortable lazy children with retry. Parent actions
select loaded enabled leaves only; they never silently select future children.
Required validation for this button-triggered control remains host-owned.

Production UI/docs/MCP builds, all workspace/quality types and all 83 complete
example modules pass. All 764 core cases pass. The 518-case browser matrix passed
511 cases; seven browser-check issues were repaired, and all 36 affected cases
then passed across the twelve configurations. Twenty approved visual baselines
remain unchanged. Clean Next.js and custom-alias Vite registry consumers installed and built the 122-item graph,
running the real examples and test-only stale-editor/permission fixture in both
themes. Lean sign-in keeps its independent dependency boundary. Themed Next.js
Outline and Vite Schedule downloads also installed, built and retained their
colours/fonts/portal styling through real interactions. See verification.md for
initial failures, repairs, exact evidence and the final focus-only CSS check.

Local editing preview: http://127.0.0.1:3120/components. New detail routes are
/components/tree-select, /components/date-picker, /components/date-range and
/components/data-grid. Human and agent documentation and registry source are
generated from the same authorities. Retained 0.2.0 files, repository-local
personal identity/origin/hooks and sibling projects are unchanged. Real iPhone
keyboard/zoom/autofill and assistive-technology review remain follow-up work.

## Historical handoffs

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
