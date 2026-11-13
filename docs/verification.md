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

Publication is owner-authorised for frozen 0.4.0 only. The recorded local
application-foundations acceptance below remains 943 core cases and 734
browser-quality cases. It predates this release-preparation diff and is not an
exact-commit push receipt, a new CI result or evidence of a deployed release.

This preparation adds 0.4.0 to the retained-version catalogue, requests it in
publication intent and backports only bounded documentation tracing. The
0.4.0/unreleased descriptor and all earlier retained asset bytes stay unchanged.
The exact committed revision must still pass the local verification guard and
regular CI before publication and production promotion. Verify the final tag,
manifest and documentation/starter assets publicly, and compare retained
0.2.0/0.3.0 hashes. No new passing counts or publication claims are recorded here.

---

# Application foundations acceptance — 13 November 2026

Source is **0.4.0/unreleased**. The completed working tree passed local acceptance
in the pinned Linux Playwright image under Node 22.22.0. This is working-tree
evidence, not a clean committed-revision push receipt or a deployed release.

## Final checks

- Production build, all workspace types and quality-suite types pass. Generated
  authorities contain **81 families, 136 complete examples, 18 blocks, 3 templates,
  388 registry items, 102 agent entries and 22 guides**. No dependency was added.
- **943 core cases pass (7.2m).** This includes native forms, pointer-safe time
  feedback, unavailable date/range entry, narrow LTR/RTL navigation, scoped portal
  inheritance, resource recovery, virtual editor retention, simultaneous tree
  child responses, motion, chart geometry and complete-example accessibility.
- **734 browser-quality cases pass (13.2m).** All 20 approved screenshots
  match without baseline updates. Coarse-pointer checks and normal-motion flows
  run in Chromium, Firefox and WebKit, light/dark, desktop/phone configurations.
- Actual shadcn registry source installs pass in clean Next.js and custom-alias
  Vite applications, including the 16 new installed foundation workflows. The
  installed registry graph contains 179 items, including required block modules.
- Eight independent Vite starters build. Actual themed Next.js/Vite downloads
  build and pass their browser interactions. Both HTTP Data Workspace references
  build and exercise atomic revision-checked save, conflict and retry behavior.
- All **38 licence fixtures** and generated distribution integrity pass: 162
  reviewed dependencies, 12 complete notices, registry closures, every starter,
  fonts, SVGs, human/agent source and release manifests.
- Versioned documentation's 17 Node fixtures and 12 actual stdio MCP cases pass
  within the core suite. They cover immutable caches, bounded transport, version
  selection, read-only tool boundaries and filesystem-write-denied readers.
- The local draft candidate has **478 artifacts**, all byte hashes
  verified. Its documentation catalogue and offline ZIP match the source-graph
  identity and each other; archive CRCs, entry/raw-byte limits and notices pass.
  Draft source snapshot: 2d9a42f17cd526c0fc77aeafb425861f6812b7a17f806dd6cd6dc5265cef3c49. It remains unreleased with no
  fabricated source revision. Retained 0.2.0/0.3.0 and publish intent are unchanged.
- Six production preview captures were inspected across desktop and narrow
  inventory, panels, calendar, charts, motion and a scoped RTL dialog. The native
  development preview is refreshed; overview and representative routes return 200.

The calendar's unintended default inset was narrowed to opt-in dropdown navigation.
A real TimePicker defect moved Submit between pointerdown/up when blur inserted
an error. Disclosure now waits through native pointer activation; validity stays
synchronous and reset/Cancel clear pending feedback. Their original visual, focus
and native-invalid assertions pass. No timeout, tolerance or baseline was relaxed.

## Evidence and boundaries

Logs and candidate audit are in
.local/core-plan-linux/e7fdd3fe-aee6-461d-a535-e793ac6cebfd/.
.local/foundations-0.4-acceptance.json records the final changed-source digest and
individual stage logs. The normal exact-clean-commit pre-push guard is separate.

No commit, push, deployment or immutable 0.4.0 publication was performed. Physical
phone keyboard/zoom, assistive technology, external installation feedback and
performance certification are not established by these automated checks.

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

# Core editing and hierarchy acceptance - 12 November 2026

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

Local acceptance of development 0.3.0/unreleased, based on
fcc1de91ffc5a0d593a73ff572f90d253cb3ca72 plus this uncommitted feature pass.
Nothing was staged, committed, pushed or deployed. New hosted CI results are not
inferred from these local checks; retained 0.2.0 assets are unchanged.

## Build and distribution

- Production UI/docs/MCP builds, all workspace types, quality types and strict
  compilation of all 83 complete example modules passed.
- Counts: 64 component families, 83 named examples, eighteen blocks, three
  templates, 211 registry items, 85 agent entries, seventeen guides and 1,877
  canonical icons. Counts are separate measures, not additional components.
- Node 22.22.0 and the pinned Playwright v1.63.0 Noble image were used. The image
  digest remains eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27.
  An explicit source allowlist excludes host credentials, environment files and
  node_modules. Source/build byte comparisons are recorded in the local review.
- The final full core suite passed all 764 cases. The complete browser-quality
  matrix passed 511/518: twenty unchanged approved images, 66 coarse-pointer
  checks and 432 normal-motion browser/theme/viewport cases. All 36 affected
  cases then passed after repairing the seven browser-check failures. Report
  identities confirm passing evidence for each of the 518 unique cases across
  these runs; no subsequent full green matrix is claimed. This local quality run
  used four workers; CI's configured worker count remains two. No retries,
  error filters, timeout extensions or baseline updates were introduced.

## Behaviour exercised

The seven new complete examples exercise native and controlled date forms,
external form association and prevented reset; explicit range drafts/presets;
checked and lazy tree selection; mixed typed grid editors; and a TreeSelect
composed through public custom-editor hooks. Shared helpers run these exact
source examples in the showcase and independent registry consumers.

Checks cover invalid-date recovery, inclusive bounds and date-only parsing,
canonical boolean/array validation, quoted TSV copy/paste, explicit cancellation,
focus return and outside focus, nested popup dismissal, disabled choices,
loading/error/retry and stale-source cancellation. Tree parent actions affect
loaded enabled leaves only; search covers loaded labels/descriptions/aliases.
Native composition events protect IME confirmation from tree keyboard actions.
Repeated grid validation/repair checks preserve the Apply target within one CSS
pixel. Reduced-motion preference changes remain live and uncaught browser errors
remain failures.

## Installed source and downloads

Clean real shadcn installs passed in Next.js and custom-alias Vite. Both built the
122-item transitive graph and ran the seven actual examples plus a test-only host
fixture in both themes. Retained callbacks cannot change locked/disabled/missing
rows or later sessions; valid delayed commits use the newest host callback.
Invalid legacy date repair keeps its text editor until that session ends.
Lean sign-in installed and built without unrelated calendar/drag/overlay code.
Receipt/conflict checks passed, temporary consumers were removed and registry
bytes were preserved. These consumer checks preceded only the final one-line
TreeSelect focus-CSS refinement, separately checked in the final browser matrix.

Themed Next.js Outline and Vite Schedule ZIPs independently installed and built,
preserving selected fonts, colours and body-mounted portal styling through real
interactions. Vite's non-failing module-directive/chunk advisories are not treated
as performance evidence. Human APIs, agent discovery and source requirements
regenerate together; no new npm, hosted MCP or retained source release is claimed.

## Repairs and earlier results

Initial focused runs exposed prevented native-reset and date composite-blur
issues, controlled-date DOM synchronization and moving validation/action geometry.
Those defects were repaired without relaxing the corresponding assertions.
Grid feedback now measures intrinsic content separately from its reserved outer
height and schedules observer writes, avoiding WebKit ResizeObserver loops.
A short-height TreeSelect positioning repair keeps both list and footer reachable.
Manual review removed a duplicate branch outline while retaining row focus and
forced-colours feedback.

The first full core run passed 762/764: two legacy date queries matched fields in
new examples as well as their intended live preview. Scoping queries to the
named preview preserves the same value/focus/bounds assertions. The subsequent
full run passed all 764. A preceding quality attempt was deliberately stopped
at 95 passed, one failed and two interrupted cases after a WebKit background
prefetch cancellation during hard navigation between four touch examples.
Those four checks now use independent fresh pages, retaining every native focus,
text-size, containment and unrestricted-zoom assertion. A second attempt stopped
at 198 passed, one failed and four interrupted cases when the older five-route
touch scenario exhausted its total 30-second test budget under concurrent load.
Its existing assertions now run in five independent fresh-page scenarios, without
increasing the deadline or changing control behaviour. The complete 518-case
run passed 511 cases and failed seven Firefox checks: four synthetic copy checks
read the original DataTransfer rather than the event-owned clone; two outside
range actions and one custom-editor action tried to click buttons covered by
open popups at phone widths. A bare Firefox diagnostic proved the clipboard
identity difference. Helpers now populate/read the actual event clipboard and
use native outside-pointer dismissal when a popup covers the host button; an
uncovered button is still clicked directly. Exact TSV, canonical values,
dismissal, form validity and outside-focus assertions remain. All 36 affected
cases passed in the full browser/theme/viewport rerun; all seven failed report
identities are covered. The first focused repair attempt passed 8/36: it exposed
the analogous Firefox paste-constructor behaviour and an incorrect assumption
that programmatic focus alone dismisses Base UI popovers. The final helpers use
actual event data and pointer events. No application code changed for these final
helper repairs and no browser error was suppressed.

The previous pushed revision's CI core run passed 734/735 and held its release
gate. Its upload concurrency test assumed request arrival order matched file
order. The repair binds acknowledgements to decoded file identity and deliberately
reverses request observation order; eight repeats and the final core run passed.
No upload scheduler/application behaviour was changed for that test repair.
Nested MultiSelect Escape checks now reopen the list before checking dismissal;
clipboard checks paste the actual quoted TSV payload, preserving parser policy.

## Visual review and practical limits

A normal-motion production observation pass captured 44 images across desktop
light, phone light/dark and 320px popup layouts, covering dates, range drafts,
checked/lazy trees and mixed/custom grid editors. Representative captures were
visually inspected. No scenario error, uncaught/console error, document overflow
or popup overflow was recorded. Internal table scrolling and bounded vertical
calendar scrolling are intentional. The final row-focus refinement was checked
separately in the restored local preview. Viewport observations are not performance
benchmarks, physical iPhone keyboard/zoom/autofill acceptance or accessibility
certification. Assistive-technology and real-device review remain follow-up work.

Evidence under .local/: editing-build-accepted-linux.log,
editing-core-accepted-linux.log, editing-quality-coverage-linux.log,
editing-quality-repaired-final-linux.log,
editing-consumers-linux.log, editing-starters-linux.log and
editing-review-linux.log. Earlier diagnostic logs remain available rather than
being relabelled as final success. Reports/captures are retained in the owned
core-plan-linux run directory; local preview uses port 3120.

## Historical verification

# Complete core-component pass - 11 November 2026

Local source acceptance for development 0.3.0/unreleased, based on HEAD
8e489a117c79f309245d3091c9e0ad6fa0841407 plus the uncommitted core/icon pass.
These results were recorded before the owner authorised the source handoff.
GitHub checks and deployment must be verified separately against the pushed
revision. No new retained release is requested. Existing 0.2.0 assets and
repository-local ownership, SSH destination and hooks are unchanged. The isolated
Windows development preview serves port 3120.

## Implementation and build

The catalogue contains 63 component families and 76 complete named examples;
there are eighteen blocks, three templates, 206 registry entries and 1,877 pinned
canonical icons. Agent discovery contains 84 entries and seventeen guides.
Named examples, dependency entries and visual variants are not extra families.

Production UI/docs/MCP builds, all workspace types, quality-suite types and
strict TypeScript compilation of all 76 emitted example modules passed. Public
APIs, examples, human/agent discovery and the registry regenerate from their
source authorities. New families are ToggleGroup, TagInput, RangeSlider and
OTPInput. Existing choice/menu/field/grid APIs remain compiled in real consumers.

