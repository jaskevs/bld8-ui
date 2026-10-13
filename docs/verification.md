## Tailwind and navigation foundation - 13 October 2026

- Production build: 66 pages/routes; all three workspace typechecks pass.
  Catalogue: 40 guidance entries, eight blocks, three templates, eleven starters.
- Final full browser run: 81 passed, with one test expecting to read background
  status while a radio submenu was still open. The test now verifies selection,
  dismisses both menu levels and checks the status; that targeted case passes.
  No application change was needed for that final test correction.
- New coverage includes drawer focus containment/restoration and draft retention,
  real emulated touch swipe dismissal, context-menu keyboard activation,
  disabled/checkbox/radio actions, nested menus, responsive sidebar collapse,
  mobile selection/focus, dark/light axe and reduced motion.
- Existing workflow, icon, motion, layout and collection checks pass. The first
  migration run exposed link colours overridden by unlayered app resets;
  compatibility styles retain their previous priority and light/dark axe passes.
- A real utility edit was applied and restored in the local preview. Tailwind
  rebuilt and the browser updated without restarting. React may refresh the
  page for shared-module changes; persistence of unsaved preview state across
  every code edit is not promised.
- All eleven ZIPs pass CRC/path/source/license checks, including compiled
  Tailwind CSS and SHADCN_LICENSE. The Outline starter was independently
  extracted, installed from cache and built (UI + blocks + Next 16.3.8).
- npm pack --dry-run includes the new compiled controls, CSS and shadcn notice.
  npm audit reports zero vulnerabilities. Git diff whitespace checks pass.
- Final Outline desktop/mobile and drawer images reviewed in .local/previews.
  A development hydration warning was traced to screenshot caret-hiding styles;
  a clean interaction replay produced no browser errors.
- Local preview: http://127.0.0.1:3120. No commit, push, deployment or npm release.
  The /r manifests retain their own BLD8 schema; no shadcn CLI compatibility claim.
  Non-Chromium coverage and manual screen-reader testing remain outstanding.


# Verification - 28 September 2026

## Application workflows - 13 October 2026

- Production build succeeds with 63 generated pages/routes; all three workspace
  typechecks pass. There are 37 guidance entries, eight blocks, three templates
  and eleven generated starters.
- The full 71-test regression run passed. Final focus/clearable/compact refinements
  were checked in 54 affected cases: 53 passed together; one broad name match was
  made exact and passed separately. Three final capture/layout/axe checks also pass.
- Command search/actions/shortcut, focus restoration, multi-select form values,
  date bounds and keyboard movement, local date-only values, range clearing,
  file checks/removal and upload progress/cancel/retry were exercised.
- Table selection survives pages/filters, with mixed header state, visible columns,
  density and bulk actions. Resource CSV exports chosen metadata with quoting and
  formula escaping; archives can be undone. Outline retains edits across views.
  Project creation validates and updates the displayed table.
- Axe passes in light/dark themes and open command/range overlays. No page overflow
  at 1440/768/390/320 px; calendar popups fit the viewport. Desktop/mobile/dark
  Outline captures were reviewed and saved in the task's local preview folder.
- All eleven ZIPs pass CRC/safe-path checks and contain compiled/editable source
  and MIT/Lucide/DayPicker notices. They exclude environment files, credentials,
  parent paths and installed dependencies. The final Outline ZIP was extracted
  into a separate folder, installed from the offline cache and built independently.
- Local preview stays on 3120. No commit, push, npm publication, account change
  or deployment was made. Real persistence/uploads, non-Chromium coverage and
  manual screen-reader verification are not claimed.

## Icon foundation and control extensions - 13 October 2026

Verified against the final icon directory/mobile inspector implementation:

- Production build: 53 generated pages. UI/blocks compilation and all three
  workspace type checks passed.
- Final full browser suite: all 53 checks passed in 36.7 seconds. This includes
  the existing component/blocks tests and 11 icon/control/mobile checks.
- Full directory: 1,877 canonical Lucide 1.55.0 icons, excluding aliases, with
  generated 1.5/1.75/2 stroke SVG profiles and retained ISC/Feather MIT notices.
- Search, category filtering, pagination and empty-state reset; actual React-code
  copy and SVG copy; downloads preserve stroke settings and licence notices.
- Shared icon dimensions and stroke defaults; meaningful image labels,
  decorative button glyphs and the unchanged eight-dot BLD8 arrow artwork.
- InputGroup clear actions, native field labels, invalid descriptions and visible
  keyboard focus. Button/IconButton Lucide props work with existing variants.
- Automated axe checks in both themes for the directory, Icon and InputGroup;
  the open mobile inspector also passes. Escape restores focus to the tile that
  opened it. Existing accessibility/overlay and reduced-motion checks still pass.
