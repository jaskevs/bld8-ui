# Scoped interfaces, dates and times

Use `UIProvider` to configure a workspace without changing the surrounding page.
An existing `<UIProvider>{children}</UIProvider>` keeps its original presentation.
The optional `theme`, `tokens`, `locale`, `direction`, `messages`, `motion` and
`portalContainer` properties establish a local configuration boundary.

```tsx
<UIProvider theme="light" locale="en-AU" direction="ltr">
  <ReviewWorkspace />
</UIProvider>
<UIProvider theme="dark" locale="ar" direction="rtl" motion="reduced">
  <ReviewWorkspace />
</UIProvider>
```

Configured boundaries render a local wrapper and portal host. Dialogs, drawers,
menus, choices, date popups and tooltips carry the owning tokens, language and
direction through their portals, including an explicitly supplied external
container. A nested provider inherits unspecified settings; an explicit child
theme establishes its own base surfaces. This does not change document theme,
storage or application routing. Normal modal focus, inertness and scroll locking
remain managed by the underlying primitive.

`tokens` accepts `--bui-*` custom properties. `messages` overrides a flat message
dictionary. `useUIConfig().message(key, fallback, values)` substitutes named
values such as `{count}` without changing domain values. English is the fallback;
Arabic includes common actions, time validation, choice feedback and grid labels.
Application labels, record content and business-rule errors remain host-owned.
Set `direction` explicitly: a locale name does not infer layout direction.
`useUIPortalProps()` supplies the same configuration for a custom Base UI portal.

`motion="reduced"` removes scoped transitions and makes
`useReducedMotionPreference()` report reduction. An ancestor or live operating
system preference requesting reduced motion always wins. No animation setting
forces motion back on.

## Time entry and confirmation

`TimePicker` preserves its original slot-only Select by default. Opt into
`editable` for strict ASCII `HH:mm` text, retaining `string | null` values. The
same inclusive time bounds, midnight-anchored interval and `disabledTimes` apply
to typed values and slots. Invalid drafts remain visible and never replace the
committed value. Enter or leaving the entire control commits valid text; Escape
restores the committed text. Alt+ArrowDown opens the slot list, which supports
ArrowUp/Down, Home and End.

`commitMode="explicit"` keeps typed or selected changes as drafts. Apply commits
once, and Cancel, Escape or outside popup dismissal restores the previous value.
A changed draft blocks native editable-form submission until applied or cancelled.
The hidden submitted entry contains the committed value. `inputRef` remains the
slot-opening button; `textInputRef` targets editable text. External `form` ownership
is supported. Native reset restores uncontrolled defaults without emitting a value
change; prevented reset does nothing and controlled values remain host-owned.
Read-only values are submitted and disabled values are excluded. Button-only
presentations announce required state; hosts validate their submission requirement.

A time is a date-free wall-clock preference. Display formatting may change, but
neither the locale nor the provider attaches a date, timezone or UTC offset. The
application resolves a scheduling instant and checks availability on its server.

## Calendar navigation and availability

`navigation="dropdowns"` adds month and year choices using the shared Select.
`month` and `onMonthChange` optionally control the visible month independently of
selection. `startMonth` and `endMonth` bound navigation; `minDate` and `maxDate`
continue to bound selectable days. `numberOfMonths` accepts one, two or three;
narrow layouts stack the months without overflowing the popup.

`unavailableDates` disables exact local civil dates. `isDateUnavailable` supplies
a pure synchronous host rule, such as unavailable weekdays. A throwing rule fails
closed. These rules apply to Calendar, DatePicker and DateRangePicker, including
typed entry and presets. A range crossing an unavailable interior day is rejected.
Availability scans are bounded at 36,600 days; use shorter ranges when applying a
rule. These controls do not fetch availability or imply a booking service.

Date fields continue to use strict `YYYY-MM-DD` text and local calendar fields,
including low years and daylight-saving boundary dates. They do not turn civil
dates into UTC timestamps. The host owns explicit timezone and instant conversion.
