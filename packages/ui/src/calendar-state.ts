import {formatScheduleTime,getScheduleDay} from './schedule-state.js';

export type CalendarView='week'|'month';
export interface CalendarEvent {id:string;title:string;start:string;end:string}
/** Calendar dates in the chosen IANA zone. The end date is exclusive. */
export interface CalendarRange {startDay:string;endDayExclusive:string}
const DAY=86_400_000,MAX_EVENTS=500;
const reserved=new Set(['__proto__','constructor','prototype']);

function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function dateValue(value:unknown):Date {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith('0000'))throw new Error('Use a calendar date in YYYY-MM-DD format.');
  const date=new Date(value+'T12:00:00.000Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error('Use a valid calendar date.');
  return date;
}
function dayValue(date:Date):string {
  const value=date.toISOString();
  if(!/^\d{4}-/.test(value)||value.startsWith('0000'))throw new Error('The calendar range extends beyond supported years.');
  return value.slice(0,10);
}
function utc(value:unknown):string {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)||value.startsWith('0000'))throw new Error('Use complete UTC ISO event instants.');
  const date=new Date(value),expected=value.length===20?value.slice(0,-1)+'.000Z':value;
  if(!Number.isFinite(date.getTime())||date.toISOString()!==expected)throw new Error('Use valid UTC calendar instants.');
  return expected;
}

/** Clone supplied events. Overlap is allowed; individual events span at most 366 elapsed days. */
export function validateCalendarEvents(input:unknown):CalendarEvent[] {
  if(!Array.isArray(input)||input.length>MAX_EVENTS)throw new Error('Supply at most 500 calendar events.');
  const seen=new Set<string>();
  return Array.from(input).map(value=>{
    if(!record(value)||typeof value.id!=='string'||!value.id.trim()||value.id.length>80||/[\u0000-\u001f\u007f]/.test(value.id)||reserved.has(value.id)||seen.has(value.id))throw new Error('Calendar events need unique, nonblank IDs of at most 80 characters.');
    if(typeof value.title!=='string'||!value.title.trim()||value.title.trim().length>120)throw new Error('Use an event title of 1 to 120 characters.');
    const start=utc(value.start),end=utc(value.end),duration=Date.parse(end)-Date.parse(start);
    if(duration<=0||duration>366*DAY)throw new Error('Calendar events must last more than zero and at most 366 elapsed days.');
    seen.add(value.id);return {id:value.id,title:value.title.trim(),start,end};
  });
}

/** Civil date arithmetic uses UTC noon; it never invents a local wall-clock instant. */
export function shiftCalendarDate(date:string,amount:number,unit:'day'|'week'|'month'):string {
  const value=dateValue(date);
  if(!Number.isSafeInteger(amount)||Math.abs(amount)>366||!['day','week','month'].includes(unit))throw new Error('Use a bounded calendar date step.');
  if(unit==='month'){
    const original=value.getUTCDate();value.setUTCDate(1);value.setUTCMonth(value.getUTCMonth()+amount);
    const last=new Date(value);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
    value.setUTCDate(Math.min(original,last.getUTCDate()));
  }else value.setUTCDate(value.getUTCDate()+amount*(unit==='week'?7:1));
  return dayValue(value);
}

/** Month views contain six complete weeks; week views contain seven calendar dates. */
export function getCalendarRange(date:string,view:CalendarView,weekStartsOn=1):CalendarRange {
  const value=dateValue(date);
  if(!['week','month'].includes(view)||!Number.isInteger(weekStartsOn)||weekStartsOn<0||weekStartsOn>6)throw new Error('Choose a calendar view and a week start from 0 to 6.');
  if(view==='month')value.setUTCDate(1);
  value.setUTCDate(value.getUTCDate()-(value.getUTCDay()-weekStartsOn+7)%7);
  const startDay=dayValue(value);value.setUTCDate(value.getUTCDate()+(view==='month'?42:7));
  return {startDay,endDayExclusive:dayValue(value)};
}

export function getCalendarDays(range:CalendarRange):string[] {
  if(!record(range))throw new Error('Supply a complete calendar range.');
  const start=dateValue(range.startDay),end=dateValue(range.endDayExclusive),count=(end.getTime()-start.getTime())/DAY;
  if(!Number.isInteger(count)||count<1||count>42)throw new Error('Supply from 1 to 42 consecutive calendar dates.');
  return Array.from({length:count},(_,index)=>shiftCalendarDate(range.startDay,index,'day'));
}

/** End instants are exclusive, including events that end exactly at local midnight. */
export function getCalendarDayEvents(events:readonly CalendarEvent[],day:string,timeZone:string):CalendarEvent[] {
  dateValue(day);const clean=validateCalendarEvents(events);
  // Validate the zone even when there are no events.
  getScheduleDay(day+'T12:00:00.000Z',timeZone);
  return clean.filter(event=>getScheduleDay(event.start,timeZone)<=day&&getScheduleDay(new Date(Date.parse(event.end)-1).toISOString(),timeZone)>=day)
    .sort((left,right)=>left.start.localeCompare(right.start)||left.end.localeCompare(right.end)||left.id.localeCompare(right.id));
}

/** Preserve seconds/milliseconds when present; minute-aligned events share agenda labels. */
export function formatCalendarTime(value:string,timeZone:string,locale='en-AU'):string {
  const normalized=utc(value),date=new Date(normalized);
  if(date.getUTCSeconds()===0&&date.getUTCMilliseconds()===0)return formatScheduleTime(normalized,timeZone,locale);
  // getScheduleDay performs the same bounded instant and IANA-zone validation.
  getScheduleDay(normalized,timeZone);
  if(typeof locale!=='string'||!locale.trim()||locale.length>100)throw new Error('Choose a supported display locale.');
  try{
    const clock=new Intl.DateTimeFormat(locale,{timeZone,hour:'2-digit',minute:'2-digit',second:'2-digit',...(date.getUTCMilliseconds()?{fractionalSecondDigits:3 as const}:{}),hourCycle:'h23'}).format(date);
    const offset=new Intl.DateTimeFormat('en-US-u-nu-latn',{timeZone,timeZoneName:'longOffset'}).formatToParts(date).find(part=>part.type==='timeZoneName')?.value;
    if(!offset||!/^GMT(?:[+-]\d{2}:\d{2}(?::\d{2})?)?$/.test(offset))throw new Error();
    return clock+' · '+(offset==='GMT'?'UTC+00:00':offset.replace('GMT','UTC'));
  }catch{throw new Error('Choose a supported time zone and display locale.');}
}
