'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Accordion,Alert,Badge,Button,Calendar,Checkbox,DatePicker,DateRangePicker,Dialog,Drawer,Field,Input,MultiSelect,Progress,RadioGroup,Select,Switch,Tabs,formatDateValue} from '@bld8/ui';
import {localDate,type PlaygroundSettings} from '@/lib/playground-state';
import {playgroundDisclosures} from '@/lib/playground-data';
import {PlaygroundTable} from './playground-table';

export const disciplineOptions=[{value:'design',label:'Design'},{value:'engineering',label:'Engineering'},{value:'research',label:'Research'},{value:'documentation',label:'Documentation'}];

export function PlaygroundPreview({settings,update,onMessage}:{settings:PlaygroundSettings;update:(patch:Partial<PlaygroundSettings>)=>void;onMessage:(value:string)=>void}){
  const [text,setText]=useState('');const checkbox=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(checkbox.current)checkbox.current.indeterminate=settings.mixed;},[settings.mixed]);
  const [open,setOpen]=useState(false);const initial=useRef<HTMLInputElement>(null);const close=useRef<HTMLButtonElement>(null);
  const disabled=settings.state==='Disabled',loading=settings.state==='Loading',invalid=settings.state==='Error';
  const bounds={minDate:localDate(settings.minDate),maxDate:localDate(settings.maxDate),defaultMonth:localDate(settings.date) ?? new Date(2026,9,1)};
  const date=localDate(settings.date),end=localDate(settings.endDate);
  if(settings.component==='Button')return <Button variant={settings.variant} size={settings.size} disabled={disabled} loading={loading} trailingIcon={settings.icon?ArrowUpRight:undefined} onClick={()=>onMessage('Button activated.')}>{settings.label || 'Save changes'}</Button>;
  if(settings.component==='Input')return <Field label="Project name" hint={invalid?undefined:'A short, useful name.'} error={invalid?'Enter a project name.':undefined}><Input value={text} onChange={event=>setText(event.target.value)} disabled={disabled} density={settings.density} /></Field>;
  if(settings.component==='Checkbox')return <Checkbox ref={checkbox} label="Include archived" description="Keep earlier work within reach." checked={settings.checked} aria-checked={settings.mixed?'mixed':settings.checked} onChange={event=>update({checked:event.target.checked,mixed:false})} disabled={disabled}/>;
  if(settings.component==='RadioGroup')return <RadioGroup label="Content density" value={settings.radioValue} onValueChange={radioValue=>update({radioValue:radioValue as PlaygroundSettings['radioValue']})} disabled={disabled} options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'},{value:'automatic',label:'Automatic',disabled:settings.disabledOption}]}/>;
  if(settings.component==='Switch')return <Switch label="Weekly summary" checked={settings.checked} onChange={event=>update({checked:event.target.checked})} disabled={disabled} />;
  if(settings.component==='Badge')return <Badge tone={settings.tone}>In progress</Badge>;
  if(settings.component==='Progress')return <Progress label="Review progress" value={loading?null:settings.value} />;
  if(settings.component==='Select')return <Select label="Discipline" options={disciplineOptions.map(option=>({...option,disabled:settings.disabledOption&&option.value==='research'}))} value={settings.selectValue} onValueChange={selectValue=>{if(selectValue)update({selectValue:selectValue as PlaygroundSettings['selectValue']});}} disabled={disabled} />;
  if(settings.component==='Tabs')return <Tabs label="Project views" value={settings.tabValue} onValueChange={tabValue=>update({tabValue:tabValue as PlaygroundSettings['tabValue']})} items={[{value:'overview',label:'Overview',content:<p>Project overview.</p>},{value:'activity',label:'Activity',content:<p>Recent activity.</p>}]} />;
  if(settings.component==='Accordion')return <Accordion multiple={settings.multiple} value={settings.accordionOpen} onValueChange={accordionOpen=>update({accordionOpen})} items={playgroundDisclosures.map((item,index)=>({...item,content:<p>{item.content}</p>,disabled:disabled||settings.disabledOption&&index===2}))}/>;
  if(settings.component==='MultiSelect')return <MultiSelect label="Disciplines" options={disciplineOptions.map(option=>({...option,disabled:settings.disabledOption&&option.value==='research'}))} value={settings.selected} onValueChange={selected=>update({selected})} disabled={disabled} hint="Choose the disciplines involved." error={invalid?'Choose at least one discipline.':undefined} />;
  if(settings.component==='Calendar')return <Calendar label="Review calendar" {...bounds} value={date} onValueChange={value=>update({date:formatDateValue(value)})} disabled={disabled} />;
  if(settings.component==='DatePicker')return <DatePicker label="Review date" {...bounds} value={date ?? null} onValueChange={value=>update({date:formatDateValue(value ?? undefined)})} disabled={disabled} error={invalid?'Choose a review date.':undefined} hint="Date-only values use the local calendar." />;
  if(settings.component==='DateRangePicker')return <DateRangePicker label="Review period" {...bounds} value={date?{from:date,to:end}:null} onValueChange={value=>update({date:formatDateValue(value?.from),endDate:formatDateValue(value?.to)})} disabled={disabled} error={invalid?'Choose both dates.':undefined} hint="Choose a start and an end date." />;
  if(['DataTable','FilterBuilder'].includes(settings.component))return <PlaygroundTable settings={settings} update={update} onMessage={onMessage} />;
  const Surface=settings.component==='Drawer'?Drawer:Dialog;
  return <Surface title="Project note" description="A focused space for a useful detail." trigger={<Button>Open {settings.component.toLowerCase()}</Button>} open={open} onOpenChange={setOpen} initialFocus={loading || settings.focus==='close'?close:initial} {...(settings.component==='Drawer'?{side:settings.side}:{})}>
    <div className="stack">{invalid && <Alert title="Unable to save this note" tone="danger" live><p>This is the error state example.</p><Button size="sm" variant="secondary" onClick={()=>update({state:'Default'})}>Retry note</Button></Alert>}<Field label="Note title"><Input ref={initial} value={text} disabled={loading} onChange={event=>setText(event.target.value)} /></Field><div className="actions end"><Button ref={close} variant="secondary" onClick={()=>setOpen(false)}>Done</Button><Button loading={loading} onClick={()=>{onMessage('Note saved in this preview.');setOpen(false);}}>Save note</Button></div>{loading && <p role="status" className="bui-hint">Saving example note…</p>}</div>
  </Surface>;
}
