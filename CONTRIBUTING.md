# Contributing

Use Node 22 and React 19. Run `npm ci`, then `npm run dev` for the showcase on port 3120. The UI and blocks packages rebuild when their source changes.

Reusable behaviour belongs in `packages/ui`; compositions belong in `packages/blocks`. The documentation app consumes those public APIs. Keep package source independent of Next.js. Read the installed Next.js documentation when changing app conventions.

Use white panels on a neutral-grey canvas, near-black primary actions and warm yellow accents. Retain shared motion timings, reduced-motion support, keyboard focus and accessible labels. Prefer Base UI for complex interaction behaviour. Preserve the notices for adapted shadcn source and other dependencies.

Before release, run the production build, workspace type checks and relevant Playwright tests. Registry changes also need a clean consumer installation with the actual shadcn CLI. Verify source downloads and check that no credentials, environment files or local artifacts are included.

Keep this repository separate from the other BLD8 projects. Never change company or global Git, SSH, GitHub or npm settings. Preserve the local personal SSH configuration and identity guards. Commits use Jaison <26425317+jaskevs@users.noreply.github.com> for both author and committer, with no co-author trailers. Code commits and pushes are prohibited from 08:00 inclusive to 17:00 exclusive in Australia/Melbourne, every day. Check the current local time; never backdate or bypass the hooks. Publishing, committing and pushing require explicit approval from the project owner.

All original source is MIT licensed. Packages remain unpublished to npm. Never imply authentication, cloud persistence, measured adoption or accessibility certification that has not been implemented or verified.

## Focused contributions

Use the bug or component-request issue form for a reproducible problem or a real
workflow gap. Discuss large features before implementation. Read
[the library direction](docs/library-direction.md) and [security policy](SECURITY.md).
Every new control needs public types, API guidance, meaningful behaviour tests
and a source installation check; compositions must cover relevant loading, error,
empty and recovery states. No account or payment is required to contribute or use
any collection. Community response times are not guaranteed.

After changing starter generation, build first and run
`npm run check:starter:vite`. It installs and builds a fresh extraction of the
generated Vite Outline ZIP; the existing CI workflow runs the same check.

Advanced workflow checks also accept `npm run check:starter:vite -- issue-table`
and `npm run check:starter:vite -- task-workspace`; CI builds those actual
archives independently as well. Keep source and registry license files in sync.

The session workflow is checked with `npm run check:starter:vite -- session-setup`
as well. Its same-day time preferences do not supply calendar availability or
daylight-saving resolution; keep those service boundaries explicit.


The release aggregate now requires both core validation and the separate browser-
quality job. Run npm run check:registry:consumers after building registry artifacts.
Review intentional screenshot updates in the pinned Linux environment; normal CI
comparison must fail on missing or changed baselines. See docs/visual-quality.md
and docs/registry-consumer-checks.md for reproducible commands and boundaries.

Use the shared --bui-selected-* and --bui-shadow-selected tokens for selected
surfaces and navigation markers. Keep selection distinct from hover, keyboard
focus, errors and Boolean-on states. Preserve system colours in forced-colour
mode and steady text/icon alignment. See docs/selection-style.md.
