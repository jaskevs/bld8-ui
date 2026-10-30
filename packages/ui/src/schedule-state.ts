/** Bounded scheduling over supplied UTC instants. Wall-clock conversion belongs to the host. */
export interface ScheduleSlot {id:string;start:string;end:string}
export interface ScheduleEvent extends ScheduleSlot {title:string;revision:number}
export interface ScheduleSnapshot {revision:number;slots:ScheduleSlot[];events:ScheduleEvent[]}
export interface ScheduleStart {slotId:string;start:string;end:string}
export interface ScheduleBooking extends ScheduleStart {title:string;expectedRevision:number}
export interface ScheduleBookingResult {snapshot:ScheduleSnapshot;eventId:string}

const MINUTE=60_000,STEP=15*MINUTE,DAY=24*60*MINUTE;
const MAX_SLOTS=200,MAX_EVENTS=500;
const dayFormatters=new Map<string,Intl.DateTimeFormat>();
const offsetFormatters=new Map<string,Intl.DateTimeFormat>();
const timeFormatters=new Map<string,Intl.DateTimeFormat>();

function object(value:unknown):value is Record<string,unknown> {return !!value&&typeof value==='object'&&!Array.isArray(value);}
function identity(value:unknown):asserts value is string {
  if(typeof value!=='string'||!value.trim()||value.length>80)throw new Error('Use a nonblank schedule ID of at most 80 characters.');
}
function revision(value:unknown):asserts value is number {
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new Error('Use a positive schedule revision.');
}
function title(value:unknown):string {
  if(typeof value!=='string'||value.trim().length<3||value.trim().length>120)throw new Error('Use a title between 3 and 120 characters.');
  return value.trim();
}
/** Whole-minute precision prevents display labels silently dropping seconds. */
function instant(value:unknown,allowSubMinute=false):{value:string;milliseconds:number} {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)||Number(value.slice(0,4))<1)throw new Error(allowSubMinute?'Use a UTC ISO instant.':'Use a whole-minute UTC ISO instant.');
  const milliseconds=Date.parse(value);
  if(!Number.isFinite(milliseconds))throw new Error('Use a valid UTC calendar instant.');
  const normalized=new Date(milliseconds).toISOString();
  if(normalized!==(value.length===20?value.slice(0,-1)+'.000Z':value))throw new Error('Use a valid UTC calendar instant.');
  if(!allowSubMinute&&milliseconds%MINUTE!==0)throw new Error('Use a whole-minute UTC ISO instant.');
  return {value:normalized,milliseconds};
}
function interval(value:unknown):ScheduleSlot {
  if(!object(value))throw new Error('Use complete schedule intervals.');
  identity(value.id);const start=instant(value.start),end=instant(value.end);
  if(end.milliseconds<=start.milliseconds||end.milliseconds-start.milliseconds>DAY)throw new Error('Schedule intervals must last more than zero and at most 24 hours.');
  return {id:value.id,start:start.value,end:end.value};
}
function nonoverlapping(rows:readonly ScheduleSlot[],description:string) {
  const ordered=rows.map(row=>({start:Date.parse(row.start),end:Date.parse(row.end)})).sort((a,b)=>a.start-b.start);
  for(let index=1;index<ordered.length;index++)if(ordered[index].start<ordered[index-1].end)throw new Error(description+' must not overlap.');
}
function unique(rows:readonly ScheduleSlot[],description:string) {
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error(description+' need unique IDs.');
}

/** Clone and normalize before rendering or writing; source order is preserved. */
export function validateScheduleSnapshot(input:unknown):ScheduleSnapshot {
  if(!object(input)||!Array.isArray(input.slots)||!Array.isArray(input.events)||input.slots.length>MAX_SLOTS||input.events.length>MAX_EVENTS)throw new Error('Supply at most 200 availability windows and 500 scheduled events.');
  revision(input.revision);
  const slots=input.slots.map(interval),events=input.events.map(value=>{
    const parsed=interval(value);if(!object(value))throw new Error('Use complete scheduled events.');
    revision(value.revision);return {...parsed,title:title(value.title),revision:value.revision};
  });
  unique(slots,'Availability windows');unique(events,'Scheduled events');
  nonoverlapping(slots,'Availability windows');nonoverlapping(events,'Scheduled events');
  return {revision:input.revision,slots,events};
}

