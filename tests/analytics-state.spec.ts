import {test, expect} from '@playwright/test';
import {analyticsPeriods, analyticsReportCsv, summariseAnalyticsReport, validateAnalyticsReport, type AnalyticsPeriod, type AnalyticsReport} from '../packages/blocks/src/analytics-state';

const report = (period:AnalyticsPeriod = 'week'):AnalyticsReport => ({period, records:[
  {id:'mon',label:'Mon',completed:18,failed:2},
  {id:'tue',label:'Tue',completed:15,failed:5},
  {id:'wed',label:'Wed',completed:0,failed:0},
]});

test('analytics reports validate the requested period and retain exact records', () => {
  const fixture = report();
  expect(validateAnalyticsReport(fixture, 'week')).toEqual(fixture);
  expect(analyticsPeriods.map(period => period.value)).toEqual(['week','month','quarter']);
  for (const value of [null, {}, [], {records:[]}, {...fixture,period:'year'}, {...fixture,period:'month'}, {...fixture,records:null}]) {
    expect(() => validateAnalyticsReport(value, 'week')).toThrow();
  }
});

test('analytics rejects invalid counts, ambiguous identities and oversized reports', () => {
  for (const count of [-1, .5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '2', null]) {
    expect(() => validateAnalyticsReport({period:'week',records:[{id:'one',label:'One',completed:count,failed:0}]}, 'week')).toThrow();
    expect(() => validateAnalyticsReport({period:'week',records:[{id:'one',label:'One',completed:0,failed:count}]}, 'week')).toThrow();
  }
  for (const records of [
    [{id:'one',label:'One',completed:1,failed:0},{id:'one',label:'Two',completed:2,failed:0}],
    [{id:'one',label:'One',completed:1,failed:0},{id:'two',label:'One',completed:2,failed:0}],
    [{id:'',label:'One',completed:1,failed:0}],
    [{id:'one',label:'  ',completed:1,failed:0}],
  ]) expect(() => validateAnalyticsReport({period:'week',records}, 'week')).toThrow();
  const records = Array.from({length:366}, (_,index) => ({id:'day-'+index,label:'Day '+index,completed:index,failed:0}));
  expect(validateAnalyticsReport({period:'quarter',records}, 'quarter').records).toHaveLength(366);
  expect(() => validateAnalyticsReport({period:'quarter',records:[...records,{id:'extra',label:'Extra',completed:1,failed:0}]}, 'quarter')).toThrow();
});

test('analytics prevents safe individual counts from overflowing report totals', () => {
  expect(() => validateAnalyticsReport({period:'week',records:[{id:'one',label:'One',completed:Number.MAX_SAFE_INTEGER,failed:1}]}, 'week')).toThrow();
  expect(() => validateAnalyticsReport({period:'week',records:[{id:'one',label:'One',completed:Number.MAX_SAFE_INTEGER,failed:0},{id:'two',label:'Two',completed:1,failed:0}]}, 'week')).toThrow();
});

test('analytics summaries derive totals, rates and stable peak ties from the same report', () => {
  const fixture = report();
  const summary = summariseAnalyticsReport(fixture);
  expect(summary).toMatchObject({totalRequests:40,completed:33,failed:7,completionRate:82.5,averagePerDay:40/3,peak:fixture.records[0]});
  expect(fixture.records.map(record => record.id)).toEqual(['mon','tue','wed']);
});

test('empty and zero reports keep unavailable rates explicit', () => {
  expect(summariseAnalyticsReport({period:'week',records:[]})).toMatchObject({totalRequests:0,completed:0,failed:0,completionRate:null,averagePerDay:null,peak:null});
  const zero = {period:'week' as const,records:[{id:'zero',label:'Zero',completed:0,failed:0}]};
  expect(summariseAnalyticsReport(zero)).toMatchObject({totalRequests:0,completionRate:null,averagePerDay:0});
});

test('analytics CSV retains every exact count and safely quotes spreadsheet text', () => {
  const fixture:AnalyticsReport = {period:'week',records:[
    {id:'quote',label:'A "quoted", day',completed:18,failed:2},
    {id:'line',label:'Line\nbreak',completed:0,failed:3},
    {id:'formula',label:'=SUM(1,2)',completed:4,failed:1},
    {id:'space',label:' \t+1',completed:5,failed:0},
  ]};
  const csv = analyticsReportCsv(fixture);
  expect(csv).toContain('Day');
  expect(csv).toContain('Completed');
  expect(csv).toContain('Failed');
  expect(csv).toContain('Total');
  expect(csv).toContain('"A ""quoted"", day"');
  expect(csv).toContain('"Line\nbreak"');
  expect(csv).toContain("\"'=SUM(1,2)\"");
  expect(csv).toContain("\"' \t+1\"");
  expect(csv).toContain(',18,2,20\r\n');
  expect(csv).toContain(',0,3,3\r\n');
  expect(csv.split('\r\n')).toHaveLength(6);
  expect(fixture.records[2].label).toBe('=SUM(1,2)');
});