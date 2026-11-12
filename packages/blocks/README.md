# BLD8 blocks

Reusable React workflows composed from BLD8 UI controls, including forms, data
workspaces, task boards, calendars and the Outline reference application. Public
props, runnable source and host-service contracts are documented in the
[block guide](https://ui.bld8.dev/blocks) and
[template guide](https://ui.bld8.dev/templates).

## Install source

The npm package is private and unpublished. Use the editable
[registry](https://ui.bld8.dev/registry) or a supplied Next.js or React + Vite
starter. Starters include the required UI and blocks packages as local
workspaces. See the [framework guide](https://ui.bld8.dev/frameworks).

In a React 19 application with shadcn initialised:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/session-setup.json
```

Import from the installed files using your configured UI alias. For the default
alias, SessionSetup is available from
@/components/ui/bld8/blocks/session-setup. Registry dependencies resolve shared
controls, styles and notices. In a local workspace, import @bld8/ui/styles.css
and @bld8/blocks/styles.css once. Wrap overlays in UIProvider from bld8/overlays
(or @bld8/ui in a local workspace) and keep body { position: relative; } in the
host stylesheet.

## State and service boundaries

Outline is a browser-persisted reference for project forms and tables. It
supports validation, draft recovery, inline name/date/status editing, deletion,
filtering, sorting, paging, bulk changes and CSV export. Profile preferences and
resource metadata also survive reloads. Browser storage belongs to this local
example; it does not provide shared multi-user persistence.

The pure @bld8/blocks/outline-http subpath exports createOutlineHttpRepository
for the documented JSON contract. The optional Outline HTTP and React Hook Form
starters include a runnable API with temporary session-scoped data. Connect the
repository contract to your own backend for authenticated ownership, durable
data and uploaded file storage.

EditableCell retains failed drafts and captures the edit-start revision for
concurrency checks. Optional RHFField and RHFControl bindings from
@bld8/ui/react-hook-form connect native and controlled inputs to a host form;
install the react-hook-form registry integration explicitly. Application and
server validation remain host responsibilities.

Table workflows support controlled queries, resizing, pinned columns and
optional grouping. LargeIssueTable keeps its detail draft outside rows and
provides a paged alternative to the separate bounded WindowedTable view. Other
blocks expose typed callbacks and service contracts; their frontend source does
not supply production authentication, database persistence or file hosting.
See [developer and agent guidance](https://ui.bld8.dev/agents) and
[source versions](https://ui.bld8.dev/releases) before updating customised source.

## Licence and provenance

All original block and template source is free under the [MIT licence](LICENSE),
copyright 2026 Jaison. Preserve the copyright and full permission notices with
copies or substantial portions of the software. No visible BLD8 logo, footer
credit or link is required.

The UI dependency carries its own LICENSE, THIRD_PARTY_NOTICES.md, UPSTREAM.json
and included upstream licence files. In a starter these are under packages/ui;
in a registry installation they are under bld8/licenses. The upstream ledger
records pinned adaptations and distribution-specific path mappings. Preserve
the applicable original notices, including the shadcn/ui notice for adapted
source. Installed external dependencies retain their own licences. See the
[licensing guide](https://ui.bld8.dev/licensing).
