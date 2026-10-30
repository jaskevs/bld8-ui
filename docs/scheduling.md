# Day agenda and booking

DayAgenda is a reusable day view; SchedulePlanner composes it with date, zone and
duration controls, a booking draft and appointment details. Both Next.js and Vite
use the same React source. Examples are /components/day-agenda,
/blocks/schedule-planner and /integrations/scheduling.

## Model and time boundaries

ScheduleSnapshot contains a positive revision, slots and events. Slots have id,
start and end; events add title and positive revision. Supply at most 200 windows
and 500 events. IDs are unique within their collection. Each interval lasts more
than zero and at most 24 hours. Windows and events are separately nonoverlapping;
adjacent intervals are allowed. Existing appointments need not belong to the
currently offered windows.

Source and booking instants must be whole-minute UTC ISO strings, accepting
:00Z or :00.000Z and normalizing milliseconds. No rounding is performed. Titles
trim to 3–120 characters. getScheduleStarts samples every 15 elapsed minutes from
each window's start, for 15–120 minute durations in steps of 15. Starts must fit
inside availability and not overlap an event. Source order remains unchanged.

The selected day is YYYY-MM-DD in the selected IANA zone. Dates from DatePicker
retain their calendar fields; they are not parsed as UTC. TimePicker continues
to store date-free HH:mm preferences and is not used to resolve real bookings.
Display uses Intl, h23 labels and explicit UTC offsets, preserving both sides of
a repeated local hour. Historical subminute offsets include local seconds.
getScheduleDay also accepts precise UTC instants so half-open end boundaries can
be projected correctly. Locale changes formatting; product labels remain English.

## Service callbacks

Use stable loadSchedule({signal}) and onBook(booking,{signal,requestId}) callbacks.
Load returns the complete bounded snapshot. Booking includes slotId, start, end,
title and expectedRevision. Return {snapshot,eventId} with an advanced snapshot
revision and a new appointment matching the request. Responses are cloned and
validated before display. Retry retains the draft and request identity for the
same values; editing starts a new attempt. Old/cancelled completions are ignored.

The host owns permissions, idempotency, persistence and an atomic revision/overlap
check. Client validation alone cannot prevent simultaneous bookings. A failed
request may already have committed remotely; the UI cannot confirm success from
a rejection. Cancelling a custom write requires reload before another booking,
and restores focus to the workspace heading. No backend rollback is promised.

Without callbacks, fixtures and changes live in this page. Reload schedule
restores the illustrative fixture. A loader without a saver still makes local
edits. At the 500-event limit the view explicitly disables new bookings, rather
than claiming the source has no availability.

## Installation and layout

Install day-agenda, schedule-state or schedule-planner through the shadcn registry.
Registry imports use local bld8 paths. Workspace/starters use @bld8/ui and
@bld8/blocks; @bld8/ui/schedule-state is a pure Server Component-safe subpath.
Keep UIProvider for overlays and the included styles/licences.

The agenda and planner respond to their own containers, including a 390px Mobile
preview inside a desktop viewport. Native controls retain keyboard behaviour;
availability hover/selection and day changes use shared easing. Reduced motion
removes the decorative fade and dialog travel. No new runtime dependency is added.

This is one bounded schedule, without recurrence, resource allocation, calendar
sync, arbitrary wall-clock conversion, drag/resizing or a rich-text composer.
Verification evidence is recorded separately in verification.md.
