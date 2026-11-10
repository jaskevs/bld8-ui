'use client';
import {useId,useLayoutEffect,useMemo,useRef,useState,type KeyboardEvent} from 'react';
import {ChevronLeft,ChevronRight,ArrowUpRight} from 'lucide-react';
import {Alert,Button,Icon,IconButton,Skeleton} from './core.js';
import {useControllableValue} from './state.js';
import {useReducedMotionPreference} from './motion-preference.js';
import {getScheduleDay} from './schedule-state.js';
import {formatCalendarTime,getCalendarDays,getCalendarRange,shiftCalendarDate,validateCalendarEvents,type CalendarEvent,type CalendarView} from './calendar-state.js';

export interface EventCalendarProps {
  label:string;
  /** Calendar date in the chosen zone. Supplying it keeps server rendering deterministic. */
  date:string;
  events:readonly CalendarEvent[];
  timeZone:string;
  view?:CalendarView;
  defaultView?:CalendarView;
  onDateChange?:(date:string)=>void;
  onViewChange?:(view:CalendarView)=>void;
  selectedDate?:string;
  defaultSelectedDate?:string;
  onDateSelect?:(date:string)=>void;
  onEventAction?:(event:CalendarEvent)=>void;
  locale?:string;
  /** Sunday = 0, Monday = 1. */
  weekStartsOn?:number;
  /** Optional calendar-date marker supplied by the host; no clock is read during rendering. */
  today?:string;
  loading?:boolean;
  error?:string;
  onRetry?:()=>void;
  disabled?:boolean;
}

