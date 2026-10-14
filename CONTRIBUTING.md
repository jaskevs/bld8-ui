# Contributing

Use Node 22 and React 19. Run `npm ci`, then `npm run dev` for the showcase on port 3120. The UI and blocks packages rebuild when their source changes.

Reusable behaviour belongs in `packages/ui`; compositions belong in `packages/blocks`. The documentation app consumes those public APIs. Keep package source independent of Next.js. Read the installed Next.js documentation when changing app conventions.

Use white panels on a neutral-grey canvas, near-black primary actions and warm yellow accents. Retain shared motion timings, reduced-motion support, keyboard focus and accessible labels. Prefer Base UI for complex interaction behaviour. Preserve the notices for adapted shadcn source and other dependencies.

Before release, run the production build, workspace type checks and relevant Playwright tests. Registry changes also need a clean consumer installation with the actual shadcn CLI. Verify source downloads and check that no credentials, environment files or local artifacts are included.

Keep this repository separate from the other BLD8 projects. Never change company or global Git, SSH, GitHub or npm settings. Preserve the local personal SSH configuration and identity guards. Commits use Jaison <26425317+jaskevs@users.noreply.github.com> for both author and committer, with no co-author trailers. Code commits and pushes are prohibited from 08:00 inclusive to 17:00 exclusive in Australia/Melbourne, every day. Check the current local time; never backdate or bypass the hooks. Publishing, committing and pushing require explicit approval from the project owner.

All original source is MIT licensed. Packages remain unpublished to npm. Never imply authentication, cloud persistence, measured adoption or accessibility certification that has not been implemented or verified.
