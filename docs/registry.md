# Source registry

The registry installs editable component, block and template source through the
shadcn CLI. Shared modules, compiled styles and third-party notices are resolved
through the same dependency graph. No account, licence key or BLD8 npm package
is required. All original library source is free under MIT.

## Install

Initialise shadcn in your React application, then run:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/button.json
npx shadcn@latest add https://ui.bld8.dev/r/session-setup.json
```

The default UI alias installs source under components/ui/bld8. Custom aliases
are supported; each registry target uses @ui/bld8 instead of assuming a particular
source folder. Import from the installed files, not from unpublished @bld8 npm
packages. The framework guide covers Next.js client boundaries and React/Vite.

Wrap overlays in UIProvider from the installed bld8/overlays module. Keep
body { position: relative; } in the host stylesheet. Installed compiled BLD8 CSS
includes the shipped prefixed Tailwind utilities without Preflight. Edit the
supplied CSS or configure your own Tailwind build for new utility classes.

## Installation contract

The representative SessionSetup graph includes its controls, server-safe time
and validation helpers, compiled styles, and required notices. A Next.js Server
Component can evaluate the pure helpers; interactive controls retain their client
boundary. The independent Vite consumer verifies a custom ~/ui alias. The actual
CLI installation and build procedure is in registry-consumer-checks.md and is
part of the prepared release workflow.

The current local build contains 147 registry items, including shared dependencies
and the pure theme-config helper. The published release still contains 121 items
until this increment is separately released.
Component guidance counts and item counts describe different things; see scope.md
for the current catalogue. Generated output is built from the checked source and
must retain production dependency URLs. Local consumer checks rewrite dependency
URLs in memory only and verify that generated public files remain unchanged.

## Integrations and service boundaries

Optional items include react-hook-form, react-hook-form-example, editable-cell
and outline-http. React Hook Form is added only when explicitly installed. The
HTTP/form starters supply a runnable reference API; Vite catalogue starters are
client applications and need a separate backend for service behaviour.

Examples distinguish browser storage, session memory and callback-based saves.
Authentication, authorised ownership, durable data and uploaded file storage
belong to the host application. An installed frontend block does not supply a
production service by itself.

## Updating copied source

Commit your own changes before an update. Inspect the CLI overwrite prompts and
review the resulting diff before replacing customised files. The current public
URLs track the published release; immutable release URLs and a formal migration
feed remain future adoption work. Preserve the included dependency notices.

Source ZIPs are an alternative to registry installation. See /frameworks for
Next.js and Vite setup and /registry on the showcase for item discovery.
