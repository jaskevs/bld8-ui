/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {Check,ChevronLeft,ChevronRight,GripVertical,RotateCcw} from 'lucide-react';
import {Alert,Button,Icon} from './core.js';
import {Select} from './controls.js';
import {Dialog} from './overlays.js';
import {Reveal} from './reveal.js';
import {useUIConfig} from './ui-config.js';
import {formatScheduleTime,getScheduleDay} from './schedule-state.js';
import {schedulerInstant,schedulerSegments,snapSchedulerMinutes,validateSchedulerChange,validateSchedulerDays,validateSchedulerSaveResult,validateSchedulerSnapshot,type SchedulerChange,type SchedulerDay,type SchedulerEvent,type SchedulerSaveContext,type SchedulerSaveResult,type SchedulerSnapshot} from './resource-scheduler-state.js';

export interface ResourceSchedulerProps{
  label:string;
  snapshot:SchedulerSnapshot;
  /** Explicit UTC day boundaries supplied by the host for this display zone. */
  days:readonly SchedulerDay[];
  timeZone:string;
  onSave?:(change:SchedulerChange,context:SchedulerSaveContext)=>Promise<SchedulerSaveResult>;
  onSnapshotChange?:(snapshot:SchedulerSnapshot)=>void;
  sourceKey?:string|number;
  snapMinutes?:5|10|15|30|60;
  defaultView?:'day'|'week';
  readOnly?:boolean;
  className?:string;
}
type Saver=ResourceSchedulerProps['onSave'];
interface Draft{base:SchedulerSnapshot;change:SchedulerChange;key:ResourceSchedulerProps['sourceKey'];saver:Saver}
interface Attempt{draft:Draft;requestId:string;fingerprint:string}
interface Gesture{pointerId:number;target:HTMLElement;origin:HTMLElement;kind:'move'|'start'|'end';event:SchedulerEvent;before:Draft|null;offset:number}
const MINUTE=60_000;
const EMPTY:SchedulerSnapshot={revision:1,resources:[],availability:[],events:[]};

