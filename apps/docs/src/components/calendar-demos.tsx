'use client';
import {useCallback,useRef,useState} from 'react';
import {Checkbox,EventCalendar,Select,type CalendarEvent,type CalendarView} from '@bld8/ui';
import {CalendarWorkspace,loadSampleCalendarEvents,type CalendarLoadContext} from '@bld8/blocks';

const events:readonly CalendarEvent[]=[
  {id:'interface-review',title:'Interface review',start:'2026-11-02T00:00:00Z',end:'2026-11-02T01:00:00Z'},
  {id:'build-review',title:'Build review',start:'2026-11-02T00:30:00Z',end:'2026-11-02T01:30:00Z'},
  {id:'release-window',title:'Release window',start:'2026-11-03T22:00:00Z',end:'2026-11-05T01:00:00Z'},
];
export function EventCalendarDemo(){
  const [date,setDate]=useState('2026-11-02'),[view,setView]=useState<CalendarView>('month'),[selected,setSelected]=useState('2026-11-02'),[preview,setPreview]=useState('sample'),[opened,setOpened]=useState('');
  return <div className="stack"><Select label="Calendar preview state" value={preview} onValueChange={value=>{if(value)setPreview(value);}} options={[{value:'sample',label:'Sample data'},{value:'empty',label:'No events'},{value:'error',label:'Connection error'}]}/>
    <EventCalendar label="Team calendar" date={date} onDateChange={next=>{setDate(next);setSelected(next);}} view={view} onViewChange={setView} selectedDate={selected} onDateSelect={setSelected} timeZone="Australia/Melbourne" events={preview==='empty'?[]:events} error={preview==='error'?'Example calendar connection unavailable.':undefined} onRetry={()=>setPreview('sample')} onEventAction={event=>setOpened(event.title)}/>
    <output className="bui-hint" aria-label="Opened calendar event">{opened?'Opened: '+opened:'Choose an event to inspect it.'}</output>
  </div>;
}
function delay(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
  const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));},timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
  signal.addEventListener('abort',abort,{once:true});
});}
export function CalendarWorkspaceDemo(){
  const [fail,setFail]=useState(false),[slow,setSlow]=useState(false),flags=useRef({fail:false,slow:false});flags.current={fail,slow};
  const loadEvents=useCallback(async(context:CalendarLoadContext)=>{
    const next=flags.current;flags.current={fail:false,slow:false};setFail(false);setSlow(false);
    await delay(next.slow?1500:80,context.signal);if(next.fail)throw Error('Example calendar connection unavailable.');
    return loadSampleCalendarEvents(context);
  },[]);
  return <div className="stack"><div className="bui-calendar-demo-controls"><Checkbox label="Fail next calendar load" checked={fail} onChange={event=>setFail(event.currentTarget.checked)}/><Checkbox label="Slow next calendar load" checked={slow} onChange={event=>setSlow(event.currentTarget.checked)}/></div><CalendarWorkspace loadEvents={loadEvents}/></div>;
}