The Linux checks used Node 22.22.0 and the exact pinned image:

    mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27

The source was copied through an explicit allowlist into an isolated /work tree,
without host credentials, environment files or node_modules. No company/global
Git, npm, SSH, GitHub or Vercel configuration was changed.

## Browser and regression evidence

- All 398 quality checks passed: twenty unchanged approved visual comparisons,
  eighteen touch checks and 360 normal-motion browser/theme/viewport cases.
  The new core-control flows account for 48 of the latter. Chromium, Firefox and
  WebKit ran in desktop/phone light/dark configurations; live reduced-motion
  changes, focus, canonical forms, reset, rich options, containment and native
  editor selection are covered. Snapshot updates were disabled.
- The final full core execution passed 733 of 735 cases. Two failures were test
  queries: an unscoped empty-state message also matched its new API example, and
  programmatic label lookup targeted a deliberately inert prehydration field.
  The queries were corrected to the visible status and accessible textbox with
  actual focus assertions. No control/application code changed for those fixes.
  All 55 cases in the three affected suites then passed. This is a focused rerun,
  not a claim that a subsequent full 735-case execution was green.
- Both ten-fresh-context hydration stress checks passed: generated rich Combobox
  examples and the existing MultiSelect preview. Preview geometry remains
  server-rendered; inert/aria-hidden readiness prevents interaction before the
  component's real handlers commit. Focused grid layout/identity coverage passed.
- A final docs production rebuild and thirty discovery/library cases passed after
  the desktop capability-row spacing adjustment. Mobile search was subsequently
  given its own full-width row; the final production rebuild and all six focused
  responsive/filter checks passed. Evidence: core-plan-layout-final-linux.log.
- Twenty normal-motion production review captures covered desktop and phone,
  light/dark, rich choices, menu preferences, invalid tags, range/code controls,
  and 320px grid layout/sort dialogs. Representative captures were visually
  inspected. The review summary recorded no scenario failure, runtime error,
  document overflow or dialog overflow. Intentional grid scrolling is separate.
  Catalogue spacing was also inspected at 1440, 768, 390 and 320px in the local
  preview. The final 390/320px light/dark Edge capture review also passed: search
  fills its row, counts sit below, and no page error or document overflow occurred.
  Four captures and final-discovery-mobile-summary.json are retained in review/.
  Local navigation/DOM observations are not performance benchmarks.

Desktop WebKit/phone emulation is not physical iPhone keyboard, autofill or zoom
acceptance. Screen-reader and larger-text/manual assistive-technology review
remain follow-up work; no accessibility certification is claimed.

## Installed source and downloads

Real clean shadcn registry installs passed independently in Next.js and
custom-alias Vite consumers. The 115-item transitive graph built; both themes
exercised native form/reset/ref/keyboard contracts and the four new controls.
Lean sign-in still builds without unrelated calendar, drag, Base UI and motion
dependencies. Receipt checks detected expected CLI transformations and local
edits. Temporary consumers were removed and production registry bytes preserved.

The themed Next.js Outline and Vite Schedule starter ZIPs independently installed,
rebuilt and retained their selected fonts, colours and portal styles through real
interactions. All raw/compiled CSS fragments are packaged for consumer rebuilds.
Vite reported a non-failing large-chunk advisory; no loading/performance superiority
is inferred from a successful build.

Evidence logs under .local/: core-plan-build-linux.log,
core-plan-all-linux-final.log, core-plan-affected-linux.log,
core-plan-quality-linux.log, core-plan-consumers-linux.log,
core-plan-themed-starters-linux.log, core-plan-discovery-final-linux.log,
core-plan-layout-final-linux.log, core-plan-hydration-stress.log and
core-plan-legacy-hydration-stress.log. Reports and review captures are in
.local/core-plan-linux/d5643057-016f-428d-857d-24a8172020d9/.
These are ignored local artifacts, not public release assets. The owned Linux
test container was removed after retaining reports; the local preview stays up.

Before the approved push, only the browser-quality job execution budget was
raised from twenty to thirty minutes: its verified tests alone took 18.4 minutes.
Per-test limits, assertions, retries, screenshots and the release gate are
unchanged. Application source has not changed since final local acceptance.

## Historical evidence

The dated sections below describe preceding passes and are not the current
publication state.

---

## Core component review and icon directory - 11 November 2026

The owner prioritised core components and requested a whole-library review.
next-work.md records the 59-family inventory, existing capabilities and planned
choice/menu/field/example/new-control batches. Those future APIs are not claimed
as implemented. This pass implements the icon directory and clearer entry copy.

Pinned Linux/Node 22 acceptance passed production build, workspace types and
quality-suite types, then all 16 core icon cases. Coverage includes existing
light/dark Axe checks, four viewport widths, licensed sized SVG downloads,
prefetch failure/retry, actual clipboard actions, aliases, saved persistence,
share links and mobile focus recovery when an unsaved opener disappears.

All 12 normal-motion icon workflows passed across Chromium, Firefox and WebKit,
desktop/phone and both themes. They retain normal/live-reduced-motion checks,
strict horizontal containment, standard gallery and toolbar stroke, stable
button geometry, Sheet dismissal/focus and uncaught-browser-error guards.

The first core run exposed a renamed canonical Trash alias (14/15); the Delete
shortcut and metadata search were corrected, then 16/16 passed. The initial
portable run passed its six desktop cases; six phone cases queried the correctly
aria-hidden modal background with a role locator. Moving that noninteractive
style measurement outside the modal interval preserved all assertions. A
SHA256 authority check confirmed no app/core/dependency change before reusing
the same build for the successful 12-case rerun. No timeout, error filter or
approved visual baseline was changed.

Six light/dark desktop, phone and phone-Sheet captures were produced; the
desktop and Sheet layouts were visually reviewed. Capture evidence reports
no page errors or horizontal document overflow in all four contexts. Desktop
WebKit/phone emulation is not a physical iPhone native-keyboard acceptance.

Evidence: .local/icons-focused-linux-final.log and icons-quality-final.log;
core/build reports: .local/icons-linux/d0d46a61-82d4-41db-b1fd-7a609d76037d;
final quality/captures: .local/icons-linux-final/
aeddb2c8-f9eb-4ac3-b8c0-635fe33613de. Own retained container and temporary
snapshot image were removed after success.

No public UI API or dependency graph changed. This is local development
0.3.0/unreleased, with no commit, push, hosted deployment or new source release.
Retained 0.2.0 files and personal Git guards are unchanged.

---

## CI deployment repair - 11 November 2026

GitHub run 42906697903 for 96ec4ab passed its production build but failed
core validation (677/678) and browser quality (325/326). The release gate
correctly held deployment. The core failure compared catalogue geometry in
separate frames; the quality failure was an uncaught WebKit ResizeObserver
loop while quick-filter content changed from field search to rule editor.

The popup trace shows its side and available-height measurements oscillating
as content resized. Quick filters now use an independent viewport height cap.
Their optional Popover sticky flag also retains viewport containment when
focus or scrolling moves the anchor out of view. Returning to Fields focuses
search without scrolling, only while the add menu is open. Other popover
defaults and shared motion remain unchanged.

The final popup snapshot passed 57/57 pinned Linux/Node 22 checks: 12 repeated
WebKit desktop-dark cases, 24 Chromium/Firefox/WebKit light/dark desktop and
short-phone cases, one unchanged draft-preservation case, and all 20 existing
approved visual comparisons. The regression checks strict four-edge popup
containment, repeated shrink/expand cycles, nested Values, Fields/Apply/Escape
focus, normal motion and live reduced motion. The fixture rejects every
uncaught page error; none occurred. No visual baseline was updated.

Catalogue comparisons now sample one frame while retaining all 1 CSS pixel,
padding, centering and narrow-page assertions. An intentional 8 pixel offset
still fails; moving the common grid 64 pixels leaves the simultaneous delta
at zero while the old cross-frame comparison reports 64. The original CI
trace supports a cross-frame measurement race but does not expose every
returned coordinate. The tab-motion check captures a running native transform
at creation, pauses at an intermediate position, and verifies interruption;
disabling transitions correctly fails it. Both cases passed 10 Linux repeats
each (20/20). Product timing and assertion thresholds were not relaxed.

The full frozen pushed-source reproductions passed 675/678 core and 325/326
quality cases. The additional local failures were the short-lived tab-motion
sampling assertion and three aggregate-case timeouts under concurrent load.
The unchanged two Axe workflows passed quietly (2/2, 12.2 and 12.8 seconds);
the unchanged draft case passed in the final popup run. These focused reruns
do not claim a new full-suite result for the repaired source.

Evidence: .local/core-ci-repro.log, core-ci-targeted.log,
core-ci-workflows-quiet.log, ci-quality-full-20261111.log,
ci-quality-ro-final-build-20261111.log and
ci-quality-ro-final-checks-20261111.log. Negative-control evidence is in
.local/ci-alignment-measurement-proof.json and ci-motion-standalone-evidence.json.
Final popup reports: .local/quality-linux/8f9cdca3-005e-4a5a-8310-c3e17a0dd842.

The final host production build, workspace types and quality-suite types pass.
The optional sticky boolean is present in the generated website API table and
agent Markdown. Clean shadcn installs passed all four lean/full Next.js and
Vite consumers; the full 104-item transitive graph built independently and
passed light/dark workflow interactions. Lean sign-in still excludes unrelated
calendar, drag and overlay dependencies. Generated registry bytes were preserved.
Evidence: .local/ci-repair-build.log, ci-repair-types.log,
ci-repair-quality-types.log and ci-repair-consumers.log.

Themed Next.js Outline and Vite Schedule downloads also passed independent
installation/build and real interactions, retaining their selected fonts and
theme through portalled UI and draft/booking flows (2/2). The first attempt
timed out in npm install during a long host interruption, before any starter
build or UI assertion. The exact retry passed with unchanged time limits.
Evidence: .local/ci-repair-themed-starters.log and the preserved
ci-repair-themed-starters-attempt1.log. The local port 3120 preview is restored
and serves the updated Popover API.

This is development 0.3.0/unreleased. Retained 0.2.0 assets, release gates and
owner identity/time rules remain intact. A repair push and its hosted checks
must be verified separately before treating the current additions as live.

---

## Approved capability batch - 10 November 2026

All four approved priorities were completed sequentially: nested filters, remote
selection, Cascader, then week/month calendar and per-file HTTP uploads. Source
is local 0.3.0/unreleased. Main remains e21403b; nothing was committed or deployed.

Production build, workspace types and quality types pass. The 625-case regression
sweep passed 624 cases; the sole failure was a stale search-count assertion after
adding AsyncCombobox. Its corrected catalogue assertions and all developer/agent/
MCP cases pass in a 36-case rerun. A later inspector interruption test makes the
current suite 626 cases. After its repair, all 64 affected browser/source/starter/
discovery cases pass.

The pinned Linux run passed 268 of 272 cases. It exposed one real inspector race:
waiting for an interrupted outgoing pane could leave old metadata visible after
selection changed. The latest pane now renders immediately with entry easing.
The other failures were a calendar motion test retaining an animation replaced by
async loading, plus WebKit geometry 0.00003 CSS px below a nominal 144 px minimum.
Static-data timeline sampling and 1/64px measurement rounding keep the tests
meaningful without disabling motion or relaxing the declared CSS minimum. All 36
cases for the three affected flows pass across Chromium, Firefox and WebKit,
desktop/phone and both themes. No visual baseline was updated.

Clean actual shadcn Next.js/Vite installs pass with a 94-item graph and both-theme
workflows; lean sign-in still excludes unrelated overlay/calendar/drag packages.
These installations preceded only the final FileBrowser JSX animation repair;
its public API/dependencies are unchanged. The new calendar Vite ZIP builds, and
the standalone upload Next.js ZIP installs/builds and acknowledges actual file
bytes and SHA-256 on a phone layout. Four new desktop/phone previews were visually
reviewed without page errors. No physical iPhone acceptance is claimed.

