# Charts and analytics

`/components/chart` demonstrates the reusable Chart. `/blocks/analytics-dashboard`
composes it with reporting periods, derived metrics, loading/retry and CSV export.
`/integrations/analytics` describes the service boundary. Source remains local
until a separately authorised release; the live registry still serves the prior
published version.

## Chart data and display

Chart accepts a required label, data and series; optional description, type,
height, valueFormatter and className customise presentation. Type is line, bar or
area; height defaults to 240 CSS pixels and is clamped to 160–480.

Each ChartDatum has a stable unique id, readable label and values record. Every
declared ChartSeries id must have an explicit finite number or null in each row.
Unknown series keys and incomplete/nonfinite records are rejected. Series have
stable unique ids, labels and optional preferred tones: primary, accent or muted.
These select related shades from the shared theme family. Repeated
preferences advance to unused palette slots so six series remain distinct. Limits are
366 observations, six series and bounded identity/label strings.

Categories are evenly spaced in supplied order. Labels are display text, not
parsed dates. Use one unit for series sharing the axis. Numeric domains include
zero and preserve signed values. Null is missing data: line/area segments break
at it, and text says Not recorded. No interpolation, date axis, stacked totals,
streaming or downsampling is supplied.

The pure chart-state module exports validation, domain/geometry, default numeric
formatting and a descriptive summary. Import it from @bld8/ui/chart-state for
server use, or from the installed bld8/chart-state source after registry setup.
Validate data before calling the lower-level geometry helpers. A custom
valueFormatter affects axes, exploration and summaries; the table retains each
original numeric value without compacting or rounding it.

## Interaction and motion

Legend buttons toggle visible series and expose their pressed state. Patterns,
marker shapes and text accompany colour. Accent strokes derive from the current
accent and ink tokens to retain definition against the background.

There is one roving tab stop across observation buttons. Left/Right move between
observations; Home/End move to the endpoints. Pointer preview is separate from
keyboard focus. The readout stays in one place. Dense data can be explored with
the keyboard or the exact table rather than requiring a tiny pointer target.
If a focused observation disappears, focus repairs to a surviving observation
or heading. Changes outside the chart do not cause initial autofocus.

Show data exposes an exact table, including hidden series and missing values.
The table scrolls within its own labelled region on narrow screens. All-hidden
series offer a Show all series recovery action. Removing an interactive view does
not retain stale interactive exits. Series, cursor and markers use shared eased
motion; live reduced-motion changes remove travel.

## Analytics report contract

AnalyticsDashboard accepts loadReport, defaultPeriod and className. The optional
loader receives period (week/month/quarter) and {signal: AbortSignal}, returning
an AnalyticsReport with the same period and a records array. Each record has
id, label, completed and failed. IDs and labels must be unique; counts and their
total must remain nonnegative safe integers. Responses are cloned and validated
before rendering, aggregation or export. The same 366-row bound applies.

Keep the loader reference stable and forward its signal to fetch. Request and
source identity prevent replaced/cancelled results from changing the current
report, even if a loader ignores cancellation. Loading clears the previous
period's report. Retry retains the selected period and has a guarded focus
handoff; later asynchronous completion does not reclaim focus.

Total requests, completion rate and peak-day count derive from those records.
No requests means the completion rate is unavailable. An empty report has no peak.
Tied peaks use the first supplied record. The pure @bld8/blocks/analytics-state
subpath exposes report validation, summaries and CSV helpers for server use.
The service owns actual date boundaries,
timezones, aggregation, authorisation, collection and persistence.

The default loadSampleAnalyticsReport is an abortable local timer with fixed
illustrative 7/30/90-day datasets. Preview modes also include persistent loading,
empty, connection failure, one rejected load, slow completion and invalid data.
No analytics service is contacted.

Export report CSV downloads the exact loaded records, with quoted labels,
numeric counts, totals and spreadsheet-formula protection. The focused action
remains in place while repeated activation is briefly guarded. CSV handling does
not replace validation for the destination application.

## Adoption and verification

After publication, use /r/chart.json or /r/analytics-dashboard.json, or the
Next.js/React + Vite analytics starters. All share the same original MIT source
and existing Motion/Lucide notices. No new runtime dependency is introduced.

This increment covers bounded charts and reporting. Table virtualisation and
grouping remain separate work. Measurement of the 366-by-six demo is local
evidence, not a universal performance guarantee. See verification.md for actual
build, install, browser, visual and dataset measurements. Automated checks do not
establish manual assistive-technology or real-device certification.

In Next.js, interactive components and loader/formatter functions belong to a client boundary. Serialisable data may come from a Server Component; pure chart/report state modules can be evaluated directly on the server.

Chart strokes use six related shades in --bui-chart-1 through --bui-chart-6 in both themes; CSS exports include the same palette. Override those variables for a product-specific data palette. Normal bars use solid fills, while forced colours retain hatch patterns. Markers, dash styles, text and the exact table continue to accompany colour.

The default data palette uses related evergreen shades alongside the golden
yellow interface accent. Custom theme accents derive their own related chart
shades. Supporting colour does not replace series labels, markers or dash styles.
