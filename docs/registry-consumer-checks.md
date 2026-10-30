# Clean registry consumer checks

After `npm ci` and `npm run build`, run:

```sh
npx playwright install chromium
npm run check:registry:consumers
```

Use Node 22. The command installs eleven generated entries: `session-setup`,
`theme-config`, `file-browser`, `chart`, `analytics-dashboard`, `windowed-table`,
`table-grouping`, `large-issue-table`, `day-agenda`, `schedule-state` and
`schedule-planner`. It uses the actual shadcn CLI in two new temporary
applications, then builds and exercises each app independently. Use
`npm run check:registry:consumers -- next` or `-- vite` to run one framework,
including separate CI matrix jobs. The browser uses `PLAYWRIGHT_CHANNEL` when
set, otherwise Playwright Chromium. CI installs that runtime before this check.

The Next.js fixture keeps the page as a Server Component. Its prerender calls
the installed `createTimeOptions`, session validation and all five pure theme
configuration helpers, chart/report helpers and all three pure table helpers: `buildTableRows`, `getTableWindow` and `getTablePage`. It asserts grouped record identity, page context, bounded window indices and the retained index, then checks the emitted HTML. Scheduling evaluation also validates and clones
a bounded source, enumerates seven real UTC starts, checks the selected local
day and explicit offset label, and validates a revision-checked booking with
`validateScheduleSnapshot`, `getScheduleDay`, `getScheduleStarts`,
`formatScheduleTime` and `validateScheduleBooking`. The
Vite fixture uses `~/ui` as its custom
UI alias; the check verifies that source, styles and notices arrive there. Both
fixtures render the workflow through `UIProvider` and rely on shadcn to install
the transitive registry graph and runtime dependencies. They contain no BLD8
workspace dependency or copied library source before installation.

Each consumer exports its own ordinary `theme.css` from the installed pure helper
and loads it after the installed library CSS. The custom configuration uses system
typography, blue accent and green primary colours, compact density, flat shadows,
and a 9px radius in Next.js or 10px in Vite. The generated document places
`class="bld8-theme"` and `data-ui-theme` together on `<html>`; it imports no lab
component or state. Installed source is transpiled with the checkout's existing
TypeScript compiler solely to generate this exported stylesheet.

After each build, a production/preview server binds only to loopback on an
available port. Fresh browser contexts check both light and dark: actual accent
and primary button fills, field/panel backgrounds, radii, compact control tokens
and measured 40px button/input/NumberField heights in a fine-pointer desktop
context, system fonts, flat shadows and visible keyboard focus.
The session workflow advances using the installed controls. A dialog is opened
outside the content wrapper through a body-mounted portal; its surface, buttons,
typography and radius must inherit the exported theme. Escape must dismiss it and
return focus. Uncaught browser errors fail the check.

An HTTP server binds only to `127.0.0.1` on an available port. It reads the already
generated registry and rewrites its internal production dependency URLs in memory
for that run. It never regenerates or writes public artifacts, and checks their
bytes again at completion. A missing generated registry fails with a build-first
message. This checks local source installation; public HTTPS availability is a
separate release check.

The shadcn CLI is pinned to **4.21.4** and Vite to **8.3.4**, matching the verified
installed consumer manifests. Next.js, React, TypeScript and types use the exact
versions installed by this checkout's lockfile. Review these pins alongside
framework upgrades; no tool uses an unbounded `latest` version.

Each run uses a uniquely created operating-system temporary directory and empty
process-local user/global npm configuration files. npm uses the public registry;
the check does not edit existing npm configuration or credentials. It preserves
an explicit `npm_config_cache` override and otherwise uses npm's normal cache,
including CI's standard cache. Set npm_config_cache on the invocation if you
need an isolated cache; no cache path is persisted to existing configuration.

The temporary registry, fixture servers, browser contexts and consumers are
cleaned up after success or failure.
Cleanup validates the absolute generated path and refuses a symlink or a path
outside the temporary parent. Subprocess output remains in the terminal/CI log.
Network access to npm and the CLI's public metadata sources is required, even
when most packages are cached. Vite may report module-level `use client`
directives and a large-chunk warning; these remain visible in normal logs. For a
local run, redirect full output to an ignored `.local/` log if needed. Acceptance
requires independent type/build success and all computed-style, interaction and
portal assertions. These checks complement the broader browser behaviour and
accessibility tests; they do not replace those release checks.

The fixture also renders the installed FileBrowser, loads Archive on demand,
selects archived-brief.pdf and checks its metadata inspector in both themes. Its
tree and search field inherit the same exported theme. The file browser registry
graph and independent Vite archive are required by the prepared CI workflow.

The installed AnalyticsDashboard also loads its illustrative report in each custom theme. The check explores the chart endpoints by keyboard and opens its exact data table. Chart and analytics source, pure helpers, styles and licences must arrive through the real registry graph; the fixture does not copy them from the checkout.

The installed WindowedTable fixture supplies 240 records in two groups. In each
framework and theme, the browser verifies a bounded mounted row count, End/Home
navigation, the last row's logical index, Space selection and selection of all
120 members of one group. Collapsing that group must preserve its selection and
update the logical row count. These assertions exercise the installed source;
large-data limits, focus recovery, mobile and accessibility cases remain in the
main library test suite.

A separate installed LargeIssueTable supplies 80 illustrative issues through a
stable loader. The browser selects an issue, edits its title in the detail dialog,
saves it locally, then switches to Pages. The updated title and selected ID must
survive that switch, and the regular table must remain page-bounded. This verifies
the composition and installed styles without claiming service persistence or
host authorisation. The application owns those service responsibilities.

The installed SchedulePlanner loads its illustrative availability in both
frameworks and themes. The browser checks explicit UTC offsets, opens the first
available time, verifies focused title entry, books a local appointment, then
opens its details and verifies the normalized UTC start and formatted offset.
Escape dismisses the details. The host retains responsibility for durable
booking, authorised access, availability and atomic revision/overlap checks.

The script descriptions above specify the current checks. Record an observed
consumer-run result in `docs/verification.md` only after both independent builds
and all browser assertions finish successfully; script syntax alone is not a
consumer acceptance result.

## Scheduling consumer verification - 30 October 2026

Both clean consumers passed: actual shadcn 4.21.4 installation resolved a 59-item
dependency graph in each app. Independent Next.js production types/build and
pure helper prerender passed; Vite passed its independent types/build. Four
framework/theme contexts passed the existing theme, portal, file, chart, table
and editing flows plus UTC appointment booking and detail inspection.

The verifier removed its temporary applications and confirmed the generated
production registry bytes were unchanged. Expected Vite module-directive and
fixture chunk warnings remain visible in the log. Evidence is ignored under
.local/schedule-consumers.log; .local/schedule-consumers.status is 0. This is
source installation evidence; public release and host service behaviour remain
separate checks.
