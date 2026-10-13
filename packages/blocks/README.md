# BLD8 Blocks

Original React compositions built from `@bld8/ui`. Both Free and Premium collections are available at no cost under MIT.

Import `@bld8/ui/styles.css` and `@bld8/blocks/styles.css`, wrap the app in `UIProvider`, then import blocks from `@bld8/blocks`.

Eight blocks: SignInForm, AccountSettings, MetricsOverview, WorkspaceOverview,
TeamDirectory, ProjectBoard, ProjectPlanner and ResourceManager. Three interface
starters: StudioTemplate, LaunchTemplate and OperationsTemplate (Outline).

ProjectPlanner validates project names, dates and disciplines and accepts an async
onCreate callback. ResourceManager accepts onImport for real storage and supports
metadata CSV export and one-step archive undo. Both report local changes through
update callbacks. Outline retains view state while navigating; a reload resets it.

Demo data and local state are illustrative. Bring your own authentication, persistence and service connections. See each block's typed props and the documentation preview for the supported behaviour. Packages remain unpublished to npm; the showcase downloads include local workspaces and compiled files.
