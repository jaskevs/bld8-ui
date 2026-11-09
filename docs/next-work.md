# Next work

The owner requested the first four adoption priorities together on 9 November.
The combined implementation is published; exact local and hosted
outcomes belong in handoff.md, verification.md and deployment.md.

## Delivered combined release

The first four adoption priorities are implemented and source 0.2.0 is published:
clean-install receipts, retained immutable assets, Kanban/Tree/Chart playgrounds
and native Git deployment behind the required aggregate. See handoff.md for the
exact reviewed source, CI run, release and production deployment evidence.
Current development uses 0.3.0/unreleased and keeps 0.2.0 assets unchanged.

## Next bounded improvements

1. Use one real outside-developer adoption attempt to find setup and interaction
   gaps. Ask them to theme a small screen, wire a callback and recover a failed
   save. Record actual feedback; invitations/messages require authorisation.
2. Extend the playground to WindowedTable and DayAgenda, using the same live-source
   download pipeline and bounded state validation. Keep actual persistence and
   concurrency in the host application.
3. Complete a physical iPhone review of focus/blur, keyboard dismissal, zoom and
   vector marks. Desktop WebKit does not reproduce the native UIKit keyboard.
4. Consider further Outline undo only with explicit operation semantics and
   conflict checks. Creation, detail-field saves and deletion undo remain outside
   the current slice; do not imply those operations are reversible today.

Keep white/grey surfaces, #FFD900, crisp vectors, shared easing and reduced-motion
behaviour. This is an ordered backlog, not a calendar commitment. Preserve the
fixed Workbench roadmap, exam window and 135-hour baseline; UI work is additional
scope. No outreach, npm publication or paid tier is included.
