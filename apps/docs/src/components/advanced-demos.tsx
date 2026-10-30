'use client';
import { useState } from 'react';
import { CalendarDays, Check, Folder, Plus, Save } from 'lucide-react';
import { Alert, Button, Calendar, CommandPalette, DatePicker, DateRangePicker, FileUpload, MultiSelect, RadioGroup, Select, DataTable, Badge, EditableCell, type Column, type DateRange } from '@bld8/ui';

const options = ['Design','Engineering','Research','Documentation'].map(label=>({value:label.toLowerCase(),label}));
export function MultiSelectDemo() {
  const [value,setValue]=useState(['design']);
  return <div className="stack"><MultiSelect label="Project disciplines" options={[...options,{value:'archived',label:'Archived',disabled:true}]} value={value} onValueChange={setValue} hint="Choose a few. Remove chips with the buttons or Backspace." name="disciplines" /><p className="bui-hint" role="status">{value.length ? value.length + ' disciplines selected' : 'No disciplines selected'}</p><MultiSelect label="Read-only preview" options={options} defaultValue={['research']} disabled /></div>;
}
export function CommandDemo() {
  const [action,setAction]=useState('Choose an action to see the result.');
  return <div className="stack"><CommandPalette title="Workspace actions" trigger={<Button variant="secondary">Open command palette</Button>} items={[
    {id:'new',label:'New project',description:'Start with a clean workspace',category:'Action',icon:Plus,keywords:['create'],onSelect:()=>setAction('New project action selected.')},
    {id:'projects',label:'Open projects',description:'Return to your project list',category:'Navigate',icon:Folder,onSelect:()=>setAction('Projects action selected.')},
    {id:'save',label:'Save draft',description:'Keep the current changes',category:'Action',icon:Save,onSelect:()=>setAction('Save draft action selected.')},
    {id:'publish',label:'Publish workspace',description:'Unavailable in this example',category:'Action',disabled:true,onSelect:()=>setAction('Unavailable')},
  ]} /><p className="bui-hint" role="status">{action}</p></div>;
}
export function CalendarDemo() {
  const [value,setValue]=useState<Date|undefined>(new Date(2026,9,13));
  return <div className="stack"><Calendar label="Review calendar" value={value} onValueChange={setValue} defaultMonth={new Date(2026,9,1)} minDate={new Date(2026,9,5)} maxDate={new Date(2026,11,31)} /><p className="bui-hint" role="status">{value ? 'Selected ' + value.toLocaleDateString('en-AU') : 'No date selected'}</p></div>;
}
export function DatePickerDemo() {
  const [value,setValue]=useState<Date|null>(null);
  return <div className="stack"><DatePicker label="Review date" value={value} onValueChange={setValue} defaultMonth={new Date(2026,9,1)} minDate={new Date(2026,9,5)} name="reviewDate" hint="Dates before 5 October are unavailable." /><DatePicker label="Locked review date" defaultValue={new Date(2026,9,13)} disabled /><p className="bui-hint" role="status">{value ? 'Review on ' + value.toLocaleDateString('en-AU') : 'Choose a review date.'}</p></div>;
}
export function DateRangeDemo() {
  const [value,setValue]=useState<DateRange|null>(null);
  return <div className="stack"><DateRangePicker label="Reporting period" value={value} onValueChange={setValue} defaultMonth={new Date(2026,9,1)} minDate={new Date(2026,9,5)} maxDate={new Date(2026,11,31)} name="period" hint="Select a start and end date, then choose Done." /><p className="bui-hint" role="status">{value?.from && value.to ? 'Reporting period ready.' : 'No complete reporting period.'}</p></div>;
}
export function FileUploadDemo() {
  const [files,setFiles]=useState<File[]>([]); const [mode,setMode]=useState('select');
  return <div className="stack"><RadioGroup label="Upload example" options={[{value:'select',label:'Select files only'},{value:'callback',label:'Callback simulation'},{value:'failure',label:'Retry simulation'}]} value={mode} onValueChange={setMode} /><FileUpload label="Project attachments" value={files} onValueChange={setFiles} accept=".txt,.pdf,.png,.jpg" maxSize={1024*1024} maxFiles={3} onUpload={mode==='select' ? undefined : async (selected,{signal,onProgress})=>{
    // An explicit local simulation for documenting progress, cancellation and retry.
    // Production applications supply their own transport and server validation.
    await new Promise<void>((resolve,reject)=>{
      let percent=0;
      const timer=setInterval(()=>{percent+=10;selected.forEach(file=>onProgress(file,percent));if(percent>=100) {clearInterval(timer);signal.removeEventListener('abort',cancel);resolve();}},100);
      const cancel=()=>{clearInterval(timer);reject(new DOMException('Cancelled','AbortError'));};
      signal.addEventListener('abort',cancel,{once:true});
    });
    if(mode==='failure') throw new Error('Simulated service error. Change to Callback simulation and retry.');
  }} /><p className="bui-hint">{mode==='select' ? 'Files stay in this page. No upload service is connected.' : 'Explicit local simulation. No files leave your browser.'} File checks must also run on your server.</p></div>;
}
interface RecordRow {id:string;name:string;status:string;owner:string}
const records:RecordRow[]=[{id:'1',name:'Navigation study',status:'Review',owner:'Maya'},{id:'2',name:'Form patterns',status:'Ready',owner:'Sam'},{id:'3',name:'Motion notes',status:'Review',owner:'Oliver'},{id:'4',name:'Icon audit',status:'Ready',owner:'Maya'},{id:'5',name:'Layout sketches',status:'Draft',owner:'Sam'},{id:'6',name:'Empty states',status:'Draft',owner:'Oliver'}];
export function AdvancedTableDemo() {
  const [rows,setRows]=useState(records);const [selected,setSelected]=useState<string[]>([]);const [density,setDensity]=useState<'comfortable'|'compact'>('comfortable');const [state,setState]=useState('ready');const [group,setGroup]=useState('none');
  const columns:Column<RecordRow>[]=[
    {key:'name',header:'Project',hideable:false,sortValue:row=>row.name,cell:row=><EditableCell label={'project name for '+row.name} value={row.name} display={<strong>{row.name}</strong>} validate={value=>value.trim().length<3||value.trim().length>80?'Use a project name between 3 and 80 characters.':rows.some(item=>item.id!==row.id&&item.name.toLocaleLowerCase()===value.trim().toLocaleLowerCase())?'This project name is already in use.':undefined} onSave={async(value,{signal,originalValue})=>{
      if(signal.aborted)throw new DOMException('Cancelled','AbortError');
      if(row.name!==originalValue)throw new Error('This project changed. Cancel editing and open its current value.');
      setRows(current=>current.map(item=>item.id===row.id?{...item,name:value.trim()}:item));
    }}/>},
    {key:'status',header:'Status',cell:row=><Badge>{row.status}</Badge>,sortValue:row=>row.status},
    {key:'owner',header:'Owner',cell:row=>row.owner,sortValue:row=>row.owner},
  ];
  return <div className="stack"><div className="actions"><RadioGroup label="Table density" options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]} value={density} onValueChange={value=>setDensity(value as typeof density)} /><RadioGroup label="Table state" options={[{value:'ready',label:'Ready'},{value:'loading',label:'Loading'},{value:'error',label:'Error'}]} value={state} onValueChange={setState} /></div><Select label="Group projects by" value={group} onValueChange={value=>setGroup(value??'none')} options={[{value:'none',label:'None'},{value:'status',label:'Status'},{value:'owner',label:'Owner'}]}/><DataTable grouping={group==='none'?undefined:{key:row=>group==='status'?row.status:row.owner,label:key=>key}} caption="Workspace projects" rows={rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} searchText={row=>row.name+' '+row.owner} pageSize={3} density={density} columnVisibility selectable selectedKeys={selected} onSelectedKeysChange={setSelected} loading={state==='loading'} error={state==='error' ? 'The service could not be reached. This is an example state.' : undefined} onRetry={()=>setState('ready')} filters={[{key:'status',label:'Statuses',options:['Review','Ready','Draft'].map(value=>({value,label:value})),value:row=>row.status}]} renderBulkActions={chosen=><Button size="sm" leadingIcon={Check} onClick={()=>{setRows(rows.map(row=>chosen.some(item=>item.id===row.id) ? {...row,status:'Ready'} : row));setSelected([]);}}>Mark ready</Button>} /><Button variant="ghost" size="sm" onClick={()=>{setRows(records);setSelected([]);setState('ready');setGroup('none');}}>Reset example</Button></div>;
}
