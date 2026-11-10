# Week and month calendar workflows

EventCalendar displays a complete bounded set of supplied UTC events in a week or
month view. CalendarWorkspace adds abortable range loading, retry and event
inspection. Neither component creates bookings, changes event times, supplies
availability or persists records. DayAgenda and SchedulePlanner retain their
separate availability and revision-checked booking contracts.

## Connect the calendar

Use an explicit calendar date so the first server render does not depend on a
clock or the server's time zone:

```tsx
import {EventCalendar, type CalendarEvent, type CalendarView} from '@bld8/ui';

const [date, setDate] = useState('2026-11-02');
const [view, setView] = useState<CalendarView>('month');
const [selected, setSelected] = useState('2026-11-02');

<EventCalendar
  label="Team calendar"
  date={date}
  view={view}
  onDateChange={next => { setDate(next); setSelected(next); }}
  onViewChange={setView}
  selectedDate={selected}
  onDateSelect={setSelected}
  events={events}
  timeZone="Australia/Melbourne"
  onEventAction={openEventDetails}
/>
```

Import useState from React in a client component. Registry installations use the
same exports under the application's configured bld8 source directory. Package
names shown above are local workspace packages, not published npm dependencies.

The view can be controlled or use defaultView. Selection can be controlled or use
defaultSelectedDate; otherwise it starts on date. onDateChange reports navigation
requests to the host. Without it the Previous/Next controls are unavailable.
The optional today marker is a date supplied by the host; no clock is read during
rendering. Default examples are authored for November 2026 and do not call the
sample date Today.

## Event and date semantics

CalendarEvent has id, title, start and end. validateCalendarEvents clones and
normalizes at most 500 records, preserving source order. IDs must be unique,
nonblank, contain no control characters and use at most 80 characters. Reserved
prototype keys are rejected. Titles contain 1-120 trimmed characters.

Start and end are complete UTC ISO timestamps with Z, normalized to milliseconds.
Offsets and local wall-clock strings are not accepted. Seconds and milliseconds
are retained in labels when present. An event must last more than zero and at
most 366 elapsed days. Overlapping and multi-day events are allowed.

The end is exclusive. An event ending at local midnight is not counted on the
following date, while its visible end label still includes that following date.
getCalendarDayEvents uses the selected IANA zone and the same exclusive-end rule.
formatCalendarTime shares minute-aligned agenda formatting and displays explicit
UTC offsets, including the two sides of a repeated local hour.

A month contains six complete weeks (42 dates), beginning at weekStartsOn; a week
contains seven dates. Sunday is 0 and Monday is the default 1. Display dates use
the Gregorian calendar with localized labels and numbers. Calendar-date arithmetic
uses UTC noon, not an invented local midnight; it does not assume local days are
24 elapsed hours. The chosen zone projects actual event instants onto those dates.
An extreme range that would leave years 0001-9999 is rejected with a visible error.

Do not use validateScheduleSnapshot to validate these calendar records. That
availability snapshot deliberately forbids overlapping events and intervals over
24 hours; the calendar's supplied-event contract is different.

## Fetch a range

CalendarWorkspace accepts this loader:

```ts
loadEvents({range, timeZone, signal}): Promise<readonly CalendarEvent[]>
// range = {startDay: '2026-10-26', endDayExclusive: '2026-12-07'}
```

Range values are calendar dates in timeZone. The host converts this request to its
service query and returns the complete bounded set. The block does not turn a
calendar date into a UTC database boundary, silently truncate a larger response,
or provide a backend compiler. A response over 500 events is rejected; narrow the
source in the host rather than implying missing events do not exist.

Navigation and timezone changes cancel the preceding request and discard late
results, even if the supplied loader ignores its AbortSignal. Loading removes
stale event actions while keeping date navigation usable. Errors keep the current
view and provide Retry loading events. Retry returns focus only when the retry
action still owns focus; asynchronous completion does not reclaim focus from a
later deliberate action. A loader or range refresh closes event details safely
if their originating event action disappears.

The default loader reads authored in-memory events. It is not a live calendar
account, a database or a persistence service. Authentication, authorization,
service ownership and durable record changes belong to the host application.

## Keyboard, layout and motion

Date buttons use roving Tab focus. Arrow keys move by one date or one week; Home
and End move to the current week's edges. Page Up/Down request the adjacent
month/week range when onDateChange is supplied. Enter or Space selects the focused
date. Event actions are ordinary labelled buttons; the active date's event links
can be reached with Tab. A selected-day agenda exposes every event on that date.

Narrow containers retain seven compact date columns and move event details to the
agenda, with full labels and offsets. Counts supplement the date labels; they are
not the only event information. Month cells show a bounded preview and an explicit
More action when needed. The stage measures content and eases its height when the
view or selected agenda changes. Live reduced-motion changes disable that easing
and the view-entry animation. No smoothness is added to native scroll behaviour.

This slice does not include recurrence, resource lanes, drag/resizing, event CRUD,
automatic scheduling, calendar sync or production availability generation.
