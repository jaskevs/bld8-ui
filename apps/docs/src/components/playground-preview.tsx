'use client';
import {useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Alert,Badge,Button,Calendar,DataTable,DatePicker,DateRangePicker,Dialog,Drawer,EditableCell,Field,Input,MultiSelect,Progress,Select,Switch,Tabs,formatDateValue,type Column} from '@bld8/ui';
import {localDate,type PlaygroundSettings} from '@/lib/playground-state';

export const disciplineOptions=[{value:'design',label:'Design'},{value:'engineering',label:'Engineering'},{value:'research',label:'Research'},{value:'documentation',label:'Documentation'}];
export const playgroundRows=[{id:'1',name:'Study tokens',status:'Planned'},{id:'2',name:'Review keyboard flow',status:'Ready'},{id:'3',name:'Write usage notes',status:'Planned'},{id:'4',name:'Test mobile layout',status:'Ready'},{id:'5',name:'Inspect form errors',status:'Planned'},{id:'6',name:'Refine motion',status:'Ready'}];
function TablePreview({settings,update,onMessage}:{settings:PlaygroundSettings;update:(patch:Partial<PlaygroundSettings>)=>void;onMessage:(value:string)=>void}){
  const [rows,setRows]=useState(playgroundRows);const [selected,setSelected]=useState<string[]>([]);
  const columns:Column<typeof playgroundRows[number]>[]=[
    {key:'name',header:'Project',hideable:false,width:260,sortValue:row=>row.name,cell:row=>settings.inlineEditing?<EditableCell label={'Project name for '+row.name} value={row.name} validate={value=>value.trim().length<3?'Use at least three characters.':undefined} onSave={async value=>{setRows(current=>current.map(item=>item.id===row.id?{...item,name:value.trim()}:item));onMessage('Cell saved in this preview.');}} />:<strong>{row.name}</strong>},
    {key:'status',header:'Status',width:160,sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Ready'?'success':'neutral'}>{row.status}</Badge>},
  ];
  return <DataTable caption="Playground projects" rows={settings.state==='Empty'?[]:rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} searchText={row=>row.name} pageSize={settings.pageSize} density={settings.density} selectable={settings.selectable} selectedKeys={selected} onSelectedKeysChange={setSelected} columnVisibility resizableColumns={settings.resizable} loading={settings.state==='Loading'} error={settings.state==='Error'?'The example service could not load projects.':undefined} onRetry={()=>update({state:'Default'})} renderBulkActions={chosen=><Button size="sm" onClick={()=>{setRows(current=>current.map(row=>chosen.some(item=>item.id===row.id)?{...row,status:'Ready'}:row));setSelected([]);onMessage(chosen.length+' projects marked ready.');}}>Mark ready</Button>} />;
}

export function PlaygroundPreview({settings,update,onMessage}:{settings:PlaygroundSettings;update:(patch:Partial<PlaygroundSettings>)=>void;onMessage:(value:string)=>void}){
  const [text,setText]=useState('');const [checked,setChecked]=useState(false);const [selected,setSelected]=useState<string|null>('design');const [tab,setTab]=useState('overview');
  const [open,setOpen]=useState(false);const initial=useRef<HTMLInputElement>(null);const close=useRef<HTMLButtonElement>(null);
  const disabled=settings.state==='Disabled',loading=settings.state==='Loading',invalid=settings.state==='Error';
  const bounds={minDate:localDate(settings.minDate),maxDate:localDate(settings.maxDate),defaultMonth:localDate(settings.date) ?? new Date(2026,9,1)};
  const date=localDate(settings.date),end=localDate(settings.endDate);
  if(settings.component==='Button')return <Button variant={settings.variant} size={settings.size} disabled={disabled} loading={loading} trailingIcon={settings.icon?ArrowUpRight:undefined} onClick={()=>onMessage('Button activated.')}>{settings.label || 'Save changes'}</Button>;
  if(settings.component==='Input')return <Field label="Project name" hint={invalid?undefined:'A short, useful name.'} error={invalid?'Enter a project name.':undefined}><Input value={text} onChange={event=>setText(event.target.value)} disabled={disabled} density={settings.density} /></Field>;
  if(settings.component==='Switch')return <Switch label="Weekly summary" checked={checked} onChange={event=>setChecked(event.target.checked)} disabled={disabled} />;
  if(settings.component==='Badge')return <Badge tone={settings.tone}>In progress</Badge>;
  if(settings.component==='Progress')return <Progress label="Review progress" value={loading?null:settings.value} />;
  if(settings.component==='Select')return <Select label="Discipline" options={disciplineOptions} value={selected} onValueChange={setSelected} disabled={disabled} />;
  if(settings.component==='Tabs')return <Tabs label="Project views" value={tab} onValueChange={setTab} items={[{value:'overview',label:'Overview',content:<p>Project overview.</p>},{value:'activity',label:'Activity',content:<p>Recent activity.</p>}]} />;
  if(settings.component==='MultiSelect')return <MultiSelect label="Disciplines" options={disciplineOptions.map(option=>({...option,disabled:settings.disabledOption&&option.value==='research'}))} value={settings.selected} onValueChange={selected=>update({selected})} disabled={disabled} hint="Choose the disciplines involved." error={invalid?'Choose at least one discipline.':undefined} />;
  if(settings.component==='Calendar')return <Calendar label="Review calendar" {...bounds} value={date} onValueChange={value=>update({date:formatDateValue(value)})} disabled={disabled} />;
  if(settings.component==='DatePicker')return <DatePicker label="Review date" {...bounds} value={date ?? null} onValueChange={value=>update({date:formatDateValue(value ?? undefined)})} disabled={disabled} error={invalid?'Choose a review date.':undefined} hint="Date-only values use the local calendar." />;
  if(settings.component==='DateRangePicker')return <DateRangePicker label="Review period" {...bounds} value={date?{from:date,to:end}:null} onValueChange={value=>update({date:formatDateValue(value?.from),endDate:formatDateValue(value?.to)})} disabled={disabled} error={invalid?'Choose both dates.':undefined} hint="Choose a start and an end date." />;
  if(settings.component==='DataTable')return <TablePreview settings={settings} update={update} onMessage={onMessage} />;
  const Surface=settings.component==='Drawer'?Drawer:Dialog;
  return <Surface title="Project note" description="A focused space for a useful detail." trigger={<Button>Open {settings.component.toLowerCase()}</Button>} open={open} onOpenChange={setOpen} initialFocus={loading || settings.focus==='close'?close:initial} {...(settings.component==='Drawer'?{side:settings.side}:{})}>
    <div className="stack">{invalid && <Alert title="Unable to save this note" tone="danger" live><p>This is the error state example.</p><Button size="sm" variant="secondary" onClick={()=>update({state:'Default'})}>Retry note</Button></Alert>}<Field label="Note title"><Input ref={initial} value={text} disabled={loading} onChange={event=>setText(event.target.value)} /></Field><div className="actions end"><Button ref={close} variant="secondary" onClick={()=>setOpen(false)}>Done</Button><Button loading={loading} onClick={()=>{onMessage('Note saved in this preview.');setOpen(false);}}>Save note</Button></div>{loading && <p role="status" className="bui-hint">Saving example note…</p>}</div>
  </Surface>;
}
