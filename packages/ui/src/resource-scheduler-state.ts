/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {getScheduleDay} from './schedule-state.js';

export interface SchedulerResource{id:string;label:string;kind?:'person'|'room'|'resource'}
export interface SchedulerAvailability{id:string;resourceId:string;start:string;end:string}
export interface SchedulerEvent extends SchedulerAvailability{title:string;revision:number}
export interface SchedulerDay{date:string;start:string;end:string}
export interface SchedulerSnapshot{revision:number;resources:SchedulerResource[];availability:SchedulerAvailability[];events:SchedulerEvent[]}
export interface SchedulerChange{eventId:string;expectedRevision:number;expectedSnapshotRevision:number;resourceId:string;start:string;end:string}
export interface SchedulerSaveContext{signal:AbortSignal;requestId:string}
export type SchedulerSaveResult={ok:true;requestId:string;eventId:string;snapshot:SchedulerSnapshot}|{ok:false;code:'conflict';snapshot:SchedulerSnapshot}|{ok:false;code:'validation';message:string};
export interface SchedulerSegment{eventId:string;resourceId:string;date:string;start:number;end:number;offset:number;width:number;clippedStart:boolean;clippedEnd:boolean}
export const RESOURCE_SCHEDULER_LIMITS={resources:50,events:500,availability:1000,days:7,intervalMinutes:1560,eventMinutes:1440,receipts:100} as const;
const MINUTE=60_000;
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function id(value:unknown):asserts value is string{if(typeof value!=='string'||!value.trim()||value.length>80)throw Error('Use a nonblank ID of up to 80 characters.');}
function revision(value:unknown):asserts value is number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw Error('Use a positive safe-integer revision.');}
export function schedulerInstant(value:unknown):number{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(value)||Number(value.slice(0,4))<1)throw Error('Use a whole-minute UTC ISO instant.');
  const time=Date.parse(value);if(!Number.isFinite(time)||new Date(time).toISOString()!==(value.length===20?value.slice(0,-1)+'.000Z':value))throw Error('Use a valid UTC calendar instant.');return time;
}
function interval(input:unknown,maximum:number):SchedulerAvailability{
  if(!object(input))throw Error('Supply complete resource intervals.');id(input.id);id(input.resourceId);const start=schedulerInstant(input.start),end=schedulerInstant(input.end);
  if(end<=start||end-start>maximum*MINUTE)throw Error('Use a positive, bounded interval.');
  return {id:input.id,resourceId:input.resourceId,start:new Date(start).toISOString(),end:new Date(end).toISOString()};
}
function noOverlap(rows:readonly SchedulerAvailability[],description:string){
  const groups=new Map<string,SchedulerAvailability[]>();for(const row of rows){const group=groups.get(row.resourceId)??[];group.push(row);groups.set(row.resourceId,group);}
  for(const group of groups.values()){const ordered=[...group].sort((a,b)=>schedulerInstant(a.start)-schedulerInstant(b.start));for(let index=1;index<ordered.length;index++)if(schedulerInstant(ordered[index].start)<schedulerInstant(ordered[index-1].end))throw Error(description+' overlap in one resource.');}
}
function fits(event:Pick<SchedulerAvailability,'resourceId'|'start'|'end'>,availability:readonly SchedulerAvailability[]){return availability.some(slot=>slot.resourceId===event.resourceId&&schedulerInstant(slot.start)<=schedulerInstant(event.start)&&schedulerInstant(slot.end)>=schedulerInstant(event.end));}
export function validateSchedulerSnapshot(input:unknown):SchedulerSnapshot{
  if(!object(input)||!Array.isArray(input.resources)||input.resources.length>50||!Array.isArray(input.events)||input.events.length>500||!Array.isArray(input.availability)||input.availability.length>1000)throw Error('Supply up to 50 resources, 500 events and 1,000 availability windows.');revision(input.revision);
  const resources=Array.from(input.resources).map(value=>{if(!object(value))throw Error('Supply complete resources.');id(value.id);if(typeof value.label!=='string'||!value.label.trim()||value.label.length>80||value.kind!==undefined&&!['person','room','resource'].includes(String(value.kind)))throw Error('Supply a resource label and supported kind.');return {id:value.id,label:value.label.trim(),...(value.kind?{kind:value.kind as SchedulerResource['kind']}: {})};});
  const availability=Array.from(input.availability).map(value=>interval(value,1560)),events=Array.from(input.events).map(value=>{const item=interval(value,1440);if(!object(value)||typeof value.title!=='string'||value.title.trim().length<3||value.title.length>120)throw Error('Use event titles between 3 and 120 characters.');revision(value.revision);return {...item,title:value.title.trim(),revision:value.revision};});
  for(const values of [resources,availability,events])if(new Set(values.map(value=>value.id)).size!==values.length)throw Error('IDs must be unique within each scheduler collection.');
  const resourceIds=new Set(resources.map(resource=>resource.id));if([...availability,...events].some(value=>!resourceIds.has(value.resourceId)))throw Error('Every interval needs a supplied resource.');noOverlap(availability,'Availability windows');noOverlap(events,'Scheduled events');
  if(events.some(event=>!fits(event,availability)))throw Error('Every event must fit one supplied availability window.');return {revision:input.revision,resources,availability,events};
}
/** Hosts provide explicit civil-day UTC boundaries; no wall-clock-to-instant conversion occurs. */
export function validateSchedulerDays(input:readonly SchedulerDay[],timeZone:string):SchedulerDay[]{
  if(!Array.isArray(input)||!input.length||input.length>7)throw Error('Supply one to seven explicit day windows.');
  const result=Array.from(input).map(day=>{if(!object(day)||typeof day.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day.date))throw Error('Supply canonical day labels.');const start=schedulerInstant(day.start),end=schedulerInstant(day.end);if(end<=start||end-start>1560*MINUTE||getScheduleDay(new Date(start).toISOString(),timeZone)!==day.date||getScheduleDay(new Date(end-1).toISOString(),timeZone)!==day.date)throw Error('Each UTC day window must stay inside its labelled IANA calendar day.');return {date:day.date,start:new Date(start).toISOString(),end:new Date(end).toISOString()};});
  if(new Set(result.map(day=>day.date)).size!==result.length||result.some((day,index)=>index>0&&(day.date<=result[index-1].date||schedulerInstant(day.start)<schedulerInstant(result[index-1].end))))throw Error('Day windows need distinct ascending calendar dates without overlap.');return result;
}
export function validateSchedulerChange(snapshot:SchedulerSnapshot,input:unknown):SchedulerChange{
  if(!object(input))throw Error('Supply a complete scheduler change.');id(input.eventId);revision(input.expectedRevision);revision(input.expectedSnapshotRevision);const event=snapshot.events.find(event=>event.id===input.eventId);if(!event)throw Error('The event is no longer available.');
  if(event.revision!==input.expectedRevision||snapshot.revision!==input.expectedSnapshotRevision)throw Error('The schedule changed. Compare the latest revisions before saving.');
  const next=interval({id:event.id,resourceId:input.resourceId,start:input.start,end:input.end},1440);if(!snapshot.resources.some(resource=>resource.id===next.resourceId))throw Error('Choose a supplied resource.');if(!fits(next,snapshot.availability))throw Error('The event must fit one availability window for this resource.');
  if(snapshot.events.some(other=>other.id!==event.id&&other.resourceId===next.resourceId&&schedulerInstant(other.start)<schedulerInstant(next.end)&&schedulerInstant(other.end)>schedulerInstant(next.start)))throw Error('This resource already has an event during that time.');
  return {eventId:event.id,expectedRevision:input.expectedRevision,expectedSnapshotRevision:input.expectedSnapshotRevision,resourceId:next.resourceId,start:next.start,end:next.end};
}
export function schedulerSegments(events:readonly SchedulerEvent[],days:readonly SchedulerDay[]):SchedulerSegment[]{
  const segments:SchedulerSegment[]=[];for(const event of events){const start=schedulerInstant(event.start),end=schedulerInstant(event.end);if(end<=start)throw Error('Event geometry needs a positive interval.');for(const day of days){const begin=schedulerInstant(day.start),finish=schedulerInstant(day.end);if(finish<=begin)throw Error('Day geometry needs a positive interval.');if(start>=finish||end<=begin)continue;segments.push({eventId:event.id,resourceId:event.resourceId,date:day.date,start:Math.max(start,begin),end:Math.min(end,finish),offset:(Math.max(start,begin)-begin)/(finish-begin)*100,width:(Math.min(end,finish)-Math.max(start,begin))/(finish-begin)*100,clippedStart:start<begin,clippedEnd:end>finish});}}return segments;
}
export function snapSchedulerMinutes(minutes:number,step:number):number{if(![5,10,15,30,60].includes(step)||!Number.isFinite(minutes))throw Error('Choose a finite offset and a supported minute step.');return Math.round(minutes/step)*step;}
export function applySchedulerChange(snapshot:SchedulerSnapshot,change:SchedulerChange,requestId:string):SchedulerSaveResult{
  if(typeof requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))throw Error('Supply a stable request ID.');const current=validateSchedulerSnapshot(snapshot);
  if(current.revision!==change.expectedSnapshotRevision||current.events.find(event=>event.id===change.eventId)?.revision!==change.expectedRevision)return {ok:false,code:'conflict',snapshot:current};
  let clean:SchedulerChange;try{clean=validateSchedulerChange(current,change);}catch(error){return {ok:false,code:'validation',message:error instanceof Error?error.message:'Review this change.'};}
  if(current.revision===Number.MAX_SAFE_INTEGER||clean.expectedRevision===Number.MAX_SAFE_INTEGER)return {ok:false,code:'validation',message:'The revision cannot be advanced.'};
  const next={...current,revision:current.revision+1,events:current.events.map(event=>event.id===clean.eventId?{...event,resourceId:clean.resourceId,start:clean.start,end:clean.end,revision:event.revision+1}:event)};return {ok:true,requestId,eventId:clean.eventId,snapshot:validateSchedulerSnapshot(next)};
}
export function validateSchedulerSaveResult(input:unknown,base:SchedulerSnapshot,change:SchedulerChange,requestId:string):SchedulerSaveResult{
  if(!object(input)||typeof input.ok!=='boolean')throw Error('The scheduler service returned an invalid acknowledgement.');
  if(input.ok===false){if(input.code==='conflict'){const snapshot=validateSchedulerSnapshot(input.snapshot);if(snapshot.revision<base.revision)throw Error('The conflict snapshot is older than this proposal.');return {ok:false,code:'conflict',snapshot};}if(input.code==='validation'&&typeof input.message==='string'&&input.message.length>0&&input.message.length<=300)return {ok:false,code:'validation',message:input.message};throw Error('The scheduler service returned an invalid rejection.');}
  const expected=applySchedulerChange(base,change,requestId);if(!expected.ok||input.requestId!==requestId||input.eventId!==change.eventId)throw Error('The acknowledgement does not match this request.');
  const actual=validateSchedulerSnapshot(input.snapshot),canonical=(snapshot:SchedulerSnapshot)=>JSON.stringify({...snapshot,resources:[...snapshot.resources].sort((a,b)=>a.id.localeCompare(b.id)),availability:[...snapshot.availability].sort((a,b)=>a.id.localeCompare(b.id)),events:[...snapshot.events].sort((a,b)=>a.id.localeCompare(b.id))});
  if(canonical(actual)!==canonical(expected.snapshot))throw Error('The acknowledgement changed unexpected records or revisions.');return {ok:true,requestId,eventId:change.eventId,snapshot:actual};
}
/** Illustrative single-process source. Hosts must provide durable atomic checks and receipts. */
export function createMemoryResourceScheduler(initial:SchedulerSnapshot){
  let snapshot=validateSchedulerSnapshot(initial);const receipts=new Map<string,{signature:string;result:SchedulerSaveResult}>();
  return {read:()=>validateSchedulerSnapshot(snapshot),async save(change:SchedulerChange,{signal,requestId}:SchedulerSaveContext):Promise<SchedulerSaveResult>{if(signal.aborted)throw new DOMException('Aborted','AbortError');const signature=JSON.stringify(change),receipt=receipts.get(requestId);if(receipt){if(receipt.signature!==signature)return {ok:false,code:'validation',message:'This request ID was used for a different change.'};return JSON.parse(JSON.stringify(receipt.result)) as SchedulerSaveResult;}const result=applySchedulerChange(snapshot,change,requestId);if(result.ok)snapshot=result.snapshot;receipts.set(requestId,{signature,result});if(receipts.size>100)receipts.delete(receipts.keys().next().value!);return JSON.parse(JSON.stringify(result)) as SchedulerSaveResult;}};
}
