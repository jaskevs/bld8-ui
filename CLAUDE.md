# BLD8 UI working context

Read README.md, docs/architecture.md, docs/scope.md, docs/design-and-motion.md, docs/verification.md and docs/deployment.md before changing this project. This is a new, separate React-first library requested on 28 September 2026. The portfolio website is a sibling and remains independent. Existing roadmap dates were not changed; this project has not yet been allocated time in that roadmap.

Use Base UI as a maintained dependency for complex behaviour. Keep the BLD8 styled layer original: white/neutral grey/near-black/yellow, clear typography, small control corners and restrained motion. Primary actions use near-black (#171717), while the accent variant and selected controls use warm yellow (#ffe24a) with dark text. The user requested this palette in place of lime for the library. The portfolio palette remains independent. The main canvas is light grey; white cards have no outer border. Keep purposeful internal rules and focus indicators. Shared timings are 160/280/440 ms. The user prioritises smooth, considered interactions, following the Carl Hauser reference. Review /motion for the working studies. Native HTML is appropriate for simpler controls. Keep accessibility claims precise; automated checks do not replace manual assistive-technology review.

Package code belongs in packages/ui. The showcase in apps/docs must consume its public exports; do not implement duplicate lookalike components only for demos. React 19 is the current peer requirement. Plain CSS and semantic custom properties keep the package independent of Next.js and Tailwind.

The showcase has actual in-memory demos with explicitly labelled sample data. No backend is implied. Do not invent adoption, production usage or completion claims. Text stays concise and genuine. Notes to self are brief explanations of decisions, not marketing.

Root npm run dev builds and watches the package and starts Next.js on 3120. Tests use a production server on 3121. The sibling website uses 3117; do not stop or replace it.

Do not commit, push, publish or deploy without an explicit request. Do not change company/global Git, GitHub CLI, npm or SSH configuration. User-owned commits must use Jaison <26425317+jaskevs@users.noreply.github.com> as author and committer without co-author trailers. Public licence and package namespace remain pending.
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
private and UNLICENSED. Git is initialised with the isolated personal remote jaskevs/bld8-ui.
Automatic Git deployment is not enabled; the showcase still uses direct deployment.

Keep the menu border white. At the top it has no shadow; after 16 px of scrolling
it gains a soft eased shadow and remains a sticky overlay (12 px desktop,
8 px mobile). Returning to the top removes the shadow. Mobile navigation supports
Escape/focus return, outside click and closing after link selection. Keep
reduced-motion behaviour and immediate keyboard focus. The public guide explains
who the library is for without implying the package is available on npm.

## Public source decision - 30 September 2026

The user explicitly chose to keep jaskevs/bld8-ui public and push the source.
The npm package remains unpublished and UNLICENSED. Git-to-Vercel deployment
is not connected; the current showcase remains online from direct deployment.
