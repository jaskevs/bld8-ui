# Visual and browser quality checks

The focused quality suite complements the existing interaction, geometry, motion
and axe checks. It photographs five representative surfaces and exercises additional
interactions instead of photographing the entire catalogue:

- The shared control specimen: aligned actions, fields, choice controls, menus,
  dates and loading states.
- A default multi-series Chart: axes, patterns, point readout and the exact-data action.
- A day agenda: aligned date/zone/duration controls, explicit offsets and booked appointments.
- A grouped scrolling table: aligned columns, group counts and selection.
- Session setup at its preferences step: number/time fields, step navigation,
  summary and the action row.

Each has a reviewed resting image in light and dark at 1440 × 1100 and
390 × 844 CSS pixels: twenty Chromium Linux baselines in
`quality-tests/__screenshots__/`. The phone projects use a narrow viewport;
they do not claim real-device coverage. The smoke projects start with normal motion and run in Chromium, Firefox and
WebKit, in light/dark themes at both desktop and phone viewport sizes. All tests
retain the uncaught-browser-error guard.

The 26 workflows in `quality-tests/portable-smoke.spec.ts` cover native choices,
dialog dismissal and focus return, session drafts, theme isolation and downloads,
trees, analytics, table ordering/selection, scheduling, Outline recovery and
activity, playground state, nested filters, remote/hierarchical choices, calendar
and upload recovery, icon preview isolation, and editable-grid/filter workflows.
They check state and keyboard context through the real interfaces. Bulk-selection
checks also sample the actual CSS timeline at intermediate positions; the regular
selection-motion suite separately measures unpaused frames and rapid reversals.

The four flows in `quality-tests/core-controls.spec.ts` add:

- Nested menus, disabled destinations, checked/radio preferences, dismissal and
  focus restoration, including a live reduced-motion preference change.
- ToggleGroup and TagInput keyboard choices, canonical native form values,
  duplicate rejection, deliberate tag removal and native form reset.
- Rich Select, Combobox and MultiSelect options, alias search where supported,
  canonical IDs, clear actions, disabled choices and popup containment.
- Ordered RangeSlider keyboard bounds and reset, plus one-native-input OTP
  validation, selection/deletion, form ownership and reset.

Those four flows run in all twelve browser/theme/viewport combinations, adding
48 cases to the existing 312 portable workflow cases. Six further flows cover
editable date forms/range drafts, checked/lazy TreeSelect and default/custom
DataGrid editors in `date-fields.spec.ts`, `tree-select.spec.ts` and
`grid-editors.spec.ts`. Their shared helpers also run the actual complete example
source in clean Next.js and Vite registry consumers. Short-height tree popups
are checked at 390/320 × 420 CSS pixels; the usual phone viewport remains
390 × 844. Containment is checked in both themes.

Eleven more flows cover the expanded component/example catalogue and grouped
discovery, FacetedFilter, async external-form parity, atomic grid bulk editing
and complete adoption workflows. These add 132 cases across the same twelve
configurations. They retain real source examples, keyboard paths, native values
and failed-action recovery rather than testing static preview markup.

The five application-foundations flows and two resource-workspace flows add
**84 cases**. They check keyed motion and draft/focus retention through live
reduced-motion changes; scoped dark RTL portals and modal focus return; chart
legend state, exact values and containment; typed time fields with native invalid
events, external-form values and reset; retained native editors across virtual
scrolling; logical panel resizing and narrow layouts; and inventory drafts kept
out of shared view URLs. The native invalid assertion observes the browser event
and validity state rather than requiring a particular localized validation string.

Separate touch projects enable a coarse pointer in Chromium, Firefox and WebKit
at 390 × 844 in both themes. Their eleven scenarios check editable text size,
native focus/blur and unrestricted zoom metadata; vector artwork/template marks;
grid touch scrolling with native editor text selection; and editable dates,
range inputs, TreeSelect search and buffered grid date entry. Native text checks
each start on a fresh page, avoiding a long navigation chain
and prefetch cancellation from replacing unrelated documents. These are 66 touch
cases, not a reproduction of the physical iPhone keyboard or UIKit zoom.

