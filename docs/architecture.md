# Architecture and foundation choice

Decision: React first, Base UI for behaviour, selected shadcn/ui Base UI compositions, Tailwind authoring and original BLD8 tokens/motion. Updated with user approval on 13 October 2026.

## Options considered

- Base UI plus a styled layer: selected. Its unstyled primitives let the project retain its own CSS and visual identity, while upstream maintains complex interaction behaviour.
- Adapt shadcn/ui: now selected for scoped Base UI composition patterns. Drawer, context menu, sidebar and button variants are the first adaptations. Their styling and APIs are adapted to BLD8. The pinned revision, original paths and hashes are in docs/upstream.json; the complete MIT notice ships in SHADCN_LICENSE.
- Fork an entire library: unnecessary for this initial release; it would add upstream reconciliation work unrelated to the intended visual and component API work.
- Generate every interaction from scratch: avoid reimplementing focus management, keyboard selection and popup behaviour without a need.

## Boundaries

`packages/ui` compiles to an ESM package with declarations and a separate CSS entry point. React and React DOM are peers. Base UI stays a normal runtime dependency. Native HTML handles simple fields, switches, checkboxes and radio groups. Complex selection, overlays, tabs, accordion and toast use Base UI.

`apps/docs` is a Next.js consumer of the built package. It supplies fonts, page layout, fixtures, demo actions and short usage guidance. The development runner watches package TS and CSS so the docs update after a save. Package source does not import Next.js.

Themes live in namespaced CSS variables. Set the theme on the document root so portal content inherits it. Every application still owns meaningful labels, content, errors and data handling. App composition requires its own accessibility validation.

## Application workflows - 13 October 2026

MultiSelect and CommandPalette use Base UI Combobox for keyboard interaction.
CommandPalette composes a controlled Dialog and targets its input via initialFocus.
The consuming app owns navigation. Shortcut registration is opt-in, once per app.
Popup positioners sit above dialog surfaces so nested calendars/selects work.

React DayPicker 10.0.2 supplies calendar date math and keyboard navigation, with
BLD8 token-based styling. Date/range inputs compose Base UI Popover. Date-only
hidden values use local year/month/day rather than toISOString. Calendar locale
and display locale are separate. Required-date validation belongs to the app.

FileUpload owns local file selection/validation; its optional transport callback
receives an AbortSignal and per-file progress. A run counter rejects stale work
after cancellation or unmount. The showcase labels its callback simulation.

DataTable retains the native-table API for client datasets. Rows require stable,
unique keys. Selection is independent of filtering/pagination; the header selects
the current page. Visibility preserves non-hideable columns and at least one
column. CSV reads explicit exportValue/sortValue scalars rather than React cells.
Server pagination, virtualization and resizing need a separate future contract.

ProjectPlanner and ResourceManager expose service/update callbacks; default state
is local metadata. Outline keeps inactive views mounted so edits survive switching.
All eleven starters include their compiled packages, editable source and notices.
The DayPicker licence is included in packed UI files and starter bundles.

## Next decisions

MIT was selected by the user on 13 October 2026. The npm namespace remains undecided. The showcase now supplies runnable ZIP starters with local UI/blocks workspaces and generated source manifests, so reuse does not depend on npm publication. An Angular implementation would share tokens and design decisions, while using Angular-native component behaviour; React wrappers cannot be reused directly.

## Blocks and interface starters - 13 October 2026

`packages/blocks` is a second framework-independent React package. The showcase
imports its public exports; it does not contain alternate demo implementations.
Eight compositions and three interface starters use the existing UI primitives.

`scripts/library-catalog.mjs` is the metadata source of truth. Build preparation
compiles blocks, generates ignored typed metadata/source modules and static JSON
source manifests, then creates ZIP starters using an explicit file allowlist.
The ZIP writer uses Node's standard compression and standard ZIP headers/CRC32;
no new runtime or archive dependency was added. Starters contain a minimal Next.js
consumer, package manifests, compiled distributions, editable source and licences.
No parent workspace, .env, credentials or installed dependencies are included.

Generated downloads and `/r` manifests are available without accounts or keys.
The manifest is a documented BLD8 format, not shadcn registry compatibility or an
MCP server. React 19 remains the peer requirement. Templates own local view state;
real authentication, persistence and backend behaviour remain consumer concerns.

## Uniform icon family - 13 October 2026

Lucide React 1.55.0 is an installed dependency. Application code passes named
icon components to the BLD8 Icon wrapper. Standard icons share size, stroke,
colour inheritance and accessibility rules; the dotted BLD8 arrow remains
original artwork. The wrapper keeps the existing small name API compatible.

The documentation's full directory is separate from that consumer API.
`prepare-icons.mjs` uses the installed package's dynamic imports and `__iconData`
only in Node at build time. It deduplicates aliases, renders canonical SVGs with
upstream licence notices, and emits typed name/category metadata. The docs client
loads SVG previews for its paginated results rather than all React icon modules.
The generator/version fingerprint caches unchanged outputs. This internal
metadata contract must be reviewed when updating Lucide.

InputGroup and Button/IconButton icon props compose these same public exports.
The library has no Next.js icon dependency, CDN requirement or dynamic icon
loader in ordinary consumer code. ZIP starters include Lucide as a pinned npm
dependency and its licence notices.

## Sources checked 28 September 2026

- https://base-ui.com/react/overview/about
- https://base-ui.com/react/overview/quick-start
- https://ui.shadcn.com/docs
- https://www.spartan.ng/documentation/introduction

Base UI 1.8.0, React 19.3.0 and Next.js 16.3.8 are pinned in the lockfile. Review upstream release notes and run the suite before updates.
