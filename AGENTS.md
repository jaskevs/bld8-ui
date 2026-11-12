# BLD8 UI contributor instructions

Read `README.md`, `docs/handoff.md` and `docs/next-work.md` before changing the
library. Use `docs/verification.md` for recorded evidence. When this checkout is
inside the owner's BLD8 workspace, also read the parent `AGENTS.md` and
`CLAUDE.md`; preserve the separate sibling repositories and private planning.

## Source authorities

- `packages/ui/src`: public React controls, types, design tokens and shared motion.
- `packages/blocks/src`: reusable workflows and host service contracts.
- `apps/docs/src/lib/catalog.ts`: component descriptions, examples and boundaries.
- `scripts/library-catalog.mjs`: block and template metadata.
- `scripts/prepare-api.mjs`: UI prop tables derived from public TypeScript exports.
- `scripts/prepare-library.mjs`: source views, lean starter archives and the
  registry/release/documentation generation pipeline.
- `apps/docs/src/lib/*-examples.ts`: literal complete example authorities, compiled
  by `scripts/prepare-component-examples.mjs` into the actual previews and shared
  human/agent source. Keep stable example IDs and meaningful keyboard/state notes.
- `scripts/prepare-agent-docs.mjs`: Markdown and structured discovery data from
  those same sources, including TypeScript-derived block/template APIs.
- `packages/mcp`: optional local read-only discovery over the generated public
  catalogue. Keep filesystem, network and application execution outside its tools.

Edit these authorities and regenerate; do not patch ignored generated output in
`apps/docs/src/lib/generated` or `apps/docs/public`. Keep human documentation,
agent documentation, registry requirements and installed source consistent.
Describe actual behaviour and host responsibilities without promising services
the library does not supply.

## Product direction

Prioritise useful controls and complete workflows, with clear typed contracts,
keyboard paths, focus handling and recovery from failed actions. Playground
expansion is lower priority unless explicitly requested. Read the ordered backlog
before selecting another large feature.

Keep white/light-grey surfaces, near-black text/actions and the #FFD900 accent,
crisp vector icons, consistent alignment, subtle shadows and shared easing.
Respect live reduced-motion preferences. Preserve third-party licence notices;
do not add design-inspiration names or promotional claims to product copy.

## Licensing and portable attribution

Keep original code under the existing MIT terms; do not add visible-credit,
anti-fork or access-key requirements. Preserve upstream authorship and complete
permission notices. Read docs/licensing.md and BRAND.md before changing source
attribution or distribution metadata.

Substantial UI, block and canonical example modules carry SPDX identifiers.
Copyable complete modules also carry the full applicable notice through the
shared licence helpers. Do not attach code banners to commands, configuration
values or import-only fragments. Human/agent exports must share the same source.

licenses/inventory.json records reviewed dependency/workspace metadata, canonical
notice contents and upstream provenance. Review changes before updating it;
never automatically accept the current output merely to make a check pass.
Keep canonical source paths distinct from starter, npm and registry mappings.
After generation run npm run test:licenses and npm run check:licenses. The
release generator checks notices before hashing, and CI checks distributions
before publication. Existing retained releases keep their original bytes.

## Build and verify

Use Node 22. After `npm ci`, run `npm run build` and `npm run typecheck`. The build
regenerates source distribution and documentation, and compiles the local MCP
server. `npm run dev` serves the showcase at `http://127.0.0.1:3120`.

Run focused regression checks for the behaviour changed. Build before browser
tests; Windows can use `PLAYWRIGHT_CHANNEL=msedge`. Do not share a Playwright
output directory or server port between simultaneous runs. Check source installs
and themed starters when public APIs or dependency graphs change. Use the pinned
Linux environment in `docs/visual-quality.md` for approved screenshots; never
accept new baselines automatically to hide a failure.

Report tests actually run and distinguish local, CI and deployed results.
Emulated WebKit is not a physical iPhone keyboard/zoom check. Do not invent
accessibility certification, adoption evidence, roadmap progress or effort hours.

## Source versions

Development is 0.3.0/unreleased; retained 0.2.0 is immutable. Read `releases/next.json`,
`releases/catalog.json` and `docs/updating-source.md` before release changes.
Generate manifests and receipts with the existing tools. Never replace retained
assets, move a published tag, remove a retained version or bypass release checks.
Current documentation must not imply an older installation contains newer APIs.

## Owner and release boundaries

Keep credentials, environment files, private planning and local artifacts out of
source and public documentation. Preserve repository-local SSH identity and Git
hooks. Do not change company/global Git, GitHub CLI, npm, SSH or Vercel settings,
or reuse unrelated account credentials.

Commit, push and deployment actions require an explicit owner request. Every
commit must use Jaison <26425317+jaskevs@users.noreply.github.com> as author and
committer, with no co-author trailer. Check the actual Australia/Melbourne time:
do not create code commits or push from 08:00 inclusive to 17:00 exclusive on any
day. Do not backdate, override dates or schedule a deferred action to bypass that
restriction. Local editing and verification can continue during those hours.

UI work is additional scope. Preserve the fixed Workbench milestones, exam window
and 135-hour baseline in private planning; do not infer their completion from UI
changes.