/** Bounded resource planning over supplied instants. Proposals never write until confirmed. */
export function ResourceScheduler({label,snapshot,days,timeZone,onSave,onSnapshotChange,sourceKey,snapMinutes=15,defaultView='day',readOnly=false,className}:ResourceSchedulerProps){
  const {message:m,locale,direction}=useUIConfig();const uid=useId();
  const parsed=useMemo(()=>{try{return {snapshot:validateSchedulerSnapshot(snapshot),days:validateSchedulerDays(days,timeZone),error:''};}catch(error){return {snapshot:EMPTY,days:[] as SchedulerDay[],error:error instanceof Error?error.message:'Review the scheduler data.'};}},[snapshot,days,timeZone]);
  const step=[5,10,15,30,60].includes(snapMinutes)?snapMinutes:15;
  const [ack,setAck]=useState<{snapshot:SchedulerSnapshot;key:typeof sourceKey;saver:Saver}|null>(null);
  const model=ack&&ack.key===sourceKey&&ack.saver===onSave&&ack.snapshot.revision>parsed.snapshot.revision?ack.snapshot:parsed.snapshot;
  const liveModel=useRef(model);liveModel.current=model;
  const [view,setView]=useState(defaultView),[reading,setReading]=useState<'timeline'|'agenda'|'table'>('timeline'),[dayIndex,setDayIndex]=useState(0);
  const [draft,setDraft]=useState<Draft|null>(null),draftRef=useRef(draft);draftRef.current=draft;
  const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[uncertain,setUncertain]=useState(false),uncertainRef=useRef(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[conflict,setConflict]=useState<SchedulerSnapshot|null>(null);
  const request=useRef<AbortController|null>(null),attempt=useRef<Attempt|null>(null),gesture=useRef<Gesture|null>(null),ignoreClick=useRef(false),mounted=useRef(false);
  const host=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),formError=useRef<HTMLParagraphElement>(null),saveButton=useRef<HTMLButtonElement>(null),returnFocus=useRef<HTMLElement|null>(null),eventButtons=useRef(new Map<string,HTMLButtonElement>());
  const owner=useRef({saver:onSave,key:sourceKey});owner.current={saver:onSave,key:sourceKey};
  const afterSave=useRef<{id:string;key:typeof sourceKey;saver:Saver}|null>(null);
  const scopeReady=!draft||draft.key===sourceKey&&draft.saver===onSave;
  const visibleDraft=scopeReady?draft:null,locked=readOnly||!onSave||saving||uncertain;
  const selectedDays=view==='week'?parsed.days:parsed.days.slice(Math.min(dayIndex,Math.max(0,parsed.days.length-1)),Math.min(dayIndex,Math.max(0,parsed.days.length-1))+1);
  const segments=useMemo(()=>schedulerSegments(model.events,selectedDays),[model.events,selectedDays.map(day=>day.date+'|'+day.start+'|'+day.end).join(',')]);
  const visibleIds=new Set(segments.map(segment=>segment.eventId)),visibleEvents=model.events.filter(event=>visibleIds.has(event.id));
  const activeEvent=visibleDraft?.base.events.find(event=>event.id===visibleDraft.change.eventId);
  const changed=!!visibleDraft&&!!activeEvent&&(visibleDraft.change.resourceId!==activeEvent.resourceId||visibleDraft.change.start!==activeEvent.start||visibleDraft.change.end!==activeEvent.end);
  let validation='';if(visibleDraft)try{validateSchedulerChange(model,visibleDraft.change);}catch(cause){validation=cause instanceof Error?cause.message:'Review the proposed change.';}
  const latest=conflict??(visibleDraft&&visibleDraft.base.revision!==model.revision?model:null);
  const dayLabel=(day:SchedulerDay)=>new Intl.DateTimeFormat(locale,{timeZone,weekday:'short',day:'numeric',month:'short'}).format(new Date(day.start));
  const instantLabel=(value:string)=>{try{return getScheduleDay(value,timeZone)+' · '+formatScheduleTime(value,timeZone,locale);}catch{return value;}};
  const resourceLabel=(id:string)=>model.resources.find(resource=>resource.id===id)?.label??id;
  const rangeLabel=(event:Pick<SchedulerEvent,'start'|'end'>)=>instantLabel(event.start)+' → '+instantLabel(event.end);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort();if(gesture.current)finishGesture(true);};},[]);
  useEffect(()=>{
    const unresolved=!!request.current||uncertainRef.current;request.current?.abort();request.current=null;attempt.current=null;if(gesture.current)finishGesture(true);
    setDraft(null);draftRef.current=null;setOpen(false);setSaving(false);setUncertain(false);uncertainRef.current=false;setConflict(null);setError('');setAck(null);
    if(unresolved)setNotice(m('scheduler.previousWrite','A previous service write may have committed. Reconcile it with that service.'));
  },[onSave,sourceKey]);
  useEffect(()=>{if(dayIndex>=parsed.days.length)setDayIndex(Math.max(0,parsed.days.length-1));},[parsed.days.length,dayIndex]);
  function visibleButton(id:string){return [...eventButtons.current.values()].find(node=>node.dataset.schedulerId===id&&node.getClientRects().length>0);}
  useLayoutEffect(()=>{const pending=afterSave.current;if(!pending)return;afterSave.current=null;if(pending.key!==sourceKey||pending.saver!==onSave)return;const target=visibleButton(pending.id)??heading.current;returnFocus.current=target;target?.focus({preventScroll:true});});
  function baseDraft(event:SchedulerEvent):Draft{return {base:model,change:{eventId:event.id,expectedRevision:event.revision,expectedSnapshotRevision:model.revision,resourceId:event.resourceId,start:event.start,end:event.end},key:sourceKey,saver:onSave};}
  function show(event:SchedulerEvent,origin:HTMLElement){
    if(saving)return;if(visibleDraft&&visibleDraft.change.eventId!==event.id){setNotice(m('scheduler.finishDraft','Finish or discard the current change before opening another event.'));return;}
    returnFocus.current=origin;if(!visibleDraft){const next=baseDraft(event);draftRef.current=next;setDraft(next);setError('');setConflict(null);}setOpen(true);
  }
  function propose(event:SchedulerEvent,patch:Partial<Pick<SchedulerChange,'resourceId'|'start'|'end'>>){
    if(locked||parsed.error)return false;const current=draftRef.current;if(current&&current.change.eventId!==event.id){setNotice(m('scheduler.finishDraft','Finish or discard the current change before opening another event.'));return false;}
    const next=current??baseDraft(event),updated={...next,change:{...next.change,...patch}};draftRef.current=updated;setDraft(updated);setError('');setConflict(null);attempt.current=null;return true;
  }
  function discard(){if(saving||uncertainRef.current)return;draftRef.current=null;setDraft(null);setOpen(false);setError('');setConflict(null);attempt.current=null;setNotice(m('scheduler.discarded','Proposal discarded. Saved events are unchanged.'));if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true});}
  function keyboard(event:KeyboardEvent<HTMLButtonElement>,item:SchedulerEvent){
    if(event.key==='Enter'||event.key===' ')ignoreClick.current=false;
    if(event.key==='Escape'&&visibleDraft&&!saving&&!uncertain){event.preventDefault();if(gesture.current)finishGesture(true);else discard();return;}
    if(locked||event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();returnFocus.current=event.currentTarget;
    const current=draftRef.current?.change.eventId===item.id?draftRef.current.change:item;
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){const index=model.resources.findIndex(resource=>resource.id===current.resourceId),next=model.resources[index+(event.key==='ArrowDown'?1:-1)];if(next)propose(item,{resourceId:next.id});return;}
    const delta=(event.key==='ArrowRight'?1:-1)*(direction==='rtl'?-1:1)*step*MINUTE;
    try{if(event.ctrlKey||event.metaKey)propose(item,{start:new Date(schedulerInstant(current.start)+delta).toISOString()});else if(event.shiftKey)propose(item,{end:new Date(schedulerInstant(current.end)+delta).toISOString()});else propose(item,{start:new Date(schedulerInstant(current.start)+delta).toISOString(),end:new Date(schedulerInstant(current.end)+delta).toISOString()});}catch{setError(m('scheduler.invalidMove','The proposed movement is outside supported instants.'));}
  }
  function beginGesture(event:PointerEvent<HTMLElement>,item:SchedulerEvent,day:SchedulerDay,kind:Gesture['kind']){
    if(locked||event.button!==0||!event.isPrimary||parsed.error||gesture.current)return;if(draftRef.current&&draftRef.current.change.eventId!==item.id){setNotice(m('scheduler.finishDraft','Finish or discard the current change before opening another event.'));return;}
    const cell=event.currentTarget.closest<HTMLElement>('[data-scheduler-cell]');if(!cell)return;const box=cell.getBoundingClientRect(),ratio=direction==='rtl'?(box.right-event.clientX)/box.width:(event.clientX-box.left)/box.width;
    const source=draftRef.current?.change.eventId===item.id?{...item,...draftRef.current.change}:item;
    event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);ignoreClick.current=false;returnFocus.current=visibleButton(item.id)??event.currentTarget;returnFocus.current.focus({preventScroll:true});
    gesture.current={pointerId:event.pointerId,target:event.currentTarget,origin:returnFocus.current,kind,event:source,before:draftRef.current,offset:schedulerInstant(day.start)+ratio*(schedulerInstant(day.end)-schedulerInstant(day.start))-schedulerInstant(source.start)};
  }
  function moveGesture(event:PointerEvent<HTMLDivElement>){
    const active=gesture.current;if(!active||active.pointerId!==event.pointerId)return;if(!(event.buttons&1)){finishGesture(true);return;}
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-scheduler-cell]');if(!cell||!host.current?.contains(cell))return;
    const day=selectedDays.find(day=>day.date===cell.dataset.schedulerDay),resourceId=cell.dataset.schedulerResource;if(!day||!resourceId)return;
    const box=cell.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,direction==='rtl'?(box.right-event.clientX)/box.width:(event.clientX-box.left)/box.width));
    const begin=schedulerInstant(day.start),point=begin+snapSchedulerMinutes(ratio*(schedulerInstant(day.end)-begin)/MINUTE,step)*MINUTE;
    const start=active.kind==='move'?begin+snapSchedulerMinutes((point-active.offset-begin)/MINUTE,step)*MINUTE:active.kind==='start'?point:schedulerInstant(active.event.start);
    const end=active.kind==='move'?start+schedulerInstant(active.event.end)-schedulerInstant(active.event.start):active.kind==='end'?point:schedulerInstant(active.event.end);
    if(propose(active.event,{resourceId,start:new Date(start).toISOString(),end:new Date(end).toISOString()}))ignoreClick.current=true;
  }
  function finishGesture(cancelled:boolean){
    const active=gesture.current;if(!active)return;gesture.current=null;if(active.target.hasPointerCapture(active.pointerId))active.target.releasePointerCapture(active.pointerId);
    if(cancelled){draftRef.current=active.before;setDraft(active.before);setNotice(m('scheduler.pointerCancelled','Pointer change cancelled. The previous draft is retained.'));}else if(ignoreClick.current)setOpen(true);
    if(active.origin.isConnected)active.origin.focus({preventScroll:true});
  }
  async function save(){
    const current=draftRef.current;if(!current||!onSave||request.current||readOnly||current.key!==sourceKey||current.saver!==onSave)return;
    if(!changed&&!uncertainRef.current)return;
    if(!uncertainRef.current){try{validateSchedulerChange(model,current.change);}catch(cause){if(model.revision!==current.base.revision)setConflict(model);setError(cause instanceof Error?cause.message:'Review this change.');formError.current?.focus({preventScroll:true});return;}}
    const fingerprint=JSON.stringify(current.change);if(!attempt.current||attempt.current.fingerprint!==fingerprint)attempt.current={draft:current,requestId:crypto.randomUUID(),fingerprint};
    const sent=attempt.current,controller=new AbortController(),saver=onSave,key=sourceKey;request.current=controller;setSaving(true);setError('');
    const live=()=>mounted.current&&!controller.signal.aborted&&request.current===controller&&owner.current.saver===saver&&owner.current.key===key;
    try{
      const result=validateSchedulerSaveResult(await saver(sent.draft.change,{signal:controller.signal,requestId:sent.requestId}),sent.draft.base,sent.draft.change,sent.requestId);if(!live())return;
      uncertainRef.current=false;setUncertain(false);
      if(result.ok){const newer=liveModel.current.revision>result.snapshot.revision;if(!newer)setAck({snapshot:result.snapshot,key,saver});draftRef.current=null;setDraft(null);setOpen(false);setConflict(null);attempt.current=null;setNotice(newer?m('scheduler.savedNewer','The earlier save is confirmed. The newer supplied schedule is retained.'):m('scheduler.saved','Schedule change confirmed.'));afterSave.current={id:result.eventId,key,saver};if(!newer)try{onSnapshotChange?.(result.snapshot);}catch{setNotice(m('scheduler.hostViewFailed','The change was saved, but the host view callback failed. Reload its data.'));}}
      else if(result.code==='conflict'){const snapshot=liveModel.current.revision>result.snapshot.revision?liveModel.current:result.snapshot;setConflict(snapshot);setAck({snapshot,key,saver});setError(m('scheduler.conflict','The schedule changed elsewhere. Compare the latest values; this proposal is kept.'));}
      else {setError(result.message);attempt.current=null;}
    }catch{if(live()){uncertainRef.current=true;setUncertain(true);setError(m('scheduler.uncertain','The save could not be confirmed. It may have committed. Retry the unchanged request to reconcile.'));}}
    finally{if(request.current===controller){request.current=null;setSaving(false);}}
  }
  function stopWaiting(){if(!request.current)return;uncertainRef.current=true;setUncertain(true);request.current.abort();request.current=null;setSaving(false);setError(m('scheduler.stopped','Stopped waiting. The write may have committed; retry the unchanged request.'));requestAnimationFrame(()=>saveButton.current?.focus({preventScroll:true}));}
  function rebase(){
    if(!visibleDraft||!latest||saving||uncertainRef.current)return;const item=latest.events.find(event=>event.id===visibleDraft.change.eventId);if(!item){setError(m('scheduler.removed','This event no longer exists. Discard the proposal.'));return;}
    const next={...visibleDraft,base:latest,change:{...visibleDraft.change,expectedRevision:item.revision,expectedSnapshotRevision:latest.revision}};draftRef.current=next;setDraft(next);setConflict(null);attempt.current=null;setError('');setNotice(m('scheduler.rebased','Latest revisions loaded. Review your retained proposal before saving.'));
  }
  function changeField(patch:Partial<Pick<SchedulerChange,'resourceId'|'start'|'end'>>){if(activeEvent)propose(activeEvent,patch);}
  function changeDay(field:'start'|'end',date:string){
    if(!visibleDraft)return;const next=parsed.days.find(day=>day.date===date);if(!next)return;
    const previous=parsed.days.find(day=>getScheduleDay(new Date(schedulerInstant(visibleDraft.change[field])-(field==='end'?1:0)).toISOString(),timeZone)===day.date),offset=previous?schedulerInstant(visibleDraft.change[field])-schedulerInstant(previous.start):0;
    try{changeField({[field]:new Date(schedulerInstant(next.start)+offset).toISOString()});}catch{setError(m('scheduler.invalidMove','The proposed movement is outside supported instants.'));}
  }
  function selectedDay(value:string,end=false){try{return parsed.days.find(day=>day.date===getScheduleDay(new Date(schedulerInstant(value)-(end?1:0)).toISOString(),timeZone))??parsed.days[0];}catch{return parsed.days[0];}}
  function timeOptions(day:SchedulerDay|undefined,value:string){if(!day)return [];const result:{value:string;label:string}[]=[];for(let time=schedulerInstant(day.start);time<=schedulerInstant(day.end);time+=step*MINUTE){const instant=new Date(time).toISOString();result.push({value:instant,label:formatScheduleTime(instant,timeZone,locale)});}if(!result.some(option=>option.value===value))result.unshift({value,label:instantLabel(value)});return result;}
  let preview:ReturnType<typeof schedulerSegments>=[];if(visibleDraft&&activeEvent)try{preview=schedulerSegments([{...activeEvent,...visibleDraft.change}],selectedDays);}catch{/* Invalid proposals stay in the editor without invalid geometry. */}
  // Keep surrounding layout fixed while a captured pointer previews geometry.
  const proposalDraft=gesture.current?gesture.current.before:visibleDraft,proposalEvent=proposalDraft?.base.events.find(event=>event.id===proposalDraft.change.eventId);
  const proposalChanged=!!proposalDraft&&!!proposalEvent&&(proposalDraft.change.resourceId!==proposalEvent.resourceId||proposalDraft.change.start!==proposalEvent.start||proposalDraft.change.end!==proposalEvent.end);
  let proposalValidation='';if(proposalDraft)try{validateSchedulerChange(model,proposalDraft.change);}catch(cause){proposalValidation=cause instanceof Error?cause.message:'Review the proposed change.';}
  const editable=!readOnly&&!!onSave&&!parsed.error;
  function eventButton(item:SchedulerEvent,day:SchedulerDay|undefined,compact=false){
    const key=JSON.stringify([item.id,compact,day?.date]);return <button type="button" ref={node=>{if(node)eventButtons.current.set(key,node);else eventButtons.current.delete(key);}} data-scheduler-id={item.id} data-scheduler-date={day?.date} className={compact?'bui-resource-scheduler-agenda-event':'bui-resource-scheduler-event-button'} aria-label={m('scheduler.editEvent','Edit {title}',{title:item.title})} aria-describedby={uid+'-keys'} onClick={event=>{if(ignoreClick.current){ignoreClick.current=false;return;}show(item,event.currentTarget);}} onKeyDown={event=>keyboard(event,item)} onPointerDown={day?event=>beginGesture(event,item,day,'move'):undefined}><span>{item.title}</span>{compact&&<small>{resourceLabel(item.resourceId)} · {rangeLabel(item)}</small>}</button>;
  }
  function agenda(){return <ol className="bui-resource-scheduler-agenda">{visibleEvents.map(item=><li key={item.id}>{eventButton(item,undefined,true)}</li>)}</ol>;}
  if(parsed.error)return <Alert tone="danger" title={m('scheduler.invalid','The resource schedule could not be shown')}>{parsed.error}</Alert>;
  return <div ref={host} className={['bui-resource-scheduler',className].filter(Boolean).join(' ')} dir={direction} data-dragging={!!gesture.current||undefined} onPointerMove={moveGesture} onPointerUp={event=>{if(gesture.current?.pointerId===event.pointerId)finishGesture(false);}} onPointerCancel={()=>finishGesture(true)} onLostPointerCapture={()=>{if(gesture.current)finishGesture(true);}} onKeyDown={event=>{if(event.key==='Escape'&&gesture.current){event.preventDefault();finishGesture(true);}}}>
    <header className="bui-resource-scheduler-heading"><div><h3 ref={heading} tabIndex={-1}>{label}</h3><p>{timeZone} · {m('scheduler.snap','{minutes}-minute pointer snapping',{minutes:step})}</p></div><div className="bui-resource-scheduler-controls"><div role="group" aria-label={m('scheduler.period','Schedule period')}><Button size="sm" variant={view==='day'?'secondary':'ghost'} aria-pressed={view==='day'} onClick={()=>setView('day')}>{m('scheduler.day','Day')}</Button><Button size="sm" variant={view==='week'?'secondary':'ghost'} aria-pressed={view==='week'} onClick={()=>setView('week')}>{m('scheduler.week','Week')}</Button></div><div role="group" aria-label={m('scheduler.reading','Schedule reading view')}>{(['timeline','agenda','table'] as const).map(value=><Button key={value} size="sm" aria-pressed={reading===value} variant={reading===value?'secondary':'ghost'} onClick={()=>setReading(value)}>{m('scheduler.'+value,value==='timeline'?'Timeline':value==='agenda'?'Agenda':'Exact table')}</Button>)}</div></div></header>
    {view==='day'&&<div className="bui-resource-scheduler-day-controls"><Button size="sm" variant="ghost" aria-label={m('scheduler.previousDay','Previous supplied day')} disabled={dayIndex<=0} onClick={()=>setDayIndex(index=>index-1)} leadingIcon={direction==='rtl'?ChevronRight:ChevronLeft}/><Select label={m('scheduler.displayedDay','Displayed day')} density="compact" value={selectedDays[0]?.date??null} options={parsed.days.map(day=>({value:day.date,label:dayLabel(day)}))} onValueChange={value=>{if(value)setDayIndex(parsed.days.findIndex(day=>day.date===value));}}/><Button size="sm" variant="ghost" aria-label={m('scheduler.nextDay','Next supplied day')} disabled={dayIndex>=parsed.days.length-1} onClick={()=>setDayIndex(index=>index+1)} leadingIcon={direction==='rtl'?ChevronLeft:ChevronRight}/></div>}
    <p id={uid+'-keys'} className="bui-hint">{m('scheduler.keyboard','Arrow keys move a proposal. Shift + horizontal arrows resize its end; Control or Command resizes its start. Enter opens review. Escape cancels an unsubmitted proposal. No change is saved automatically.')}</p>
    <Reveal open={proposalChanged||uncertain}><div className="bui-resource-scheduler-proposal"><div><strong>{m('scheduler.proposal','Proposed change')}</strong><p>{proposalDraft&&resourceLabel(proposalDraft.change.resourceId)+' · '+rangeLabel(proposalDraft.change)}</p>{proposalValidation&&!uncertain&&<p role="alert" className="bui-error">{proposalValidation}</p>}</div><div><Button size="sm" disabled={saving} onClick={()=>setOpen(true)}>{uncertain?m('scheduler.reconcile','Reconcile save'):m('scheduler.review','Review change')}</Button><Button size="sm" variant="ghost" disabled={saving||uncertain} leadingIcon={RotateCcw} onClick={discard}>{m('scheduler.discard','Discard proposal')}</Button></div></div></Reveal>
    {reading==='timeline'&&<><div className="bui-resource-scheduler-board" role="region" aria-label={m('scheduler.timelineLabel','Resource timeline')} tabIndex={0}><div className="bui-resource-scheduler-grid" style={{gridTemplateColumns:`144px repeat(${selectedDays.length},minmax(${view==='day'?640:240}px,1fr))`}}><div className="bui-resource-scheduler-axis-label">{m('scheduler.resources','Resources')}</div>{selectedDays.map(day=><div key={day.date} className="bui-resource-scheduler-axis"><strong>{dayLabel(day)}</strong><small>{formatScheduleTime(day.start,timeZone,locale)} → {formatScheduleTime(day.end,timeZone,locale)}</small></div>)}{model.resources.map(resource=><div key={resource.id} className="bui-resource-scheduler-row"><div className="bui-resource-scheduler-resource"><strong>{resource.label}</strong><small>{resource.kind?m('scheduler.kind.'+resource.kind,resource.kind):m('scheduler.kind.resource','Resource')}</small></div>{selectedDays.map(day=>{const begin=schedulerInstant(day.start),finish=schedulerInstant(day.end);return <div key={day.date} className="bui-resource-scheduler-cell" data-scheduler-cell="" data-scheduler-resource={resource.id} data-scheduler-day={day.date}>
      {model.availability.filter(slot=>slot.resourceId===resource.id&&schedulerInstant(slot.start)<finish&&schedulerInstant(slot.end)>begin).map(slot=><div key={slot.id} className="bui-resource-scheduler-available" aria-hidden="true" style={{insetInlineStart:(Math.max(begin,schedulerInstant(slot.start))-begin)/(finish-begin)*100+'%',width:(Math.min(finish,schedulerInstant(slot.end))-Math.max(begin,schedulerInstant(slot.start)))/(finish-begin)*100+'%'}}/>)}
      {segments.filter(segment=>segment.resourceId===resource.id&&segment.date===day.date).map(segment=>{const item=model.events.find(event=>event.id===segment.eventId)!;return <div key={item.id} className="bui-resource-scheduler-event" data-scheduler-event={item.id} data-proposed={visibleDraft?.change.eventId===item.id||undefined} style={{insetInlineStart:segment.offset+'%',width:segment.width+'%'}} title={item.title+' · '+rangeLabel(item)}>{eventButton(item,day)}{editable&&!segment.clippedStart&&<span role="presentation" aria-hidden="true" data-disabled={locked||undefined} data-scheduler-resize="start" className="bui-resource-scheduler-resize bui-resource-scheduler-resize--start" onPointerDown={event=>beginGesture(event,item,day,'start')}/>} {editable&&!segment.clippedEnd&&<span role="presentation" aria-hidden="true" data-disabled={locked||undefined} data-scheduler-resize="end" className="bui-resource-scheduler-resize bui-resource-scheduler-resize--end" onPointerDown={event=>beginGesture(event,item,day,'end')}/>}</div>;})}
      {preview.filter(segment=>segment.resourceId===resource.id&&segment.date===day.date).map(segment=><div key={segment.eventId} className="bui-resource-scheduler-preview" data-invalid={!!validation||undefined} aria-hidden="true" style={{insetInlineStart:segment.offset+'%',width:segment.width+'%'}}><Icon icon={GripVertical} size={14}/></div>)}
    </div>;})}</div>)}</div></div><div className="bui-resource-scheduler-mobile-agenda">{agenda()}</div></>}
    {reading==='agenda'&&agenda()}
    {reading==='table'&&<div className="bui-resource-scheduler-table"><table><caption>{m('scheduler.exactTable','Exact supplied schedule intervals')}</caption><thead><tr>{[m('scheduler.event','Event'),m('scheduler.resource','Resource'),m('scheduler.start','Start'),m('scheduler.end','End'),m('scheduler.revision','Revision')].map(title=><th key={title} scope="col">{title}</th>)}</tr></thead><tbody>{visibleEvents.map(item=><tr key={item.id}><th scope="row"><button type="button" onClick={event=>show(item,event.currentTarget)}>{item.title}</button></th><td>{resourceLabel(item.resourceId)}</td><td><time dateTime={item.start}>{instantLabel(item.start)}</time><code>{item.start}</code></td><td><time dateTime={item.end}>{instantLabel(item.end)}</time><code>{item.end}</code></td><td>{item.revision}</td></tr>)}</tbody></table></div>}
    {!visibleEvents.length&&<p className="bui-hint">{m('scheduler.noEvents','No supplied events intersect this view.')}</p>}
    <p role="status" className="bui-resource-scheduler-status">{notice}</p>
    <Dialog title={m('scheduler.reviewEvent','Review scheduled event')} description={m('scheduler.reviewHelp','Choose explicit supplied instants. Resource, availability and overlap are checked before the host receives this proposal.')} open={open&&!!visibleDraft} onOpenChange={value=>{if(!saving)setOpen(value);}} finalFocus={returnFocus}>
      {visibleDraft&&<form className="bui-resource-scheduler-editor" onSubmit={event=>{event.preventDefault();void save();}}><h4>{activeEvent?.title}</h4><Select label={m('scheduler.resource','Resource')} value={visibleDraft.change.resourceId} options={model.resources.map(resource=>({value:resource.id,label:resource.label}))} disabled={locked} onValueChange={value=>{if(value)changeField({resourceId:value});}}/><div className="bui-resource-scheduler-fields"><Select label={m('scheduler.startDay','Start day')} value={selectedDay(visibleDraft.change.start)?.date??null} options={parsed.days.map(day=>({value:day.date,label:dayLabel(day)}))} disabled={locked} onValueChange={value=>{if(value)changeDay('start',value);}}/><Select label={m('scheduler.startTime','Start time')} value={visibleDraft.change.start} options={timeOptions(selectedDay(visibleDraft.change.start),visibleDraft.change.start)} disabled={locked} onValueChange={value=>{if(value)changeField({start:value});}}/><Select label={m('scheduler.endDay','End day')} value={selectedDay(visibleDraft.change.end,true)?.date??null} options={parsed.days.map(day=>({value:day.date,label:dayLabel(day)}))} disabled={locked} onValueChange={value=>{if(value)changeDay('end',value);}}/><Select label={m('scheduler.endTime','End time')} value={visibleDraft.change.end} options={timeOptions(selectedDay(visibleDraft.change.end,true),visibleDraft.change.end)} disabled={locked} onValueChange={value=>{if(value)changeField({end:value});}}/></div><p className="bui-hint">{rangeLabel(visibleDraft.change)}</p><p ref={formError} tabIndex={-1} role={error||validation?'alert':undefined} className="bui-error">{error||(!uncertain?validation:'')}</p>
      {latest&&!uncertain&&<div className="bui-resource-scheduler-conflict"><p>{m('scheduler.latestRevision','Latest schedule revision: {revision}',{revision:latest.revision})}</p><p>{m('scheduler.savedInterval','Latest saved interval')}: {latest.events.find(event=>event.id===visibleDraft.change.eventId)?rangeLabel(latest.events.find(event=>event.id===visibleDraft.change.eventId)!):m('scheduler.eventMissing','Event unavailable')}</p><Button size="sm" variant="secondary" disabled={saving} onClick={rebase}>{m('scheduler.useLatest','Use latest revisions and keep proposal')}</Button></div>}
      <div className="bui-resource-scheduler-editor-actions"><Button variant="secondary" disabled={saving} onClick={()=>setOpen(false)}>{m('scheduler.keepProposal','Keep proposal')}</Button>{saving&&<Button variant="secondary" onClick={stopWaiting}>{m('scheduler.stopWaiting','Stop waiting')}</Button>}{editable&&<Button ref={saveButton} type="submit" loading={saving} leadingIcon={Check} disabled={!uncertain&&(!changed||!!validation)}>{uncertain?m('scheduler.retrySave','Retry unchanged save'):m('scheduler.save','Save change')}</Button>}</div></form>}
    </Dialog>
  </div>;
}
