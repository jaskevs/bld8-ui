# Application motion and additional charts

The motion controls use the existing Motion dependency. They preserve native
input state and focus, and respect live system or scoped reduced-motion settings.
They are application building blocks; animations do not replace loading, error
messages, keyboard semantics or persistence.

## Motion primitives

- `AnimatedList<T>` takes `items`, a stable unique `getKey`, a render function and
  an accessible `label`. It retains keyed input drafts during reordering, makes
  exiting rows inert and recovers focus when the active row is removed. At most
  200 rows are supported. Use a table or virtual grid for larger datasets.
- `AnimatedNumber` visually interpolates finite values. Assistive technology gets
  one committed, locale-formatted target, without a live-region announcement on
  every frame. Supply `label` when context is not clear. Hidden/offscreen changes
  settle without spending time animating invisible content.
- `AutoHeight` measures intrinsic content with ResizeObserver. Server-rendered
  content is visible, text is never scaled, and interrupted changes retarget the
  current animation. The host owns focus when removing arbitrary content. Use
  `Reveal` when the task also needs disclosure/presence semantics.
- `LayoutTransitionGroup` namespaces shared elements. `LayoutTransition` defaults
  to position changes so text stays crisp. Shared `layoutId` values remain inside
  their group; a host still supplies buttons, selection state and keyboard paths.

Durations are bounded between zero and two seconds. Defaults use the shared
ease-out curve; reduced motion settles directly. Begin with the complete
[keyed list example](https://ui.bld8.dev/components/animated-list/examples/motion-list-updates)
and [intrinsic height example](https://ui.bld8.dev/components/auto-height/examples/motion-intrinsic-height).

## Exact data, including what is missing

`DonutChart` accepts up to 24 non-negative categories. `Sparkline` accepts up to
366 signed observations, with `null` creating a gap. `StackedBarChart` accepts up
to 100 rows and six non-negative series, with absolute and percentage modes.
Duplicate identities, invalid numbers and overflowing totals fail explicitly.

Series use the existing `--bui-chart-1` through `--bui-chart-6` tokens. Colors stay
tied to original series order when a category is hidden. Labels, legend state
and exact tables keep information available without relying on color. A missing
value remains missing; hiding a series changes visible totals, never source
values. Percentage stacks retain their original numbers in the table.

Each chart has a label and exact data disclosure. Donut and stacked legends are
real buttons and retain focus after toggling. Sparklines are compact read-only
trends; the existing `Chart` provides interactive point exploration. The charts
inherit the scoped locale and accept explicit Intl formatting options. Translate
application labels at the host; built-in chart table captions currently use
English. Do not describe the whole library as fully translated.

Use named registry entries such as `donut-chart`, `sparkline`, `stacked-bar-chart`
and `animated-list`, or their complete example entries. Installs include only
the source dependency graph and shared styles/notices. Generated API and agent
documents describe the same declarations and source examples.

## Review boundaries

These controls have bounded datasets and testable keyboard/focus contracts. They
do not claim frame-rate guarantees or assistive-technology certification. Review
motion in the consuming layout, test physical touch devices when available and
keep native browser zoom enabled.
