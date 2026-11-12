# Core components and complete examples

The catalogue distinguishes component families from named examples, blocks,
templates and icon assets. A new variant does not create a new component family.
All original source remains MIT; framework starters target React 19 with Next.js
or Vite. No BLD8 package publication or hosted account is needed for source reuse.

## Choosing and installing

Use category, capability and text filters on `/components`. Filter URLs can be
shared and browser Back/Forward restores them. Related-control links distinguish
local choices from remote choices and ordinary tables from editable grids.

Browse complete patterns at /components/examples. Search titles, descriptions,
keyboard behavior and covered states. Select several families or categories;
family group parents include every family in that group, including members hidden
by the picker search, and partial groups show a mixed state. Selected families
are alternatives, as are selected categories; these filters and query terms
narrow results together. URLs repeat component and category keys and preserve
legacy single-value links, reload and Back/Forward. Each named example has an exact URL under
/components/<family>/examples/<example> and its own registry item.

Install a family through its registry URL after initialising shadcn. To install a
complete example, use its example-<id>.json item. The CLI places the client module
under your configured UI directory at bld8/examples/<id>.tsx and follows only the
actual component import graph. Complete example files are copied verbatim so CLI
rewriting cannot discard their leading copyright and permission notices.
Their relative source imports work with custom UI
aliases; import the installed module's documented export into your application.
No package publication or BLD8 account is required.

Named example
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

## Editable dates and confirmation

DatePicker keeps its Date/null API and calendar-button behaviour. Opt into
editable for a labelled native text input using unambiguous YYYY-MM-DD entry.
parseDateValue and formatDateValue use local calendar fields; they do not convert
a date into a UTC instant. Invalid typed dates, leap-day overflow and bounds
errors remain visible and do not replace the committed date. Native date values
are YYYY-MM-DD strings, with an empty string for no date; the component value is
still Date/null. parseDateValue returns null for empty or malformed text.

Editable fields participate in native required/format/bounds validation, external
form ownership and reset. Read-only values remain submitted and disabled values
are excluded. Uncontrolled reset restores defaultValue without synthesising a
change callback; controlled reset remains owned by the host. Cancelling the
native reset event prevents the control's default restoration. The existing
button-only mode submits hidden canonical values and needs host validation for
required dates. It does not add an offscreen interactive validation proxy.

Use textInputRef/onInputBlur for the editable single field; legacy inputRef/onBlur
still refer to its calendar button. For a form controller, map its ref to
textInputRef, blur to onInputBlur, Date/null value to value, and change to
onValueChange. Valid text commits with Enter or when focus leaves the text/calendar
composite, including a move through its calendar button. Accepted controlled values
are synchronized before the next native action reads the field. onInputBlur is
still the native input blur callback: it also fires when moving into the calendar,
so a form controller may mark the field touched before a date is selected. Range
fields expose a pair of text refs; choose the invalid endpoint for host validation
focus.

Forms that opt out of native validation with noValidate must call reportValidity()
before their submission handler. This matters for controller-based form libraries:
an invalid raw date is a local draft while the committed Date can still be valid.
A form-level onSubmitCapture guard can preventDefault/stopPropagation when
reportValidity() is false, then let the existing handleSubmit perform host rules.
The same guard blocks an un-applied explicit range. Native validation and host
validation remain separate responsibilities. The error prop supplies linked host
feedback; the control's native custom validity covers its own date format, bounds
and pending-confirmation state. Host feedback does not replace host rules.

DateRangePicker retains immediate changes by default. With commitMode explicit,
keyboard endpoints, calendar picks and supplied presets change a local draft.
Apply emits one change for a changed, complete valid bounded range; an optional
clear applies null. An unchanged draft cannot be applied. Cancel, Escape and
outside popup dismissal discard un-applied choices. Typed drafts outside a popup
wait for Apply or Cancel and block native submission while unapplied. In explicit
mode, native form values remain the committed name.from and name.to values;
drafts do not silently replace them. The host supplies preset dates
and owns any business meaning such as billing or scheduling.

Complete examples: date-entry-lifecycle, date-controlled-entry and
date-range-presets in apps/docs/src/lib/date-field-examples.ts.

## Typed grid editors and custom cells

DataColumn supports boolean and multi-select alongside text, number, date and
single select. Booleans are canonical true/false; multi-values are stable string
IDs, not their labels. For a boolean column, required:true means confirmation:
the value must be true. Leave required unset when false is a valid answer. Array
cells use JSON arrays inside the normal quoted TSV
format, preserving values containing commas, tabs and newlines. Custom editor
commits use column parsing and validation. Paste callbacks retain raw TSV cell
strings; host paste handling must parse each value through parseDataValue and
validate the complete change before accepting it.

Built-in date and multi-value editors have a local buffer with Apply/Cancel;
opening nested calendar or option popups does not commit the cell. Boolean
editing uses a native checkbox. Built-in and custom commits carry canonical
DataEdit values; paste callbacks carry raw cell strings for host conversion. The
host owns drafts, history, revisions and persistence. The
Issue example adapter keeps its existing field schema; adding a generic editor
does not grant that service new writable fields.

