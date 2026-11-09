# Next work

The next priority is easier adoption and dependable upgrades. Keep the current
white/grey surfaces, #FFD900 accent, crisp icons, shared easing and reduced-motion
behaviour. Finish one bounded slice before expanding the catalogue again.

## 1. Verify this source release on the live site

Follow the exact pushed revision through both GitHub checks and the protected
Vercel promotion. Verify the current manifest, themed downloads, playground
sharing and Outline editing/comments/status undo at ui.bld8.dev. Recheck actual
iPhone focus/blur, zoom and vector marks; desktop WebKit does not reproduce the
native keyboard. Record device observations separately from automated checks.

Done when the production revision matches GitHub, the release gate is green,
representative downloads run, and any remaining device check is explicit.

## 2. Record installations before checking updates

Add an optional installation receipt immediately after a clean install. Keep the
upstream manifest identity and hashes of the files the CLI actually installed.
Use those as separate records: upstream text and installed text can differ.
The existing checker conservatively reports CLI transformations as local edits;
fresh Outline source already demonstrated two such helper files.

Start with one item and its shared graph. Support custom UI directories, several
installed versions and locally changed files. Capturing a receipt after editing
must not claim to reconstruct an original installation. Do not add auto-overwrite.

Done when clean Next.js and Vite installs show no user edits, a deliberate edit is
identified, an upstream-only change is distinct from a conflict, and shared CSS
or dependency changes are visible without replacing source.

## 3. Retain a first immutable source version

Choose and configure retained artifact hosting before advertising versioned
installation URLs. Prepare from a clean reviewed revision, archive the exact
manifest and bundle, and publish one owner-authorised version. Keep previous
artifacts unchanged across future deployments. The current 0.2.0 candidate is
unreleased; pushing source does not publish its reserved version paths.

Done when every dependency stays on that version, real Next.js/Vite consumers
install and build from production URLs, digests match the archived bundle, and
deploying a second version leaves the first available with identical bytes.
Keep npm publication separate; no package or paid tier is required.

## 4. Bring the strongest workflows into the playground

Extend the existing playground in small groups: Kanban, Tree and Charts first;
then bounded tables and DayAgenda. Use their real public APIs and coherent sample
workflows. Include loading, empty, error/retry, disabled and keyboard states where
supported, matching TSX, scoped installs and validated share URLs.

Done when downloaded examples type-check against installed source, phone layouts
stay contained, focus survives state changes, and normal/reduced-motion checks
cover the actual interactions. Add prop documentation with each increment.

## 5. Learn from one outside developer using a real screen

Use the published installation and a small resource-management or planning screen.
Ask the developer to theme it, wire a supplied callback and handle a failed save.
Record the setup friction, documentation gaps and interaction issues they find.
Prioritise repeated gaps before adding more components or another template.
Invitations or messages need separate authorisation; no outreach is automated.

Done when a real adoption attempt and its feedback are recorded, with fixes tied
to that evidence. Do not infer demand, production readiness or accessibility
certification from catalogue size or automated checks.

This is an ordered backlog, not a calendar commitment. Agree the next bounded
implementation slice before starting it.
