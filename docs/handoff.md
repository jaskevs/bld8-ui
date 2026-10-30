# Development handoff — 30 October 2026

Today's work is wrapped up locally. Read this with verification.md and
library-direction.md before continuing. The fixed Workbench roadmap and exam
allocation are unchanged.

## Current state

- Palette: #FFD900, warm neutral canvas, white panels, dark primary actions and
  related evergreen/mint support colours. Shared inset choices and easing.
- 53 guidance entries, 16 blocks, 3 templates, 147 registry items and 40 starters
  (21 Next.js / 19 Vite). npm packages remain private and unpublished.
- Grouped pages and a bounded windowed table; shared selection, external detail
  drafts, keyboard/focus recovery and a 10,000-issue example.
- Embedded Mobile layouts follow their own container. Both the narrow preview
  inside a wide browser and phone-width screens are checked.
- DayAgenda/SchedulePlanner use supplied UTC availability, explicit offsets,
  retained drafts and guarded callbacks. See scheduling.md for their limits.
- Final polish removes repeated start times and exposes the end time through
  accessible descriptions. Overnight bookings show their complete end date.
- Touch-editable fields have a 16px minimum font, including compact inputs,
  numeric fields and multi-select searches. Larger custom text stays larger;
  fine-pointer desktop sizing is preserved. Pinch zoom remains unrestricted.
- Preview and template marks use the shared Icon name="mark" vector rather
  than a Unicode symbol that a phone can replace with a colour emoji.

## Review locally

- http://127.0.0.1:3120/components — touch search focus and blur.
- http://127.0.0.1:3120/blocks — dark-on-yellow artwork marks.
- http://127.0.0.1:3120/blocks/large-issue-table — Mobile in the preview toolbar.
- http://127.0.0.1:3120/blocks/schedule-planner — booking, retry and cancellation.
- http://127.0.0.1:3120/themes — portable configuration.

The local preview runs on port 3120. If it has stopped, use Node 22 and npm run dev
from this repository; check the port before starting another copy. Browser tests
use a separate production server, with 3129 used for this session. Installed Edge
was selected with PLAYWRIGHT_CHANNEL=msedge in a temporary test profile; no global
browser or account settings changed.

## Verification and publication

The production build and all 406 domain/browser checks pass.
All 116 pinned Linux checks pass: 20 images, 84 workflow checks and 12
touch checks across Chromium, Firefox and WebKit in both themes. Four agenda
references were reviewed for the final wording; the other 16 remain unchanged.
All 40 archives pass CRC, path, licence and source checks, including the touch
font floor and vector marks. Earlier clean Next.js/Vite installations proved the
59-item dependency graph; those installations were not repeated for these fixes.
The theme editor's more specific fallback-field override was corrected after the
complete run. Its final build, 18 theme checks and all 12 expanded
touch cases pass separately. The fine-pointer image rules are unchanged.

Desktop browser touch emulation does not reproduce the physical iPhone keyboard
or prove UIKit's focus-zoom behaviour. After publication, confirm focus/blur and
pinch zoom on the reporting phone. Manual assistive-technology review also remains.

The owner authorised source check-in and push on 30 October, after 17:00 in
Australia/Melbourne. This handoff accompanies that source release, including the
earlier approved theme, data, file and scheduling increments. The npm packages
remain private and unpublished. Verify the exact Git revision in GitHub Actions
and Vercel before treating the source as live; a successful local build alone is
not evidence of production deployment. Follow ../AGENTS.md for later releases.

## Next session

1. Observe CI/deployment checks for the source release and its exact revision.
2. Confirm the two reported mobile issues on the physical iPhone after release.
3. Next feature slice: a narrow comment composer, after reviewing its editor,
   licence and sanitisation contract.

Recurrence, resource allocation, calendar sync and a production booking service
remain outside the schedule example. No further feature work is open today.
