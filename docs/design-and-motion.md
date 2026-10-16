# Visual direction and motion

## Shared material and sizing - 16 October 2026

Use a warm grey canvas (#eeede9), borderless white panels, near-black type and
the existing warm yellow (#ffe24a). Raised surfaces have a fine upper highlight
and a quiet lower shadow. Fields sit slightly inward. Selections use a recessed
yellow face with a dark indicator. The effect comes from CSS shadows, never
blurred text, raster artwork, enlarged controls or decorative movement.

- Fields and actions: 44 px regular, 36 px compact, 48 px large; 4 px corners.
- Checkboxes and radios: 20 px faces; 44 px label targets; 12 px text gaps. Their
  faces are borderless and use the switch track fill and exact off/on shadow
  tokens. Radio dots share the switch thumb highlight and shadow treatment.
  Checkmarks stay crisp; keyboard/system-colour edges remain explicit.
- Switches: 44 x 26 px track, 20 px thumb, 3 px even inset. The selected thumb is
  dark on yellow. Off-state colours remain distinct in both themes.
- Sliders: 6 px recessed track, yellow completed segment, 18 px solid thumb and
  a 44 px interactive height. Value updates remain immediate while dragging.
- Menus: 40 px rows, 8 px corners and aligned labels, icons and shortcut hints.
- Panels: 12 px corners with 24 px padding and shared spacing tokens. Smaller
  screens reduce panel gutters while keeping touch targets and text readable.

The material reaches buttons, inputs, grouped fields, selects, chips, choices,
calendar selections, progress, navigation, overlays, file feedback and composed
blocks/templates through public tokens and styles. Status colours keep their
meaning; quiet structural elements such as table rules and tabs remain light.
Choice shadows and switch/slider thumb shadows have their own tokens so surfaces
can be themed without changing behaviour or adding a runtime dependency.

State changes use shared 140 / 220 / 320 ms durations and interruptible easing.
Switch thumbs remain circular and constant in size through hover, press, travel
and reversal: there is no squash, stretch or overshoot. Slider hover and press
change the shadow without changing its shape. Checkbox marks and radio dots ease
into place within a fixed target. Keyboard focus appears immediately and remains
separate from elevation. Reduced motion removes transitions; forced colours
restore explicit system-colour boundaries and indicators.

The Foundations specimen uses public components to show all control families in
light and dark themes, including long content, errors, disabled controls, keyboard
behaviour, dates, files and overlays. These are the same controls consumed by
blocks and templates, with no specimen-only material styling.

## Table experience - 15 October 2026

The table uses one measured column grid for headers, values and pinned offsets.
Column alignment supports start/centre/end; numeric headers and values share the
same edge. Selection has a dedicated 48 px column with centred hit areas. Row
padding and value heights stay consistent in both density settings.

EditableCell displays the value itself as the activation target, with no repeated
Edit label or pencil. Click, Enter or F2 opens editing. Display content must be
non-interactive. Save/cancel, validation, failed saves and revision checks remain.
Outline provides one row menu for full project details and deletion, with explicit
focus return. Density lives under Columns; export remains a labelled header action.

Existing rows and in-progress edits remain mounted during list refreshes, with
visible updating feedback. Fatal initial failures retain retry feedback. Record
keys and captured edit revisions are preserved. Small screens scroll within the
table region; the surrounding page remains contained.

## Shared control system - 15 October 2026

BLD8 uses one control system across components, blocks and templates. The rules
below define its spacing, surfaces, focus treatment and motion.

- Spacing uses shared 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px tokens.
- Fields and actions share a 44 px baseline, 36 px compact and 48 px large variants.
  Compact buttons and menu items expand for coarse pointers. Icon buttons stay square.
- Controls use 4 px corners, floating menus 8 px and panels 12 px. White panels
  remain borderless against a light grey canvas; field boundaries remain purposeful.
- Control text is 14 px, labels 13 px and supporting information 12 px.
  Menus use 40 px rows with 8 / 12 px padding and consistent selected indicators.
- Native radios and sliders keep their keyboard behaviour with themed visuals.
  Slider fill follows its real min/max range. Descriptions are separate from choice names.
- Press feedback uses colour without scaling text or moving the button target.
  Menus use opacity and small translations, without scaling their contents.
- Fields have one continuous focus edge. Menus use an inset indicator; error,
  disabled, loading and destructive states keep their own meaning. System-colour
  focus indicators remain available in forced-colour mode.
- Dialog and drawer headings, close actions and body spacing use the same hierarchy.
  All overlays retain dismissal, focus management and the shared easing.
- Surface, resting-action, hover and overlay shadows use separate theme tokens.
  Panels receive only the lightest shadow; primary actions gain a little depth
  on hover without shifting. Ghost actions stay quiet.
- Keyboard focus appears immediately. Colour and shadow settle through the shared
  easing; menus travel only a few pixels. No stagger delays interrupt an action.
- Reduced motion removes transitions and animation. Icons remain vector shapes.

The Foundations page includes a live Control states specimen for reviewing actions,
fields, choices, overlays and feedback in light/dark modes and at mobile widths.
These are the public controls used by the library, not separate demonstration styles.


Controls added on 13 October use the same palette and timings. Dates use a compact
grid and a quiet range band. Commands keep a stable search field over a scrollable
list. File drop feedback and table selection change colour within their bounds.
Dense table rows retain native horizontal scrolling on small screens. New panels
are borderless white on grey. Focus remains visible independently of hover;
reduced motion applies throughout. No calendar animation interrupts key navigation.

The visual direction is quiet and minimal: clear hierarchy, useful space and
small, responsive interactions.

## Surfaces

Use --bui-canvas (#eeede9) around white --bui-bg panels. Cards and showcase frames
have no outer border; their fill defines the edge. Internal rules, form boundaries
and focus indicators still have a purpose. Use near-black (#171717) for type and primary actions, and warm yellow (#ffe24a) for accents with dark text. This palette supersedes the earlier lime direction for the component library. Use the shared palette tokens consistently.
Dark mode supplies a darker canvas with raised charcoal panels. Forced-colour
mode restores panel outlines when fill alone cannot distinguish the surface.

Primary buttons use --bui-primary/--bui-primary-ink; the accent variant uses
--bui-accent/--bui-accent-ink. Keep these independent when theming. Status colours
retain their meaning. Light-mode greys have a restrained warm cast, with no green tint. Shared
page gutters align the header, content and footer; panels use 24 px grid gaps,
consistent internal padding and aligned caption areas.

## Shared motion

- --bui-duration-fast: 140ms, for press feedback and overlay exits.
- --bui-duration: 220ms, for colours, fades and incoming tab content.
- --bui-duration-slow: 320ms, for selection indicators, switches, disclosure height and overlay movement.
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

## Library structure - 13 October 2026

Components provide individual controls; blocks compose a reusable workflow;
templates bring those workflows together as a complete example application.

The home now previews compositions, distinguishes controls from blocks and
templates, and explains both $0 collections. Card previews are original crisp
HTML/CSS illustrations; full detail previews consume the real reusable package.
Collection badges indicate composition scope, never a paywall. Desktop/mobile
preview widths use container queries that travel with the blocks stylesheet.

Existing motion timings, reduced-motion behaviour and white floating-menu border
remain. Controls keep stable hover targets. No decorative loops or scroll
interception were added. The light-grey canvas and borderless white panels remain.

## Icon consistency - 13 October 2026

Standard control icons use the Lucide family through one BLD8 wrapper, with an
18px size, 1.75 stroke and currentColor by default. Named components keep the API
explicit. The original dotted BLD8 link arrow retains its two trailing dots.
Icons remain SVG at all sizes; no icon font, raster export or blur effect is used.

The directory has 16/18/20/24/32px previews and 1.5/1.75/2 stroke profiles.
Actual-size and 2x detail views are labelled. Accent preview uses yellow on
near-black so the shape remains visible. Desktop has a sticky inspector; mobile
opens the existing eased Sheet after selection, keeping search and browsing
visible. Escape restores focus to the initiating tile. Reduced motion is retained.

Text-labelled controls use decorative icons. Standalone meaningful icons and
icon-only buttons have explicit accessible names. Input adornments share one
field boundary and immediate keyboard focus indicators.

## Earlier motion studies

/motion contains four live studies: tab selection, saving a preference, accordion
disclosure and dialog/sheet context. These consume the same public components as
applications. The save is deliberately simulated; sample state resets on reload.
The home page also includes the live tab study.

## Floating navigation

The showcase header aligns with the content gutters and stays pinned 12 px from
the top on desktop, 8 px on mobile. Its border is white in both scroll states.
At the top there is no shadow; after 16 px of scrolling a restrained shadow
appears with the shared 320 ms easing. Returning to the top removes it. The
translucent surface keeps the navigation above content without moving its hover
targets. Only content behind the surface is blurred; text and icons remain crisp.
Forced-colour mode preserves an explicit system-colour edge.

On mobile, Menu opens a compact overlay with eased opacity and movement. Hidden
links are inert. Escape returns focus to Menu; outside clicks and link selection
close it. Reduced-motion preferences disable transitions while preserving all
states and actions.