Human and MCP docs expose 78 entries, 15 guides and actual TypeScript APIs. The
current registry has 185 items and 43 ZIPs. Prepared production snapshot used by
the final repair checks:
a1631c7f2993416b3bd89595d2db261e0ca9e6424d5ddcbe3815c8f8b71f30c8

The restored npm run dev preview may regenerate the mutable development snapshot.
It is not another retained release. Its async, Cascader, calendar and actual-upload
flows were also checked without page errors; verify a freshly prepared exact
revision separately when publishing.

Local logs: .local/batch-final-build.log, batch-final-regression.log,
batch-final-docs-tests.log, batch-final-linux-quality.log, batch-repair-build.log,
batch-repair-tests.log, batch-repair-linux-quality.log, batch-final-consumers.log,
batch-final-upload-starter.log and batch-final-calendar-vite.log. Known existing
Next.js tracing and Vite directive warnings remain non-fatal. Retained 0.2.0 files
are unchanged. Workbench dates, exam allocation and the 135-hour baseline remain
unchanged; no commit-time or ownership rule was bypassed.

---

## Hosted combined adoption release - 9 November 2026

Implementation f7c8998aaf4042f2e3433a276089dbf872a7b581 passed GitHub run
42606719082: core, browser quality, retained publication and UI Release checks.
The current CI suite has 522 regression and 200 pinned quality cases.

Native release v0.2.0 is immutable and targets that source SHA (release 439042520).
Anonymous production acceptance verified all **220 artifacts** byte-for-byte,
152 registry items, exact tag identity and same-version dependency URLs. Frozen
snapshot: 1322400af0b09f884e9812b9be0b9a7b544e37996d0cf6485ba9ac433e3c1d7f.
All public source routes, three standalone receipt/checker modules and static
and themed Vite ZIPs pass. Live Kanban moves/downloads, Tree retry/selection and
Chart keyboard/missing-data flows pass at 1440 and 390 pixels without page errors.

The native source:git deployment dpl_GJYozSCEncASDfuTHy6gR3sXuY43 is READY,
aliasAssigned true for ui.bld8.dev, after the unchanged required aggregate passed.
An initially missing event arrived later; owner app access is confirmed included.
Do not infer a provider latency guarantee from this one event. Development now
uses 0.3.0/unreleased while publication intent verifies the existing 0.2.0 release.
Keep retained bytes unchanged on every later deployment. The direct public-URL
consumer check is documented in updating-source.md. Native iPhone acceptance
remains a separate manual check.

---

## Combined adoption release preflight - 9 November 2026

The owner authorised all four priorities together. Implemented clean-install
receipts, retained immutable GitHub release tooling/routes and the 21-control
playground, and refreshed the existing personal Vercel Git connection. Native
GitHub release immutability was enabled by the owner. Production acceptance must
follow the actual pushed revision; local preparation is not hosted publication.

Production build, workspace types and quality-suite types pass. Clean Next.js and
custom-alias Vite consumers install their real CLI source graphs, build and pass
both-theme workflow checks. Their new receipts recognise CLI transformations as
installed baseline text and detect a deliberate edit/upstream conflict. Temporary
consumer directories are removed and generated registry bytes remain unchanged.
Six desktop/phone Kanban, Tree and Chart previews were visually reviewed.

The initial full 520-test run had 518 passes and two ENOENT trace teardown errors:
an overlapping local adapter test reused the default output directory. A separate
47-case rerun passes the complete affected motion group and all new-feature/source
checks, including two additional GitHub HTTP-adapter cases. Outputs are isolated;
no interaction assertion was bypassed. The current CI suite contains 522 cases.

The first Linux run found one whole-case WebKit touch timeout under competing local
load and aborted-navigation prefetch errors in the new test. The workflow now uses
the actual component selector and explicit shared-URL assertions; dedicated reload
coverage remains in the production regression suite and other browser workflows.
The final fresh pinned Linux run passes **all 200 cases** in 6.0 minutes, without
retries, baseline changes or ignored browser errors. This includes the existing
visuals, touch contracts and Chromium/Firefox/WebKit normal-motion flows across
light/dark desktop and phone viewports. A native iPhone keyboard review is still
manual and is not inferred from WebKit.

Receipt checks cover portable metadata, custom UI directories, mixed versions,
shared-baseline conflicts, source containment, tampering and exclusive outputs.
Release checks cover exact inventories/digests, interrupted draft recovery, tag
collisions, immutable final state, pinned redirect routes, publication context,
API upload bytes and credential redaction. A public read verifies the pinned
GitHub API version 2026-03-10 is supported. No personal/company GitHub token was
used. See updating-source.md, ci-and-vercel.md and handoff.md for the release path.

---

## Authorised source publication preflight - 9 November 2026

The owner authorised committing and pushing BLD8 UI and private planning only.
The actual Melbourne time is after 17:00. Personal Jaison author/committer identity,
repository-local SSH, hooks and exact remote destination are verified; no time
exception, date override or global/company configuration change is needed.

The complete production build, workspace types and all 493 workflow tests pass.
All 176 quality checks pass in the pinned Linux renderer across Chromium, Firefox,
WebKit, both themes and desktop/phone configurations. No image baseline changed.
The Linux runner now includes releases/next.json and CHANGELOG.md in its clean
build copy and excludes generated release output. The source inventory passes
credential-signature, UTF-8 and whitespace checks. Local credentials, build
artifacts, starter ZIPs and candidate directories remain ignored.

This publishes the accumulated lean installs, themed starters, stable dropdowns,
selection/checkbox motion, Outline details/activity/comments/guarded undo,
expanded playground and source-update tooling. Earlier clean Next.js/Vite
consumer and starter checks remain recorded below. The full source release is
still subject to the remote GitHub aggregate and Vercel production gate.

The 0.2.0 immutable version candidate remains unreleased; a source push does not
publish its reserved version paths. docs/next-work.md records the adoption-first
backlog. Float0 and other sibling applications are outside this release.

Evidence: ignored .local/push-20261109-build/types/tests/quality logs and statuses;
quality report 5b19c4a9-467f-45cb-aa40-fd44c3d973fb. This is pre-push evidence,
not an assertion of remote CI or live promotion. The exact source revision and
remote outcome are recorded in private planning after verification.

## Source versions and read-only update planning - 9 November 2026

Added the unreleased 0.2.0 source version, a changelog, /releases guidance and a
build-generated source manifest. Workspace packages remain private at their
existing versions. The manifest records the exact registry dependency graph,
normalised text digests and artifact byte digests. It describes this build, not
a claimed historical release. Current URLs move with deployment.

The standalone Node checker compares selected item graphs, including shared
styles/notices and runtime dependency changes. An optional configured UI directory
adds local-file checks: unchanged upstream, local-only edits, available updates,
conflicts, missing files, additions/collisions and removals. It makes no network
requests and never writes source. Inputs are bounded and checked for paths,
digests, duplicate/conflicting targets and missing graph dependencies. Symlink
escapes are rejected; malformed input errors do not echo file content. CRLF/LF
is normalised, but formatting/CLI transformations remain conservative local diffs.

Local candidate preparation copies only the named registry, source, starter,
checker and notice artifacts. Every dependency URL targets the same reserved
/releases/0.2.0/r directory. Existing candidates are verified and reused only
when the full inventory and bytes match; altered, extra, missing or linked files
are rejected. Candidates remain under .local/release-candidates. They are not
copied into the public site or uploaded. Retained immutable hosting, a real tag
and production-URL installation acceptance remain separate publication work.

Production build, workspace types, script syntax and whitespace checks passed.
The focused production run passed 34 tests, including seven new release/update
cases, existing adoption/starter flows and 52 generated playground variants.
After visual review, the page's browser check was rerun with explicit site themes
rather than OS preference alone: desktop/phone containment, downloads and axe
checks passed in both real modes. Those captures were reviewed. The earlier
pass caught a checker download generated before its final edit; rebuilding the
final artifacts resolved it. No full 176-case quality or physical-device run is
claimed for this increment, and no approved image baseline was changed.

The prepared candidate passed actual shadcn CLI installs, independent production
builds and light/dark workflow checks in clean Next.js and Vite applications.
Both the lean Sign-in and 63-item workflow graph passed, including the custom
Vite alias. The verifier checks candidate artifact digests, rewrites URLs only
in its loopback copy and preserves original candidate bytes. Temporary consumers
were removed normally. This checks versioned artifacts, not unpublished host URLs.
A separate read-only report against freshly installed Next.js Outline source
matched 36 files and conservatively reported two CLI-transformed helpers as
local-only differences; no files were changed. These raw-source comparisons can
report transformations as conflicts on a future upstream edit; merge review
remains required. No formatter-specific equivalence rule was added.

Evidence: .local/source-release-final-*.log/status, source-release-theme-review.*,
source-release-consumers.*, source-release-installed-next-report.*, and reviewed
source-release-*.png captures. Candidate: 0.2.0-78661907c9fa31d5. Normal development
is restored at http://127.0.0.1:3120/releases (HTTP 200). No commit, push, tag,
deployment, global/company setting or account change occurred. Earlier pending
work remains intact. See updating-source.md and handoff.md.

## Expanded playground and matching source downloads — 9 November 2026

The playground now covers 18 existing controls, adding Checkbox, RadioGroup,
Accordion and FilterBuilder. Select and Tabs also retain their selected values.
Version 2 links preserve validated configuration and accept version 1 links.
Tables share query, page, selection, visible columns and page-group expansion;
filter drafts remain separate from explicitly applied, validated conditions.
Queries and simulated bulk writes run against local sample rows. Failed writes
retain selection and focus; successful writes preserve selections made while
pending. Restoring the example clears unfinished cell edits as well as row data.

Downloaded TSX matches the configured example and its scoped registry install
command. Optional filter and cell-editing modules are included only when used.
Desktop settings stay within a scrollable sticky panel; phone jump links move
focus between settings and preview. Overlong links stop updating beyond the
8,000-character query budget, keep the draft, and offer the source download.
Existing colours, shared motion, reduced-motion and native controls remain.
No library API or runtime dependency was added.

The production build and workspace/quality types passed. The focused production
run passed 58 cases. Another source check type-checks 52 generated configurations
against extracted registry files using the workspace dependencies; this is not a
fresh package installation. The two new normal-motion quality workflows passed
24 checks in pinned Linux across Chromium, Firefox and WebKit, desktop/phone,
and light/dark. The permanent quality suite contains 176 cases; it was not run
in full for this increment. No visual baseline changed and no physical-device
claim is made. Three final local checks passed after the mobile offset and
singular-condition copy refinements. Desktop and touch-phone captures were
reviewed and contained their contents horizontally.

Early checks caught a source-download click racing URL restoration. Source,
share and reset actions now wait until that restoration is ready. The overlength
check was corrected to use enough encoded conditions to exceed the actual budget.
Visual review also caught the jump link doubling the fixed-header spacing; its
local scroll margin now works with the page's existing scroll padding.

Evidence: ignored .local/playground-expansion-*.log/status files and
playground-expanded-1440.png / playground-expanded-390.png. The normal local
preview is restored at http://127.0.0.1:3120/playground. The catalogue remains
151 registry items, 53 guidance entries, 16 blocks, 3 templates and 40 ZIPs.
No commit, push, deployment or global/company setting change occurred. Earlier
pending work remains intact. See playground.md for the configuration contract.

## Outline activity, comments and guarded undo — 9 November 2026

Added an optional history capability to the Outline repository. Existing CRUD-only
adapters remain compatible. Existing projects show a drawer activity feed with
plain-text comments, real project-save entries and status-change/restoration
entries. No history is invented for untouched seed records. Comments do not
change project versions, use recent request-ID deduplication, and retain text on
failed writes. Unsent comments remain in the repository instance while the page
stays open; saved comments persist with workspace data. The composer explains
this distinction. Pending posts block dismissal; focus returns to the enabled
composer after completion.

