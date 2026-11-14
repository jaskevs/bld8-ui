# Restrained visual compositions

The visual collection complements application controls with small, reusable
product-page building blocks. It preserves white/light-gray surfaces, readable
content, explicit actions and the shared #FFD900 accent. It adds no animation
dependency; system and scoped reduced-motion preferences stay authoritative.

## Text and keyed entrances

`TextReveal` presents real words in their original reading order. Select `as` to
fit the document's heading hierarchy. The text is present on the server, without
a second accessible copy or character scrambling. One short entrance follows
viewport observation. Long text beyond 4,000 characters or 120 tokens stays
static; delay and interval values are bounded. Remount with an explicit key only
when replay is a deliberate host action.

`Stagger` introduces up to 24 child blocks once. React keys retain interactive
child state when the order changes; larger collections stay static. Use stable
keys for movable content, and keep native list/table semantics outside this
generic div composition. Content remains available before observation. Neither
component loops or adds hover-only information.

## BentoGrid and ProductPreview

`BentoGrid` supplies one to three columns. `BentoItem` can span columns/rows and
render an article, section or div to match its content. A container query adapts
cards inside narrow panels even when the browser window is wide. Cards retain
their document order and stack on small containers. Interactive content belongs
to real links and buttons; the entire card is not automatically clickable.

`ProductPreview` is a static figure with a semantic caption and explicit actions.
Supply local UI children or an image with alternative text. The optional frame
address is decorative context, not a fake navigation control. Its dots have no
button semantics. Image aspect ratios are bounded and use contain fitting.
The complete example connects its detail action to a real focus-managed dialog.

## Carousel

`Carousel` supports at most 20 stable-ID, labelled slides. Its viewport uses native
horizontal scrolling and CSS scroll snapping. Touch and trackpad gestures remain
native, without wheel interception or mandatory dragging. Previous/Next controls
retain focus; focusing the viewport enables logical arrows and Home/End. Embedded
controls retain their own keyboard events. Offscreen slides stay in document
order so tab navigation can bring their controls into view.

Automatic rotation is opt-in with `autoplay` from 3,000 to 60,000 milliseconds.
An explicit pause/start control remains available. Focus and pointer interaction
pause until restarted; hover, offscreen/document visibility and reduced motion
pause rotation as applicable. Automatic changes do not create live-region
announcements. Manual changes announce the selected slide. Native smooth
scrolling settles directly when reduced motion is enabled.

`defaultIndex` selects the initial slide. `onIndexChange` reports navigation; the
host owns application data and slide content. No remote image loading service,
media playback synchronization or analytics tracking is supplied.

## Review in the consuming page

Use the complete source examples for real interactions and keyboard paths. Review
text hierarchy, translated labels, focus, touch targets and narrow containers in
the actual layout. Reduced-motion tests and emulated browsers do not replace a
physical-phone or assistive-technology review. The collection claims no frame-rate
guarantee, conversion uplift or accessibility certification.
