# Development handoff — 9 November 2026

Included in this source release:

- Lean registry and ZIP source graphs. Sign-in remains 8 registry items, 16 files
  and 4 npm dependencies. The expanded clean-consumer check now includes Outline
  alongside the earlier workflows and exercises a 63-item graph.
- Themed starter selection, real component previews and Next.js/Vite downloads,
  including theme CSS/JSON, mode and selected self-hosted fonts.
- Stable showcase geometry while dropdowns lock scrolling.
- Outline project details: a responsive drawer, persistent footer, tab-local draft
  recovery, explicit conflict review and focus return. The current list survives
  editing. Creation, inline editing and the HTTP sample remain compatible.
- Bulk selection and issue filters use a reversible 320 ms layout reveal. The
  table follows the bar, count updates stay steady, and closing actions become
  inert immediately. Checkbox ticks and mixed dashes crossfade as fixed shapes.
  Large-table phone wrapping, archive/undo feedback and focus return are covered.
- Outline activity and plain-text comments, plus version-checked undo for bulk
  statuses. Browser storage migrates legacy arrays on write; the HTTP demo opts
  into the optional history capability. Saved comments persist with workspace
  data; unsent comments stay in memory while this page remains open. Stale undo
  rejects all changes; failed writes retain a retry action and useful focus.
- The playground now covers 18 controls. Choice and accordion states, table
  selection/query/columns/groups, and draft/applied filters have validated v2 links
  with v1 compatibility. Presets demonstrate selection, grouping, filtering,
  editing and rejected updates. Matching TSX downloads and scoped install commands
  accompany the examples. Desktop settings stay visible; phone links preserve
  keyboard context. See playground.md for transient data and link-length limits.

- Source update guidance at /releases, an unreleased 0.2.0 manifest, a read-only
  comparison tool and locally prepared versioned candidates. Reports separate
  upstream changes, local edits, conflicts, removed files and dependency changes.
  Candidate inventories and digests are checked before reuse; every registry
  dependency targets the same reserved version path. No versioned release was published in this pass.

The source catalogue has 53 guidance entries, 16 blocks, 3 templates, 151 registry
items and 40 ZIP starters. Packages remain private and unpublished to npm.

## Review locally

- http://127.0.0.1:3120/templates/outline — row actions → Edit project. Change a
  field, cancel, keep the draft and reopen; reload also preserves the tab draft.
- In that same drawer, scroll to Activity to post a comment. Back in the table,
  select projects → Archive or Mark ready → Undo status change. Reopen their
  activity to inspect the actual change and restoration entries.
- http://127.0.0.1:3120/examples/outline-http — use Fail next save to try recovery.
- http://127.0.0.1:3120/themes?starter=outline — preview and download a themed app.
- http://127.0.0.1:3120/blocks/resources — select, select all and clear; try
  archive/undo, keyboard toggles and rapid reversals.
- http://127.0.0.1:3120/releases - save a source baseline, read update notes and
  download the two standalone checker modules. See updating-source.md.
- http://127.0.0.1:3120/playground?component=DataTable — try its presets, selection
  across pages, rejected update and source download. FilterBuilder keeps draft
  conditions separate until Apply filters.

The playground build/types and 58 focused production cases pass. Its 52 generated
source variants type-check against actual registry files. The two new workflows
pass 24 pinned Linux browser/theme/viewport checks; three final mobile/sharing
checks also pass after visual review. Earlier Outline acceptance includes 93
regressions, 24 browser checks, clean Next.js/Vite source installs and an actual
Vite ZIP build. The full quality suite now contains 176 cases; it was not rerun
in full for this increment. See verification.md for evidence and limits.

Source updates pass the production build/types and 34 focused checks, plus a
final explicit light/dark desktop/phone accessibility and download check. The
prepared 0.2.0 candidate passes clean Next.js/Vite CLI installs, builds and both-
theme workflow checks. Its registry URLs are reserved, not published. The checker
also ran read-only against fresh Next.js Outline source; CLI transformations can
still be reported as local differences. See verification.md for the full limits.

## Publication and next work

The owner authorised this source publication on 9 November 2026. The complete
production build/types, all 493 workflow tests and 176 pinned Linux quality checks
pass. Personal identity, commit-time guards and the production gate are retained.
The previous deployed revision is 7c7af73. Follow this commit through GitHub and
automatic Vercel promotion before treating the new source as live; private planning
records the exact revision and remote outcome. Immutable 0.2.0 URLs are reserved,
not published by this source push. The ordered backlog is in [next-work.md](next-work.md).

Next: after an authorised release, configure retained immutable-version hosting and
verify the reserved release URLs before announcing them. Local bundle preparation
does not provide that hosting or retention. Undo for creation,
detail-field saves and permanent deletion remains outside this slice. Preserve the fixed
Workbench roadmap and exam allocation; this library work remains additional scope.
