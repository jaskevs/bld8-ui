/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useRef,useState,type RefObject} from 'react';
import {Check,FileClock,RefreshCw} from 'lucide-react';
import {Alert,Badge,Button,Drawer,DatePicker,Field,Form,FormErrorSummary,Icon,Input,Select,Textarea,formatDateValue,useForm,useUnsavedChanges} from '@bld8/ui';
import {OutlineConflictError,OutlineValidationError,validateOutline,type OutlineProject,type OutlineRepository,type OutlineValues} from './outline-repository.js';
import {outlineFields,projectValues,rebaseOutlineDraft,type OutlineDraftStore} from './outline-drafts.js';
import {OutlineProjectActivity} from './outline-project-activity.js';

const empty:OutlineValues={name:'',due:'',notes:'',status:'Planned'};
const dateValue=(value:string)=>value?new Date(value+'T12:00:00'):null;
export function OutlineProjectEditor({project,repository,drafts,finalFocus,onSaved,onClosed,onDraftKept}:{project:OutlineProject|null;repository:OutlineRepository;drafts:OutlineDraftStore;finalFocus:RefObject<HTMLElement|null>;onSaved:(saved:OutlineProject)=>void;onClosed:()=>void;onDraftKept:(message:string)=>void}){
  const [recovered,setRecovered]=useState(()=>drafts.get(project?.id??null));
  const previous=useRef(recovered?.previous??project);
  const [latest,setLatest]=useState(project);const [open,setOpen]=useState(true);const [ready,setReady]=useState(false);
  const [leaving,setLeaving]=useState(false);const [draftProblem,setDraftProblem]=useState(drafts.problem);
  const [activityPending,setActivityPending]=useState(false);
  const [needsLatest,setNeedsLatest]=useState(false);const [missing,setMissing]=useState(false);const [checking,setChecking]=useState(false);const [readError,setReadError]=useState('');
  const heading=useRef<HTMLHeadingElement>(null),name=useRef<HTMLInputElement>(null),keepEditing=useRef<HTMLButtonElement>(null),refresh=useRef<AbortController|null>(null);
  const formId=useId();
  const form=useForm<OutlineValues>({initialValues:project?projectValues(project):empty,validate:validateOutline,
    onSubmit:async(values,{signal})=>{
      if(activityPending)throw new Error('Wait for the comment to finish before saving.');
      try{const saved=await repository.save(values,previous.current,signal);previous.current=saved;drafts.clear(project?.id??null);setDraftProblem(drafts.problem);onSaved(saved);setOpen(false);return{values:projectValues(saved)};}
      catch(error){if(error instanceof OutlineValidationError)return{fieldErrors:error.fields};if(project&&(error instanceof OutlineConflictError||(error&&typeof error==='object'&&'status' in error&&error.status===409)))setNeedsLatest(true);throw error;}
    },
  });
  const conflict=!!latest&&!!previous.current&&latest.version!==previous.current.version;
  useUnsavedChanges(open&&form.dirty);
  useEffect(()=>{if(recovered)for(const key of outlineFields)form.setField(key,recovered.values[key]);setReady(true);return()=>refresh.current?.abort();},[]);
  useEffect(()=>{
    if(!ready||!open||form.pending)return;
    if(form.dirty)drafts.put(previous.current,form.values);
    else if(!conflict&&drafts.get(project?.id??null)&&drafts.clear(project?.id??null))setRecovered(null);
    setDraftProblem(drafts.problem);
  },[ready,open,form.values,form.dirty,form.pending,drafts,conflict]);
  useEffect(()=>{if(leaving)keepEditing.current?.focus({preventScroll:true});},[leaving]);
  function close(){if(form.pending||activityPending)return;if(form.dirty)setLeaving(true);else{refresh.current?.abort();setOpen(false);}}
  function keep(){if(form.pending||activityPending)return;drafts.put(previous.current,form.values);setDraftProblem(drafts.problem);onDraftKept(drafts.recoverable?'Draft kept in this tab.':'Draft kept while this page stays open.');refresh.current?.abort();setOpen(false);}
  function discard(){if(form.pending||activityPending)return;if(!drafts.clear(project?.id??null)){setDraftProblem(drafts.problem);return;}refresh.current?.abort();setOpen(false);}
  async function loadLatest(){
    if(!project||!repository.get||refresh.current)return;const controller=new AbortController();refresh.current=controller;setChecking(true);setReadError('');
    try{const next=await repository.get(project.id,controller.signal);if(controller.signal.aborted)return;if(next&&previous.current&&next.version<previous.current.version)throw Error('The service returned an older project version. Try again.');setLatest(next);setMissing(!next);setNeedsLatest(false);}
    catch(error){if(!controller.signal.aborted)setReadError(error instanceof Error?error.message:'Could not load the latest project. Try again.');}
    finally{if(refresh.current===controller){refresh.current=null;setChecking(false);}}
  }
  function useLatest(keepEdits:boolean){
    if(!project){if(!drafts.clear(null)){setDraftProblem(drafts.problem);return;}setDraftProblem(drafts.problem);form.reset(empty);setRecovered(null);setLeaving(false);name.current?.focus({preventScroll:true});return;}
    if(!latest||!previous.current)return;
    const next=keepEdits?rebaseOutlineDraft(previous.current,form.values,latest):projectValues(latest);
    if(!keepEdits&&!drafts.clear(project?.id??null)){setDraftProblem(drafts.problem);return;}
    previous.current=latest;form.reset(projectValues(latest));for(const key of outlineFields)form.setField(key,next[key]);
    setRecovered(null);setLeaving(false);setNeedsLatest(false);setReadError('');name.current?.focus({preventScroll:true});
    if(keepEdits)drafts.put(latest,next);setDraftProblem(drafts.problem);
  }
  const footer=<div className="bblocks-project-footer">
    {leaving&&<Alert title="Discard this draft?" tone="warning"><p>You can keep it for later or discard your changes.</p><div className="bblocks-project-leave"><Button size="sm" variant="secondary" onClick={keep}>Keep draft & close</Button><Button size="sm" variant="danger" onClick={discard}>Discard changes</Button><Button ref={keepEditing} size="sm" variant="ghost" onClick={()=>setLeaving(false)}>Keep editing</Button></div></Alert>}
    <div className="bblocks-project-save-row"><p role="status"><Icon icon={form.dirty?FileClock:Check} size={15}/>{activityPending?'Posting comment…':form.pending?'Saving project…':form.dirty?(drafts.recoverable?'Draft kept in this tab':'Unsaved changes'):'No unsaved changes'}</p><div className="bblocks-inline-actions"><Button variant="secondary" onClick={close} disabled={form.pending||activityPending}>Cancel</Button><Button type="submit" form={formId} loading={form.pending} disabled={activityPending||conflict||needsLatest||missing||checking||(!!project&&!form.dirty)}>{project?'Save project':'Add project'}</Button></div></div>
  </div>;
  return <Drawer side="right" title={project?'Edit project':'Plan a project'} description="Project details, with room for the context." className="bblocks-project-drawer" open={open} onOpenChange={next=>{if(!next)close();}} onOpenChangeComplete={next=>{if(!next)onClosed();}} initialFocus={project?heading:name} finalFocus={finalFocus} footer={footer} closeDisabled={form.pending||activityPending}>
    <div className="bblocks-project-summary"><div><p className="bblocks-kicker">{project?'PROJECT DETAILS':'A NEW PROJECT'}</p><h3 ref={heading} tabIndex={-1}>{project?.name??'Make room for the next step.'}</h3></div><Badge tone={form.values.status==='Ready'?'success':'neutral'}>{form.values.status}</Badge></div>
    <Form id={formId} form={form} className="bblocks-project-form">
      {recovered&&!conflict&&<Alert title="Recovered draft"><p>These changes have not been saved.</p><Button size="sm" variant="ghost" onClick={()=>useLatest(false)}>{project?'Discard recovered draft':'Discard draft and start again'}</Button></Alert>}
      <FormErrorSummary error={form.error}/>
      {(conflict||needsLatest)&&<Alert title="This project has changed" tone="warning" live><p>Your draft is safe. Compare it with the latest saved version before continuing.</p>{conflict&&latest&&<><dl className="bblocks-project-comparison">{outlineFields.map(key=><div key={key}><dt>{key==='due'?'Review date':key==='notes'?'Notes to self':key==='name'?'Project name':'Status'}</dt><dd>{latest[key]||'No notes'}</dd></div>)}</dl><div className="bblocks-inline-actions"><Button size="sm" onClick={()=>useLatest(true)}>Keep my edits on latest</Button><Button size="sm" variant="secondary" onClick={()=>useLatest(false)}>Use saved project</Button></div></>}</Alert>}
      {missing&&<Alert title="Project no longer available" tone="warning" live>The saved project was removed. Your draft remains here to copy or keep.</Alert>}
      {readError&&<Alert title="Could not refresh project" tone="danger" live>{readError}</Alert>}
      {project&&repository.get&&<Button variant="ghost" size="sm" leadingIcon={RefreshCw} loading={checking} disabled={form.pending} onClick={loadLatest}>Load latest project</Button>}
      {draftProblem&&<Alert title="Draft recovery needs attention" tone="warning" live>{draftProblem}</Alert>}
      <Field label="Project name" required error={form.errors.name}><Input ref={name} name="name" value={form.values.name} onChange={event=>form.setField('name',event.target.value)} disabled={form.pending} autoComplete="off" maxLength={80}/></Field>
      <div className="bblocks-form-grid"><DatePicker label="Review date" required name="due" value={dateValue(form.values.due)} defaultMonth={dateValue(form.values.due)??new Date()} onValueChange={value=>form.setField('due',formatDateValue(value??undefined))} error={form.errors.due} disabled={form.pending}/><Select label="Status" name="status" value={form.values.status} onValueChange={value=>{if(value)form.setField('status',value as OutlineValues['status']);}} options={['Planned','Ready','Archived'].map(value=>({value,label:value}))} error={form.errors.status} disabled={form.pending}/></div>
      <Field label="Notes to self" hint="The decisions and details worth keeping." error={form.errors.notes}><Textarea name="notes" value={form.values.notes} maxLength={1000} onChange={event=>form.setField('notes',event.target.value)} disabled={form.pending}/></Field>
      <p className="bblocks-note">{project?'Edits save together. The list keeps its current view.':'A name, a review date and a little context.'}</p>
    </Form>
    {project&&repository.history&&<OutlineProjectActivity projectId={project.id} history={repository.history} drafts={drafts} disabled={form.pending||checking||missing} onPendingChange={setActivityPending}/>}
  </Drawer>;
}