The suite contains **914 cases**: twenty approved image comparisons, 66 touch
checks and 828 normal-motion checks (69 workflows × twelve configurations).
This current configured total includes the content, import, common-input, visual,
resource-planning, Gantt and recurrence workflows. Combined grid workflow checks
are split into smaller independent scenarios while preserving their assertions.
Historical acceptance counts and timings remain in verification.md. Snapshot
updates remain disabled. Run results, initial failures and repaired acceptance
are recorded separately in [verification](verification.md). Run only touch cases with
`--project="touch-*"`. Run the choice/menu/core flows with
`npm run test:quality -- core-controls.spec.ts`, or editing/hierarchy flows with
`npm run test:quality -- date-fields.spec.ts tree-select.spec.ts grid-editors.spec.ts`.

## Run comparisons

CI builds under Node 22 and runs `npm run test:quality` in this exact image:

```text
mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27
```

On Windows, macOS or Linux with Docker already available:

```sh
node quality-tests/run-linux.mjs
```

The runner copies an explicit top-level source allowlist into a disposable BLD8-only container,
including the reviewed licenses/ inventory and BRAND.md, and excluding credentials, environment files, host node_modules and generated output.
It verifies and uses Node 22.22.0, installs from the lockfile, checks quality types, builds, runs the licence fixtures and generated-artifact integrity gate, and compares
without modifying baselines. It leaves reports in the printed
`.local/quality-linux/<run-id>/` directory and removes its container on exit.
It does not change the Docker daemon or other containers.

Within the pinned CI/container environment after `npm ci` and `npm run build`:

```sh
npm run test:licenses
npm run check:licenses
npm run test:quality
```

Normal comparisons set `updateSnapshots: 'none'`: missing and changed baselines
fail. They never approve new images automatically. Reports and expected/actual/diff
images are under `playwright-report/quality/` and `test-results/quality/`;
CI retains these on failure. The isolated server defaults to port 3123;
`BLD8_UI_TEST_PORT` can select another unused port. Existing preview servers are
not reused.

Visual projects hide only the outer document scrollbar before measuring their
component canvas. This preserves the reviewed Linux raster geometry when the
showcase reserves a stable gutter; no control styles or motion are overridden.
Normal-motion and touch projects retain the actual application gutter. The
dedicated `tests/overlay-layout.spec.ts` regression restores visible scrollbars
and checks page geometry through real select opening and closing.

## Review an intentional change

From any host with Docker:

```sh
node quality-tests/run-linux.mjs --update
```

The update command explicitly updates failing Linux image comparisons, then
runs the entire quality suite again with updates disabled. Passing comparisons
retain their existing PNG bytes, so minor passing raster differences cannot
refresh an unrelated golden. The explicit path uses `--update-snapshots=changed`;
normal comparisons retain `updateSnapshots: none`. It copies baselines
back only if the comparison run passes. Review every changed PNG and the source
diff; do not accept output merely to clear a failure. Within the exact pinned
Linux environment the lower-level explicit command is `npm run test:quality:update`, followed by `npm run test:quality`.

Baseline generation and comparison must use the same OS image, Playwright version
and bundled browser. Changing the lockfile's Playwright version requires updating
the image tag/digest and the runner together, reviewing new pixels, and rerunning
the ordinary comparisons. Windows screenshots must never replace these Linux
baselines. Visual projects fail explicitly outside Linux; portable smoke checks
can run on the host instead:

```sh
npx playwright install chromium firefox webkit
npm run build
npm run test:quality:smoke
```

Browser downloads are local Playwright runtimes; this does not change installed
browsers or their profiles. CI's pinned image already contains all three runtimes.

## Determinism and limits

