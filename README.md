# BLD8 UI

React components, reusable blocks and complete interface examples. Built with Base UI, selected shadcn/ui compositions, Tailwind and original BLD8 styles. Both collections are free under MIT.

[Showcase](https://ui.bld8.dev) · [Registry](https://ui.bld8.dev/registry) · [Playground](https://ui.bld8.dev/playground) · [Outline](https://ui.bld8.dev/templates/outline)

## Install source

In a React 19 application with shadcn initialised:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/button.json
npx shadcn@latest add https://ui.bld8.dev/r/outline.json
```

The registry installs editable source under your configured UI directory in `bld8/`, resolves runtime dependencies and includes compiled styles and licences. It respects custom aliases and keeps existing components separate. For default aliases:

```tsx
import { Button } from '@/components/ui/bld8/button';

<Button variant="accent">Save changes</Button>
```

Wrap overlays in `UIProvider` from `bld8/overlays` and set `body { position: relative; }` in global CSS. Review overwrite prompts when updating customised source. Read [registry details](docs/registry.md).

Alternatively, download any block or template starter from the showcase, unzip, run `npm install` and `npm run dev`. The ZIP includes local workspace packages; no BLD8 npm package is required.

## Develop locally

Use Node 22:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3120. UI source, blocks and styles rebuild on save.

```sh
npm run build
npm run typecheck
npm test
```

For an installed Edge browser on Windows, set `PLAYWRIGHT_CHANNEL=msedge`. Tests start a fresh production server on 3121; set `BLD8_UI_TEST_PORT` to another free port when necessary. Build before testing. See [contributing](CONTRIBUTING.md) for release and repository conventions.

## What is included

- 43 component guidance entries, eight blocks and three templates.
- 1,877 canonical Lucide icons with consistent defaults and downloadable licensed SVGs.
- A playground for fourteen controls, including dialogs, drawers, multi-selects, calendars, dates and tables, with validated shareable URLs and complete client-component code.
- A shadcn-compatible registry, source manifests and thirteen runnable ZIP starters.
- Light/dark tokens, smooth shared easing, keyboard focus and reduced-motion behaviour.
- Form state with async validation, field/service errors, dirty state, abortable submission and stale-result protection.
- Tables with local or externally controlled queries, selection across pages, facets, visible columns, resizing, pinned columns and CSV export.

Outline is the complete local reference application. It saves projects, resource metadata and preferences in browser storage. Project workflows cover creation, editing, filtering, sorting, paging, bulk changes, deletion, duplicate validation and unsaved-draft confirmation. The HTTP adapter and runnable sample API demonstrate the same flows over a service connection. Production authentication, database persistence and file storage belong to the host application. Other templates use in-memory sample data.

## Structure

- `packages/ui/src`: public components, typed APIs, CSS and tokens.
- `packages/blocks/src`: reusable compositions, Outline application and its repository adapter.
- `apps/docs/src`: catalogue, previews, playground and installation guidance.
- `examples`: canonical HTTP server and React Hook Form examples.
- `scripts/library-catalog.mjs`: block/template metadata.
- `scripts/prepare-library.mjs`: source views and allowlisted ZIP starters.
- `scripts/prepare-registry.mjs`: real registry items and dependency graph.
- `scripts/prepare-api.mjs`: complete prop tables derived from the public TypeScript APIs.
- `tests`: browser behaviour, responsive layout, workflow and automated accessibility checks.

## Styling and ownership

White panels on neutral-grey backgrounds, near-black primary actions and warm yellow accents. Tailwind utilities use the `bui:` prefix without Preflight; packages and registry items include compiled CSS. Existing components can be used without a Tailwind build. Add ordinary CSS or your own Tailwind setup for new utility classes.

All original source uses MIT. Keep the included notices for Base UI, shadcn/ui, Lucide and React DayPicker. [Upstream records](docs/upstream.json) identify adapted source. Package names remain private/unpublished on npm; source installation is available through the registry and starters.

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
