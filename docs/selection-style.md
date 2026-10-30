# Shared selection style

Selected and highlighted items use a softly tinted surface with clear foreground text.
Golden yellow on/off controls and accent actions pair with champagne selected surfaces.
Selection, keyboard
focus, hover and error are separate states; colour alone must not carry meaning.

## Tokens

- --bui-selected-bg: persistent selected surface.
- --bui-selected-hover: a stronger tint of the same hue for interaction.
- --bui-selected-ink: readable text on either selected surface.
- --bui-selected-marker: restrained navigation marker.
- --bui-shadow-selected: quiet inset definition; flat themes set it to none.

Both light and dark values ship in tokens.css and exported theme CSS. The theme
lab reports normal and hover selection-text contrast alongside action contrast.
BLD8 uses dark primary actions, golden yellow accents and pale champagne selection.
Presets and custom accents derive their own readable shades; consumers can override the exported
variables in a theme stylesheet.

## Apply by interaction

Tree and sidebar navigation use a short rounded marker inset from the edge.
Menus and lists use their existing checkmarks and the shared backplate, without
the old full-height left-edge rail. Tabs retain their moving underline. Tables
fill selected cells consistently, including pinned cells. Saved-view and layout
indicators share the same surface while retaining their existing eased motion.
Catalogue navigation and preview controls follow the same selection language.

Keep geometry steady when selection changes. Do not add borders that shift text
or icons, animate hit-target size, or reuse selection shadows on Boolean controls.
Keyboard focus remains visible independently. Destructive actions retain their
error foreground/background, and forced-colour modes use system selection/focus
colours. Reduced motion continues to remove animated travel.

Accent badges, avatars, illustrations, checked choices, switches, slider fills
and selected date endpoints follow the shared accent. Progress uses the stronger
evergreen data shade so its value remains visible on a pale track.
Calendar range interiors use the shared tinted selection surface. This is a
selection refinement, not a change to control semantics or the public APIs.

See verification.md for the actual checks and visual approval record. Local
changes are not published until an authorised source release.
