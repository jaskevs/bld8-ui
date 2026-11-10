# Changelog

## 0.3.0 - Unreleased

Development manifests now use the next planning version. Retained 0.2.0 assets
and their dependencies stay unchanged. This does not publish another version.

### Added

- Table layouts and optional pointer/touch ordering, with portable saved views.
- Bounded nested filters, preserving legacy queries in the client and HTTP adapter.
- Async Combobox/MultiSelect and Cascader with remote search, paging and recovery.
- Week/month calendars, overlapping multi-day UTC events and abortable range loading.
- Per-file upload queues, real XHR progress and temporary HTTP acknowledgements,
  with a runnable Next.js receiver example.
- Shared developer/agent API documentation and optional local read-only MCP discovery.
- Optional DataGrid with typed cell editors, rectangular selection, bounded
  clipboard edits and local draft history.
- Data Workspace with atomic batch review/save, conflict recovery and persistent
  Next.js/Vite HTTP reference applications.
- Searchable grid choice menus and quick filtering with editable condition chips,
  shared range validation and preserved advanced groups.

### Changed

- File inspector metadata follows the latest selection through interrupted animations.
- Grid selection and inline editing share one cell boundary, with stable row
  geometry, touch tap/pan handling and smooth, reduced-motion-aware menus.
- Related union types remain type declarations in the website, Markdown and MCP
  documentation rather than exposing inherited JavaScript primitive methods.
- Current app and newly generated Next.js starters use 16.4.6. Retained release
  archives remain unchanged; applications consuming them own their dependency updates.

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
