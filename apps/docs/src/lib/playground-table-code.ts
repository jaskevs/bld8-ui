import {playgroundFilterFields,playgroundRows} from './playground-data';
import type {PlaygroundSettings} from './playground-state';

/** Standalone source: no documentation-app state, aliases or callbacks are required. */
export function playgroundTableCode(s:PlaygroundSettings){
  const path='@/components/ui/bld8/',q=JSON.stringify;
  const showFilters=s.component==='FilterBuilder'||s.advancedFilters,filtered=showFilters||s.appliedFilters.rules.length>0,bulk=s.bulkActions;
  const [key,direction]=s.tableSort.split('-');
  const query={search:s.tableSearch,filters:{status:s.tableStatus},sort:s.tableSort==='none'?null:{key,descending:direction==='desc'},page:s.tablePage,pageSize:s.pageSize};
  return `'use client';
import { useEffect, ${bulk?'useRef, ':''}useState } from "react";
import { DataTable, type Column, type TableQuery } from "${path}table";
import { Badge, Button${bulk?', Alert':''} } from "${path}core";
${bulk||showFilters?`import { Reveal } from "${path}reveal";\n`:''}${s.inlineEditing?`import { EditableCell } from "${path}editable-cell";\n`:''}${showFilters?`import { FilterBuilder } from "${path}filter-builder";\n`:''}${filtered?`import { filterRecords, emptyFilterQuery, ${showFilters?'filterQueryKey, validateFilterQuery, ':''}type FilterQuery, type FilterField } from "${path}filter-query";\n`:''}
type Project = {id:string;name:string;status:'Planned'|'Ready';due:string;effort:number};
const initialRows: Project[] = ${JSON.stringify(playgroundRows,null,2)};
${filtered?`const fields: readonly FilterField[] = ${JSON.stringify(playgroundFilterFields,null,2)};\n`:''}
export default function Example() {
  const [rows, setRows] = useState<Project[]>(initialRows);
  const [tableVersion, setTableVersion] = useState(0);
  const [selected, setSelected] = useState<string[]>(${q(s.tableSelected)});
  const [query, setQuery] = useState<TableQuery>(${q(query)});
  const [columnsShown, setColumnsShown] = useState<string[]>(${q(s.tableColumns)});
  const [collapsed, setCollapsed] = useState<string[]>(${q(s.collapsedGroups)});
  const [viewState, setViewState] = useState<string>(${q(s.state)});
  const [message, setMessage] = useState("");
${showFilters?`  const [filters, setFilters] = useState<FilterQuery>(${q(s.filters)});
  const [applied, setApplied] = useState<FilterQuery>(${q(s.appliedFilters)});
  const [filterErrors, setFilterErrors] = useState<Record<string,string>>({});
  function applyFilters() {
    const errors = validateFilterQuery(filters, fields);
    setFilterErrors(errors);
    if (!Object.keys(errors).length) { setApplied(filters); setQuery(current => ({...current,page:1})); setMessage("Filter conditions applied."); }
  }
`:filtered?`  const [applied, setApplied] = useState<FilterQuery>(${q(s.appliedFilters)});\n`:''}${bulk?`  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejectActions, setRejectActions] = useState(${s.actionResult==='Error'});
  const run = useRef<AbortController | null>(null);
  const latestSelection = useRef(selected);
  const action = useRef<HTMLButtonElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const table = useRef<HTMLDivElement>(null);
  useEffect(() => { latestSelection.current = selected; }, [selected]);
  useEffect(() => () => run.current?.abort(), []);
  useEffect(() => {
    if (!busy && actionError && (document.activeElement === document.body || document.activeElement === origin.current))
      (action.current ?? table.current)?.focus({preventScroll:true});
  }, [busy,actionError]);
  async function markReady(keys:string[], trigger:HTMLButtonElement) {
    if (run.current) return;
    const controller = new AbortController(); run.current = controller;
    origin.current = trigger; setBusy(true); setActionError("");
    try {
      // Simulated latency. Replace this wait with your abortable service request.
      await new Promise(resolve => setTimeout(resolve,500));
      if (controller.signal.aborted) return;
      if (rejectActions) throw new Error("The example update was rejected. No rows changed.");
      setRows(current => current.map(row => keys.includes(row.id) ? {...row,status:'Ready'} : row));
      setSelected(latestSelection.current.filter(key => !keys.includes(key)));
      setMessage(keys.length + " selected project" + (keys.length === 1 ? "" : "s") + " marked ready in this preview.");
    } catch (error) {
      if (!controller.signal.aborted) setActionError(error instanceof Error ? error.message : "The example update failed.");
    } finally {
      if (run.current === controller) { run.current = null; if (!controller.signal.aborted) setBusy(false); }
    }
  }
