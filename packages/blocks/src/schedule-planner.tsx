'use client';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,RefreshCw} from 'lucide-react';
import {Alert,Button,DatePicker,DayAgenda,Dialog,Field,Input,NumberField,Select,Skeleton,formatDateValue,useReducedMotionPreference} from '@bld8/ui';
import {formatScheduleTime,getScheduleDay,getScheduleStarts,validateScheduleBooking,validateScheduleSnapshot,type ScheduleBooking,type ScheduleBookingResult,type ScheduleEvent,type ScheduleSnapshot,type ScheduleStart} from '@bld8/ui/schedule-state';

export interface SchedulePlannerProps {
  /** Complete bounded availability and appointments. Keep the callback stable. */
  loadSchedule?:(context:{signal:AbortSignal})=>Promise<ScheduleSnapshot>;
  /** Host must authorise and check the revision/overlap atomically. Keep stable. */
  onBook?:(booking:ScheduleBooking,context:{signal:AbortSignal;requestId:string})=>Promise<ScheduleBookingResult>;
  initialTimeZone?:string;
  locale?:string;
  className?:string;
}

/** Deterministic illustrative availability. No calendar service is contacted. */
export function createSampleSchedule():ScheduleSnapshot {
  return {revision:1,slots:[
    {id:'morning-1',start:'2026-11-01T22:00:00.000Z',end:'2026-11-02T01:00:00.000Z'},
    {id:'afternoon-1',start:'2026-11-02T02:00:00.000Z',end:'2026-11-02T05:00:00.000Z'},
    {id:'morning-2',start:'2026-11-02T22:00:00.000Z',end:'2026-11-03T02:00:00.000Z'},
    {id:'morning-3',start:'2026-11-03T22:00:00.000Z',end:'2026-11-04T02:00:00.000Z'},
  ],events:[
    {id:'interface-review',title:'Interface review',start:'2026-11-01T22:30:00.000Z',end:'2026-11-01T23:00:00.000Z',revision:1},
    {id:'project-notes',title:'Project notes',start:'2026-11-02T03:00:00.000Z',end:'2026-11-02T03:30:00.000Z',revision:1},
  ]};
}

function wait(signal:AbortSignal,milliseconds:number) {
  return new Promise<void>((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
    const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},milliseconds);
    signal.addEventListener('abort',cancel,{once:true});
  });
}
export async function loadSampleSchedule({signal}:{signal:AbortSignal}):Promise<ScheduleSnapshot> {await wait(signal,200);return createSampleSchedule();}

type Loader=NonNullable<SchedulePlannerProps['loadSchedule']>;
type Saver=SchedulePlannerProps['onBook'];
type LoadState={loader:Loader;kind:'loading'|'ready'|'error';snapshot:ScheduleSnapshot|null;invalid?:boolean};
type Draft={snapshot:ScheduleSnapshot;loader:Loader;saver:Saver;day:string;timeZone:string;duration:number;start:ScheduleStart;title:string};
const zones=[{value:'Australia/Melbourne',label:'Melbourne'},{value:'UTC',label:'UTC'},{value:'America/New_York',label:'New York'},{value:'Europe/London',label:'London'}];
function asDate(day:string):Date|undefined {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return undefined;
  const [year,month,date]=day.split('-').map(Number),result=new Date(0);
  if(year<1||year>9999)return undefined;
  result.setFullYear(year,month-1,date);result.setHours(0,0,0,0);return result.getFullYear()===year&&result.getMonth()===month-1&&result.getDate()===date?result:undefined;
}
function moveDay(day:string,direction:number) {
  const value=new Date(day+'T12:00:00.000Z');value.setUTCDate(value.getUTCDate()+direction);
  return value.toISOString().slice(0,10);
}
function sourceDays(snapshot:ScheduleSnapshot,timeZone:string) {
  return [...new Set([...snapshot.slots,...snapshot.events].flatMap(item=>[getScheduleDay(item.start,timeZone),getScheduleDay(new Date(Date.parse(item.end)-1).toISOString(),timeZone)]))].sort();
}
function displayInstant(instant:string,timeZone:string,locale:string) {
  try{return getScheduleDay(instant,timeZone)+' · '+formatScheduleTime(instant,timeZone,locale);}
  catch{return instant;}
}

