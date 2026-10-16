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

## 15 October 2026 release and CI preparation

Commit c19f8ccc09a7e72317d5c891030b2f13e46a30f2 was published as
`dpl_9XVADyQhjaseho24KprPZR2S2SwN`, READY, with ui.bld8.dev assigned. Public
routes, expanded playground controls, prop tables, registry modules, integration
starters and sample HTTP validation/failure/create requests passed verification.
The following shared-control refinement remains local; it has not been deployed.

Git-to-Vercel was still disconnected at verification. The new CI workflow and
[connection guide](ci-and-vercel.md) prepare the build/type/browser-test gate.
The workflow must be pushed and run before its checks can be selected in Vercel.

## Local design pass - 15 October 2026

The complete shared-control and subtle-elevation refinement is local and has not
been released. Foundations includes the new Control states preview. The production
deployment continues to serve the previously verified commit until the changes
are approved for a release outside the protected work-time window.


## Source validation - 16 October 2026

The shared-control/material, Outline table and accessibility refinements are
validated for source publication together with the GitHub validation workflow.
Production build, workspace types and all 142 final browser cases pass. The
registry consumer and all 13 generated source downloads match the final styles.

A GitHub push publishes this source. Production delivery is a separate status:
the existing Vercel Git connection and required checks must be verified using
[the connection guide](ci-and-vercel.md). Earlier deployment IDs above describe
their historical releases, not evidence that this source is already live.
