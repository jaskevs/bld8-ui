'use client';
import { useEffect, useRef, useState } from 'react';
import { Archive, Check, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, DataTable, Dialog, EditableCell, Field, Form, FormErrorSummary, Input, Textarea, createTableCSV, defaultTableQuery, useForm, useUnsavedChanges, type Column, type TableQuery } from '@bld8/ui';
import { OutlineValidationError, validateOutline, type OutlineProject, type OutlineRepository, type OutlineValues } from './outline-repository.js';

const empty:OutlineValues={name:'',due:'',notes:'',status:'Planned'};
function ProjectEditor({project,repository,onSaved,onClose}:{project:OutlineProject|null;repository:OutlineRepository;onSaved:()=>void;onClose:()=>void}) {
  const [discard,setDiscard]=useState(false);
  const form=useForm<OutlineValues>({
    initialValues:project?{name:project.name,due:project.due,notes:project.notes,status:project.status}:empty,
    validate:validateOutline,
    onSubmit:async(values,{signal})=>{try{const saved=await repository.save(values,project,signal);return {values:saved};}catch(error){if(error instanceof OutlineValidationError)return {fieldErrors:error.fields};throw error;}},
    onSuccess:onSaved,
  });
  useUnsavedChanges(form.dirty);
  const close=()=>{if(form.pending)return;if(form.dirty)setDiscard(true);else onClose();};
  return <Dialog title={project?'Edit project':'Plan a project'} description="A name, a review date and the context worth keeping." open onOpenChange={open=>{if(!open)close();}}>
    <Form form={form} className="bblocks-stack">
      <FormErrorSummary error={form.error} />
      <Field label="Project name" required error={form.errors.name}><Input name="name" value={form.values.name} onChange={event=>form.setField('name',event.target.value)} disabled={form.pending} autoComplete="off" maxLength={80} /></Field>
      <div className="bblocks-form-grid"><Field label="Review date" required error={form.errors.due}><Input name="due" type="date" value={form.values.due} onChange={event=>form.setField('due',event.target.value)} disabled={form.pending} /></Field><label className="bui-field"><span className="bui-label">Status</span><select name="status" className="bui-input" value={form.values.status} onChange={event=>form.setField('status',event.target.value as OutlineValues['status'])} disabled={form.pending}>{['Planned','Ready','Archived'].map(value=><option key={value}>{value}</option>)}</select></label></div>
      <Field label="Notes to self" hint="Keep the useful context close." error={form.errors.notes}><Textarea name="notes" value={form.values.notes} maxLength={1000} onChange={event=>form.setField('notes',event.target.value)} disabled={form.pending} /></Field>
      {discard && <Alert title="Discard this draft?" tone="warning"><p>Your unsaved changes will be lost.</p><div className="bblocks-inline-actions"><Button variant="danger" size="sm" onClick={onClose}>Discard changes</Button><Button variant="secondary" size="sm" onClick={()=>setDiscard(false)}>Keep editing</Button></div></Alert>}
      <div className="bblocks-heading"><span className="bblocks-note">{form.pending?'Saving…':form.dirty?'Unsaved changes':'Ready when you are.'}</span><div className="bblocks-inline-actions"><Button variant="secondary" onClick={close} disabled={form.pending}>Cancel</Button><Button type="submit" loading={form.pending}>{project?'Save project':'Add project'}</Button></div></div>
    </Form>
  </Dialog>;
}
export function OutlineProjects({repository}:{repository:OutlineRepository}) {
  const [query,setQuery]=useState<TableQuery>({...defaultTableQuery});const [rows,setRows]=useState<OutlineProject[]>([]);const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [revision,setRevision]=useState(0);
  const [selected,setSelected]=useState<string[]>([]);const [editor,setEditor]=useState<{project:OutlineProject|null}|null>(null);
  const [deleting,setDeleting]=useState<OutlineProject|null>(null);const [mutation,setMutation]=useState(false);const [message,setMessage]=useState('');const [actionError,setActionError]=useState('');
  const [density,setDensity]=useState<'comfortable'|'compact'>('comfortable');
  const listRun=useRef(0);const tableFocus=useRef<HTMLDivElement>(null);
  const origin=useRef<HTMLElement|null>(null);const operation=useRef<AbortController|null>(null);
  useEffect(()=>()=>operation.current?.abort(),[]);
  useEffect(()=>{const run=++listRun.current;const controller=new AbortController();setLoading(true);setError('');repository.list(query,controller.signal).then(result=>{if(controller.signal.aborted || run!==listRun.current)return;const last=Math.max(1,Math.ceil(result.total/query.pageSize));if(query.page>last){setQuery(current=>({...current,page:last}));return;}setRows(result.rows);setTotal(result.total);}).catch(error=>{if(!controller.signal.aborted && run===listRun.current)setError(error instanceof Error?error.message:'Unable to load projects.');}).finally(()=>{if(!controller.signal.aborted && run===listRun.current)setLoading(false);});return()=>controller.abort();},[query,revision,repository]);
  useEffect(()=>{const refresh=()=>setRevision(value=>value+1);window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh);},[]);
  function openEditor(project:OutlineProject|null){origin.current=document.activeElement as HTMLElement;setEditor({project});}
  function closeEditor(){setEditor(null);requestAnimationFrame(()=>origin.current?.focus());}
  async function mutate(action:(signal:AbortSignal)=>Promise<void>,success:string){if(operation.current)return;const controller=new AbortController();operation.current=controller;setMutation(true);setActionError('');try{await action(controller.signal);if(controller.signal.aborted)return;setSelected([]);setDeleting(null);setMessage(success);setRevision(value=>value+1);}catch(error){if(!controller.signal.aborted)setActionError(error instanceof Error?error.message:'Changes could not be saved.');}finally{if(operation.current===controller){operation.current=null;setMutation(false);}}}
  async function saveCell(row:OutlineProject,key:'name'|'due'|'status',value:string,signal:AbortSignal){
    let saved:OutlineProject;
    try{saved=await repository.save({...row,[key]:value},row,signal);}
    catch(error){if(error instanceof OutlineValidationError)throw new Error(error.fields[key] ?? error.message);throw error;}
    if(signal.aborted)return;setRows(current=>current.map(item=>item.id===saved.id?saved:item));setMessage('Project saved.');
    const run=++listRun.current;
    try{const result=await repository.list(query,signal);if(signal.aborted||run!==listRun.current)return;setRows(result.rows);setTotal(result.total);if(!result.rows.some(item=>item.id===row.id))requestAnimationFrame(()=>tableFocus.current?.focus());}
    catch(error){if(!signal.aborted&&run===listRun.current)setActionError('The project was saved, but the list could not refresh. Use the search or reload the view to try again.');}
  }
  const columns:Column<OutlineProject>[]=[
    {key:'name',header:'Project',hideable:false,pinned:'start',width:260,minWidth:160,sortValue:row=>row.name,cell:row=><EditableCell label={'project name for '+row.name} value={row.name} display={<Button variant="ghost" size="sm" className="bblocks-project-name" onClick={()=>openEditor(row)}>{row.name}</Button>} disabled={mutation} revision={row.version} validate={value=>validateOutline({...row,name:value}).name} onSave={(value,{signal,revision})=>saveCell({...row,version:Number(revision ?? row.version)},'name',value,signal)} />},
    {key:'due',header:'Review date',width:180,sortValue:row=>row.due,cell:row=><EditableCell label={'review date for '+row.name} value={row.due} type="date" display={<time dateTime={row.due}>{row.due}</time>} disabled={mutation} revision={row.version} validate={value=>validateOutline({...row,due:value}).due} onSave={(value,{signal,revision})=>saveCell({...row,version:Number(revision ?? row.version)},'due',value,signal)} />},
    {key:'status',header:'Status',width:180,sortValue:row=>row.status,cell:row=><EditableCell label={'status for '+row.name} value={row.status} display={<Badge tone={row.status==='Ready'?'success':'neutral'}>{row.status}</Badge>} disabled={mutation} revision={row.version} options={['Planned','Ready','Archived'].map(value=>({value,label:value}))} onSave={(value,{signal,revision})=>saveCell({...row,version:Number(revision ?? row.version)},'status',value,signal)} />},
    {key:'actions',header:'Actions',width:180,minWidth:160,cell:row=><div className="bblocks-inline-actions"><Button size="sm" variant="ghost" aria-label={'Edit '+row.name} leadingIcon={Pencil} onClick={()=>openEditor(row)}>Edit</Button><Button size="sm" variant="ghost" aria-label={'Delete '+row.name} onClick={()=>{setActionError('');setDeleting(row);}}><Trash2 size={16} aria-hidden="true" /></Button></div>},
  ];
  function download(){const url=URL.createObjectURL(new Blob(['\uFEFF'+createTableCSV(rows,columns)],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download='outline-current-page.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Current page exported.');}
  return <section className="bblocks-panel" aria-label="Outline projects"><div className="bblocks-heading"><div><p className="bblocks-kicker">PROJECTS / {total.toString().padStart(2,'0')}</p><h2>A little room to plan.</h2><p className="bblocks-muted">The next step, and the details behind it.</p></div><Button leadingIcon={Plus} onClick={()=>openEditor(null)}>Plan project</Button></div>
    <div className="bblocks-heading bblocks-table-options"><label className="bui-field"><span className="bui-sr-only">Table density</span><select aria-label="Table density" className="bui-input" value={density} onChange={event=>setDensity(event.target.value as typeof density)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><Button leadingIcon={Download} size="sm" variant="ghost" onClick={download} disabled={loading || !!error || !rows.length}>Export current page</Button></div>
    {actionError && !deleting && <Alert title="Project update needs attention" tone="danger" live>{actionError}</Alert>}
    <div ref={tableFocus} tabIndex={-1} aria-label="Project table updates"><DataTable caption="Outline projects" rows={rows} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} server={{query,onQueryChange:setQuery,totalRows:total}} loading={loading} error={error} onRetry={()=>setRevision(value=>value+1)} columnVisibility resizableColumns density={density} selectable selectedKeys={selected} onSelectedKeysChange={setSelected} filters={[{key:'status',label:'Statuses',options:['Planned','Ready','Archived'].map(value=>({value,label:value})),value:row=>row.status}]} renderSelectedActions={keys=><><Button size="sm" leadingIcon={Check} loading={mutation} onClick={()=>mutate(signal=>repository.setStatus(keys,'Ready',signal),keys.length+' projects marked ready.')}>Mark ready</Button><Button size="sm" variant="secondary" leadingIcon={Archive} disabled={mutation} onClick={()=>mutate(signal=>repository.setStatus(keys,'Archived',signal),keys.length+' projects archived.')}>Archive</Button></>} /></div>
    <p role="status" className="bblocks-status">{message}</p>
    {editor && <ProjectEditor project={editor.project} repository={repository} onClose={closeEditor} onSaved={()=>{setMessage(editor.project?'Project saved.':'Project added.');setQuery(current=>({...current,page:1}));setRevision(value=>value+1);closeEditor();}} />}
    {deleting && <Dialog title="Delete project?" description={'Delete '+deleting.name+' permanently from this workspace.'} open onOpenChange={open=>{if(!open&&!mutation)setDeleting(null);}}>{actionError && <Alert title="Unable to delete project" tone="danger" live>{actionError}</Alert>}<div className="bblocks-inline-actions"><Button variant="secondary" disabled={mutation} onClick={()=>setDeleting(null)}>Keep project</Button><Button variant="danger" loading={mutation} onClick={()=>mutate(signal=>repository.remove(deleting,signal),'Project deleted.')}>Delete project</Button></div></Dialog>}
  </section>;
}
