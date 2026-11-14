/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const resourceSchedulerExamples=[
  {
    id:'resource-scheduler-recovery',componentId:'resource-scheduler',title:'Move a resource booking with a way back',
    description:'People, rooms and equipment share explicit availability. Pointer and keyboard proposals use one reviewed, revision-checked save.',
    keyboard:['Arrow keys move an event proposal; Up and Down change resource. Shift resizes the end; Control or Command resizes the start.','Enter opens the review dialog. Its day/time choices are existing UTC instants displayed with their IANA offsets.','Pointer movement and resizing only preview a change. Escape or pointer cancellation restores the prior draft.','An unknown save result locks the unchanged request for retry; a revision conflict requires explicit rebase.'],
    states:['resource lanes','day and week','snapped pointer proposals','keyboard resize','exact table','mobile agenda','availability and overlap','lost acknowledgement','conflict rebase','late response'],
    source:`'use client';
import { useCallback, useRef, useState } from 'react';
import { Button, ResourceScheduler, Select, createMemoryResourceScheduler, type SchedulerChange, type SchedulerDay, type SchedulerSaveContext, type SchedulerSaveResult, type SchedulerSnapshot } from '@bld8/ui';

const dates=['2026-11-16','2026-11-17','2026-11-18'];
const days:SchedulerDay[]=dates.map(date=>({date,start:date+'T09:00:00.000Z',end:date+'T17:00:00.000Z'}));
const initial:SchedulerSnapshot={revision:1,resources:[{id:'alex',label:'Alex Morgan',kind:'person'},{id:'room',label:'Review room',kind:'room'},{id:'kit',label:'Device kit',kind:'resource'}],availability:dates.flatMap(date=>['alex','room','kit'].map(resourceId=>({id:resourceId+'-'+date,resourceId,start:date+'T09:00:00.000Z',end:date+'T17:00:00.000Z'}))),events:[
  {id:'review',resourceId:'alex',title:'Interface review',start:'2026-11-16T09:00:00.000Z',end:'2026-11-16T10:00:00.000Z',revision:1},
  {id:'sync',resourceId:'alex',title:'Design sync',start:'2026-11-16T11:00:00.000Z',end:'2026-11-16T12:00:00.000Z',revision:1},
  {id:'room-review',resourceId:'room',title:'Room booking',start:'2026-11-16T10:00:00.000Z',end:'2026-11-16T11:00:00.000Z',revision:1},
  {id:'device-check',resourceId:'kit',title:'Device check',start:'2026-11-17T13:00:00.000Z',end:'2026-11-17T14:00:00.000Z',revision:1}
]};
function wait(signal:AbortSignal,milliseconds:number){return new Promise<void>((resolve,reject)=>{const timer=setTimeout(done,milliseconds);function stop(){clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));}function done(){signal.removeEventListener('abort',stop);resolve();}if(signal.aborted){stop();return;}signal.addEventListener('abort',stop,{once:true});});}
export default function ResourceSchedulerRecoveryExample(){
  const service=useRef(createMemoryResourceScheduler(initial)),mode=useRef('normal'),lost=useRef(false),conflicted=useRef(false);
  const [snapshot,setSnapshot]=useState(initial),[preview,setPreview]=useState('normal'),[key,setKey]=useState(0),[ids,setIds]=useState<string[]>([]);
  const save=useCallback(async(change:SchedulerChange,context:SchedulerSaveContext):Promise<SchedulerSaveResult>=>{
    const active=service.current,scenario=mode.current;setIds(current=>[...current,context.requestId]);
    if(scenario==='late'){await new Promise(resolve=>setTimeout(resolve,600));return active.save(change,{...context,signal:new AbortController().signal});}
    await wait(context.signal,120);
    if(scenario==='reject')return {ok:false,code:'validation',message:'Example service rejected this change. Your proposal is kept.'};
    if(scenario==='conflict'&&!conflicted.current){conflicted.current=true;const current=active.read(),event=current.events.find(event=>event.id===change.eventId)!;await active.save({eventId:event.id,expectedRevision:event.revision,expectedSnapshotRevision:current.revision,resourceId:event.resourceId,start:new Date(Date.parse(event.start)+30*60000).toISOString(),end:new Date(Date.parse(event.end)+30*60000).toISOString()},{signal:new AbortController().signal,requestId:crypto.randomUUID()});}
    const result=await active.save(change,context);
    if(scenario==='lost'&&!lost.current){lost.current=true;throw new Error('The acknowledgement was lost after the example write.');}
    return result;
  },[]);
  return <div style={{minWidth:0,display:'grid',gap:16}}>
    <div style={{display:'flex',alignItems:'end',gap:12,flexWrap:'wrap'}}><Select label="Scheduler service preview" value={preview} options={[{value:'normal',label:'Successful save'},{value:'lost',label:'Lost acknowledgement'},{value:'conflict',label:'Newer revision'},{value:'reject',label:'Rejected save'},{value:'late',label:'Late service response'},{value:'readonly',label:'Read only'}]} onValueChange={value=>{if(value){mode.current=value;setPreview(value);}}}/><Button variant="secondary" size="sm" onClick={()=>{service.current=createMemoryResourceScheduler(initial);lost.current=false;conflicted.current=false;setSnapshot(initial);setIds([]);setKey(value=>value+1);}}>Reset scheduler source</Button><Button size="sm" variant="secondary" onClick={async()=>{const current=service.current.read(),event=current.events.find(event=>event.id==='sync')!;const result=await service.current.save({eventId:event.id,expectedRevision:event.revision,expectedSnapshotRevision:current.revision,resourceId:event.resourceId,start:new Date(Date.parse(event.start)+15*60000).toISOString(),end:new Date(Date.parse(event.end)+15*60000).toISOString()},{signal:new AbortController().signal,requestId:crypto.randomUUID()});if(result.ok)setSnapshot(result.snapshot);}}>Publish newer supplied schedule</Button></div>
    <ResourceScheduler label="Resource planning" snapshot={snapshot} days={days} timeZone="UTC" onSave={save} onSnapshotChange={setSnapshot} sourceKey={key} snapMinutes={15} readOnly={preview==='readonly'}/>
    <output aria-label="Scheduler save request IDs" style={{fontSize:11,overflowWrap:'anywhere'}}>{JSON.stringify(ids)}</output>
    <p className="bui-hint">Authored events and availability. The single-process example stores at most 100 receipts and resets on reload. A real service must authorise resource access, check revisions and overlap atomically, and retain durable idempotency receipts. Stopping a client request cannot prove a server write was undone.</p>
  </div>;
}`
  },
  {
    id:'resource-scheduler-repeated-hour',componentId:'resource-scheduler',title:'Two occurrences of the same local hour',
    description:'A supplied UTC window spans a clock change. Offset labels distinguish repeated local times without converting an ambiguous wall clock.',
    keyboard:['Both 01:00 choices keep different UTC values and UTC offsets.','Use Exact table to inspect the canonical instants and revisions.','Changing reading direction reverses logical pointer and horizontal keyboard movement without changing event values.'],
    states:['IANA zone','repeated local hour','explicit UTC boundaries','scoped right-to-left','canonical instants','controlled host save'],
    source:`'use client';
import { useCallback, useRef, useState } from 'react';
import { Button, ResourceScheduler, UIProvider, createMemoryResourceScheduler, type SchedulerChange, type SchedulerSaveContext, type SchedulerSnapshot } from '@bld8/ui';

const initial:SchedulerSnapshot={revision:1,resources:[{id:'room',label:'Review room',kind:'room'}],availability:[{id:'window',resourceId:'room',start:'2026-11-01T04:00:00.000Z',end:'2026-11-01T08:00:00.000Z'}],events:[{id:'first-hour',resourceId:'room',title:'First local hour',start:'2026-11-01T05:00:00.000Z',end:'2026-11-01T05:30:00.000Z',revision:1},{id:'second-hour',resourceId:'room',title:'Second local hour',start:'2026-11-01T06:00:00.000Z',end:'2026-11-01T06:30:00.000Z',revision:1}]};
const days=[{date:'2026-11-01',start:'2026-11-01T04:00:00.000Z',end:'2026-11-01T08:00:00.000Z'}];
export default function RepeatedLocalHourExample(){
  const service=useRef(createMemoryResourceScheduler(initial)),[snapshot,setSnapshot]=useState(initial),[rtl,setRtl]=useState(false);
  const save=useCallback((change:SchedulerChange,context:SchedulerSaveContext)=>service.current.save(change,context),[]);
  return <UIProvider direction={rtl?'rtl':'ltr'} locale="en-AU"><div style={{minWidth:0,display:'grid',gap:16}}><Button variant="secondary" size="sm" onClick={()=>setRtl(value=>!value)}>{rtl?'Use left-to-right':'Use right-to-left'}</Button><ResourceScheduler label="Repeated-hour planning" snapshot={snapshot} days={days} timeZone="America/New_York" onSave={save} onSnapshotChange={setSnapshot}/><p className="bui-hint">These are authored UTC instants. The display projects them into New York; no local date/time string is resolved into an instant.</p></div></UIProvider>;
}`
  }
];
