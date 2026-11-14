/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {Alert,Button,Field,Input,RadioGroup} from './core.js';
import {Fieldset} from './fieldset.js';
import {CheckboxGroup} from './checkbox-group.js';
import {Select} from './controls.js';
import {FormErrorSummary} from './form.js';
import {useUIConfig} from './ui-config.js';
import {parseDateValue} from './date-fields-state.js';
import {parseTimeValue} from './time-options.js';
import {applyRecurrenceChange,expandRecurrence,validateRecurrenceRule,validateRecurrenceSeries,type RecurrenceRule,type RecurrenceSeries,type RecurrenceException,type RecurrenceOccurrence,type RecurrenceChange,type RecurrenceRequest,type RecurrenceSaveResult} from './recurrence-state.js';
export type {RecurrenceRule,RecurrenceSeries,RecurrenceException,RecurrenceOccurrence,RecurrenceChange,RecurrenceRequest,RecurrenceSaveResult} from './recurrence-state.js';
export interface RecurrenceSource {
  save:(request:RecurrenceRequest,context:{signal:AbortSignal})=>Promise<RecurrenceSaveResult>;
  load?:(context:{signal:AbortSignal})=>RecurrenceSeries|Promise<RecurrenceSeries>;
  /** A null receipt is not proof that a request was not applied. */
  receipt?:(requestId:string,context:{signal:AbortSignal})=>Promise<RecurrenceSaveResult|null>;
}
export interface RecurrenceEditorProps {
  series:RecurrenceSeries;source?:RecurrenceSource;onSeriesChange?:(series:RecurrenceSeries)=>void;
  label?:string;readOnly?:boolean;disabled?:boolean;className?:string;
  timeZones?:readonly string[];resources?:readonly {id:string;label:string}[];
  /** At most 24 rows are shown. Expansion is still checked against the full finite rule. */
  previewLimit?:number;
}
interface RuleDraft {frequency:'daily'|'weekly';interval:string;weekdays:string[];startDate:string;time:string;timeZone:string;duration:string;termination:'count'|'until';count:string;until:string;disambiguation:'reject'|'earlier'|'later'}
interface ExceptionDraft {date:string;kind:'skip'|'override';start:string;end:string;resourceId:string}
interface Pending {request:RecurrenceRequest;source:RecurrenceSource;base:RecurrenceSeries;expected:RecurrenceSeries}
interface Conflict {series:RecurrenceSeries;source:RecurrenceSource|undefined;canRebase:boolean;message:string}
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const signature=(series:RecurrenceSeries)=>JSON.stringify({...validateRecurrenceSeries(series),exceptions:[...series.exceptions].sort((a,b)=>a.date.localeCompare(b.date))});
const fromRule=(rule:RecurrenceRule):RuleDraft=>({frequency:rule.frequency,interval:String(rule.interval),weekdays:(rule.weekdays??[1]).map(String),startDate:rule.startDate,time:rule.time,timeZone:rule.timeZone,duration:String(rule.durationMinutes),termination:rule.count!==undefined?'count':'until',count:String(rule.count??6),until:rule.until??rule.startDate,disambiguation:rule.disambiguation});
function baseOccurrences(series:RecurrenceSeries){try{return expandRecurrence({...series,rule:{...series.rule,disambiguation:'earlier'},exceptions:[]});}catch{return [];}}
function fromException(series:RecurrenceSeries,date:string):ExceptionDraft {const existing=series.exceptions.find(item=>item.date===date),occurrence=baseOccurrences(series).find(item=>item.date===date);return {date,kind:existing?.kind??'skip',start:existing?.kind==='override'?existing.start:occurrence?.start??'',end:existing?.kind==='override'?existing.end:occurrence?.end??'',resourceId:existing?.kind==='override'?existing.resourceId??series.resourceId:series.resourceId};}
const fallback:RecurrenceSeries={id:'unavailable-series',revision:1,title:'Unavailable',resourceId:'unavailable-resource',rule:{frequency:'daily',interval:1,startDate:'2026-01-01',time:'09:00',timeZone:'UTC',durationMinutes:30,count:1,disambiguation:'reject'},exceptions:[]};
const integer=(value:string,min:number,max:number)=>/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))&&Number(value)>=min&&Number(value)<=max;

