export const dateFieldExamples=[
{id:'date-entry-lifecycle',componentId:'date-picker',title:'A date field with native form ownership',description:'Type an unambiguous date, use the calendar, and submit or reset through an external form. Invalid calendar dates never replace a committed value.',keyboard:['Type YYYY-MM-DD; Enter or leaving the field commits a valid date.','Alt+ArrowDown opens the calendar. Escape restores the committed text.','Tab reaches the calendar and clear actions; native form validation focuses invalid text.'],states:['Editable date','Required and min/max validation','External form','Read only','Disabled','Prevented reset'],source:`'use client';
import {useId,useRef,useState} from 'react';
import {Button,Checkbox,DatePicker,parseDateValue,UIProvider} from '@bld8/ui';
export default function DateEntryLifecycle(){
  const formId=useId(),input=useRef<HTMLInputElement>(null);
  const [changes,setChanges]=useState(0),[status,setStatus]=useState('No date submitted.'),[keepOnReset,setKeepOnReset]=useState(false);
  return <UIProvider><div style={{display:'grid',gap:16}}>
    <DatePicker label="Review date" editable name="reviewDate" form={formId} required defaultValue={parseDateValue('2026-11-12')} minDate={parseDateValue('2026-11-01')!} maxDate={parseDateValue('2026-12-31')!} textInputRef={input} onValueChange={()=>setChanges(count=>count+1)} hint="Use YYYY-MM-DD. Dates stay in the local calendar, without UTC conversion."/>
    <DatePicker label="Locked review date" editable name="lockedDate" form={formId} defaultValue={parseDateValue('2026-11-18')} readOnly/>
    <DatePicker label="Unavailable date" editable name="unavailableDate" form={formId} defaultValue={parseDateValue('2026-11-20')} disabled/>
    <Checkbox label="Keep date on reset" checked={keepOnReset} onCheckedChange={setKeepOnReset}/>
    <form id={formId} onReset={event=>{if(keepOnReset){event.preventDefault();setStatus('Reset prevented.');}else setStatus('Reset requested.');}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setStatus('Review date: '+data.get('reviewDate')+'; locked: '+data.get('lockedDate')+'; unavailable: '+(data.has('unavailableDate')?'included':'excluded'));}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type="submit">Read review date</Button><Button type="reset" variant="secondary">Reset review date</Button><Button variant="ghost" onClick={()=>input.current?.focus()}>Focus review date</Button></div>
    </form><p data-date-changes>Changes: {changes}</p><p role="status">{status}</p>
  </div></UIProvider>;
}`},
{id:'date-range-presets',componentId:'date-range',title:'A date range that waits for confirmation',description:'Calendar choices, presets and typed dates stay in a draft until Apply. Cancel, Escape and outside dismissal preserve the committed form value.',keyboard:['Type a start and end date as YYYY-MM-DD. Enter applies a complete valid draft.','Tab through presets and the calendar, then use Apply range or Cancel.','Escape cancels a popup draft and returns to the start field.'],states:['Explicit draft','Bounded presets','Invalid or reversed range','Native form reset','Optional clear'],source:`'use client';
import {useState} from 'react';
import {Button,Checkbox,DateRangePicker,parseDateValue,UIProvider} from '@bld8/ui';
const range=(from:string,to:string)=>({from:parseDateValue(from)!,to:parseDateValue(to)!});
const presets=[{id:'first',label:'First week',value:range('2026-11-02','2026-11-06')},{id:'second',label:'Second week',value:range('2026-11-09','2026-11-13')},{id:'unavailable',label:'Unavailable week',value:range('2027-01-04','2027-01-08')}];
export default function DateRangePresets(){
  const [changes,setChanges]=useState(0),[required,setRequired]=useState(true),[status,setStatus]=useState('No range submitted.');
  return <UIProvider><form style={{display:'grid',gap:16}} onReset={()=>setStatus('Range reset requested.')} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setStatus('Reporting period: '+data.get('period.from')+' to '+data.get('period.to'));}}>
    <DateRangePicker label="Reporting period" name="period" editable commitMode="explicit" required={required} defaultValue={range('2026-11-02','2026-11-06')} minDate={parseDateValue('2026-11-01')!} maxDate={parseDateValue('2026-12-31')!} presets={presets} onValueChange={()=>setChanges(count=>count+1)} hint="Changes reach the form only after Apply. The dates are date-only values."/>
    <Checkbox label="Require reporting period" checked={required} onCheckedChange={setRequired}/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type="submit">Read reporting period</Button><Button type="reset" variant="secondary">Reset reporting period</Button></div>
    <p data-date-changes>Changes: {changes}</p><p role="status">{status}</p>
  </form></UIProvider>;
}`},
{id:'date-controlled-entry',componentId:'date-picker',title:'Controlled dates remain host owned',description:'External updates and native reset preserve the controlled value. Native text errors are linked to the actual input.',keyboard:['Edit a date and leave the field to report the valid change.','Reset leaves the controlled value with the host.','External update buttons change or clear the committed date.'],states:['Controlled value','External update','Controlled null','Reset'],source:`'use client';
import {useState} from 'react';
import {Button,DatePicker,formatDateValue,parseDateValue,UIProvider} from '@bld8/ui';
export default function ControlledDateEntry(){
  const [value,setValue]=useState<Date|null>(parseDateValue('2026-11-12')),[status,setStatus]=useState('Controlled date: 2026-11-12');
  return <UIProvider><form style={{display:'grid',gap:16}} onSubmit={event=>{event.preventDefault();setStatus('Controlled submitted: '+new FormData(event.currentTarget).get('controlledDate'));}}>
    <DatePicker label="Controlled review date" editable name="controlledDate" value={value} onValueChange={next=>{setValue(next);setStatus('Controlled date: '+formatDateValue(next));}}/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button onClick={()=>setValue(parseDateValue('2026-11-24'))}>Set controlled date</Button><Button variant="ghost" onClick={()=>setValue(null)}>Clear controlled date</Button><Button variant="secondary" type="reset">Reset controlled date form</Button><Button type="submit">Read controlled date</Button></div><p role="status">{status}</p>
  </form></UIProvider>;
}`}
] as const;
