import {test, expect} from '@playwright/test';
import {buildChartPaths, getChartDomain, getChartSummary, validateChartData, type ChartDatum, type ChartSeries} from '../packages/ui/src/chart-state';

const series:readonly ChartSeries[] = [{id:'completed',label:'Completed',tone:'primary'},{id:'failed',label:'Failed',tone:'accent'}];
const sample:readonly ChartDatum[] = [
  {id:'mon',label:'Mon',values:{completed:12,failed:6}},
  {id:'tue',label:'Tue',values:{completed:-8,failed:null}},
  {id:'wed',label:'Wed',values:{completed:null,failed:-4}},
  {id:'thu',label:'Thu',values:{completed:22,failed:12}},
  {id:'fri',label:'Fri',values:{completed:0,failed:8}},
  {id:'sat',label:'Sat',values:{completed:16,failed:-2}},
];

test('chart validation retains signed, zero and explicit missing observations', () => {
  expect(() => validateChartData(sample, series)).not.toThrow();
  expect(() => validateChartData([], series)).not.toThrow();
  expect(sample[2].values.completed).toBeNull();
  expect(sample[4].values.completed).toBe(0);
});

test('chart input rejects ambiguous IDs, missing values and nonfinite observations', () => {
  for (const data of [
    null, {}, [{id:'',label:'Mon',values:{completed:1,failed:0}}],
    [{id:'mon',label:'  ',values:{completed:1,failed:0}}],
    [sample[0],{...sample[1],id:'mon'}],
    [{id:'mon',label:'Mon',values:{completed:1}}],
    [{id:'mon',label:'Mon',values:{completed:1,failed:0,extra:3}}],
    [{id:'mon',label:'Mon',values:{completed:Number.NaN,failed:0}}],
    [{id:'mon',label:'Mon',values:{completed:1,failed:Infinity}}],
    [{id:'mon',label:'Mon',values:{completed:'1',failed:0}}],
    [{id:'mon',label:'Mon',values:null}],
  ]) expect(() => validateChartData(data as unknown as readonly ChartDatum[], series)).toThrow();
  for (const invalidSeries of [null, {}, [], [{id:'completed',label:'Completed'},{id:'completed',label:'Again'}], [{id:'',label:'Missing ID'}], [{id:'completed',label:' '}], [{id:'completed',label:'Completed',tone:'unknown'}]]) {
    expect(() => validateChartData([], invalidSeries as unknown as readonly ChartSeries[])).toThrow();
  }
});

test('chart render bounds accept a full leap year across six series and reject larger input', () => {
  const manySeries = Array.from({length:6},(_,index):ChartSeries=>({id:'series-'+index,label:'Series '+index}));
  const data = Array.from({length:366},(_,index):ChartDatum=>({id:'day-'+index,label:'Day '+index,values:Object.fromEntries(manySeries.map((item,seriesIndex)=>[item.id,(index+1)*(seriesIndex+1)]))}));
  expect(() => validateChartData(data,manySeries)).not.toThrow();
  expect(() => validateChartData([...data,{id:'extra',label:'Extra',values:data[0].values}],manySeries)).toThrow();
  expect(() => validateChartData([], [...manySeries,{id:'seventh',label:'Seventh'}])).toThrow();
});

test('chart domains contain the real extrema and zero without NaN for empty or flat data', () => {
  const domain = getChartDomain(sample,series);
  expect(domain[0]).toBeLessThanOrEqual(-8);
  expect(domain[1]).toBeGreaterThanOrEqual(22);
  expect(domain[0]).toBeLessThan(0);
  expect(domain[1]).toBeGreaterThan(0);
  const filtered = getChartDomain(sample,series,['completed']);
  expect(filtered[0]).toBeLessThanOrEqual(-4);
  expect(filtered[1]).toBeGreaterThanOrEqual(12);
  expect(getChartDomain([],series)).toEqual([0,1]);
  expect(getChartDomain(sample,series,['completed','failed'])).toEqual([0,1]);
  const zero:ChartDatum[] = [{id:'zero',label:'Zero',values:{completed:0,failed:null}}];
  const zeroDomain = getChartDomain(zero,series);
  expect(zeroDomain.every(Number.isFinite)).toBe(true);
  expect(zeroDomain[0]).toBeLessThan(zeroDomain[1]);
});

test('null observations break paths instead of connecting unsupported data', () => {
  const domain = getChartDomain(sample,series);
  const segments = buildChartPaths(sample,'completed',domain,600,240);
  expect(segments.map(segment=>segment.points.map(point=>point.index))).toEqual([[0,1],[3,4,5]]);
  for (const segment of segments) {
    expect(segment.line).not.toMatch(/NaN|Infinity|undefined/);
    expect(segment.area).not.toMatch(/NaN|Infinity|undefined/);
    for (const point of segment.points) {
      expect(point.value).toBe(sample[point.index].values.completed);
      expect(point.x).toBeGreaterThanOrEqual(0);expect(point.x).toBeLessThanOrEqual(600);
      expect(point.y).toBeGreaterThanOrEqual(0);expect(point.y).toBeLessThanOrEqual(240);
    }
  }
  expect(buildChartPaths(sample,'failed',domain,600,240).map(segment=>segment.points.map(point=>point.index))).toEqual([[0],[2,3,4,5]]);
  const allMissing = sample.map(point=>({...point,values:{...point.values,completed:null}}));
  expect(buildChartPaths(allMissing,'completed',domain,600,240)).toEqual([]);
});

test('single-point paths stay finite and summaries expose actual values', () => {
  const single = [sample[0]];
  const segment = buildChartPaths(single,'completed',getChartDomain(single,series),600,240)[0];
  expect(segment.points).toHaveLength(1);
  expect(segment.line).not.toMatch(/NaN|Infinity/);
  const summary = getChartSummary(sample,series);
  expect(summary).toContain('Completed');expect(summary).toContain('Failed');
  expect(summary).toContain('-8');expect(summary).toContain('22');
  expect(getChartSummary(sample,series,value=>'value '+value)).toContain('value 22');
});
test('opposite finite numeric extremes and tiny values still produce bounded SVG geometry', () => {
  for (const values of [[-Number.MAX_VALUE,Number.MAX_VALUE],[-Number.MIN_VALUE,Number.MIN_VALUE]]) {
    const data:ChartDatum[] = values.map((value,index)=>({id:'point-'+index,label:'Point '+index,values:{completed:value,failed:null}}));
    expect(() => validateChartData(data,series)).not.toThrow();
    const domain = getChartDomain(data,series);
    expect(domain.every(Number.isFinite)).toBe(true);
    const segments = buildChartPaths(data,'completed',domain,600,240);
    for (const segment of segments) {
      expect(segment.line).not.toMatch(/NaN|Infinity/);
      expect(segment.area).not.toMatch(/NaN|Infinity/);
      for (const point of segment.points) {
        expect(point.y).toBeGreaterThanOrEqual(0);expect(point.y).toBeLessThanOrEqual(240);
      }
    }
  }
});