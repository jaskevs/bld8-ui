export type AnalyticsPeriod = 'week' | 'month' | 'quarter';

export interface AnalyticsRecord {
  id: string;
  label: string;
  completed: number;
  failed: number;
}

export interface AnalyticsReport {
  period: AnalyticsPeriod;
  records: readonly AnalyticsRecord[];
}

export interface AnalyticsSummary {
  totalRequests: number;
  completed: number;
  failed: number;
  completionRate: number | null;
  peak: AnalyticsRecord | null;
  averagePerDay: number | null;
}

export const analyticsPeriods = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
] as const;

export function isAnalyticsPeriod(value: unknown): value is AnalyticsPeriod {
  return value === 'week' || value === 'month' || value === 'quarter';
}

/** Count data is bounded before it reaches rendering, aggregation or CSV export. */
export function validateAnalyticsReport(value: unknown, requestedPeriod: AnalyticsPeriod): AnalyticsReport {
  if (!isAnalyticsPeriod(requestedPeriod) || typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('The report must be an object with a supported period.');
  }
  const report = value as Record<string, unknown>;
  if (report.period !== requestedPeriod || !Array.isArray(report.records) || report.records.length > 366) {
    throw new Error('The report period or record count is invalid.');
  }
  const ids = new Set<string>(), labels = new Set<string>();
  let total = 0;
  const records: AnalyticsRecord[] = Array.from(report.records, (raw: unknown) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('A report record is invalid.');
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 160 || ids.has(row.id)
      || typeof row.label !== 'string' || !row.label.trim() || row.label.length > 120 || labels.has(row.label)
      || typeof row.completed !== 'number' || !Number.isSafeInteger(row.completed) || row.completed < 0
      || typeof row.failed !== 'number' || !Number.isSafeInteger(row.failed) || row.failed < 0) {
      throw new Error('Report records need unique identities and valid non-negative counts.');
    }
    total += row.completed + row.failed;
    if (!Number.isSafeInteger(total)) throw new Error('The report total exceeds the supported numeric range.');
    ids.add(row.id); labels.add(row.label);
    return { id: row.id, label: row.label, completed: row.completed, failed: row.failed };
  });
  return { period: requestedPeriod, records };
}

export function summariseAnalyticsReport(report: AnalyticsReport): AnalyticsSummary {
  const checked = validateAnalyticsReport(report, report.period);
  let completed = 0, failed = 0;
  let peak: AnalyticsRecord | null = null;
  for (const row of checked.records) {
    completed += row.completed; failed += row.failed;
    if (!peak || row.completed + row.failed > peak.completed + peak.failed) peak = row;
  }
  const totalRequests = completed + failed;
  return {
    totalRequests, completed, failed,
    completionRate: totalRequests > 0 ? completed / totalRequests * 100 : null,
    peak,
    averagePerDay: checked.records.length ? totalRequests / checked.records.length : null,
  };
}

function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@]/u.test(value) || /^[\t\r\n]/u.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

/** Spreadsheet formulas in labels are exported as text. Numeric counts stay exact. */
export function analyticsReportCsv(report: AnalyticsReport): string {
  const checked = validateAnalyticsReport(report, report.period);
  return ['Day,Completed,Failed,Total', ...checked.records.map(row =>
    [csvCell(row.label), row.completed, row.failed, row.completed + row.failed].join(','),
  )].join('\r\n') + '\r\n';
}

/** Deterministic illustrative daily counts ending on 29 October 2026. */
export function createSampleAnalyticsReport(period: AnalyticsPeriod): AnalyticsReport {
  if (!isAnalyticsPeriod(period)) throw new Error('Choose a supported report period.');
  const length = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const end = Date.UTC(2026, 9, 29);
  const labels = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  return {
    period,
    records: Array.from({ length }, (_, index) => {
      const date = new Date(end - (length - index - 1) * 86_400_000);
      const day = Math.floor(date.getTime() / 86_400_000);
      return {
        id: date.toISOString().slice(0, 10), label: labels.format(date),
        completed: 42 + (day * 17 + 29) % 70 + (date.getUTCDay() === 0 || date.getUTCDay() === 6 ? 0 : 16),
        failed: (day * 7 + 3) % 11,
      };
    }),
  };
}
