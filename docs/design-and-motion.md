# Visual direction and motion

Updated 28 September 2026. The user referenced https://www.carlhauser.com/projects
for a quiet, minimal visual direction and made smooth interactions the priority.
The interpretation is original BLD8 styling, not copied assets or page content.

## Surfaces

Use --bui-canvas (#f5f5f5) around white --bui-bg panels. Cards and showcase frames
have no outer border; their fill defines the edge. Internal rules, form boundaries
and focus indicators still have a purpose. Use near-black (#171717) for type and primary actions, and warm yellow (#ffe24a) for accents with dark text. This palette supersedes the earlier lime direction for the component library. The yellow is our selected interpretation, not a sampled reference-site token.
Dark mode supplies a darker canvas with raised charcoal panels. Forced-colour
mode restores panel outlines when fill alone cannot distinguish the surface.

Primary buttons use --bui-primary/--bui-primary-ink; the accent variant uses
--bui-accent/--bui-accent-ink. Keep these independent when theming. Status colours
retain their meaning. Light-mode greys are neutral, with no green cast. Shared
page gutters align the header, content and footer; panels use 24 px grid gaps,
consistent internal padding and aligned caption areas.

## Shared motion

- --bui-duration-fast: 160ms, for press feedback and overlay exits.
- --bui-duration: 280ms, for colours, fades and incoming tab content.
- --bui-duration-slow: 440ms, for selection indicators, switches, disclosure height and overlay movement.
- --bui-ease: cubic-bezier(.16,1,.3,1), for a quick response with a gentle settle.
- --bui-ease-exit: cubic-bezier(.4,0,1,1), for prompt dismissal.

Use CSS transitions and Base UI lifecycle attributes; no new animation dependency.
Buttons keep their hover target still and move the supporting arrow by 2 px.
Press feedback is brief. Loading hides the label visually beneath a centred
spinner while retaining its dimensions and accessible name.

Tabs use Base UI's measured indicator. Incoming content fades a few pixels into
place; outgoing content immediately leaves layout so rapid selections cannot
stack panels. Accordion height follows its content. Dialogs, sheets, popovers,
menus, tooltips and toasts share timing rather than unrelated hardcoded speeds.
Do not add decorative loops, blur filters, cursor chasing or scroll interception.

Keyboard focus remains immediate. Reduced-motion settings disable animation and
transitions, including pseudo-elements, while preserving state changes. Hover
movement is limited to fine pointers. Keep keyboard dismissal and focus return.

## Try it

/motion contains four live studies: tab selection, saving a preference, accordion
disclosure and dialog/sheet context. These consume the same public components as
applications. The save is deliberately simulated; sample state resets on reload.
The home page also includes the live tab study.

Reference and behaviour documentation checked:
- https://www.carlhauser.com/projects
- https://base-ui.com/react/components/tabs
- https://base-ui.com/react/handbook/animation
## Floating navigation

The showcase header aligns with the content gutters and stays pinned 12 px from
the top on desktop, 8 px on mobile. Its border is white in both scroll states.
At the top there is no shadow; after 16 px of scrolling a restrained shadow
appears with the shared 440 ms easing. Returning to the top removes it. The
translucent surface keeps the navigation above content without moving its hover
targets. Only content behind the surface is blurred; text and icons remain crisp.
Forced-colour mode preserves an explicit system-colour edge.

On mobile, Menu opens a compact overlay with eased opacity and movement. Hidden
links are inert. Escape returns focus to Menu; outside clicks and link selection
close it. Reduced-motion preferences disable transitions while preserving all
states and actions.
