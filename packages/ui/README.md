# Current scope

The local library has 53 component guidance entries, sixteen reusable blocks, three templates, the Lucide directory, component playground, theme lab, shadcn registry and 40 ZIP starters.

The library includes native forms, Base UI selection/navigation/overlays, command search, date/range fields, file selection and upload callbacks, feedback, tables, drawer, context menus and responsive sidebar. Source and both collection tiers are free under MIT.

The playground configures fourteen representative controls and supports validated shareable URLs. Other component pages retain interactive demos and installation commands. The registry covers all catalogue IDs and templates; shared modules resolve through its dependency graph.

Outline is the browser-persisted reference application for forms and tables. Its project flows include validation, recovery, edits, deletion, filtering, sort, page selection, bulk changes and CSV export. Profile preferences and resource metadata also survive reloads. A separate HTTP example includes a temporary session-scoped sample API. Production accounts, cloud sync and uploaded file storage are not included.

Tables support externally controlled queries, resizing, pinned columns and optional row grouping. WindowedTable is a separate fixed-height display view for up to 20,000 complete supplied records. LargeIssueTable keeps its edit draft outside rows and provides an ordinary paged alternative; existing IssueRepository service page limits remain unchanged. The form adapter does not replace schema validation or a server's validation rules. Browser storage is suitable for this example, not shared multi-user persistence. The repository interface is the integration boundary for a real service.

Automated accessibility and browser checks cover the included examples. Manual assistive-technology and broader cross-browser review remain necessary before making certification claims. The npm packages are still private and unpublished; use the registry or source starters.


The current extension adds complete TypeScript-derived prop tables, inline table
editing, a typed Outline HTTP adapter, a runnable session-scoped API example and
optional React Hook Form bindings. The two integration starters include the
sample API. Production authentication and database storage are application work.

Optional integration items include `react-hook-form`, `react-hook-form-example`,
`editable-cell` and `outline-http`. The form adapter adds React Hook Form only
when explicitly installed. The form example includes client bindings and its
HTTP adapter; the standalone HTTP/form starters supply a runnable reference
server. Use the service contract to connect a different backend.

EditableCell supports explicit text/date/select edits, async save recovery and
an edit-start revision for concurrency checks. React Hook Form bindings are
optional: import RHFField/RHFControl from @bld8/ui/react-hook-form. Input refs,
blur and field errors connect native and controlled inputs to the host form.