export function SchedulePlanner({loadSchedule,onBook,initialTimeZone='Australia/Melbourne',locale='en-AU',className}:SchedulePlannerProps) {
  const loader=loadSchedule??loadSampleSchedule;
  const [timeZone,setTimeZone]=useState(initialTimeZone),[day,setDay]=useState('2026-11-02'),[duration,setDuration]=useState<number|null>(30);
  const [state,setState]=useState<LoadState>(()=>({loader,kind:'loading',snapshot:null})),[reload,setReload]=useState(0);
  const [draft,setDraft]=useState<Draft|null>(null),[bookingOpen,setBookingOpen]=useState(false),[saving,setSaving]=useState(false);
  const [titleError,setTitleError]=useState(''),[saveError,setSaveError]=useState(''),[notice,setNotice]=useState(''),[needsReload,setNeedsReload]=useState(false);
  const [viewEvent,setViewEvent]=useState<ScheduleEvent|null>(null),[eventOpen,setEventOpen]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null),titleField=useRef<HTMLInputElement>(null),returnFocus=useRef<HTMLElement|null>(null),retryOrigin=useRef<HTMLElement|null>(null);
  const mounted=useRef(false),loadId=useRef(0),currentLoader=useRef(loader),currentSaver=useRef(onBook),currentZone=useRef(timeZone);
  currentLoader.current=loader;currentSaver.current=onBook;currentZone.current=timeZone;
  const records=useRef<ScheduleSnapshot|null>(null),request=useRef<AbortController|null>(null),attempt=useRef<{key:string;id:string}|null>(null);
  const reduced=useReducedMotionPreference();
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort();};},[]);
  useEffect(()=>{
    const controller=new AbortController(),owner=++loadId.current;
    const current=()=>mounted.current&&!controller.signal.aborted&&owner===loadId.current&&currentLoader.current===loader;
    request.current?.abort();request.current=null;records.current=null;setSaving(false);setNotice('');setNeedsReload(false);setEventOpen(false);
    setState({loader,kind:'loading',snapshot:null});
    Promise.resolve().then(()=>current()?loader({signal:controller.signal}):null).then(value=>{
      if(!current())return;
      try{const snapshot=validateScheduleSnapshot(value);records.current=snapshot;setState({loader,kind:'ready',snapshot});
        try{const days=sourceDays(snapshot,currentZone.current);setDay(previous=>days.length&&(!previous||previous<days[0]||previous>days.at(-1)!)?days[0]:previous);}catch{}
      }catch{setState({loader,kind:'error',snapshot:null,invalid:true});}
    },()=>{if(current())setState({loader,kind:'error',snapshot:null});});
    return()=>controller.abort();
  },[loader,reload]);
  useEffect(()=>{
    const pending=request.current;if(!pending)return;
    pending.abort();request.current=null;setSaving(false);setSaveError('The booking connection changed. Close this draft and choose a current time.');
  },[onBook]);
  useEffect(()=>{
    const origin=retryOrigin.current;retryOrigin.current=null;if(!origin)return;
    const active=origin.ownerDocument.activeElement;
    if(active===origin||active===origin.ownerDocument.body&&!origin.isConnected)heading.current?.focus({preventScroll:true});
  },[reload]);
  useEffect(()=>{
    if(bookingOpen||!draft)return;
    if(returnFocus.current?.isConnected&&!returnFocus.current.matches(':disabled'))return;
    returnFocus.current=heading.current;
    if(document.activeElement===document.body||document.activeElement?.closest('.bui-dialog'))heading.current?.focus({preventScroll:true});
  },[bookingOpen,draft]);

  const ready=state.loader===loader&&state.kind==='ready',loading=state.loader!==loader||state.kind==='loading';
  const snapshot=ready?state.snapshot:null;
  const durationValid=duration!==null&&Number.isInteger(duration)&&duration>=15&&duration<=120&&duration%15===0;
  const configuration=useMemo(()=>{try{new Intl.DateTimeFormat(locale,{timeZone}).format(0);return '';}catch{return 'Choose a supported time zone and display locale.';}},[locale,timeZone]);
  const days=useMemo(()=>{if(!snapshot||configuration)return [];try{return sourceDays(snapshot,timeZone);}catch{return [];}},[snapshot,timeZone,configuration]);
  const zoneOptions=useMemo(()=>zones.some(zone=>zone.value===timeZone)?zones:[...zones,{value:timeZone,label:timeZone}],[timeZone]);
  const staleDraft=!!draft&&(draft.loader!==loader||draft.saver!==onBook||!ready||snapshot?.revision!==draft.snapshot.revision);
  const atCapacity=!!snapshot&&snapshot.events.length>=500;
  const draftStarts=useMemo(()=>{if(!draft)return [];try{return getScheduleStarts(draft.snapshot,draft.day,draft.timeZone,draft.duration);}catch{return [];}},[draft?.snapshot,draft?.day,draft?.timeZone,draft?.duration]);
  const draftOptions=useMemo(()=>draftStarts.map(start=>({value:start.start,label:formatScheduleTime(start.start,draft!.timeZone,configuration?'en-AU':locale)+' – '+(getScheduleDay(start.end,draft!.timeZone)!==draft!.day?getScheduleDay(start.end,draft!.timeZone)+' · ':'')+formatScheduleTime(start.end,draft!.timeZone,configuration?'en-AU':locale)})),[draftStarts,draft?.timeZone,locale,configuration]);
  useEffect(()=>{if(saveError&&!saving&&bookingOpen&&!staleDraft)titleField.current?.focus();},[saveError,saving,bookingOpen,staleDraft]);

  function chooseStart(start:ScheduleStart) {
    if(!snapshot||!durationValid||needsReload||atCapacity)return;
    returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:heading.current;
    setDraft({snapshot,loader,saver:onBook,day,timeZone,duration:duration!,start,title:''});
    setTitleError('');setSaveError('');attempt.current=null;setBookingOpen(true);
  }
  function closeBooking(open:boolean) {
    if(!open&&request.current){request.current.abort();request.current=null;setSaving(false);
      if(draft?.saver){returnFocus.current=heading.current;setNeedsReload(true);setNotice('Booking request cancelled. Reload the schedule to check its result before booking again.');}
      else setNotice('Booking cancelled. No local changes were saved.');
    }
    if(!open&&!returnFocus.current?.isConnected)returnFocus.current=heading.current;
    setBookingOpen(open);
  }
  async function book(event:FormEvent) {
    event.preventDefault();if(!draft||request.current)return;
    const captured=draft,title=captured.title.trim();
    if(title.length<3||title.length>120){setTitleError('Use a title between 3 and 120 characters.');titleField.current?.focus();return;}
    const previous=records.current;
    if(staleDraft||!previous||previous.revision!==captured.snapshot.revision){setSaveError('The schedule changed. Close this draft and choose a current time.');return;}
    const booking:ScheduleBooking={...captured.start,title,expectedRevision:previous.revision};
    try{validateScheduleBooking(previous,booking);}catch{setSaveError('This time is no longer available. Close this draft and reload the schedule.');return;}
    const controller=new AbortController(),owner=loadId.current,saver=onBook;
    const key=JSON.stringify(booking);if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()};
    request.current=controller;setSaving(true);setSaveError('');setTitleError('');
    const current=()=>mounted.current&&!controller.signal.aborted&&request.current===controller&&owner===loadId.current&&currentLoader.current===captured.loader&&currentSaver.current===saver;
    try{
      let response:unknown;
      if(saver)response=await saver({...booking},{signal:controller.signal,requestId:attempt.current.id});
      else{await wait(controller.signal,300);const created:ScheduleEvent={id:'appointment-'+crypto.randomUUID(),title,start:booking.start,end:booking.end,revision:1};response={snapshot:{revision:previous.revision+1,slots:previous.slots,events:[...previous.events,created]},eventId:created.id};}
      if(!current())return;
      if(!response||typeof response!=='object'||!('snapshot' in response)||!('eventId' in response)||typeof response.eventId!=='string')throw new Error('Invalid booking result');
      const next=validateScheduleSnapshot(response.snapshot),created=next.events.find(event=>event.id===response.eventId);
      if(next.revision<=previous.revision||!created||previous.events.some(event=>event.id===created.id)||created.title!==title||created.start!==booking.start||created.end!==booking.end||records.current?.revision!==previous.revision)throw new Error('Invalid booking result');
      records.current=next;setState({loader:captured.loader,kind:'ready',snapshot:next});request.current=null;setSaving(false);closeBooking(false);setNotice(title+' booked.');attempt.current=null;
    }catch{if(current())setSaveError('The booking could not be confirmed. Your draft is still here; try again or reload the schedule.');}
    finally{if(request.current===controller){request.current=null;if(mounted.current)setSaving(false);}}
  }
  function changeZone(value:string|null) {
    if(!value)return;setTimeZone(value);setNotice('');
    if(snapshot)try{const next=sourceDays(snapshot,value);if(next.length)setDay(next[0]);}catch{}
  }
  function inspect(event:ScheduleEvent) {returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:heading.current;setViewEvent(event);setEventOpen(true);}
  const canChoose=ready&&!configuration&&durationValid&&!needsReload&&!atCapacity;
  return <section className={'bblocks-panel bblocks-schedule-planner'+(className?' '+className:'')} aria-label="Schedule planner" data-reduced-motion={!!reduced}>
    <header className="bblocks-heading"><div><p className="bblocks-kicker">A LITTLE ROOM IN THE DAY</p><h2 ref={heading} tabIndex={-1}>Make time for the next thing.</h2><p className="bblocks-muted">{loadSchedule?(onBook?'Supplied availability and appointments.':'Loaded availability. Bookings stay in this page.'):'Sample availability. Changes last for this session.'}</p></div><Button variant="secondary" leadingIcon={RefreshCw} disabled={loading||saving||bookingOpen||eventOpen} onClick={()=>setReload(value=>value+1)}>Reload schedule</Button></header>
    <div className="bblocks-schedule-controls"><DatePicker label="Agenda date" name="agendaDate" value={asDate(day)??null} onValueChange={value=>{setDay(formatDateValue(value??undefined));setNotice('');}} minDate={asDate(days[0]??'')} maxDate={asDate(days.at(-1)??'')} defaultMonth={asDate(day)} formatLocale={configuration?'en-AU':locale}/><Select label="Time zone" value={timeZone} options={zoneOptions} onValueChange={changeZone}/><NumberField label="Duration in minutes" value={duration} onValueChange={value=>{setDuration(value);setNotice('');}} min={15} max={120} step={15} smallStep={15} largeStep={30} locale={configuration?'en-AU':locale} allowOutOfRange hint="15–120 minutes, in 15-minute steps" error={!durationValid?'Choose 15–120 minutes in steps of 15.':undefined}/></div>
    <div className="bblocks-schedule-navigation" role="group" aria-label="Agenda navigation"><Button variant="ghost" size="sm" leadingIcon={ChevronLeft} disabled={!day||day<='0001-01-01'||!!configuration||!!days.length&&day<=days[0]} onClick={()=>{setDay(moveDay(day,-1));setNotice('');}}>Previous day</Button><p className="bui-hint">Times are shown in {timeZone}.</p><Button variant="ghost" size="sm" trailingIcon={ChevronRight} disabled={!day||day>='9999-12-31'||!!configuration||!!days.length&&day>=days.at(-1)!} onClick={()=>{setDay(moveDay(day,1));setNotice('');}}>Next day</Button></div>
    {configuration&&<Alert title="Review the display settings" tone="danger" live>{configuration}</Alert>}
    {needsReload&&<Alert title="Check the schedule before continuing" tone="neutral" live>Reload the schedule to check the cancelled booking.</Alert>}
    {atCapacity&&<Alert title="This view has reached its appointment limit" tone="neutral">Load a smaller date range before adding another appointment.</Alert>}
    <div className="bblocks-schedule-stage" aria-busy={loading||undefined}>
      {loading?<div className="bblocks-schedule-loading"><p className="bui-hint" role="status">Loading schedule…</p>{[0,1,2,3].map(item=><Skeleton key={item} height="3.5rem"/>)}</div>:!ready?<div className="bblocks-schedule-recovery"><Alert title={state.invalid?'The schedule could not be read':'The schedule could not be loaded'} tone="danger" live>{state.invalid?'Review the supplied availability and appointments, then try again.':'The connection is unavailable. Your view settings are kept.'}</Alert><Button variant="secondary" leadingIcon={RefreshCw} onClick={event=>{retryOrigin.current=event.currentTarget;setReload(value=>value+1);}}>Retry loading schedule</Button></div>:snapshot&&!configuration&&durationValid?<DayAgenda label="Day agenda" day={day} timeZone={timeZone} locale={locale} snapshot={snapshot} durationMinutes={duration!} selectedStart={bookingOpen?draft?.start.start:null} disabled={saving} onSelectStart={canChoose?chooseStart:undefined} onEventAction={inspect}/>:!configuration&&<p className="bui-hint">Choose a valid duration to see the available times.</p>}
    </div>
    <footer className="bblocks-schedule-footer"><span><CalendarDays size={16} aria-hidden="true"/>Choose a time to review the details.</span><p role="status" aria-live="polite">{notice}</p></footer>
    <Dialog title="Book a time" description="Review the appointment before booking. Your draft stays here until it is saved." open={bookingOpen} onOpenChange={closeBooking} initialFocus={titleField} finalFocus={returnFocus}>
      {draft&&<form className="bblocks-schedule-booking" onSubmit={book} noValidate><Field label="Appointment title" error={titleError} required><Input ref={titleField} value={draft.title} maxLength={120} disabled={saving||staleDraft} onChange={event=>{setDraft(previous=>previous?{...previous,title:event.target.value}:previous);setTitleError('');setSaveError('');attempt.current=null;}}/></Field><Select label="Appointment time" value={draft.start.start} options={draftOptions} disabled={saving||staleDraft} onValueChange={value=>{const start=draftStarts.find(item=>item.start===value);if(start){setDraft(previous=>previous?{...previous,start}:previous);setSaveError('');attempt.current=null;}}}/><dl className="bblocks-schedule-review"><div><dt>Date</dt><dd>{draft.day}</dd></div>{getScheduleDay(draft.start.end,draft.timeZone)!==draft.day&&<div><dt>Ends</dt><dd><time dateTime={draft.start.end}>{displayInstant(draft.start.end,draft.timeZone,configuration?'en-AU':locale)}</time></dd></div>}<div><dt>Time zone</dt><dd>{draft.timeZone}</dd></div><div><dt>Duration</dt><dd>{draft.duration} minutes</dd></div></dl>{(saveError||staleDraft)&&<Alert title="Booking could not be confirmed" tone="danger" live>{staleDraft?'The schedule connection or revision changed. Close this draft and choose a current time.':saveError}</Alert>}<div className="bblocks-schedule-booking-actions"><Button variant="secondary" onClick={()=>closeBooking(false)}>{saving?'Cancel request':'Cancel'}</Button><Button type="submit" loading={saving} disabled={staleDraft}>Book appointment</Button></div></form>}
    </Dialog>
    <Dialog title="Appointment details" description="An appointment in the loaded schedule." open={eventOpen} onOpenChange={setEventOpen} finalFocus={returnFocus}>{viewEvent&&<div className="bblocks-schedule-booking"><h3 className="bblocks-schedule-event-title">{viewEvent.title}</h3><dl className="bblocks-schedule-review"><div><dt>Start</dt><dd><time dateTime={viewEvent.start}>{displayInstant(viewEvent.start,timeZone,locale)}</time></dd></div><div><dt>End</dt><dd><time dateTime={viewEvent.end}>{displayInstant(viewEvent.end,timeZone,locale)}</time></dd></div><div><dt>Time zone</dt><dd>{timeZone}</dd></div></dl><Button variant="secondary" onClick={()=>setEventOpen(false)}>Close details</Button></div>}</Dialog>
  </section>;
}
