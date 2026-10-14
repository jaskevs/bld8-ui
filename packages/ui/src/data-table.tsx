'use client';
import { useId, useMemo, useRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { Alert, Button, Checkbox, EmptyState, Icon, Input, Pagination, Skeleton } from './core.js';
import { Popover } from './overlays.js';
import { useControllableValue } from './state.js';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
  hideable?: boolean;
  width?:number; minWidth?:number; pinned?:'start'|'end';
}
export interface TableFilter<T> { key:string; label:string; options:{value:string;label:string}[]; value:(row:T)=>string }
export interface TableQuery { search:string; filters:Record<string,string>; sort:{key:string;descending:boolean}|null; page:number; pageSize:number }
export const defaultTableQuery:TableQuery={search:'',filters:{},sort:null,page:1,pageSize:5};
export interface DataTableProps<T> {
  caption: string; rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string;
  searchText?: (row: T) => string; pageSize?: number;
  filters?: TableFilter<T>[];
  columnVisibility?: boolean;
  visibleColumnKeys?: string[];
  defaultVisibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys:string[])=>void;
  selectable?: boolean;
  rowLabel?: (row:T)=>string;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectedKeysChange?: (keys:string[])=>void;
  renderBulkActions?: (selectedRows:T[])=>ReactNode;
  density?: 'comfortable' | 'compact';
  loading?: boolean;
  error?: string;
  onRetry?: ()=>void;
  server?:{query:TableQuery; onQueryChange:(query:TableQuery)=>void; totalRows:number};
  renderSelectedActions?:(keys:string[])=>ReactNode;
  resizableColumns?:boolean;
}
/** Export explicit scalar values. Formula-leading strings are escaped for spreadsheets. */
export function createTableCSV<T>(rows:T[], columns:Column<T>[]) {
  const safe = (value:string|number) => {
    let text = String(value); if (typeof value === 'string' && /^(?:[\s\uFEFF]*[=+@-]|[\t\r\n])/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  };
  const exportable = columns.filter(column => column.exportValue || column.sortValue);
  return [exportable.map(column => safe(column.header)).join(','), ...rows.map(row => exportable.map(column => safe((column.exportValue ?? column.sortValue)!(row))).join(','))].join('\r\n');
}
function SelectionCheckbox({label, checked, mixed, onChange}:{label:string;checked:boolean;mixed?:boolean;onChange:()=>void}) {
  const ref=useRef<HTMLInputElement>(null);
  useEffect(() => {if(ref.current) ref.current.indeterminate=!!mixed;},[mixed]);
  return <input ref={ref} type="checkbox" className="bui-checkbox" aria-label={label} aria-checked={mixed ? 'mixed' : checked} checked={checked} onChange={onChange} />;
}
export function DataTable<T>({ caption, rows, columns, rowKey, searchText, pageSize = 5, filters = [], columnVisibility = false,
  visibleColumnKeys, defaultVisibleColumnKeys, onVisibleColumnKeysChange, selectable = false, rowLabel = rowKey,
  selectedKeys, defaultSelectedKeys = [], onSelectedKeysChange, renderBulkActions, density = 'comfortable', loading, error, onRetry, server, renderSelectedActions, resizableColumns=false }: DataTableProps<T>) {
  const id=useId();
  const [local,setLocal]=useState<TableQuery>({...defaultTableQuery,pageSize});
  const state=server?.query ?? {...local,pageSize};
  const query=state.search, page=state.page, facets=state.filters, sort=state.sort;
  const changeQuery=(patch:Partial<TableQuery>)=>{const next={...state,...patch};if(server)server.onQueryChange(next);else setLocal(next);};
  const [widths,setWidths]=useState<Record<string,number>>({});
  const [selected,setSelected]=useControllableValue(selectedKeys,defaultSelectedKeys,onSelectedKeysChange);
  const [shown,setShown]=useControllableValue(visibleColumnKeys,defaultVisibleColumnKeys ?? columns.map(column=>column.key),onVisibleColumnKeysChange);
  const activeColumns=columns.filter(column=>column.hideable===false || shown.includes(column.key));
  const displayedColumns=activeColumns.length ? activeColumns : columns.slice(0,1);
  const selectedSet=new Set(selected); const selectedRows=rows.filter(row=>selectedSet.has(rowKey(row)));
  const visible=useMemo(() => {
    if(server)return rows;
    const result=rows.filter(row=>(!searchText || searchText(row).toLocaleLowerCase().includes(query.toLocaleLowerCase())) && filters.every(filter=>!facets[filter.key] || filter.value(row)===facets[filter.key]));
    const column=columns.find(item=>item.key===sort?.key);
    if(column?.sortValue) { const get=column.sortValue; result.sort((a,b)=>{const av=get(a),bv=get(b);const order=typeof av==='number' && typeof bv==='number' ? av-bv : String(av).localeCompare(String(bv),undefined,{numeric:true});return sort?.descending ? -order : order;}); }
    return result;
  },[rows,columns,searchText,query,sort,filters,facets,server]);
  const size=Number.isFinite(state.pageSize) ? Math.max(1,Math.floor(state.pageSize)) : 5;
  const total=server ? Math.max(0,server.totalRows) : visible.length;
  const pages=Math.max(1,Math.ceil(total/size)); const activePage=Math.min(page,pages);
  const pageRows=server ? rows : visible.slice((activePage-1)*size,activePage*size);
  const pageSelected=pageRows.filter(row=>selectedSet.has(rowKey(row))).length;
  const toggle=(keys:string[])=>{const next=new Set(selected);const all=keys.every(key=>next.has(key));keys.forEach(key=>all ? next.delete(key) : next.add(key));setSelected([...next]);};
  const width=(column:Column<T>)=>widths[column.key] ?? column.width ?? 180;
  const columnStyle=(column:Column<T>):CSSProperties=>{
    const index=displayedColumns.indexOf(column);
    const offset=column.pinned==='start' ? displayedColumns.slice(0,index).filter(item=>item.pinned==='start').reduce((sum,item)=>sum+width(item),selectable?48:0) : displayedColumns.slice(index+1).filter(item=>item.pinned==='end').reduce((sum,item)=>sum+width(item),0);
    return {width:resizableColumns || column.pinned ? width(column):column.width,minWidth:column.minWidth ?? 100,...(column.pinned ? {insetInlineStart:column.pinned==='start'?offset:undefined,insetInlineEnd:column.pinned==='end'?offset:undefined,zIndex:1,background:'var(--bui-bg)'}:{})};
  };
  const resize=(column:Column<T>,value:number)=>setWidths(current=>({...current,[column.key]:Math.min(600,Math.max(column.minWidth ?? 100,value))}));
  return <div className="bui-data-table" data-density={density} aria-busy={loading || undefined}>
    {(searchText || server || filters.length>0 || columnVisibility) && <div className="bui-table-toolbar">
      {(searchText || server) && <Input type="search" aria-label={'Search ' + caption.toLowerCase()} placeholder="Filter records…" value={query} onChange={event=>{changeQuery({search:event.target.value,page:1});}} />}
      {filters.map(filter=><label className="bui-table-filter" key={filter.key} htmlFor={id+filter.key}><span className="bui-sr-only">{filter.label}</span><select id={id+filter.key} className="bui-input" disabled={loading} value={facets[filter.key] ?? ''} onChange={event=>{changeQuery({filters:{...facets,[filter.key]:event.target.value},page:1});}}><option value="">All {filter.label.toLowerCase()}</option>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
      <span className="bui-hint" aria-live="polite">{total} results</span>
      {columnVisibility && <Popover title="Visible columns" trigger={<Button variant="secondary" size="sm" leadingIcon={SlidersHorizontal}>Columns</Button>}><div className="bui-column-options">{columns.map(column=><Checkbox key={column.key} label={column.header} checked={displayedColumns.some(item=>item.key===column.key)} disabled={column.hideable===false || (displayedColumns.length===1 && displayedColumns[0].key===column.key)} onChange={event=>setShown(event.target.checked ? [...shown,column.key] : shown.filter(key=>key!==column.key))} />)}</div></Popover>}
    </div>}
    {selectable && selected.length>0 && <div className="bui-table-selection"><span role="status">{selected.length} selected</span><div>{renderSelectedActions ? renderSelectedActions(selected) : renderBulkActions?.(selectedRows)}<Button size="sm" variant="ghost" onClick={()=>setSelected([])}>Clear selection</Button></div></div>}
    {error ? <Alert title="Unable to load records" tone="danger" live>{error}{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}</Alert> : loading ? <div className="bui-table-loading"><span role="status" className="bui-hint">Loading {caption.toLowerCase()}…</span>{[0,1,2].map(index=><Skeleton key={index} height="3rem" />)}</div> : <>
      <div className="bui-table-scroll" tabIndex={0} role="region" aria-label={caption + ' table'}><table className="bui-table" style={resizableColumns?{tableLayout:'fixed',minWidth:displayedColumns.reduce((sum,column)=>sum+width(column),selectable?48:0)}:undefined}><caption className="bui-sr-only">{caption}</caption><thead><tr>
        {selectable && <th scope="col" className="bui-table-check"><SelectionCheckbox label="Select current page" checked={pageRows.length>0 && pageSelected===pageRows.length} mixed={pageSelected>0 && pageSelected<pageRows.length} onChange={()=>toggle(pageRows.map(rowKey))} /></th>}
        {displayedColumns.map(column=><th scope="col" key={column.key} data-pinned={column.pinned} style={columnStyle(column)} aria-sort={column.sortValue ? sort?.key===column.key ? sort.descending ? 'descending' : 'ascending' : 'none' : undefined}>{column.sortValue ? <button type="button" onClick={()=>{changeQuery({sort:sort?.key===column.key && sort.descending ? null : {key:column.key,descending:sort?.key===column.key && !sort.descending},page:1});}}>{column.header}<Icon icon={sort?.key===column.key ? sort.descending ? ArrowDown : ArrowUp : ArrowUpDown} size={14} /></button> : column.header}{resizableColumns && <span className="bui-column-resize" role="separator" tabIndex={0} aria-label={'Resize '+column.header} aria-orientation="vertical" aria-valuemin={column.minWidth ?? 100} aria-valuemax={600} aria-valuenow={width(column)} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();resize(column,width(column)+(event.key==='ArrowRight'?10:-10));}if(event.key==='Home'){event.preventDefault();resize(column,column.minWidth ?? 100);}}} onPointerDown={event=>{event.preventDefault();const start=event.clientX,initial=width(column);const target=event.currentTarget;target.setPointerCapture(event.pointerId);const move=(move:PointerEvent)=>resize(column,initial+move.clientX-start);const stop=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',stop);target.removeEventListener('pointercancel',stop);};target.addEventListener('pointermove',move);target.addEventListener('pointerup',stop);target.addEventListener('pointercancel',stop);}} />}</th>)}
      </tr></thead><tbody>{pageRows.map(row=><tr key={rowKey(row)} data-selected={selectable && selectedSet.has(rowKey(row)) || undefined}>
        {selectable && <td className="bui-table-check"><SelectionCheckbox label={'Select ' + rowLabel(row)} checked={selectedSet.has(rowKey(row))} onChange={()=>toggle([rowKey(row)])} /></td>}
        {displayedColumns.map(column=><td key={column.key} data-pinned={column.pinned} style={columnStyle(column)}>{column.cell(row)}</td>)}
      </tr>)}</tbody></table></div>
      {visible.length===0 && <EmptyState title={!query && !Object.values(facets).some(Boolean) ? 'No records yet' : 'No matching records'} action={query || Object.values(facets).some(Boolean) ? <Button variant="secondary" size="sm" onClick={()=>{changeQuery({search:'',filters:{},page:1});}}>Clear filter</Button> : undefined}>{!query && !Object.values(facets).some(Boolean) ? 'Records will appear here when they are added.' : 'Try another search or filter.'}</EmptyState>}
      {resizableColumns && <p className="bui-table-scroll-hint bui-hint">Scroll horizontally to see every column.</p>}
      <Pagination page={activePage} totalPages={pages} onPageChange={page=>changeQuery({page})} />
    </>}
  </div>;
}
