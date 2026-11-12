import {localDate,playgroundModules,type PlaygroundSettings} from './playground-state';
import {playgroundDisclosures} from './playground-data';
import {playgroundTableCode} from './playground-table-code';
import {playgroundWorkflowCode} from './playground-workflow-code';
import {withSourceNotice} from './source-notice';
const quote=JSON.stringify;
function date(value:string){const parsed=localDate(value);return parsed?`new Date(${parsed.getFullYear()}, ${parsed.getMonth()}, ${parsed.getDate()})`:'null';}
export function playgroundCode(s:PlaygroundSettings){return withSourceNotice(configuredCode(s));}
function configuredCode(s:PlaygroundSettings){
  if(['Kanban','Tree','Chart'].includes(s.component))return playgroundWorkflowCode(s);
  if(['DataTable','FilterBuilder'].includes(s.component))return playgroundTableCode(s);
  const disabled=s.state==='Disabled'?' disabled':'',error=s.state==='Error';
  const path='@/components/ui/bld8/';let imports=`import { ${s.component} } from "${path+playgroundModules[s.component]}";`;
  let react='useState',setup='',body='';
  const options='[{value:"design",label:"Design"},{value:"engineering",label:"Engineering"},{value:"research",label:"Research"'+(s.disabledOption?',disabled:true':'')+'},{value:"documentation",label:"Documentation"}]';
  if(s.component==='Button'){setup='const [message, setMessage] = useState("");';body=`<><Button variant=${quote(s.variant)} size=${quote(s.size)}${disabled}${s.state==='Loading'?' loading':''}${s.icon?' trailingIcon={ArrowUpRight}':''} onClick={() => setMessage("Button activated.")}>{${quote(s.label||'Save changes')}}</Button><p role="status">{message}</p></>`;if(s.icon)imports='import { ArrowUpRight } from "lucide-react";\n'+imports;}
  if(s.component==='Input'){imports=`import { Field, Input } from "${path}input";`;setup='const [name, setName] = useState("");';body=`<Field label="Project name"${error?' error="Enter a project name."':' hint="A short, useful name."'}><Input density=${quote(s.density)} value={name} onChange={event => setName(event.target.value)}${disabled} /></Field>`;}
  if(s.component==='Checkbox'){react='useEffect, useRef, useState';setup=`const [checked, setChecked] = useState(${s.checked});\n  const [mixed, setMixed] = useState(${s.mixed});\n  const input = useRef<HTMLInputElement>(null);\n  useEffect(() => { if (input.current) input.current.indeterminate = mixed; }, [mixed]);`;body=`<Checkbox ref={input} label="Include archived" description="Keep earlier work within reach." checked={checked} aria-checked={mixed?'mixed':checked} onChange={event=>{setChecked(event.target.checked);setMixed(false);}}${disabled}/>`;}
  if(s.component==='RadioGroup'){setup=`const [value, setValue] = useState(${quote(s.radioValue)});`;body=`<RadioGroup label="Content density" value={value} onValueChange={setValue}${disabled} options={[{value:"comfortable",label:"Comfortable"},{value:"compact",label:"Compact"},{value:"automatic",label:"Automatic"${s.disabledOption?',disabled:true':''}}]}/>`;}
  if(s.component==='Switch'){setup=`const [enabled, setEnabled] = useState(${s.checked});`;body=`<Switch label="Weekly summary" checked={enabled} onChange={event => setEnabled(event.target.checked)}${disabled} />`;}
  if(s.component==='Badge'){react='';body=`<Badge tone=${quote(s.tone)}>In progress</Badge>`;}
  if(s.component==='Progress'){react='';body=`<Progress label="Review progress" value={${s.state==='Loading'?'null':s.value}} />`;}
  if(s.component==='Select'){setup=`const [discipline, setDiscipline] = useState<string | null>(${quote(s.selectValue)});`;body=`<Select label="Discipline" options={${options}} value={discipline} onValueChange={setDiscipline}${disabled} />`;}
  if(s.component==='Tabs'){setup=`const [view, setView] = useState(${quote(s.tabValue)});`;body='<Tabs label="Project views" value={view} onValueChange={setView} items={[{value:"overview",label:"Overview",content:<p>Project overview.</p>},{value:"activity",label:"Activity",content:<p>Recent activity.</p>}]} />';}
  if(s.component==='Accordion'){setup=`const [open, setOpen] = useState<string[]>(${quote(s.accordionOpen)});`;body=`<Accordion multiple={${s.multiple}} value={open} onValueChange={setOpen} items={${quote(playgroundDisclosures)}.map((item,index)=>({...item,content:<p>{item.content}</p>,disabled:${s.state==='Disabled'}||(${s.disabledOption}&&index===2)}))}/>`;}
  if(s.component==='MultiSelect'){setup=`const [disciplines, setDisciplines] = useState<string[]>(${quote(s.selected)});`;body=`<MultiSelect label="Disciplines" options={${options}} value={disciplines} onValueChange={setDisciplines}${disabled} hint="Choose the disciplines involved."${error?' error="Choose at least one discipline."':''} />`;}
  if(['Calendar','DatePicker','DateRangePicker'].includes(s.component)){
    const bounds=`${s.minDate?' minDate={'+date(s.minDate)+'}':''}${s.maxDate?' maxDate={'+date(s.maxDate)+'}':''}`;
    if(s.component==='DateRangePicker'){imports=`import { DateRangePicker, type DateRange } from "${path}date-range";`;setup=`const [range, setRange] = useState<DateRange | null>(${s.date?'{from:'+date(s.date)+',to:'+(s.endDate?date(s.endDate):'undefined')+'}':'null'});`;body=`<DateRangePicker label="Review period" value={range} onValueChange={setRange}${bounds}${disabled}${error?' error="Choose both dates."':''} />`;}
    else{setup=`const [date, setDate] = useState<${s.component==='Calendar'?'Date | undefined':'Date | null'}>(${s.date?date(s.date):s.component==='Calendar'?'undefined':'null'});`;body=`<${s.component} label="${s.component==='Calendar'?'Review calendar':'Review date'}" value={date} onValueChange={setDate}${bounds}${disabled}${s.component==='DatePicker'&&error?' error="Choose a review date."':''} />`;}
  }
  if(['Dialog','Drawer'].includes(s.component)){
    react='useRef, useState';imports+='\n'+`import { Button, Field, Input } from "${path}core";`;if(error)imports+='\n'+`import { Alert } from "${path}core";`;
    setup='const [open, setOpen] = useState(false);\n  const [note, setNote] = useState("");\n  const input = useRef<HTMLInputElement>(null);\n  const close = useRef<HTMLButtonElement>(null);';
    body=`<${s.component} title="Project note" description="A focused space for a useful detail."${s.component==='Drawer'?' side='+quote(s.side):''} open={open} onOpenChange={setOpen} initialFocus={${s.focus==='close'||s.state==='Loading'?'close':'input'}} trigger={<Button>Open ${s.component.toLowerCase()}</Button>}>\n      ${error?'<Alert title="Unable to save this note" tone="danger">Connect a retry action to your service.</Alert>\n      ':''}<Field label="Note title"><Input ref={input} value={note} onChange={event => setNote(event.target.value)}${s.state==='Loading'?' disabled':''} /></Field>\n      <Button ref={close} variant="secondary" onClick={() => setOpen(false)}>Done</Button>\n      <Button${s.state==='Loading'?' loading':''} onClick={() => setOpen(false)}>Save note</Button>\n    </${s.component}>`;
  }
  return `'use client';\n${react?'import { '+react+' } from "react";\n':''}${imports}\n\nexport default function Example() {\n  ${setup}\n  return (\n    ${body}\n  );\n}`;
}
