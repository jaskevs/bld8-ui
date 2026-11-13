/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const advancedDataExamples=[
  {
    id:'data-grid-virtualized-10000',componentId:'data-grid',title:'Edit ten thousand loaded records',
    description:'A bounded row window retains the focused editor while the rest of the supplied data scrolls. Pages offer a sequential reading view.',
    keyboard:['Arrow keys and Control or Command+Home/End move through loaded records, including unmounted rows.','Enter edits; Escape cancels. Scrolling keeps the current editor mounted at its logical position.','Choose Pages for sequential reading. Finish an incomplete editor before switching views.','Clipboard and bulk operations still allow at most 100 records and 2,000 cells.'],
    states:['10000 loaded records','row virtualization','retained editor','logical pinning','bounded clipboard','paged reading','loaded summaries'],
    source:`'use client';
import { useCallback, useRef, useState } from 'react';
import { AdvancedDataGrid, Button, parseDataValue, type DataColumn, type DataEdit, type DataGridHandle, type DataSummarySpec } from '@bld8/ui';

type RecordRow={id:string;revision:number;title:string;team:string;hours:number;ready:boolean};
const columns:DataColumn<RecordRow>[]=[
  {key:'id',label:'Record',type:'text',pinned:'start',width:132,hideable:false},
  {key:'title',label:'Title',type:'text',editable:true,width:260,maxLength:120},
  {key:'team',label:'Team',type:'select',editable:true,width:150,options:[{value:'product',label:'Product'},{value:'engineering',label:'Engineering'}]},
  {key:'hours',label:'Hours',type:'number',editable:true,min:0,max:100,width:112},
  {key:'ready',label:'Ready',type:'boolean',editable:true,width:112}
];
const initialRows:RecordRow[]=Array.from({length:10000},(_,index)=>({id:'BIG-'+String(index+1).padStart(5,'0'),revision:1,title:'Review item '+(index+1),team:index%2?'engineering':'product',hours:index%8+1,ready:index%3===0}));
const summaries:DataSummarySpec<RecordRow>[]=[{id:'records',label:'Loaded records',operation:'count'},{id:'hours',label:'Total hours',operation:'sum',key:'hours'},{id:'average',label:'Average hours',operation:'average',key:'hours'}];
export default function VirtualizedRecordsExample(){
  const [rows,setRows]=useState(initialRows),[notice,setNotice]=useState('');
  const navigation=useRef<DataGridHandle|null>(null);
  const edit=useCallback((edits:DataEdit<RecordRow>[])=>{
    const changes=new Map<string,Partial<RecordRow>>();
    for(const change of edits){const column=columns.find(column=>column.key===change.key);if(!column)return;const parsed=parseDataValue(column,change.value);if(parsed.error){setNotice(parsed.error);return;}changes.set(change.id,{...changes.get(change.id),[change.key]:parsed.value});}
    setRows(current=>current.map(row=>changes.has(row.id)?{...row,...changes.get(row.id)}:row));setNotice(edits.length+' cells changed locally. No service write was made.');
  },[]);
  return <div style={{minWidth:0}}>
    <Button size="sm" variant="secondary" onClick={()=>{if(!navigation.current?.focusCell('BIG-10000','title'))setNotice('Use Scroll and finish the current editor before jumping.');}}>Focus the last record</Button>
    <AdvancedDataGrid label="Ten thousand editable records" rows={rows} columns={columns} onEdit={edit} navigationRef={navigation} height={400} rowHeight={64} layoutControls resizableColumns bulkEditing summaries={summaries}/>
    <p className="bui-hint">10,000 authored records are already loaded. Only a row window and up to three focused/editor rows stay mounted. Columns remain bounded to 30; this is row virtualization, not an infinite service loader.</p>
    <p role="status">{notice}</p>
  </div>;
}`
  },
  {
    id:'data-grid-hierarchy-summaries',componentId:'data-grid',title:'Load children and compare scoped totals',
    description:'Explicit parent IDs, recoverable child loads and separate loaded versus full-match totals keep the scope clear.',
    keyboard:['Use the first column Right arrow to expand a parent; Left collapses it or returns to its parent. Reading direction reverses these keys.','Collapsed and unknown children are excluded from grid ranges. Draft values remain in controlled host records.','Retry a failed child load; source changes abort and ignore stale responses.','Open a record to expand its separate detail panel without changing fixed virtual row heights.'],
    states:['treegrid','lazy children','abortable retry','stable row IDs','controlled edits','expanded details','loaded totals','query-matched service totals'],
    source:`'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AdvancedDataGrid, Button, Checkbox, parseDataValue, type DataColumn, type DataEdit, type DataGridTree, type DataSummarySpec } from '@bld8/ui';

type WorkRow={id:string;revision:number;parent:string;title:string;hours:number;more:boolean};
const roots:WorkRow[]=[{id:'P-A',revision:1,parent:'',title:'Interface review',hours:0,more:true},{id:'P-B',revision:1,parent:'',title:'Release checks',hours:0,more:true}];
const children:Record<string,WorkRow[]>={
  'P-A':[{id:'A-1',revision:1,parent:'P-A',title:'Keyboard review',hours:3,more:false},{id:'A-2',revision:1,parent:'P-A',title:'Spacing review',hours:5,more:false}],
  'P-B':[{id:'B-1',revision:1,parent:'P-B',title:'Archive interaction',hours:2,more:false},{id:'B-2',revision:1,parent:'P-B',title:'Saved view restore',hours:4,more:false}]
};
const columns:DataColumn<WorkRow>[]=[{key:'id',label:'Record',type:'text',pinned:'start',width:180,hideable:false},{key:'title',label:'Title',type:'text',editable:true,width:260,maxLength:120},{key:'hours',label:'Hours',type:'number',editable:true,min:0,max:100,width:112}];
const summaries:DataSummarySpec<WorkRow>[]=[{id:'count',label:'Visible records',operation:'count'},{id:'sum',label:'Hours',operation:'sum',key:'hours'},{id:'avg',label:'Hours per record',operation:'average',key:'hours'}];
const matching={queryKey:'all-work',recordCount:6,values:[{id:'count',value:6,count:6},{id:'sum',value:14,count:6},{id:'avg',value:14/6,count:6}]};
export default function HierarchicalRecordsExample(){
  const [rows,setRows]=useState(roots),[sourceKey,setSourceKey]=useState(0),[fail,setFail]=useState(false),[stale,setStale]=useState(false),[notice,setNotice]=useState(''),[ignore,setIgnore]=useState(false),[duplicates,setDuplicates]=useState(false),[acceptedParents,setAcceptedParents]=useState<string[]>([]);const failNext=useRef(false),ignoreNext=useRef(false),duplicateNext=useRef(false),pendingChildren=useRef<{parent:WorkRow;complete:(rows:WorkRow[])=>void}[]>([]);
  const loadChildren=useCallback(async(parent:WorkRow,{signal}:{signal:AbortSignal})=>{
    if(duplicateNext.current)return new Promise<WorkRow[]>((resolve,reject)=>{
      const entry={parent,complete:(rows:WorkRow[])=>{signal.removeEventListener('abort',stop);resolve(rows);}};
      function stop(){pendingChildren.current=pendingChildren.current.filter(item=>item!==entry);reject(new DOMException('Aborted','AbortError'));}
      if(signal.aborted){stop();return;}pendingChildren.current.push(entry);signal.addEventListener('abort',stop,{once:true});
    });
    const ignoreAbort=ignoreNext.current;ignoreNext.current=false;setIgnore(false);
    await new Promise<void>((resolve,reject)=>{const timer=setTimeout(done,ignoreAbort?350:120);function stop(){clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));}function done(){signal.removeEventListener('abort',stop);resolve();}if(!ignoreAbort){if(signal.aborted){stop();return;}signal.addEventListener('abort',stop,{once:true});}});
    if(failNext.current){failNext.current=false;setFail(false);throw new Error('Example child load failed.');}return children[parent.id]??[];
  },[]);
  const onChildrenLoaded=useCallback((parent:WorkRow,loaded:readonly WorkRow[])=>{setAcceptedParents(current=>[...current,parent.id]);setRows(current=>{const next=new Map(current.map(row=>[row.id,row]));loaded.forEach(row=>next.set(row.id,row));return [...next.values()];});},[]);
  const tree=useMemo<DataGridTree<WorkRow>>(()=>({parentId:row=>row.parent||null,hasChildren:row=>row.more,loadChildren,onChildrenLoaded}),[loadChildren,onChildrenLoaded]);
  function edit(edits:DataEdit<WorkRow>[]){const values=new Map<string,Partial<WorkRow>>();for(const change of edits){const column=columns.find(column=>column.key===change.key);if(!column)return;const parsed=parseDataValue(column,change.value);if(parsed.error){setNotice(parsed.error);return;}values.set(change.id,{...values.get(change.id),[change.key]:parsed.value});}setRows(current=>current.map(row=>({...row,...values.get(row.id)})));setNotice('Changes stay in this local example.');}
  return <div style={{minWidth:0}}>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}><Checkbox label="Fail next child load" checked={fail} onCheckedChange={value=>{failNext.current=value;setFail(value);}}/><Checkbox label="Show stale totals" checked={stale} onCheckedChange={setStale}/><Checkbox label="Ignore cancellation once" checked={ignore} onCheckedChange={value=>{ignoreNext.current=value;setIgnore(value);}}/><Checkbox label="Concurrent duplicate children" checked={duplicates} onCheckedChange={value=>{duplicateNext.current=value;setDuplicates(value);}}/><Button size="sm" variant="secondary" onClick={()=>{const pending=pendingChildren.current.splice(0);pending.forEach(entry=>entry.complete([{id:'SHARED',revision:1,parent:entry.parent.id,title:'Shared child of '+entry.parent.id,hours:1,more:false}]));}}>Release pending child loads</Button><Button size="sm" variant="secondary" onClick={()=>{setSourceKey(key=>key+1);setRows(roots);setAcceptedParents([]);}}>Reset tree source</Button></div>
    <output aria-label="Accepted child batches">{JSON.stringify(acceptedParents)}</output>
    <AdvancedDataGrid label="Project task hierarchy" rows={rows} columns={columns} tree={tree} sourceKey={sourceKey} onEdit={edit} height={360} layoutControls bulkEditing summaries={summaries} queryKey={stale?'another-query':'all-work'} allMatchingSummary={matching} renderDetails={row=><p>{row.title} · {row.hours} hours · saved revision {row.revision}.</p>}/>
    <p className="bui-hint">The duplicate-child mode deliberately releases two conflicting responses in the same event turn. Only a validated batch reaches the host callback; retry after disabling it. The full-match totals above are authored fixtures representing a service response. Parents have zero hours and are included in the record count. Real services must return totals for the exact applied query. Uploads, authentication and durable writes are separate host concerns.</p><p role="status">{notice}</p>
  </div>;
}`
  }
];
