/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useId,useMemo,useRef,useState,type FormEvent} from 'react';
import {Check,Columns3,RefreshCw,RotateCcw,Save,Undo2,Redo2} from 'lucide-react';
import {Alert,Badge,Button,DataGrid,Dialog,Drawer,EmptyState,Field,FilterBuilder,Input,Pagination,Reveal,Select,Spinner,UploadQueue,emptyFilterQuery,filterQueryKey,validateFilterQuery,type AnyFilterQuery,type UploadFileContext,type UploadReceipt} from '@bld8/ui';
import {parseDataValue,validateDataChanges,type BatchResult,type DataBatchRequest,type DataCellError,type DataChange,type DataEdit,type DataQuery,type DataSource} from '@bld8/ui/data-workspace-state';
import {createMemoryIssueDataSource,issueDataColumns} from './issue-data-source.js';
import {issueFields,type Issue} from './issue-repository.js';
import {DataWorkspaceFilters} from './data-workspace-filters.js';

export interface DataWorkspaceProps {
  /** Stable service adapter. The default uses authored records in memory. */
  dataSource?:DataSource<Issue>;
  /** The host receives the inspected record ID and owns authorisation/storage. */
  onUploadFile?:(file:globalThis.File,context:UploadFileContext&{recordId:string})=>Promise<UploadReceipt>;
  className?:string;
}
type Draft={base:Issue;values:Record<string,unknown>};
type Drafts=Record<string,Draft>;
type History={past:Drafts[];present:Drafts;future:Drafts[]};
const initialQuery=():DataQuery=>({search:'',filters:emptyFilterQuery(),sorts:[],page:1,pageSize:10});
const editableColumns=issueDataColumns.filter(column=>column.editable!==false&&column.key!=='id'&&column.key!=='revision');
const emptyHistory=():History=>({past:[],present:{},future:[]});
const copyDrafts=(drafts:Drafts):Drafts=>Object.fromEntries(Object.entries(drafts).map(([id,draft])=>[id,{base:{...draft.base},values:{...draft.values}}]));
const sameDrafts=(left:Drafts,right:Drafts)=>JSON.stringify(left)===JSON.stringify(right);
const valueLabel=(key:string,value:unknown)=>issueDataColumns.find(column=>column.key===key)?.options?.find(option=>option.value===value)?.label??(value===''?'No value':String(value??''));
const fieldLabel=(key:string)=>issueDataColumns.find(column=>column.key===key)?.label??key;
const draftChanges=(drafts:Drafts):DataChange<Issue>[]=>Object.entries(drafts).map(([id,draft])=>({id,expectedRevision:draft.base.revision,values:{...draft.values} as DataChange<Issue>['values']}));
function draftErrors(drafts:Drafts):DataCellError[]{
  if(!Object.keys(drafts).length)return [];
  const changes=draftChanges(drafts),errors:DataCellError[]=[];
  for(const [id,draft] of Object.entries(drafts))for(const [key,value] of Object.entries(draft.values)){
    const column=issueDataColumns.find(column=>column.key===key);
    if(!column){errors.push({id,key,message:'This field is not editable.'});continue;}
    const parsed=parseDataValue(column,value);if(parsed.error)errors.push({id,key,message:parsed.error});
  }
  for(const error of validateDataChanges(Object.values(drafts).map(draft=>draft.base),issueDataColumns,changes))if(!errors.some(current=>current.id===error.id&&current.key===error.key))errors.push(error);
  return errors;
}

