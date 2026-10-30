export interface ChartDatum {
  id: string;
  label: string;
  /** An explicit number or null for every series. Null leaves a gap. */
  values: Readonly<Record<string, number | null>>;
}

export interface ChartSeries {
  id: string;
  label: string;
  /** Preferred shade in the theme's data palette; repeated tones use distinct slots. */
  tone?: 'primary' | 'accent' | 'muted';
}

export type ChartType = 'line' | 'bar' | 'area';
export interface ChartPoint { index: number; x: number; y: number; value: number }
export interface ChartPathSegment { line: string; area: string; points: readonly ChartPoint[] }

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 240;

/** Reject ambiguous identities and incomplete numeric records before rendering. */
export function validateChartData(data: readonly ChartDatum[], series: readonly ChartSeries[]): void {
  if (!Array.isArray(data) || !Array.isArray(series)) throw new Error('Provide chart data and series as arrays.');
  if (data.length > 366 || series.length > 6) throw new Error('Use at most 366 observations and six series in one chart.');
  if (!series.length) throw new Error('Provide at least one chart series.');
  const seriesIds = new Set<string>();
  for (const item of series) {
    if (!item || !text(item.id) || !text(item.label) || seriesIds.has(item.id)) throw new Error('Give each series a unique ID and a readable label.');
    if (item.tone !== undefined && !['primary', 'accent', 'muted'].includes(item.tone)) throw new Error('Use a supported chart series tone.');
    seriesIds.add(item.id);
  }
  const ids = new Set<string>();
  for (const row of data) {
    if (!row || !text(row.id) || !text(row.label) || ids.has(row.id)) throw new Error('Give each observation a unique ID and a readable label.');
    ids.add(row.id);
    if (!row.values || typeof row.values !== 'object' || Array.isArray(row.values)) throw new Error('Provide a values record for every observation.');
    if (Object.keys(row.values).some(key => !seriesIds.has(key))) throw new Error('Observation values must use the declared series IDs.');
    for (const item of series) {
      if (!Object.prototype.hasOwnProperty.call(row.values, item.id)) throw new Error('Provide a number or null for every observation and series.');
      const value = row.values[item.id];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error('Chart values must be finite numbers or null.');
    }
  }
}

/** A readable zero-inclusive extent. Arithmetic is normalised for large values. */
export function getChartDomain(data: readonly ChartDatum[], series: readonly ChartSeries[], hiddenSeriesIds: readonly string[] = []): readonly [number, number] {
  const hidden = new Set(hiddenSeriesIds);
  let minimum = 0, maximum = 0;
  for (const row of data) for (const item of series) {
    const value = row.values[item.id];
    if (!hidden.has(item.id) && value !== null && Number.isFinite(value)) { minimum = Math.min(minimum, value); maximum = Math.max(maximum, value); }
  }
  if (minimum === maximum) return [0, 1];
  const extent = Math.max(Math.abs(minimum), Math.abs(maximum));
  const magnitude = 10 ** Math.floor(Math.log10(extent)) || extent;
  const raw = (maximum / magnitude - minimum / magnitude) / 4;
  const unit = 10 ** Math.floor(Math.log10(raw));
  const ratio = raw / unit;
  const step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 2.5 ? 2.5 : ratio <= 5 ? 5 : 10) * unit;
  const lower = Math.floor(minimum / magnitude / step) * step * magnitude;
  const upper = Math.ceil(maximum / magnitude / step) * step * magnitude;
  return [Number.isFinite(lower) ? Math.min(lower, minimum) : minimum, Number.isFinite(upper) ? Math.max(upper, maximum) : maximum];
}

/** Map a value without subtracting two potentially extreme opposite values. */
export function chartY(value: number, domain: readonly [number, number], height: number): number {
  const extent = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  const span = domain[1] / extent - domain[0] / extent;
  return span > 0 ? (domain[1] / extent - value / extent) / span * height : height;
}

const coordinate = (value: number) => String(Number(value.toFixed(3)));

/** Each null produces a real path break; area segments close on the zero line. */
export function buildChartPaths(data: readonly ChartDatum[], seriesId: string, domain: readonly [number, number], width: number, height: number): ChartPathSegment[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Provide positive finite chart dimensions.');
  if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) || domain[0] >= domain[1]) throw new Error('Provide an ordered finite chart domain.');
  const result: ChartPathSegment[] = [];
  let points: ChartPoint[] = [];
  const flush = () => {
    if (!points.length) return;
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${coordinate(point.x)},${coordinate(point.y)}`).join(' ');
    const zero = coordinate(chartY(0, domain, height));
    result.push({ line, area: `${line} L${coordinate(points.at(-1)!.x)},${zero} L${coordinate(points[0].x)},${zero} Z`, points });
    points = [];
  };
  data.forEach((row, index) => {
    const value = row.values[seriesId];
    if (value === null || !Number.isFinite(value)) { flush(); return; }
    points.push({ index, x: (index + .5) / data.length * width, y: chartY(value, domain, height), value });
  });
  flush();
  return result;
}

export function formatChartValue(value: number): string {
  if (value !== 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e15)) return value.toExponential(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3, notation: Math.abs(value) >= 1e6 ? 'compact' : 'standard' }).format(value);
}

/** Describe observed values without inventing trends or treating gaps as zero. */
export function getChartSummary(data: readonly ChartDatum[], series: readonly ChartSeries[], formatter: (value: number) => string = formatChartValue): string {
  if (!data.length) return 'No observations are available.';
  return `${data.length} ${data.length === 1 ? 'observation' : 'observations'}. ` + series.map(item => {
    const values = data.map(row => row.values[item.id]).filter((value): value is number => value !== null && Number.isFinite(value));
    if (!values.length) return `${item.label}: no recorded values.`;
    const low = Math.min(...values), high = Math.max(...values), missing = data.length - values.length;
    return `${item.label}: ${formatter(low)} to ${formatter(high)}${missing ? `; ${missing} ${missing === 1 ? 'gap' : 'gaps'}` : ''}.`;
  }).join(' ');
}
