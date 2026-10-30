'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Activity, ChartColumn, ChartLine, ChartNoAxesCombined, CheckCheck, Download, RefreshCw, TrendingUp } from 'lucide-react';
import { Alert, Badge, Button, Chart, EmptyState, Icon, Select, Skeleton, useReducedMotionPreference, type ChartDatum, type ChartSeries, type ChartType } from '@bld8/ui';
import { analyticsPeriods, analyticsReportCsv, createSampleAnalyticsReport, isAnalyticsPeriod, summariseAnalyticsReport, validateAnalyticsReport, type AnalyticsPeriod, type AnalyticsReport } from './analytics-state.js';

export type { AnalyticsPeriod, AnalyticsRecord, AnalyticsReport, AnalyticsSummary } from './analytics-state.js';
export { analyticsPeriods, analyticsReportCsv, createSampleAnalyticsReport, isAnalyticsPeriod, summariseAnalyticsReport, validateAnalyticsReport } from './analytics-state.js';

export interface AnalyticsDashboardProps {
  /** Keep the callback stable while browsing. The host owns authorisation and aggregation. */
  loadReport?: (period: AnalyticsPeriod, context: { signal: AbortSignal }) => Promise<AnalyticsReport>;
  defaultPeriod?: AnalyticsPeriod;
  className?: string;
}

/** Abortable illustrative data. No analytics service is contacted. */
export function loadSampleAnalyticsReport(period: AnalyticsPeriod, { signal }: { signal: AbortSignal }): Promise<AnalyticsReport> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const cancel = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      try { resolve(createSampleAnalyticsReport(period)); } catch (error) { reject(error); }
    }, 450);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

type Loader = NonNullable<AnalyticsDashboardProps['loadReport']>;
type ReportState = { loader: Loader; period: AnalyticsPeriod; kind: 'loading' | 'error' | 'ready'; report?: AnalyticsReport; invalid?: boolean };
const series: readonly ChartSeries[] = [
  { id: 'completed', label: 'Completed', tone: 'primary' },
  { id: 'failed', label: 'Failed', tone: 'accent' },
];
const displays: readonly { value: ChartType; label: string; icon: typeof ChartLine }[] = [
  { value: 'line', label: 'Line', icon: ChartLine },
  { value: 'bar', label: 'Bar', icon: ChartColumn },
  { value: 'area', label: 'Area', icon: ChartNoAxesCombined },
];
const number = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const percentage = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const easing = [.16, 1, .3, 1] as const;
const formatCount = (value: number) => value >= 100_000 ? compact.format(value) : number.format(value);