Mark ready and Archive return a receipt for actual status changes, skipping
already-matching projects. Undo checks every resulting project version before
restoring any earlier status. A later edit or deletion rejects the entire undo;
there is no partial restoration. A repeated applied receipt does not write again.
Transient errors retain the retry action; stale receipts are removed. The table's
query, page, columns and current selection remain, with useful return focus.
Creation, detail saves and permanent deletion do not gain undo in this slice.

The browser adapter migrates legacy arrays on the next successful write to a
version 2 envelope under the same key. Projects, history and receipts commit in
one storage write. It retains 100 entries per project / 1,000 overall and 50
recent receipts. Browser storage is a reference adapter, without cross-process
transaction guarantees. The HTTP adapter explicitly opts in with history:true;
the sample adds activity, idempotent comment and guarded undo endpoints using
its existing session scope. Production ownership and atomic database transactions
remain host responsibilities. See outline-details.md for the full contract.

The production build and workspace/quality types passed. Fifteen new domain,
HTTP and browser cases cover migration, retention, idempotency, failed storage,
abort, session isolation, atomic version rejection, filtered restoration, retained
selection, comment rendering, retries and pending dismissal. The focused
production set passed 93 cases, including existing editor recovery, table/motion,
adoption, starter and workflow regressions. The two normal-motion Outline flows
passed all twelve browser/theme/viewport configurations each in pinned Linux:
24 checks across Chromium, Firefox and WebKit. The permanent quality suite now
contains 152 cases; this was not a new full-suite or physical-device run. No image
baseline was changed. Desktop and phone activity captures were visually reviewed
and measured no horizontal drawer overflow.

The first development run passed 12 cases and caught composer focus being
requested before its disabled state cleared. Focus now returns after that commit.
A later rejection check caught the same handoff for Undo; a transient failure now
restores focus after the retry button is enabled. The new focused assertion passes,
and the consumer verifier now exercises this failure/recovery through installed
source in both frameworks and themes.

The final canonical 24-case run also includes rejected-undo focus and retry in
all twelve configurations and passes. An ad-hoc host-bridge shortcut failed
before posting because its non-localhost HTTP origin did not expose randomUUID.
The standard localhost runner resolved that harness issue without changing the
application. Run the reference app on localhost or HTTPS, as used by its UUID
creation and the supported preview/deployment setup.

Clean Next.js/Vite source installs resolve a 63-item workflow graph, with comments
and undo exercised in both themes; independent builds pass. Sign-in remains 8
items, 16 files and 4 dependencies. The actual generated Vite Outline ZIP also
installs and builds independently. The local catalogue is 151 registry items,
53 guidance entries, 16 blocks, 3 templates and 40 ZIPs. The new activity module is
a shared implementation dependency, not another advertised control.

Evidence: ignored .local/outline-activity-*.log/status files and reviewed captures.
No commit, push, deployment or global/company setting change occurred. Earlier
lean-install, starter, detail-editor and selection-motion work remains pending
with this increment.

## Smooth bulk selection and checkbox states — 9 November 2026

The shared DataTable now expands and collapses its bulk-action bar through real
layout space with the 320 ms control easing, a small content translation and
opacity. The table tracks the reveal rather than jumping to its final position.
Count updates do not replay entry; rapid reversals retarget the current height.
Closing content remains mounted only through exit, with immediate inert/hidden
semantics and focus return. Issue filters, the large-table selection slot and
resource archive feedback share the helper. Mobile wrapping can grow past the
reserved large-table slot without snapping.

Native checkboxes use separate fixed-size tick and mixed-dash pseudo-elements,
easing opacity and transform in both directions. Checked state remains immediate.
Selected cell surfaces ease without changing column geometry. Reduced motion
disables the reveal, indicators, row fills and hint transitions; forced colours
retain explicit system focus and selection.

The production build and workspace/quality types pass. The focused production
run passed 113 regressions, including 10 new selection-motion cases. After a
final hint reduced-motion refinement, all 10 new cases passed again. The tests
measure unpaused intermediate heights, table/column/scroll stability, quick
keyboard reversals, count changes, mixed/tick crossfades, closing focus, filter
draft retention, archive/undo and mobile containment/axe in both themes.
Desktop and phone selected/cleared captures were reviewed.
All four actual visible-scrollbar dropdown stability cases also passed in light
and dark at the top and after scrolling.

All twenty existing visual baselines match in the pinned Linux renderer; no PNG
was updated. The first comparison exposed the earlier stable-gutter change's
fractional crop shift. Visual projects now hide only the outer OS scrollbar before
measurement; actual-gutter browser/touch checks remain unchanged. WebKit's
headless frame cadence made a frame-count assertion unreliable. The portable
workflow now samples intermediate positions on the real CSS transition timeline,
while the regular suite retains unpaused frame/reversal checks. The final workflow
passes all twelve Chromium/Firefox/WebKit, desktop/phone, light/dark combinations.
This is focused evidence, not a fresh run of the entire 140-case quality suite or
physical-device coverage.

Actual shadcn CLI installs and independent Next.js/Vite production builds pass
with a 62-item workflow graph. Sign-in remains lean at 8 items, 16 files and 4
dependencies. Generated production registry bytes remained unchanged throughout
the consumer check. The new Reveal helper takes the local catalogue to 150
registry items; 53 guidance entries, 16 blocks, 3 templates and 40 ZIPs remain.

The first development run also caught an invisible large-table hint intercepting
Clear selection; it no longer takes pointer events. Evidence is in ignored
.local/selection-motion-*.log/status files, frame probes and reviewed captures.
No commit, push, deployment, baseline update or global/company setting change
occurred. The earlier adoption and Outline changes remain pending with this work.

## Outline details and recoverable drafts — 9 November 2026

Completed the selected next slice: a right-side project drawer for creation and
editing, with a scrollable form and persistent action footer. The drawer finishes
its 320 ms exit before unmounting; live reduced motion removes the transition.
Existing editing names and row actions remain compatible. Saving an edit keeps
the table query, page, selection and column state, with return focus that does not
scroll the page. Creation returns to page one.

Drafts are separate from saved projects. Recovery uses sessionStorage only when
the repository supplies a stable namespace; other adapters remain memory-only.
The sample HTTP namespace distinguishes demo sessions. Reloads restore edited
and invalid field values; blocked storage explains the memory-only limit.
Reverted fields remove obsolete drafts. Discard failures are reported, pending
saves cannot be dismissed, and successful saves clear recovery data.

Optional repository.get and draftKey additions preserve existing implementations.
The JSON contract adds GET /projects/:id. Stale drafts retain their original
version; a newer record is compared before the owner explicitly reapplies only
edited fields or uses the saved project. A second save is required. Failed reads,
deleted records and stale responses retain the draft without an automatic write.
Production ownership and atomic writes remain host responsibilities.

The reviewed production build/types and 52 focused regression cases pass,
covering the new workflow and existing local/HTTP editing, table geometry,
accessibility, mobile layout and stable-dropdown cases. The new normal-motion
workflow passes all 12 pinned Linux configurations across Chromium, Firefox
and WebKit, desktop/phone and light/dark. This targeted run does not claim a fresh
run of the entire earlier 116-case quality suite; the permanent suite now has 128
cases. No image baseline was updated.

Fresh Next.js and Vite consumers install the actual registry through the shadcn
CLI, build the expanded 61-item workflow graph and exercise recovery/save through
the installed Outline drawer. Sign-in remains independently lean. Actual themed
Next.js Outline and Vite SchedulePlanner downloads install and rebuild; the
Outline download now exercises drawer token inheritance and recovered drafts.
The generated source catalogue contains 149 registry items, 53 guidance entries,
16 blocks, 3 templates and 40 ZIPs. The two new helper modules are not separate
catalogue components.

The first focused run passed 41 cases; four new assertions incorrectly expected
alert roles on non-alert notices. The assertions now use visible notice content;
dynamic warnings also announce through polite live regions. Draft-shape validation
and a manual-revert recovery edge case were strengthened before the final run.
Evidence: .local/outline-details-*.log and corresponding status files. Desktop
and phone captures were reviewed, with matching form/footer scrollbar gutters and
aligned action edges at 320, 390, 768 and 1440 px. An earlier independent check
completed both framework builds and interactions, then correctly rejected registry
files regenerated by a leftover development watcher. The verified BLD8 process
group was stopped, and the stable registry check was rerun successfully; company
processes were untouched. No commit, push or deployment occurred.
Comments, activity and undo remain subsequent slices.

## Dropdown page stability — 9 November 2026

Reproduced a 1.8125 px vertical jump when either theme starter dropdown opens or
closes with visible desktop scrollbars. Base UI reserves a stable scrollbar
gutter during its modal scroll lock. Adding that gutter only at opening changes
the viewport units used by the responsive heading and shifts the content below.
The showcase now reserves the gutter from initial layout. Select APIs, keyboard
handling, focus return and modal scroll locking are unchanged.

The regression explicitly restores Chromium's visible scrollbars, which its
default headless arguments hide. It samples navigation, heading, panel and scroll
geometry on every animation frame through opening and closing both selects, in
light/dark mode and at two scroll positions. All four cases failed against the
old production build with the measured 1.8125 px movement and pass after the fix.
The production build and 51 targeted theme, export, control, accessibility and
responsive checks pass. No screenshot baseline was changed. Evidence is in
.local/overlay-layout-{build,tests}.log and their status files; the frame probe is
.local/select-shift-probe.json. This follow-up remains local and uncommitted.

## Lean installs and themed starters — 9 November 2026

Completed the two adoption priorities selected by the owner. Public registry item
names remain compatible, while named block imports resolve to their actual UI
modules rather than the complete index. Sign-in changed from 41 registry items /
49 files / 10 dependencies to 8 / 16 / 4. The representative multi-workflow install
changed from 59 to 46 items. Counts describe installed source, not bundle timings.

Source ZIPs have selected package source, compiled files, dependency manifests
and subpath exports. Their original client entry boundaries remain intact. Source
manifests use the same focused block files. Existing static download URLs remain.

The theme lab can select every block/template, preview its actual component and
download a themed Next.js or Vite project. Shared URLs retain the starter,
framework and mode. Exports contain theme CSS/JSON, root class/mode and selected
self-hosted fonts/OFL notices. Pending downloads are cancelled when options change;
failed requests retain their settings and can retry. The bounded Node route uses
catalogue IDs and validated theme data, with explicit archive deployment tracing.

The final build/types and complete 421-case regression suite pass, including
33 theme/adoption cases. The full pinned run passed 115 cases; a long WebKit
touch case reached its 30-second deadline during concurrent jobs, then passed
alone with the same timeout and assertions. This covers all 116 cases and
keeps all twenty existing image baselines unchanged. The small final control-row
alignment is also covered by the complete final regression and isolated touch run.
Real shadcn installs build Sign-in and
the 46-item workflow graph independently in Next.js and Vite. Actual themed
Outline/Next.js and SchedulePlanner/Vite downloads install, rebuild and retain
their selected fonts, mode and portal styling in working browser interactions.

Independent builds caught a missing client directive in the trimmed package
barrel; the generator now preserves the original boundary and archive tests guard
it. A first test-only helper call and a scroll-dependent header comparison were
corrected without relaxing colour isolation. An initial overlapping regression
run passed 419 cases and timed out one seven-page accessibility sweep; the final
complete run uses the same two-worker concurrency as CI and passes. Desktop/phone
captures were reviewed, including final control-row alignment.

Evidence is under .local/adoption-*.log, corresponding status files, install
footprint JSON and review captures. All forty archive export maps are checked.
No commit, push, deployment or npm publication was performed for this increment.
Outline expansion, further playground coverage and versioned releases remain
later priorities. The fixed Workbench roadmap and exam allocation are unchanged.