`:''}  const matching = ${filtered?'filterRecords(viewState === "Empty" ? [] : rows, applied, fields, (row,field) => row[field as keyof Project])':'(viewState === "Empty" ? [] : rows)'}
    .filter(row => row.name.toLowerCase().includes(query.search.toLowerCase()) && (!query.filters.status || row.status === query.filters.status));
  if (query.sort) {
    const key = query.sort.key as 'name'|'status'|'due';
    matching.sort((a,b) => a[key].localeCompare(b[key],undefined,{numeric:true}) * (query.sort!.descending ? -1 : 1));
  }
  const page = Math.min(query.page,Math.max(1,Math.ceil(matching.length / query.pageSize)));
  useEffect(() => { if (query.page !== page) setQuery(current => ({...current,page})); }, [page,query.page]);
  const columns: Column<Project>[] = [
    {key:'name',header:'Project',hideable:false,pinned:'start',width:260,minWidth:190,flex:1,sortValue:row=>row.name,
      cell:row=>${s.inlineEditing?`<EditableCell label={'Project name for '+row.name} value={row.name}${bulk?' disabled={busy}':''} validate={value=>value.trim().length<3?'Use at least three characters.':undefined} onSave={async value=>{setRows(current=>current.map(item=>item.id===row.id?{...item,name:value.trim()}:item));setMessage('Cell saved in this preview.');}}/>`:'<strong>{row.name}</strong>'}},
    {key:'status',header:'Status',width:144,minWidth:120,sortValue:row=>row.status,cell:row=><Badge tone={row.status==='Ready'?'success':'neutral'}>{row.status}</Badge>},
    {key:'due',header:'Review date',width:156,minWidth:140,sortValue:row=>row.due,cell:row=><time dateTime={row.due}>{row.due}</time>}
  ];
  function restore() {
    setRows(initialRows);setTableVersion(value=>value+1);setSelected([]);setViewState('Default');setCollapsed([]);
    setQuery(current=>({...current,search:'',filters:{status:''},sort:null,page:1}));
${bulk?'    setActionError("");\n':''}${showFilters?'    setFilters(emptyFilterQuery());setApplied(emptyFilterQuery());setFilterErrors({});\n':filtered?'    setApplied(emptyFilterQuery());\n':''}    setMessage('Example rows restored.');
  }
  return <div${bulk?' ref={table} tabIndex={-1} aria-label="Playground table example"':''}>
    <p>Local sample rows. Changes reset on reload.</p>
    <Button size="sm" variant="ghost"${bulk?' disabled={busy}':''} onClick={restore}>Restore example</Button>
${showFilters?`    <Reveal open>
      <FilterBuilder label="Project filters" fields={fields} value={filters} maxRules={6} errors={filterErrors} disabled={viewState==='Disabled'${bulk?'||busy':''}} onValueChange={value=>{setFilters(value);setFilterErrors({});}}/>
      <p>{filterQueryKey(filters)===filterQueryKey(applied)?'Results use these conditions':'Unapplied changes'}</p>
      <Button size="sm" variant="ghost" disabled={viewState==='Disabled'${bulk?'||busy':''}} onClick={()=>{setFilters(emptyFilterQuery());setApplied(emptyFilterQuery());setFilterErrors({});setQuery(current=>({...current,page:1}));}}>Clear conditions</Button>
      <Button size="sm" disabled={viewState==='Disabled'${bulk?'||busy':''}} onClick={applyFilters}>Apply filters</Button>
    </Reveal>
`:''}${bulk?`    <Reveal open={!!actionError}>{actionError?<Alert title="Bulk update needs attention" tone="danger" live>{actionError}<Button size="sm" variant="ghost" onClick={()=>{setRejectActions(false);setActionError('');action.current?.focus({preventScroll:true});}}>Use successful response</Button></Alert>:null}</Reveal>
`:''}    <DataTable key={tableVersion} caption="Playground projects" rows={matching.slice((page-1)*query.pageSize,page*query.pageSize)} columns={columns}
      rowKey={row=>row.id} rowLabel={row=>row.name} server={{query:{...query,page},totalRows:matching.length,onQueryChange:setQuery}}
      density=${q(s.density)}${s.selectable?' selectable selectedKeys={selected} onSelectedKeysChange={setSelected}':''}
      columnVisibility visibleColumnKeys={columnsShown} onVisibleColumnKeysChange={setColumnsShown}${s.resizable?' resizableColumns':''}
${s.groupRows?`      grouping={{key:row=>row.status,label:key=>key}} collapsedGroupKeys={collapsed} onCollapsedGroupKeysChange={setCollapsed}\n`:''}      filters={[{key:'status',label:'Statuses',options:[{value:'Planned',label:'Planned'},{value:'Ready',label:'Ready'}],value:row=>row.status}]}
      loading={viewState==='Loading'} error={viewState==='Error'?'The example service could not load projects.':undefined} onRetry={()=>setViewState('Default')}
${bulk?`      renderSelectedActions={keys=><Button ref={action} size="sm" loading={busy} disabled={viewState==='Loading'||viewState==='Error'} onClick={event=>void markReady(keys,event.currentTarget)}>Mark ready</Button>}`:''}/>
    <p role="status">{message}</p>
  </div>;
}
`;
}
