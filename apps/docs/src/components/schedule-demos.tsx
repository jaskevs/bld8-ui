'use client';
import {useMemo,useState} from 'react';
import {DayAgenda,Dialog,NumberField,Select,type ScheduleEvent,type ScheduleSnapshot,getScheduleDay,formatScheduleTime,validateScheduleBooking} from '@bld8/ui';
import {SchedulePlanner,createSampleSchedule,type SchedulePlannerProps} from '@bld8/blocks';

const zones=[{value:'Australia/Melbourne',label:'Melbourne'},{value:'UTC',label:'UTC'},{value:'America/New_York',label:'New York'},{value:'Europe/London',label:'London'}];
const repeated:ScheduleSnapshot={revision:1,slots:[{id:'repeat-window',start:'2026-11-01T05:00:00.000Z',end:'2026-11-01T07:30:00.000Z'}],events:[]};

export function DayAgendaDemo(){
  const[mode,setMode]=useState('sample'),[zone,setZone]=useState('Australia/Melbourne'),[date,setDate]=useState(''),[duration,setDuration]=useState<number|null>(30),[selected,setSelected]=useState<string|null>(null),[details,setDetails]=useState<ScheduleEvent|null>(null);
  const source=useMemo(()=>createSampleSchedule(),[]);
  const snapshot=mode==='repeated'?repeated:mode==='empty'?{revision:1,slots:[],events:[]}:mode==='invalid'?{...source,slots:[source.slots[0],source.slots[0]]}:source;
  const days=[...new Set([...snapshot.slots,...snapshot.events].map(item=>getScheduleDay(item.start,zone)))].sort();
  const day=days.includes(date)?date:days[0]??'2026-11-02';
  return <div className="stack">
    <div className="agenda-demo-controls"><Select label="Agenda preview state" value={mode} options={[{value:'sample',label:'Sample data'},{value:'repeated',label:'Repeated hour'},{value:'loading',label:'Loading'},{value:'empty',label:'Empty'},{value:'error',label:'Connection error'},{value:'invalid',label:'Invalid data'}]} onValueChange={value=>{setMode(value??'sample');setSelected(null);setDate('');if(value==='repeated')setZone('America/New_York');}}/><Select label="Agenda time zone" value={zone} options={zones} onValueChange={value=>{setZone(value??'UTC');setDate('');setSelected(null);}}/><Select label="Agenda day" value={day} options={(days.length?days:[day]).map(value=>({value,label:value}))} onValueChange={value=>{setDate(value??'');setSelected(null);}}/><NumberField label="Agenda duration" value={duration} onValueChange={value=>{setDuration(value);setSelected(null);}} min={15} max={120} step={15}/></div>
    {mode==='repeated'&&<p className="bui-hint">The clock repeats an hour on this date. UTC offsets distinguish the available starts.</p>}
    <DayAgenda label="Day agenda" snapshot={snapshot} day={day} timeZone={zone} durationMinutes={duration??0} selectedStart={selected} onSelectStart={start=>setSelected(start.start)} onEventAction={setDetails} loading={mode==='loading'} error={mode==='error'?'The example connection is unavailable.':undefined} onRetry={()=>setMode('sample')}/>
    <p className="bui-hint" role="status">{selected?'Selected '+formatScheduleTime(selected,zone)+'.':'Choose an available start. No appointment is created by this component preview.'}</p>
    <Dialog title="Appointment details" open={!!details} onOpenChange={open=>{if(!open)setDetails(null);}}>{details&&<div className="stack"><p>{details.title}</p><p>{formatScheduleTime(details.start,zone)} – {formatScheduleTime(details.end,zone)}</p><p className="bui-hint">{zone}</p></div>}</Dialog>
  </div>;
}

function wait(signal:AbortSignal,milliseconds:number){return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},milliseconds);signal.addEventListener('abort',cancel,{once:true});});}

export function SchedulePlannerDemo(){
  const[mode,setMode]=useState('sample');
  const props=useMemo<SchedulePlannerProps>(()=>{
    if(mode==='sample')return {};
    let snapshot=createSampleSchedule(),loads=0,saves=0;
    return{
      loadSchedule:async({signal})=>{
        await wait(signal,mode==='loading'?86_400_000:200);
        if(mode==='error'&&loads++===0)throw new Error('Example connection unavailable');
        if(mode==='empty')return {revision:1,slots:[],events:[]};
        if(mode==='invalid')return {...snapshot,slots:[snapshot.slots[0],snapshot.slots[0]]};
        return {...snapshot,slots:snapshot.slots.map(row=>({...row})),events:snapshot.events.map(row=>({...row}))};
      },
      onBook:async(booking,{signal,requestId})=>{
        await wait(signal,mode==='slow'?1800:250);
        if(mode==='rejected'&&saves++===0)throw new Error('Example booking rejected');
        if(signal.aborted)throw new DOMException('Cancelled','AbortError');
        validateScheduleBooking(snapshot,booking);
        const eventId='booking-'+requestId;
        snapshot={...snapshot,revision:snapshot.revision+1,events:[...snapshot.events,{id:eventId,start:booking.start,end:booking.end,title:booking.title,revision:1}]};
        return {snapshot,eventId};
      },
    };
  },[mode]);
  return <div className="stack"><Select label="Schedule preview state" value={mode} onValueChange={value=>setMode(value??'sample')} options={[{value:'sample',label:'Sample data'},{value:'loading',label:'Loading'},{value:'empty',label:'Empty'},{value:'error',label:'Connection error'},{value:'rejected',label:'Rejected booking'},{value:'slow',label:'Slow booking'},{value:'invalid',label:'Invalid data'}]}/><SchedulePlanner {...props}/></div>;
}
