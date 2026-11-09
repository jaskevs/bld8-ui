# Development handoff - 9 November 2026

The owner requested all four adoption priorities together: automatic deployment,
installation receipts, a retained source version and Kanban/Tree/Chart playground
examples. This is additional UI scope; the fixed Workbench roadmap, exam window
and 135-hour baseline remain unchanged. Float0 is excluded.

## Current implementation

- The existing personal Vercel Git link was disconnected and reconnected to the
  same jaskevs/bld8-ui repository. Project settings, domains and the required UI
  Release checks production gate are preserved. The next ordinary source push
  must prove automatic deployment events are repaired.
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

## Publication acceptance still to record

Follow the normal authorised push through core validation, browser quality,
Retained source release and UI Release checks. Verify the native immutable flag,
tag/source SHA, exact artifact inventory, production alias and anonymous URLs.
After promotion, run BLD8_PUBLISHED_VERSION=0.2.0 with check:registry:consumers to
install the real version URLs in clean Next.js/Vite consumers. Verify the retained
bytes again after the next useful deployment. Do not claim local candidate
preparation is hosted publication. See updating-source.md and next-work.md.

The local preview belongs on http://127.0.0.1:3120. Native iPhone focus/blur,
keyboard zoom and marks remain a physical-device check; desktop WebKit does not
reproduce the UIKit keyboard. Creation, detail-field saves and deletion undo are
outside the current slice. No outreach, npm publication or paid tier is included.
