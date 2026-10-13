# BLD8 UI

A React component library, reusable blocks and a Next.js showcase. Free and Premium collections are both free under MIT. The original first implementation was 28 September 2026; the library expansion was requested on 13 October.

Live showcase: https://bld8-ui.vercel.app. See [deployment details](docs/deployment.md).

Base UI supplies complex interaction behaviour. Selected shadcn/ui Base UI composition patterns are adapted into the library, with Tailwind for new component styling and original BLD8 tokens, motion and APIs. The package ships compiled CSS; consuming applications do not need a Tailwind build. See docs/tailwind-and-shadcn.md and docs/upstream.json for the authoring workflow and provenance.

## Run locally

Use Node 22.x. From this directory:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3120. Source changes in both the package and showcase refresh locally. Stop with Ctrl+C. The website continues on port 3117. Try [the motion studies](http://127.0.0.1:3120/motion) for tabs, switches, loading, accordion and overlay interactions.

```powershell
npm run build
npm run typecheck
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm test
npm run pack:ui
```

The tests start a fresh production showcase on port 3121. Build first. If that port is occupied, set BLD8_UI_TEST_PORT to a free port (for example 3122); the suite still starts its own fresh server. Without the Edge channel, install Playwright Chromium using `npx playwright install chromium`.

## Structure

- `packages/ui/src`: reusable React components, typed APIs, styles and tokens.
- `packages/ui/dist`: generated JavaScript, declarations and CSS.
- `packages/blocks/src`: eight reusable compositions and three interface templates, using the public UI exports.
- `apps/docs/src`: home, searchable component/block/template catalogues, preview/source explorers, $0 collections, motion studies and usage guide.
- `scripts/library-catalog.mjs`: block/template metadata, categories and collection labels.
- `scripts/prepare-library.mjs`: source manifests and runnable Next.js ZIP starters, generated from an explicit file allowlist during builds.
- `tests`: interactive behaviour, responsive layouts and automated accessibility.
- `docs`: architecture, scope and verification.

The catalogue has 40 guidance entries, eight blocks (four Free and four Premium)
and three Premium templates. Every collection costs $0 with no signup, payment,
unlock or licence key. Premium means fuller composition, not paid access.

## Working application patterns

- MultiSelect searches stable option IDs and supports removable chips, disabled
  choices, form values and validation descriptions.
- CommandPalette supplies keyboard navigation, keyword search and action callbacks.
  The showcase uses it for library search with Ctrl/Command+K.
- Calendar, DatePicker and DateRangePicker use pinned React DayPicker 10.0.2,
  bounds, keyboard navigation and local date-only form values.
- FileUpload validates count/type/size, handles browse/drop/removal and accepts an
  async transport callback with progress, cancellation and retry. Without that
  callback no file leaves the browser. Server checks remain application concerns.
- DataTable retains its original API and adds page selection, mixed state,
  selection across filters/pages, visible columns, facets, compact density,
  bulk action slots and loading/error/retry. createTableCSV exports scalar metadata
  with quoting and formula escaping.
- ProjectPlanner and ResourceManager compose those APIs into working flows.
  Outline keeps view state mounted while navigating. Provide callbacks for file
  storage, authentication and persistent application data.

Preview /components, /blocks/project-planner, /blocks/resources and
/templates/outline on the local server. All eleven ZIP starters include editable
source, compiled packages and the dependency notices.

## Icons and composed controls

The `/icons` directory covers 1,877 canonical icons from pinned Lucide React
1.55.0. Browse by name/category, preview sizes/strokes, copy React usage or SVG,
and download the SVG with its licence notices. Mobile selection opens the
existing BLD8 Sheet inspector; desktop has a sticky preview panel.

```tsx
import { Search, Save } from 'lucide-react';
import { Icon, IconButton, Button, Field, InputGroup, Input } from '@bld8/ui';

<Icon icon={Search} />
<IconButton icon={Search} label="Search" />
<Button leadingIcon={Save}>Save changes</Button>
<Field label="Search projects">
  <InputGroup leading={<Icon icon={Search} />}>
    <Input type="search" />
  </InputGroup>
</Field>
```

Icon defaults are 18px, stroke 1.75 and currentColor. Supply `label` for a
meaningful standalone icon; icons accompanying text stay decorative. Icon-only
buttons require a label. Existing short names and dotted BLD8 arrows are retained.
Button supports leading/trailing Lucide components. InputGroup supports icons,
text adornments and labelled actions while retaining native field semantics.

Use named Lucide imports in applications. The entire icon directory is generated
as SVG assets and name metadata at build time; it is not a generic application
icon-name loader. Lucide retains its ISC/MIT notices in `packages/ui/LUCIDE_LICENSE`
and SVG downloads. Original BLD8 code remains MIT. Generated assets are ignored.

## Design direction

Borderless white panels on a light-grey canvas, near-black primary actions and warm yellow accents (#ffe24a). Motion uses shared easing and timings, stable hover targets, a moving tab indicator and loading states that keep their width. Read [design and motion](docs/design-and-motion.md) for the decisions and reduced-motion behaviour.

## Using the package

```tsx
import '@bld8/ui/styles.css';
import { UIProvider, Button } from '@bld8/ui';

export function App() {
  return <UIProvider><div style={{ isolation: 'isolate' }}><Button>Save changes</Button></div></UIProvider>;
}
```

Set `body { position: relative; }` for Base UI overlay backdrops. In Next.js, put the global stylesheet in the root layout and event handlers in a Client Component. The package itself has no Next.js dependency.

For another app, build and pack this workspace, then install the resulting local tarball. `@bld8/ui` is a local workspace name; no public namespace has been reserved and nothing has been published to npm.

## Status and ownership

The user selected MIT on 13 October 2026 for all original BLD8 UI/blocks/source. Keep the included notices when distributing it. Base UI is also MIT-licensed; attribution is recorded in `packages/ui/THIRD_PARTY_NOTICES.md`. Packages remain marked private to prevent accidental npm publication; source access and MIT reuse are independent of npm publication. No public namespace has been reserved.

ZIP starters include a Next.js app, compiled local packages, editable source and notices. Unzip, run `npm install` and `npm run dev`, then open localhost:3000. They are frontend starters: authentication, persistence and backend services belong to the consuming application. Library JSON manifests at `/r/index.json` are our own simple source format, not shadcn-compatible registry items or an MCP server.

The earlier showcase is deployed to personal Vercel. The October expansion is included in the 13 October source release. Deploying that expansion remains a separate step. Source: [jaskevs/bld8-ui](https://github.com/jaskevs/bld8-ui), public by user choice. It is an independent repository with the isolated personal remote. Automatic Git deployment is not connected. Preserve the repository-local personal SSH identity and commit guards. Any future commits must use Jaison <26425317+jaskevs@users.noreply.github.com> as both author and committer, with no co-author trailers.
