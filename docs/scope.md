# Current scope

43 component guidance entries, eight reusable blocks, three templates, the Lucide directory, component playground, shadcn registry and thirteen ZIP starters are implemented.

The library includes native forms, Base UI selection/navigation/overlays, command search, date/range fields, file selection and upload callbacks, feedback, tables, drawer, context menus and responsive sidebar. Source and both collection tiers are free under MIT.

The playground configures fourteen representative controls and supports validated shareable URLs. Other component pages retain interactive demos and installation commands. The registry covers all catalogue IDs and templates; shared modules resolve through its dependency graph.

Outline is the browser-persisted reference application for forms and tables. Its project flows include validation, recovery, edits, deletion, filtering, sort, page selection, bulk changes and CSV export. Profile preferences and resource metadata also survive reloads. A separate HTTP example includes a temporary session-scoped sample API. Production accounts, cloud sync and uploaded file storage are not included.

Tables support externally controlled queries, resizing and pinned columns, but not virtualization. The form adapter does not replace schema validation or a server's validation rules. Browser storage is suitable for this example, not shared multi-user persistence. The repository interface is the integration boundary for a real service.

Automated accessibility and browser checks cover the included examples. Manual assistive-technology and broader cross-browser review remain necessary before making certification claims. The npm packages are still private and unpublished; use the registry or source starters.


The current extension adds complete TypeScript-derived prop tables, inline table
editing, a typed Outline HTTP adapter, a runnable session-scoped API example and
optional React Hook Form bindings. The two integration starters include the
sample API. Production authentication and database storage are application work.
