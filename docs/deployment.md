# Showcase deployment

Canonical domain: https://ui.bld8.dev. The existing https://bld8-ui.vercel.app address also serves the project.

## Project

- Personal Vercel account: jaskevs-4920; team: jaskevs-4920s-projects.
- Project: bld8-ui; ID: prj_gWnmFxKr2ifrPRR2zBhWykMOKCPf.
- Framework: Next.js; Node 22.x.
- Root directory: apps/docs; source files outside the root directory enabled.
- Install: `npm ci --include=dev --workspaces --include-workspace-root`.
- Build: `npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/docs`.

The repository is public at https://github.com/jaskevs/bld8-ui. Git-to-Vercel deployment is not connected; releases currently use direct deployment. npm publication is independent and remains disabled.

## Domain

Cloudflare manages bld8.dev. The ui CNAME points to `4fe7c1689a422072.vercel-dns-017.com`, with DNS only and TTL Auto. Vercel verified the record on 14 October 2026. An HTTPS request to the configured Vercel edge returned 200 with a valid certificate for ui.bld8.dev. The existing main website records are independent.

`apps/docs/src/lib/site.ts` supplies the canonical URL for metadata, sitemap and installation guidance. `scripts/prepare-registry.mjs` uses the same production host for item dependency URLs. Do not publish a registry generated with a local test origin.

## Release inputs

Upload only root manifests and licence, the UI/blocks manifests, source, build scripts and notices, the docs app manifests/config/source, the five library/registry/API generators, and the canonical files under examples/outline-http and examples/react-hook-form. Vercel creates compiled packages, registry JSON, icon assets and starter ZIPs during the build. Exclude credentials, environment files, local caches, tests, node_modules, parent workspace and private planning.

Personal credentials remain outside the repository in the isolated BLD8 tooling configuration. Use normal TLS verification and preserve company/global settings. Local Git identity and commit-window guards remain active; see CONTRIBUTING.md.

## 14 October 2026 release

The existing source release was published as `dpl_E3c82LA4M8vYusJXRp7Hmm3oVN86`; Vercel reported READY. The following registry/playground/workflow release is recorded after final verification below.


Final registry/playground/Outline release: `dpl_CYYsuHt4YJkfg2zoBGjiEYtXmFiS`,
READY on 14 October 2026. It supersedes the intermediate feature deployment
`dpl_GGKtKHFgeqE5k3iRAWtJVFLHwtx3`. Both ui.bld8.dev and bld8-ui.vercel.app
are assigned to this production release. Anonymous route checks and live browser
interactions passed; the public registry also installed and built independently.
Source was uncommitted when this direct release was published; no Git push
accompanied that deployment. The local preview remains available at http://127.0.0.1:3120.

## Playground and integration expansion

The extended playground, generated prop tables, inline cell editing, HTTP sample
service and React Hook Form examples are verified locally. They have not been
deployed in this batch. A source push updates GitHub; Git-to-Vercel deployment
is still disconnected. A future direct release must include prepare-api.mjs and
the canonical example sources; the documentation app imports these files.