Screenshot fixtures fix Date to 20 October 2026, use en-AU and UTC, set the exact
theme and device scale, and wait for both bundled local variable fonts. Each test
gets a new browser context and storage. Screenshots remove pointer/caret and
transient heading-focus state, reduce motion, hide an overlapping site header,
and mask only spinner/skeleton decoration. A real next/previous calendar month
round trip refreshes the server-rendered today marker from the fixed browser date.
The fixture asserts that date before capture. The first control-specimen capture
settles renderer layout using the same animation, caret, style and mask settings.
Two matching document-box samples then define an integer document clip with one
guard row beyond rounded height. Warm-up keeps the specimen size; each asserted
capture must preserve its complete CSS document box. Masks and pixel thresholds
stay the same. Fixed Date leaves timers and animation frames running. Masked
loading controls retain disabled/busy checks in this and the existing suite.

Normal-motion smoke tests are separate from screenshot stabilization. They start
with `prefers-reduced-motion: no-preference` and do not disable animations to make
interactions pass. Explicit live-preference checks switch to reduced motion and
verify that the interface responds without losing state or focus. All flows check
uncaught browser errors and use portable interactions rather than Chromium-only
animation internals. A narrow Firefox viewport is deliberately used instead of
unsupported Firefox mobile emulation.

Playwright WebKit is useful engine coverage, not an installed Safari test. Its
patched Linux build, fonts and OS integrations differ from real macOS/iOS Safari.
These checks do not establish Safari certification, real iPhone/touch behaviour,
manual assistive-technology coverage or accessibility certification. Real Safari
and device review remain explicit release follow-ups.




## Local verification — 29 October 2026

The ordinary pinned-Linux run passed all 32 checks without retries, including
all eight image comparisons with snapshot updates disabled. The strict quality
typecheck passed. The documented runner also passed a fresh dependency install,
quality typecheck, production build and all 32 ordinary comparisons in a second
disposable container. A deliberate padding change in the isolated copy failed the
visual comparison: 179,850 differing pixels (8%) and a 128 px height change.
The probe stylesheet was restored before the successful full run; authoritative
application source and the reviewed baselines were unchanged by the probe.
Its expected/actual/diff images and trace remain in local ignored diagnostics.
These are local verification results; no remote CI run, commit or deployment is
implied by this record.


## Theme-lab extension — 29 October 2026

The final fresh pinned runner passed all 44 checks without retries or skips:
8 unchanged image comparisons and 36 normal-motion interactions. Each of the
twelve browser/theme/viewport combinations now also exercises theme configuration,
preview isolation, keyboard dialog focus, a real CSS download and shared-URL
restoration. Clean npm ci, strict quality types and a new production build passed
in that disposable container; it was removed after reports were copied out.
This extends the earlier 32-case result above, with no baseline updates.

## Shared neutral selection update — 29 October 2026

The approved selection change adds a quiet neutral backplate to the selected
Overview tab. Four control references changed; all four session PNGs retain their
original SHA-256 hashes. Every canvas keeps its original dimensions. Review
confirmed unchanged geometry, fonts, yellow actions and selected boolean/date
control colours.

| Project | Updated controls | Unchanged session |
| --- | --- | --- |
| Desktop / light | [PNG](../quality-tests/__screenshots__/visual-desktop-light/control-states.png) | [PNG](../quality-tests/__screenshots__/visual-desktop-light/session-preferences.png) |
| Desktop / dark | [PNG](../quality-tests/__screenshots__/visual-desktop-dark/control-states.png) | [PNG](../quality-tests/__screenshots__/visual-desktop-dark/session-preferences.png) |
| Phone / light | [PNG](../quality-tests/__screenshots__/visual-phone-light/control-states.png) | [PNG](../quality-tests/__screenshots__/visual-phone-light/session-preferences.png) |
| Phone / dark | [PNG](../quality-tests/__screenshots__/visual-phone-dark/control-states.png) | [PNG](../quality-tests/__screenshots__/visual-phone-dark/session-preferences.png) |

The earlier locator capture alternated between 2329 and 2330 px while the desktop
specimen's CSS height stayed 2328.53125 px. The first capture also flushed a
one-time document-origin shift. The fixture now warms the renderer once with the
identical screenshot settings before measuring the stable integer clip. A probe
produced three byte-identical raw captures in each of the four visual contexts:
12 captures with strict before/after CSS-box equality. The phone reference has a
one-pixel paint-phase change from the earlier fractional locator crop; this is
recorded rather than hidden through added masks or a looser pixel threshold.

