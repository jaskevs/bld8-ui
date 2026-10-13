'use client';
import { useId, useMemo, useRef, useEffect, useState, type ReactNode } from 'react';
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
}
export interface TableFilter<T> { key:string; label:string; options:{value:string;label:string}[]; value:(row:T)=>string }
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
  selectedKeys, defaultSelectedKeys = [], onSelectedKeysChange, renderBulkActions, density = 'comfortable', loading, error, onRetry }: DataTableProps<T>) {
  const id=useId(); const [query,setQuery]=useState(''); const [page,setPage]=useState(1);
  const [facets,setFacets]=useState<Record<string,string>>({}); const [sort,setSort]=useState<{key:string;descending:boolean}|null>(null);
  const [selected,setSelected]=useControllableValue(selectedKeys,defaultSelectedKeys,onSelectedKeysChange);
  const [shown,setShown]=useControllableValue(visibleColumnKeys,defaultVisibleColumnKeys ?? columns.map(column=>column.key),onVisibleColumnKeysChange);
  const activeColumns=columns.filter(column=>column.hideable===false || shown.includes(column.key));
  const displayedColumns=activeColumns.length ? activeColumns : columns.slice(0,1);
  const selectedSet=new Set(selected); const selectedRows=rows.filter(row=>selectedSet.has(rowKey(row)));
  const visible=useMemo(() => {
    const result=rows.filter(row=>(!searchText || searchText(row).toLocaleLowerCase().includes(query.toLocaleLowerCase())) && filters.every(filter=>!facets[filter.key] || filter.value(row)===facets[filter.key]));
    const column=columns.find(item=>item.key===sort?.key);
    if(column?.sortValue) { const get=column.sortValue; result.sort((a,b)=>{const av=get(a),bv=get(b);const order=typeof av==='number' && typeof bv==='number' ? av-bv : String(av).localeCompare(String(bv),undefined,{numeric:true});return sort?.descending ? -order : order;}); }
    return result;
  },[rows,columns,searchText,query,sort,filters,facets]);
  const size=Number.isFinite(pageSize) ? Math.max(1,Math.floor(pageSize)) : 5;
  const pages=Math.max(1,Math.ceil(visible.length/size)); const activePage=Math.min(page,pages);
  const pageRows=visible.slice((activePage-1)*size,activePage*size);
  const pageSelected=pageRows.filter(row=>selectedSet.has(rowKey(row))).length;
  const toggle=(keys:string[])=>{const next=new Set(selectedRows.map(rowKey));const all=keys.every(key=>next.has(key));keys.forEach(key=>all ? next.delete(key) : next.add(key));setSelected([...next]);};
  return <div className="bui-data-table" data-density={density} aria-busy={loading || undefined}>
    {(searchText || filters.length>0 || columnVisibility) && <div className="bui-table-toolbar">
      {searchText && <Input type="search" disabled={loading} aria-label={'Search ' + caption.toLowerCase()} placeholder="Filter records…" value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}} />}
      {filters.map(filter=><label className="bui-table-filter" key={filter.key} htmlFor={id+filter.key}><span className="bui-sr-only">{filter.label}</span><select id={id+filter.key} className="bui-input" disabled={loading} value={facets[filter.key] ?? ''} onChange={event=>{setFacets({...facets,[filter.key]:event.target.value});setPage(1);}}><option value="">All {filter.label.toLowerCase()}</option>{filter.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
      <span className="bui-hint" aria-live="polite">{visible.length} results</span>
      {columnVisibility && <Popover title="Visible columns" trigger={<Button variant="secondary" size="sm" leadingIcon={SlidersHorizontal}>Columns</Button>}><div className="bui-column-options">{columns.map(column=><Checkbox key={column.key} label={column.header} checked={displayedColumns.some(item=>item.key===column.key)} disabled={column.hideable===false || (displayedColumns.length===1 && displayedColumns[0].key===column.key)} onChange={event=>setShown(event.target.checked ? [...shown,column.key] : shown.filter(key=>key!==column.key))} />)}</div></Popover>}
    </div>}
    {selectable && selectedRows.length>0 && <div className="bui-table-selection"><span role="status">{selectedRows.length} selected</span><div>{renderBulkActions?.(selectedRows)}<Button size="sm" variant="ghost" onClick={()=>setSelected([])}>Clear selection</Button></div></div>}
    {error ? <Alert title="Unable to load records" tone="danger" live>{error}{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}</Alert> : loading ? <div className="bui-table-loading"><span role="status" className="bui-hint">Loading {caption.toLowerCase()}…</span>{[0,1,2].map(index=><Skeleton key={index} height="3rem" />)}</div> : <>
      <div className="bui-table-scroll" tabIndex={0} role="region" aria-label={caption + ' table'}><table className="bui-table"><caption className="bui-sr-only">{caption}</caption><thead><tr>
        {selectable && <th scope="col" className="bui-table-check"><SelectionCheckbox label="Select current page" checked={pageRows.length>0 && pageSelected===pageRows.length} mixed={pageSelected>0 && pageSelected<pageRows.length} onChange={()=>toggle(pageRows.map(rowKey))} /></th>}
        {displayedColumns.map(column=><th scope="col" key={column.key} aria-sort={column.sortValue ? sort?.key===column.key ? sort.descending ? 'descending' : 'ascending' : 'none' : undefined}>{column.sortValue ? <button type="button" onClick={()=>{setSort(sort?.key===column.key && sort.descending ? null : {key:column.key,descending:sort?.key===column.key && !sort.descending});setPage(1);}}>{column.header}<Icon icon={sort?.key===column.key ? sort.descending ? ArrowDown : ArrowUp : ArrowUpDown} size={14} /></button> : column.header}</th>)}
      </tr></thead><tbody>{pageRows.map(row=><tr key={rowKey(row)} data-selected={selectable && selectedSet.has(rowKey(row)) || undefined}>
        {selectable && <td className="bui-table-check"><SelectionCheckbox label={'Select ' + rowLabel(row)} checked={selectedSet.has(rowKey(row))} onChange={()=>toggle([rowKey(row)])} /></td>}
        {displayedColumns.map(column=><td key={column.key}>{column.cell(row)}</td>)}
      </tr>)}</tbody></table></div>
      {visible.length===0 && <EmptyState title={rows.length===0 ? 'No records yet' : 'No matching records'} action={rows.length>0 ? <Button variant="secondary" size="sm" onClick={()=>{setQuery('');setFacets({});setPage(1);}}>Clear filter</Button> : undefined}>{rows.length===0 ? 'Records will appear here when they are added.' : 'Try another search or filter.'}</EmptyState>}
      <Pagination page={activePage} totalPages={pages} onPageChange={setPage} />
    </>}
  </div>;
}