## GitHub quality-container recovery — 30 October 2026

Source 795996b passed GitHub core validation, including the production build,
workspace types, independent Vite starters, clean Next.js/Vite registry consumers
and interaction/accessibility tests. All twenty visual comparisons and the
Chromium/WebKit workflows passed in the quality job. Its 32 Firefox cases failed
at browser launch because the root process inherited /github/home, owned by
pwuser. Run 41034870087 failed the aggregate, and the public domain retained the
previous release. This is not evidence of failed application assertions.

The correction scopes HOME=/root to the quality-test step in the pinned root
container. It does not skip browsers/tests, regenerate baselines, relax image
checks or change application source. A disposable-container probe reproduces the
original ownership failure, then verifies launch and input interaction with the
container user's existing home. See .local/firefox-home-proof.json and the CI
guide. The remote jobs and live release must be verified after the corrective
push; the earlier complete local evidence remains separately recorded below.

## Source release preparation — 30 October 2026

The owner authorised check-in and push of the BLD8 UI changes after the protected
08:00–17:00 Australia/Melbourne window. This release includes the theme lab,
shared selection/colour refinements, charts/analytics, Tree/file browsing,
grouped/windowed tables, day agenda/scheduling and the mobile Safari fixes.
The personal Jaison identity, isolated SSH and shared hooks are preserved.

The verified evidence below remains applicable: the complete 406-case regression
and 116-case pinned quality runs, followed by the final theme-only build, 18
theme cases and 12 expanded touch cases. All 40 archives include the final styles
and vector marks. Documentation changes for source publication do not change
runtime code. Remote CI and production deployment are separate checks against
the actual pushed revision; local success does not establish either result.

## Final polish and mobile Safari fixes — 30 October 2026

Closed the session with small presentation changes and the reported iPhone bugs.
Agenda cards show each start once and describe the end through aria-describedby.
Overnight booking review includes the complete end date. Recovery/footer copy is
shorter. Scheduling calculations and callback contracts are unchanged.

Touch inputs previously used 13–14px text. Shared native editable input, textarea,
numeric and multi-select fields now use max(16px, the control text token) when a
coarse pointer is available, including compact density. Desktop sizing and larger
custom fonts are retained. No maximum-scale/user-scalable restriction or script
to force the viewport scale was introduced. Colour emoji marks were replaced by
the header's vector path through the additive Icon name="mark" option in artwork,
Outline, Studio and Gather. The dotted arrow and #FFD900 palette are unchanged.

The production build/types pass (104 routes). All 406 domain/browser
cases pass (6.0m) using isolated Edge. All 116 pinned Linux checks
pass (5.5m) with snapshot updates disabled: twenty existing images,
84 normal-motion workflow cases and twelve new touch cases. They cover native
focus/blur, readable grouped/compact/numeric/multiple/textarea inputs, larger
custom text, unrestricted viewport metadata and consistent vector marks in both
themes across Chromium, Firefox and WebKit. A separate capture confirms 16px touch
search, unchanged 13px desktop compact text and the dark-on-yellow vector mark.

The complete runs preceded a final touch-only theme-editor override correction.
Its shared-link recovery input also uses 16px text, and colour editors have 44px
touch targets. After that narrow correction the final build, all 18 theme
checks (20.7s) and twelve expanded pinned touch cases (44.3s)
pass. The expanded cases now exercise blocked-clipboard recovery, readable theme
links and the colour-editor target. Fine-pointer styles/images were unaffected;
the complete regression and image suites were not repeated for this last rule.

Four agenda images were refreshed and individually reviewed for the final wording;
all sixteen other references retain their bytes. Hash/export proof and mobile
captures are under .local. All forty freshly generated starters pass CRC, safe
path, licence and module checks, including compiled/source touch styles and marks.
Earlier clean Next.js/Vite consumer installations remain recorded below; their
dependency graph was not reinstalled for these presentation fixes.

Evidence: .local/mobile-final-build.log, mobile-regression.log, mobile-quality.log,
mobile-final-themes.log, mobile-final-touch.log,
mobile-archive-audit.json, mobile-capture-proof.json and close-quality-proof.json.
The initial host regression attempt was stopped because the default bundled
Chromium revision was unavailable; the successful complete run explicitly used
the installed Edge channel and a temporary profile. No browser settings changed.

These checks do not emulate an iPhone's native keyboard or certify that actual
device's focus zoom. The reporting phone must be rechecked after publication.
Physical assistive-technology review remains separate from automated axe checks.
The local preview is restored on port 3120; docs/handoff.md records the next slice.
No commit, push, deployment, npm publication or follow-up was scheduled. The live
domain still serves the previous release.

## Embedded mobile fix and day agenda - 30 October 2026

Fixed the reported large-issue Mobile preview on a wide browser. Its toolbar,
actions and summaries now respond to the panel's named size container rather
than the browser viewport. Container-based padding and heading sizing keep the
narrow preview coherent. Body-portalled dialog layout retains viewport rules.
No overflow clipping is used to conceal controls. Three embedded-preview cases
and stronger real-phone geometry assertions guard the failure. All 15 preceding
block previews were audited at 390px inside a desktop viewport; no other visible
controls escaped their frame. The new planner is checked in both contexts too.

Continued with increment 6a: DayAgenda and SchedulePlanner. Availability windows
and appointments use supplied UTC instants. A pure model validates/clones source,
projects calendar days, samples elapsed-time starts and checks bounds, revisions
and overlaps. Explicit offsets distinguish repeated hours; historical second
offsets and exact half-open day boundaries are covered. The date-free TimePicker
is unchanged and no wall-clock-to-UTC resolver is invented.

SchedulePlanner adds date/zone/duration controls, a retained booking draft,
appointment details and abortable source/write callbacks. Retry preserves its
request identity; replaced/cancelled completions cannot overwrite current state.
Custom cancellation requires reload and returns focus to the heading when its
origin becomes disabled. Rejected writes say success could not be confirmed.
Overnight options show the following date, and appointments remain visible on
both overlapping days. Shared easing carries hover/selection and a small day fade;
reduced motion removes decorative animation. #FFD900 remains unchanged.

The host owns authentication, idempotency and atomic revision/overlap writes.
Maximum source is 200 availability windows / 500 appointments; intervals last
at most 24 hours. Source instants have whole-minute precision and bookings use
15–120 elapsed minutes, in 15-minute steps. Default fixtures and edits live in
this page; Reload restores the sample. This is not a live booking service.
Recurrence, resources, calendar sync and the comment composer remain separate.
See scheduling.md and /integrations/scheduling.

Validation:

- Final production build/types pass: 104 routes, 53 guidance entries, 16 blocks,
  3 templates, 147 registry items and 40 starters (21 Next.js / 19 Vite).
- All 406 domain/browser cases pass in the complete production run. The focused
  source runs passed 14 pure scheduling cases, 13 workflow cases and 13 issue
  cases; the later overnight case is included in the full run. New coverage
  includes New York/Melbourne gaps/repeats, historical offsets, source limits,
  UTC identity, retained drafts, cancellation reconciliation/focus, source
  recovery, fields aligned on a baseline, live reduced motion and phone axe.
- The pinned Linux runner passed 20 intentional image updates, then all 104
  ordinary comparisons/workflow checks with updating disabled (3.4 minutes).
  All 16 earlier images are byte-identical with unchanged dimensions. Four
  agenda references are new: 1200×968 desktop and 318×1523 phone in both themes.
  Reviewed all four; final copies match candidate and container-export hashes.
  No masks, thresholds or screenshot policy were relaxed. Chromium, Firefox
  and WebKit also exercise the original embedded Mobile regression.
- Real shadcn 4.21.4 installs pass independently in Next.js and Vite: 59-item
  graph, types/builds, server-side pure helpers and light/dark interactions.
  New checks book an appointment, inspect its normalized UTC instants and
  retain existing theme, portal, file, chart and table checks. Temporary apps
  are removed; generated registry bytes stay unchanged during the run.
- The downloadable SchedulePlanner Vite starter independently installs/builds.
  All 40 final archives pass CRC, safe-path, licence and new-module checks.
  Existing visible Vite fixture directive/chunk warnings are not suppressed.
- Reviewed desktop, embedded 390px and actual phone-width planner captures:
  zero page/frame overflow and no uncaught errors. Final whitespace check passes.
  Automated checks do not replace manual assistive-technology review.

Evidence is ignored under .local: mobile-preview-all.log,
embedded-mobile-audit.json, schedule-state.log, schedule-planner-focused.log,
schedule-build-final.log, schedule-regression.log, schedule-consumers.log,
schedule-quality.log, schedule-vite.log and schedule-archive-audit.json.
The accepted Linux export is .local/quality-linux/
76d1adf8-0ef8-4f5e-a887-4b560a2f3900/ with final PNG hash proof in
.local/schedule-quality-review/. Captures are recorded in schedule-review.json.

The local preview is restored on http://127.0.0.1:3120. No commit, push,
deployment, package publication or change to the fixed roadmap allocation was
performed. The next ordered slice is the comment composer and sanitisation
boundary review.

## Grouped tables and large issue workspace - 30 October 2026

DataTable now has optional supplied-record grouping and guarded collapse during
an inline edit. Its ungrouped defaults and paged service protocol remain intact.
WindowedTable is a separate native table over complete bounded records, sharing
Column<T>, selection keys and grouping helpers. It supports fixed single-line
rows, logical keyboard navigation, a retained focus target and explicit external
sorting. LargeIssueTable composes Scroll/Pages over 10,000 illustrative issues,
with shared selection, selected CSV export and a parent-owned detail draft.
See large-tables.md and /integrations/large-tables for limits and callback scope.

The host still owns authentication, authorisation, persistence and atomic
revision checks. No production issue API, variable-height windowing, infinite
loading or inline editor inside a windowed row is supplied. Maximum complete
data is 20,000 records / 40,000 flattened entries. Ordinary pages remain the
sequential-reading alternative. This does not change Workbench or the roadmap.

Interaction fixes include revealing repaired focus after a host filter, retaining
the detail draft on rejected saves, ignoring cancelled/stale results, and moving
focus to the workspace heading when a save removes its trigger. Collapsing a
group containing an active EditableCell retains and focuses that draft. The
showcase's project-name demo now exercises save, validation and cancellation.
Native scrolling stays immediate; shared easing handles hover, disclosures and
the view indicator. Reduced motion removes decorative travel. The approved
accent remains exactly #FFD900; geometry and inset choice styling are preserved.

Validation:

- Final production build and TypeScript pass: 101 routes, 52 guidance entries,
  15 blocks, 3 templates, 141 registry items and 38 starters (20 Next.js,18 Vite).
- All 375 domain/browser cases pass in the final complete run. The earlier run
  found one collection-label contrast cascade in both themes and three outdated
  hardcoded palette expectations. The cascade is corrected; the assertions now
  resolve semantic tokens while retaining motion and geometry checks.
- Representative 10,000/20,000-record views mount at most 24 model rows in the
  checked viewport, including a retained focus row. Rows keep exact 52px/56px
  geometry and share header edges. The default issue specimen measured 13
  mounted entries and a 560,268px extent (10,004 logical entries plus header),
  with no page overflow or browser errors. This is structural evidence, not a
  universal frame-rate or hardware performance claim.
- Full-group selection/export covers all 2,500 supplied In review issues;
  filtering and Scroll/Pages preserve selected IDs. Tests cover keyboard
  endpoints, focus repair/retention, collapse, failed-save retry, cancellation,
  malformed/empty/loading sources and phone light/dark axe checks.
- The pinned Linux runner passes 16 intentional image updates, followed by all
  88 comparisons/normal-motion workflow checks with updates disabled. Chromium,
  Firefox and WebKit cover both themes and viewport sizes. Eight palette images
  changed, four table references are new and four session images are byte-identical.
  Existing image dimensions, thresholds and masks are unchanged. All candidates
  were reviewed; copied hashes match the successful container export.
