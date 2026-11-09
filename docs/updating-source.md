# Updating copied source

BLD8 installs source you own and can customise. There is no automatic overwrite,
merge or update service. The source release version is separate from the private
workspace package versions; no BLD8 package is published to npm.

## Keep a baseline

Save the source manifest from /releases/current.json alongside the registry source
you install. Keep the original JSON unchanged, with your own project history.
That URL describes the currently deployed build and changes on later deployments.
An unreleased status describes a development candidate, not a published version.
Existing installations made before manifests need their original source; a newer
manifest cannot reconstruct that baseline.

Download both check-source-updates.mjs and source-release.mjs from /releases into
the same folder, or use the pair from a prepared release bundle. The checker uses
Node 22 built-ins. It makes no network requests and does not write source files.

## Compare before installing

Save the next manifest as a separate file. From your application folder:

```sh
node tools/check-source-updates.mjs --from bld8-baseline.json --to bld8-next.json --item button --ui-dir src/components/ui
```

Point --ui-dir at your actual configured UI directory, the parent of bld8/. It
supports custom aliases by using that directory directly. Repeat --item for other
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

Text digests normalise CRLF to LF. Formatting, alias transformations or deliberate
refactoring may still appear as local edits. This conservative report will not
attempt to reverse those changes. Local files resolving outside --ui-dir, including
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

## Publication checklist

After explicit owner authorisation, use a clean reviewed revision, passing core
and browser checks, and a unique version. Review the prepared artifact inventory
and notices. Archive the exact candidate and its manifest. Publish the directory
at its reserved /releases/VERSION path and retain that directory on every future
deployment. Keep earlier versions byte-for-byte unchanged. Verify that each
dependency URL returns the same version and that fresh Next.js/Vite consumers
install and build from those URLs before announcing it. Retain the protected
Vercel release gate; preparing a bundle is not that acceptance or publication.

There is deliberately no automatic publisher in this increment. Storage and
retention for hosted immutable versions must be configured and verified at the
first authorised release. The moving current manifest is not a replacement for
retained versioned artifacts.
