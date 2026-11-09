# Component playground

The playground covers 18 existing controls: Button, Input, Checkbox, RadioGroup,
Switch, Badge, Progress, Select, Tabs, Accordion, Dialog, Drawer, MultiSelect,
Calendar, DatePicker, DateRangePicker, DataTable and FilterBuilder. These are
configured examples of the public library, not additional catalogue components.

Choose a control, change its options and use the actual preview. Keyboard guidance
and the full prop-table link sit below it. Desktop settings stay within a sticky,
scrollable panel; phone links connect settings and preview. Code is scrollable,
copyable and downloadable as a client-component `.tsx` file. Downloading waits
until the URL configuration has been restored.

## Share configuration

Version 2 links preserve choice values, accordion expansion, dates, table search,
sort, page, selected sample IDs, visible columns, collapsed page groups, density,
configured response mode and both filter drafts and applied conditions. Existing
version 1 links still work. Unknown versions and unsupported values fall back to
valid defaults. Rules use allowlisted fields/operators and bounded values; only
complete validated conditions reach the result evaluator.

Links preserve configuration rather than modified sample data. Input text, row
edits, resized column widths, pending actions and their messages reset on reload.
The browser address updates to the latest shareable configuration. If the encoded
query exceeds 8,000 characters, the address stops updating and Copy configuration
link is disabled. The current draft stays available; shorten the filters or
download the example before reloading. This is the showcase's sharing budget.

## Tables and filters

Selection, Grouped page, Filter conditions, Inline editing and Rejected update
provide starting points. Each restores the sample rows before applying its
configuration. Restore example resets the query, selection, conditions, column
widths and unfinished inline edits while keeping options such as density and
visible columns. Global Reset returns to the page's initial control.

The table owns six local records. Its externally controlled query demonstrates
host-side filtering, sorting and paging without fetching a service. Group headings
describe the supplied page, as the component's scope notice states. Selected IDs
survive pages and filters; the bulk callback receives all selected IDs, including
those outside the current page. A simulated 500 ms action shows busy, rejection
and recovery. Rejection keeps selection and returns useful focus. Completion
removes only the processed IDs, preserving selections made while it was pending.
Switching examples aborts the old UI update. This is a local interaction example,
without a production concurrency or persistence service.

FilterBuilder supplies text, status, date and numeric fields, with up to six
conditions. Its draft remains separate from the applied query. Apply validates
the draft, reports field errors or updates results; Clear conditions resets both.
Reloading a shared link restores unapplied work without silently applying it.

## Source examples and validation

The live table and its code generator share sample records and filter definitions.
Exported code includes the configured selection, query, columns, grouping, editing,
filter validation and bulk-action behaviour. It imports from the default installed
`@/components/ui/bld8` alias; adjust that prefix for a custom shadcn UI alias.
The install command includes the modules used by that example. A basic DataTable
example does not request FilterBuilder; enabling it adds its source dependencies.
Preview width and dark mode belong to the showcase; examples inherit the host
application's styles and theme. Follow the registry's provider setup for overlays.

`tests/playground-code.spec.ts` extracts actual generated registry files into an
isolated alias fixture and strictly type-checks 52 configured source variants.
Dependency resolution uses the workspace's installed packages. Behaviour tests
exercise URL recovery, native keys, selection, filter drafts, pending-action
changes, downloads, mobile navigation and automated accessibility. Separate pinned
Linux checks run the new workflows in Chromium, Firefox and WebKit, both themes
and viewport sizes. See verification.md for observed results and limits.