- No page overflow at 1440/768/390/320 px. Desktop/mobile/dark screenshots were
  reviewed; mobile browsing remains visible ahead of its on-demand Sheet.
- Extracted a regenerated Studio starter, installed from the offline cache and
  built it independently with Lucide and the included LUCIDE_LICENSE file.

The first build exposed a JSX style-brace error in the preview helper; it was
corrected before these final checks. Generated icon assets stay out of Git and
out of ordinary application icon imports. No commits, pushes, deployment or npm
publication occurred. Manual assistive-technology review remains pending.

## Library expansion - 13 October 2026

Completed locally against the current source:

- Core UI and blocks compilation, Next.js production build (50 generated pages),
  and explicit TypeScript checks for all three workspaces.
- All 42 Playwright checks passed in the final full run (29.8 seconds). This
  includes the existing 26 checks plus 16 collection/blocks/template checks.
- Category, collection and text filtering; reset/empty results; full source and
  stylesheet views; all eight anonymous manifests and ZIP downloads.
- Sign-in validation without a real authentication claim; account validation and
  local saving; period/metric changes; activity filtering; duplicate-invitation
  rejection/local row creation; task creation/stage changes; template view
  navigation; dialog dismissal and focus return.
- Automated axe checks for new home, catalogues, plans, team, board and Studio
  in both themes. Existing component/overlay accessibility checks also pass.
- No horizontal page overflow at 1440, 768, 390 and 320 px across the new pages;
  no browser page errors. Mobile preview adapts to its container independently
  of the desktop viewport; reduced motion disables width transitions.
- Extracted Studio ZIP into a separate temporary workspace, installed using the
  existing offline npm cache, and successfully built the independent Next.js app.
  Repeated the build from the final generated ZIP after reusable style changes.
- All eight archives passed ZIP CRC, path allowlist and licence-presence checks.
  All original BLD8 source is MIT by the user's explicit choice; Base UI's notice
  is included. No environment files or workspace credentials are in the ZIPs.
- Reviewed desktop home/catalogue/Studio, mobile home and dark plans screenshots.
- A real temporary package CSS variable edit refreshed the open development page
  without navigation or reload. The edit was restored and removal was confirmed.

The first pass exposed ambiguous code locators and required labels whose visual
asterisk did not match an exact label-text selector. The tests now use accessible
names, and required fields propagate their native required state. Final checks
pass. Screenshot/validation artifacts stay outside the repository.

Local preview is running at http://127.0.0.1:3120. No commit, push, deployment or
npm publication occurred in this request. Manual screen-reader review,
Safari/Firefox, RTL/localisation and real backend integration remain pending.
Later historical sections below describe the earlier release.

Completed locally:

- Reusable library TypeScript build and Next.js production build; 28 component/pattern routes plus home, catalog, foundations, examples and installation guide.
- Type checks for both workspaces.
- All 19 Playwright checks passed after fixes. The final full run passed 18; the remaining toast test had an ambiguous code-example text selector and passed its targeted rerun after correction.
- Keyboard selection, combobox search/empty results, tabs, accordion, checkbox/switch state, menu actions, dialog validation/focus trap/focus return, sheet/popover dismissal, tooltips and toast dismissal.
- Data table filtering, sorting, pagination and empty results; the project example creates an actual in-memory record. The profile example validates email; an additional check confirmed empty display names are rejected.
- Automated axe checks of catalog, examples, foundations and an open dialog in light and dark themes. Additional checks of open tooltip/toast passed, including the tooltip description association.
- No horizontal overflow on the primary pages and table detail at 1440, 768, 390 and 320 px. No browser page errors in these route checks.
- Desktop home, light/dark examples and website project-panel screenshots reviewed.
- npm pack produced bld8-ui-0.1.0.tgz with compiled ESM, declarations, CSS and notices. The compiled entry point imports and renders outside Next.js.
- A real temporary CSS edit in packages/ui/src refreshed the open showcase without navigation or reload; the verification style was then removed.

The first pass identified a missing tooltip role/description link and a narrow-screen grid min-width issue. Both were corrected. Other initial failures were locator ambiguity between modal dialogs and toast dialogs, code samples and live messages, or Next.js route announcements.

Manual screen-reader review, Safari/Firefox, RTL/localisation, a second application's installation/build and longer-term API usage remain pending. No production-grade accessibility certification is implied. This is an initial local library, with advanced components listed in scope.md.

Preview: http://127.0.0.1:3120. The sibling website continues on port 3117. No Git repository, commit, push, npm publication or deployment was created for this library.
## Borderless surfaces and shared motion - 28 September 2026

