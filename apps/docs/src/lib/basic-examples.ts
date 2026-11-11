export const basicExamples=[
  {id:'basic-icon',componentId:'icon',title:'A labelled icon and a real action',description:'Standalone icons receive a name; button decoration stays hidden from assistive technology.',preview:'on-demand',keyboard:['Tab reaches the action; Enter adds one photo.'],states:['Labelled image','Decorative button icon','Local count'],source:`'use client';
import {useState} from 'react';
import {Camera} from 'lucide-react';
import {Button,Icon} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function IconExample(){const [count,setCount]=useState(0);return <div><Icon icon={Camera} label="Example camera" size={24}/><Button leadingIcon={Camera} onClick={()=>setCount(count+1)}>Add example photo</Button><p role="status">{count} photos added locally</p></div>;}`},
  {id:'basic-icon-button',componentId:'icon-button',title:'An action with an explicit name',description:'The icon-only button has a meaningful label and a working local action.',preview:'on-demand',keyboard:['Enter or Space adds an item.'],states:['Accessible name','Local count'],source:`'use client';
import {useState} from 'react';
import {Plus} from 'lucide-react';
import {IconButton} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function IconButtonExample(){const [count,setCount]=useState(0);return <div><IconButton icon={Plus} label="Add example item" onClick={()=>setCount(count+1)}/><p role="status">{count} items added locally</p></div>;}`},
  {id:'basic-input-group',componentId:'input-group',title:'Search with a clear action',description:'The field keeps its native label and the clear action returns focus to typing.',preview:'on-demand',keyboard:['Tab reaches search and clear.','Enter or Space clears the query and restores input focus.'],states:['Empty','Typed','Clear disabled'],source:`'use client';
import {useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import {Field,Icon,IconButton,Input,InputGroup} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function SearchExample(){const [query,setQuery]=useState('');const input=useRef<HTMLInputElement>(null);return <Field label="Search example notes"><InputGroup leading={<Icon icon={Search}/>} trailing={<IconButton label="Clear example notes" icon={X} variant="ghost" disabled={!query} onClick={()=>{setQuery('');input.current?.focus();}}/>}><Input ref={input} type="search" value={query} onChange={event=>setQuery(event.target.value)}/></InputGroup></Field>;}`},
  {id:'basic-textarea',componentId:'textarea',title:'A note with a character count',description:'Native multiline editing with a controlled value and a linked length hint.',preview:'on-demand',keyboard:['Enter inserts a new line.','Native selection and clipboard commands remain available.'],states:['Empty','Typed','Length limit'],source:`'use client';
import {useState} from 'react';
import {Field,Textarea} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function NotesExample(){const [note,setNote]=useState('');return <Field label="Example project note" hint={note.length+' of 240 characters'}><Textarea name="note" value={note} maxLength={240} onChange={event=>setNote(event.target.value)} placeholder="A note to self…"/></Field>;}`},
  {id:'basic-tabs',componentId:'tabs',title:'Two views of the same project',description:'Controlled tabs retain a clear selected view and one visible panel.',preview:'on-demand',keyboard:['Arrow keys move between tabs.','Enter selects a focused tab.'],states:['Overview selected','Activity selected','Unavailable tab'],source:`'use client';
import {useState} from 'react';
import {Tabs} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function TabsExample(){const [view,setView]=useState('overview');return <Tabs label="Example project views" value={view} onValueChange={setView} items={[{value:'overview',label:'Example overview',content:<p>Two interface tasks remain.</p>},{value:'activity',label:'Example activity',content:<p>The keyboard review was completed.</p>},{value:'archive',label:'Example archive',content:'Not available',disabled:true}]}/>;}`},
  {id:'basic-accordion',componentId:'accordion',title:'Details on demand',description:'A controlled disclosure keeps the open state in the consuming component.',preview:'on-demand',keyboard:['Enter or Space opens or closes a section.','Tab follows native disclosure triggers.'],states:['Closed','Open','Disabled section'],source:`'use client';
import {useState} from 'react';
import {Accordion} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function AccordionExample(){const [open,setOpen]=useState<string[]>([]);return <Accordion value={open} onValueChange={setOpen} items={[{value:'included',title:'Example: what is included?',content:'The source, tokens and this complete usage example.'},{value:'storage',title:'Example: where is state saved?',content:'This example keeps state in memory for this page.'},{value:'later',title:'Example: unavailable details',content:'Unavailable',disabled:true}]}/>;}`},
  {id:'basic-breadcrumb',componentId:'breadcrumb',title:'A small navigation trail',description:'Links lead to existing library pages; the current item is plain text.',preview:'on-demand',keyboard:['Tab reaches ancestor links; the current location is not an extra action.'],states:['Ancestor links','Current page'],source:`'use client';
import {Breadcrumb} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function BreadcrumbExample(){return <Breadcrumb label="Example location" items={[{label:'Library',href:'/components'},{label:'Navigation',href:'/components/tabs'},{label:'Current example'}]}/>;}`},
  {id:'basic-pagination',componentId:'pagination',title:'Read a local collection in pages',description:'The displayed records and page control share one controlled index.',preview:'on-demand',keyboard:['Tab reaches Previous and Next.','Boundary actions are disabled.'],states:['First page','Middle page','Last page'],source:`'use client';
import {useState} from 'react';
import {Pagination} from '@bld8/ui';
import '@bld8/ui/styles.css';
const notes=['Read labels','Check focus','Review spacing','Test errors','Verify forms','Inspect motion'];
export default function PaginationExample(){const [page,setPage]=useState(1);return <div><ul>{notes.slice((page-1)*2,page*2).map(note=><li key={note}>{note}</li>)}</ul><Pagination label="Example note pages" page={page} totalPages={3} onPageChange={setPage}/></div>;}`},
  {id:'basic-dialog',componentId:'dialog',title:'Edit a local title',description:'The modal owns a short draft; Save updates in-memory content before dismissal.',preview:'on-demand',keyboard:['Tab stays inside the open dialog.','Escape dismisses and restores trigger focus.'],states:['Closed','Editing','Locally saved'],source:`'use client';
import {useState} from 'react';
import {Button,Dialog,DialogClose,Field,Input,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function DialogExample(){const [open,setOpen]=useState(false),[title,setTitle]=useState('Interface review'),[draft,setDraft]=useState(title);return <UIProvider><p>Current title: {title}</p><Dialog title="Edit example title" description="Changes remain in this example." open={open} onOpenChange={next=>{setOpen(next);if(next)setDraft(title);}} trigger={<Button>Edit example title</Button>}><Field label="Example title"><Input value={draft} onChange={event=>setDraft(event.target.value)}/></Field><Button disabled={!draft.trim()} onClick={()=>{setTitle(draft.trim());setOpen(false);}}>Save example title</Button><DialogClose>Discard example draft</DialogClose></Dialog></UIProvider>;}`},
  {id:'basic-sheet',componentId:'sheet',title:'Supporting project details',description:'A controlled side panel with the same dismissal and focus contract as Dialog.',preview:'on-demand',keyboard:['Escape dismisses the sheet.','Tab remains inside while open.'],states:['Closed','Open','Controlled setting'],source:`'use client';
import {useState} from 'react';
import {Button,DialogClose,Sheet,Switch,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function SheetExample(){const [open,setOpen]=useState(false),[pinned,setPinned]=useState(false);return <UIProvider><Sheet title="Example project details" description="A local preference, without a server." open={open} onOpenChange={setOpen} trigger={<Button variant="secondary">Open example details</Button>}><Switch label="Pin example project" checked={pinned} onCheckedChange={setPinned}/><DialogClose>Close example details</DialogClose></Sheet><p>{pinned?'Project is pinned in this example.':'Project is not pinned.'}</p></UIProvider>;}`},
  {id:'basic-popover',componentId:'popover',title:'A setting beside its trigger',description:'The popup changes a local setting without moving the underlying page.',preview:'on-demand',keyboard:['Escape closes the popup and restores trigger focus.','Space toggles the native switch.'],states:['Closed','Open','Setting on or off'],source:`'use client';
import {useState} from 'react';
import {Button,Popover,Switch,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function PopoverExample(){const [compact,setCompact]=useState(false);return <UIProvider><Popover title="Example display preferences" trigger={<Button variant="secondary">Example display preferences</Button>}><Switch label="Compact example cards" checked={compact} onCheckedChange={setCompact}/></Popover><p>{compact?'Compact cards selected.':'Comfortable cards selected.'}</p></UIProvider>;}`},
  {id:'basic-tooltip',componentId:'tooltip',title:'Supplementary context',description:'The trigger has its own name; the tooltip adds optional explanation.',preview:'on-demand',keyboard:['Tab focuses the button and exposes its supplementary text.'],states:['Resting','Hovered or focused'],source:`'use client';
import {useState} from 'react';
import {Copy} from 'lucide-react';
import {IconButton,Tooltip,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function TooltipExample(){const [copies,setCopies]=useState(0);return <UIProvider><Tooltip content="Create another local example card"><IconButton label="Duplicate example card" icon={Copy} onClick={()=>setCopies(copies+1)}/></Tooltip><p role="status">{copies} local copies</p></UIProvider>;}`},
  {id:'basic-toast',componentId:'toast',title:'Announce a local action',description:'The provider owns notification lifetime; the action does not pretend to save remotely.',preview:'on-demand',keyboard:['Tab reaches the action and notification close control.'],states:['No notification','Visible notification','Dismissed'],source:`'use client';
import {Button,UIProvider,useToast} from '@bld8/ui';
import '@bld8/ui/styles.css';
function NoticeAction(){const toast=useToast();return <Button onClick={()=>toast.add({title:'Example preference changed',description:'The notification is local to this page.'})}>Show example notification</Button>;}
export default function ToastExample(){return <UIProvider><NoticeAction/></UIProvider>;}`},
  {id:'basic-alert',componentId:'alert',title:'Persistent feedback with a retry',description:'The example changes real local state; no network request is implied.',preview:'on-demand',keyboard:['Enter on retry changes the local example to its ready state.'],states:['Error','Ready'],source:`'use client';
import {useState} from 'react';
import {Alert,Button} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function AlertExample(){const [ready,setReady]=useState(false);return <Alert title={ready?'Example is ready':'Example needs attention'} tone={ready?'success':'danger'} live><p>{ready?'Local retry completed.':'Retry this local demonstration.'}</p>{!ready&&<Button variant="secondary" onClick={()=>setReady(true)}>Retry example</Button>}</Alert>;}`},
  {id:'basic-badge',componentId:'badge',title:'Text carries the status',description:'Tones support the words instead of replacing them.',preview:'on-demand',keyboard:['These status labels are read-only and introduce no extra tab stops.'],states:['Neutral','Success','Warning','Danger'],source:`'use client';
import {Badge} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function BadgeExample(){return <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Badge>Draft</Badge><Badge tone="success">Ready</Badge><Badge tone="warning">Review needed</Badge><Badge tone="danger">Action required</Badge></div>;}`},
  {id:'basic-progress',componentId:'progress',title:'Measured and unknown progress',description:'A native progress element exposes a value; an unknown duration remains indeterminate.',preview:'on-demand',keyboard:['Enter advances the local measured value.'],states:['Measured','Complete','Indeterminate'],source:`'use client';
import {useState} from 'react';
import {Button,Progress} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function ProgressExample(){const [value,setValue]=useState(25);return <div><Progress label="Example checklist progress" value={value}/><Button disabled={value===100} onClick={()=>setValue(Math.min(100,value+25))}>Complete another example step</Button><Progress label="Waiting for an unspecified task" value={null}/></div>;}`},
  {id:'basic-loading',componentId:'loading',title:'Keep the shape while loading',description:'A labelled spinner announces the wait; decorative skeletons reserve content space.',preview:'on-demand',keyboard:['Enter reveals the local content without a fabricated network request.'],states:['Loading placeholder','Revealed content'],source:`'use client';
import {useState} from 'react';
import {Button,Skeleton,Spinner} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function LoadingExample(){const [ready,setReady]=useState(false);return <div>{ready?<p>The local example content is ready.</p>:<div><Spinner label="Waiting for example content"/><Skeleton width="70%" height="1rem"/><Skeleton width="45%" height="1rem"/></div>}<Button disabled={ready} onClick={()=>setReady(true)}>Reveal example content</Button></div>;}`},
  {id:'basic-empty',componentId:'empty',title:'A useful next step',description:'The empty state action adds a real in-memory record.',preview:'on-demand',keyboard:['Enter on the action creates the local record.'],states:['Empty','One record'],source:`'use client';
import {useState} from 'react';
import {Button,EmptyState} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function EmptyExample(){const [created,setCreated]=useState(false);return created?<p role="status">Example project created in memory.</p>:<EmptyState title="No example projects" action={<Button onClick={()=>setCreated(true)}>Create example project</Button>}>Start with one local project.</EmptyState>;}`},
  {id:'basic-avatar',componentId:'avatar',title:'Names remain available without photos',description:'Initials are a reliable fallback and the full name remains the accessible label.',preview:'on-demand',keyboard:['Read-only avatars add no tab stops.'],states:['Small','Medium','Large initials'],source:`'use client';
import {Avatar} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function AvatarExample(){return <div style={{display:'flex',alignItems:'center',gap:12}}><Avatar name="Maya Chen" size="sm"/><Avatar name="Oliver Reed"/><Avatar name="Sam Rivera" size="lg"/></div>;}`},
  {id:'basic-card',componentId:'card',title:'Group related details',description:'A semantic heading and separator provide structure without turning the whole card into a button.',preview:'on-demand',keyboard:['The explicit action is the only interactive part of the card.'],states:['Read-only content','Local saved feedback'],source:`'use client';
import {useState} from 'react';
import {Button,Card,Separator} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function CardExample(){const [saved,setSaved]=useState(false);return <Card><h3>Example review</h3><p>Keyboard flow and field feedback.</p><Separator/><Button variant="secondary" onClick={()=>setSaved(!saved)}>{saved?'Remove example bookmark':'Bookmark example review'}</Button></Card>;}`},
  {id:'basic-number-field',componentId:'number-field',title:'A bounded numeric setting',description:'A canonical number stays separate from its locale-aware presentation.',preview:'on-demand',keyboard:['Arrow keys step within the limits.','Home and End reach the bounds.'],states:['Number','Empty input','Limits'],source:`'use client';
import {useState} from 'react';
import {NumberField} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function NumberExample(){const [seats,setSeats]=useState<number|null>(4);return <div><NumberField label="Example seat count" name="seats" value={seats} onValueChange={setSeats} min={1} max={12} step={1} locale="en-AU" hint="Choose one to twelve seats."/><p>Canonical value: {seats===null?'empty':seats}</p></div>;}`},
  {id:'basic-time-picker',componentId:'time-picker',title:'A wall-clock preference',description:'The selected value is HH:mm; no date, time-zone conversion or availability service is implied.',preview:'on-demand',keyboard:['Arrow keys navigate the menu.','Enter commits; Escape dismisses.'],states:['Selected time','Disabled interval'],source:`'use client';
import {useState} from 'react';
import {TimePicker,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function TimeExample(){const [time,setTime]=useState<string|null>('09:30');return <UIProvider><TimePicker label="Example preferred start" name="preferredStart" value={time} onValueChange={setTime} minTime="09:00" maxTime="17:00" interval={30} disabledTimes={['12:00']} locale="en-AU" hourCycle="h23"/><p>Canonical value: {time??'none'}</p></UIProvider>;}`},
  {id:'basic-stepper',componentId:'stepper',title:'A controlled sequence',description:'The host chooses the current and completed steps; a later step can remain unavailable.',preview:'on-demand',keyboard:['Tab visits available steps; Enter changes the current step.'],states:['Completed','Current','Disabled next step'],source:`'use client';
import {useState} from 'react';
import {Stepper} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function StepperExample(){const [step,setStep]=useState('review');return <div><Stepper label="Example review steps" value={step} onValueChange={setStep} completed={['prepare']} steps={[{value:'prepare',label:'Prepare example'},{value:'review',label:'Review example'},{value:'publish',label:'Publish example',disabled:true}]}/><p>Current step: {step}</p></div>;}`},
  {id:'basic-timeline',componentId:'timeline',title:'A readable sequence of events',description:'The caller supplies stable IDs, order and explicit date labels.',preview:'on-demand',keyboard:['This ordered timeline is read-only.'],states:['Complete','Current','Pending'],source:`'use client';
import {Timeline} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function TimelineExample(){return <Timeline label="Example release history" items={[{id:'prepare',title:'Prepare example',state:'complete',description:'Collect the useful details.',dateTime:'2026-11-11T08:00:00Z',time:'11 Nov · 08:00 UTC'},{id:'review',title:'Review example',state:'current',description:'Check labels, focus and recovery.'},{id:'share',title:'Share example',state:'pending'}]}/>;}`},
  {id:'basic-calendar',componentId:'calendar',title:'Choose a calendar date',description:'An explicit month avoids clock-dependent initial content.',preview:'on-demand',keyboard:['Arrow keys move day focus.','Enter or Space selects a date.'],states:['Selected date','No selection','Minimum date'],source:`'use client';
import {useState} from 'react';
import {Calendar} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function CalendarExample(){const [date,setDate]=useState<Date|undefined>(new Date(2026,10,11));return <div><Calendar label="Example review date" value={date} onValueChange={setDate} defaultMonth={new Date(2026,10,1)} minDate={new Date(2026,10,1)}/><p>{date?date.toLocaleDateString('en-AU'):'No date selected'}</p></div>;}`},
  {id:'basic-date-picker',componentId:'date-picker',title:'A labelled date field',description:'The host keeps the Date value and the picker owns its popup navigation.',preview:'on-demand',keyboard:['Enter opens the calendar.','Escape closes it and restores the trigger.'],states:['Selected','Cleared'],source:`'use client';
import {useState} from 'react';
import {DatePicker,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function DateExample(){const [date,setDate]=useState<Date|null>(new Date(2026,10,11));return <UIProvider><DatePicker label="Example next review" name="reviewDate" value={date} onValueChange={setDate} defaultMonth={new Date(2026,10,1)} hint="A calendar date, without a stored time."/><p>{date?date.toLocaleDateString('en-AU'):'No date selected'}</p></UIProvider>;}`},
  {id:'basic-date-range',componentId:'date-range',title:'An explicit reporting period',description:'Start and end dates remain visible while completing a range.',preview:'on-demand',keyboard:['Enter selects start and end dates.','Escape returns focus to the range trigger.'],states:['Complete range','Partial range','Cleared'],source:`'use client';
import {useState} from 'react';
import {DateRangePicker,UIProvider,type DateRange} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function DateRangeExample(){const [range,setRange]=useState<DateRange|null>({from:new Date(2026,10,11),to:new Date(2026,10,18)});return <UIProvider><DateRangePicker label="Example reporting period" name="reportingPeriod" value={range} onValueChange={setRange} defaultMonth={new Date(2026,10,1)}/><p>{range?.from?.toLocaleDateString('en-AU')??'Choose a start'} – {range?.to?.toLocaleDateString('en-AU')??'Choose an end'}</p></UIProvider>;}`},
  {id:'basic-file-upload',componentId:'file-upload',title:'Choose local files without sending them',description:'Selection, validation and removal work locally; no upload callback or network service is supplied.',preview:'on-demand',keyboard:['Tab reaches Browse and each file removal action.'],states:['Empty','Chosen files','Validation feedback'],source:`'use client';
import {useState} from 'react';
import {FileUpload} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function LocalFilesExample(){const [files,setFiles]=useState<File[]>([]);return <div><FileUpload label="Example local attachments" accept=".txt,.pdf" maxFiles={3} maxSize={2*1024*1024} value={files} onValueChange={setFiles} hint="Files stay on this device. No upload service is connected."/><p>{files.length} local files selected</p></div>;}`},
  {id:'basic-data-grid',componentId:'data-grid',title:'Edit a bounded local page',description:'The host applies reported edits to local rows; no automatic server writes occur.',preview:'on-demand',keyboard:['Arrow keys move between cells; Shift extends a range.','Enter edits a title; Escape cancels.'],states:['Read-only identity','Editable title','Local draft'],source:`'use client';
import {useState} from 'react';
import {DataGrid,type DataColumn} from '@bld8/ui';
import '@bld8/ui/styles.css';
type Row={id:string;revision:number;title:string};
const columns:DataColumn<Row>[]=[{key:'id',label:'ID',type:'text'},{key:'title',label:'Title',type:'text',editable:true}];
export default function GridExample(){const [rows,setRows]=useState<Row[]>([{id:'EX-1',revision:1,title:'Review keyboard focus'},{id:'EX-2',revision:1,title:'Check field feedback'}]);return <div><p>Edits update this local page only.</p><DataGrid label="Example issue draft" rows={rows} columns={columns} onEdit={edits=>setRows(current=>current.map(row=>{const edit=edits.find(item=>item.id===row.id&&item.key==='title');return edit?{...row,title:String(edit.value)}:row;}))}/></div>;}`},
  {id:'basic-upload-queue',componentId:'upload-queue',title:'Process files locally',description:'This handler reads and hashes local files. It demonstrates queue callbacks without pretending to upload or store anything.',preview:'on-demand',keyboard:['Tab reaches Browse, Start and each file action.','Cancel aborts the local attempt.'],states:['Queued','Locally processing','Receipt','Cancelled'],source:`'use client';
import {UploadQueue,type UploadFileHandler} from '@bld8/ui';
import '@bld8/ui/styles.css';
const processFile:UploadFileHandler=async(file,{signal,requestId,onProgress})=>{
  const bytes=await file.arrayBuffer();if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  const digest=await crypto.subtle.digest('SHA-256',bytes);if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  onProgress({loaded:file.size,total:file.size});
  const sha256=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
  return {id:'local-'+requestId,requestId,bytes:file.size,sha256};
};
export default function QueueExample(){return <div><p>No files leave this browser. The handler reads and hashes each file locally; this is not an upload service.</p><UploadQueue label="Example local file processor" onUploadFile={processFile} maxFiles={3} maxSize={2*1024*1024} concurrency={1}/></div>;}`},
  {id:'basic-event-calendar',componentId:'event-calendar',title:'An explicit event calendar',description:'The date, UTC instants and display zone are supplied by the host.',preview:'on-demand',keyboard:['Arrow keys navigate calendar days.','Enter chooses a day; labelled event buttons inspect an event.'],states:['Week or month','Selected day','Event detail'],source:`'use client';
import {useState} from 'react';
import {EventCalendar,type CalendarView} from '@bld8/ui';
import '@bld8/ui/styles.css';
const events=[{id:'review',title:'Example interface review',start:'2026-11-11T10:00:00Z',end:'2026-11-11T11:00:00Z'}];
export default function EventsExample(){const [date,setDate]=useState('2026-11-11'),[view,setView]=useState<CalendarView>('month'),[detail,setDetail]=useState('');return <div><EventCalendar label="Example team calendar" date={date} onDateChange={setDate} view={view} onViewChange={setView} events={events} timeZone="UTC" today="2026-11-11" onEventAction={event=>setDetail(event.title+' · '+event.start)}/><p role="status">{detail}</p></div>;}`},
  {id:'basic-cascader',componentId:'cascader',title:'Choose a path from local records',description:'An asynchronous local loader demonstrates the boundary; selecting a leaf commits its stable ID path.',preview:'on-demand',keyboard:['Right opens a parent; Left returns to its parent.','Enter selects a final leaf.'],states:['Root choices','Child choices','Committed path'],source:`'use client';
import {useState} from 'react';
import {Cascader,UIProvider,type CascaderNode,type CascaderOptionsLoader,type CascaderPathResolver} from '@bld8/ui';
import '@bld8/ui/styles.css';
const nodes:CascaderNode[]=[{value:'design',label:'Design',parentValue:null,hasChildren:true},{value:'engineering',label:'Engineering',parentValue:null,hasChildren:true},{value:'ui',label:'Interfaces',parentValue:'design',hasChildren:false},{value:'web',label:'Web applications',parentValue:'engineering',hasChildren:false}];
const loadAreas:CascaderOptionsLoader=async({parentValue,query,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:nodes.filter(node=>node.parentValue===parentValue&&node.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};};
const resolvePath:CascaderPathResolver=async({values,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return values.flatMap(value=>nodes.filter(node=>node.value===value));};
export default function CascaderExample(){const [path,setPath]=useState<string[]>([]);return <UIProvider><Cascader label="Example project area" name="area" value={path} onValueChange={setPath} loadOptions={loadAreas} resolvePath={resolvePath} hint="These records are local to this module."/><p>Committed IDs: {path.join(' / ')||'none'}</p></UIProvider>;}`},
  {id:'basic-async-combobox',componentId:'async-combobox',title:'Stable IDs through a source boundary',description:'A local asynchronous dataset shows search and label resolution without a fabricated endpoint.',preview:'on-demand',keyboard:['Type to search the local records.','Arrow keys choose an option; Enter commits its ID.'],states:['Empty','Search results','Selected label'],source:`'use client';
import {useState} from 'react';
import {AsyncCombobox,UIProvider,type AsyncOptionsLoader,type AsyncOptionsResolver} from '@bld8/ui';
import '@bld8/ui/styles.css';
const people=[{value:'maya',label:'Maya Chen'},{value:'oliver',label:'Oliver Reed'},{value:'sam',label:'Sam Rivera'}];
const loadPeople:AsyncOptionsLoader=async({query,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};};
const resolvePeople:AsyncOptionsResolver=async({values,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return people.filter(person=>values.includes(person.value));};
export default function RemoteChoiceExample(){const [person,setPerson]=useState<string|null>(null);return <UIProvider><AsyncCombobox label="Example reviewer source" value={person} onValueChange={setPerson} loadOptions={loadPeople} resolveOptions={resolvePeople} hint="This asynchronous source uses local records."/><p>Selected ID: {person??'none'}</p></UIProvider>;}`},
  {id:'basic-async-multi-select',componentId:'async-multi-select',title:'Retain several stable choices',description:'Selected labels remain available while the local asynchronous query changes.',preview:'on-demand',keyboard:['Type to search; Enter adds a highlighted choice.','Backspace and chip actions remove selected values.'],states:['No choices','Several choices','Filtered results'],source:`'use client';
import {useState} from 'react';
import {AsyncMultiSelect,UIProvider,type AsyncOptionsLoader,type AsyncOptionsResolver} from '@bld8/ui';
import '@bld8/ui/styles.css';
const people=[{value:'maya',label:'Maya Chen'},{value:'oliver',label:'Oliver Reed'},{value:'sam',label:'Sam Rivera'}];
const loadPeople:AsyncOptionsLoader=async({query,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};};
const resolvePeople:AsyncOptionsResolver=async({values,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return people.filter(person=>values.includes(person.value));};
export default function MultiSourceExample(){const [peopleIds,setPeopleIds]=useState<string[]>(['maya']);return <UIProvider><AsyncMultiSelect label="Example review team source" value={peopleIds} onValueChange={setPeopleIds} loadOptions={loadPeople} resolveOptions={resolvePeople} hint="This asynchronous source uses local records."/><p>Selected IDs: {peopleIds.join(', ')||'none'}</p></UIProvider>;}`},
  {id:'basic-day-agenda',componentId:'day-agenda',title:'Inspect supplied availability',description:'UTC availability and an existing appointment are explicit; selecting a time does not book it.',preview:'on-demand',keyboard:['Tab visits available times and appointment actions.','Enter inspects a time without saving an appointment.'],states:['Available starts','Existing event','Inspected time'],source:`'use client';
import {useState} from 'react';
import {DayAgenda,type ScheduleSnapshot} from '@bld8/ui';
import '@bld8/ui/styles.css';
const snapshot:ScheduleSnapshot={revision:1,slots:[{id:'morning',start:'2026-11-11T09:00:00Z',end:'2026-11-11T12:00:00Z'}],events:[{id:'review',revision:1,title:'Existing example review',start:'2026-11-11T10:00:00Z',end:'2026-11-11T10:30:00Z'}]};
export default function AgendaExample(){const [selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState('');return <div><DayAgenda label="Example available times" day="2026-11-11" timeZone="UTC" snapshot={snapshot} durationMinutes={30} selectedStart={selected} onSelectStart={slot=>{setSelected(slot.start);setMessage('Inspected '+slot.start+'. No booking was saved.');}} onEventAction={event=>setMessage(event.title)}/><p role="status">{message}</p></div>;}`},
  {id:'basic-windowed-table',componentId:'windowed-table',title:'A window over complete local rows',description:'The caller supplies the complete dataset; keyboard selection and a separate detail readout remain explicit.',preview:'on-demand',keyboard:['Arrow keys move row focus; Home/End reach endpoints.','Space selects a row; Enter opens its local details.'],states:['Windowed rows','Selected rows','Detail readout'],source:`'use client';
import {useState} from 'react';
import {WindowedTable,type Column} from '@bld8/ui';
import '@bld8/ui/styles.css';
type Row={id:string;title:string};
const rows:Row[]=Array.from({length:120},(_,index)=>({id:'EX-'+(index+1),title:'Example issue '+(index+1)}));
const columns:Column<Row>[]=[{key:'id',header:'ID',cell:row=>row.id,width:120},{key:'title',header:'Title',cell:row=>row.title,flex:1}];
export default function WindowExample(){const [selected,setSelected]=useState<string[]>([]),[detail,setDetail]=useState('');return <div><WindowedTable caption="Example local issues" rows={rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.title} height={320} selectable selectedKeys={selected} onSelectedKeysChange={setSelected} onRowAction={row=>setDetail(row.title)}/><p role="status">{selected.length} selected. {detail}</p></div>;}`},
  {id:'basic-chart',componentId:'chart',title:'Series with exact values',description:'Explicit categories and missing values are inspectable as both a chart and a data table.',preview:'on-demand',keyboard:['Arrow keys inspect point values.','Legend buttons change visible series; Show data opens the exact table.'],states:['Line or bar','Missing point','Series visibility'],source:`'use client';
import {useState} from 'react';
import {Button,Chart,type ChartDatum,type ChartSeries,type ChartType} from '@bld8/ui';
import '@bld8/ui/styles.css';
const data:ChartDatum[]=[{id:'mon',label:'Mon',values:{done:12,review:4}},{id:'tue',label:'Tue',values:{done:18,review:null}},{id:'wed',label:'Wed',values:{done:15,review:6}}];
const series:ChartSeries[]=[{id:'done',label:'Completed',tone:'primary'},{id:'review',label:'In review',tone:'accent'}];
export default function ChartExample(){const [type,setType]=useState<ChartType>('line');return <div><Button variant="secondary" onClick={()=>setType(type==='line'?'bar':'line')}>Switch example chart type</Button><Chart label="Example review counts" description="Illustrative local counts, with one missing observation." data={data} series={series} type={type}/></div>;}`},
  {id:'basic-tree',componentId:'tree',title:'Browse without changing selection',description:'Focus, expansion and selection have separate controlled state.',preview:'on-demand',keyboard:['Right opens a folder; Left closes it.','Arrow keys move focus; Space selects and Enter activates.'],states:['Expanded folder','Focused node','Selected file','Disabled node'],source:`'use client';
import {useState} from 'react';
import {Tree,type TreeNode} from '@bld8/ui';
import '@bld8/ui/styles.css';
const nodes:TreeNode[]=[{id:'src',label:'src',children:[{id:'app',label:'app.tsx'},{id:'styles',label:'styles.css'}]},{id:'readme',label:'README.md'},{id:'private',label:'Unavailable example',disabled:true}];
export default function TreeExample(){const [expanded,setExpanded]=useState<string[]>(['src']),[selected,setSelected]=useState<string|null>(null);return <div><Tree label="Example project files" nodes={nodes} expandedIds={expanded} onExpandedChange={setExpanded} selectedId={selected} onSelectedChange={setSelected}/><p>Selected ID: {selected??'none'}</p></div>;}`},
  {id:'basic-kanban',componentId:'kanban',title:'Move local work with a keyboard alternative',description:'The host applies validated moves to its own in-memory items.',preview:'on-demand',keyboard:['Activate a Move handle to choose destination and position.','Escape cancels a drag or closes the move dialog.'],states:['Two columns','Moved item','Local order'],source:`'use client';
import {useState} from 'react';
import {Kanban,UIProvider,applyKanbanMove,type KanbanItem} from '@bld8/ui';
import '@bld8/ui/styles.css';
const columns=[{id:'planned',title:'Example planned'},{id:'done',title:'Example completed'}];
export default function KanbanExample(){const [items,setItems]=useState<KanbanItem[]>([{id:'labels',columnId:'planned',title:'Review labels'},{id:'focus',columnId:'planned',title:'Check keyboard focus'},{id:'spacing',columnId:'done',title:'Align fields'}]);return <UIProvider><p>Moves remain in memory.</p><Kanban label="Example local tasks" columns={columns} items={items} onMove={move=>setItems(current=>applyKanbanMove(current,move,columns))}/></UIProvider>;}`},
  {id:'basic-filter-builder',componentId:'filter-builder',title:'Draft, validate and explicitly apply',description:'Incomplete rules remain editable; applying a query is a host decision.',preview:'on-demand',keyboard:['Tab reaches each condition and removal action.','Removing a rule returns focus to a neighbouring control.'],states:['No conditions','Draft rule','Validation feedback','Applied query'],source:`'use client';
import {useState} from 'react';
import {Button,FilterBuilder,UIProvider,emptyFilterQuery,validateFilterQuery,type FilterField,type FilterQuery} from '@bld8/ui';
import '@bld8/ui/styles.css';
const fields:FilterField[]=[{id:'title',label:'Example title',kind:'text'},{id:'effort',label:'Example effort',kind:'number'}];
export default function FilterExample(){const [draft,setDraft]=useState<FilterQuery>(emptyFilterQuery()),[errors,setErrors]=useState<Record<string,string>>({}),[applied,setApplied]=useState('No query applied.');return <UIProvider><FilterBuilder label="Example conditions" fields={fields} value={draft} onValueChange={setDraft} errors={errors}/><Button onClick={()=>{const next=validateFilterQuery(draft,fields);setErrors(next);if(!Object.keys(next).length)setApplied(JSON.stringify(draft));}}>Apply example conditions</Button><p role="status">{applied}</p></UIProvider>;}`},
  {id:'basic-editable-cell',componentId:'editable-cell',title:'Validate a small change in place',description:'A local promise updates the committed value; cancellation leaves it unchanged.',preview:'on-demand',keyboard:['Enter or F2 begins editing.','Enter saves a valid text value; Escape cancels.'],states:['Display','Editing','Validation error','Locally saved'],source:`'use client';
import {useState} from 'react';
import {EditableCell} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function EditableExample(){const [name,setName]=useState('Example review');return <div><EditableCell label="Example review name" value={name} validate={value=>value.trim().length<3?'Use at least three characters.':undefined} onSave={async(value,{signal})=>{if(signal.aborted)return;setName(value.trim());}}/><p>The value is kept in memory for this page.</p></div>;}`},
  {id:'basic-react-hook-form',componentId:'react-hook-form',title:'Use existing React Hook Form state',description:'The optional adapter links field labels, errors, native refs and a working local submit handler.',preview:'on-demand',keyboard:['Tab reaches the registered field.','Invalid submit uses React Hook Form focus and error behaviour.'],states:['Empty required input','Validation error','Submitted value'],source:`'use client';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button,Input,OTPInput,Select,UIProvider} from '@bld8/ui';
import {RHFControl,RHFField} from '@bld8/ui/react-hook-form';
import '@bld8/ui/styles.css';
export default function HookFormExample(){
  const form=useForm<{name:string;reviewer:string|null;code:string}>({defaultValues:{name:'',reviewer:null,code:''}}),[saved,setSaved]=useState('');
  return <UIProvider><form onSubmit={form.handleSubmit(values=>setSaved(values.name+' / '+values.reviewer))}>
    <RHFField control={form.control} name="name" label="Example workspace name" required rules={{required:'Enter an example name.'}}>{field=><Input {...field}/>}</RHFField>
    <RHFControl control={form.control} name="reviewer" rules={{required:'Choose an example reviewer.'}}>{binding=><Select {...binding} label="Example form reviewer" required options={[{value:'maya',label:'Maya Chen',description:'Interface review'},{value:'sam',label:'Sam Rivera',description:'Keyboard review'}]}/>}</RHFControl>
    <RHFControl control={form.control} name="code" rules={{validate:value=>value.length===6||'Enter six example digits.'}}>{binding=><OTPInput {...binding} label="Example form code" length={6} hint="Format validation only; no authentication service."/>}</RHFControl>
    <Button type="submit">Submit hook form example</Button><p role="status">{saved?'Local result: '+saved:''}</p>
  </form></UIProvider>;
}`},
  {id:'basic-form',componentId:'form',title:'Validate a small local workflow',description:'The form adapter owns draft state and feedback; the supplied submit callback keeps the result in memory.',preview:'on-demand',keyboard:['Submit focuses the first invalid named field.','Native input editing and clipboard commands remain available.'],states:['Pristine','Dirty','Invalid','Saved'],source:`'use client';
import {useState} from 'react';
import {Button,Field,Form,FormErrorSummary,Input,useForm} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function FormExample(){const [result,setResult]=useState('');const form=useForm({initialValues:{name:''},validate:values=>({name:values.name.trim()?undefined:'Enter an example project name.'}),onSubmit:async(values,{signal})=>{if(signal.aborted)return;setResult(values.name);}});return <Form form={form}><FormErrorSummary error={form.error} errors={form.errors}/><Field label="Example project name" error={form.errors.name}><Input name="name" value={form.values.name} onChange={event=>form.setField('name',event.target.value)}/></Field><Button type="submit" loading={form.pending}>Save local form example</Button><p role="status">{result?'Local result: '+result:''}</p></Form>;}`},
  {id:'basic-sidebar',componentId:'sidebar',title:'A responsive navigation shell',description:'The local active view changes through the same sidebar on desktop and narrow containers.',preview:'on-demand',keyboard:['Tab reaches the navigation trigger and named destinations.','Escape dismisses mobile navigation.'],states:['Expanded','Collapsed','Mobile drawer','Active view'],source:`'use client';
import {useState} from 'react';
import {FileText,FolderOpen} from 'lucide-react';
import {Sidebar,SidebarGroup,SidebarHeader,SidebarInset,SidebarMenuButton,SidebarProvider,SidebarTrigger,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function SidebarExample(){const [view,setView]=useState('projects');return <UIProvider><SidebarProvider style={{minHeight:260}}><Sidebar label="Example workspace navigation"><SidebarHeader>Example workspace</SidebarHeader><SidebarGroup label="VIEWS"><SidebarMenuButton label="Example projects" icon={FolderOpen} active={view==='projects'} onClick={()=>setView('projects')}/><SidebarMenuButton label="Example notes" icon={FileText} active={view==='notes'} onClick={()=>setView('notes')}/></SidebarGroup></Sidebar><SidebarInset><SidebarTrigger/><h3>{view==='projects'?'Example projects':'Example notes'}</h3><p>Content remains local to this module.</p></SidebarInset></SidebarProvider></UIProvider>;}`},
  {id:'basic-drawer',componentId:'drawer',title:'A draft in a bottom drawer',description:'The draft stays in the host component while the modal opens and closes.',preview:'on-demand',keyboard:['Escape dismisses and returns focus.','Tab remains in the open drawer.'],states:['Closed','Open','Preserved draft'],source:`'use client';
import {useState} from 'react';
import {Button,Drawer,DrawerClose,Field,Input,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function DrawerExample(){const [draft,setDraft]=useState('');return <UIProvider><Drawer title="Example project note" side="bottom" trigger={<Button variant="secondary">Open example note drawer</Button>}><Field label="Example note title"><Input value={draft} onChange={event=>setDraft(event.target.value)}/></Field><DrawerClose>Keep local example draft</DrawerClose></Drawer></UIProvider>;}`},
  {id:'basic-context-menu',componentId:'context-menu',title:'Context actions with a visible alternative',description:'The same local action works from the context menu and an always-visible button.',preview:'on-demand',keyboard:['Shift+F10 opens the focused context trigger.','Arrow keys navigate; Enter activates; Escape dismisses.'],states:['Closed','Open','Local action feedback'],source:`'use client';
import {useState} from 'react';
import {Button,ContextMenu,ContextMenuContent,ContextMenuItem,ContextMenuTrigger,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function ContextExample(){const [count,setCount]=useState(0);const duplicate=()=>setCount(value=>value+1);return <UIProvider><ContextMenu><ContextMenuTrigger aria-label="Example note context actions" style={{padding:24,border:'1px solid currentColor'}}>Example note: right-click or use Shift+F10.</ContextMenuTrigger><ContextMenuContent aria-label="Example note actions"><ContextMenuItem onClick={duplicate}>Duplicate example note</ContextMenuItem><ContextMenuItem disabled>Unavailable example share</ContextMenuItem></ContextMenuContent></ContextMenu><Button variant="secondary" onClick={duplicate}>Duplicate example note directly</Button><p role="status">{count} local copies</p></UIProvider>;}`},
  {id:'basic-command',componentId:'command',title:'Search real local actions',description:'The palette invokes its own callbacks and leaves global shortcuts unregistered in this embedded example.',preview:'on-demand',keyboard:['Type to filter actions.','Arrow keys move; Enter activates; Escape dismisses.'],states:['Closed','Filtered list','Action feedback'],source:`'use client';
import {useState} from 'react';
import {Button,CommandPalette,UIProvider} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function CommandExample(){const [status,setStatus]=useState('');return <UIProvider><CommandPalette title="Example quick actions" trigger={<Button>Open example command palette</Button>} items={[{id:'new',label:'Create local example',keywords:['add','new'],onSelect:()=>setStatus('Local example created.')},{id:'review',label:'Mark example reviewed',onSelect:()=>setStatus('Example marked reviewed.')} ]}/><p role="status">{status}</p></UIProvider>;}`},
  {id:'basic-advanced-table',componentId:'advanced-table',title:'Select and act on local records',description:'Column controls and bulk actions operate on a complete in-memory dataset.',preview:'on-demand',keyboard:['Tab reaches selection and column controls.','Space changes row selection; the bulk action removes selected local rows.'],states:['Unselected','Selected','Bulk action','Column visibility'],source:`'use client';
import {useState} from 'react';
import {Button,DataTable,UIProvider,type Column} from '@bld8/ui';
import '@bld8/ui/styles.css';
type Row={id:string;name:string;status:string};
const columns:Column<Row>[]=[{key:'name',header:'Name',cell:row=>row.name,sortValue:row=>row.name},{key:'status',header:'Status',cell:row=>row.status,sortValue:row=>row.status}];
export default function BulkTableExample(){const [rows,setRows]=useState<Row[]>([{id:'one',name:'Example review',status:'Active'},{id:'two',name:'Example notes',status:'Draft'}]),[selected,setSelected]=useState<string[]>([]);return <UIProvider><DataTable caption="Example local projects" rows={rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} selectable selectedKeys={selected} onSelectedKeysChange={setSelected} columnVisibility searchText={row=>row.name} renderBulkActions={records=><Button onClick={()=>{setRows(current=>current.filter(row=>!records.some(record=>record.id===row.id)));setSelected([]);}}>Remove selected example rows</Button>}/></UIProvider>;}`},
  {id:'basic-table',componentId:'table',title:'Sort and search a small local list',description:'The complete source includes its row type, data, columns and text search function.',preview:'on-demand',keyboard:['Tab reaches search, sort headings and page controls.','Enter toggles a sortable column.'],states:['Rows','Sorted','Filtered','Empty results'],source:`'use client';
import {DataTable,type Column} from '@bld8/ui';
import '@bld8/ui/styles.css';
type Row={id:string;name:string;tasks:number};
const rows:Row[]=[{id:'one',name:'Example interface review',tasks:3},{id:'two',name:'Example notes',tasks:5},{id:'three',name:'Example reference library',tasks:2}];
const columns:Column<Row>[]=[{key:'name',header:'Project',cell:row=>row.name,sortValue:row=>row.name},{key:'tasks',header:'Tasks',cell:row=>row.tasks,sortValue:row=>row.tasks,align:'end'}];
export default function TableExample(){return <DataTable caption="Example project list" rows={rows} columns={columns} rowKey={row=>row.id} searchText={row=>row.name} pageSize={2}/>;}`},
];
