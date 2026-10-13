# BLD8 UI working context

Read README.md, docs/architecture.md, docs/scope.md, docs/design-and-motion.md, docs/verification.md and docs/deployment.md before changing this project. This is a new, separate React-first library requested on 28 September 2026. The portfolio website is a sibling and remains independent. Existing roadmap dates were not changed; this project has not yet been allocated time in that roadmap.

Use Base UI as a maintained dependency for complex behaviour. Keep the BLD8 styled layer original: white/neutral grey/near-black/yellow, clear typography, small control corners and restrained motion. Primary actions use near-black (#171717), while the accent variant and selected controls use warm yellow (#ffe24a) with dark text. The user requested this palette in place of lime for the library. The portfolio palette remains independent. The main canvas is light grey; white cards have no outer border. Keep purposeful internal rules and focus indicators. Shared timings are 160/280/440 ms. The user prioritises smooth, considered interactions, following the Carl Hauser reference. Review /motion for the working studies. Native HTML is appropriate for simpler controls. Keep accessibility claims precise; automated checks do not replace manual assistive-technology review.

Package code belongs in packages/ui. The showcase in apps/docs must consume its public exports; do not implement duplicate lookalike components only for demos. React 19 is the current peer requirement. The user approved incremental Tailwind authoring and selected shadcn/ui Base UI adaptations. Tailwind 4.3.0 compiles prefixed bui: utilities without Preflight; consumers receive plain compiled CSS. Existing public APIs and legacy CSS remain supported. Read docs/tailwind-and-shadcn.md and docs/upstream.json before extending the authoring setup. Package source remains independent of Next.js.

The showcase has actual in-memory demos with explicitly labelled sample data. No backend is implied. Do not invent adoption, production usage or completion claims. Text stays concise and genuine. Notes to self are brief explanations of decisions, not marketing.

Root npm run dev builds and watches the package and starts Next.js on 3120. Tests use a production server on 3121. The sibling website uses 3117; do not stop or replace it.

Do not commit, push, publish or deploy without an explicit request. Do not change company/global Git, GitHub CLI, npm or SSH configuration. User-owned commits must use Jaison <26425317+jaskevs@users.noreply.github.com> as author and committer without co-author trailers. The user chose MIT on 13 October 2026; the npm namespace remains unreserved and packages remain unpublished.
## Commit time restriction

User instruction, 28 September 2026: do not create code commits from 08:00 inclusive
to 17:00 exclusive in Australia/Melbourne time. Apply this every day unless the
user narrows the days. Check the actual local time before any authorised commit.
Do not backdate, override dates or defer a commit automatically to bypass this.
Outside that window, commits still require explicit user authorisation and the
existing personal author/committer identity. Editing and local verification can continue.

## Public showcase and navigation

The user authorised showcase publication on 28 September 2026. It is live at
https://bld8-ui.vercel.app on personal Vercel. The user chose the Vercel address
for now; custom-domain DNS is deferred. The npm package remains unpublished,
private on npm and MIT licensed. Git is initialised with the isolated personal remote jaskevs/bld8-ui.
Automatic Git deployment is not enabled; the showcase still uses direct deployment.

Keep the menu border white. At the top it has no shadow; after 16 px of scrolling
it gains a soft eased shadow and remains a sticky overlay (12 px desktop,
8 px mobile). Returning to the top removes the shadow. Mobile navigation supports
Escape/focus return, outside click and closing after link selection. Keep
reduced-motion behaviour and immediate keyboard focus. The public guide explains
who the library is for without implying the package is available on npm.

## Public source decision - 30 September 2026

The user explicitly chose to keep jaskevs/bld8-ui public and push the source.
The npm package remains unpublished (now MIT licensed). Git-to-Vercel deployment
is not connected; the current showcase remains online from direct deployment.

## Library expansion - 13 October 2026

The user requested a ReUI-like component/blocks/templates experience with Free
and Premium both free, and explicitly selected MIT for personal/commercial reuse.
This supersedes earlier UNLICENSED/licence-pending wording. Keep BLD8's original
yellow, near-black, white and neutral-grey design, smooth motion and white menu
border. ReUI supplied structural inspiration only; none of its source was copied.

`packages/blocks` contains the actual reusable compositions; the showcase consumes
their public exports. Eight blocks and three frontend starters are described in
`scripts/library-catalog.mjs`. This is the metadata source of truth. Build/dev
preparation generates the ignored catalogue/source modules, `/r` JSON manifests
and `/downloads` ZIP files. Never hand-edit generated outputs or upload a parent
workspace, credential or environment file. ZIP inputs are allowlisted in the script.

Free/Premium are catalogue labels with price zero, equal source access and the
same MIT licence. Do not add signup, checkout, billing, keys or gated code. All
demo names and metrics are illustrative. State is in-memory; no backend, email
delivery or authenticated session is implied. Templates are frontend starters,
not complete SaaS products. Packages remain private/unpublished on npm. Registry
manifests are BLD8 JSON, not shadcn CLI or MCP compatibility.

The October expansion is included in the user-authorised 13 October source
release. Deployment remains separate. Existing roadmap dates and portfolio
source were not changed.

## Icon foundation and control extensions - 13 October 2026

The user requested a larger uniform icon experience, with Lucide as a reference.
Lucide React 1.55.0 is pinned in UI/docs. Use named imports and `<Icon icon={...}>`
in applications; do not import the entire icon namespace or a generic dynamic
loader into consumer components. The familiar name aliases and original dotted
arrow stay compatible. Defaults are 18px, stroke 1.75 and currentColor. Decorative
icons are hidden from accessibility APIs; standalone meaningful icons take label,
and icon-only actions take an explicit button label.

`scripts/prepare-icons.mjs` runs during library build/dev preparation. It inspects
the installed Lucide metadata, excludes aliases and generates 1,877 canonical
SVGs in three stroke profiles plus a small typed name catalogue. Its cache key
includes the generator and pinned version. Installed `__iconData` is a build-time
dependency contract; review it on future Lucide upgrades. Generated files remain
ignored. SVG downloads and ZIP starters include upstream licence notices.

`/icons` provides search, category filters, pagination, size/stroke/colour previews,
React/SVG copy and SVG download. Mobile uses the existing controlled Sheet with
the selected tile as the focus-return origin; desktop has a sticky inspector.
Keep browsing ahead of the inspector on mobile. Actual-size and 2x detail views
are labelled. There is no account or paid icon gate.

Button accepts leadingIcon/trailingIcon; IconButton accepts icon; InputGroup
composes leading/trailing adornments around Input without losing Field semantics.
Icon and InputGroup usage pages join the catalogue. Build on the workflow APIs
below for future extensions.
The user authorised committing and pushing these updates on 13 October.
No new deployment was requested.

## Application patterns - 13 October 2026

The user authorised this implementation layer with practical reuse as the priority.
MultiSelect, CommandPalette, Calendar, DatePicker, DateRangePicker and FileUpload
are public exports. DataTable adds optional selection/visibility, scalar facets,
bulk action slots, density and loading/error/retry. Its original API stays compatible.
Select/Combobox are optionally clearable; Input supports compact density.

Command uses Base UI inline Combobox in Dialog with initial input focus. Only the
showcase-wide palette registers Ctrl/Command+K. DayPicker 10.0.2 is pinned with an
included MIT notice. Date-only values use local calendar fields, never UTC.
FileUpload sends nothing without a consumer onUpload callback. The callback
showcase is explicitly a local simulation, including progress/error/cancellation.

ProjectPlanner, ResourceManager and Outline compose public APIs into creation,
metadata export and undoable archiving. Outline keeps local view state mounted.
Optional callbacks own real storage/persistence. Counts are 40 guidance entries,
eight blocks and three templates. Eleven allowlisted ZIP starters are generated;
keep generated outputs ignored. Both collections remain $0/MIT and npm-unpublished.
Do not claim superiority over ReUI as verified fact or copy its source/artwork.
These edits are included in the 13 October source release; deployment remains
separate. Preserve work-time and personal Git restrictions at this repository
and the workspace root.

## Tailwind / shadcn foundation - 13 October 2026

Drawer, ContextMenu and Sidebar are real public package controls, demonstrated in Outline. Sidebar follows container width, uses a modal Drawer below 640px and stores state in memory. No cookies or global shortcut. Context actions have a visible alternate path. Keep reduced motion and accessible names/focus behaviour. Preserve SHADCN_LICENSE in packages and ZIPs. npm run dev watches TypeScript, legacy CSS and Tailwind sources. Source manifests at /r remain our custom format, not shadcn CLI compatibility. The user authorised committing and pushing this batch on 13 October; no new deployment was requested.

## Source release - 13 October 2026

The user requested the pending BLD8 UI source changes be committed and pushed to
jaskevs/bld8-ui main, after 17:00 Melbourne, with Jaison as author and committer.
This release includes the MIT collections/templates, icon directory, workflow
controls and Tailwind/shadcn Base UI adaptations. Generated assets, local
previews and account files stay ignored. Git-to-Vercel remains unconfigured;
a source push does not update the deployed showcase or publish npm packages.