function formatDate(day:string,locale:string,options:Intl.DateTimeFormatOptions){return new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC',calendar:'gregory'}).format(new Date(day+'T12:00:00.000Z'));}

/** A bounded calendar over supplied events. It does not convert local wall-clock values or save records. */
export function EventCalendar({label,date,events,timeZone,view,defaultView='month',onDateChange,onViewChange,selectedDate,defaultSelectedDate,onDateSelect,onEventAction,locale='en-AU',weekStartsOn=1,today,loading=false,error,onRetry,disabled=false}:EventCalendarProps){
  const id=useId(),root=useRef<HTMLElement>(null),content=useRef<HTMLDivElement>(null),buttons=useRef(new Map<string,HTMLButtonElement>()),focusIntent=useRef<string|null>(null),focusOrigin=useRef<HTMLElement|null>(null),retryOrigin=useRef<HTMLElement|null>(null),agendaHeading=useRef<HTMLHeadingElement>(null);
  const reduced=!!useReducedMotionPreference();
  const [activeView,setView]=useControllableValue(view,defaultView,onViewChange),[selected,setSelected]=useControllableValue(selectedDate,defaultSelectedDate??date,onDateSelect);
  const [focused,setFocused]=useState(defaultSelectedDate??selectedDate??date),[contentHeight,setContentHeight]=useState<number>();
  const projected=useMemo(()=>{
    try{
      getScheduleDay('2000-01-01T12:00:00.000Z',timeZone);
      const records=loading||error?[]:validateCalendarEvents(events);
      return records.map(event=>({event,startDay:getScheduleDay(event.start,timeZone),lastDay:getScheduleDay(new Date(Date.parse(event.end)-1).toISOString(),timeZone)})).sort((a,b)=>a.event.start.localeCompare(b.event.start)||a.event.id.localeCompare(b.event.id));
    }catch{return null;}
  },[events,timeZone,loading,error]);
  let selectionValid=true;
  try{if(selected)shiftCalendarDate(selected,0,'day');}catch{selectionValid=false;}
  const model=useMemo(()=>{
    try{
      if(!selectionValid||!projected||typeof locale!=='string'||!locale.trim()||locale.length>100)throw new Error();
      const range=getCalendarRange(date,activeView,weekStartsOn),days=getCalendarDays(range);
      if(today)shiftCalendarDate(today,0,'day');
      const byDay=new Map(days.map(day=>[day,projected.filter(item=>item.startDay<=day&&item.lastDay>=day).map(item=>item.event)]));
      const fullFormatter=new Intl.DateTimeFormat(locale,{timeZone:'UTC',calendar:'gregory',weekday:'long',day:'numeric',month:'long',year:'numeric'}),weekdayFormatter=new Intl.DateTimeFormat(locale,{timeZone:'UTC',calendar:'gregory',weekday:'short'});
      const labels=new Map(days.map(day=>[day,fullFormatter.format(new Date(day+'T12:00:00.000Z'))]));
      const numberFormatter=new Intl.NumberFormat(locale,{useGrouping:false}),dayNumbers=new Map(days.map(day=>[day,numberFormatter.format(Number(day.slice(8)))]));
      const title=activeView==='month'?formatDate(date,locale,{month:'long',year:'numeric'}):formatDate(days[0],locale,{day:'numeric',month:'short',year:'numeric'})+' \u2013 '+formatDate(days[6],locale,{day:'numeric',month:'short',year:'numeric'});
      const full=(day:string)=>labels.get(day)??fullFormatter.format(new Date(day+'T12:00:00.000Z'));
      let previous:string|undefined,next:string|undefined;
      try{previous=shiftCalendarDate(date,-1,activeView);getCalendarRange(previous,activeView,weekStartsOn);}catch{previous=undefined;}
      try{next=shiftCalendarDate(date,1,activeView);getCalendarRange(next,activeView,weekStartsOn);}catch{next=undefined;}
      return {range,days,byDay,title,full,dayNumbers,previous,next,weekdays:days.slice(0,7).map(day=>weekdayFormatter.format(new Date(day+'T12:00:00.000Z'))),invalid:false as const};
    }catch{return {invalid:true} as const;}
  },[date,activeView,weekStartsOn,locale,projected,today,selectionValid]);
  const modelKey=model.invalid?'invalid':model.range.startDay+'|'+activeView;
  const shownSelection=!model.invalid&&model.days.includes(selected)?selected:undefined;
  const focusDate=!model.invalid&&model.days.includes(focused)?focused:shownSelection??(!model.invalid&&model.days.includes(date)?date:!model.invalid?model.days[0]:'');
  useLayoutEffect(()=>{
    if(model.invalid)return;
    if(selectedDate===undefined&&!model.days.includes(selected))setSelected(date);
    if(focusIntent.current){
      const target=focusIntent.current;focusIntent.current=null;
      if(model.days.includes(target)&&(document.activeElement===document.body||document.activeElement===focusOrigin.current)){setFocused(target);buttons.current.get(target)?.focus({preventScroll:true});}
      focusOrigin.current=null;
    }
  },[modelKey,date,selectedDate]);
  useLayoutEffect(()=>{
    const node=content.current;if(!node)return;
    const measure=()=>setContentHeight(Math.ceil(node.getBoundingClientRect().height));
    measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();
  },[model.invalid]);
  useLayoutEffect(()=>{
    const origin=retryOrigin.current;if(!origin||loading)return;
    retryOrigin.current=null;
    if(document.activeElement!==document.body&&document.activeElement!==origin)return;
    const target=error?root.current?.querySelector<HTMLButtonElement>('[data-calendar-retry]'):buttons.current.get(focusDate);
    (target??root.current)?.focus({preventScroll:true});
  },[loading,error,modelKey]);
  function choose(day:string){if(disabled)return;setFocused(day);setSelected(day);}
  function moveFocus(day:string,event:KeyboardEvent<HTMLButtonElement>){
    if(model.invalid)return;
    const index=model.days.indexOf(day),rtl=getComputedStyle(root.current!).direction==='rtl';let target=index;
    if(event.key==='ArrowLeft')target+=rtl?1:-1;else if(event.key==='ArrowRight')target+=rtl?-1:1;else if(event.key==='ArrowUp')target-=7;else if(event.key==='ArrowDown')target+=7;else if(event.key==='Home')target-=index%7;else if(event.key==='End')target+=6-index%7;
    else if((event.key==='PageUp'||event.key==='PageDown')&&onDateChange){
      event.preventDefault();try{const next=shiftCalendarDate(day,event.key==='PageDown'?1:-1,activeView);getCalendarRange(next,activeView,weekStartsOn);focusIntent.current=next;focusOrigin.current=event.currentTarget;onDateChange(next);}catch{}return;
    }else return;
    event.preventDefault();const next=model.days[Math.max(0,Math.min(model.days.length-1,target))];setFocused(next);buttons.current.get(next)?.focus({preventScroll:true});
  }
  function eventTime(event:CalendarEvent){
    const startDay=getScheduleDay(event.start,timeZone),endDay=getScheduleDay(event.end,timeZone);
    return (startDay!==shownSelection?startDay+' · ':'')+formatCalendarTime(event.start,timeZone,locale)+' – '+(endDay!==startDay?getScheduleDay(event.end,timeZone)+' · ':'')+formatCalendarTime(event.end,timeZone,locale);
  }
  const selectedEvents=shownSelection&&!model.invalid?model.byDay.get(shownSelection)??[]:[];
  return <section ref={root} className="bui-event-calendar" tabIndex={-1} aria-label={label} aria-busy={loading||undefined} data-view={activeView} data-reduced-motion={reduced}>
    {model.invalid?<Alert tone="danger" title="The calendar could not be shown" live>Review the dates, events, time zone and locale.</Alert>:<>
      <header className="bui-event-calendar-heading"><div><h3 id={id+'-title'}>{model.title}</h3><p>{timeZone}</p></div><div className="bui-event-calendar-controls"><div className="bui-event-calendar-views" role="group" aria-label="Calendar view">{(['month','week'] as const).map(value=><Button key={value} size="sm" variant={activeView===value?'secondary':'ghost'} aria-pressed={activeView===value} disabled={disabled||view!==undefined&&!onViewChange} onClick={()=>setView(value)}>{value==='month'?'Month':'Week'}</Button>)}</div><div role="group" aria-label="Calendar navigation"><IconButton icon={ChevronLeft} label={'Previous '+activeView} variant="ghost" disabled={disabled||!onDateChange||!model.previous} onClick={()=>model.previous&&onDateChange?.(model.previous)}/><IconButton icon={ChevronRight} label={'Next '+activeView} variant="ghost" disabled={disabled||!onDateChange||!model.next} onClick={()=>model.next&&onDateChange?.(model.next)}/></div></div></header>
      {error&&<div className="bui-event-calendar-feedback"><Alert tone="danger" title="Events could not be loaded" live>{error}</Alert>{onRetry&&<Button size="sm" variant="secondary" data-calendar-retry onClick={event=>{retryOrigin.current=event.currentTarget;onRetry();}}>Retry loading events</Button>}</div>}
      <div className="bui-event-calendar-stage" style={{height:contentHeight,transition:reduced?'none':undefined}}><div ref={content}>
        <div className="bui-event-calendar-grid" role="group" aria-labelledby={id+'-title'} key={modelKey}>
          {model.weekdays.map((weekday,index)=><div key={'weekday-'+index} className="bui-event-calendar-weekday" aria-hidden="true">{weekday}</div>)}
          {model.days.map(day=>{const records=model.byDay.get(day)??[],isSelected=day===shownSelection;return <div key={day} className="bui-event-calendar-day" data-day={day} data-selected={isSelected||undefined} data-outside={activeView==='month'&&day.slice(0,7)!==date.slice(0,7)||undefined}>
            <button type="button" ref={node=>{if(node)buttons.current.set(day,node);else buttons.current.delete(day);}} className="bui-event-calendar-date" data-calendar-date={day} tabIndex={focusDate===day?0:-1} aria-pressed={isSelected} aria-current={today===day?'date':undefined} aria-label={model.full(day)+(loading?', events loading':', '+records.length+(records.length===1?' event':' events'))} disabled={disabled} onFocus={()=>setFocused(day)} onKeyDown={event=>moveFocus(day,event)} onClick={()=>choose(day)}><span>{model.dayNumbers.get(day)}</span>{records.length>0&&<span className="bui-event-calendar-count" aria-hidden="true">{records.length}</span>}</button>
            {loading?<div className="bui-event-calendar-cell-loading" aria-hidden="true"><Skeleton height=".5rem"/></div>:<div className="bui-event-calendar-cell-events">{records.slice(0,activeView==='month'?2:3).map(event=>onEventAction?<button type="button" key={event.id} className="bui-event-calendar-chip" tabIndex={focusDate===day?0:-1} disabled={disabled} onClick={()=>onEventAction(event)} aria-label={'Open '+event.title+' on '+day}><span className="bui-event-calendar-dot" aria-hidden="true"/><span>{event.title}</span></button>:<span key={event.id} className="bui-event-calendar-chip"><span className="bui-event-calendar-dot" aria-hidden="true"/><span>{event.title}</span></span>)}{records.length>(activeView==='month'?2:3)&&<button type="button" className="bui-event-calendar-more" tabIndex={focusDate===day?0:-1} disabled={disabled} aria-label={'Show '+records.length+' events on '+day} onClick={()=>{choose(day);requestAnimationFrame(()=>agendaHeading.current?.focus({preventScroll:true}));}}>+{records.length-(activeView==='month'?2:3)} more</button>}</div>}
          </div>;})}
        </div>
      <section className="bui-event-calendar-agenda" aria-label="Selected day events"><header><h4 ref={agendaHeading} tabIndex={-1}>{shownSelection?model.full(shownSelection):'Choose a date in this view.'}</h4><span className="bui-hint" role="status">{loading?'Loading events…':shownSelection?selectedEvents.length+(selectedEvents.length===1?' event':' events'):''}</span></header>
        {loading?<div className="bui-event-calendar-agenda-loading"><Skeleton height="3.5rem"/><Skeleton height="3.5rem"/></div>:error?<p className="bui-hint">Retry loading to see this day’s events.</p>:shownSelection?selectedEvents.length?<ol className="bui-event-calendar-agenda-list">{selectedEvents.map(event=><li key={event.id}>{onEventAction?<button type="button" disabled={disabled} className="bui-event-calendar-agenda-event" onClick={()=>onEventAction(event)} aria-label={'View '+event.title}><span><strong>{event.title}</strong><small>{eventTime(event)}</small></span><Icon icon={ArrowUpRight} size={17}/></button>:<div className="bui-event-calendar-agenda-event"><span><strong>{event.title}</strong><small>{eventTime(event)}</small></span></div>}</li>)}</ol>:<p className="bui-event-calendar-empty">No events on this date.</p>:null}
      </section>
      </div></div>
      <p className="bui-event-calendar-help bui-hint">Arrow keys move between dates. Home and End move within a week. Page Up and Page Down change the view’s date range.</p>
    </>}
  </section>;
}
