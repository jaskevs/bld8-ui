# Updating copied source

BLD8 installs editable source you can customise under the included licences. There is no automatic overwrite,
merge or update service. The source release version is separate from the private
workspace package versions; no BLD8 package is published to npm.

## Keep a baseline

Prefer a fixed source version, for example /releases/0.2.0/r/button.json.
Versioned registry dependencies resolve to that same version. Retained paths
redirect to immutable assets in jaskevs/bld8-ui GitHub Releases. Download the
matching /releases/0.2.0/manifest.json before installation.


Save the source manifest from /releases/current.json alongside the registry source
you install. Keep the original JSON unchanged, with your own project history.
That URL describes the currently deployed build and changes on later deployments.
An unreleased status describes a development candidate, not a published version.
Existing installations made before manifests need their original source; a newer
manifest cannot reconstruct that baseline.

Download capture-installation.mjs, check-source-updates.mjs and source-release.mjs
from the same retained release into one tools folder. The moving /releases tools
are also available for development builds. The checker uses
Node 22 built-ins. It makes no network requests and does not write source files.

## Capture actual installed text

Immediately after a clean CLI install, before editing:

```sh
mkdir receipts
node tools/capture-installation.mjs --manifest manifest.json --item button --ui-dir src/components/ui --output receipts/button.json
```

The receipt records the upstream manifest, selected dependency graph and digests
of the actual installed text. This accounts for CLI formatting and alias rewrites
without guessing how to reverse them. It contains relative BLD8 paths, not local
absolute directories. Capture writes metadata only; the output parent must exist
outside the UI directory. Existing receipt files are never overwritten. Omit
--output to print JSON instead. Repeat --item for source installed together.

Receipts are local records, not signed proof of a clean installation. Do not
capture an already customised tree and treat it as the original. Keep receipts
with your own project history; do not edit their embedded manifests or digests.

## Compare before installing

Save the next manifest as a separate file. From your application folder:

```sh
node tools/check-source-updates.mjs --from receipts/button.json --to bld8-next.json --ui-dir src/components/ui
```

Point --ui-dir at your actual configured UI directory, the parent of bld8/. It
supports custom aliases by using that directory directly. A receipt defaults to
its captured items. Repeat --from for multiple receipts from different versions;
conflicting shared baselines are reported for manual review, never guessed.
A raw original manifest is still supported with --item. Repeat --item for other
installed public items, such as outline. Each item's complete dependency graph,
shared styles and notices are included. Omit --ui-dir to compare upstream source
only; this does not inspect local customisations. Use --json for a structured report.

| Result | Meaning |
| --- | --- |
| update-available | Local text matches the old baseline; upstream has changed. Review before replacing. |
| conflict | Both upstream and local text differ from the baseline. Merge manually. |
| local-only | Upstream is unchanged; keep your local customisation. |
| current | Local text already matches the target source. |
| add / collision | A new upstream file is absent locally / already exists with different content. |
| removal-review / removal-conflict | Upstream dropped a file; local text is unchanged / customised. Do not delete automatically. |
| missing / already-absent | An expected file is missing / an upstream removal is already absent locally. |

The report also lists runtime dependency additions/removals, including version
changes as an old/new pair. Exit 0 means no upstream review is indicated for the
selected items; 2 means review is required; 1 means invalid input or an unreadable
file. Neither a clean report nor a matching digest certifies compatibility.

Text digests normalise CRLF to LF. With a receipt, CLI transformations are part
of the installed baseline; later formatting or refactoring is a real local edit.
With only a raw manifest, even CLI transformations may appear as local edits.
The checker does not attempt to reverse or automatically merge those changes. Local files resolving outside --ui-dir, including
symlink escapes, are rejected. Input manifests are bounded and validated. Hashes
detect inconsistencies; they are not signatures. Obtain manifests and tools from
a source you trust and inspect scripts before running them.

Review the changelog and install the target into a temporary application or branch.
Compare its source with your customisations and merge the relevant files. Run your
application checks, keyboard flows and theme checks. Save a target baseline only
for items actually updated; keep separate baselines for items still on older source.
Do not blindly remove shared files or npm dependencies used elsewhere in your app.

## Prepare a versioned candidate locally

Maintainers build first, then run:

```sh
npm run build
npm run release:prepare
```

This creates a content-addressed directory under .local/release-candidates/ with
the planned version, registry JSON, source manifests, all starter ZIPs, licences,
notes and the checker. Registry dependencies are rewritten to the same reserved
version path, never to moving /r URLs. The manifest records source digests and
artifact byte digests. Repeating preparation verifies existing bytes; differing
artifacts are not overwritten. The command does not tag, upload, commit or deploy.

The candidate version is configured in releases/next.json and remains unreleased.
Its /releases/VERSION/r URLs are reserved and will return 404 until published.
Current builds do not expose those candidate directories automatically.

## Retained publication

The owner enables GitHub release immutability in repository settings. Main-branch
CI validates core behaviour and browser quality before the repository-scoped
source-release job runs. Its token has contents:write only in that job; personal
shell credentials are never used. Pull requests cannot publish.

releases/catalog.json is append-only for existing immutable versions.
releases/publish.json names one requested version. The publisher builds from the
clean reviewed Git SHA, prepares a released manifest with that revision, verifies
the exact inventory and every digest, uploads a draft, then publishes it. It
requires GitHub's immutable flag and an exact tag-to-source match. Interrupted
drafts can resume identical assets from the same source revision. It never
replaces an asset, moves a tag or deletes a published release. Reusing a published
version verifies its existing assets and makes no mutation.

Version routes redirect to a fixed GitHub tag and allowlisted asset path, never
to latest. Publication verifies anonymous asset access; the final UI Release
checks gate holds production until this job succeeds. Keep every catalogue entry
on future deployments and verify old source URLs after publishing another build.
Do not use publication intent to claim npm package availability.

To publish the next source version, prepare reviewed notes, add a unique version
to the catalogue and change publication intent in an authorised main-branch
commit. Retain the existing protected Vercel gate. Review the complete CI run,
native immutable release, fresh Next.js/Vite installations and production URLs
before announcing availability. Local preparation alone is not publication.

After the first protected deployment has promoted, maintainers can run
`BLD8_PUBLISHED_VERSION=0.2.0 npm run check:registry:consumers` (set the environment
variable in the current shell on Windows). This downloads and verifies that
version's manifest/registry digests, installs the real public URLs without a
loopback dependency rewrite, and exercises clean Next.js and Vite builds. It
never sends GitHub credentials to the public URLs or to CLI child processes.
The first production routes cannot be tested before their initial deployment.

## Next.js starter dependency update - 10 November 2026

Current Next.js starters pin 16.4.6. Retained 0.2.0 archives preserve their
original 16.3.8 pin and byte identity. If starting from those archives, update
Next.js to 16.4.6 before a production deployment, then run the build and tests.
The [upstream advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
identifies affected versions through 16.4.0 and the patched release line. This
is a dependency update in the consuming application, not a replacement of a
retained BLD8 source artifact. Vite starters do not depend on Next.js.
