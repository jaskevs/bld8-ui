# Showcase deployment

Updated 28 September 2026.

The public first edition is live at https://bld8-ui.vercel.app.
The user chose this address for now. ui.bld8.dev is attached to the Vercel
project, but its DNS setup is deferred; do not present it as the live address.
The shared URL for metadata, robots and sitemap is apps/docs/src/lib/site.ts.

## Personal account and project

- Vercel account: jaskevs-4920; team: jaskevs-4920s-projects.
- Team ID: team_RnQzYBfS2FDqYF2rUvLtGjuz.
- Project: bld8-ui; ID: prj_gWnmFxKr2ifrPRR2zBhWykMOKCPf.
- Verified production deployment: dpl_G6i92J2yaPo51YnLPmBsbbGT3uug.
- Project link: .vercel/project.json (ignored).
- Personal authentication remains in ../.bld8-local/vercel/auth.json.
  Never print or upload its contents. Do not use or modify global/company setup.

## Build settings

- Framework: Next.js. Node: 22.x.
- Root directory: apps/docs.
- Include source files outside the root directory: enabled.
- Install: npm ci --include=dev --workspaces --include-workspace-root
- Build: npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/docs
- Output directory: framework default.

The root devDependencies include TypeScript. A filtered installation from the
app directory missed those dependencies; explicitly including the workspace
root resolves this while keeping npm ci and the existing lockfile.

This release used Vercel's HTTPS REST API through PowerShell with normal Windows
certificate verification. The local Node CLI encountered a certificate-signature
error. TLS verification was not disabled. The direct deployment request must
include projectSettings.rootDirectory and sourceFilesOutsideRootDirectory.

Only an allowlist of runtime source was uploaded: root package manifests,
packages/ui package/TypeScript manifests, README/notices, src and build script,
and apps/docs package/TypeScript/Next manifests and src. No .env, personal
credentials, parent workspace, private planning, local screenshots, tests or
node_modules were uploaded. Vercel built the source in its own environment.

## Publication boundaries

This publishes the interactive website only. The npm package remains private
and UNLICENSED until the user chooses a licence and namespace. There is no Git
repository or remote for bld8-ui yet, so automatic Git deployment is not enabled.
The sibling bld8-web deployment is independent and unchanged.

No commits or pushes were made. Keep the 08:00-17:00 Melbourne commit restriction
and personal author/committer identity for any future authorised Git setup.

## Verification

Production state is READY. Anonymous HTTPS requests returned 200 for Home,
Components, Motion, Foundations, Examples, Start here, Button, robots, sitemap
and icon. The sitemap contains 34 page URLs at the Vercel address.
Isolated Edge checks on the public site passed at 1440 and 390 px: white menu
border, no shadow at the top, a soft shadow after scrolling, sticky placement,
shadow removal after returning to the top, mobile link navigation, no horizontal
overflow and no browser page errors. Desktop/mobile screenshots were reviewed.

## Initial source release - 30 September 2026

The user requested all pending code be committed and pushed to the respective
repositories. BLD8 UI is now an independent Git repository on main with origin
pointing to git@github-bld8-personal:jaskevs/bld8-ui.git. It uses Jaison and the
personal no-reply address for both author and committer, plus the shared personal
SSH configuration and commit/push guards. The push guard accepts only this exact
personal destination. Company/global configuration remains unchanged.

This supersedes the earlier no-repository state. On 30 September the user explicitly chose to keep jaskevs/bld8-ui public
and push the source. The initial source release includes commit 8895f75.
Connecting GitHub to the existing Vercel project is still a separate unfinished
step. The showcase remains online at its current Vercel address. The npm package
remains private/UNLICENSED and is not published by a Git push.

Source repository: https://github.com/jaskevs/bld8-ui (public by user choice).

## Local library expansion - 13 October 2026

The component/blocks/templates expansion is implemented and verified locally.
It has not been committed, pushed or deployed by this build request. The existing
Vercel site therefore still shows the earlier release. The user selected MIT for
the original code; this supersedes UNLICENSED and licence-pending wording above.
Both Free and Premium catalogue collections cost $0, with equal source access.

The existing root build command still builds UI then docs. The docs build now
runs `scripts/prepare-library.mjs`: it compiles the new blocks package, copies
its styles, generates catalogue/source modules, and prepares all eleven static
source manifests/ZIP downloads before Next.js builds the pages. `npm ci` needs
the updated root lockfile and all workspaces.

A future direct-deployment allowlist must include root LICENSE/manifests,
scripts/library-catalog.mjs, scripts/prepare-library.mjs, the packages/blocks
manifests/source/build script/README/LICENSE, UI LICENSE and the new docs source.
Generated downloads/manifests are made by the build and remain ignored in Git.
Never include parent planning, environment files, credentials or node_modules.
Git-to-Vercel remains unconfigured; no deployment or account settings changed.

The later icon expansion additionally requires `scripts/prepare-icons.mjs`, the
pinned Lucide dependency in the lockfile, `packages/ui/LUCIDE_LICENSE`, the new UI
icon source and docs icon source/styles. Icon SVG assets and typed metadata are
generated during preparation; they remain ignored and should not be maintained
manually. The public directory is self-hosted, without an icon CDN or paid gate.

## October source release - 13 October 2026

The user authorised committing and pushing the pending UI expansion to the
personal public jaskevs/bld8-ui repository on main. The earlier local-only
source status above describes implementation before this release request.
This source release includes all 40 component guidance entries, eight blocks,
three templates, the icon directory, Tailwind build/watch support and licence
notices. Verification is recorded in verification.md.

A future deployment must include the UI Tailwind source/build script and pinned
CLI dependency, SHADCN_LICENSE, DAY_PICKER_LICENSE, all blocks and generators.
The build creates compiled CSS and eleven ZIP starters. Do not include local
previews, upstream download caches or any account files.

No new deployment or Git-to-Vercel connection is part of this source push. The
public Vercel showcase therefore still needs a separate release of this source.
