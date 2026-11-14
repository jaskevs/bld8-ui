# Resource scheduler

ResourceScheduler arranges supplied people, room or equipment bookings into day
and week lanes. Moving and resizing create a local proposal. The review dialog
confirms the resource and exact interval before a host save runs. Nothing is
persisted by moving a pointer or pressing an arrow key.

## Supply explicit instants and availability

Provide a SchedulerSnapshot with a positive revision, stable resources,
availability windows and events. Events have their own positive revision. Every
event must fit one availability window for its resource. Intervals are half open:
an event ending at 10:00 may be followed by one starting at 10:00. Overlapping
events in one resource are rejected; different resources may overlap.

Use whole-minute UTC ISO strings. The timeZone is an IANA display zone. Each
SchedulerDay supplies a calendar date and explicit UTC start/end for its visible
window. Those instants must remain inside that calendar day in the display zone.
Short and repeated days are supported because their boundaries are supplied;
the scheduler does not guess a UTC instant from an ambiguous local clock. The
review choices retain canonical instants and show offsets. Changing day retains
an elapsed offset from the supplied start, not a promise of the same wall clock
across daylight saving. Recurrence expansion is a separate host composition.

## Interaction and reading

- Drag the event body to propose a move; drag an edge to resize. Pointer movement
  snaps to 5, 10, 15, 30 or 60 elapsed minutes. Escape, pointer cancellation or lost
  capture restores the previous draft. A pointer release opens review.
- Horizontal arrows move by one snap step. Shift resizes the end; Control or
  Command resizes the start. Up and Down change resource. Horizontal movement
  follows the scoped reading direction. Enter opens review; Escape cancels an
  unsubmitted proposal.
- The review dialog offers the same resource/day/time decisions without dragging.
  Invalid availability, overlap and stale revisions retain the proposal.
- Agenda is the narrow-screen alternative. Exact table exposes canonical UTC
  intervals, offset labels and revisions using ordinary table semantics. Native
  scrolling and zoom remain available. Motion follows scoped and live system
  reduced-motion preferences.

## Host save contract

onSave receives SchedulerChange and a SchedulerSaveContext containing an abort
signal and a stable requestId. Authorise access, check the global and event
revisions, validate availability and overlap, then commit atomically. Retain a
durable receipt keyed by requestId and payload. Replaying that exact request
must return the original result without writing twice; changed payloads must
not reuse an ID. Return the complete canonical snapshot. A successful receipt
must identify the request and event and advance exactly the relevant revisions;
unexpected record changes or incomplete snapshots are not accepted as success.

A definite validation rejection keeps the editable proposal. A conflict exposes
the latest interval and requires explicit revision rebase. An exception or invalid
acknowledgement means the write is uncertain: controls lock, the same request
and ID remain available for reconciliation, and the draft cannot be discarded.
Stopping waiting aborts the client wait, not a possible server transaction.
Replacing sourceKey or onSave detaches the old source and ignores its late
response; the old service may still need reconciliation. Keep callbacks stable.
An older successful receipt confirms its operation without publishing that older
snapshot over a newer revision already supplied by the host. Conflict comparison
also retains the newest known revision.

createMemoryResourceScheduler is a single-process example adapter with 100
retained receipts. It resets on reload and does not supply authentication,
durable storage, a remote calendar service or multi-user atomic persistence.

## Bounds

Supply at most 50 resources, 500 events, 1,000 availability windows and seven
explicit day windows. Event intervals are positive and at most 24 elapsed hours;
availability and day windows are at most 26 hours. The component renders these
bounded supplied records, not a remote scheduler or a virtualized calendar.
Gantt dependency planning and recurrence rules are separate modules.
