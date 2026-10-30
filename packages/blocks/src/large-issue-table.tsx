'use client';

import {useEffect, useId, useMemo, useRef, useState, type FormEvent} from 'react';
import {LayoutGroup, motion} from 'motion/react';
import {ArrowDown, ArrowUp, Download, List, RefreshCw, Rows3} from 'lucide-react';
import {
  Alert, Badge, Button, DataTable, Dialog, EmptyState, Field, Icon, Input, Select,
  Skeleton, WindowedTable, createTableCSV, useReducedMotionPreference,
  type Column, type TableGrouping, type TableQuery,
} from '@bld8/ui';
import {isFilterDate} from '@bld8/ui/filter-query';
import {issuePeople, issuePriorities, issueSeed, issueStatuses, type Issue, type IssueChange} from './issue-repository.js';

export interface LargeIssueTableProps {
  /** Complete bounded records, not one page of an IssueRepository response. Keep stable. */
  loadRows?: (context:{signal:AbortSignal})=>Promise<Issue[]>;
  /** The host must authorise and commit the revision check atomically. Keep stable. */
  onSaveIssue?: (change:IssueChange, context:{signal:AbortSignal})=>Promise<Issue>;
  className?:string;
}

type Loader=NonNullable<LargeIssueTableProps['loadRows']>;
type Saver=LargeIssueTableProps['onSaveIssue'];
type GroupBy='none'|'status'|'priority'|'assignee';
type LoadState={loader:Loader;kind:'loading'|'error'|'ready';rows:Issue[];invalid?:boolean};
type Editor={issue:Issue;title:string;status:Issue['status'];loader:Loader;saver:Saver};
const maximumRows=20_000;
const formatCount=new Intl.NumberFormat('en-US');
const collator=new Intl.Collator('en-US',{numeric:true,sensitivity:'base'});
const easing=[.16,1,.3,1] as const;
const named=(options:readonly {value:string;label:string}[],value:string)=>options.find(option=>option.value===value)?.label??value;
const issueIdentity=(row:Issue)=>row.id;

/** Deterministic illustrative records. No repository or service is contacted. */
export function createSampleLargeIssues(count=10_000):Issue[] {
  if(!Number.isInteger(count)||count<0||count>maximumRows)throw new Error('Use between 0 and 20,000 sample issues.');
  return Array.from({length:count},(_,index)=>{
    const seed=issueSeed[index%issueSeed.length];
    return {...seed,id:'ISS-'+(10_001+index),title:seed.title+' · '+(Math.floor(index/issueSeed.length)+1),revision:1};
  });
}

function waitForSample(signal:AbortSignal,milliseconds:number):Promise<void> {
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
    const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},milliseconds);
    signal.addEventListener('abort',cancel,{once:true});
  });
}

export async function loadSampleLargeIssues({signal}:{signal:AbortSignal}):Promise<Issue[]> {
  await waitForSample(signal,250);
  return createSampleLargeIssues();
}

function validIssue(value:unknown):value is Issue {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const row=value as Issue;
  return typeof row.id==='string'&&!!row.id.trim()&&row.id.length<=80&&
    typeof row.title==='string'&&!!row.title.trim()&&row.title.length<=120&&
    issueStatuses.some(option=>option.value===row.status)&&issuePriorities.some(option=>option.value===row.priority)&&
    issuePeople.some(option=>option.value===row.assignee)&&Number.isFinite(row.estimate)&&row.estimate>=0&&
    typeof row.due==='string'&&(!row.due||isFilterDate(row.due))&&Number.isSafeInteger(row.revision)&&row.revision>0;
}

function validateRows(value:unknown):Issue[] {
  if(!Array.isArray(value)||value.length>maximumRows||!value.every(validIssue)||new Set(value.map(row=>row.id)).size!==value.length)throw new Error('Invalid issue records.');
  return value.map(row=>({...row}));
}

function sortValue(row:Issue,key:string):string|number {
  if(key==='status')return issueStatuses.findIndex(option=>option.value===row.status);
  if(key==='priority')return issuePriorities.findIndex(option=>option.value===row.priority);
  if(key==='assignee')return named(issuePeople,row.assignee);
  return row[key as keyof Issue]??row.id;
}

