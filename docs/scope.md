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
- Searchable catalog, 28 usage pages, design foundations and local installation guide.
- Settings form and project workspace demos. Example data resets on reload; there is no backend.

The table supports client-side filtering, single-column sorting and pagination. It does not include selection, column resizing, virtualization or server-side data. The sheet is a positioned dialog, without swipe gestures. Menus are single-level. Select/Combobox wrappers expose a focused single-select API. Loading, error and disabled states exist where applicable; not every possible primitive option is surfaced.

## Expansion path

1. Use the core in one real project. Review API friction, keyboard behaviour and screen-reader results before release.
2. Add component contract stories, visual regression baselines, RTL/localisation checks and browser coverage beyond Chromium. Confirm packaging in the consuming application's toolchain.
3. Grow the catalog where the product needs it: calendar/date range, richer forms, command palette, file upload and advanced table features.
4. Add domain compositions, such as AI request traces and source citations, when the underlying Workbench features exist.
5. Add an Angular implementation after React APIs and shared tokens settle. React Native requires its own platform implementation.

The website remains independent. The original fixed roadmap is unchanged; no speculative workload or completion date was added to it.