function cached(cache:Map<string,Intl.DateTimeFormat>,key:string,create:()=>Intl.DateTimeFormat) {
  let formatter=cache.get(key);if(formatter)return formatter;
  formatter=create();if(cache.size>=32)cache.delete(cache.keys().next().value!);cache.set(key,formatter);return formatter;
}
function zone(value:unknown):asserts value is string {
  if(typeof value!=='string'||!value.trim()||value.length>100)throw new Error('Choose a supported time zone.');
}
function dayFormatter(timeZone:string) {
  zone(timeZone);try{return cached(dayFormatters,timeZone,()=>new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn',{timeZone,era:'short',year:'numeric',month:'2-digit',day:'2-digit'}));}
  catch{throw new Error('Choose a supported time zone.');}
}
function projectedDay(milliseconds:number,formatter:Intl.DateTimeFormat):string {
  const parts=formatter.formatToParts(new Date(milliseconds));
  const read=(name:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===name)?.value??'';
  const year=read('year');if(read('era')!=='AD'||!/^\d{1,4}$/.test(year))throw new Error('Use a supported calendar date.');
  return year.padStart(4,'0')+'-'+read('month')+'-'+read('day');
}
function calendarDay(value:unknown):asserts value is string {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number(value.slice(0,4))<1)throw new Error('Use a date in YYYY-MM-DD format.');
  const parsed=Date.parse(value+'T00:00:00Z');
  if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==value)throw new Error('Use a valid calendar date.');
}
function duration(value:unknown):asserts value is number {
  if(typeof value!=='number'||!Number.isInteger(value)||value<15||value>120||value%15!==0)throw new Error('Choose 15 to 120 minutes, in 15-minute steps.');
}

/** Project an existing instant, including seconds/milliseconds, to its calendar day. */
export function getScheduleDay(value:string,timeZone:string):string {
  return projectedDay(instant(value,true).milliseconds,dayFormatter(timeZone));
}

/** Starts are sampled in elapsed UTC time, retaining both sides of a repeated local hour. */
export function getScheduleStarts(snapshot:ScheduleSnapshot,day:string,timeZone:string,durationMinutes:number):ScheduleStart[] {
  const clean=validateScheduleSnapshot(snapshot);calendarDay(day);duration(durationMinutes);const formatter=dayFormatter(timeZone);
  const windows=clean.slots.map(slot=>({...slot,startMs:Date.parse(slot.start),endMs:Date.parse(slot.end)})).sort((a,b)=>a.startMs-b.startMs);
  const events=clean.events.map(event=>({start:Date.parse(event.start),end:Date.parse(event.end)})).sort((a,b)=>a.start-b.start);
  const result:ScheduleStart[]=[];let eventIndex=0;
  for(const window of windows)for(let start=window.startMs,end=start+durationMinutes*MINUTE;end<=window.endMs;start+=STEP,end=start+durationMinutes*MINUTE){
    while(eventIndex<events.length&&events[eventIndex].end<=start)eventIndex++;
    if(eventIndex<events.length&&events[eventIndex].start<end)continue;
    if(projectedDay(start,formatter)!==day)continue;
    result.push({slotId:window.id,start:new Date(start).toISOString(),end:new Date(end).toISOString()});
  }
  return result;
}

/** Local 24-hour label plus an explicit UTC offset, including repeated-hour disambiguation. */
export function formatScheduleTime(value:string,timeZone:string,locale='en-AU'):string {
  const date=new Date(instant(value).milliseconds);zone(timeZone);
  if(typeof locale!=='string'||!locale.trim()||locale.length>100)throw new Error('Choose a supported display locale.');
  try{
    const offset=cached(offsetFormatters,timeZone,()=>new Intl.DateTimeFormat('en-US-u-nu-latn',{timeZone,timeZoneName:'longOffset'}));
    const name=offset.formatToParts(date).find(part=>part.type==='timeZoneName')?.value;
    if(!name||!/^GMT(?:[+-]\d{2}:\d{2}(?::\d{2})?)?$/.test(name))throw new Error('Invalid offset.');
    const seconds=/[+-]\d{2}:\d{2}:\d{2}$/.test(name);
    const clock=cached(timeFormatters,locale+'\0'+timeZone+'\0'+seconds,()=>new Intl.DateTimeFormat(locale,{timeZone,hour:'2-digit',minute:'2-digit',...(seconds?{second:'2-digit' as const}:{}),hourCycle:'h23'}));
    return clock.format(date)+' · '+(name==='GMT'?'UTC+00:00':name.replace('GMT','UTC'));
  }catch{throw new Error('Choose a supported time zone and display locale.');}
}

/** Validate against the same snapshot immediately before the host performs its atomic write. */
export function validateScheduleBooking(snapshot:ScheduleSnapshot,booking:ScheduleBooking):void {
  const clean=validateScheduleSnapshot(snapshot);
  if(!object(booking))throw new Error('Use a complete booking.');
  revision(booking.expectedRevision);if(booking.expectedRevision!==clean.revision)throw new Error('The schedule changed. Reload before booking.');
  if(clean.events.length>=MAX_EVENTS)throw new Error('This schedule already contains 500 events. Load a narrower source before booking.');
  identity(booking.slotId);title(booking.title);
  const start=instant(booking.start),end=instant(booking.end);duration((end.milliseconds-start.milliseconds)/MINUTE);
  const window=clean.slots.find(slot=>slot.id===booking.slotId);
  if(!window)throw new Error('Choose an available start.');
  const windowStart=Date.parse(window.start),windowEnd=Date.parse(window.end);
  if(start.milliseconds<windowStart||end.milliseconds>windowEnd||(start.milliseconds-windowStart)%STEP!==0)throw new Error('Choose an available start within its window.');
  if(clean.events.some(event=>Date.parse(event.start)<end.milliseconds&&Date.parse(event.end)>start.milliseconds))throw new Error('This time is no longer available.');
}
