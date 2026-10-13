'use client';
import { useState, type FormEvent } from 'react';
import { CalendarDays, Check, Plus } from 'lucide-react';
import { Alert, Badge, Button, DataTable, DatePicker, Dialog, Field, FileUpload, Icon, Input, MultiSelect, formatDateValue, type Column } from '@bld8/ui';

export interface PlannedProject { id:string; name:string; due:string; disciplines:string[]; status:'Planned'|'Ready'; attachmentCount:number }
export interface ProjectDraft { name:string; due:Date; disciplines:string[]; attachments:File[] }
export interface ProjectPlannerProps { initialProjects?:PlannedProject[]; onCreate?:(draft:ProjectDraft)=>Promise<PlannedProject>; onProjectsChange?:(projects:PlannedProject[])=>void }
const disciplines=['Design','Engineering','Research','Documentation'].map(label=>({value:label.toLowerCase(),label}));
const initial:PlannedProject[]=[
  {id:'1',name:'Keyboard review',due:'2026-10-20',disciplines:['engineering'],status:'Planned',attachmentCount:2},
  {id:'2',name:'Interface studies',due:'2026-10-24',disciplines:['design','research'],status:'Planned',attachmentCount:1},
  {id:'3',name:'Form patterns',due:'2026-10-28',disciplines:['engineering','documentation'],status:'Ready',attachmentCount:0},
];
const columns:Column<PlannedProject>[]=[
  {key:'name',header:'Project',hideable:false,sortValue:row=>row.name,cell:row=><strong>{row.name}</strong>},
  {key:'due',header:'Review date',sortValue:row=>row.due,cell:row=><span className="bblocks-date"><Icon icon={CalendarDays} size={14} /><time dateTime={row.due}>{row.due.split('-').reverse().join('/')}</time></span>},
  {key:'disciplines',header:'Disciplines',cell:row=><span className="bblocks-tags">{row.disciplines.map(value=><Badge key={value}>{disciplines.find(option=>option.value===value)?.label ?? value}</Badge>)}</span>},
  {key:'status',header:'Status',sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Ready' ? 'success' : 'neutral'}>{row.status}</Badge>},
];
export function ProjectPlanner({initialProjects=initial,onCreate,onProjectsChange}:ProjectPlannerProps) {
  const [projects,setProjects]=useState(initialProjects); const [selected,setSelected]=useState<string[]>([]);
  const [open,setOpen]=useState(false); const [name,setName]=useState(''); const [due,setDue]=useState<Date|null>(null);
  const [tags,setTags]=useState<string[]>(['design']); const [files,setFiles]=useState<File[]>([]);
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const change=(next:PlannedProject[])=>{setProjects(next);onProjectsChange?.(next);};
  async function create(event:FormEvent) {
    event.preventDefault(); if(!name.trim()) {setError('Enter a project name.');return;} if(!due) {setError('Choose a review date.');return;}
    if(!tags.length) {setError('Choose at least one discipline.');return;} setError('');setBusy(true);
    try {
      const project=onCreate ? await onCreate({name:name.trim(),due,disciplines:tags,attachments:files}) : {id:crypto.randomUUID(),name:name.trim(),due:formatDateValue(due),disciplines:tags,status:'Planned' as const,attachmentCount:files.length};
      change([...projects,project]);setName('');setDue(null);setTags(['design']);setFiles([]);setOpen(false);setMessage(onCreate ? 'Project added.' : 'Project metadata added for this session. Attachments were not uploaded.');
    } catch(cause) {setError(cause instanceof Error ? cause.message : 'Unable to create the project. Try again.');} finally {setBusy(false);}
  }
  return <section className="bblocks-panel" aria-label="Project planner">
    <div className="bblocks-heading"><div><p className="bblocks-kicker">THE NEXT USEFUL STEP</p><h2>A little room to plan.</h2><p className="bblocks-muted">Projects, disciplines and review dates in one place.</p></div><Dialog title="Plan a project" description="Give the work a name and a review date." open={open} onOpenChange={next=>{if(!busy)setOpen(next);}} trigger={<Button leadingIcon={Plus}>Plan project</Button>}>
      <form className="bblocks-stack" noValidate onSubmit={create}>
        <Field label="Project name" required error={error && !name.trim() ? error : undefined}><Input value={name} onChange={event=>{setName(event.target.value);setError('');}} disabled={busy} autoComplete="off" /></Field>
        <DatePicker label="Review date" value={due} onValueChange={setDue} disabled={busy} error={error && name.trim() && !due ? error : undefined} />
        <MultiSelect label="Disciplines" options={disciplines} value={tags} onValueChange={setTags} disabled={busy} error={error && name.trim() && due && !tags.length ? error : undefined} />
        {error && name.trim() && due && tags.length>0 && <Alert title="Unable to add project" tone="danger" live>{error}</Alert>}
        <FileUpload label="Reference files" value={files} onValueChange={setFiles} accept=".pdf,.txt,.png,.jpg" maxFiles={3} maxSize={5*1024*1024} disabled={busy} />
        <p className="bblocks-note">{onCreate ? 'Your create callback handles persistence and attached files.' : 'This preview stores metadata in memory. Files are not uploaded or saved.'}</p>
        <Button type="submit" loading={busy}>Add project</Button>
      </form>
    </Dialog></div>
    <div className="bblocks-planner-summary"><span><strong>{projects.length}</strong> projects</span><span><strong>{projects.filter(project=>project.status==='Ready').length}</strong> ready for review</span><span><strong>{new Set(projects.flatMap(project=>project.disciplines)).size}</strong> disciplines</span></div>
    <DataTable caption="Planned projects" rows={projects} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} searchText={row=>row.name+' '+row.disciplines.join(' ')} columnVisibility selectable selectedKeys={selected} onSelectedKeysChange={setSelected} filters={[{key:'status',label:'Statuses',options:[{value:'Planned',label:'Planned'},{value:'Ready',label:'Ready'}],value:row=>row.status}]} renderBulkActions={chosen=><Button size="sm" leadingIcon={Check} onClick={()=>{change(projects.map(project=>chosen.some(row=>row.id===project.id) ? {...project,status:'Ready'} : project));setSelected([]);setMessage(chosen.length+' projects marked ready.');}}>Mark ready</Button>} />
    <p role="status" className="bblocks-status">{message}</p>
  </section>;
}
