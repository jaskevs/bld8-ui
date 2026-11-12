/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {Alert,Button,Dialog,EventCalendar,Select,formatCalendarTime,getCalendarRange,getScheduleDay,validateCalendarEvents,type CalendarEvent,type CalendarRange,type CalendarView} from '@bld8/ui';

export interface CalendarLoadContext {range:CalendarRange;timeZone:string;signal:AbortSignal}
export interface CalendarWorkspaceProps {
  /** Supply a complete bounded set for this calendar-date range and IANA zone. */
  loadEvents?:(context:CalendarLoadContext)=>Promise<readonly CalendarEvent[]>;
  initialDate?:string;
  initialView?:CalendarView;
  initialTimeZone?:string;
  locale?:string;
  className?:string;
}

/** Authored sample events, including overlap and a multi-day reference window. */
export function createSampleCalendarEvents():CalendarEvent[]{return [
  {id:'interface-review',title:'Interface review',start:'2026-11-02T00:00:00.000Z',end:'2026-11-02T01:00:00.000Z'},
  {id:'build-review',title:'Build review',start:'2026-11-02T00:30:00.000Z',end:'2026-11-02T01:30:00.000Z'},
  {id:'release-window',title:'Release window',start:'2026-11-03T22:00:00.000Z',end:'2026-11-05T01:00:00.000Z'},
  {id:'documentation-review',title:'Documentation review',start:'2026-11-09T22:00:00.000Z',end:'2026-11-09T23:00:00.000Z'},
  {id:'keyboard-review',title:'Keyboard review',start:'2026-11-16T02:00:00.000Z',end:'2026-11-16T03:00:00.000Z'},
];}
export async function loadSampleCalendarEvents({range,timeZone,signal}:CalendarLoadContext):Promise<CalendarEvent[]>{
  signal.throwIfAborted();
  return createSampleCalendarEvents().filter(event=>getScheduleDay(event.start,timeZone)<range.endDayExclusive&&getScheduleDay(new Date(Date.parse(event.end)-1).toISOString(),timeZone)>=range.startDay);
}

type Loader=NonNullable<CalendarWorkspaceProps['loadEvents']>;
type LoadState={key:string;loader:Loader;events:CalendarEvent[];kind:'loading'|'ready'|'error';invalid?:boolean};

