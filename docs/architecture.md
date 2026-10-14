# Architecture

React 19 provides the component model, Base UI maintains complex interactions, and selected shadcn/ui Base UI patterns inform Drawer, ContextMenu and Sidebar. BLD8 owns the styled layer, composition APIs and examples. Native HTML is used for simpler fields and controls.

`packages/ui` builds ESM, declarations and CSS. `packages/blocks` composes its public exports. Neither package depends on Next.js. `apps/docs` consumes both packages and supplies content, fonts, the catalogue and playground.

Styles use namespaced `--bui-*` tokens. Tailwind compiles prefixed utilities without Preflight. Existing CSS keeps its cascade priority. Set `data-ui-theme` on the document root so portalled content inherits the theme. Motion uses shared easing with reduced-motion overrides.

## Forms

`useForm` accepts initial values, validation and an async submit function. Validation may be async; both callbacks receive an AbortSignal. Submissions are guarded against repeats. Reset and unmount abort pending work, and stale completions are ignored. Field errors, service errors, dirty state and saved state are explicit. Successful responses may return normalised values.

`Form` binds submission and first-invalid-field focus. Give input controls a name matching their value key. `Field` handles labels and descriptions. `useUnsavedChanges` handles browser exits; application dialogs own in-app dismissal confirmation. Values should be serialisable; call reset when intentionally replacing a mounted form's initial values.

The optional `@bld8/ui/react-hook-form` entry point integrates existing React Hook Form state through RHFField and RHFControl. It forwards value, blur, error and input refs without adding a required form dependency to core component imports.

## Tables

The default DataTable path filters, sorts and pages local rows. `server={query,onQueryChange,totalRows}` turns off those transformations and renders the supplied page. The application fetches and validates query results. `TableQuery` contains search, facets, sort, page and pageSize. Reset page when changing the query. The Outline adapter demonstrates aborting obsolete requests and clamping the page after a deletion.

Selection is stored as row keys, including keys absent from the current page. Use `renderSelectedActions` for service-backed bulk actions; `renderBulkActions` supplies selected rows available in the current rows array. Keep row keys stable and clear selection after successful mutations. Column widths support pointer/keyboard resizing and start/end pinning. CSV reads explicit scalar exports and escapes formula-leading strings. Virtualization is not included.

`EditableCell` supplies explicit text/date/select editing, abortable saves, draft recovery and keyboard save/cancel. It captures the original value and revision when editing starts. The application retains ownership of committed data and optimistic concurrency checks.

## Outline

Outline composes public components into a browser-persisted example. `OutlineRepository` defines async list/save/status/delete operations. The browser adapter persists project metadata, validates names and checks record versions to reject stale edits. `createOutlineHttpRepository` implements a fetch adapter with validated response shapes, field errors, record conflicts and cancellation. The runnable reference API in `examples/outline-http` scopes temporary process-local data to a demo session. A production service owns authentication, authorisation, atomic writes and database persistence.

The project editor preserves rejected drafts, shows field/service errors and confirms dismissal when dirty. The table loads through the repository, supports multi-page selection and provides bulk operations. Resource metadata and profile preferences are stored separately in the browser. Files are never uploaded. Other blocks retain their independent callbacks and in-memory defaults.

## Distribution

Build preparation creates source-view modules, real shadcn registry items and ZIP starters from explicit source allowlists. Registry files install under the consumer's UI alias without an unpublished package dependency. ZIPs include local workspaces, compiled output and editable source. Generated assets are ignored in Git. See registry.md and deployment.md.

## Documentation

The playground validates and serialises component configuration into shareable URLs.
Public prop tables are derived by prepare-api.mjs from TypeScript exports; forwarded
React/HTML props remain available in expandable sections. Canonical examples are
shared by the docs app and the two HTTP/form integration starters.
