/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useImperativeHandle,useLayoutEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {ChevronRight,RefreshCw,X} from 'lucide-react';
import {Alert,Button,Icon,Pagination} from './core.js';
import {DataGrid,type DataGridProps,type DataGridHandle} from './data-grid.js';
import {Reveal} from './reveal.js';
import {useUIConfig} from './ui-config.js';
import {ADVANCED_DATA_LIMITS,flattenDataTree,summarizeDataRows,validDataSummarySnapshot,type DataSummarySpec,type DataSummarySnapshot,type DataSummaryValue,type DataTreeNode} from './advanced-data-state.js';
import type {DataRecord} from './data-workspace-state.js';

export interface DataGridTree<T extends DataRecord>{
  /** Flat supplied records. Roots return null; every supplied child has a supplied parent. */
  parentId:(row:T)=>string|null;
  hasChildren?:(row:T)=>boolean;
  loadChildren?:(parent:T,context:{signal:AbortSignal})=>Promise<readonly T[]>;
  /** Add loaded records to controlled host state before editing them. Host rows override the cache. */
  onChildrenLoaded?:(parent:T,children:readonly T[])=>void;
}
export interface AdvancedDataGridProps<T extends DataRecord> extends Omit<DataGridProps<T>,'virtualization'>{
  height?:number;
  rowHeight?:number;
  overscan?:number;
  pageSize?:5|10|20|50|100;
  defaultReadingView?:'scroll'|'pages';
  tree?:DataGridTree<T>;
  /** Change when the service/account changes; in-flight children are aborted and caches reset. */
  sourceKey?:string|number;
  defaultExpandedKeys?:readonly string[];
  renderDetails?:(row:T)=>ReactNode;
  summaries?:readonly DataSummarySpec<T>[];
  /** Query identity accompanying host-computed totals for all matching service records. */
  queryKey?:string;
  allMatchingSummary?:DataSummarySnapshot;
}
interface ChildCache<T>{revision:number;rows:readonly T[]}
interface ChildStatus{loading:boolean;error?:string}