renderCell receives DataGridCellContext with the typed record, column, canonical
value and selection state. Return undefined to use the built-in display, or null
to deliberately render an empty cell. Keep
custom display content passive; use an editor for focusable interactions.
renderEditor receives DataGridEditorContext with draftValue, onValueChange,
validating commit, cancel, inputRef, keyboard/blur handlers and portalProps.
Return a component to use React hooks, or undefined for the built-in editor.
Spread portalProps on an owned custom popup so grid focus remains associated
with the edit session. Invalid commits stay open; cancellation never writes.

The grid-editor-mixed and grid-editor-custom complete sources show built-in
editing and a TreeSelect custom editor through this public contract. They run
unchanged as previews and become configured-alias source in clean consumers.

## Checked hierarchical selection

TreeSelect is separate from Tree navigation and Cascader single-path selection.
It commits stable leaf IDs, supports checked/mixed parents and preserves selected
IDs that are currently filtered, collapsed or not loaded. Search covers loaded
items and retains matching ancestor context; it does not claim remote search of
an entire service hierarchy.

Parent actions affect loaded enabled descendant leaves, including loaded leaves
hidden by the current search. Filtering changes visibility, not that action's
scope. Unknown lazy children are
never selected later as a side effect, and an incomplete parent cannot display a
fully checked state. Selecting an unloaded branch with no known leaves expands
or loads it without emitting invented leaf values. Disabled ancestors disable
their descendants. Empty declared branches remain branches.

loadChildren receives an AbortSignal and a stable node identity. Closing or
changing source scope aborts outstanding work; stale, malformed and conflicting
responses cannot overwrite the current hierarchy. Failed branches expose Retry
while committed IDs stay intact. Keep nodes and loader references stable, or
change sourceKey intentionally when replacing the data source.

Native form values repeat name once per selected ID; external form/reset,
controlled/default values, refs, read-only, disabled and error states are explicit.
The trigger is a button, so required submission validation belongs to the host.
The complete native-form example demonstrates that boundary. Applications must
also validate that submitted IDs identify current, authorised leaves and persist
their own data.

See tree-select-native and tree-select-lazy in
apps/docs/src/lib/tree-select-examples.ts. popupDataAttributes is a narrow data-*
metadata hook for composing a custom editor; it cannot replace focus or event
handlers.

## Base UI compositions

- Autocomplete is free-text entry with optional suggestions. Unlike Combobox,
  the form submits readable typed text, including values outside the suggestion
  set. Local grouped results and abortable async suggestions use the same field.
- Toolbar combines buttons, links, toggles and inputs in one roving keyboard
  system. Orientation and loop behavior are explicit. Disabled groups suppress
  actions; links keep their ordinary navigation semantics.
- AlertDialog confirms consequential actions with Cancel as the initial focus.
  Pending confirmation prevents duplicate local submissions; rejection keeps
  the error and retry action visible. Cancellation aborts the current attempt;
  servers remain responsible for authorization and transaction guarantees.
- NavigationMenu groups real links in flyouts. One shared collision-aware
  viewport resizes between destinations. Choose DropdownMenu for commands.
- PreviewCard adds supplementary visual context to a real destination link.
  The destination remains the accessible source of essential information.
  Keep buttons and forms in Popover or Dialog instead.

## Focused recovery examples

Dependent reviewer selection, per-file processing acknowledgement and Kanban
save recovery are independent examples as well as parts of larger workflows.
Their adapters are local and explicitly labelled: a successful demonstration is
not evidence of a production service. Preserve abort signals, stable request IDs,
stale-result checks, rollback and retry when connecting your own service.

## Grouped facets and complete forms

FacetedFilter composes the checked hierarchy into a compact multiple-choice
filter. Options use stable values, optional groups, descriptions and supplied
counts. A parent selects every supplied enabled option, including choices hidden
by search; partial groups are mixed. Counts describe results and never silently
disable choices. Unknown selected IDs are retained. Compose OR within one facet
and AND between facets in the host. The table, resource and people examples show
these contracts with canonical IDs and explicit reset.

Fieldset uses a native legend and links its hint/error to the group. CheckboxGroup
submits repeated named values, supports external form ownership, required/min/max
group validation and read-only choices. Disabled fields stay out of submission.
Uncontrolled fields restore their initial values on an uncancelled native reset;
controlled values remain host-owned. Native constraints use an enabled checkbox
as the group validation anchor. Server/business validation still belongs to the
application.

FormErrorSummary accepts fieldIds/fieldLabels/formId, resolves enabled named
controls or uses onFocusField for a host adapter. Links move focus to the
relevant field. The complete React Hook Form review-request example demonstrates
conditional reviewers, repeatable email rows, retained hidden drafts, linked
validation, failed-save recovery and abortable local submission. It sends no
messages and provides no backend.