/** A bounded server-paged editing workflow. Draft undo never rewrites saved history. */
export function DataWorkspace({dataSource,onUploadFile,className}:DataWorkspaceProps){
  const fallback=useRef<DataSource<Issue>|null>(null);if(!fallback.current)fallback.current=createMemoryIssueDataSource();
  const source=dataSource??fallback.current,renderedSource=useRef(source);renderedSource.current=source;
  const root=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null),returnFocus=useRef<HTMLElement|null>(null),saveButton=useRef<HTMLButtonElement>(null),id=useId();
  const [query,setQuery]=useState<DataQuery>(initialQuery),[filterDraft,setFilterDraft]=useState<AnyFilterQuery>(emptyFilterQuery),[filterErrors,setFilterErrors]=useState<Record<string,string>>({}),[filtersOpen,setFiltersOpen]=useState(false);
  const [rows,setRows]=useState<Issue[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[reload,setReload]=useState(0);
  const [history,setHistory]=useState<History>(emptyHistory),historyRef=useRef(history);historyRef.current=history;
  const [serverErrors,setServerErrors]=useState<DataCellError[]>([]),[conflicts,setConflicts]=useState<Issue[]>([]),[saveError,setSaveError]=useState(''),[notice,setNotice]=useState('');
  const [saving,setSaving]=useState(false),[uncertain,setUncertain]=useState(false),uncertainRef=useRef(false),[reviewOpen,setReviewOpen]=useState(false),[discardOpen,setDiscardOpen]=useState(false),[detailId,setDetailId]=useState<string|null>(null),[detailOpen,setDetailOpen]=useState(false);
  const [detailDraft,setDetailDraft]=useState<Record<string,unknown>>({}),[detailErrors,setDetailErrors]=useState<DataCellError[]>([]);
  const cache=useRef(new Map<string,Issue>()),mutation=useRef<AbortController|null>(null),request=useRef<{fingerprint:string;request:DataBatchRequest<Issue>}|null>(null),mounted=useRef(false),sourceGeneration=useRef(0),queryKey=JSON.stringify(query),renderedQuery=useRef(queryKey);renderedQuery.current=queryKey;
  const historySource=useRef(source),sourceReady=historySource.current===source,drafts=sourceReady?history.present:{},entries=Object.entries(drafts),localErrors=useMemo(()=>draftErrors(drafts),[drafts]);
  const errors=[...localErrors,...serverErrors.filter(error=>!localErrors.some(current=>current.id===error.id&&current.key===error.key))];
  const dirtyCells=entries.flatMap(([id,draft])=>Object.keys(draft.values).map(key=>({id,key}))),displayRows=sourceReady?rows.map(row=>drafts[row.id]?{...drafts[row.id].base,...drafts[row.id].values} as Issue:row):[];
  const detailBase=detailId?(drafts[detailId]?.base??cache.current.get(detailId)):undefined;
  const hasDrafts=entries.length>0,editLocked=saving||uncertain,filtersChanged=filterQueryKey(filterDraft)!==filterQueryKey(query.filters);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;mutation.current?.abort();sourceGeneration.current++;};},[]);
  useEffect(()=>{
    const previousWriteUnresolved=!!mutation.current||uncertainRef.current;
    sourceGeneration.current++;mutation.current?.abort();mutation.current=null;request.current=null;cache.current.clear();historySource.current=source;uncertainRef.current=false;setUncertain(false);
    const next=emptyHistory();historyRef.current=next;setHistory(next);setRows([]);setTotal(0);setServerErrors([]);setConflicts([]);setSaveError('');setNotice(previousWriteUnresolved?'The data source changed. A previous write may have committed; reconcile it with that service.':'');setSaving(false);setReviewOpen(false);setDiscardOpen(false);setDetailOpen(false);setDetailId(null);
  },[source]);
  useEffect(()=>{
    const controller=new AbortController(),generation=sourceGeneration.current;
    const current=()=>mounted.current&&!controller.signal.aborted&&renderedSource.current===source&&generation===sourceGeneration.current&&renderedQuery.current===queryKey;
    setLoading(true);setLoadError('');
    Promise.resolve().then(()=>source.load(query,{signal:controller.signal})).then(result=>{
      if(!current())return;
      for(const row of result.rows)cache.current.set(row.id,row);
      // Keep the page cache bounded while retaining originals belonging to drafts.
      if(cache.current.size>500){const keep=new Set([...result.rows.map(row=>row.id),...Object.keys(historyRef.current.present)]);for(const key of cache.current.keys())if(!keep.has(key))cache.current.delete(key);}
      setRows(result.rows);setTotal(result.total);const last=Math.max(1,Math.ceil(result.total/query.pageSize));if(query.page>last)setQuery(previous=>({...previous,page:last}));
    }).catch(()=>{if(current())setLoadError('The issue service is unavailable. Your view and pending changes are kept.');}).finally(()=>{if(current())setLoading(false);});
    return()=>controller.abort();
  },[source,queryKey,reload]);
  useEffect(()=>{
    if(!hasDrafts)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[hasDrafts]);
  function commitDrafts(next:Drafts,message?:string){
    if(mutation.current||uncertainRef.current||renderedSource.current!==source)return;
    const previous=historyRef.current;if(sameDrafts(previous.present,next))return;
    const state={past:[...previous.past,copyDrafts(previous.present)].slice(-50),present:next,future:[]};historyRef.current=state;setHistory(state);request.current=null;setServerErrors([]);setConflicts([]);setSaveError('');if(message)setNotice(message);
  }
  function edit(edits:DataEdit<Issue>[]){
    if(mutation.current||uncertainRef.current||renderedSource.current!==source||historySource.current!==source||!edits.length)return;
    const next=copyDrafts(historyRef.current.present);
    for(const edit of edits){
      const column=editableColumns.find(column=>column.key===edit.key),base=next[edit.id]?.base??cache.current.get(edit.id);
      if(!column||!base){setNotice('Paste only into editable cells from the loaded page. No changes were applied.');return;}
      const parsed=parseDataValue(column,edit.value),value=parsed.error?edit.value:parsed.value;
      const draft=next[edit.id]??{base:{...base},values:{}};
      if(Object.is(value,base[edit.key]))delete draft.values[edit.key];else draft.values[edit.key]=value;
      if(Object.keys(draft.values).length)next[edit.id]=draft;else delete next[edit.id];
    }
    if(Object.keys(next).length>100){setNotice('Keep a batch to 100 records. No changes from this action were applied.');return;}
    commitDrafts(next,edits.length>1?`${edits.length} cells added to your draft.`:'Draft updated. Review before saving.');
  }
  function undo(){if(mutation.current||uncertainRef.current)return;const previous=historyRef.current;if(!previous.past.length)return;const state={past:previous.past.slice(0,-1),present:previous.past.at(-1)!,future:[copyDrafts(previous.present),...previous.future].slice(0,50)};historyRef.current=state;setHistory(state);request.current=null;setServerErrors([]);setConflicts([]);setSaveError('');setNotice('Draft change undone. Saved records are unchanged.');}
  function redo(){if(mutation.current||uncertainRef.current)return;const previous=historyRef.current;if(!previous.future.length)return;const state={past:[...previous.past,copyDrafts(previous.present)].slice(-50),present:previous.future[0],future:previous.future.slice(1)};historyRef.current=state;setHistory(state);request.current=null;setServerErrors([]);setConflicts([]);setSaveError('');setNotice('Draft change restored.');}
  function inspect(row:Issue){returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:heading.current;setDetailId(row.id);setDetailDraft(Object.fromEntries(editableColumns.map(column=>[column.key,row[column.key]])));setDetailErrors([]);setDetailOpen(true);}
  function fixError(error:DataCellError){const draft=drafts[error.id];if(!draft||editLocked)return;setReviewOpen(false);inspect({...draft.base,...draft.values} as Issue);returnFocus.current=heading.current;setDetailErrors(errors.filter(current=>current.id===error.id));requestAnimationFrame(()=>document.querySelector<HTMLElement>('.bblocks-data-workspace-drawer [aria-invalid=true]')?.focus({preventScroll:true}));}
  function applyDetail(event:FormEvent){
    event.preventDefault();if(!detailId||!detailBase||editLocked)return;
    const edits=editableColumns.map(column=>({id:detailId,key:column.key,value:detailDraft[column.key]})),invalid=edits.flatMap(edit=>{const column=editableColumns.find(column=>column.key===edit.key)!;const parsed=parseDataValue(column,edit.value);return parsed.error?[{id:edit.id,key:edit.key,message:parsed.error}]:[];});
    if(invalid.length){setDetailErrors(invalid);requestAnimationFrame(()=>document.querySelector<HTMLElement>('.bblocks-data-workspace-drawer [aria-invalid=true]')?.focus({preventScroll:true}));return;}
    edit(edits);setDetailOpen(false);
  }
  function applyFilters(){const invalid=validateFilterQuery(filterDraft,issueFields);setFilterErrors(invalid);if(Object.keys(invalid).length){requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus());return;}setQuery(previous=>({...previous,filters:JSON.parse(JSON.stringify(filterDraft)),page:1}));setNotice('Filters applied. Drafts from other pages are kept.');}
  async function save(){
    if(mutation.current||!hasDrafts||renderedSource.current!==source)return;
    const currentDrafts=historyRef.current.present,invalid=draftErrors(currentDrafts);if(invalid.length){setServerErrors([]);setSaveError('Correct the marked fields before saving. Your draft is kept.');return;}
    const batchChanges=draftChanges(currentDrafts),fingerprint=JSON.stringify(batchChanges);
    if(!request.current||request.current.fingerprint!==fingerprint)request.current={fingerprint,request:{requestId:crypto.randomUUID(),changes:batchChanges}};
    const batch=request.current.request,controller=new AbortController(),generation=sourceGeneration.current;mutation.current=controller;setSaving(true);setSaveError('');setServerErrors([]);setConflicts([]);
    const current=()=>mounted.current&&!controller.signal.aborted&&renderedSource.current===source&&generation===sourceGeneration.current&&mutation.current===controller;
    try{
      const result:BatchResult<Issue>=await source.save(batch,{signal:controller.signal});if(!current())return;
      uncertainRef.current=false;setUncertain(false);
      if(result.ok){
        for(const row of result.rows)cache.current.set(row.id,row);
        const confirmed=new Map(result.rows.map(row=>[row.id,row]));
        setRows(previous=>previous.map(row=>confirmed.get(row.id)??row));
        const next=emptyHistory();historyRef.current=next;setHistory(next);request.current=null;setReviewOpen(false);setNotice(`${result.rows.length} ${result.rows.length===1?'record':'records'} saved in one batch.`);setReload(value=>value+1);requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));
      }else if(result.code==='conflict'){
        setConflicts(result.conflicts??[]);setSaveError('Some records changed after you started editing. Nothing in this batch was saved. Compare the latest values before trying again.');
      }else{setServerErrors(result.errors??[]);setSaveError('The service rejected this batch. Correct the marked fields; none of the changes were saved.');}
    }catch{if(current()){uncertainRef.current=true;setUncertain(true);setSaveError('The save could not be confirmed. Your draft is kept. Retry sends the same request ID so a committed batch can be reconciled.');}}
    finally{if(current()){mutation.current=null;setSaving(false);}}
  }
  function rebase(){
    if(saving)return;const next=copyDrafts(historyRef.current.present);
    for(const latest of conflicts){const draft=next[latest.id];if(!draft)continue;cache.current.set(latest.id,latest);draft.base={...latest};for(const key of Object.keys(draft.values))if(Object.is(draft.values[key],latest[key as keyof Issue]))delete draft.values[key];if(!Object.keys(draft.values).length)delete next[latest.id];}
    const remaining=Object.keys(next).length;commitDrafts(next,remaining?'Drafts now use the latest revisions. Review them again before saving.':'The latest records already contain your draft values. No further write is needed.');if(!remaining)setReviewOpen(false);setConflicts([]);setSaveError('');setReload(value=>value+1);
  }
  function stopWaiting(){uncertainRef.current=true;setUncertain(true);mutation.current?.abort();mutation.current=null;setSaving(false);setSaveError('Stopped waiting for the service. The batch may already have committed. Retry the unchanged draft to reconcile the same request ID.');requestAnimationFrame(()=>saveButton.current?.focus({preventScroll:true}));}
  function discard(){if(saving||uncertainRef.current)return;const next=emptyHistory();historyRef.current=next;setHistory(next);request.current=null;setServerErrors([]);setConflicts([]);setSaveError('');setDiscardOpen(false);setReviewOpen(false);setNotice('Pending changes discarded. Saved records are unchanged.');}
  const upload=useCallback(async(file:globalThis.File,context:UploadFileContext)=>{
    if(!onUploadFile||!detailId||renderedSource.current!==source)throw new Error('Choose a record and configure an upload service.');
    const receipt=await onUploadFile(file,{...context,recordId:detailId});
    if(renderedSource.current!==source||context.signal.aborted)throw new DOMException('Request aborted.','AbortError');
    return receipt;
  },[onUploadFile,detailId,source]);
  return <section ref={root} className={['bblocks-panel','bblocks-data-workspace',className].filter(Boolean).join(' ')} aria-label="Data workspace">
    <header className="bblocks-heading"><div><p className="bblocks-kicker">ONE DRAFT. ONE CLEAR SAVE.</p><h2 ref={heading} tabIndex={-1}>Work through the details.</h2><p className="bblocks-muted">{dataSource?'Connected through your data source. Changes stay in a draft until you save.':'Authored sample issues. Saved changes last for this page session.'}</p></div><Button variant="secondary" size="sm" leadingIcon={RefreshCw} disabled={saving} onClick={()=>setReload(value=>value+1)}>Reload records</Button></header>
    <div className="bblocks-data-workspace-toolbar"><Field label="Search issues"><Input density="compact" placeholder="ID or title…" maxLength={200} value={query.search} disabled={editLocked} onChange={event=>setQuery(previous=>({...previous,search:event.target.value,page:1}))}/></Field><Select density="compact" label="Records per page" value={String(query.pageSize)} options={[{value:'5',label:'5 records'},{value:'10',label:'10 records'},{value:'20',label:'20 records'}]} disabled={editLocked} onValueChange={value=>{if(value)setQuery(previous=>({...previous,pageSize:Number(value),page:1}));}}/></div>
    <DataWorkspaceFilters fields={issueFields} value={query.filters} disabled={editLocked} blocked={filtersChanged} advancedOpen={filtersOpen} advancedId={id+'-filters'} onAdvanced={()=>setFiltersOpen(open=>!open)} onValueChange={filters=>{setFilterDraft(filters);setFilterErrors({});setQuery(previous=>({...previous,filters,page:1}));setNotice('Filters updated. Drafts from other pages are kept.');}}/>
    <Reveal open={filtersOpen} id={id+'-filters'}><div className="bblocks-data-workspace-filters"><FilterBuilder label="Workspace filters" fields={issueFields} value={filterDraft} onValueChange={value=>{setFilterDraft(value);setFilterErrors({});}} allowGroups errors={filterErrors} disabled={editLocked}/><div className="bblocks-data-workspace-actions"><Button onClick={applyFilters} disabled={editLocked||!filtersChanged}>Apply filters</Button><Button variant="ghost" disabled={editLocked} onClick={()=>{setFilterDraft(emptyFilterQuery());setFilterErrors({});setQuery(previous=>({...previous,filters:emptyFilterQuery(),page:1}));}}>Clear filters</Button></div></div></Reveal>
    <div className="bblocks-data-workspace-sort" role="status">{query.sorts.length?<><Columns3 size={16} aria-hidden="true"/><span>Sorted by {query.sorts.map((sort,index)=>`${index+1}. ${fieldLabel(sort.key)} ${sort.descending?'descending':'ascending'}`).join(', ')}.</span><Button size="sm" variant="ghost" disabled={editLocked} onClick={()=>setQuery(previous=>({...previous,sorts:[],page:1}))}>Clear sorts</Button></>:<span>Shift-click headings to add another sort.</span>}</div>
    <Reveal open={hasDrafts}><div className="bblocks-data-workspace-pending"><div><strong>{entries.length} {entries.length===1?'record':'records'} with pending changes</strong><p>{uncertain?'The save needs reconciliation. Retry the unchanged batch before editing.':errors.length?`${errors.length} ${errors.length===1?'field needs':'fields need'} attention.`:'Your draft includes changes from every page.'}</p></div><div className="bblocks-data-workspace-actions"><Button size="sm" variant="ghost" leadingIcon={Undo2} disabled={editLocked||!history.past.length} onClick={undo}>Undo draft</Button><Button size="sm" variant="ghost" leadingIcon={Redo2} disabled={editLocked||!history.future.length} onClick={redo}>Redo draft</Button><Button size="sm" variant="secondary" disabled={editLocked} onClick={()=>setDiscardOpen(true)}>Discard drafts</Button><Button size="sm" leadingIcon={Save} onClick={()=>{if(!uncertain)setSaveError('');setReviewOpen(true);}} disabled={saving}>Review changes</Button></div></div></Reveal>
    {!hasDrafts&&history.future.length>0&&<div className="bblocks-data-workspace-actions"><Button size="sm" variant="ghost" leadingIcon={Redo2} onClick={redo} disabled={editLocked}>Redo draft</Button></div>}
    <Reveal open={!!loadError}><Alert tone="danger" title="Records could not be loaded" live><p>{loadError}</p><Button size="sm" variant="secondary" onClick={()=>setReload(value=>value+1)}>Retry loading records</Button></Alert></Reveal>
    <div className="bblocks-data-workspace-grid" aria-busy={loading||saving}>
      <p className="bblocks-data-workspace-loading" role="status">{loading&&<><Spinner/>Loading records…</>}</p>
      <DataGrid bulkEditing onBulkEditError={setNotice} label="Issue data grid" rows={displayRows} columns={issueDataColumns} onEdit={edit} cellErrors={errors} dirtyCells={dirtyCells} disabled={!sourceReady||editLocked||loading||!!loadError} onOpenRow={inspect} sorts={query.sorts} onSortsChange={sorts=>setQuery(previous=>({...previous,sorts,page:1}))} onUndo={undo} onRedo={redo} canUndo={!editLocked&&!!history.past.length} canRedo={!editLocked&&!!history.future.length} onClipboardError={setNotice}/>
      {!loading&&!loadError&&!rows.length&&<EmptyState title="No matching issues." action={<Button variant="secondary" onClick={()=>{setQuery(initialQuery());setFilterDraft(emptyFilterQuery());}}>Reset view</Button>}>Try another search or fewer filter conditions. Pending drafts are kept.</EmptyState>}
    </div>
    <footer className="bblocks-data-workspace-footer"><p>{total} matching {total===1?'record':'records'}</p><fieldset disabled={editLocked}><legend className="bui-sr-only">Record pages</legend><Pagination page={query.page} totalPages={Math.max(1,Math.ceil(total/query.pageSize))} label="Workspace pages" onPageChange={page=>{if(!editLocked)setQuery(previous=>({...previous,page}));}}/></fieldset></footer>
    <p className="bblocks-data-workspace-notice" role="status">{notice}</p><p className="bui-hint">Save pending edits before leaving or reloading this page.</p>
    <Dialog title="Review pending changes" description="Validate every changed field, then save the complete batch once. Nothing is written until you confirm." open={reviewOpen} onOpenChange={open=>{if(!saving)setReviewOpen(open);}}>
      <div className="bblocks-data-workspace-review">
        {errors.length>0&&<Alert tone="danger" title="Some fields need attention" live><ul>{errors.map((error,index)=><li key={error.id+'-'+error.key+'-'+index}>{error.id} · {fieldLabel(error.key)}: {error.message}{drafts[error.id]&&<Button variant="ghost" size="sm" disabled={editLocked} onClick={()=>fixError(error)}>Fix {error.id} {fieldLabel(error.key)}</Button>}</li>)}</ul></Alert>}
        <Reveal open={!!saveError}><Alert tone="danger" title={conflicts.length?'Review newer revisions':'Your draft is kept'} live>{saveError}</Alert></Reveal>
        {conflicts.length>0&&<div className="bblocks-data-workspace-conflicts"><h3>Compare with the latest records.</h3>{conflicts.map(latest=>{const draft=drafts[latest.id];return draft?<article key={latest.id}><strong>{latest.id} · revision {draft.base.revision} → {latest.revision}</strong><dl>{Object.entries(draft.values).map(([key,value])=><div key={key}><dt>{fieldLabel(key)}</dt><dd><span>Your draft: {valueLabel(key,value)}</span><span>Latest saved: {valueLabel(key,latest[key as keyof Issue])}</span></dd></div>)}</dl></article>:null;})}<Button variant="secondary" onClick={rebase} disabled={saving}>Use latest revisions and keep my edits</Button><p className="bui-hint">This updates the expected revisions. Your values are kept for another review; it does not save or overwrite a record.</p></div>}
        <ol className="bblocks-data-workspace-changes">{entries.map(([recordId,draft])=><li key={recordId}><div><strong>{recordId}</strong><Badge>Revision {draft.base.revision}</Badge></div><dl>{Object.entries(draft.values).map(([key,value])=><div key={key} data-invalid={errors.some(error=>error.id===recordId&&error.key===key)||undefined}><dt>{fieldLabel(key)}</dt><dd><del>{valueLabel(key,draft.base[key as keyof Issue])}</del><span aria-hidden="true"> → </span><ins>{valueLabel(key,value)}</ins></dd></div>)}</dl></li>)}</ol>
        <div className="bblocks-data-workspace-actions"><Button variant="secondary" disabled={saving} onClick={()=>setReviewOpen(false)}>Keep editing</Button>{saving&&<Button variant="secondary" onClick={stopWaiting}>Stop waiting</Button>}<Button ref={saveButton} leadingIcon={Check} loading={saving} disabled={!hasDrafts||!!errors.length||!!conflicts.length} onClick={()=>void save()}>Save {entries.length} {entries.length===1?'record':'records'}</Button></div>
      </div>
    </Dialog>
    <Dialog title="Discard pending changes?" description="All unsaved changes, including drafts from other pages, will be removed. Saved records remain as they are." open={discardOpen} onOpenChange={setDiscardOpen}><div className="bblocks-data-workspace-actions"><Button variant="secondary" onClick={()=>setDiscardOpen(false)}>Keep drafts</Button><Button variant="danger" leadingIcon={RotateCcw} onClick={discard}>Discard all drafts</Button></div></Dialog>
    <Drawer side="right" title={detailId?`Issue ${detailId}`:'Issue details'} description="Edit the complete record, then add it to your pending batch. Save after reviewing all changes." open={detailOpen} onOpenChange={open=>{if(!saving)setDetailOpen(open);}} finalFocus={returnFocus} className="bblocks-data-workspace-drawer" closeDisabled={saving}>
      {detailBase&&<form className="bblocks-data-workspace-detail" onSubmit={applyDetail} noValidate><p className="bui-hint">Saved revision {detailBase.revision}. Adding to the draft does not write to the service.</p><div className="bblocks-data-workspace-fields">{editableColumns.map(column=>{
        const error=detailErrors.find(error=>error.key===column.key)?.message,value=detailDraft[column.key];
        return column.type==='select'?<Select key={column.key} label={column.label} value={String(value??'')} options={[...(column.options??[])]} error={error} disabled={editLocked} onValueChange={value=>{setDetailDraft(previous=>({...previous,[column.key]:value??''}));setDetailErrors(previous=>previous.filter(error=>error.key!==column.key));}}/>:<Field key={column.key} label={column.label} error={error} required={column.required}><Input type={column.type==='number'?'text':column.type==='date'?'date':'text'} inputMode={column.type==='number'?'decimal':undefined} value={String(value??'')} maxLength={column.maxLength} disabled={editLocked} onChange={event=>{setDetailDraft(previous=>({...previous,[column.key]:event.target.value}));setDetailErrors(previous=>previous.filter(error=>error.key!==column.key));}}/></Field>;
      })}</div><Button type="submit" disabled={editLocked} leadingIcon={Check}>Add to pending changes</Button><section className="bblocks-data-workspace-attachments" aria-label="Issue attachments"><h3>Supporting files</h3>{onUploadFile?<UploadQueue key={detailId} label="Issue supporting files" onUploadFile={upload} maxFiles={3} maxSize={2*1024*1024} disabled={editLocked} hint="The host receives this issue ID. Upload acknowledgement is separate from the record batch save."/>:<p className="bui-hint">Supply onUploadFile to connect your file service. This example does not upload or host files.</p>}</section></form>}
    </Drawer>
  </section>;
}