/** Optional complete-data window, accessible pages and explicitly loaded tree records. */
export function AdvancedDataGrid<T extends DataRecord>({height=480,rowHeight=64,overscan=4,pageSize=20,defaultReadingView='scroll',tree,sourceKey,defaultExpandedKeys=[],renderDetails,summaries=[],queryKey,allMatchingSummary,...grid}:AdvancedDataGridProps<T>){
  const {message:m,locale,direction}=useUIConfig();
  const root=useRef<HTMLDivElement>(null),detailsHeading=useRef<HTMLHeadingElement>(null),returnFocus=useRef<HTMLElement|null>(null);
  const navigation=useRef<DataGridHandle|null>(null),pendingParent=useRef<{id:string;key:string}|null>(null);
  useImperativeHandle(grid.navigationRef,()=>({focusCell:(id,key)=>navigation.current?.focusCell(id,key)??false}));
  const [reading,setReading]=useState(defaultReadingView),[page,setPage]=useState(1),[expanded,setExpanded]=useState<string[]>([...defaultExpandedKeys]);
  const [cache,setCache]=useState<Map<string,ChildCache<T>>>(new Map()),[status,setStatus]=useState<Record<string,ChildStatus>>({}),[details,setDetails]=useState<string|null>(null),[notice,setNotice]=useState('');
  const requests=useRef(new Map<string,AbortController>()),generation=useRef(0),current=useRef({tree,sourceKey,rows:grid.rows});current.current={tree,sourceKey,rows:grid.rows};
  const cacheSource=useRef({loader:tree?.loadChildren,key:sourceKey}),ready=cacheSource.current.loader===tree?.loadChildren&&cacheSource.current.key===sourceKey;
  useEffect(()=>{generation.current++;for(const controller of requests.current.values())controller.abort();requests.current.clear();cacheSource.current={loader:tree?.loadChildren,key:sourceKey};setCache(new Map());setStatus({});setExpanded([...defaultExpandedKeys]);setDetails(null);return()=>{generation.current++;for(const controller of requests.current.values())controller.abort();requests.current.clear();};},[tree?.loadChildren,sourceKey]);
  const loaded=useMemo(()=>{
    const records=new Map(grid.rows.map(row=>[row.id,row]));if(!ready)return [...records.values()];
    for(let depth=0;depth<ADVANCED_DATA_LIMITS.depth;depth++)for(const [id,entry] of cache){if(records.get(id)?.revision!==entry.revision)continue;for(const row of entry.rows)if(!records.has(row.id))records.set(row.id,row);}
    return [...records.values()];
  },[grid.rows,cache,ready]);
  const loadedRef=useRef(loaded);loadedRef.current=loaded;
  useEffect(()=>{
    const available=new Map(loaded.map(row=>[row.id,row.revision]));
    setCache(previous=>{const next=new Map([...previous].filter(([id,entry])=>available.get(id)===entry.revision));return next.size===previous.size?previous:next;});
    for(const [id,controller] of requests.current)if(!available.has(id)){controller.abort();requests.current.delete(id);}
    setStatus(previous=>{const entries=Object.entries(previous).filter(([id])=>available.has(id));return entries.length===Object.keys(previous).length?previous:Object.fromEntries(entries);});
  },[loaded]);
  let invalid='';let nodes:DataTreeNode<T>[]=[];
  try{if(loaded.length>ADVANCED_DATA_LIMITS.rows||new Set(grid.rows.map(row=>row.id)).size!==grid.rows.length)throw new Error('Use up to 20,000 distinct loaded records.');nodes=tree?flattenDataTree(loaded,tree.parentId,expanded,tree.hasChildren):loaded.map(row=>({row,parentId:null,depth:0,hasChildren:false,expanded:false}));}catch(error){invalid=error instanceof Error?error.message:'Review the supplied tree records.';}
  const visibleRows=nodes.map(node=>node.row),nodeById=new Map(nodes.map(node=>[node.row.id,node]));
  const size=[5,10,20,50,100].includes(pageSize)?pageSize:20,pages=Math.max(1,Math.ceil(visibleRows.length/size)),activePage=Math.min(page,pages);
  const displayed=reading==='pages'?visibleRows.slice((activePage-1)*size,activePage*size):visibleRows;
  const detailRow=loaded.find(row=>row.id===details);
  useLayoutEffect(()=>{const pending=pendingParent.current;if(pending&&navigation.current?.focusCell(pending.id,pending.key))pendingParent.current=null;});
  useEffect(()=>{if(page>pages)setPage(pages);},[page,pages]);
  function switchReading(next:'scroll'|'pages'){
    if(root.current?.querySelector('[data-editing]')){setNotice(m('grid.finishEdit','Finish or cancel the current edit before changing the reading view.'));return;}
    const active=root.current?.querySelector<HTMLElement>('[data-row-id][data-active]'),index=visibleRows.findIndex(row=>row.id===active?.dataset.rowId);
    if(index>=0)setPage(Math.floor(index/size)+1);setReading(next);
  }
  async function load(parent:T){
    const loader=tree?.loadChildren;if(!loader||requests.current.has(parent.id))return;
    const retryOrigin=document.activeElement instanceof HTMLElement&&document.activeElement.closest('[data-child-state]')?.getAttribute('data-child-state')===parent.id?document.activeElement:null;
    const controller=new AbortController(),version=generation.current,key=sourceKey;requests.current.set(parent.id,controller);setStatus(previous=>({...previous,[parent.id]:{loading:true,error:previous[parent.id]?.error}}));
    const live=()=>!controller.signal.aborted&&generation.current===version&&current.current.sourceKey===key&&current.current.tree?.loadChildren===loader&&requests.current.get(parent.id)===controller;
    try{
      const children=await loader(parent,{signal:controller.signal});if(!live())return;
      const liveTree=current.current.tree!;
      const latest=loadedRef.current.find(row=>row.id===parent.id);
      if(!latest||latest.revision!==parent.revision)throw new Error('The parent changed. Reload its children.');
      if(!Array.isArray(children)||children.length>1000||new Set(children.map(row=>row.id)).size!==children.length||children.some(row=>!row||typeof row.id!=='string'||!row.id||!Number.isSafeInteger(row.revision)||row.revision<1||liveTree.parentId(row)!==parent.id))throw new Error('The child service returned invalid direct children.');
      const candidate=new Map(loadedRef.current.map(row=>[row.id,row]));for(const row of children){if(candidate.has(row.id)&&liveTree.parentId(candidate.get(row.id)!)!==parent.id)throw new Error('Child identities must be unique across the tree.');candidate.set(row.id,row);}
      const accepted=[...candidate.values()];flattenDataTree(accepted,liveTree.parentId,[parent.id],liveTree.hasChildren);
      liveTree.onChildrenLoaded?.(parent,children);if(!live())return;
      // Reserve accepted identities before another promise can settle in this
      // React batch. A thrown callback or replaced source never reserves them.
      loadedRef.current=accepted;
      setCache(previous=>new Map(previous).set(parent.id,{revision:parent.revision,rows:children}));setStatus(previous=>({...previous,[parent.id]:{loading:false}}));
      if(retryOrigin&&(document.activeElement===retryOrigin||document.activeElement===document.body))navigation.current?.focusCell(parent.id,grid.columns[0].key);
    }catch{if(live())setStatus(previous=>({...previous,[parent.id]:{loading:false,error:m('grid.childrenError','Children could not be loaded. Retry without losing your draft.')}}));}
    finally{if(requests.current.get(parent.id)===controller)requests.current.delete(parent.id);}
  }
  function toggle(node:DataTreeNode<T>){
    if(grid.disabled)return;
    if(node.expanded){
      const active=document.activeElement instanceof HTMLElement?document.activeElement.closest<HTMLElement>('[data-row-id]'):null;
      const descendant=(id:string)=>{let cursor=loaded.find(row=>row.id===id);for(let depth=0;cursor&&depth<8;depth++){const parent=tree?.parentId(cursor);if(parent===node.row.id)return true;cursor=loaded.find(row=>row.id===parent);}return false;};
      if(active?.dataset.rowId&&descendant(active.dataset.rowId))Array.from(root.current?.querySelectorAll<HTMLElement>('[data-row-id]')??[]).find(cell=>cell.dataset.rowId===node.row.id)?.focus({preventScroll:true});
      const stopped:string[]=[];for(const [id,controller] of requests.current)if(id===node.row.id||descendant(id)){controller.abort();requests.current.delete(id);stopped.push(id);}
      setStatus(previous=>{const next={...previous,[node.row.id]:{loading:false}};for(const id of stopped)next[id]={loading:false,error:m('grid.childrenCancelled','Loading stopped. Retry to load these children.')};return next;});setExpanded(previous=>previous.filter(id=>id!==node.row.id));
    }else{setExpanded(previous=>[...previous,node.row.id]);if(!loaded.some(row=>tree?.parentId(row)===node.row.id)&&cache.get(node.row.id)?.revision!==node.row.revision)void load(node.row);}
  }
  function openDetails(row:T){returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setDetails(row.id);grid.onOpenRow?.(row);requestAnimationFrame(()=>detailsHeading.current?.focus({preventScroll:true}));}
  let values:DataSummaryValue[]=[];let summaryError='';try{values=summarizeDataRows(displayed,summaries);}catch(error){summaryError=error instanceof Error?error.message:'The loaded summary could not be calculated.';}
  const matchingValid=allMatchingSummary!==undefined&&queryKey!==undefined&&validDataSummarySnapshot(allMatchingSummary,queryKey,summaries);
  const format=new Intl.NumberFormat(locale,{maximumFractionDigits:2});
  function summaryList(items:readonly DataSummaryValue[]){return <dl className="bui-advanced-grid-summary-values">{summaries.map(spec=>{const item=items.find(item=>item.id===spec.id);return <div key={spec.id}><dt>{spec.label}</dt><dd>{item?.value===null||item===undefined?'—':format.format(item.value)}</dd></div>;})}</dl>;}
  if(invalid)return <Alert title={m('grid.invalidRecords','Review the loaded records')} tone="danger">{invalid}</Alert>;
  return <div ref={root} className="bui-advanced-grid" dir={direction}>
    <div className="bui-advanced-grid-reading" role="group" aria-label={m('grid.readingView','Grid reading view')}><Button size="sm" disabled={grid.disabled} variant={reading==='scroll'?'secondary':'ghost'} aria-pressed={reading==='scroll'} onClick={()=>switchReading('scroll')}>{m('grid.scroll','Scroll')}</Button><Button size="sm" disabled={grid.disabled} variant={reading==='pages'?'secondary':'ghost'} aria-pressed={reading==='pages'} onClick={()=>switchReading('pages')}>{m('grid.pages','Pages')}</Button><span className="bui-hint">{m('grid.loadedRows','{count} visible loaded records',{count:visibleRows.length})}</span></div>
    <p className="bui-hint">{reading==='pages'?m('grid.pageScope','Ranges and summaries cover this page.'):m('grid.loadedScope','Ranges and summaries cover visible loaded records, including rows outside the scrolling window.')} {tree&&m('grid.treeScope','Collapsed and unknown children are excluded. Expanding a parent never selects unknown records.')}</p>
    <DataGrid {...grid} navigationRef={navigation} rows={displayed} virtualization={reading==='scroll'?{height,rowHeight,overscan}:undefined} onOpenRow={renderDetails?openDetails:grid.onOpenRow} rowHierarchy={tree?row=>{const node=nodeById.get(row.id)!;return {level:node.depth+1,expanded:node.hasChildren?node.expanded:undefined};}:undefined}
      onCellKeyDown={(context,event)=>{grid.onCellKeyDown?.(context,event);if(event.defaultPrevented||event.target!==event.currentTarget||context.columnIndex!==0)return;const node=nodeById.get(context.row.id);if(!node||!tree)return;const expandKey=direction==='rtl'?'ArrowLeft':'ArrowRight',collapseKey=direction==='rtl'?'ArrowRight':'ArrowLeft';if(event.key===expandKey&&node.hasChildren&&!node.expanded||event.key===collapseKey&&node.expanded){event.preventDefault();toggle(node);}else if(event.key===collapseKey&&node.parentId){event.preventDefault();if(!navigation.current?.focusCell(node.parentId,context.column.key)){pendingParent.current={id:node.parentId,key:context.column.key};setPage(Math.floor(visibleRows.findIndex(row=>row.id===node.parentId)/size)+1);}}}}
      renderCell={context=>{const original=grid.renderCell?.(context);if(!tree||context.columnIndex!==0)return original;const node=nodeById.get(context.row.id)!;return <span className="bui-advanced-grid-tree-cell" style={{paddingInlineStart:node.depth*20}}>{node.hasChildren?<button type="button" tabIndex={-1} className="bui-advanced-grid-disclosure" aria-label={m(node.expanded?'grid.collapseRow':'grid.expandRow',node.expanded?'Collapse {label}':'Expand {label}',{label:context.row.id})} aria-expanded={node.expanded} onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();event.currentTarget.closest<HTMLElement>('td')?.focus({preventScroll:true});toggle(node);}}><Icon icon={ChevronRight} size={16}/></button>:<span className="bui-advanced-grid-disclosure-space"/>}{original??String(context.value??'')}</span>;}}/>
    {reading==='pages'&&<Pagination label={m('grid.recordPages','Loaded record pages')} page={activePage} totalPages={pages} onPageChange={setPage}/>}
    {tree&&nodes.filter(node=>node.expanded&&status[node.row.id]?.loading||node.expanded&&status[node.row.id]?.error).map(node=><div key={node.row.id} data-child-state={node.row.id} className="bui-advanced-grid-child-state">{status[node.row.id]?.loading&&<p role="status">{m('grid.loadingChildren','Loading children for {label}…',{label:node.row.id})}</p>}{status[node.row.id]?.error&&<Alert tone="danger" title={m('grid.childLoadFailed','Children unavailable for {label}',{label:node.row.id})}><p>{status[node.row.id]?.error}</p><Button size="sm" variant="secondary" leadingIcon={RefreshCw} loading={status[node.row.id]?.loading} onClick={()=>void load(node.row)}>{m('grid.retryChildren','Retry children for {label}',{label:node.row.id})}</Button></Alert>}</div>)}
    {!!summaries.length&&<section className="bui-advanced-grid-summaries" aria-label={m('grid.loadedSummary','Loaded record summaries')}><h3>{reading==='pages'?m('grid.thisPage','This page'):m('grid.visibleLoaded','Visible loaded records')}</h3>{summaryError?<p role="alert" className="bui-error">{summaryError}</p>:summaryList(values)}</section>}
    {allMatchingSummary&&<section className="bui-advanced-grid-summaries" aria-label={m('grid.matchingSummary','All matching record summaries')}><h3>{m('grid.allMatching','All matching records · service totals')}</h3>{matchingValid?<><p className="bui-hint">{m('grid.matchingCount','{count} matching records',{count:allMatchingSummary.recordCount})}</p>{summaryList(allMatchingSummary.values)}</>:<p role="alert" className="bui-error">{m('grid.staleSummary','These totals belong to another query or are invalid. Refresh the service totals.')}</p>}</section>}
    <Reveal open={!!detailRow&&!!renderDetails}><section className="bui-advanced-grid-details" aria-label={m('grid.recordDetails','Record details')}><div><h3 ref={detailsHeading} tabIndex={-1}>{m('grid.detailsTitle','Details for {label}',{label:detailRow?.id??''})}</h3><Button size="sm" variant="ghost" leadingIcon={X} onClick={()=>{setDetails(null);if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true});}}>{m('grid.closeDetails','Close details')}</Button></div>{detailRow&&renderDetails?.(detailRow)}</section></Reveal>
    <p role="status" className="bui-hint">{notice}</p>
  </div>;
}
