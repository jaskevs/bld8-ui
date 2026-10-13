# Initial release scope

The intended direction is a broad, polished application UI library. This local v0.1 establishes its reusable core and working showcase; it is not a finished replacement for every mature component library.

## Implemented

- Actions: Button, IconButton.
- Forms: Field, Input, Textarea, Checkbox, Switch, RadioGroup, Select, Combobox, Slider.
- Navigation: Tabs, Accordion, Breadcrumb, Pagination.
- Overlays: Dialog, Sheet, Popover, Tooltip, DropdownMenu.
- Feedback: Toast provider/hook, Alert, Badge, Progress, Spinner, Skeleton, EmptyState.
- Data and layout: Avatar, Card, Separator, DataTable.
- Helpers: crisp SVG icons, UIProvider, DialogClose and typed props.
- Shared light/dark tokens, reduced-motion styles and native focus indicators.
- Searchable catalog, 40 guidance pages, design foundations and local installation guide.
- Settings form and project workspace demos. Example data resets on reload; there is no backend.

The table supports client-side filtering, sorting, pagination and the workflow
extensions below. It does not include column resizing, virtualization or server
pagination. The sheet has no swipe gestures; menus are single-level. Select and
Combobox are single-select; MultiSelect supplies multiple selection. Not every
primitive option is surfaced.

## Implemented library expansion - 13 October 2026

- A library home, Components/Blocks/Templates navigation and two $0 collections.
- Three Free blocks: sign-in, account settings and metrics overview.
- Three Premium blocks: workspace overview, team directory and project board.
- Two Premium interface starters: Studio workspace and Gather product page.
- Every collection is free, with MIT source, no signup, checkout, key or code gate.
- Search, category/collection filtering, live desktop/mobile previews, full source
  and stylesheet views, copy actions, source manifests and runnable ZIP starters.
- Actual local validation, saving, metric/filter changes, record creation,
  duplicate-invitation rejection, task movement and template view navigation.
- Package-independent responsive styling and the existing shared motion tokens.

The sign-in block has an optional authentication callback; the demo sends no
credentials. Settings has a persistence callback; other demos use in-memory
fixtures. Invitations never send email, and the board uses select-based stage
changes rather than drag-and-drop. Templates are frontend starters, not products
with a backend. MIT is selected; npm publication is still pending. ReUI supplied
structural inspiration only. Its implementation and paid source were not copied.

## Implemented icons and control composition - 13 October 2026

- A searchable directory of 1,877 canonical Lucide icons, excluding aliases.
- Category filtering, pagination, size/stroke/colour previews, copyable React/SVG,
  and licensed SVG downloads. Desktop inspector and mobile on-demand Sheet.
- Shared Icon API with 18px/1.75/currentColor defaults, named Lucide components,
  labelled standalone icons and preserved dotted BLD8 arrows.
- Leading/trailing icon props for Button; direct icon props for IconButton.
- InputGroup with leading/trailing icons, text prefixes and accessible actions.
- Two additional component guidance pages: Icon and InputGroup (30 total).

Lucide is a maintained dependency, not artwork claimed as original BLD8 work.
The full SVG directory is generated outside consumer JavaScript. Existing core
components remain the base. Application patterns below extend them.

## Implemented application patterns - 13 October 2026

- Multi-select chips with stable values, search, disabled options and hint/error.
- Command palette with keyword search, icons, disabled actions, keyboard focus,
  controlled/uncontrolled open state and opt-in Ctrl/Command+K. Showcase-wide search.
- Styled React DayPicker calendar, date/range fields, bounds, clearing, locale
  options and local date-only hidden values. No time or timezone scheduling.
- File browse/drop, duplicates/type/size/count validation, removal and transport
  callback with progress, cancellation, stale-result protection and retry.
  Showcase callback modes are explicitly labelled local simulations.
- Table selection across pages/search, mixed header state, page-only select-all,
  scalar filters, column visibility, three-state sort, bulk slots, density and
  loading/error/retry. Scalar CSV export quotes fields and escapes formulas.
- Clearable Select/Combobox, compact Input and Dialog focus refs for composition.
- Project planner, resource library and Outline workspace, with creation, CSV
  export, undoable archive and retained local view state. Eight blocks and three
  templates total, with eleven runnable ZIP starters. Both collections stay free.

Files are not stored/uploaded by default; callbacks own service integration.
State resets on reload. Backend services, virtualized tables, time pickers,
drag-sort boards, full internationalization and non-Chromium browser coverage
remain outside this change.

## Further implementation priorities

1. Use the core in one real project. Review API friction, keyboard behaviour and screen-reader results before release.
2. Add component contract stories, visual regression baselines, RTL/localisation checks and browser coverage beyond Chromium. Confirm packaging in the consuming application's toolchain.
3. Grow the catalog where the product needs it: calendar/date range, richer forms, command palette, file upload and advanced table features.
4. Add domain compositions, such as AI request traces and source citations, when the underlying Workbench features exist.
5. Add an Angular implementation after React APIs and shared tokens settle. React Native requires its own platform implementation.

The website remains independent. The original fixed roadmap is unchanged; no speculative workload or completion date was added to it.