export function AnalyticsDashboard({ loadReport, defaultPeriod = 'week', className }: AnalyticsDashboardProps) {
  const loader = loadReport ?? loadSampleAnalyticsReport;
  const [period, setPeriod] = useState<AnalyticsPeriod>(() => isAnalyticsPeriod(defaultPeriod) ? defaultPeriod : 'week');
  const [display, setDisplay] = useState<ChartType>('line');
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<ReportState>(() => ({ loader, period, kind: 'loading' }));
  const [exporting, setExporting] = useState(false), [exportStatus, setExportStatus] = useState('');
  const [retainedHeight, setRetainedHeight] = useState<{ loader: Loader; height: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const requestId = useRef(0), mounted = useRef(false), currentLoader = useRef(loader);
  currentLoader.current = loader;
  const heading = useRef<HTMLHeadingElement>(null), retryOrigin = useRef<HTMLElement | null>(null);
  const exportGuard = useRef(false), exportTimer = useRef<number | null>(null), exportUrl = useRef<string | null>(null);
  const reduced = useReducedMotionPreference(), indicatorId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (exportTimer.current !== null) window.clearTimeout(exportTimer.current);
      if (exportUrl.current) URL.revokeObjectURL(exportUrl.current);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController(), id = ++requestId.current;
    const current = () => mounted.current && !controller.signal.aborted && requestId.current === id && currentLoader.current === loader;
    setState({ loader, period, kind: 'loading' }); setExportStatus('');
    Promise.resolve().then(() => current() ? loader(period, { signal: controller.signal }) : null).then(value => {
      if (!current()) return;
      try { setState({ loader, period, kind: 'ready', report: validateAnalyticsReport(value, period) }); }
      catch { setState({ loader, period, kind: 'error', invalid: true }); }
    }, () => { if (current()) setState({ loader, period, kind: 'error' }); });
    return () => controller.abort();
  }, [loader, period, retryVersion]);

  useLayoutEffect(() => {
    const origin = retryOrigin.current; retryOrigin.current = null;
    if (!origin) return;
    const active = origin.ownerDocument.activeElement;
    if (active === origin || active === origin.ownerDocument.body && !origin.isConnected) heading.current?.focus({ preventScroll: true });
  }, [retryVersion]);

  const sameRequest = state.loader === loader && state.period === period;
  const busy = !sameRequest || state.kind === 'loading';
  const failed = sameRequest && state.kind === 'error';
  const report = sameRequest && state.kind === 'ready' ? state.report ?? null : null;
  const summary = useMemo(() => report ? summariseAnalyticsReport(report) : null, [report]);
  const chartData: readonly ChartDatum[] = useMemo(() => report?.records.map(row => ({ id: row.id, label: row.label, values: { completed: row.completed, failed: row.failed } })) ?? [], [report]);
  const periodLabel = analyticsPeriods.find(item => item.value === period)!.label;
  const peakCount = summary?.peak ? summary.peak.completed + summary.peak.failed : null;

  // Measure natural ready content, not the reserved body. Expanded tables are
  // intentional detail, not space to keep when a different period is loading.
  useLayoutEffect(() => {
    const element = stage.current;
    if (busy || !report?.records.length || !element) return;
    const measure = () => {
      if (!mounted.current || currentLoader.current !== loader || stage.current !== element || !element.isConnected) return;
      const tableHeight = element.querySelector<HTMLElement>('.bui-chart-table-presence')?.getBoundingClientRect().height ?? 0;
      const height = Math.ceil(element.getBoundingClientRect().height - tableHeight);
      if (!Number.isFinite(height) || height <= 0) return;
      setRetainedHeight(previous => previous?.loader === loader && previous.height === height ? previous : { loader, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [busy, loader, report]);

  function exportReport() {
    if (!report || !report.records.length || busy || exportGuard.current) return;
    exportGuard.current = true; setExporting(true);
    try {
      const blob = new Blob([analyticsReportCsv(report)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob); exportUrl.current = url;
      const link = document.createElement('a'); link.href = url; link.download = 'analytics-' + period + '.csv';
      document.body.appendChild(link); link.click(); link.remove();
      setExportStatus('CSV prepared for ' + report.records.length + ' days.');
      exportTimer.current = window.setTimeout(() => {
        URL.revokeObjectURL(url); if (exportUrl.current === url) exportUrl.current = null;
        exportGuard.current = false; exportTimer.current = null;
        if (mounted.current) setExporting(false);
      }, 500);
    } catch {
      if (exportUrl.current) URL.revokeObjectURL(exportUrl.current);
      exportUrl.current = null; exportGuard.current = false; setExporting(false);
      setExportStatus('CSV could not be prepared. Try again.');
    }
  }

  return <section className={['bblocks-stack', 'bblocks-analytics', className].filter(Boolean).join(' ')} aria-label="Analytics workspace" data-reduced-motion={reduced}>
    <header className="bblocks-panel bblocks-analytics-header">
      <div><p className="bblocks-kicker">THE NUMBERS, WITH CONTEXT</p><h2 ref={heading} tabIndex={-1}>Analytics workspace.</h2><p className="bblocks-muted">Daily request counts and outcomes for the selected period.</p></div>
      <div className="bblocks-analytics-controls"><Select label="Reporting period" value={period} options={[...analyticsPeriods]} onValueChange={value => { if (isAnalyticsPeriod(value)) setPeriod(value); }} /><Button variant="secondary" leadingIcon={Download} aria-label="Export report CSV" disabled={!report?.records.length || busy} aria-disabled={exporting || undefined} onClick={exportReport}>Export CSV</Button></div>
    </header>

    <div className="bblocks-analytics-metrics" aria-busy={busy || undefined}>
      <article className="bblocks-panel bblocks-analytics-metric" aria-label="Total requests"><div className="bblocks-analytics-metric-label"><span>Total requests</span><Icon icon={Activity} size={17} /></div><strong aria-label={summary ? number.format(summary.totalRequests) + ' total requests' : undefined}>{busy ? <Skeleton width="60%" height="2.2rem" /> : summary ? formatCount(summary.totalRequests) : '—'}</strong><p>{summary ? number.format(summary.completed) + ' completed · ' + number.format(summary.failed) + ' failed' : busy ? 'Preparing the daily counts…' : 'Available when the report is ready.'}</p></article>
      <article className="bblocks-panel bblocks-analytics-metric" aria-label="Completion rate"><div className="bblocks-analytics-metric-label"><span>Completion rate</span><Icon icon={CheckCheck} size={17} /></div><strong>{busy ? <Skeleton width="45%" height="2.2rem" /> : summary?.completionRate != null ? percentage.format(summary.completionRate) + '%' : '—'}</strong><p>{summary?.totalRequests ? 'Completed requests ÷ total requests' : summary ? 'No requests in this period.' : busy ? 'Calculating the proportion…' : 'Available when the report is ready.'}</p></article>
      <article className="bblocks-panel bblocks-analytics-metric" aria-label="Peak day"><div className="bblocks-analytics-metric-label"><span>Peak day</span><Icon icon={TrendingUp} size={17} /></div><strong aria-label={peakCount !== null ? number.format(peakCount) + ' requests on the peak day' : undefined}>{busy ? <Skeleton width="50%" height="2.2rem" /> : peakCount !== null ? formatCount(peakCount) : '—'}</strong><p>{summary?.peak ? summary.peak.label + ' · highest daily count' : summary ? 'No daily records to compare.' : busy ? 'Comparing the daily totals…' : 'Available when the report is ready.'}</p></article>
    </div>

    <section className="bblocks-panel bblocks-analytics-report" aria-label="Activity report">
      <div className="bblocks-analytics-report-toolbar"><div><p className="bblocks-kicker">DAILY REQUESTS</p><p className="bblocks-analytics-period">{periodLabel}{report ? ' · ' + report.records.length + ' recorded days' : ''}</p></div><div className="bblocks-analytics-display" role="group" aria-label="Chart display">{displays.map(item => <button key={item.value} type="button" aria-pressed={display === item.value} onClick={() => setDisplay(item.value)}><span className="bblocks-analytics-display-label"><Icon icon={item.icon} size={15} />{item.label}</span>{display === item.value && <motion.span aria-hidden="true" className="bblocks-analytics-display-indicator" layoutId={reduced ? undefined : 'analytics-display-' + indicatorId} transition={{ duration: reduced ? 0 : .24, ease: easing }} />}</button>)}</div></div>
      <div className="bblocks-analytics-report-body" aria-busy={busy || undefined} style={{ '--bblocks-analytics-ready-height': (retainedHeight?.loader === loader ? retainedHeight.height : 0) + 'px' } as CSSProperties}>
        <motion.div key={period + ':' + (busy ? 'loading' : failed ? 'error' : report?.records.length ? 'ready' : 'empty')} ref={stage} className="bblocks-analytics-stage" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .24, ease: easing }}>
          {busy ? <div className="bblocks-analytics-loading"><p role="status">Loading report…</p><div className="bblocks-analytics-loading-summary"><Skeleton width="38%" /><Skeleton width="24%" height=".7rem" /></div><div className="bblocks-analytics-loading-plot" aria-hidden="true">{[35, 47, 32, 64, 52, 81, 68].map((height, index) => <Skeleton key={index} width="100%" height={height + '%'} />)}</div><div className="bblocks-analytics-loading-readout"><Skeleton width="24%" /><Skeleton width="20%" /><Skeleton width="20%" /></div></div>
            : failed ? <div className="bblocks-analytics-notice"><Alert title="Report could not be loaded" tone="neutral" live>{state.invalid ? 'The response did not match the requested period or contained invalid counts. Your other controls are still available.' : 'The connection was interrupted. Try this period again.'}</Alert><Button variant="secondary" leadingIcon={RefreshCw} onClick={event => { if (event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement)) retryOrigin.current = event.currentTarget; setRetryVersion(value => value + 1); }}>Retry report</Button></div>
            : !report?.records.length ? <EmptyState title="No activity for this period.">Choose another period, or provide daily records from your application.</EmptyState>
            : <Chart label="Request activity" description="Completed and failed requests per recorded day. Every chart view uses the same counts." data={chartData} series={series} type={display} height={260} valueFormatter={value => number.format(value)} />}
        </motion.div>
      </div>
      <footer className="bblocks-analytics-footer"><Badge>{loadReport ? 'Report data' : 'Sample data'}</Badge><p>{loadReport ? 'Counts are supplied by your application.' : 'Illustrative daily counts ending 29 Oct 2026. No analytics service is connected.'}</p><p className="bblocks-analytics-export-status" role="status">{exportStatus}</p></footer>
    </section>
  </section>;
}
