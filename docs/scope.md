# Current scope

The current library contains 53 component guidance entries, sixteen reusable blocks, three templates, the Lucide directory, a fourteen-control playground, a theme lab, 147 generated registry items and 40 ZIP starters (21 Next.js and 19 Vite). Registry items include shared dependencies; they are not a count of independent controls.

The library includes native forms, Base UI selection/navigation/overlays, command search, date/range fields, file selection and upload callbacks, feedback, tables, drawer, context menus and responsive sidebar. Source and both collection tiers are free under MIT.

The playground configures fourteen representative controls and supports validated shareable URLs. Other component pages retain interactive demos and installation commands. The registry covers all catalogue IDs and templates; shared modules resolve through its dependency graph.

Outline is the browser-persisted reference application for forms and tables. Its project flows include validation, recovery, edits, deletion, filtering, sort, page selection, bulk changes and CSV export. Profile preferences and resource metadata also survive reloads. A separate HTTP example includes a temporary session-scoped sample API. Production accounts, cloud sync and uploaded file storage are not included.

Tables support externally controlled queries, resizing, pinned columns and optional supplied-record grouping. A separate WindowedTable handles complete bounded datasets with fixed single-line rows and external detail editing; it does not fetch service pages. The form adapter does not replace schema validation or a server's validation rules. Browser storage is suitable for this example, not shared multi-user persistence. The repository interface is the integration boundary for a real service.

Automated accessibility and browser checks cover the included examples. Manual assistive-technology and broader cross-browser review remain necessary before making certification claims. The npm packages are still private and unpublished; use the registry or source starters.


The current extension adds complete TypeScript-derived prop tables, inline table
editing, a typed Outline HTTP adapter, a runnable session-scoped API example and
optional React Hook Form bindings. The two integration starters include the
sample API. Production authentication and database storage are application work.


Recent workflows include ActivityFeed, IssueTable with filters and saved views,
Kanban/TaskWorkspace, and Stepper/NumberField/TimePicker with SessionSetup. The
quality expansion adds clean registry consumer checks and a separate visual/
cross-browser suite; see ci-and-vercel.md for source and promotion status.

The theme lab adjusts colour, typography, radius, density and shadows, with an
isolated interactive preview and light/dark CSS export. Its pure theme-config
helper works in Next.js and Vite. This and the quality expansion remain local
until an authorised source release; the currently live registry has 121 items.
See [theme setup](theme-lab.md) for font, portal and installation requirements.

The Tree/FileBrowser increment adds keyboard folder navigation, local metadata
search/sort, inspection, abortable lazy loading and per-folder recovery. Filesystem
access, file contents and a production storage service remain host concerns.
See file-browser.md for bounded-data and request/session contracts.

Chart provides bounded categorical line/bar/area views for up to 366 observations and six series, with null gaps, signed values, keyboard exploration and an exact data table. AnalyticsDashboard composes it with reporting periods, derived metrics, abortable adapters, recovery and CSV export. These are local additions; streaming, date axes, stacking, large-data downsampling are not included. See charts-and-analytics.md. Grouped/windowed tables and the large issue block are documented in large-tables.md.


DayAgenda and SchedulePlanner add a bounded single-schedule day view, supplied UTC
availability and guarded booking callbacks. Explicit offsets distinguish repeated
local times; TimePicker remains a date-free preference. Host authorisation, atomic
overlap/revision checks and durable storage are not supplied. Rich text, recurrence,
resource allocation and calendar sync remain separate. See scheduling.md.