Refined the library and showcase using the user's Carl Hauser reference: light-grey
canvas, white borderless cards, charcoal type and retained lime accents. Added shared
160/280/440 ms timing tokens, moving tab indicators, smooth switch/disclosure changes,
consistent overlay transitions, stable hover targets and loading buttons that keep
their dimensions. /motion provides four working studies; Home uses the same tab study.
Read design-and-motion.md for the implementation boundaries and interaction rules.

Validation on the final source:
- Library compilation and Next.js production build passed, generating 36 routes.
- All 23 Playwright checks passed in one final run.
- New normal-motion checks cover interrupted tab selections, keyboard selection,
  indicator alignment, stable loading dimensions, stable hover targets and overlay
  dismissal/focus return. Reduced-motion checks cover indicator, switch and dialog.
- Existing behaviour checks remain green. Automated axe scans now include /motion
  in both light and dark themes. Responsive checks include the new page at 1440,
  768, 390 and 320 px, with no horizontal overflow or browser page errors.
- Desktop Home, catalog, light/dark motion studies and the 320 px motion page were
  visually reviewed in isolated Edge. No user browser profile was used.
- Rapid tab switching initially left outgoing panels in layout during their final
  animation frame. Outgoing panels now leave layout immediately; the new check
  confirms only the active panel is visible. A test scrolling issue was also fixed.

No commit, push, publication or deployment. Manual screen-reader and cross-browser
review remain pending as recorded above. Live development stays on port 3120.
## Yellow, black and neutral surfaces - 28 September 2026

The user requested yellow/black contrast with white and light-grey foundations.
Replaced the library's lime palette with near-black primary actions (#171717) and
warm yellow accents (#ffe24a), including a typed accent Button variant. Neutral
surface tokens no longer have a green tint. Dark mode keeps equivalent contrast.
The portfolio website's separate palette was not changed.

Shared gutters align header, page content and footer. Catalog cards now stretch
consistently and align caption dividers. Panel padding, radii and grid gaps share
values. The small brand mark is an aligned SVG, and text-link underlines use the
same eased timing as the component interactions. Borderless white cards remain.
Updated foundation examples, button usage guidance and Claude instructions.

Validation:
- Library and showcase production build passed; 36 generated routes.
- All 23 browser checks passed, covering responsive layouts, normal/reduced motion,
  keyboard behaviour and automated axe scans in both light and dark themes.
- Additional browser measurements confirmed matching header/content/footer edges
  at 1440, 768, 390 and 320 px, no overflow and the intended primary/accent colours.
- Desktop home, motion studies, catalog and phone motion screenshots were reviewed.
- The local installable tarball was refreshed successfully using npm pack offline.

Port 3121 was occupied by another local server, which was preserved. The test
configuration now accepts BLD8_UI_TEST_PORT; this run used a fresh server on 3122.
The development preview remains on 3120. No commit, push, publication or deployment.
## Public first edition and floating menu - 28 September 2026

The showcase is now live at https://bld8-ui.vercel.app. This supersedes the earlier
local-only deployment status above. See deployment.md for settings and ownership.
Added sticky desktop/mobile navigation, active-link treatment, mobile dismissal
and focus return, a public usage/audience explanation, site icon, robots and sitemap.
The final menu correction keeps a white border and no shadow at the top, adds a
soft eased shadow while scrolling, and removes it when returning to the top.

- The initial floating-header implementation passed all 26 Playwright checks in
  one run, including existing component, normal/reduced motion and automated axe
  checks, plus three new navigation checks.
- After the final white-border and live-URL changes, the local production build
  passed (39 generated routes) and all three navigation checks passed again.
- Vercel production build completed successfully with the corrected workspace
  installation. Production state: READY.
- Anonymous requests to the primary pages, Button detail, icon, robots and
  sitemap all returned 200. All 34 sitemap URLs use the chosen Vercel host.
- Public-site Edge checks at 1440 and 390 px verified the white border in both
  states, no shadow at the top, a visible shadow after scrolling, pinned overlay
  placement, shadow removal on return to top, and mobile navigation. No horizontal
  overflow or browser page errors. Both viewport screenshots reviewed.

The custom domain is deferred at the user's request. No Git repository, commit,
push or npm publication was made. Automatic Git deployment is not configured
for this new project. Manual assistive-technology and cross-browser review remain
pending. The local development preview remains on port 3120.

## Initial Git release verification - 30 September 2026

The library/showcase build, explicit type checks and all 26 existing Playwright
checks passed before the first source commit. Tests used an isolated Edge profile
and their own server on port 3122. Existing development servers were preserved.
Generated output, test results, local artifacts, .env files and .vercel metadata
are excluded from Git. Personal identity and work-hour hooks apply to this new
repository; no npm publication or new deployment is part of the source push.