- Actual shadcn 4.21.4 installation passes in independent Next.js and Vite apps:
  53-item graph, custom alias, styles/licences, builds, pure Server Component
  helper evaluation and light/dark keyboard/group/selection/detail editing.
  Consumers are removed and generated registry bytes stayed unchanged during
  the check. This preceded a text-only footer simplification; the final build,
  archive audit and complete regression run cover that final wording.
- The large issue Vite archive independently installs and builds. All 38 final
  archives pass CRC, safe-path, licence and final-table-module checks. The
  consumer fixture retains its existing visible Vite directive/chunk warnings.
- Reviewed final 1440px/390px issue views in both themes with no page overflow
  or uncaught errors. Final whitespace checks pass. Manual assistive-technology
  review remains separate; automated scans do not certify accessibility.

Evidence is ignored under .local: large-tables-build-final.log,
large-tables-regression-final.log, large-tables-consumers.log,
large-tables-quality.log, large-tables-archive-audit.json and
large-tables-final-review.json. The accepted Linux export is
.local/quality-linux/bf438bc5-d12d-4a5e-bb78-64c1063c3eb7/; PNG review and
hash proof are in .local/large-tables-quality-review/. The interrupted earlier
quality run is retained separately and is not acceptance evidence.

The local preview is http://127.0.0.1:3120. No commit, push, deployment or npm
publication was performed. The next ordered increment remains scheduling and
a narrow comment composer; source release requires separate authorisation.

## Yellow restoration and supporting palette - 30 October 2026

Current local direction: user-selected yellow #ffd900 (confirmed 30 October
2026), dark primary actions, white panels and the original warm-grey
canvas. Champagne selection and focus complement the accent. Evergreen and
mint data shades provide supporting colour; forest success and brick errors
retain separate semantic meaning. Existing geometry, inset depth, easing,
keyboard targets and reduced-motion behaviour remain unchanged. The iris
trial below is historical and is no longer the default.

Historical supporting-palette validation at the interim #f2d32e value (before
the final one-token #FFD900 choice):

- All 27 focused cases passed against the live source preview: theme contracts,
  readable text/status/chart colours, CSS export parity, theme customisation,
  keyboard selection, forced colours, choice/slider motion and the composed
  Interface study. The checked-thumb assertion now follows accent foreground.
- Pure proof covers 228 configurations in both modes (456 combinations and
  15,048 assertions). Shared text contrast remains at least 4.5004:1; chart
  contrast on panels/surfaces remains at least 3.2000:1. Static/generated CSS
  matches for 103 non-font tokens per mode, retaining the two font exceptions.
- Reviewed desktop and 390px phone views in light/dark plus the bar chart.
  No page overflow or uncaught browser errors in those captures. Evidence is
  ignored under .local/yellow-review and .local/yellow-token-proof.json.
- The local source watchers compile the UI and blocks with no errors. Git
  whitespace checking passes with CRLF treated as line endings.

The live preview remains on http://127.0.0.1:3120. At that palette-only checkpoint, a fresh production build and
the full pinned visual suite had not been rerun; the
existing production-build evidence below belongs to its recorded version.
Review/update pinned colour references before the next authorised release.
No commit, push, deployment or package publication was performed.

## Shared iris theme trial - 29 October 2026

Historical trial, superseded by the yellow restoration above. It used iris actions with related pale surfaces for hover,
selection and supporting feedback. Charts use six related shades from the same
theme family. White/light-grey panels and canvas stay neutral; success, warning
and error retain their semantic pairs. Presets and custom accents derive matching
info, progress and chart colours. Factory actions use solid fills to preserve
foreground contrast; existing inset choices, geometry and easing remain.

Generic icon backgrounds and catalogue labels are neutral again. Chart examples
use the original primary/accent/muted tone roles. The Theme lab preview now has
an Interface study tab combining fields, choices, actions, a chart and selectable
project table. Preview data and changes remain local to that frame.

Validation:

- Final production build and TypeScript passed: 98 routes, 51 component guidance
  entries, 14 blocks, 3 templates, 135 registry items and 36 ZIP starters.
- The focused 45-case selection/theme/motion set covered all cases successfully
  across the initial run and bounded correction run. Initial run: 43 passed;
  two stale test assumptions were corrected (old action sheen and an out-of-scope
  palette variable). Both corrected cases passed separately without application
  changes. Includes light/dark automated accessibility scans for all presets,
  keyboard/focus, forced colours, reduced motion, custom exports and phone layouts.
- Pure checks covered 228 configurations in both modes (456 combinations,
  15,048 assertions). Minimum shared text/focus contrast was 4.50016:1; chart
  contrast on panels/surfaces was 3.20014:1. Default static/generated values match
  for 103 non-font tokens per mode; the existing portable-font exceptions remain.
- Legend tint review covered 2,736 series/theme/mode paints. The final 3% normal
  and 5% hover fills keep graphical contrast above 3:1. Existing 9%/14% fills were
  reduced after this check.
- Reviewed integrated desktop/390px phone captures in light/dark, plus the bar
  chart. No page overflow or uncaught browser errors. Evidence is ignored under
  .local/iris-review; pure proof is .local/iris-token-proof.json.
- Git whitespace check passed with Windows CRLF treated as line endings.

This is an unpublished local trial. The pinned screenshot references remain at
the previously reviewed palette; this entry does not claim an updated full Linux
visual run. Review/update those references before the next authorised release.
No commit, push, deployment or package publication was performed.


## Bounded charts and analytics - 29 October 2026

Added Chart with categorical line/bar/area views, signed values, explicit null
gaps, six series patterns, keyboard/pointer exploration and an exact data table.
Pure validation, domains, geometry and summaries also have a server-safe package
subpath. API guidance, installation and the preview ship with the component.

AnalyticsDashboard composes period selection, three derived metrics, chart views,
abortable reports, guarded retry focus and formula-safe CSV export. Default data
is deterministic and illustrative. Loader/request identity rejects cancelled or
stale results; reports are cloned and checked before display or export. The host
owns collection, date boundaries, permissions and persistence.

Manual review corrected grouped-bar marker positions and crowded narrow labels.
The chart keeps full labels and values in the keyboard/data paths. Loading now
retains the natural report base height, excluding an expanded table; responsive
initial floors and consistent KPI value/copy reserves keep the toolbar steady.
Shared easing, immediate inert exits and live reduced motion remain in place.

Validation:
- Production build passed with 98 routes, 51 guidance entries, fourteen blocks,
  three templates, 135 registry items and 36 ZIPs (19 Next.js, 17 Vite).
  Final workspace and strict quality-test types passed. No runtime dependency or
  lockfile change was introduced.
- The final complete Edge run passed all 333 cases in 6.7 minutes with the CI
  worker count and no retries/skips. The focused 29 chart/report cases passed
  separately in 35.6 seconds. These cover geometry, keyboard/focus, nulls, finite
  extremes, safe totals, exact CSV, recovery, cancellation, mobile containment,
  both-theme axe, axis-label spacing and report/table loading geometry.
- Earlier long five-page accessibility sweeps exhausted their combined 30-second
  budget without a reported violation. They are now ten page/theme cases with
  identical URLs, tags and assertions, unchanged timeouts and no retries. A menu
  test now opens by keyboard and waits for popup focus before End. Initial traces
  remain in ignored .local/charts-axe-timeout-evidence/ and
  .local/charts-menu-focus-timeout-evidence/; the complete final run is green.
- The pinned Linux runner passed clean install, strict quality types, a fresh
  build, twelve explicit changed-only image update checks and all 72 ordinary
  image/browser checks in 3.4 minutes, without retries or skips. Ordinary image
  comparison had updates disabled. Chromium, Firefox and WebKit cover both themes
  and desktop/phone sizes. Four new Chart references were reviewed; the eight
  preceding image hashes are unchanged, with no mask/tolerance widening.
  Reports: .local/quality-linux/d7a5e8ee-d8f7-4097-91b1-587458838730/.
- Actual shadcn 4.21.4 installed the 46-item graph into clean Next.js 16.3.8 and
  Vite 8.3.4 consumers. Both built independently. Four light/dark contexts checked
  exported themes, real control geometry, focus, body portals, lazy files and
  analytics/chart exploration. Next prerender evaluated installed pure chart and
  report helpers. Native package server subpaths were checked separately too.
  Temporary consumers were removed; producer registry bytes stayed unchanged.
- The extracted analytics Vite ZIP independently installed and built. Its entry
  is 574.03 kB minified / 187.64 kB gzip; the normal large-chunk and client-directive
  warnings remain visible. This increment claims no bundle-size improvement.
  The exact owned temporary starter was verified and removed.
- All 36 ZIPs passed CRC, safe paths, licence retention, runtime/environment
  exclusion and exact shared-style checks. All 135 registry dependencies resolve
  through the expected production URL graph. Actionlint, all sixteen release
  aggregate combinations and diff whitespace passed.
- The representative 366-observation/six-series case exposed all 2,196 values,
  366 keyboard point buttons and 366 exact table rows. Its chart contained
  3448 DOM elements; the local load/explore/table sequence measured
  1339 ms in that final run. This is a local observation, not a universal
  frame-rate or large-data performance guarantee.
- Desktop/tablet/phone captures were reviewed at 1440/768/390/320 in both themes.
  Final eight-capture review on the editing preview confirms marker alignment,
  contained nonoverlapping phone labels, zero page errors and no horizontal
  overflow. Ready/loading report heights are 704/704px at 320 and 640/640px at390;
  toolbar movement is zero. See .local/charts-review/final/review.json.

Primary logs: .local/charts-final-build.log, charts-final-types.log,
charts-final-quality-types.log, charts-complete.log, charts-quality.log,
charts-consumers.log, charts-vite.log and charts-final-review.log. The local
editing preview is restored on port 3120 with type/style watchers. Isolated test
servers and the quality container are stopped; temporary installers are removed.

No commit, push, deployment or npm publication was performed. Public installation
still serves the preceding release. Table virtualisation/grouping remains a
separate next increment. Automated evidence does not establish manual assistive-
technology or real-device certification. See charts-and-analytics.md.

## File browser interaction polish - 29 October 2026

Focused folder buttons, breadcrumbs and Up now hand focus to the persistent
folder heading. Load/Retry folder use the same destination; clearing a search
returns to its input. Tree selection and sorting retain their own focus. A
one-shot source-scoped intent prevents async completion or replacement data from
taking focus. The showcase also preserves a focused workspace retry across its
keyed remount; application hosts own that boundary in their own integrations.

Results, loading and recovery states enter with a short eased opacity/position
transition. Replaced interactive content is removed immediately. The heading
and toolbar remain steady, with an understated underline for heading focus.
Reduced motion removes travel. Failed folder counts now read Unavailable rather
than suggesting that the failed folder contains zero items. Public APIs and
runtime dependencies are unchanged.

Validation:
- Production build passed after the showcase retry fix and guide updates.
  Workspace and strict quality-test types passed. Catalogue counts remain
  95 routes, 50 guidance entries, thirteen blocks, three templates, 129 registry
  items and 34 starters. The final heading underline is a CSS-only refinement
  reviewed in the live editing preview after that build.
- All 26 focused Edge cases passed in 27.6 seconds: eight new focus cases plus
  the existing Tree/file-browser and selection-style cases. Coverage includes
  normal/reduced motion, folder and workspace recovery, no async focus stealing,
  heading geometry, narrow layouts, both-theme axe and forced-colour selection.
  Logs: .local/file-browser-polish-final-tests.log and .local/file-browser-polish-final-build.log.
- The pinned Linux runner passed clean install, strict quality types, a fresh
  production build and all 56 ordinary visual/browser cases in 2.5 minutes,
  with no retries, skips or baseline updates. The expanded Tree/FileBrowser case
  checks navigation/search focus under normal motion in Chromium, Firefox and
  WebKit, both themes and desktop/phone viewports. Reports are retained under
  .local/quality-linux/7c51fb43-2f52-4743-84c9-bc8076887a5c/.
  That source snapshot preceded the final showcase-only remount handoff; the
  final host build and eight focus cases separately verify that adjustment.
