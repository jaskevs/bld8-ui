# Changelog

## 0.3.0 - Unreleased

Development manifests now use the next planning version. Retained 0.2.0 assets
and their dependencies stay unchanged. This does not publish another version.

### Fixed

- Async dropdowns keep nearby form actions accessible; selected-chip removal restores picker focus and reordered checkbox validation clears the previous anchor.
- Catalogue URL filters restore before viewport-activated live previews, avoiding the observed hydration delay; mobile bulk actions use paired 44px targets.

- Date editor recovery keeps the latest native input while validation feedback changes, without moving Apply or committing an invalid value.

- Even compact calendar selection insets, stable event-count/date alignment and persistent selected hover colour.

### Added

- FacetedFilter, native Fieldset and CheckboxGroup, linked form errors and conditional/repeatable React Hook Form examples.
- Async choice external form ownership, read-only values, native reset and stale-request cancellation.
- Opt-in DataGrid Fill down/apply-to-selection with complete validation, protected cells and one host history batch; enabled in Data Workspace.
- Real Next.js/Vite installation acceptance for five new complete workflows, plus structured installation feedback.

- Autocomplete, Toolbar, AlertDialog, NavigationMenu and PreviewCard on Base UI, with complete examples, typed APIs, keyboard/focus behavior and shared motion.
- Searchable complete-example pages and per-example registry installations derived from the canonical preview source; separate family and example counts.
- Focused dependent-lookup, upload-acknowledgement and Kanban-save recovery examples.
- Exact example Markdown, read-only MCP search_examples/get_example tools and example resources, including install metadata and portable notices.

- Portable source attribution, upstream provenance and full notices across copied examples, registry items, starters and agent responses; content-based licence gates and negative fixtures.
- A documentation hub and clearer catalogue navigation, factual licence labels and a white marketing homepage with interactive component previews and reduced-motion support.

- Checked TreeSelect with ancestor search context, mixed parent states, abortable
  lazy children, retry and explicit loaded-leaf selection semantics.
- Editable date entry, native form/reset ownership, range presets and optional
  Apply/Cancel, preserving existing DatePicker/DateRangePicker calls.
- Date, boolean and multi-value grid editors with canonical clipboard values,
  public custom display/editor contexts and complete composition examples.

- TagInput, ToggleGroup, RangeSlider and OTPInput with native form, ref and keyboard contracts.
- Rich stable-ID local choices and composable action, checked and radio submenus.
- Complete named modules used directly by previews, build-typechecked and shared with human/agent/MCP documentation.
- Capability filters, related controls, and human block/template API tables.
- Optional DataGrid layouts, logical pinning, resizing, density and touch/keyboard multi-sort.

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

- Components and Examples share compact local navigation and labelled, aligned filters; the competing category sidebar is removed.

- Complete-example browsing now has aligned searchable group/family/category multi-selection, mixed parent states, stable mobile summaries and shareable repeated-key filters.

- Complete example registry modules are copied verbatim, preserving copyright and full MIT permission notices through actual CLI installation.
- Header actions wait for mounted handlers; copy feedback avoids empty status roles, and compact toolbars keep single-line labels in a contained scroller.

- Icon browsing keeps a fixed gallery while selected previews expose size/stroke
  settings, common button examples, saved icons, share links and correctly sized
  licensed SVG exports. Failed SVG preparation can be retried.
- Quick-filter popups use a viewport height cap independent of side collision
  measurements, avoiding resize feedback while picker and editor content changes.
  Returning to the field picker restores search focus without scrolling; these
  menus stay in the viewport when their anchor scrolls out of view.
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
