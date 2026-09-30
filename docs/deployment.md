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

This supersedes the earlier no-repository state. Initial source upload is being
prepared; remote visibility must match the user's choice before pushing.
Connecting GitHub to the existing Vercel project is still a separate unfinished
step. The showcase remains online at its current Vercel address. The npm package
remains private/UNLICENSED and is not published by a Git push.