- All 34 regenerated starter archives passed CRC, path, licence, excluded-runtime
  and exact shared-style checks. All registry dependencies resolve locally through
  the expected production URL graph. No lockfile change was made.
- Settled desktop 1440px and phone 390px captures were reviewed in both themes
  with normal motion. Navigation/search/workspace-retry handoffs worked, with no
  page errors or horizontal overflow. The local editing preview is restored on
  port 3120 with type/style watchers; isolated test servers are stopped.

No commit, push, deployment or package publication was performed. Manual
assistive-technology and real-device review remain outside these automated
checks. Earlier full-suite and install-consumer evidence is retained below;
this focused pass is not a new run of that complete regression suite.

## Tree, file browser and shared selection - 29 October 2026

Added a single-selection Tree with roving focus, keyboard/typeahead traversal,
controlled expansion, disabled subtrees, lazy-load requests and focus repair.
Presence groups ease their height/opacity, become inert immediately on exit,
and react to live reduced-motion changes. Public types, API tables, registry
source and the component demo ship together.

FileBrowser composes the Tree with folder breadcrumbs, search/sort, aligned file
metadata and a details inspector. Its default entries and abortable Archive
loader are illustrative. External loaders receive AbortSignal; source/request
identity guards ignore cancelled or stale results, successful child data is
cached, and per-folder failures retain other data and provide retry. Complete
merged data is validated for unique IDs, structure and bounded depth/size before
applying. No filesystem access, file contents or storage service is supplied.

At the user's request, selection styling now uses a shared neutral backplate,
readable foreground and soft inset definition. Tree/sidebar markers are short,
rounded and inset from the edge. Menus, tabs, tables, moving view indicators,
catalogue navigation and scoped preview controls follow the same treatment.
Focus remains distinct, destructive actions retain their error colours, and
forced-colour selection uses system colours. Yellow accent actions, Boolean-on
fills, date endpoints and the existing smooth motion remain. Five shared tokens
also appear in exported themes; contrast reporting now covers nine text pairs.

Validation:
- Production build passed with 95 routes, 50 guidance entries, thirteen blocks,
  three templates, 129 registry items and 34 starters (18 Next.js, 16 Vite).
  Workspace and strict quality types passed. No runtime dependency/lockfile change.
- The final complete Edge run passed all 288 cases. The 29 Tree/file-browser cases
  and three selection-style cases cover keyboard focus vs selection, collapse and
  removal repair, async cancellation/retry/invalid data, mobile containment,
  aligned metadata, both-theme axe, flat custom themes, forced colours and stable
  selected geometry. Earlier test-only corrections handle transparent RGBA in
  forced colours and wait for actual portal focus before keyboard traversal.
- Real shadcn 4.21.4 installed the 40-item graph into clean Next.js 16.3.8 and Vite
  8.3.4 consumers. Both built independently and passed four fresh light/dark style,
  focus, portal and lazy file-inspection contexts using exported custom CSS.
  Production registry bytes were unchanged and temporary consumers were removed.
- The independently extracted file-browser Vite archive installed and built.
  Its entry is about 572 kB minified / 187 kB gzip and retains the visible large-
  chunk warning; this increment makes no bundle-size improvement claim.
- All 34 archives passed CRC, path, licence, environment/runtime exclusion and
  exact shared-style checks. All registry dependencies resolve through production
  URLs. Existing third-party notices are retained. Actionlint, all sixteen release
  aggregate result combinations and diff whitespace passed.
- Desktop, tablet, phone 390/320 and dark file/Tree captures were reviewed without
  page errors or document overflow. Tree, file and integration guides document
  the host/data boundary and local publication status.

The final pinned Linux run passed clean install, strict quality types and a fresh
production build, followed by eight explicit changed-only visual update checks
and all 56 ordinary checks in 1.9 minutes without retries or skips. Only the four
control references changed; all four session references remain byte-identical.
Canvas dimensions are unchanged. The phone reference includes a deterministic
paint-phase correction from fractional locator cropping; fixed integer clips
and an uncounted warmup produced twelve byte-identical probe captures, with
strict before/after CSS-box equality. Pixel tolerances and masks were not widened.
The ordinary comparison ran with updates disabled. Final reports are retained in
.local/quality-linux/a6b648de-631b-4a0f-9625-3678aacb331b/ and the final status
file is zero. Dedicated test containers and temporary consumers were removed.
See visual-quality.md for the exact bounds and capture policy.

The local editing preview on port 3120 was checked for neutral Tree selection,
the updated foundations copy, working FileBrowser and nine contrast pairs in a
3-by-3 desktop grid or a two-column phone grid with the final row spanning both
columns. The browser review found no page errors. The copy and final grid rule
were manually checked after the 288-case suite and included in the final Linux
production build. Temporary production/test previews are stopped.
No source commit, push, deployment or npm publication was performed. The public
registry remains the preceding release. Source and CI changes require an
authorised release; the configured Vercel gate still needs its first observed
hold/promotion cycle. Automated checks do not establish manual assistive-
technology, physical-device or real Safari coverage. See file-browser.md and
selection-style.md for the current public contracts.

## Theme lab and portable themes - 29 October 2026

Added /themes with BLD8, Cobalt and Sage presets; accent and primary colours;
typography, radius, density and shadows; isolated light/dark and phone previews;
contrast reporting; shareable history-aware URLs; CSS copy/download and manual
recovery. The real preview includes menus, choices, a project dialog and local
actions. It acknowledges applied settings and validates message origin/source.
Its noindex /themes/preview document themes html so body portals inherit tokens
without recolouring the editor or site. Settings are URL state, not local storage.

The pure theme-config subpath normalises/validates versioned settings and exports
complete tokens and ordinary CSS for both modes. Next server components and Vite
can use it without the lab. Named fonts require host loading; system fallbacks
are included. Custom action fills and dark accent surfaces derive readable text,
including hover states. Seven unrounded contrast pairs use the 4.5:1 threshold.
The matching shared stylesheet consumes density/radius tokens while preserving
factory visuals. Fine-pointer compact controls align at 40px, and coarse-pointer
field/action/choice rows keep their larger target treatment.

Validation:
- Final production build passed: 92 routes, 49 guidance entries, twelve blocks,
  three templates, 123 registry items and 32 starters. All workspace types and
  strict quality types passed. No runtime dependency or lockfile change.
- The earlier full 254-case Edge run passed 253 cases; the sole failure was an
  old outside-click test whose paragraph was now covered by the expanded tablet
  menu. The test now clicks exposed space outside the header and checks three
  phone/tablet widths. On final source all 32 affected model/theme/navigation
  cases passed, including all three presets in both-theme automated axe scans,
  URL history and hostile input, exact density, scoped portals, export files and
  failure recovery, missed early-ready messages, live reduced motion and coarse
  pointer targets. The current full suite contains 256 cases; it was not rerun
  as one combined run after the targeted correction.
- A fresh isolated pinned Linux runner passed clean npm ci, quality types, a
  production build and all 44 quality cases without retries/skips. All eight
  original screenshot baselines matched unchanged. The 36 normal-motion cases
  exercise Chromium, Firefox and WebKit in both themes and viewport sizes,
  including theme scope, keyboard dialog actions, CSS download and URL reload.
- Final real shadcn 4.21.4 installations into clean Next.js 16.3.8 and Vite 8.3.4
  consumers passed independently. Each installed the 35-item graph/42 files.
  Next prerender evaluated the pure helpers, Vite used its custom UI alias, and
  four fresh light/dark contexts checked actual 40px heights, fills, radius,
  system fonts, flat shadows, focus and body-portalled dialogs. Production
  registry bytes were unchanged; temporary apps/servers were removed.
- All 32 ZIPs passed CRC, safe-path, licence, runtime/environment exclusion and
  final-style checks. Each includes the exact theme helper source, compiled JS,
  declarations and public subpath export. All 123 registry dependencies resolve
  through production URLs. Existing third-party notices remain intact.
- Reviewed desktop/default, dark Cobalt, phone 320/390 and dialog captures.
  Mobile labels and project metadata remain contained. Actual header measurements
  at 1040/1041/1080/1120/1121/1200/1440 show no overlap or horizontal overflow.
- The final workflow passes actionlint 1.7.12; all sixteen aggregate dependency
  result combinations reject anything except both-success. Diff whitespace passes.

The final Linux report is in local ignored quality diagnostics under run
bbf97203-fcdc-4190-a7b6-35ff4e7684bb. Final targeted and consumer logs are
.local/theme-lab-final-validation.log and .local/registry-consumers-final-check.log.
No source commit, push, deployment or npm publication was performed. The live
registry remains the preceding 121-item release; the configured Vercel gate still
needs its first observed hold/promotion cycle. WebKit does not establish real
Safari/device coverage or manual assistive-technology certification. See
[theme integration](theme-lab.md) for font, host and stylesheet requirements.

## Release and browser quality - 29 October 2026

Prepared a split CI workflow with core validation, pinned browser quality and a
final aggregate retaining the UI PR checks / UI Release checks names. Core
validation now installs the actual registry into clean Next.js and Vite apps in
addition to building the four existing Vite archives. The aggregate can succeed
only when both dependency jobs succeed; failed, cancelled and skipped results
are rejected. The ordinary source commit/push guards remain active.

The personal Vercel project's production gate was created and read back: GitHub
UI Release checks is required after build-ready and blocks production-domain
aliasing, with a 3,600-second timeout. Automatic aliasing remains enabled. No
existing unrelated check or project setting was changed. The current public
site still returns HTTP 200. This verifies configuration, not an observed future
deployment hold/failure/promotion cycle; that remains a next-release check.

New quality coverage includes eight reviewed Linux Chromium baselines for shared
controls and SessionSetup preferences, light/dark at 1440 and 390 px. Twenty-four
normal-motion cases cover keyboard choices, interrupted dialog entry, focus
restoration, canonical numeric/time values and restored drafts across Chromium,
Firefox and WebKit. Fixed Date, locale, timezone and bundled fonts stabilise the
images; real month navigation refreshes the calendar's prerendered today marker.
Missing or changed baselines fail normal runs; CI never approves replacements.

Validation:
- All 32 new quality cases passed without retries in the pinned Linux image.
- An intentional spacing regression in the disposable copy failed comparison:
  179,850 pixels differed and the control region height changed. The style was
  restored and ordinary comparisons passed. Authoritative application source
  and shared styles were not changed for that probe.
- The documented Docker runner passed from a fresh isolated container: allowlisted
  source copy, checksum-verified Node 22.22.0, npm ci, strict quality types, a new
  production build and all 32 ordinary comparisons. Host dependencies/generated
  output were excluded. Eight baselines were visually reviewed.
- Actual shadcn 4.21.4 installs and independent builds passed on both Windows and
  Linux for Next.js 16.3.8 and Vite 8.3.4. Each fetched the 33-item SessionSetup
  graph and created 41 source/style/notice files. Next prerender evaluated pure
  server helpers; Vite used the custom ~/ui alias. Temporary consumers were
  removed and production registry bytes preserved. Expected Vite directive and
  bundle-size warnings remain visible; this slice does not claim smaller bundles.
- Quality test/configuration types passed. Checksum-verified actionlint 1.7.12
  passed the workflow. All 16 aggregate success/failure/cancelled/skipped
  combinations were checked; only both-success passed. Diff whitespace passed.

The existing 227-case Chromium interaction suite remains intact and last passed
for the preceding source release. It was not repeated for these test/docs/CI-only
changes; the new workflow still requires it on every future release. No new
runtime dependency or package-lock change was introduced. Scope/registry notes
now describe the current 49 guidance entries, twelve blocks and 32 starters.