/** Range loading and inspection. Record creation and persistence remain with the host. */
export function CalendarWorkspace({loadEvents,initialDate='2026-11-02',initialView='month',initialTimeZone='Australia/Melbourne',locale='en-AU',className}:CalendarWorkspaceProps){
  const loader=loadEvents??loadSampleCalendarEvents;
  const [date,setDate]=useState(initialDate),[view,setView]=useState<CalendarView>(initialView),[timeZone,setTimeZone]=useState(initialTimeZone),[selectedDate,setSelectedDate]=useState(initialDate),[reload,setReload]=useState(0),[open,setOpen]=useState(false),[event,setEvent]=useState<CalendarEvent|null>(null);
  const currentLoader=useRef(loader),sequence=useRef(0),mounted=useRef(false),returnFocus=useRef<HTMLElement|null>(null),heading=useRef<HTMLHeadingElement>(null),detailsContent=useRef<HTMLDivElement>(null),currentKey=useRef('');currentLoader.current=loader;
  const range=useMemo(()=>{try{return getCalendarRange(date,view);}catch{return null;}},[date,view]);
  const key=(range?range.startDay+'|'+range.endDayExclusive:'invalid')+'|'+timeZone;
  currentKey.current=key;
  const [state,setState]=useState<LoadState>(()=>({key,loader,events:[],kind:'loading'}));
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;sequence.current++;};},[]);
  useEffect(()=>{
    const owner=++sequence.current,controller=new AbortController(),matches=()=>mounted.current&&!controller.signal.aborted&&sequence.current===owner&&currentLoader.current===loader&&currentKey.current===key;
    if(open){const active=document.activeElement,dialog=detailsContent.current?.closest('[role=dialog]');returnFocus.current=active===document.body||dialog?.contains(active)?heading.current:active instanceof HTMLElement?active:heading.current;}
    setOpen(false);setState({key,loader,events:[],kind:'loading'});
    if(!range){setState({key,loader,events:[],kind:'error',invalid:true});return()=>controller.abort();}
    try{getScheduleDay(date+'T12:00:00.000Z',timeZone);}catch{setState({key,loader,events:[],kind:'error',invalid:true});return()=>controller.abort();}
    Promise.resolve().then(()=>matches()?loader({range,timeZone,signal:controller.signal}):null).then(value=>{
      if(!matches())return;
      try{const events=validateCalendarEvents(value);setState({key,loader,events,kind:'ready'});}catch{setState({key,loader,events:[],kind:'error',invalid:true});}
    },()=>{if(matches())setState({key,loader,events:[],kind:'error'});});
    return()=>controller.abort();
  },[loader,key,reload]);
  const ready=state.key===key&&state.loader===loader&&state.kind==='ready',loading=state.key!==key||state.loader!==loader||state.kind==='loading';
  const changeDate=useCallback((next:string)=>{setDate(next);setSelectedDate(next);},[]);
  function inspect(next:CalendarEvent){returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setEvent(next);setOpen(true);}
  function formatInstant(value:string){try{return getScheduleDay(value,timeZone)+' · '+formatCalendarTime(value,timeZone,locale);}catch{return value+' (UTC)';}}
  const zoneOptions=[{value:'Australia/Melbourne',label:'Melbourne'},{value:'UTC',label:'UTC'},{value:'America/New_York',label:'New York'}];
  if(!zoneOptions.some(option=>option.value===timeZone))zoneOptions.push({value:timeZone,label:timeZone});
  return <section className={['bblocks-panel','bblocks-calendar',className].filter(Boolean).join(' ')} aria-label="Calendar workspace">
    <header className="bblocks-heading"><div><p className="bblocks-kicker">A LITTLE MORE ROOM IN THE WEEK</p><h2 ref={heading} tabIndex={-1}>Keep the dates in view.</h2><p className="bblocks-muted">{loadEvents?'Loaded events, shown in the selected time zone.':'Authored sample events for November 2026. Changes last for this session.'}</p></div><Button variant="secondary" leadingIcon={RefreshCw} onClick={()=>setReload(value=>value+1)}>Reload events</Button></header>
    <div className="bblocks-calendar-zone"><Select label="Calendar time zone" value={timeZone} options={zoneOptions} onValueChange={value=>{if(value)setTimeZone(value);}}/></div>
    {!loading&&!ready&&state.invalid&&<Alert title="The calendar data needs attention" tone="danger" live>Review the event records, date and time zone.</Alert>}
    <EventCalendar label="Workspace calendar" date={date} view={view} onDateChange={changeDate} onViewChange={next=>{setView(next);setSelectedDate(date);}} selectedDate={selectedDate} onDateSelect={setSelectedDate} events={ready?state.events:[]} timeZone={timeZone} locale={locale} onEventAction={inspect} loading={loading} error={!loading&&!ready?(state.invalid?'The event response could not be read.':'The connection is unavailable. Your view settings are kept.'):undefined} onRetry={()=>setReload(value=>value+1)}/>
    <p className="bui-hint bblocks-calendar-caption">Week and month views display supplied UTC events. This example does not create bookings or store changes.</p>
    <Dialog title="Calendar event details" description="An event in the loaded calendar range." open={open} onOpenChange={setOpen} finalFocus={returnFocus}>{event&&<div ref={detailsContent} className="bblocks-calendar-details"><h3>{event.title}</h3><dl><div><dt>Start</dt><dd><time dateTime={event.start}>{formatInstant(event.start)}</time></dd></div><div><dt>End</dt><dd><time dateTime={event.end}>{formatInstant(event.end)}</time></dd></div><div><dt>Time zone</dt><dd>{timeZone}</dd></div></dl><Button variant="secondary" onClick={()=>setOpen(false)}>Close details</Button></div>}</Dialog>
  </section>;
}
