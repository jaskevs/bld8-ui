# Validation and production promotion

The workflow in .github/workflows/ci.yml validates application behaviour, source
installation and approved visuals. It runs on pull requests, main pushes and
manual workflow dispatch. Jobs use read-only repository access and do not need
a Vercel token or application credentials.

## Validation jobs

- **UI core validation** installs the locked dependencies, builds the production
  site, checks workspace types, builds six standalone Vite archives, installs
  the real registry into clean Next.js and Vite consumers, and runs the existing
  interaction/accessibility suite in Chromium.
- **UI browser quality** builds and compares approved screenshots and runs focused
  normal-motion interactions in Chromium, Firefox and WebKit. It uses the pinned
  Linux Playwright image and browser versions documented in visual-quality.md.
- **UI PR checks** or **UI Release checks** is the final aggregate. It runs after
  both jobs, including when either failed or was skipped. It succeeds only when
  both results are success. Keep these public check names stable: the production
  gate depends on the release name.

Missing or changed visual baselines fail normal comparison. CI does not create
or approve replacement images. Review a deliberate update in the same pinned
Linux environment. See [visual quality](visual-quality.md) and
[clean registry consumers](registry-consumer-checks.md).

## Current connection and gate

The personal Vercel project bld8-ui is linked to jaskevs/bld8-ui with main as its
production branch. The 29 October source release 6d839e3 passed its then-current
GitHub release checks and deployed automatically. The quality expansion described
above remains a local source change until separately committed and pushed.

On 29 October 2026 the project's production gate was configured and read back
through Vercel's API. Check chk_31529cb7-fbb0-4a03-a047-a8edc0aecb54 requires the
GitHub check **UI Release checks**, starts when the build is ready, and blocks
production-domain aliasing. Its timeout is 3,600 seconds. Automatic production
aliasing remains enabled, and no unrelated project setting or check was changed.

Configuration is verified; a new deployment's actual hold and promotion have not
yet been observed for this gate. The next authorised source release must verify
that ui.bld8.dev stays on its prior deployment while checks are pending, that a
failed/cancelled check does not promote, and that success permits promotion.
Do not force-promote to bypass a failed check as part of normal release work.

GitHub branch rules are separate. A main-branch ruleset can require **UI PR
checks** before merging; this increment does not change repository rulesets.

## Existing build settings

- Framework: Next.js; Node 22.x.
- Root directory: apps/docs; source files outside the root enabled.
- Install: npm ci --include=dev --workspaces --include-workspace-root.
- Build: npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/docs.
- Canonical domain: https://ui.bld8.dev; the Vercel hostname remains available.

If the Git connection needs restoring, use the personal jaskevs GitHub account
and Vercel team in the project's Git settings. Grant the existing Vercel GitHub
app access only to the requested repository, preserving its other selections.

If the gate needs restoring, open Deployment Checks, choose GitHub and require
**UI Release checks** for Production, retaining automatic aliasing. Verify the
exact name in a completed main-branch workflow rather than choosing a similarly
named core or PR job. The build can run in parallel with GitHub checks; publishing
the production domain must wait for the final aggregate.

Personal CLI authentication lives in the isolated BLD8 configuration. Refresh it
through that CLI configuration when necessary; never change Windows/company or
global Git, SSH, npm or Vercel settings. The ordinary 08:00–17:00 Melbourne
commit/push restriction remains active. The earlier source publication exception
did not authorise future commits or deployments.

References: https://vercel.com/docs/deployment-checks and
https://vercel.com/docs/git/vercel-for-github.
