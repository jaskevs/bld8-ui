# Development handoff - 9 November 2026

The owner requested all four adoption priorities together: automatic deployment,
installation receipts, a retained source version and Kanban/Tree/Chart playground
examples. This is additional UI scope; the fixed Workbench roadmap, exam window
and 135-hour baseline remain unchanged. Float0 is excluded.

## Current implementation

- The existing personal Vercel Git link was disconnected and reconnected to the
  same jaskevs/bld8-ui repository. Project settings, domains and the required UI
  Release checks production gate are preserved. The ordinary source push created a native source:git deployment after an
  initial event delay. The owner confirmed bld8-ui is included in app access.
- Clean-install receipts retain both upstream identity and actual installed text.
  The read-only updater distinguishes CLI transforms, later edits, upstream
  changes and conflicts. Custom UI paths and several source baselines work;
  shared-baseline ambiguity requires review. Source is never overwritten.
- The owner enabled GitHub release immutability. Main CI can publish a verified
  draft from the reviewed SHA using a job-scoped contents:write token. It refuses
  tag moves, changed existing assets or a mutable final response. Retained routes
  resolve fixed version/tag/asset paths. First publication intent is 0.2.0.
- The playground covers 21 controls. Kanban, Tree and Chart use their real public
  APIs, validated share links and matching downloadable TSX. Examples cover
  keyboard movement, loading, empty/error recovery, abortable saves/loads,
  rollback/retry, missing values and exact chart tables. Disabled states are
  included where supported. Existing tokens, easing and reduced motion apply.
- Dev watching refreshes downloaded examples from the actual example source.
  The catalogue has 53 guidance entries, 16 blocks, 3 templates, 152 registry
  items and 40 Next.js/Vite ZIP starters. Packages remain unpublished to npm.

## Verification before the source push

Production build, workspace types and quality-suite types pass. Real clean
Next.js and custom-alias Vite installations pass their 63-item workflow graph,
light/dark browser checks and independent builds. Receipts identify a clean CLI
install, a deliberate edit and an upstream conflict without changing source.
Desktop/phone Kanban, Tree and Chart previews have been visually reviewed.

The initial complete 520-test run had 518 passes and two trace-file teardown
errors caused by overlapping local output directories. The complete affected
motion group plus all new-feature/source checks pass in a separate 47-test run.
Two additional GitHub HTTP-adapter cases pass. No failing interaction assertion
was suppressed. The initial Linux run found navigation-aborted prefetch errors
in the new WebKit test and one whole-case touch timeout under parallel load.
The new flow now uses the actual component selector and explicit URL assertions;
page-error checks remain enabled. The fresh complete 200-case pinned Linux quality run passes without retries or
baseline updates.

## Published source and production

Implementation f7c8998aaf4042f2e3433a276089dbf872a7b581 is pushed with personal
Jaison author/committer ownership at actual 22:09 Melbourne time. GitHub run
42606719082 passed core validation, browser quality, Retained source release and
UI Release checks. The complete CI suite contains 522 regression cases and 200
quality cases.

Native GitHub release v0.2.0 is public and immutable, ID 439042520, with that exact
source SHA. All 220 retained public artifacts, their byte digests and pinned
registry dependencies are verified; snapshot
1322400af0b09f884e9812b9be0b9a7b544e37996d0cf6485ba9ac433e3c1d7f.
Versioned installation URLs are available under /releases/0.2.0/r/.

Automatic Git deployment dpl_GJYozSCEncASDfuTHy6gR3sXuY43 is READY and assigned
to ui.bld8.dev after the required aggregate succeeded. The earlier explicit
same-SHA build was preparatory; the subsequent source:git build confirms native
event delivery. No force promotion or gate removal was used. Public routes,
checker tools, static/themed Vite ZIPs and all three new playground interactions
pass desktop/phone acceptance with no page errors.

Current development manifests use 0.3.0/unreleased, separate from retained 0.2.0.
Publication intent continues to verify 0.2.0 without replacing it. For a new
version, follow updating-source.md; keep every existing catalogue entry.
Use BLD8_PUBLISHED_VERSION=0.2.0 with check:registry:consumers for clean public-
URL Next.js/Vite acceptance. Later deployments must retain every frozen byte.
See verification.md, deployment.md and next-work.md for evidence and boundaries.

The local preview belongs on http://127.0.0.1:3120. Native iPhone focus/blur,
keyboard zoom and marks remain a physical-device check; desktop WebKit does not
reproduce the UIKit keyboard. Creation, detail-field saves and deletion undo are
outside the current slice. No outreach, npm publication or paid tier is included.
