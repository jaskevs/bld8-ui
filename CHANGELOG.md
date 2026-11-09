# Changelog

## 0.3.0 - Unreleased

Development manifests now use the next planning version. Retained 0.2.0 assets
and their dependencies stay unchanged. This does not publish another version.

## 0.2.0 — Source release

Publication is identified by the immutable v0.2.0 GitHub release and its source
revision. Private workspace package versions are separate.

### Added

- Focused registry dependency graphs and themed Next.js / Vite starter downloads.
- Outline project details, tab drafts, conflict review, plain-text comments,
  activity and version-checked undo for bulk status changes.
- A 21-control playground with shareable configuration, validated filter drafts
  and matching source downloads, including Kanban, Tree and Chart.
- Content-digested source manifests, a read-only update report and local versioned
  candidate preparation, installation receipts and retained GitHub release assets.

### Changed

- Table selection and related feedback reveal layout space smoothly. Checkbox
  tick and mixed indicators crossfade; reduced-motion preferences are retained.
- Dropdown scroll locking keeps the showcase geometry stable.

### Update notes

- Shared styles are dependencies of small controls too. Review their diff when
  updating one item; other installed controls may use those same files.
- Outline repository history is optional. Existing CRUD-only adapters remain
  supported. The browser adapter migrates its legacy project array on the next
  successful write; keep a backup before testing storage changes.
- HTTP adapters explicitly opt into history. Add the comment/activity/undo service
  contract before enabling it. Production ownership and transactions remain the
  host application's responsibility.
- Playground links write version 2 and continue reading version 1.
- Snapshot digests identify source, not publisher authenticity. Current URLs move
  with deployments; versioned URLs are usable only after a separately verified,
  retained release publication.

Earlier Git releases predate source manifests. Do not invent their digests or
treat a new manifest as a baseline for already customised files.
