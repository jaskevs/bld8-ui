# BLD8 UI

React controls, typed helpers and styles for forms, choices, navigation, overlays,
date fields, uploads, tables and data editing. Interactive components preserve
client boundaries; pure helper subpaths can be used independently. Public APIs,
complete examples and service contracts are documented in the
[component guide](https://ui.bld8.dev/components).

## Install source

The npm package is private and unpublished. Use the
[framework guide](https://ui.bld8.dev/frameworks), editable
[registry source](https://ui.bld8.dev/registry), or a supplied Next.js or React +
Vite starter. Starters include the required packages as local workspaces.

In a React 19 application with shadcn initialised:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/button.json
```

Import from the installed files using your configured UI alias. For the default
alias, Button is available from @/components/ui/bld8/button. Registry components
import their supplied CSS. In a local workspace, import @bld8/ui/styles.css once.
Wrap overlays in UIProvider from bld8/overlays (or @bld8/ui in a local workspace)
and keep body { position: relative; } in the host stylesheet. Shipped Tailwind
utilities are compiled without Preflight; new utility classes need your own
Tailwind build or ordinary CSS.

## Complete examples

The [example catalogue](https://ui.bld8.dev/components/examples) gives each complete
pattern its own preview and install command. Install example-<id>.json through
the registry to receive bld8/examples/<id>.tsx plus its actual component modules.
Relative imports follow your configured UI alias. Workspace/starter code uses
@bld8/ui; the npm package is not published.

Autocomplete accepts free text; Combobox commits a selected record. Toolbar
groups mixed keyboard actions. AlertDialog confirms a consequential action with
Cancel-first focus and abortable retry. NavigationMenu groups destination links;
PreviewCard adds supplementary visual context without replacing the destination.

## Integration boundaries

EditableCell supports explicit text/date/select edits, async save recovery and
an edit-start revision for concurrency checks. DataTable supports controlled
queries, resizing, pinned columns and optional grouping. WindowedTable displays
complete supplied records in a bounded scrolling view; LargeIssueTable keeps
its detail draft outside rows and supplies a paged alternative.

React Hook Form bindings are optional: import RHFField and RHFControl from
@bld8/ui/react-hook-form in a local workspace. Input refs, blur and field errors
connect native and controlled inputs to the host form. Registry items
react-hook-form and react-hook-form-example add that dependency explicitly.
The adapter does not replace application or server validation.

Authentication, authorised ownership, durable data, uploaded file storage and
service writes belong to the consuming application. Use the documented typed
callbacks and repository contracts to connect those services. See
[developer and agent guidance](https://ui.bld8.dev/agents) and
[source versions](https://ui.bld8.dev/releases) before updating customised source.

## Licence and provenance

All original source is free under the [MIT licence](LICENSE), copyright 2026
Jaison. Preserve the copyright and full permission notices with copies or
substantial portions of the software. No visible BLD8 logo, footer credit or
link is required.

[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) identifies upstream dependencies
and their included licence files. [UPSTREAM.json](UPSTREAM.json) records the
pinned shadcn/ui adaptations and maps canonical source paths to starter, npm and
registry locations. Selected distributions include only their required modules.
Keep the applicable original upstream notices, including
[SHADCN_LICENSE](SHADCN_LICENSE), when redistributing adapted source. The
[licensing guide](https://ui.bld8.dev/licensing) explains these boundaries.
