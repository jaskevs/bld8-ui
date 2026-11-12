# BLD8 UI

React components, reusable blocks and complete interface examples. Built with Base UI, selected shadcn/ui compositions, Tailwind and original BLD8 styles. Original BLD8 source is free under MIT, with applicable third-party notices included.

[Documentation](https://ui.bld8.dev/docs) · [React, Vite & Next.js guide](https://ui.bld8.dev/frameworks) · [Community](https://ui.bld8.dev/community) · [Showcase](https://ui.bld8.dev) · [Registry](https://ui.bld8.dev/registry) · [Playground](https://ui.bld8.dev/playground) · [Outline](https://ui.bld8.dev/templates/outline)

[Core component guide](docs/core-components.md) · [Developer and coding-agent guide](docs/agents.md) · [Documentation index](https://ui.bld8.dev/llms.txt) · [Structured catalogue](https://ui.bld8.dev/agent/catalog.json)

## Install source

In a React 19 application with shadcn initialised:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/button.json
npx shadcn@latest add https://ui.bld8.dev/r/outline.json
```

For retained source, choose a published version from [Source versions and receipts](https://ui.bld8.dev/releases) and use its versioned registry URL. Save its source manifest and capture a clean-install receipt before customising.

The registry installs editable source under your configured UI directory in `bld8/`, resolves runtime dependencies and includes compiled styles and licences. It respects custom aliases and keeps existing components separate. For default aliases:

```tsx
import { Button } from '@/components/ui/bld8/button';

<Button variant="accent">Save changes</Button>
```

Wrap overlays in `UIProvider` from `bld8/overlays` and set `body { position: relative; }` in global CSS. Review overwrite prompts when updating customised source. Read [registry details](docs/registry.md) and [source update guidance](docs/updating-source.md).

Alternatively, choose Next.js or React + Vite for any block or template, unzip the starter, then run `npm install` and `npm run dev`. Next.js opens on port 3000; Vite opens on 5173, or the available port printed by the server. The ZIP includes local workspace packages; no BLD8 npm package is required.

## Develop locally

Use Node 22:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3120. UI source, blocks and styles rebuild on save.

[Current handoff](docs/handoff.md) records the local review, publication state and next slice.

```sh
npm run build
npm run typecheck
npm run test:licenses
npm run check:licenses
npm run check:starter:vite
npm run check:starter:uploads
npm run check:registry:consumers
npm run check:starters:themes
npm test
```

For an installed Edge browser on Windows, set `PLAYWRIGHT_CHANNEL=msedge`. Tests start a fresh production server on 3121; set `BLD8_UI_TEST_PORT` to another free port when necessary. Build before testing. See [contributing](CONTRIBUTING.md) for release and repository conventions. [CI and Vercel setup](docs/ci-and-vercel.md) explains the personal-account connection and required release checks.

## What is included

- 72 component families, 117 complete named examples, eighteen blocks and three templates. Families and examples are counted separately.
- A searchable example catalogue with exact URLs, real previews and individual source registry installs. Example modules follow the same lean dependency graph in Next.js and Vite.
- FacetedFilter, Fieldset and CheckboxGroup with native form contracts; linked error summaries, async read-only/reset parity and atomic DataGrid bulk edits.
- Autocomplete, Toolbar, AlertDialog, NavigationMenu and PreviewCard compositions on the installed Base UI primitives, with explicit keyboard, focus and recovery contracts.
- Complete, build-typechecked client examples share their actual preview source with human and agent documentation.
- Rich grouped choices, checked hierarchical TreeSelect, composable menus, TagInput, ToggleGroup, RangeSlider and one-native-input code entry.
- Editable date fields with native forms, range presets and confirmation; typed date/checkbox/multi-value grid editors and public custom cell/editor hooks.
- Shareable category/capability filters, related controls and portable optional DataGrid layouts, pinning, resizing and touch/keyboard multi-sort.
- 1,877 canonical Lucide icons with a stable gallery, semantic search, keyboard browsing, saved icons and shareable selected previews. Try common button examples and export sized, licensed SVGs or complete React usage.
- A 21-control playground with native choices, disclosures, overlays, dates, boards, trees, charts and table/filter workflows. Share validated configurations, try keyboard interactions and copy or download matching client-component code. See [playground guidance](docs/playground.md).
- A shadcn-compatible registry, source manifests and 47 runnable ZIP starters: 25 Next.js and 22 React + Vite.
- An optional DataGrid and complete Data Workspace: typed batch review, atomic saves, conflict recovery and durable local HTTP references. Read [the workflow contract](docs/data-workspace.md).
- Light/dark tokens, smooth shared easing, keyboard focus and reduced-motion behaviour.
- A theme lab with three presets, real block/template previews, contrast checks, shareable URLs and portable CSS export. Choose a starter and download a themed Next.js or Vite project with its selected fonts and configuration. See [theme setup](docs/theme-lab.md).
- Form state with async validation, field/service errors, dirty state, abortable submission and stale-result protection.
- Tables with local or externally controlled queries, selection across pages, facets, visible columns, resizing, pinned columns and CSV export. Grouped pages and a separate bounded scrolling table share column APIs; a 10,000-record issue workspace demonstrates external detail drafts. See [large tables](docs/large-tables.md).
- Optional SortableDataTable adds pointer/touch ordering, with keyboard positions and host-owned row saves. Ordinary tables keep drag dependencies out. [Ordering and saved layouts](docs/table-views.md) explain the contract.
- A reusable Kanban control and task workspace with Board/Backlog views, pointer/touch sorting, keyboard moves, column limits, rollback, retry and an abortable save callback.
- Bounded line/bar/area charts with keyboard exploration, missing-value gaps and exact data tables, composed in an analytics dashboard with abortable reports and CSV export. See [charts and analytics](docs/charts-and-analytics.md).
- A keyboard-friendly Tree and file-browser block with folder navigation, metadata inspection, abortable lazy loading and recoverable failures. See [the service contract](docs/file-browser.md).
- A day agenda and schedule planner with supplied UTC availability, explicit offsets, revision-checked booking callbacks and recoverable drafts. See [scheduling](docs/scheduling.md).
- A week/month event calendar and abortable calendar workspace with overlap, multi-day events, explicit time zones and responsive day agendas. See [calendar workflows](docs/calendar-workflows.md).
- Nested all/any/not filters preserve earlier flat links. Async Combobox/MultiSelect and Cascader add bounded remote search, retained labels, paging and keyboard recovery. See [nested filters](docs/nested-filters.md), [remote choices](docs/async-selection.md) and [hierarchical selection](docs/cascader.md).
- A per-file upload queue and raw HTTP adapter with actual byte progress, cancellation, stable retry IDs and server acknowledgements. The Next.js HTTP starter receives, hashes and discards bytes. See [upload workflows](docs/upload-workflows.md).
- Stepper, locale-aware numeric entry and a time picker, combined in a validated session setup with tab drafts and recoverable saves.

Outline is the complete local reference application. It saves projects, resource metadata and preferences in browser storage. Project workflows cover creation, a detail drawer with tab-local draft recovery, conflict review, inline editing, filtering, sorting, paging, bulk changes with guarded undo, plain-text comments, activity history, deletion and duplicate validation. See [project details](docs/outline-details.md). The HTTP adapter and runnable sample API demonstrate the same flows over a service connection. Production authentication, database persistence and file storage belong to the host application. Other templates use in-memory sample data.

## Structure

- `packages/ui/src`: public components, typed APIs, CSS and tokens.
- `packages/blocks/src`: reusable compositions, Outline application and its repository adapter.
- `apps/docs/src`: catalogue, previews, playground and installation guidance.
- `examples`: canonical HTTP server and React Hook Form examples.
- `scripts/library-catalog.mjs`: block/template metadata.
- `scripts/prepare-library.mjs`: source views and allowlisted ZIP starters.
- `scripts/prepare-registry.mjs`: real registry items and dependency graph.
- `scripts/prepare-api.mjs`: complete prop tables derived from the public TypeScript APIs.
- `scripts/prepare-agent-docs.mjs`: public Markdown and a structured component/block/template catalogue, generated from the same metadata and TypeScript exports.
- `packages/mcp`: optional read-only local MCP discovery over the generated public catalogue.
- `tests`: browser behaviour, responsive layout, workflow and automated accessibility checks.

## Styling and ownership

White panels on warm light-grey backgrounds, near-black primary actions and golden yellow accents. Champagne selection surfaces and related evergreen and mint chart shades complement the accent. Forest-green success and warm-brick error pairs keep status clear while geometry and motion stay consistent. See [selection styling](docs/selection-style.md). Tailwind utilities use the `bui:` prefix without Preflight; packages and registry items include compiled CSS. Existing components can be used without a Tailwind build. Add ordinary CSS or your own Tailwind setup for new utility classes.

All original source uses MIT. [Licensing and attribution](docs/licensing.md) explains source labels, portable provenance, distribution checks and dependency review. [Brand usage](BRAND.md) distinguishes official releases without adding restrictions to MIT. No visible credit is required in your application. Keep the included notices for Base UI, shadcn/ui, Lucide, React DayPicker, Motion and dnd-kit. [Upstream records](docs/upstream.json) identify adapted source. Package names remain private/unpublished on npm; source installation is available through the registry and starters.

Source: [jaskevs/bld8-ui](https://github.com/jaskevs/bld8-ui). [Deployment](docs/deployment.md) and [verification](docs/verification.md) record the current release setup.


## Form and HTTP integrations

The optional React Hook Form adapter is exported from `@bld8/ui/react-hook-form`.
It binds labels, field errors, touch and focus for native and controlled inputs.
Core UI imports do not require React Hook Form. The guide at
`/integrations/react-hook-form` includes a runnable HTTP-backed form and starter.

`createOutlineHttpRepository` from `@bld8/blocks/outline-http` implements the
Outline JSON contract with abortable fetch, payload checks, 422 field errors and
409 version conflicts. `/examples/outline-http` demonstrates the service flows.
The sample API has bounded, temporary session data; authenticated ownership and
real database persistence belong to the consuming application.

Outline supports inline name, date and status editing. EditableCell validates,
preserves failed drafts and captures the edit-start revision so newer writes
cannot be silently overwritten. Enter saves and Escape cancels. See
`docs/workflow-integrations.md` for the integration boundaries.

## Library direction

All components, blocks and templates remain free under MIT. React is the shared
foundation; Next.js guidance covers application integration. Read
[the ordered expansion plan](docs/library-direction.md) for the next workflow
increments and their release requirements. The ActivityFeed block composes the
Timeline control with search, type filters, local reveal and service states.

The reusable packages are independent of the app framework. Vite starters include
React Fast Refresh, TypeScript and a static build; the two HTTP-backed integration
ZIPs currently retain their Next.js sample API. See the framework guide before
moving routing, server functions, environment wiring or data between applications.


## Visual and browser quality

The separate quality suite compares approved Linux screenshots and checks focused
normal-motion workflows in Chromium, Firefox and WebKit. Run npm run test:quality
in the pinned environment described in [visual quality](docs/visual-quality.md).
Missing or changed baselines fail; CI never updates them automatically. See
[clean registry consumers](docs/registry-consumer-checks.md) for independent
source installation and [release checks](docs/ci-and-vercel.md) for the aggregate
production gate. WebKit coverage is not a claim of real-device Safari testing.
