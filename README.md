# BLD8 UI

A React component library and public Next.js showcase. First implementation: 28 September 2026.

Live showcase: https://bld8-ui.vercel.app. See [deployment details](docs/deployment.md).

The recommended approach is a custom styled layer on the maintained Base UI primitives. The library adds BLD8 colours, typography, spacing, motion, composed APIs and examples. It does not fork Base UI or shadcn, and it does not change the portfolio website.

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
- `apps/docs/src`: home, searchable catalog, 28 component/pattern pages, motion studies, foundations, examples and usage guide.
- `tests`: interactive behaviour, responsive layouts and automated accessibility.
- `docs`: architecture, scope and verification.

The catalog groups 31 component families into 28 entries (Input/Field, Spinner/Skeleton and Card/Separator share entries). Icon and provider helpers are additional exports. See `docs/scope.md` for the exact release boundaries.

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

This is an initial implementation with a public showcase, not a claim of a mature or fully audited system. The public licence is pending, so the package is marked private and UNLICENSED. Base UI is MIT-licensed; attribution is recorded in `packages/ui/THIRD_PARTY_NOTICES.md`.

The showcase is deployed to personal Vercel. Source is tracked in its own Git repository with the personal remote jaskevs/bld8-ui. Automatic Git deployment is not connected. Preserve the repository-local personal SSH identity and commit guards. Any future commits must use Jaison <26425317+jaskevs@users.noreply.github.com> as both author and committer, with no co-author trailers.