/** Finite, staged recurrence with explicit service receipts and separate edit scopes. */
export function RecurrenceEditor({series,source,onSeriesChange,label='Repeat schedule',readOnly=false,disabled=false,timeZones=[],resources=[],previewLimit=8,className}:RecurrenceEditorProps){
  const {message:m,locale}=useUIConfig(),id=useId(),form=useRef<HTMLFormElement>(null),scopeFocus=useRef<HTMLInputElement>(null);
  let supplied:RecurrenceSeries|null=null,inputError='';try{supplied=validateRecurrenceSeries(series);}catch(error){inputError=error instanceof Error?error.message:'Unsupported series.';}
  const incoming=supplied??fallback,incomingKey=supplied?signature(supplied):'invalid';
  const [base,setBase]=useState(incoming),[draft,setDraft]=useState(()=>fromRule(incoming.rule)),[scope,setScope]=useState<'series'|'occurrence'>('series'),[exception,setException]=useState(()=>fromException(incoming,baseOccurrences(incoming)[0]?.date??incoming.rule.startDate));
  const [phase,setPhase]=useState<'editing'|'saving'|'uncertain'|'checking'|'loading'>('editing'),[attempted,setAttempted]=useState(false),[touched,setTouched]=useState(false),[serviceError,setServiceError]=useState(''),[status,setStatus]=useState(''),[conflict,setConflict]=useState<Conflict|null>(null);
  const pending=useRef<Pending|null>(null),operation=useRef<AbortController|null>(null),running=useRef(false),mounted=useRef(false),baseSource=useRef(source),seen=useRef({key:incomingKey,source}),live=useRef({incoming,source,onSeriesChange});live.current={incoming,source,onSeriesChange};
  const originals=useMemo(()=>baseOccurrences(base),[base]),dates=originals.map(item=>item.date);
  const preview=useMemo(()=>{
    const errors:Record<string,string>={};let change:RecurrenceChange;
    if(scope==='series'){
      if(!integer(draft.interval,1,52))errors.interval=m('recurrence.intervalError','Use an interval from 1 to 52.');
      if(!parseDateValue(draft.startDate))errors.startDate=m('recurrence.dateError','Enter a real date as YYYY-MM-DD.');
      if(parseTimeValue(draft.time)===null)errors.time=m('recurrence.timeError','Enter a time as HH:mm.');
      if(!integer(draft.duration,1,1440))errors.duration=m('recurrence.durationError','Use 1–1,440 elapsed minutes.');
      if(draft.frequency==='weekly'&&!draft.weekdays.length)errors.weekdays=m('recurrence.weekdayError','Choose at least one weekday.');
      if(draft.termination==='count'&&!integer(draft.count,1,366))errors.count=m('recurrence.countError','Use 1–366 base occurrences.');
      if(draft.termination==='until'&&!parseDateValue(draft.until))errors.until=m('recurrence.dateError','Enter a real date as YYYY-MM-DD.');
      if(Object.keys(errors).length)return {errors,error:'',change:null,series:null,occurrences:[] as RecurrenceOccurrence[]};
      try{const rule=validateRecurrenceRule({frequency:draft.frequency,interval:Number(draft.interval),...(draft.frequency==='weekly'?{weekdays:draft.weekdays.map(Number)}:{}),startDate:draft.startDate,time:draft.time,timeZone:draft.timeZone,durationMinutes:Number(draft.duration),...(draft.termination==='count'?{count:Number(draft.count)}:{until:draft.until}),disambiguation:draft.disambiguation});change={seriesId:base.id,expectedRevision:base.revision,scope:'series',rule};}catch(error){const message=error instanceof Error?error.message:'Review the recurrence rule.';errors[/zone/i.test(message)?'timeZone':/end|3,660/i.test(message)?'until':'interval']=message;return {errors,error:'',change:null,series:null,occurrences:[] as RecurrenceOccurrence[]};}
    }else{
      if(!dates.includes(exception.date))errors.occurrence=m('recurrence.occurrenceError','Choose an original occurrence date.');
      const item:RecurrenceException=exception.kind==='skip'?{date:exception.date,kind:'skip'}:{date:exception.date,kind:'override',start:exception.start,end:exception.end,resourceId:exception.resourceId};
      change={seriesId:base.id,expectedRevision:base.revision,scope:'occurrence',exception:item};
    }
    if(Object.keys(errors).length)return {errors,error:'',change:null,series:null,occurrences:[] as RecurrenceOccurrence[]};
    const result=applyRecurrenceChange(base,change);if(!result.ok){if(/local time|repeated|does not exist/i.test(result.message))errors.disambiguation=result.message;else if(scope==='occurrence')errors.overrideStart=result.message;return {errors,error:Object.keys(errors).length?'':result.message,change:null,series:null,occurrences:[] as RecurrenceOccurrence[]};}
    return {errors,error:'',change,series:result.series,occurrences:expandRecurrence(result.series)};
  },[base,draft,scope,exception,m]);
  const dirty=scope==='series'?(preview.change?.scope==='series'?JSON.stringify(preview.change.rule)!==JSON.stringify(base.rule):JSON.stringify(fromRule(base.rule))!==JSON.stringify(draft)):(preview.change?.scope==='occurrence'?JSON.stringify(base.exceptions.find(item=>item.date===exception.date)??null)!==JSON.stringify(preview.change.exception):touched);
  const busy=phase==='saving'||phase==='checking'||phase==='loading',uncertain=phase==='uncertain',locked=disabled||readOnly||busy||uncertain;
  function edit<K extends keyof RuleDraft>(name:K,value:RuleDraft[K]){if(locked)return;setDraft(current=>({...current,[name]:value}));setTouched(true);setServiceError('');setStatus('');}
  function editException<K extends keyof ExceptionDraft>(name:K,value:ExceptionDraft[K]){if(locked)return;setException(current=>({...current,[name]:value}));setTouched(true);setServiceError('');setStatus('');}
  function focusError(errors:Record<string,string>){const first=Object.keys(errors)[0];requestAnimationFrame(()=>{const element=form.current?.querySelector<HTMLElement>('[name="'+first+'"],#'+CSS.escape(id+'-'+first));const target=element?.matches('button,input,select,textarea,[tabindex]')?element:element?.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex]');target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});});}
  function adopt(next:RecurrenceSeries,nextSource:RecurrenceSource|undefined,keepDraft=false){setBase(next);baseSource.current=nextSource;if(!keepDraft){setDraft(fromRule(next.rule));setException(fromException(next,baseOccurrences(next)[0]?.date??next.rule.startDate));setScope('series');}setTouched(keepDraft);setAttempted(false);setServiceError('');setConflict(null);}
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;operation.current?.abort();};},[]);
  useEffect(()=>{
    if(seen.current.key===incomingKey&&seen.current.source===source)return;seen.current={key:incomingKey,source};if(!supplied)return;
    if(signature(incoming)===signature(base)&&source===baseSource.current)return;
    if(pending.current){setConflict({series:incoming,source,canRebase:false,message:m('recurrence.pendingContext','The supplied source or revision changed. Confirm the outstanding request before editing this snapshot.')});return;}
    if(phase==='loading'){operation.current?.abort();running.current=false;setPhase('editing');}
    if(dirty||source!==baseSource.current||incoming.id!==base.id)setConflict({series:incoming,source,canRebase:source===baseSource.current&&incoming.id===base.id,message:m('recurrence.changed','The supplied series changed. Your draft is kept; review the latest revision before applying it.')});else adopt(incoming,source);
  },[incomingKey,source]);
  function cancel(){if(locked||pending.current)return;setDraft(fromRule(base.rule));setException(fromException(base,dates[0]??base.rule.startDate));setScope('series');setTouched(false);setAttempted(false);setServiceError('');setStatus(m('recurrence.cancelled','Draft discarded.'));}
  function notify(next:RecurrenceSeries){try{live.current.onSeriesChange?.(next);}catch{setServiceError(m('recurrence.notifyFailed','The change was confirmed, but the host update callback failed.'));}}
  function validateResult(result:RecurrenceSaveResult,entry:Pending){
    if(!result||typeof result!=='object')throw Error('The source returned no recurrence receipt.');
    if(result.ok){const next=validateRecurrenceSeries(result.series);expandRecurrence(next);if(result.requestId!==entry.request.requestId||signature(next)!==signature(entry.expected))throw Error('The recurrence receipt does not match this request.');return {...result,series:next};}
    if(result.code==='conflict'){const next=validateRecurrenceSeries(result.series);expandRecurrence(next);if(next.id!==entry.base.id)throw Error('The conflict belongs to another series.');return {...result,series:next};}
    if(result.code!=='validation'||typeof result.message!=='string')throw Error('The source returned an unsupported recurrence response.');return result;
  }
  async function transmit(entry:Pending,receiptOnly=false){
    if(running.current)return;running.current=true;const controller=new AbortController();operation.current=controller;setPhase(receiptOnly?'checking':'saving');setServiceError('');
    try{const raw=receiptOnly?await entry.source.receipt!(entry.request.requestId,{signal:controller.signal}):await entry.source.save(clone(entry.request),{signal:controller.signal});if(!mounted.current||controller.signal.aborted)return;
      if(raw===null){setPhase('uncertain');setServiceError(m('recurrence.noReceipt','No receipt is available yet. Retry the same request to confirm its outcome.'));return;}
      const result=validateResult(raw,entry);pending.current=null;
      const contextMatches=live.current.source===entry.source&&live.current.incoming.id===entry.base.id&&live.current.incoming.revision<=(result.ok?result.series.revision:entry.base.revision);
      if(!contextMatches){setPhase('editing');setConflict({series:live.current.incoming,source:live.current.source,canRebase:false,message:m('recurrence.previousConfirmed','The previous request resolved. Load the supplied snapshot before making another change.')});setStatus(result.ok?m('recurrence.confirmedRevision','Confirmed revision {revision}.',{revision:result.series.revision}):result.message);return;}
      if(result.ok){adopt(result.series,entry.source);setStatus(m('recurrence.saved','Change confirmed at revision {revision}.',{revision:result.series.revision}));notify(result.series);}
      else if(result.code==='conflict')setConflict({series:result.series,source:entry.source,canRebase:true,message:result.message});else{setServiceError(result.message);setAttempted(true);}
      setPhase('editing');
    }catch(error){if(!mounted.current)return;setPhase('uncertain');setServiceError((error instanceof Error?error.message:m('recurrence.unknown','The change could not be confirmed.'))+' '+m('recurrence.sameRequest','Its outcome is unknown. Retry or check the same request; editing remains locked.'));}
    finally{if(mounted.current)running.current=false;if(operation.current===controller)operation.current=null;}
  }
  function apply(){if(locked||conflict||pending.current)return;setAttempted(true);if(!preview.change||!preview.series){focusError(preview.errors);return;}if(!dirty)return;
    if(!source){adopt(preview.series,undefined);setStatus(m('recurrence.localApplied','Local snapshot updated. No service request was sent.'));notify(preview.series);return;}
    const entry:Pending={request:{requestId:'rec-'+crypto.randomUUID(),change:clone(preview.change)},source,base:clone(base),expected:clone(preview.series)};pending.current=entry;void transmit(entry);
  }
  async function loadLatest(){if(busy||pending.current)return;const current=live.current,controller=new AbortController();operation.current=controller;running.current=true;setPhase('loading');setServiceError('');
    try{const next=validateRecurrenceSeries(current.source?.load?await current.source.load({signal:controller.signal}):current.incoming);expandRecurrence(next);if(!mounted.current||controller.signal.aborted||live.current.source!==current.source||live.current.incoming.id!==current.incoming.id)return;if(next.id!==current.incoming.id)throw Error('The loaded snapshot belongs to another series.');if(next.revision<Math.max(base.revision,live.current.incoming.revision))throw Error(m('recurrence.staleLoad','The source returned an older series revision. The supplied snapshot is unchanged.'));adopt(next,current.source);setStatus(m('recurrence.loaded','Latest snapshot loaded. The previous draft was discarded.'));notify(next);}catch(error){if(mounted.current&&!controller.signal.aborted)setServiceError(error instanceof Error?error.message:'The latest series could not be loaded.');}finally{if(mounted.current&&!controller.signal.aborted)setPhase('editing');running.current=false;if(operation.current===controller)operation.current=null;}
  }
  if(!supplied)return <Alert title={m('recurrence.unavailable','Recurrence unavailable')} tone="danger">{inputError}</Alert>;
  const zones=[...new Set([draft.timeZone,'UTC','Australia/Melbourne','America/New_York','Europe/London','Asia/Kolkata',...timeZones.slice(0,100)])].filter(Boolean),limit=Math.max(1,Math.min(24,Math.floor(previewLimit)||8));
  const fieldErrors=attempted?preview.errors:{},fieldIds=Object.fromEntries(['interval','weekdays','startDate','time','timeZone','duration','count','until','disambiguation','occurrence','overrideStart'].map(key=>[key,id+'-'+key]));
  const numeric=(field:'interval'|'duration'|'count',text:string)=><Field id={id+'-'+field} label={text} error={fieldErrors[field]}><Input name={field} inputMode="numeric" value={draft[field]} onChange={event=>edit(field,event.target.value)} disabled={busy||uncertain||disabled} readOnly={readOnly} maxLength={4}/></Field>;
  return <section className={'bui-recurrence'+(className?' '+className:'')} aria-label={label} data-phase={phase}>
    <header className="bui-recurrence-heading"><div><h3>{label}</h3><p className="bui-hint">{base.title+' · '+m('recurrence.revision','Revision {revision}',{revision:base.revision})}</p></div><span className="bui-badge">{base.rule.timeZone}</span></header>
    <form ref={form} noValidate onSubmit={event=>{event.preventDefault();apply();}} onKeyDown={event=>{if(event.key==='Escape'&&!event.defaultPrevented&&!locked){event.preventDefault();cancel();requestAnimationFrame(()=>scopeFocus.current?.focus());}}}>
      <FormErrorSummary errors={fieldErrors} error={attempted?preview.error||serviceError:serviceError} fieldIds={fieldIds}/>
      {conflict&&<div className="bui-recurrence-conflict"><Alert title={m('recurrence.reviewLatest','Review the latest snapshot')} tone="warning">{conflict.message}</Alert><div className="bui-recurrence-actions"><Button variant="secondary" disabled={busy||!!pending.current||disabled||readOnly} onClick={()=>void loadLatest()}>{m('recurrence.load','Load latest series')}</Button>{conflict.canRebase&&<Button variant="ghost" disabled={busy||!!pending.current||disabled||readOnly} onClick={()=>{const latest=conflict;adopt(latest.series,latest.source,true);setStatus(m('recurrence.rebased','Draft kept against revision {revision}. Review the preview, then apply.',{revision:latest.series.revision}));}}>{m('recurrence.rebase','Review draft against latest')}</Button>}</div></div>}
      <RadioGroup inputRef={scopeFocus} label={m('recurrence.scope','Edit scope')} value={scope} onValueChange={next=>{if(locked||touched&&dirty)return;setScope(next as 'series'|'occurrence');setAttempted(false);setServiceError('');}} options={[{value:'series',label:m('recurrence.entire','Entire series')},{value:'occurrence',label:m('recurrence.one','One occurrence'),disabled:!dates.length}]} disabled={locked||touched&&dirty}/>
      {scope==='series'?<Fieldset legend={m('recurrence.rule','Repeat rule')} disabled={busy||uncertain||disabled}>
        <div className="bui-recurrence-fields"><Select label={m('recurrence.frequency','Frequency')} value={draft.frequency} onValueChange={value=>{if(value)edit('frequency',value as RuleDraft['frequency']);}} disabled={locked} options={[{value:'daily',label:m('recurrence.daily','Daily')},{value:'weekly',label:m('recurrence.weekly','Weekly')}]}/>{numeric('interval',m('recurrence.every','Repeat every'))}</div>
        {draft.frequency==='weekly'&&<div id={id+'-weekdays'}><CheckboxGroup label={m('recurrence.weekdays','Weekdays')} value={draft.weekdays} onValueChange={value=>edit('weekdays',value)} readOnly={readOnly} error={fieldErrors.weekdays} options={Array.from({length:7},(_,index)=>({value:String(index+1),label:new Intl.DateTimeFormat(locale,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,5+index)))}))}/></div>}
        <div className="bui-recurrence-fields"><Field id={id+'-startDate'} label={m('recurrence.firstDate','First date')} error={fieldErrors.startDate}><Input name="startDate" value={draft.startDate} onChange={event=>edit('startDate',event.target.value)} readOnly={readOnly} placeholder="YYYY-MM-DD" maxLength={10}/></Field><Field id={id+'-time'} label={m('recurrence.wallTime','Local start time')} error={fieldErrors.time}><Input name="time" value={draft.time} onChange={event=>edit('time',event.target.value)} readOnly={readOnly} placeholder="HH:mm" maxLength={5} dir="ltr"/></Field></div>
        <div className="bui-recurrence-fields"><div id={id+'-timeZone'}><Select label={m('recurrence.zone','Time zone')} value={draft.timeZone} onValueChange={value=>edit('timeZone',value??'')} options={zones.map(value=>({value,label:value}))} disabled={locked} error={fieldErrors.timeZone}/></div>{numeric('duration',m('recurrence.duration','Elapsed minutes'))}</div>
        <div id={id+'-disambiguation'}><Select label={m('recurrence.dst','Repeated or missing local times')} value={draft.disambiguation} onValueChange={value=>{if(value)edit('disambiguation',value as RuleDraft['disambiguation']);}} disabled={locked} error={fieldErrors.disambiguation} options={[{value:'reject',label:m('recurrence.reject','Require an explicit correction')},{value:'earlier',label:m('recurrence.earlier','Use the earlier instant')},{value:'later',label:m('recurrence.later','Use the later instant')}]}/></div>
        <div className="bui-recurrence-fields"><Select label={m('recurrence.end','End series')} value={draft.termination} onValueChange={value=>{if(value)edit('termination',value as RuleDraft['termination']);}} disabled={locked} options={[{value:'count',label:m('recurrence.byCount','By occurrence count')},{value:'until',label:m('recurrence.byDate','Through a date')}]}/>{draft.termination==='count'?numeric('count',m('recurrence.count','Base occurrences')):<Field id={id+'-until'} label={m('recurrence.until','Last possible date')} error={fieldErrors.until}><Input name="until" value={draft.until} onChange={event=>edit('until',event.target.value)} readOnly={readOnly} placeholder="YYYY-MM-DD" maxLength={10}/></Field>}</div>
      </Fieldset>:<Fieldset legend={m('recurrence.occurrence','Original occurrence')} disabled={busy||uncertain||disabled}>
        <div id={id+'-occurrence'}><Select label={m('recurrence.original','Original occurrence date')} value={exception.date} onValueChange={value=>{if(value&&!(touched&&dirty))setException(fromException(base,value));}} disabled={locked||touched&&dirty} options={dates.map(value=>({value,label:value}))} error={fieldErrors.occurrence}/></div>
        <Select label={m('recurrence.exceptionAction','Occurrence action')} value={exception.kind} onValueChange={value=>{if(value)editException('kind',value as ExceptionDraft['kind']);}} disabled={locked} options={[{value:'skip',label:m('recurrence.skip','Skip this occurrence')},{value:'override',label:m('recurrence.override','Override this occurrence')}]}/>
        {exception.kind==='override'&&<><div className="bui-recurrence-fields"><Field id={id+'-overrideStart'} label={m('recurrence.overrideStart','Override start instant')} error={fieldErrors.overrideStart}><Input name="overrideStart" value={exception.start} readOnly={readOnly} onChange={event=>editException('start',event.target.value)} placeholder="2026-11-02T00:00:00.000Z" maxLength={50} dir="ltr"/></Field><Field label={m('recurrence.overrideEnd','Override end instant')}><Input value={exception.end} readOnly={readOnly} onChange={event=>editException('end',event.target.value)} maxLength={50} dir="ltr"/></Field></div><Select label={m('recurrence.resource','Override resource')} value={exception.resourceId} onValueChange={value=>editException('resourceId',value??'')} disabled={locked} options={[{value:base.resourceId,label:resources.find(item=>item.id===base.resourceId)?.label??base.resourceId},...resources.filter(item=>item.id!==base.resourceId).slice(0,99).map(item=>({value:item.id,label:item.label}))]}/></>}
      </Fieldset>}
      <div className="bui-recurrence-preview" aria-label={m('recurrence.preview','Occurrence preview')}>
        <div className="bui-recurrence-preview-heading"><h4>{m('recurrence.preview','Occurrence preview')}</h4><span className="bui-hint" data-recurrence-count>{preview.change?m('recurrence.countPreview','{count} occurrences',{count:preview.occurrences.length}):m('recurrence.invalidPreview','Correct the rule to preview')}</span></div>
        {!preview.change?<p className="bui-hint" role="status">{preview.error||Object.values(preview.errors)[0]||m('recurrence.reviewRule','Review the staged rule.')}</p>:<div className="bui-recurrence-table" role="region" tabIndex={0} aria-label={m('recurrence.previewCaption','Exact instants and offsets for the staged recurrence')}><table><caption className="bui-sr-only">{m('recurrence.previewCaption','Exact instants and offsets for the staged recurrence')}</caption><thead><tr>{[m('recurrence.originalDate','Original date'),'UTC '+m('recurrence.start','start'),'UTC '+m('recurrence.finish','end'),m('recurrence.offset','Start offset'),m('recurrence.resource','Resource')].map(text=><th key={text} scope="col">{text}</th>)}</tr></thead><tbody>{preview.occurrences.slice(0,limit).map(item=><tr key={item.id} data-occurrence-date={item.date}><td><bdi>{item.date}</bdi>{item.overridden&&<small>{m('recurrence.overridden','Overridden')}</small>}</td><td><time dateTime={item.start}>{item.start}</time></td><td><time dateTime={item.end}>{item.end}</time></td><td><bdi>{item.offset}</bdi></td><td>{resources.find(resource=>resource.id===item.resourceId)?.label??item.resourceId}</td></tr>)}</tbody></table></div>}
        {preview.occurrences.length>limit&&<p className="bui-hint">{m('recurrence.limited','Showing the first {shown} of {total}; the complete finite rule was checked.',{shown:limit,total:preview.occurrences.length})}</p>}
        <p className="bui-hint">{m('recurrence.policyNote','Counts include skipped base occurrences. Duration is elapsed time; local starts follow the selected zone and DST policy.')}</p>
      </div>
      <div className="bui-recurrence-actions">{uncertain?<><Button disabled={busy||disabled||readOnly} onClick={()=>{if(pending.current)void transmit(pending.current);}}>{m('recurrence.retry','Retry same request')}</Button>{pending.current?.source.receipt&&<Button variant="secondary" disabled={busy||disabled||readOnly} onClick={()=>{if(pending.current)void transmit(pending.current,true);}}>{m('recurrence.receipt','Check request receipt')}</Button>}</>:<><Button type="submit" loading={busy} disabled={readOnly||disabled||!!conflict||!dirty}>{source?m('recurrence.apply','Apply change'):m('recurrence.applyLocal','Apply local change')}</Button><Button variant="secondary" disabled={locked||!dirty} onClick={cancel}>{m('recurrence.cancel','Cancel draft')}</Button></>}{pending.current&&<span className="bui-hint" data-recurrence-request>{pending.current.request.requestId}</span>}</div>
    </form>{status&&<p role="status" className="bui-hint" data-recurrence-status>{status}</p>}
  </section>;
}
