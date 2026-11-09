'use client';
import {useEffect,useRef,useState} from 'react';
import {Alert,Badge,Button,DataTable,EditableCell,FilterBuilder,Reveal,type Column,type TableQuery} from '@bld8/ui';
import {emptyFilterQuery,filterQueryKey,filterRecords,validateFilterQuery} from '@bld8/ui/filter-query';
import {playgroundFilterFields,playgroundRows,type PlaygroundProject} from '@/lib/playground-data';
import type {PlaygroundSettings} from '@/lib/playground-state';

export function PlaygroundTable({settings:s,update,onMessage}:{settings:PlaygroundSettings;update:(patch:Partial<PlaygroundSettings>)=>void;onMessage:(value:string)=>void}){
  const [rows,setRows]=useState(()=>playgroundRows.map(row=>({...row}))),[busy,setBusy]=useState(false),[actionError,setActionError]=useState(''),[errors,setErrors]=useState<Record<string,string>>({}),[tableVersion,setTableVersion]=useState(0);
  const run=useRef<AbortController|null>(null),latest=useRef(s),action=useRef<HTMLButtonElement>(null),origin=useRef<HTMLElement|null>(null),table=useRef<HTMLDivElement>(null);
  useEffect(()=>{latest.current=s;},[s]);useEffect(()=>()=>run.current?.abort(),[]);
  useEffect(()=>{if(!busy&&actionError&&(document.activeElement===document.body||document.activeElement===origin.current))(action.current??table.current)?.focus({preventScroll:true});},[busy,actionError]);
  const [sortKey,sortDirection]=s.tableSort.split('-');
  const query:TableQuery={search:s.tableSearch,filters:{status:s.tableStatus},sort:s.tableSort==='none'?null:{key:sortKey,descending:sortDirection==='desc'},page:s.tablePage,pageSize:s.pageSize};
  const matching=filterRecords(s.state==='Empty'?[]:rows,s.appliedFilters,playgroundFilterFields,(row,key)=>row[key as keyof PlaygroundProject]).filter(row=>row.name.toLowerCase().includes(query.search.toLowerCase())&&(!query.filters.status||row.status===query.filters.status));
  if(query.sort){const key=query.sort.key as 'name'|'status'|'due';matching.sort((a,b)=>a[key].localeCompare(b[key],undefined,{numeric:true})*(query.sort!.descending?-1:1));}
  const page=Math.min(query.page,Math.max(1,Math.ceil(matching.length/query.pageSize)));
  useEffect(()=>{if(s.tablePage!==page)update({tablePage:page});},[page,s.tablePage]);
  function changeQuery(next:TableQuery){update({tableSearch:next.search,tableStatus:(next.filters.status??'') as PlaygroundSettings['tableStatus'],tableSort:next.sort?next.sort.key+'-'+(next.sort.descending?'desc':'asc'):'none',tablePage:next.page});}
  async function markReady(keys:string[],trigger:HTMLButtonElement){
    if(run.current)return;const controller=new AbortController();run.current=controller;origin.current=trigger;setBusy(true);setActionError('');
    try{
      await new Promise(resolve=>setTimeout(resolve,500));if(controller.signal.aborted)return;
      if(s.actionResult==='Error')throw new Error('The example update was rejected. No rows changed.');
      setRows(current=>current.map(row=>keys.includes(row.id)?{...row,status:'Ready'}:row));
      update({tableSelected:latest.current.tableSelected.filter(key=>!keys.includes(key))});onMessage(keys.length+' selected project'+(keys.length===1?'':'s')+' marked ready in this preview.');
    }catch(cause){if(!controller.signal.aborted)setActionError(cause instanceof Error?cause.message:'The example update failed.');}
    finally{if(run.current===controller){run.current=null;if(!controller.signal.aborted)setBusy(false);}}
  }
  function apply(){const next=validateFilterQuery(s.filters,playgroundFilterFields);setErrors(next);if(!Object.keys(next).length){update({appliedFilters:s.filters,tablePage:1});onMessage('Filter conditions applied.');}}
  function restore(){setRows(playgroundRows.map(row=>({...row})));setTableVersion(value=>value+1);setActionError('');setErrors({});update({state:'Default',tableSelected:[],tableSearch:'',tableStatus:'',tableSort:'none',tablePage:1,collapsedGroups:[],filters:emptyFilterQuery(),appliedFilters:emptyFilterQuery()});onMessage('Example rows restored.');}
  const columns:Column<PlaygroundProject>[]=[
    {key:'name',header:'Project',hideable:false,pinned:'start',width:260,minWidth:190,flex:1,sortValue:row=>row.name,cell:row=>s.inlineEditing?<EditableCell label={'Project name for '+row.name} value={row.name} disabled={busy} validate={value=>value.trim().length<3?'Use at least three characters.':undefined} onSave={async value=>{setRows(current=>current.map(item=>item.id===row.id?{...item,name:value.trim()}:item));onMessage('Cell saved in this preview.');}}/>:<strong>{row.name}</strong>},
    {key:'status',header:'Status',width:144,minWidth:120,sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Ready'?'success':'neutral'}>{row.status}</Badge>},
    {key:'due',header:'Review date',width:156,minWidth:140,sortValue:row=>row.due,cell:row=><time dateTime={row.due}>{row.due}</time>},
  ];
  const filtersOpen=s.component==='FilterBuilder'||s.advancedFilters;
  return <div className="playground-table" ref={table} tabIndex={-1} aria-label="Playground table example">
    <div className="playground-table-tools"><p className="bui-hint">Local sample rows. Changes reset on reload.{s.appliedFilters.rules.length?` ${s.appliedFilters.rules.length} applied condition${s.appliedFilters.rules.length===1?'':'s'}.`:''}</p><Button size="sm" variant="ghost" disabled={busy} onClick={restore}>Restore example</Button></div>
    <Reveal open={filtersOpen} className="playground-table-notice"><div className="playground-filter-panel"><FilterBuilder label="Project filters" fields={playgroundFilterFields} value={s.filters} maxRules={6} errors={errors} disabled={s.state==='Disabled'||busy} onValueChange={filters=>{setErrors({});update({filters});}}/><div className="playground-filter-actions"><span className="bui-hint">{filterQueryKey(s.filters)===filterQueryKey(s.appliedFilters)?'Results use these conditions':'Unapplied changes'}</span><div><Button size="sm" variant="ghost" disabled={s.state==='Disabled'||busy} onClick={()=>{setErrors({});update({filters:emptyFilterQuery(),appliedFilters:emptyFilterQuery(),tablePage:1});}}>Clear conditions</Button><Button size="sm" disabled={s.state==='Disabled'||busy} onClick={apply}>Apply filters</Button></div></div></div></Reveal>
    <Reveal open={!!actionError} className="playground-table-notice">{actionError?<Alert title="Bulk update needs attention" tone="danger" live>{actionError}<Button size="sm" variant="ghost" onClick={()=>{update({actionResult:'Success'});setActionError('');action.current?.focus({preventScroll:true});}}>Use successful response</Button></Alert>:null}</Reveal>
    <DataTable key={tableVersion} caption="Playground projects" rows={matching.slice((page-1)*query.pageSize,page*query.pageSize)} columns={columns} rowKey={row=>row.id} rowLabel={row=>row.name} server={{query:{...query,page},onQueryChange:changeQuery,totalRows:matching.length}} density={s.density} selectable={s.selectable} selectedKeys={s.tableSelected} onSelectedKeysChange={tableSelected=>update({tableSelected})} columnVisibility visibleColumnKeys={s.tableColumns} onVisibleColumnKeysChange={tableColumns=>update({tableColumns})} resizableColumns={s.resizable} grouping={s.groupRows?{key:row=>row.status,label:key=>key}:undefined} collapsedGroupKeys={s.collapsedGroups} onCollapsedGroupKeysChange={collapsedGroups=>update({collapsedGroups})} filters={[{key:'status',label:'Statuses',options:[{value:'Planned',label:'Planned'},{value:'Ready',label:'Ready'}],value:row=>row.status}]} loading={s.state==='Loading'} error={s.state==='Error'?'The example service could not load projects.':undefined} onRetry={()=>update({state:'Default'})} renderSelectedActions={s.bulkActions?keys=><Button ref={action} size="sm" loading={busy} disabled={s.state==='Loading'||s.state==='Error'} onClick={event=>void markReady(keys,event.currentTarget)}>Mark ready</Button>:undefined}/>
  </div>;
}
