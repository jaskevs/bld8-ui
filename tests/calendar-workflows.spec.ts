import {test,expect,type Page} from '@playwright/test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import AxeBuilder from '@axe-core/playwright';
import {getCalendarRange,getCalendarDays,shiftCalendarDate,validateCalendarEvents,getCalendarDayEvents,formatCalendarTime,type CalendarEvent} from '../packages/ui/src/calendar-state';
// Use the compiled React renderer: the runner instruments source JSX for component testing.
import {EventCalendar} from '../packages/ui/dist/event-calendar.js';

const sample:CalendarEvent[]=[
  {id:'first',title:' Interface review ',start:'2026-11-02T00:00:00Z',end:'2026-11-02T01:00:00Z'},
  {id:'overlap',title:'Build review',start:'2026-11-02T00:30:00Z',end:'2026-11-02T01:30:00Z'},
  {id:'window',title:'Release window',start:'2026-11-03T22:00:00Z',end:'2026-11-05T01:00:00Z'},
];
const componentRoute='/components/event-calendar',blockRoute='/blocks/calendar-workspace';
async function choose(page:Page,name:string,value:string){await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
const calendar=(page:Page,label='Team calendar')=>page.getByRole('region',{name:label,exact:true});
const day=(page:Page,date:string,label='Team calendar')=>calendar(page,label).locator('[data-calendar-date="'+date+'"]');

test('calendar snapshots normalize immutable input while allowing overlap and multi-day events',()=>{
  const source=sample.map(row=>Object.freeze({...row}));Object.freeze(source);const before=JSON.stringify(source),result=validateCalendarEvents(source);
  expect(result.map(row=>row.id)).toEqual(['first','overlap','window']);expect(result[0].title).toBe('Interface review');expect(result[0].start).toBe('2026-11-02T00:00:00.000Z');expect(result[0]).not.toBe(source[0]);expect(JSON.stringify(source)).toBe(before);
  expect(getCalendarDayEvents(result,'2026-11-02','Australia/Melbourne').map(row=>row.id)).toEqual(['first','overlap']);
  expect(getCalendarDayEvents(result,'2026-11-04','Australia/Melbourne').map(row=>row.id)).toEqual(['window']);
  expect(getCalendarDayEvents(result,'2026-11-05','Australia/Melbourne').map(row=>row.id)).toEqual(['window']);
});

test('calendar event validation rejects malformed identity, intervals, sparse data and oversized sources',()=>{
  const event=sample[0];
  const invalid=[null,{},[undefined],new Array(1),Array.from({length:501},(_,index)=>({...event,id:'e-'+index})),[event,event],...[
    {id:'__proto__'},{id:'bad\u0000id'},{id:' '},{title:''},{title:'x'.repeat(121)},{start:'2026-02-30T00:00:00Z'},{start:'2026-11-02T11:00:00+11:00'},{end:event.start},{end:'2027-12-01T00:00:00Z'},
  ].map(change=>[{...event,...change}])];
  for(const value of invalid)expect(()=>validateCalendarEvents(value)).toThrow();
  const seconds=validateCalendarEvents([{...event,start:'2026-11-02T00:00:01.123Z'}]);expect(formatCalendarTime(seconds[0].start,'UTC')).toContain('00:00:01.123');
});

test('calendar windows have exact week/month boundaries and civil date stepping retains leap dates',()=>{
  const month=getCalendarRange('2026-11-02','month');expect(month).toEqual({startDay:'2026-10-26',endDayExclusive:'2026-12-07'});expect(getCalendarDays(month)).toHaveLength(42);
  expect(getCalendarRange('2026-11-02','week')).toEqual({startDay:'2026-11-02',endDayExclusive:'2026-11-09'});
  expect(getCalendarRange('2026-11-02','week',0)).toEqual({startDay:'2026-11-01',endDayExclusive:'2026-11-08'});
  expect(shiftCalendarDate('2024-01-31',1,'month')).toBe('2024-02-29');expect(shiftCalendarDate('2024-02-29',12,'month')).toBe('2025-02-28');expect(shiftCalendarDate('0099-01-31',1,'month')).toBe('0099-02-28');
  expect(shiftCalendarDate('2026-12-28',1,'week')).toBe('2027-01-04');
  for(const task of [()=>getCalendarRange('2026-02-30','month'),()=>getCalendarRange('2026-11-02','week',7),()=>getCalendarRange('0001-01-01','month',0),()=>getCalendarDays({startDay:'2026-11-02',endDayExclusive:'2027-01-01'})])expect(task).toThrow();
});

test('calendar projection distinguishes repeated local hours and treats midnight ends as exclusive',()=>{
  expect(formatCalendarTime('2026-11-01T05:30:00Z','America/New_York')).toBe('01:30 · UTC-04:00');expect(formatCalendarTime('2026-11-01T06:30:00Z','America/New_York')).toBe('01:30 · UTC-05:00');
  const midnight:CalendarEvent={id:'midnight',title:'Late handover',start:'2026-11-02T12:00:00Z',end:'2026-11-02T13:00:00Z'};
  expect(getCalendarDayEvents([midnight],'2026-11-02','Australia/Melbourne')).toHaveLength(1);expect(getCalendarDayEvents([midnight],'2026-11-03','Australia/Melbourne')).toHaveLength(0);
  expect(()=>getCalendarDayEvents([],'2026-11-02','Not/AZone')).toThrow();
  const html=renderToStaticMarkup(createElement(EventCalendar,{label:'Midnight example',date:'2026-11-02',events:[midnight],timeZone:'Australia/Melbourne'}));
  expect(html).toContain('2026-11-03 · 00:00 · UTC+11:00');
});

test('month and week controls keep overlap counts and expose the selected-day event actions',async({page})=>{
  await page.goto(componentRoute);const sample=calendar(page);await expect(sample.locator('[data-calendar-date]')).toHaveCount(42);
  await expect(day(page,'2026-11-02')).toHaveAttribute('aria-pressed','true');await expect(day(page,'2026-11-02')).toHaveAttribute('aria-label',/2 events$/);
  await sample.getByRole('button',{name:'View Interface review',exact:true}).click();await expect(page.getByLabel('Opened calendar event',{exact:true})).toHaveText('Opened: Interface review');
  await sample.getByRole('button',{name:'Week',exact:true}).click();await expect(sample.locator('[data-calendar-date]')).toHaveCount(7);await expect(day(page,'2026-11-02')).toHaveAttribute('aria-pressed','true');
  await sample.getByRole('button',{name:'Month',exact:true}).click();await expect(sample.locator('[data-calendar-date]')).toHaveCount(42);
});

test('date arrows and page navigation keep one roving stop and do not select on arrow focus alone',async({page})=>{
  await page.goto(componentRoute);const sample=calendar(page);await day(page,'2026-11-02').focus();await page.keyboard.press('ArrowRight');await expect(day(page,'2026-11-03')).toBeFocused();await expect(day(page,'2026-11-02')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Enter');await expect(day(page,'2026-11-03')).toHaveAttribute('aria-pressed','true');await page.keyboard.press('End');await expect(day(page,'2026-11-08')).toBeFocused();await page.keyboard.press('Home');await expect(day(page,'2026-11-02')).toBeFocused();
  await page.keyboard.press('PageDown');await expect(day(page,'2026-12-02')).toBeFocused();await expect(sample.locator('[data-calendar-date][tabindex="0"]')).toHaveCount(1);
  const next=sample.getByRole('button',{name:'Next month',exact:true});await next.click();await expect(next).toBeFocused();await expect(sample.getByRole('heading',{name:'January 2027',exact:true})).toBeVisible();
});

test('empty and failed component states retain the dates and retry returns deliberate keyboard focus',async({page})=>{
  await page.goto(componentRoute);const sample=calendar(page);await choose(page,'Calendar preview state','No events');await expect(sample.getByText('No events on this date.',{exact:true})).toBeVisible();await expect(sample.locator('[data-calendar-date]')).toHaveCount(42);
  await choose(page,'Calendar preview state','Connection error');await expect(sample.getByRole('alert')).toContainText('Events could not be loaded');
  const retry=sample.getByRole('button',{name:'Retry loading events',exact:true});await retry.focus();await page.keyboard.press('Enter');await expect(sample.getByRole('alert')).toHaveCount(0);await expect(day(page,'2026-11-02')).toBeFocused();await expect(sample.getByRole('button',{name:'View Build review',exact:true})).toBeVisible();
});

test('calendar details retain normalized instants and return focus to the event action',async({page})=>{
  await page.goto(blockRoute);const sample=calendar(page,'Workspace calendar'),action=sample.getByRole('button',{name:'View Interface review',exact:true});await expect(action).toBeVisible();await action.click();
  const dialog=page.getByRole('dialog',{name:'Calendar event details',exact:true});await expect(dialog.locator('time').first()).toHaveAttribute('datetime','2026-11-02T00:00:00.000Z');await expect(dialog).toContainText('UTC+11:00');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(action).toBeFocused();
  await choose(page,'Calendar time zone','UTC');await expect(action).toBeVisible();await action.click();await expect(dialog).toContainText('UTC+00:00');await expect(dialog.locator('time').first()).toHaveAttribute('datetime','2026-11-02T00:00:00.000Z');
});

test('range load failures keep view state and recover focus without stealing a later action',async({page})=>{
  await page.goto(blockRoute);const sample=calendar(page,'Workspace calendar');await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Fail next calendar load',exact:true}).check();await page.getByRole('button',{name:'Reload events',exact:true}).click();const retry=sample.getByRole('button',{name:'Retry loading events',exact:true});await expect(retry).toBeVisible();await retry.focus();await page.keyboard.press('Enter');await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();await expect(day(page,'2026-11-02','Workspace calendar')).toBeFocused();
  await page.getByRole('checkbox',{name:'Fail next calendar load',exact:true}).check();await page.getByRole('button',{name:'Reload events',exact:true}).click();await expect(retry).toBeVisible();await page.getByRole('checkbox',{name:'Slow next calendar load',exact:true}).check();await retry.click();const zone=page.getByRole('combobox',{name:'Calendar time zone',exact:true});await zone.focus();await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();await expect(zone).toBeFocused();
});

test('a superseded slow calendar response is ignored even when the supplied loader ignores cancellation',async({page})=>{
  await page.addInitScript(()=>{
    const original=AbortSignal.prototype.addEventListener;
    AbortSignal.prototype.addEventListener=function(type:string,...rest:any[]){if(type==='abort')return;return (original as any).call(this,type,...rest);};
    AbortSignal.prototype.throwIfAborted=function(this:AbortSignal){if(this.aborted)(window as Window&{ignoredCalendarAbort?:number}).ignoredCalendarAbort=((window as Window&{ignoredCalendarAbort?:number}).ignoredCalendarAbort??0)+1;};
  });
  await page.goto(blockRoute);const sample=calendar(page,'Workspace calendar');await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Slow next calendar load',exact:true}).check();await page.getByRole('button',{name:'Reload events',exact:true}).click();await expect(sample).toHaveAttribute('aria-busy','true');await sample.getByRole('button',{name:'Next month',exact:true}).click();
  await expect(sample.getByRole('heading',{name:'December 2026',exact:true})).toBeVisible();await expect(sample).not.toHaveAttribute('aria-busy','true');await expect.poll(()=>page.evaluate(()=>(window as Window&{ignoredCalendarAbort?:number}).ignoredCalendarAbort??0)).toBeGreaterThan(0);
  await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toHaveCount(0);await expect(sample.getByRole('heading',{name:'December 2026',exact:true})).toBeVisible();
});

for(const [width,theme] of [[320,'light'],[390,'dark']] as const)test(`calendar and selected-day agenda stay contained and accessible at ${width}px in ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto(blockRoute);const sample=calendar(page,'Workspace calendar');await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await sample.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);await expect(sample.locator('[data-calendar-date]')).toHaveCount(42);
  await sample.getByRole('button',{name:'Week',exact:true}).click();await expect(sample.locator('[data-calendar-date]')).toHaveCount(7);await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
});