Raw channel-difference bounds, in PNG coordinates `(left, top, right, bottom)`:

| Controls project | Canvas | Raw difference bounds |
| --- | --- | --- |
| Desktop / light | 1012 × 2330 | (40, 118, 967, 2171) |
| Desktop / dark | 1012 × 2330 | (40, 118, 971, 2171) |
| Phone / light | 350 × 4153 | (0, 0, 350, 4153) |
| Phone / dark | 350 × 4153 | (0, 0, 350, 4153) |

These bounds include edge antialiasing and the phone paint-phase correction.
The exact hash/dimension/pixel audit is retained in ignored
`.local/neutral-selection-baseline-audit.json`; the 12-capture proof is under
`.local/quality-linux/neutral-clip-debug/`.

The final pinned runner passed eight explicit update checks, followed by all
56 ordinary checks in 1.9 minutes without retries or skips. Updates were disabled
for that ordinary run. The changed-only policy retained every passing session
reference, and the runner copied candidates back only after the complete pass.
Clean install, strict quality types and production build passed. Final reports
are under `.local/quality-linux/a6b648de-631b-4a0f-9625-3678aacb331b/`;
`.local/neutral-selection-quality-final.status` is `0`. Dedicated proof and test
containers were removed. No commit or deployment is part of this local record.

## Chart references - 29 October 2026

Added four reviewed chart-series.png references: line geometry, series patterns,
axis labels, initial point readout and the exact-data action in both themes and
desktop/phone sizes. The chart capture has no masks. These follow the existing
integer clip, same-policy warmup, fixed fonts and strict CSS-box equality.

The pinned runner passed all twelve explicit changed-only update checks and then
all 72 ordinary image/browser checks in 3.4 minutes, without retries or skips.
Normal comparison had updates disabled. All eight preceding reference hashes are
unchanged; only the four Chart files were added. Pixel tolerances and existing
masks were unchanged. The four new files were visually reviewed after success.

| Project | Chart canvas |
| --- | --- |
| visual-desktop-light | 840 × 530 |
| visual-desktop-dark | 840 × 530 |
| visual-phone-light | 310 × 592 |
| visual-phone-dark | 310 × 592 |

Final reports: .local/quality-linux/d7a5e8ee-d8f7-4097-91b1-587458838730/.
The baseline hash audit and image dimensions are retained in ignored
.local/charts-baseline-before.json and .local/charts-visual-approval.json.
This is a local approval record, not a source release or deployment.


## Yellow palette and grouped-table references - 30 October 2026

The approved #FFD900 accent and evergreen/mint support palette now have reviewed
pinned references. Eight existing control/chart images changed, four session
images remain byte-identical and four grouped-window images are new. No existing
PNG dimensions, masks or comparison tolerances changed. The new table reference
shows aligned columns, group counts, selection and a plain localized record count.

The final pinned runner passed 16 intentional updates and all 88 ordinary
comparisons/workflows with updates disabled (3.4 minutes), without retries or
skips. All final candidate images were reviewed; hashes match the successful
container export. Evidence: .local/quality-linux/
bf438bc5-d12d-4a5e-bb78-64c1063c3eb7/ and
.local/large-tables-quality-review/final-hash-proof.json. An earlier interrupted
copy-review run is retained separately and is not counted as acceptance.


## Day agenda references and embedded previews - 30 October 2026

Four agenda references were added; all sixteen preceding PNG hashes and sizes
remain unchanged. The new desktop images are 1200×968 and phone images 318×1523
in both themes. All four were reviewed and final copies match the successful
container export. No policy, mask or tolerance changes were needed.

The pinned runner passed twenty intentional image updates and all 104 ordinary
comparisons/workflows with updates disabled, without retries or skips (3.4m).
Normal-motion coverage includes booking, UTC details, focus restoration and the
large-issue Mobile frame inside a wide viewport. Export and hash proof are in
.local/quality-linux/76d1adf8-0ef8-4f5e-a887-4b560a2f3900/ and
.local/schedule-quality-review/final-hash-proof.json.
