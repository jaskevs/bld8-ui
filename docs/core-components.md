# Core components and complete examples

The catalogue distinguishes component families from named examples, blocks,
templates and icon assets. A new variant does not create a new component family.
All original source remains MIT; framework starters target React 19 with Next.js
or Vite. No BLD8 package publication or hosted account is needed for source reuse.

## Choosing and installing

Use category, capability and text filters on `/components`. Filter URLs can be
shared and browser Back/Forward restores them. Related-control links distinguish
local choices from remote choices and ordinary tables from editable grids.

Install a family through its registry URL after initialising shadcn. Named example
source has two formats: workspace/starter imports from `@bld8/ui`, and installed
source imports from the default `@/components/ui/bld8/` alias. Adjust the alias to
match your project. Include the stylesheet once. Examples using provider-backed helpers include
`UIProvider`. Applications can share that provider around their overlays; keep `body { position: relative; }` in installed applications.

Every named example is a complete client module with its own imports, data and
state. The documentation preview loads that same module, and the build typechecks
it. Examples labelled local demonstrate UI behaviour, not production services.
The short quick-reference snippets remain deliberately incomplete.

## Choices and menus

`Option.value` is a stable ID; its label can change. Local Select, Combobox and
MultiSelect support optional descriptions, Lucide icons and groups. Combobox and
MultiSelect also search descriptions and search terms; Select typeahead uses labels.
Combobox retains its string `items` convenience API; `options` takes precedence
when supplied. Empty results, disabled choices, hints, errors, required names,
input refs and blur are explicit. Presentational custom rows must not contain
interactive controls. Async choices retain their separate abortable/paged source
and selected-label recovery contracts.

DropdownMenu accepts its existing action objects and discriminated groups,
separators, submenus, checkbox items and radio groups. Checked choices can remain
open; actions dismiss and restore focus. Nested menu arrows and Escape follow the
same primitive focus model. Callbacks perform host actions; the menu itself does
not save preferences or mutate services.

## Field behaviour

Labels, hint/error IDs, required state, disabled state, visible-input refs and blur
callbacks connect native form behaviour with application validation. Native
checkboxes expose an explicit `indeterminate` state. Validation belongs to the
host; do not infer a successful service action from a field changing state.

- ToggleGroup uses string arrays in both single and multiple modes, with pressed
  buttons and arrow-key focus. Native form values repeat the name.
- TagInput commits with Enter/comma, handles comma/newline paste as one batch and
  validates duplicates, tag length and count. Empty Backspace focuses a tag before
  removing it. Free text remains distinct from predefined MultiSelect options.
- RangeSlider exposes a numeric pair, positive steps and a minimum gap in value
  units. Clamp is the default collision behaviour; pointer push is optional.
  `onValueCommitted` reports interaction completion, not persistence.
- OTPInput uses one native input for paste, text selection, autofill and forms.
  Completion reports a full value; sending and verifying codes require a host.

Use RHFField for native fields and RHFControl for controls owning their labels.
Map value/change/ref/blur/error explicitly; RangeSlider uses two input refs and a
host should choose which thumb receives validation focus.

## Data controls and ownership

DataTable remains an ordinary table; WindowedTable displays larger complete
supplied datasets; DataGrid is a bounded editable cell surface. Grid layout is
optional and uses a presentation subset of the existing table view-state model.
Keep query, row data, drafts, history and persistence in the host. Changing a
column layout must not change the canonical record or field identity. Sorting is
available through both headings and ordered touch/keyboard controls when enabled.

## Documentation and discovery

Public API tables are derived from exported TypeScript for components, blocks and
templates. Human examples and structured agent examples use the same literal
source authorities. The optional local MCP server only reads generated public
metadata; it does not execute examples, fetch arbitrary URLs or write applications.
Sources describe development 0.3.0. Retained 0.2.0 assets remain immutable and do
not acquire these newer APIs automatically.