WebKit engine coverage is not real macOS/iOS Safari or physical-device review.
Manual assistive-technology testing, broader visual coverage and the real
promotion-cycle observation remain open. No new source commit, push, deployment
or npm publication was performed. The CI expansion remains local until an
authorised source release; the Vercel gate configuration is already active.

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

The final local editing preview was restored on port 3120. Both theme routes
return HTTP 200; the development browser confirms a live dark Cobalt frame, seven
contrast rows, an unchanged yellow parent theme and no page errors. UI, block and
style watchers are active. Temporary test/consumer/quality servers are stopped.


## Table layouts and documentation discovery - 10 November 2026

Current local development: 160 registry items, 72 generated guidance entries and
10 public guides. Production build, all workspace types and production npm audit
pass (zero audit findings after updating Next.js/new starters to 16.4.6). Retained
0.2.0 bytes and release metadata are unchanged.

- Complete regression: 550 passed, .local/table-docs-final-regression.log.
- Final affected regression after menu-to-modal handoff: 71 passed,
  .local/table-docs-final-affected.log. Includes lean dependencies, Issue layouts,
  legacy links, touch/pointer/keyboard ordering, retry, focus, API docs and MCP.
- Pinned Linux full quality: 212 passed, .local/table-docs-quality-linux.log;
  no approved screenshot changes.
- Final normal-motion ordering matrix: 12 passed,
  .local/table-docs-ordering-quality.log. Chromium/Firefox/WebKit in both themes
  and desktop/phone widths verify the corrected menu closure and focus target.
- Real shadcn CLI clean Next.js/Vite installs, 74-item graph, independent builds,
  pure helper evaluation and both-theme workflows pass in
  .local/table-docs-final-consumers.log. These precede the final menu-only change;
  final production types/build and focused browser runs cover that change.
- Six manual-review browser captures had no page errors; generated catalog, all
  72 Markdown entries and 10 guides match source/TypeScript/registry authority.

The optional MCP process is local/read-only, private/unpublished on npm and not
registered in an editor or hosted. No commits, pushes or deployments were made.
See handoff.md for remaining physical-device and release boundaries.

The final development preview review also removed whitespace text between table
cells to avoid a React development hydration warning. UI types and all 12 table
ordering cases pass against the restored live preview, including an explicit
valid-row DOM assertion. Fresh native UI interactions, six settled captures and
console/page-error collection report no errors. Test screenshots wait for
hydration and modal transitions before mutating caret styles or reading themes.

## Coordinated Data Workspace acceptance — 10 November 2026

- Production builds pass in .local/data-workspace-settled-build.log. All
  workspace and quality TypeScript checks pass in
  .local/data-workspace-acceptance-types.log; git diff --check is clean.
- The 659-case broad sweep has 657 passes in
  .local/data-workspace-regression.log. Its two failures were resolved: preserve
  insertion order when no Issue sort is active, and await the initial selected
  label before the deliberately superseded-query test starts typing. Trace
  analysis showed the latter had searched Maya ChenMaya before reaching its
  intended deferred Maya request. Stale-response assertions remain unchanged.
- All 92 affected checks pass in .local/data-workspace-final-tests.log,
  including both corrected cases, saved multi-sort views, keyboard/pointer range
  selection, invalid paste, draft history, conflicts, stale-source writes,
  timeout/abort zero-commit checks, real HTTP sessions, file-byte acknowledgement,
  source manifests, human docs and MCP discovery.
- The final confirmed-row paint change passes ten further workspace/HTTP tests
  in .local/data-workspace-settled-tests.log. A gated post-save GET proves new
  values remain visible while the refresh is pending. No visual baseline changed.
- Actual shadcn 4.21.4 installs into clean Next.js and custom-alias Vite apps build
  the 102-item graph and pass both-theme workflows in
  .local/data-workspace-registry-consumers.log. Lean sign-in graphs remain lean.
- Both persistent HTTP ZIPs independently install/build, save two records in the
  browser, reload, survive an actual server restart, replay the saved receipt and
  reject an entire two-row stale batch without partial writes. Both phone themes
  remain contained with no browser errors. See
  .local/data-workspace-starters-acceptance.log and its four phone captures.
  These adoption checks precede the final internal confirmed-row paint change;
  its final production build and targeted browser tests pass separately.
- The original 284-case pinned Linux matrix has 280 passes and four failures in
  .local/data-workspace-linux-quality.log: three rapid-range focus races and one
  WebKit same-origin navigation-prefetch cancellation. Synchronous DOM focus
  fixes the range race independently of animation frames. The fresh 18-case
  affected matrix passes in .local/data-workspace-linux-affected.log, including
  the unchanged WebKit touch test; no error filtering was added. All 20 approved
  visuals pass unchanged. The later Shift-click pointer guard passes Edge tests.
- The final prepared source manifest is 0.3.0/unreleased, snapshot
  bb561bcca01f089c1faf79e633d2a14a255fdf53d577c2d69c1cdbff29c67d60,
  with 195 registry items and 47 ZIPs. Development watching may regenerate the
  mutable snapshot. Retained 0.2.0 and Git/release state are unchanged.

The local disk reference needs one persistent Node server. Hosted authentication,
database transactions and durable attachments remain host responsibilities;
acknowledged sample bytes are discarded. Desktop WebKit does not replace a
physical iPhone keyboard review. No commit, push or deployment was performed.

## Neutral grid selection — 10 November 2026

The browser text highlight is replaced by pointer-driven cell ranges: a quiet
neutral fill, one 1px perimeter and a single corner marker. Read-only display
cells do not initiate native text selection. Native editor selection, keyboard
ranges, Shift-click, copy/paste and touch scrolling are preserved.

- Production build passes: .local/grid-selection-build.log.
- Workspace and quality types pass: .local/grid-selection-types.log.
- All 25 focused grid/workspace/real-HTTP regressions pass:
  .local/grid-selection-tests.log. Real mouse dragging selects six cells without
  native highlights, only perimeter edges are outlined, clipboard values remain
  canonical, and native editor double-click/select-all retains the draft.
- All 18 new pinned browser checks pass across Chromium/Firefox/WebKit,
  desktop/phone widths and both themes: .local/grid-selection-linux.log. Normal
  motion, live reduced motion, touch default behaviour and 16px editor text are
  checked. No approved visual baselines were changed.
- Light and dark captures .local/grid-selection-light.png and
  .local/grid-selection-dark.png were visually reviewed.

No public API/dependency changes, release changes, commits, pushes or deployments.
Existing source/ZIP/agent documentation generation includes the update. Physical
iPhone keyboard review remains separate from these emulated browser checks.

## Inline editor and grid polish — 10 November 2026

The inline editor no longer stacks an input shadow and global focus ring inside
the cell perimeter. Its background, typography and baseline follow the display
cell, and native text selection uses a neutral highlight. The outer cell boundary
remains visible for editing; global focus styles elsewhere are unchanged.
Desktop rows are 52px; coarse-pointer rows remain 60px with 16px editor text.
Grid lines and headers use neutral contrast, IDs/titles have distinct hierarchy,
and workspace status dots supplement readable labels. Toolbar density and helper
copy are tighter, with full keyboard guidance retained for assistive technology.

- Production build passes: .local/grid-polish-build.log. Source/ZIP/registry and
  human/agent documentation were regenerated from their authorities.
- Workspace and quality types pass: .local/grid-polish-types.log.
- All 27 focused grid/workspace/HTTP regressions pass:
  .local/grid-polish-tests.log. New light/dark editor cases assert no inner ring,
  shadow or border, unchanged row height, aligned text and a visible 1px perimeter.
  Range copy/paste, native text selection, draft history and save recovery pass.
- All 18 affected pinned Linux browser checks pass:
  .local/grid-polish-linux.log; reports under
  .local/quality-linux/320f95ef-2e1e-4d6f-ac5b-e588318e738c.
  Chromium/Firefox/WebKit cover pointer selection at desktop/phone widths and
  coarse-pointer editing in both themes, including stable row height, native
  text selection, at least 16px text and live reduced motion.
- Light/dark editor and workspace captures were visually reviewed:
  .local/grid-polish-editor-light.png, .local/grid-polish-editor-dark.png,
  .local/grid-polish-light.png, .local/grid-polish-dark.png and
  .local/grid-polish-phone.png. The emulated phone page has no horizontal overflow.

No public API/dependency or release changes. No visual baselines were updated.
No commit, push or deployment was performed. Emulated browsers do not replace a
physical iPhone keyboard review.

## Grid choice menus and quick filtering — 10 November 2026

Select cells use compact Base UI-backed menus, including searchable labels with
canonical option IDs, collision positioning, selected checks and shared easing.
The menu keeps the cell's single boundary. Keyboard completion returns focus in
the same event turn, including the primitive's final navigation step. Closing
editors are retained for exit motion and cleared when their row disappears.
Touchend commits an unmoved tap once and suppresses the compatibility click;
pointer/touch movement cancels that intent so list scrolling cannot select.
Closing positioners stop anchor tracking. Choice lists use a shrinking flex
layout rather than feeding available-height calculations back into their parent.
MultiSelect also stops anchor tracking while closing, including in filter popups.

Quick filters reuse the shared query evaluator, validation and advanced tree:
field search, per-condition Apply, editable chips, all/any logic and clear/remove
actions. Unapplied advanced edits are protected from quick replacement. Nested
groups and negation are retained, and filtering does not discard row drafts.

- Current production build: .local/grid-dropdown-build-verified.log.
- Current workspace/quality types: .local/grid-dropdown-types-verified.log.
- The focused 51-case sweep passes: .local/grid-dropdown-tests-final.log.
  The final 15-case affected rerun also passes:
  .local/grid-dropdown-regressions-verified.log. It includes a new interrupted-exit
  case, so these scopes overlap rather than representing 66 unique tests.
- The final 30-case pinned affected matrix passes:
  .local/grid-dropdown-linux-affected.log; reports under
  .local/quality-linux/9c94f7d2-7291-41bc-b87b-b18c02cdf778.
  It covers Chromium/Firefox/WebKit desktop/phone menu and quick-filter paths,
  both coarse-pointer themes, native text selection, tap versus pan, selected
  canonical values, geometry, outside focus and live reduced motion.
- Earlier browser runs exposed touch compatibility clicks and closing-popup
  ResizeObserver feedback. Those paths were corrected rather than filtering the
  errors. Firefox measured one 52px row as 52.0000305px; comparisons now normalize
  to 1/64 CSS px. The earlier two advanced-filter test failures used a group role
  for a named section; their corrected region selectors and grouped semantics
  checks pass. No approved screenshot baseline was changed.
- Actual shadcn Next.js/Vite installs, aliases, the 104-item dependency graph,
  independent production builds and both theme checks passed:
  .local/grid-dropdown-consumers.log. Later touch/closing refinements add no
  imports or dependencies to that graph.
- Downloadable Next.js/Vite HTTP starter checks passed:
  .local/grid-dropdown-starters-final.log. Both include independent install/build,
  two-row atomic saves, reload, both phone themes, real process restart/replay
  and conflict recovery. The final touch/closing revision is separately checked
  in .local/grid-dropdown-starters-verified.log.

Public DataColumn gains optional searchable; the normal source/API/ZIP/agent
generation includes it. There are 197 registry items and 47 ZIPs; component/block/
template counts remain 59/18/3. Retained 0.2.0 is unchanged. Source remains local
and uncommitted. No push, deployment, release or npm publication was performed.
Desktop WebKit remains separate from physical iPhone keyboard verification.

Final visual review: .local/grid-dropdown-final-{light,dark}.png,
.local/grid-dropdown-search-final-{light,dark}.png,
.local/grid-filter-chips-final-{light,dark}.png,
.local/grid-filter-editor-final-{light,dark}.png and
.local/grid-filter-picker-phone-final.png. The restored local examples preview
reports no page errors in either theme; the emulated phone page fits its width.
