'use client';
import {useId,useMemo} from 'react';
import {ArrowUpRight,Clock3} from 'lucide-react';
import {Alert,Button,Icon,Skeleton} from './core.js';
import {formatScheduleTime,getScheduleDay,getScheduleStarts,validateScheduleSnapshot,type ScheduleEvent,type ScheduleSnapshot,type ScheduleStart} from './schedule-state.js';

export interface DayAgendaProps {
  label:string;
  /** Calendar date in the chosen zone, as YYYY-MM-DD. */
  day:string;
  timeZone:string;
  /** Complete bounded availability windows and appointments. */
  snapshot:ScheduleSnapshot;
  locale?:string;
  /** Elapsed minutes: 15–120, in steps of 15. */
  durationMinutes?:number;
  selectedStart?:string|null;
  onSelectStart?:(start:ScheduleStart)=>void;
  onEventAction?:(event:ScheduleEvent)=>void;
  disabled?:boolean;
  loading?:boolean;
  error?:string;
  onRetry?:()=>void;
}

function dayTitle(day:string,locale:string) {
  return new Intl.DateTimeFormat(locale,{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(day+'T12:00:00.000Z'));
}

/** A day view of supplied instants. No wall-clock conversion or service fetching. */
export function DayAgenda({label,day,timeZone,snapshot,locale='en-AU',durationMinutes=30,selectedStart,onSelectStart,onEventAction,disabled=false,loading=false,error,onRetry}:DayAgendaProps) {
  const id=useId();
  const model=useMemo(()=>{
    if(loading||error||!day)return null;
    try{
      const clean=validateScheduleSnapshot(snapshot),starts=getScheduleStarts(clean,day,timeZone,durationMinutes);
      const events=clean.events.filter(event=>getScheduleDay(event.start,timeZone)<=day&&getScheduleDay(new Date(Date.parse(event.end)-1).toISOString(),timeZone)>=day).sort((a,b)=>a.start.localeCompare(b.start));
      const title=dayTitle(day,locale);
      const time=(instant:string)=>formatScheduleTime(instant,timeZone,locale);
      const range=(start:string,end:string)=>time(start)+' – '+(getScheduleDay(start,timeZone)!==getScheduleDay(end,timeZone)?getScheduleDay(end,timeZone)+' · ':'')+time(end);
      return {title,starts:starts.map(start=>({...start,label:(getScheduleDay(start.start,timeZone)!==getScheduleDay(start.end,timeZone)?getScheduleDay(start.end,timeZone)+' · ':'')+time(start.end),time:time(start.start)})),events:events.map(event=>({...event,label:(getScheduleDay(event.start,timeZone)!==day?getScheduleDay(event.start,timeZone)+' · ':'')+range(event.start,event.end)})),invalid:false};
    }catch{return {title:'',starts:[],events:[],invalid:true};}
  },[snapshot,day,timeZone,locale,durationMinutes,loading,error]);
  return <section className="bui-day-agenda" aria-label={label} aria-busy={loading||undefined}>
    {loading?<div className="bui-day-agenda-loading"><p className="bui-hint" role="status">Loading the agenda…</p>{[0,1,2,3].map(item=><Skeleton key={item} height="3.5rem"/>)}</div>:error?<div className="bui-day-agenda-recovery"><Alert title="The agenda could not be loaded" tone="danger" live>{error}</Alert>{onRetry&&<Button variant="secondary" onClick={onRetry}>Retry loading agenda</Button>}</div>:!day?<div className="bui-day-agenda-empty"><h3>Choose a date.</h3><p>The available times and appointments will appear here.</p></div>:model?.invalid?<Alert title="The agenda could not be shown" tone="danger" live>Review the records, date, time zone and locale.</Alert>:model&&<>
      <header className="bui-day-agenda-heading"><div><h3>{model.title}</h3><p>{timeZone} · {durationMinutes}-minute appointments</p></div><span className="bui-hint" role="status">{model.starts.length} available · {model.events.length} booked</span></header>
      <div className="bui-day-agenda-layout" key={day+'|'+timeZone+'|'+durationMinutes}><section className="bui-day-agenda-availability" aria-label="Available times"><div className="bui-day-agenda-section-heading"><h4>Available times</h4><p>Each time includes its UTC offset.</p></div>
        {model.starts.length?<div className="bui-day-agenda-times" role="group" aria-label="Choose an available time">{model.starts.map((start,index)=><button key={start.slotId+':'+start.start} type="button" className="bui-day-agenda-time" disabled={disabled||!onSelectStart} aria-pressed={selectedStart===start.start} aria-label={'Book '+start.time+' for '+durationMinutes+' minutes'} aria-describedby={id+'-start-'+index} onClick={()=>onSelectStart?.({slotId:start.slotId,start:start.start,end:start.end})}><span><Icon icon={Clock3} size={16}/><strong>{start.time}</strong></span><small id={id+'-start-'+index}>Ends {start.label}</small></button>)}</div>:<div className="bui-day-agenda-empty"><strong>No available times.</strong><p>Choose another day or a shorter duration.</p></div>}
      </section><section className="bui-day-agenda-booked" aria-label="Booked appointments"><div className="bui-day-agenda-section-heading"><h4>Booked appointments</h4><p>The appointments already in this schedule.</p></div>
        {model.events.length?<ol className="bui-day-agenda-events">{model.events.map((event,index)=><li key={event.id}>{onEventAction?<button type="button" disabled={disabled} className="bui-day-agenda-event" onClick={()=>onEventAction({id:event.id,start:event.start,end:event.end,title:event.title,revision:event.revision})} aria-label={'View '+event.title} aria-describedby={id+'-event-'+index}><span><strong>{event.title}</strong><small id={id+'-event-'+index}>{event.label}</small></span><Icon icon={ArrowUpRight} size={17}/></button>:<div className="bui-day-agenda-event"><span><strong>{event.title}</strong><small>{event.label}</small></span></div>}</li>)}</ol>:<div className="bui-day-agenda-empty"><strong>No appointments yet.</strong><p>Booked appointments will appear here.</p></div>}
      </section></div>
    </>}
  </section>;
}