export function LargeIssueTable({loadRows,onSaveIssue,className}:LargeIssueTableProps) {
  const loader=loadRows??loadSampleLargeIssues;
  const [loadState,setLoadState]=useState<LoadState>(()=>({loader,kind:'loading',rows:[]}));
  const [retryVersion,setRetryVersion]=useState(0);
  const [view,setView]=useState<'scroll'|'pages'>('scroll');
  const [search,setSearch]=useState(''),[statusFilter,setStatusFilter]=useState('');
  const [groupBy,setGroupBy]=useState<GroupBy>('status');
  const [sort,setSort]=useState<TableQuery['sort']>({key:'id',descending:false});
  const [selected,setSelected]=useState<string[]>([]),[collapsed,setCollapsed]=useState<string[]>([]);
  const [notice,setNotice]=useState(''),[exporting,setExporting]=useState(false);
  const [editor,setEditor]=useState<Editor|null>(null),[dialogOpen,setDialogOpen]=useState(false);
  const [titleError,setTitleError]=useState(''),[saveError,setSaveError]=useState(''),[saving,setSaving]=useState(false);
  const mounted=useRef(false),loadId=useRef(0),currentLoader=useRef(loader),currentSaver=useRef(onSaveIssue);
  currentLoader.current=loader;currentSaver.current=onSaveIssue;
  const records=useRef<Issue[]>([]),saveRequest=useRef<AbortController|null>(null);
  const titleField=useRef<HTMLInputElement>(null),heading=useRef<HTMLHeadingElement>(null),returnFocus=useRef<HTMLElement|null>(null);
  const retryOrigin=useRef<HTMLElement|null>(null);
  const exportGuard=useRef(false),exportUrl=useRef<string|null>(null),exportTimer=useRef<number|null>(null);
  const reduced=useReducedMotionPreference(),indicatorId=useId();

  useEffect(()=>{
    mounted.current=true;
    return()=>{mounted.current=false;saveRequest.current?.abort();if(exportTimer.current!==null)window.clearTimeout(exportTimer.current);if(exportUrl.current)URL.revokeObjectURL(exportUrl.current);};
  },[]);

  useEffect(()=>{
    const controller=new AbortController(),id=++loadId.current;
    const current=()=>mounted.current&&!controller.signal.aborted&&id===loadId.current&&currentLoader.current===loader;
    saveRequest.current?.abort();saveRequest.current=null;setSaving(false);
    records.current=[];setSelected([]);setCollapsed([]);setNotice('');
    setLoadState({loader,kind:'loading',rows:[]});
    Promise.resolve().then(()=>current()?loader({signal:controller.signal}):null).then(value=>{
      if(!current())return;
      try{const rows=validateRows(value);records.current=rows;setLoadState({loader,kind:'ready',rows});}
      catch{setLoadState({loader,kind:'error',rows:[],invalid:true});}
    },()=>{if(current())setLoadState({loader,kind:'error',rows:[]});});
    return()=>controller.abort();
  },[loader,retryVersion]);

  useEffect(()=>{
    const request=saveRequest.current;
    if(!request)return;
    request.abort();saveRequest.current=null;setSaving(false);
    setSaveError('The save connection changed. Close these details and open the issue again before saving.');
  },[onSaveIssue]);

  useEffect(()=>{
    if(dialogOpen||!editor||returnFocus.current?.isConnected)return;
    returnFocus.current=heading.current;
    heading.current?.focus({preventScroll:true});
  },[dialogOpen,editor]);

  useEffect(()=>{
    const origin=retryOrigin.current;retryOrigin.current=null;
    if(!origin)return;
    const active=origin.ownerDocument.activeElement;
    if(active===origin||active===origin.ownerDocument.body&&!origin.isConnected)heading.current?.focus({preventScroll:true});
  },[retryVersion]);

  const ready=loadState.loader===loader&&loadState.kind==='ready';
  const loading=loadState.loader!==loader||loadState.kind==='loading';
  const rows=ready?loadState.rows:[];
  const selectedSet=useMemo(()=>new Set(selected),[selected]);
  const selectedRows=useMemo(()=>rows.filter(row=>selectedSet.has(row.id)),[rows,selectedSet]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase('en-US');
    const result=rows.filter(row=>(!statusFilter||row.status===statusFilter)&&(!query||(row.id+' '+row.title+' '+named(issuePeople,row.assignee)).toLocaleLowerCase('en-US').includes(query)));
    if(sort)result.sort((first,second)=>{
      const a=sortValue(first,sort.key),b=sortValue(second,sort.key);
      const order=typeof a==='number'&&typeof b==='number'?a-b:collator.compare(String(a),String(b));
      return (order||collator.compare(first.id,second.id))*(sort.descending?-1:1);
    });
    return result;
  },[rows,search,statusFilter,sort]);
  const selectedOutside=selected.length-filtered.reduce((count,row)=>count+(selectedSet.has(row.id)?1:0),0);
  const grouping=useMemo<TableGrouping<Issue>|undefined>(()=>groupBy==='none'?undefined:{
    key:row=>row[groupBy],
    label:key=>named(groupBy==='status'?issueStatuses:groupBy==='priority'?issuePriorities:issuePeople,key),
  },[groupBy]);
  const groupKeys=useMemo(()=>grouping?[...new Set(filtered.map(grouping.key))]:[],[filtered,grouping]);
  const allCollapsed=groupKeys.length>0&&groupKeys.every(key=>collapsed.includes(key));

  function inspect(row:Issue) {
    returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:heading.current;
    setEditor({issue:{...row},title:row.title,status:row.status,loader,saver:onSaveIssue});
    setTitleError('');setSaveError('');setDialogOpen(true);
  }
  function closeDetails(open:boolean) {
    if(!open&&saveRequest.current){saveRequest.current.abort();saveRequest.current=null;setSaving(false);setNotice('Save cancelled in this view. Reload issues to check the result.');}
    if(!open&&!returnFocus.current?.isConnected)returnFocus.current=heading.current;
    setDialogOpen(open);
  }
  async function saveDetails(event:FormEvent) {
    event.preventDefault();
    if(!editor||saveRequest.current)return;
    const draft=editor,title=draft.title.trim();
    if(title.length<3||title.length>120){setTitleError('Use a title between 3 and 120 characters.');titleField.current?.focus();return;}
    const previous=records.current.find(row=>row.id===draft.issue.id);
    if(draft.loader!==currentLoader.current||draft.saver!==currentSaver.current||!previous||previous.revision!==draft.issue.revision){setSaveError('This issue changed. Close these details and open the current issue before saving.');return;}
    if(title===previous.title&&draft.status===previous.status){closeDetails(false);setNotice('No issue changes to save.');return;}
    const controller=new AbortController(),owner=loadId.current,saver=onSaveIssue;
    saveRequest.current=controller;setSaving(true);setTitleError('');setSaveError('');
    const current=()=>mounted.current&&!controller.signal.aborted&&saveRequest.current===controller&&loadId.current===owner&&currentLoader.current===draft.loader&&currentSaver.current===saver;
    try{
      const change:IssueChange={id:previous.id,expectedRevision:previous.revision,patch:{title,status:draft.status}};
      let result:unknown;
      if(saver)result=await saver(change,{signal:controller.signal});
      else{await waitForSample(controller.signal,300);result={...previous,title,status:draft.status,revision:previous.revision+1};}
      if(!current())return;
      const latest=records.current.find(row=>row.id===previous.id);
      if(!validIssue(result)||result.id!==previous.id||result.revision<=previous.revision||result.title!==title||result.status!==draft.status||latest?.revision!==previous.revision)throw new Error('Invalid saved issue.');
      const next=records.current.map(row=>row.id===result.id?{...result}:row);
      records.current=next;setLoadState({loader: draft.loader,kind:'ready',rows:next});
      saveRequest.current=null;setSaving(false);closeDetails(false);setNotice(result.id+' updated.');
    }catch{
      if(current())setSaveError('The issue could not be saved. Your changes are still here; try again.');
    }finally{
      if(saveRequest.current===controller){saveRequest.current=null;if(mounted.current)setSaving(false);}
    }
  }

  const columns=useMemo<Column<Issue>[]>(()=>[
    {key:'id',header:'ID',width:132,minWidth:120,sortValue:row=>row.id,exportValue:row=>row.id,cell:row=><span className="bblocks-large-issue-id">{row.id}</span>},
    {key:'title',header:'Issue',width:300,minWidth:240,flex:1,sortValue:row=>row.title,exportValue:row=>row.title,cell:row=><span>{row.title}</span>},
    {key:'status',header:'Status',width:150,minWidth:140,sortValue:row=>sortValue(row,'status'),exportValue:row=>named(issueStatuses,row.status),cell:row=><Badge tone={row.status==='done'?'success':row.status==='review'?'warning':'neutral'}>{named(issueStatuses,row.status)}</Badge>},
    {key:'priority',header:'Priority',width:116,minWidth:108,sortValue:row=>sortValue(row,'priority'),exportValue:row=>named(issuePriorities,row.priority),cell:row=><span className="bblocks-issue-priority" data-priority={row.priority}><span aria-hidden="true"/>{named(issuePriorities,row.priority)}</span>},
    {key:'assignee',header:'Assignee',width:160,minWidth:144,sortValue:row=>named(issuePeople,row.assignee),exportValue:row=>named(issuePeople,row.assignee),cell:row=><span>{named(issuePeople,row.assignee)}</span>},
    {key:'estimate',header:'Estimate',width:108,minWidth:100,align:'end',sortValue:row=>row.estimate,exportValue:row=>row.estimate,cell:row=><span>{row.estimate} pt</span>},
    {key:'due',header:'Due date',width:136,minWidth:128,sortValue:row=>row.due,exportValue:row=>row.due,cell:row=>row.due?<time dateTime={row.due}>{row.due}</time>:<span className="bblocks-muted">No date</span>},
  ],[]);
  const pageColumns=useMemo<Column<Issue>[]>(()=>columns.map(column=>({...column,sortValue:undefined,...(column.key==='title'?{cell:(row:Issue)=><Button variant="ghost" size="sm" className="bblocks-large-issue-inspect" aria-label={'Inspect '+row.id} onClick={()=>inspect(row)}>{row.title}</Button>}: {})})),[columns,loader,onSaveIssue]);

  function exportSelected() {
    if(exportGuard.current||!selectedRows.length)return;
    exportGuard.current=true;setExporting(true);setNotice('');
    try{
      const csv=createTableCSV(selectedRows,columns);
      const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));exportUrl.current=url;
      const anchor=document.createElement('a');anchor.href=url;anchor.download='bld8-selected-issues.csv';document.body.append(anchor);anchor.click();anchor.remove();
      setNotice(formatCount.format(selectedRows.length)+' selected issues exported.');
      exportTimer.current=window.setTimeout(()=>{URL.revokeObjectURL(url);if(exportUrl.current===url)exportUrl.current=null;exportGuard.current=false;exportTimer.current=null;if(mounted.current)setExporting(false);},400);
    }catch{if(exportUrl.current){URL.revokeObjectURL(exportUrl.current);exportUrl.current=null;}exportGuard.current=false;setExporting(false);setNotice('The CSV could not be prepared. Try again.');}
  }

  const staleDraft=!!editor&&(editor.loader!==loader||editor.saver!==onSaveIssue);
  useEffect(()=>{if(saveError&&!saving&&dialogOpen&&!staleDraft)titleField.current?.focus();},[saveError,saving,dialogOpen,staleDraft]);
  const selectionActions=<div className="bblocks-large-issue-selection-actions"><Button variant="secondary" size="sm" leadingIcon={Download} loading={exporting} disabled={!selectedRows.length} onClick={exportSelected}>Export selected CSV</Button><Button variant="ghost" size="sm" onClick={()=>setSelected([])}>Clear selection</Button></div>;
  return <section className={'bblocks-panel bblocks-large-issues'+(className?' '+className:'')} aria-label="Large issue workspace" data-reduced-motion={!!reduced}>
    <header className="bblocks-heading"><div><p className="bblocks-kicker">MORE WORK. THE SAME DETAILS.</p><h2 ref={heading} tabIndex={-1}>Keep the larger queue in view.</h2><p className="bblocks-muted">{loadRows?(onSaveIssue?'Connected issue records.':'Loaded issues. Edits stay in this page.'):'Illustrative issues. Changes last for this session.'}</p></div><Button variant="secondary" leadingIcon={RefreshCw} disabled={loading||saving||dialogOpen} onClick={()=>setRetryVersion(value=>value+1)}>Reload issues</Button></header>
    <div className="bblocks-large-issue-toolbar">
      <Field label="Search issues"><Input type="search" value={search} maxLength={200} placeholder="ID, title or assignee…" onChange={event=>setSearch(event.target.value)}/></Field>
      <Select label="Status filter" value={statusFilter} options={[{value:'',label:'All statuses'},...issueStatuses]} onValueChange={value=>setStatusFilter(value??'')}/>
      <Select label="Group issues by" value={groupBy} options={[{value:'none',label:'No grouping'},{value:'status',label:'Status'},{value:'priority',label:'Priority'},{value:'assignee',label:'Assignee'}]} onValueChange={value=>{if(value==='none'||value==='status'||value==='priority'||value==='assignee'){setGroupBy(value);setCollapsed([]);}}}/>
      <Select label="Sort issues by" value={sort?.key??'none'} options={[{value:'none',label:'Original order'},...columns.map(column=>({value:column.key,label:column.header}))]} onValueChange={value=>setSort(!value||value==='none'?null:{key:value,descending:sort?.descending??false})}/>
      <Button variant="secondary" leadingIcon={sort?.descending?ArrowDown:ArrowUp} disabled={!sort} aria-label={sort?.descending?'Sort ascending':'Sort descending'} onClick={()=>setSort(current=>current?{...current,descending:!current.descending}:current)}>{sort?.descending?'Descending':'Ascending'}</Button>
    </div>
    <div className="bblocks-large-issue-view-row">
      <LayoutGroup id={indicatorId}><div className="bblocks-large-issue-views" role="group" aria-label="Issue reading view">{([{value:'scroll',label:'Scroll',icon:Rows3},{value:'pages',label:'Pages',icon:List}] as const).map(option=><button key={option.value} type="button" aria-pressed={view===option.value} onClick={()=>setView(option.value)}>{view===option.value&&<motion.span className="bblocks-large-issue-view-indicator" layoutId="reading-view" transition={reduced?{duration:0}:{duration:.32,ease:easing}}/>}<span><Icon icon={option.icon} size={16}/>{option.label}</span></button>)}</div></LayoutGroup>
      <div className="bblocks-large-issue-summary"><span className="bui-hint" role="status">{ready?formatCount.format(filtered.length)+' of '+formatCount.format(rows.length)+' issues':loading?'Preparing issues…':'Issues unavailable'}</span>{grouping&&groupKeys.length>0&&<Button variant="ghost" size="sm" onClick={()=>setCollapsed(allCollapsed?[]:groupKeys)}>{allCollapsed?'Expand all groups':'Collapse all groups'}</Button>}</div>
    </div>
    <div className="bblocks-large-issue-selection-slot">{ready&&selected.length>0?<div className="bui-table-selection"><span role="status">{formatCount.format(selected.length)} selected{selectedOutside>0?' · '+formatCount.format(selectedOutside)+' outside this view':''}</span>{selectionActions}</div>:<p className="bui-hint">Select issues to export a smaller set.</p>}</div>
    <div className="bblocks-large-issue-stage" aria-busy={loading||undefined}>
      {loading?<div className="bblocks-large-issue-loading"><p className="bui-hint" role="status">Loading issues…</p>{[0,1,2,3,4,5].map(value=><Skeleton key={value} height="3rem"/>)}</div>:!ready?<div className="bblocks-large-issue-notice"><Alert title={loadState.invalid?'The issue records could not be read':'Issues could not be loaded'} tone="danger" live>{loadState.invalid?'Check the records and try again.':'The connection is unavailable. Your view settings are still here.'}</Alert><Button variant="secondary" leadingIcon={RefreshCw} onClick={event=>{retryOrigin.current=event.currentTarget;setRetryVersion(value=>value+1);}}>Retry loading issues</Button></div>:!filtered.length?<EmptyState title={rows.length?'No matching issues.':'No issues yet.'} action={search||statusFilter?<Button variant="secondary" onClick={()=>{setSearch('');setStatusFilter('');}}>Clear filters</Button>:undefined}>{rows.length?'Try another search or status.':'Issues will appear here when your source returns records.'}</EmptyState>:<>
        {view==='scroll'?<>
          <WindowedTable caption="Large issues" rows={filtered} columns={columns} rowKey={issueIdentity} rowLabel={issueIdentity} height={480} rowHeight={56} overscan={5} grouping={grouping} collapsedGroupKeys={collapsed} onCollapsedGroupKeysChange={setCollapsed} selectedKeys={selected} onSelectedKeysChange={setSelected} selectable onRowAction={inspect} sort={sort} onSortChange={setSort}/>
        </>:<DataTable caption="Large issues" rows={filtered} columns={pageColumns} rowKey={issueIdentity} rowLabel={issueIdentity} pageSize={20} grouping={grouping} collapsedGroupKeys={collapsed} onCollapsedGroupKeysChange={setCollapsed} selectedKeys={selected} onSelectedKeysChange={setSelected} selectable/>}
      </>}
    </div>
    <footer className="bblocks-large-issue-footer"><p>{view==='scroll'?'Scroll to scan the queue. Open an issue to edit its details.':'Pages expose the same records and selection in a regular table.'}</p><p className="bblocks-large-issue-notice-text" role="status" aria-live="polite">{notice}</p></footer>
    <Dialog title="Issue details" description={editor?'Review '+editor.issue.id+'. Changes stay in this draft until saved.':undefined} open={dialogOpen} onOpenChange={closeDetails} initialFocus={titleField} finalFocus={returnFocus}>
      {editor&&<form className="bblocks-large-issue-form" onSubmit={saveDetails}>
        <p className="bblocks-large-issue-id">{editor.issue.id}</p>
        <Field label="Issue title" error={titleError} required><Input ref={titleField} value={editor.title} maxLength={120} disabled={saving||staleDraft} onChange={event=>{setEditor(current=>current?{...current,title:event.target.value}:current);setTitleError('');setSaveError('');}}/></Field>
        <Select label="Issue status" value={editor.status} options={issueStatuses} disabled={saving||staleDraft} onValueChange={value=>{if(issueStatuses.some(option=>option.value===value)){setEditor(current=>current?{...current,status:value as Issue['status']}:current);setSaveError('');}}}/>
        <dl className="bblocks-large-issue-meta"><div><dt>Priority</dt><dd>{named(issuePriorities,editor.issue.priority)}</dd></div><div><dt>Assignee</dt><dd>{named(issuePeople,editor.issue.assignee)}</dd></div><div><dt>Estimate</dt><dd>{editor.issue.estimate} pt</dd></div><div><dt>Due date</dt><dd>{editor.issue.due||'No date'}</dd></div></dl>
        {(saveError||staleDraft)&&<Alert title="Changes have not been saved" tone="danger" live>{staleDraft?'The issue connection changed. Close these details and open the current issue before saving.':saveError}</Alert>}
        <div className="bblocks-large-issue-form-actions"><Button variant="secondary" onClick={()=>closeDetails(false)}>{saving?'Cancel save':'Cancel'}</Button><Button type="submit" loading={saving} disabled={staleDraft}>Save issue</Button></div>
      </form>}
    </Dialog>
  </section>;
}
