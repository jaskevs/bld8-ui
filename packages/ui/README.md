# BLD8 UI

Local React 19 component package. Import components from @bld8/ui and styles once from @bld8/ui/styles.css. Wrap the application in UIProvider for tooltips and toast. Uses Base UI for complex interactions and native HTML for simple controls.

MIT licensed. Not published to npm; the showcase's runnable ZIP starters include this package as a local workspace. Keep LICENSE, THIRD_PARTY_NOTICES.md, LUCIDE_LICENSE and DAY_PICKER_LICENSE when distributing it. See the showcase and docs for props, examples and scope.

Extended APIs include MultiSelect, CommandPalette, Calendar, DatePicker,
DateRangePicker and FileUpload. DataTable adds optional selection, column
visibility, scalar filters, bulk actions, density and loading/error states.
Input supports compact density; Select/Combobox support clearable selection.
Dialog accepts initialFocus and finalFocus refs for composed workflows.

Calendars return local Date objects; formatDateValue serialises YYYY-MM-DD
without converting to UTC. Command shortcuts are opt-in and register once.
FileUpload only makes requests through your onUpload callback, with AbortSignal
and onProgress(file,percent). Validate uploads again on the server. Tables are
client-side for manageable datasets, without virtualization or server pagination.
createTableCSV uses explicit exportValue/sortValue scalars; React cell output is
never scraped into an export.

Drawer, ContextMenu and responsive Sidebar extend the navigation set. Selected shadcn/ui Base UI patterns are adapted with attribution in SHADCN_LICENSE. Keep that notice with distributions. Tailwind 4.3.0 authors prefixed bui: utilities without Preflight; npm run build compiles them into dist/tailwind.css, imported by dist/styles.css. App consumers only import the CSS entry point. Source edits require the package build (or the repository dev watcher). Tokens remain --bui-*.
