# 0.3 source release and installation feedback

This checklist describes the regular release path. A local build or prepared
bundle is not a published version. Record the exact source revision, CI run,
immutable release and deployment evidence in handoff.md after they are verified.
Keep retained 0.2.0 paths and bytes unchanged.

## Candidate contents

Review the public contracts and complete examples for grouped/faceted selection,
grouped form workflows and linked errors, async native-form parity and bounded
DataGrid bulk edits. Also include the previously verified core controls,
source-backed examples, navigation and portable attribution changes in the
0.3.0 changelog. Use the generated authorities for counts.

Human prop tables, exact example Markdown, registry entries, lean dependency
graphs, licences and read-only MCP discovery must describe the same source.
Examples with local adapters must say what the application still owns.

## Before the normal source push

- Build with Node 22 and the locked npm installation. Check workspace and quality
  types, meaningful changed-area regressions and the approved visual comparisons.
- Run the licence fixtures and generated-artifact guard after generation. Do
  not accept new inventories or screenshot baselines just to clear a failure.
- Install representative new examples through their actual registry entries in
  clean Next.js and Vite applications. Check canonical values, reset/error
  recovery, keyboard focus, both themes and retained complete notices.
- Build and exercise themed downloads independently. Prepare the content-addressed
  candidate with npm run release:prepare; verify its manifest and inventory.
- Add 0.3.0 to releases/catalog.json without changing 0.2.0 and set
  releases/publish.json to 0.3.0. Populate releases/next.json changes and
  CHANGELOG.md with the actual delivered behavior. Keep next.json status
  unreleased: the publisher creates the separate frozen released manifest.
- Use the existing personal identity and isolated repository settings. Check
  actual Melbourne time; the normal daily 08:00–17:00 commit/push restriction
  still applies. Do not backdate or bypass hooks.

## CI, immutable source and production

The normal main push starts UI core validation and UI browser quality. Both must
pass before Retained source release builds from that exact clean Git SHA using
the repository-scoped Actions token. Publication creates or resumes an identical
draft, uploads verified assets, checks the immutable release and tag identity,
then checks anonymous asset access. An existing asset, tag or retained version
must never be overwritten.

UI Release checks must pass before Vercel promotes the production domain. Keep
that gate and automatic Git deployment in place. Do not manually force-promote
around a failed test, source release or deployment check. See ci-and-vercel.md
and updating-source.md for interruption recovery and exact commands.

After promotion:

- Verify ui.bld8.dev reports the expected revision and routes. Exercise the new
  catalogue navigation and representative examples, not just the homepage.
- Verify /releases/0.3.0/manifest.json identifies released 0.3.0 and the pushed
  revision. Verify the immutable GitHub tag and public registry/download URLs.
- Run BLD8_PUBLISHED_VERSION=0.3.0 npm run check:registry:consumers against the
  real public URLs, with no loopback registry rewrite or consumer credentials.
- Recheck a 0.2.0 manifest, registry item and starter URL. A newer release must
  preserve existing installations and the previous download path.
- Record actual successes or blockers. Announce availability only after this
  evidence exists; preparation and anonymous CI status are different from live
  acceptance.

## Feedback from real installations

The installation-feedback issue form asks for the exact source version or
revision, framework, install path, outcome and a concrete friction point. An
optional public reproduction helps distinguish library bugs from host setup.
No BLD8 account is required. GitHub sign-in is required to submit feedback.
No telemetry, paid access or private application upload is required.

Use that feedback to prioritise first-install failures, confusing contracts,
keyboard/focus regressions and repeated integration work. Do not invent users,
adoption numbers, successful installations or endorsements. Reports remain
unreviewed until reproduced; link any fix to a regression and release note.
