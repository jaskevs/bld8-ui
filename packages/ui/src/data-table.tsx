'use client';
import { useId, useMemo, useRef, useEffect, useLayoutEffect, useState, useContext, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Alert, Button, Checkbox, EmptyState, Icon, Input, Pagination, Skeleton, Spinner } from './core.js';
import { Dialog, Popover } from './overlays.js';
import { Select } from './controls.js';
import { useControllableValue } from './state.js';
import {Reveal} from './reveal.js';
import { buildTableRows, getTablePage, type TableGrouping, type TableRowNode } from './table-grouping.js';
import {TableOrderingContext,TableColumnOrder} from './table-order-controls.js';
import type {TableRowMove} from './table-row-order.js';
import {defaultTableQuery,tableSorts,cycleTableSort,type TableQuery} from './table-query.js';
export {defaultTableQuery,tableSorts,cycleTableSort,type TableQuery,type TableSort} from './table-query.js';
export {applyTableRowMove,type TableRowMove} from './table-row-order.js';
export type { TableGrouping } from './table-grouping.js';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
  hideable?: boolean;
  width?:number; minWidth?:number; pinned?:'start'|'end';
  align?:'start'|'center'|'end';
  /** Extra available width is assigned to flexible columns. */
  flex?:number;
  resizable?:boolean;
}
export interface TableFilter<T> { key:string; label:string; options:{value:string;label:string}[]; value:(row:T)=>string }
export interface DataTableProps<T> {
  /** Client groups cover the filtered dataset; server groups describe only the supplied page. */
  grouping?: TableGrouping<T>;
  collapsedGroupKeys?: string[];
  defaultCollapsedGroupKeys?: string[];
  onCollapsedGroupKeysChange?: (keys:string[])=>void;
  caption: string; rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string;
  searchText?: (row: T) => string; pageSize?: number;
  filters?: TableFilter<T>[];
  /** Shift-select a column heading to add up to five ordered sort criteria. */
  multiSort?:boolean;
  columnVisibility?: boolean;
  /** Additional view controls inside the Columns popover. */
  viewOptions?:ReactNode;
  visibleColumnKeys?: string[];
  defaultVisibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys:string[])=>void;
  /** Reorder every column in the Columns menu, including hidden columns. */
  reorderableColumns?:boolean;
  columnOrderKeys?:string[];
  defaultColumnOrderKeys?:string[];
  onColumnOrderKeysChange?:(keys:string[])=>void;
  columnWidths?:Record<string,number>;
  defaultColumnWidths?:Record<string,number>;
  onColumnWidthsChange?:(widths:Record<string,number>)=>void;
  columnPinning?:Record<string,'start'|'end'>;
  /** Manual moves require an unfiltered, unsorted client table. The host saves and applies the order. */
  onRowMove?:(move:TableRowMove)=>void|Promise<void>;
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
  /** Custom empty feedback for composed filter workflows. */
  emptyState?:ReactNode;
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
function SelectionCheckbox({label, checked, mixed, onChange}:{label:string;checked:boolean;mixed?:boolean;onChange:(input:HTMLInputElement)=>void}) {
  const ref=useRef<HTMLInputElement>(null);
  useEffect(() => {if(ref.current) ref.current.indeterminate=!!mixed;},[mixed]);
  return <label className="bui-table-select"><input ref={ref} type="checkbox" className="bui-checkbox" aria-label={label} aria-checked={mixed ? 'mixed' : checked} checked={checked} onChange={event=>onChange(event.currentTarget)} /></label>;
}
export function DataTable<T>({ caption, rows, columns, rowKey, searchText, pageSize = 5, filters = [], columnVisibility = false,
  visibleColumnKeys, defaultVisibleColumnKeys, onVisibleColumnKeysChange, selectable = false, rowLabel = rowKey,
  selectedKeys, defaultSelectedKeys = [], onSelectedKeysChange, renderBulkActions, density = 'comfortable', loading, error, onRetry, server, renderSelectedActions, resizableColumns=false, viewOptions, emptyState, grouping, collapsedGroupKeys, defaultCollapsedGroupKeys=[], onCollapsedGroupKeysChange,
  reorderableColumns=false,columnOrderKeys,defaultColumnOrderKeys,onColumnOrderKeysChange,columnWidths,defaultColumnWidths={},onColumnWidthsChange,columnPinning,onRowMove,multiSort=false }: DataTableProps<T>) {
  const id=useId();
  const [columnMenuOpen,setColumnMenuOpen]=useState(false),[movingColumn,setMovingColumn]=useState<string|null>(null),[columnPosition,setColumnPosition]=useState('end');
  const pendingColumn=useRef<string|null>(null),columnsTrigger=useRef<HTMLButtonElement|null>(null);
  const {Context:TableOrderContext,Row:OrderedTableRow}=useContext(TableOrderingContext);
  const tableRoot=useRef<HTMLDivElement>(null);
  const selectionOrigin=useRef<HTMLInputElement|null>(null);
  const actionFocus=useRef<HTMLElement|null>(null);
  const [groupNotice,setGroupNotice]=useState('');
  const [local,setLocal]=useState<TableQuery>({...defaultTableQuery,pageSize});
  const state=server?.query ?? {...local,pageSize};
  const query=state.search, page=state.page, facets=state.filters, sort=state.sort;
  const sorts=useMemo(()=>tableSorts(state),[state.sort,state.sorts]);
  const changeQuery=(patch:Partial<TableQuery>)=>{const next={...state,...patch};if(server)server.onQueryChange(next);else setLocal(next);};
  const [widths,setWidths]=useControllableValue(columnWidths,defaultColumnWidths,onColumnWidthsChange);
  const [order,setOrder]=useControllableValue(columnOrderKeys,defaultColumnOrderKeys??columns.map(column=>column.key),onColumnOrderKeysChange);
  const pins=columnPinning??Object.fromEntries(columns.filter(column=>column.pinned).map(column=>[column.key,column.pinned!]));
  const [movingRow,setMovingRow]=useState<string|null>(null),[movePosition,setMovePosition]=useState('end'),[moveNotice,setMoveNotice]=useState(''),[moveError,setMoveError]=useState(''),[savingOrder,setSavingOrder]=useState(false);
  const moveFocus=useRef<HTMLElement|null>(null),moveForm=useRef<HTMLFormElement>(null),movePending=useRef(false),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const [scrollElement,setScrollElement]=useState<HTMLDivElement|null>(null);
  const [viewportWidth,setViewportWidth]=useState(0);
  useEffect(()=>{if(!scrollElement)return;const observer=new ResizeObserver(([entry])=>setViewportWidth(Math.floor(entry.contentRect.width)));observer.observe(scrollElement);return()=>observer.disconnect();},[scrollElement]);
  const [selected,setSelected]=useControllableValue(selectedKeys,defaultSelectedKeys,onSelectedKeysChange);
  function restoreSelectionFocus(){const target=selectionOrigin.current?.isConnected?selectionOrigin.current:scrollElement??tableRoot.current?.querySelector<HTMLInputElement>('thead input[type="checkbox"]');target?.focus({preventScroll:true});}
  useLayoutEffect(()=>{if(!selected.length&&actionFocus.current){const active=document.activeElement;if(active===document.body||actionFocus.current===active)restoreSelectionFocus();actionFocus.current=null;}},[selected.length]);
  const [shown,setShown]=useControllableValue(visibleColumnKeys,defaultVisibleColumnKeys ?? columns.map(column=>column.key),onVisibleColumnKeysChange);
  const [collapsed,setCollapsed]=useControllableValue(collapsedGroupKeys,defaultCollapsedGroupKeys,onCollapsedGroupKeysChange);
  const orderedKeys=[...new Set([...order,...columns.map(column=>column.key)])];
  const unpinnedOrder=orderedKeys.flatMap(key=>{const column=columns.find(item=>item.key===key);return column?[{...column,pinned:pins[key]}]:[];});
  const orderedColumns=[...unpinnedOrder.filter(column=>column.pinned==='start'),...unpinnedOrder.filter(column=>!column.pinned),...unpinnedOrder.filter(column=>column.pinned==='end')];
  const activeColumns=orderedColumns.filter(column=>column.hideable===false || shown.includes(column.key));
  const displayedColumns=activeColumns.length ? activeColumns : columns.slice(0,1);
  const selectedSet=new Set(selected); const selectedRows=rows.filter(row=>selectedSet.has(rowKey(row)));
  const visible=useMemo(() => {
    if(server)return rows;
    const result=rows.filter(row=>(!searchText || searchText(row).toLocaleLowerCase().includes(query.toLocaleLowerCase())) && filters.every(filter=>!facets[filter.key] || filter.value(row)===facets[filter.key]));
    result.sort((a,b)=>{for(const criterion of sorts){const get=columns.find(item=>item.key===criterion.key)?.sortValue;if(!get)continue;const av=get(a),bv=get(b);const order=typeof av==='number' && typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true});if(order)return criterion.descending?-order:order;}return 0;});
    return result;
  },[rows,columns,searchText,query,sorts,filters,facets,server]);
  const size=Number.isFinite(state.pageSize) ? Math.max(1,Math.floor(state.pageSize)) : 5;
  const total=server ? Math.max(0,server.totalRows) : visible.length;
  const groupedNodes=useMemo(()=>grouping?buildTableRows(visible,rowKey,grouping,collapsed):[],[visible,rowKey,grouping,collapsed]);
  const groupedPage=grouping&&!server?getTablePage(groupedNodes,Math.max(1,Math.floor(page)||1),size):null;
  const pages=groupedPage?.pages??Math.max(1,Math.ceil(total/size)); const activePage=groupedPage?.page??Math.min(page,pages);
  const bodyNodes=grouping?(groupedPage?.nodes??groupedNodes):[];
  const pageRows=grouping?bodyNodes.flatMap(node=>node.kind==='row'?[node.row]:[]):server?rows:visible.slice((activePage-1)*size,activePage*size);
  const rowMoveReason=server?'Row order is managed by the connected service.':grouping?'Remove grouping before moving rows.':sorts.length?'Clear sorting before moving rows.':query||Object.values(facets).some(Boolean)?'Clear search and filters before moving rows.':'';
  const canMoveRows=!!onRowMove&&!rowMoveReason&&!loading&&!error&&!savingOrder&&pageRows.length>1;
  const leadingWidth=(selectable?48:0)+(onRowMove?48:0);
  function focusRow(key:string){requestAnimationFrame(()=>tableRoot.current?.querySelector<HTMLButtonElement>('[data-row-key="'+CSS.escape(key)+'"] .bui-table-reorder button')?.focus({preventScroll:true}));}
  async function moveRow(move:TableRowMove){
    if(!canMoveRows||movePending.current||!onRowMove)return;
    if(!pageRows.some(row=>rowKey(row)===move.rowKey)||!pageRows.some(row=>rowKey(row)===move.targetKey)){setMoveError('The row position is no longer available.');return;}
    const focusAtStart=document.activeElement;
    movePending.current=true;setSavingOrder(true);setMoveError('');setMoveNotice('Saving row position…');
    try{await onRowMove(move);if(mounted.current){setMovingRow(null);setMoveNotice('Row move completed.');}}
    catch{if(mounted.current){setMoveNotice('');setMoveError('The row position could not be saved. Review the current order and try again.');}}
    finally{movePending.current=false;if(mounted.current){setSavingOrder(false);const active=document.activeElement;if(!movingRow){if(active===document.body||active===focusAtStart)focusRow(move.rowKey);}else requestAnimationFrame(()=>{const form=moveForm.current,active=document.activeElement;if(form&&(active===document.body||form.contains(active)||form.closest('[role=dialog]')===active))form.querySelector<HTMLButtonElement>('button[type=submit]')?.focus({preventScroll:true});});}}
  }
  function moveColumn(key:string,target:string,after:boolean){if(key===target||!orderedColumns.some(column=>column.key===key)||!orderedColumns.some(column=>column.key===target)){setMoveNotice('That column position is no longer available.');return;}if(pins[key]!==pins[target]){setMoveNotice('Pinned columns stay at their logical edge. Unpin a column before moving it across that edge.');return;}const next=orderedColumns.map(column=>column.key).filter(item=>item!==key),index=next.indexOf(target);if(index<0)return;next.splice(index+(after?1:0),0,key);setOrder(next);setMoveNotice('Column order updated.');}
  const bodySections: {header?:Extract<TableRowNode<T>,{kind:'group'}>;rows:T[]}[]=grouping?[]:[{rows:pageRows}];
  if(grouping)for(const node of bodyNodes){if(node.kind==='group')bodySections.push({header:node,rows:[]});else{if(!bodySections.length)bodySections.push({rows:[]});bodySections[bodySections.length-1].rows.push(node.row);}}
  const toggleGroup=(key:string,button:HTMLButtonElement)=>{
    const editor=button.closest('tbody')?.querySelector<HTMLElement>('.bui-cell-editor');
    if(!collapsed.includes(key)&&editor){setGroupNotice('Save or cancel editing before collapsing this group.');editor.querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled)')?.focus();return;}
    setGroupNotice('');
    const next=collapsed.includes(key)?collapsed.filter(item=>item!==key):[...collapsed,key];
    const nextNodes=buildTableRows(visible,rowKey,grouping,next);
    const index=nextNodes.findIndex(node=>node.kind==='group'&&node.key===key);
    setCollapsed(next);
    if(!server&&index>=0)changeQuery({page:Math.floor(index/size)+1});
    requestAnimationFrame(()=>{if(document.activeElement===document.body||document.activeElement===button)tableRoot.current?.querySelector<HTMLButtonElement>('[data-table-group-key="'+CSS.escape(key)+'"]')?.focus({preventScroll:true});});
  };
  const pageSelected=pageRows.filter(row=>selectedSet.has(rowKey(row))).length;
  const toggle=(keys:string[])=>{const next=new Set(selected);const all=keys.every(key=>next.has(key));keys.forEach(key=>all ? next.delete(key) : next.add(key));setSelected([...next]);};
  const baseWidth=(column:Column<T>)=>Math.max(column.minWidth ?? 100,widths[column.key] ?? column.width ?? 180);
  const fixedLayout=resizableColumns || displayedColumns.some(column=>column.width!==undefined || column.pinned);
  const baseTotal=displayedColumns.reduce((sum,column)=>sum+baseWidth(column),leadingWidth);
  const extra=Math.max(0,viewportWidth-baseTotal);
  const flexible=displayedColumns.filter(column=>(column.flex ?? 0)>0 && widths[column.key]===undefined);
  const stretch=flexible.length?flexible:displayedColumns.filter(column=>widths[column.key]===undefined && column.resizable!==false).slice(0,1);
  const weight=stretch.reduce((sum,column)=>sum+(column.flex ?? 1),0);
  const width=(column:Column<T>)=>baseWidth(column)+(stretch.includes(column)?extra*(column.flex ?? 1)/weight:0);
  const tableWidth=stretch.length?Math.max(baseTotal,viewportWidth):baseTotal;
  const columnStyle=(column:Column<T>):CSSProperties=>{
    const index=displayedColumns.indexOf(column);
    const offset=column.pinned==='start' ? displayedColumns.slice(0,index).filter(item=>item.pinned==='start').reduce((sum,item)=>sum+width(item),leadingWidth) : displayedColumns.slice(index+1).filter(item=>item.pinned==='end').reduce((sum,item)=>sum+width(item),0);
    return {width:fixedLayout ? width(column):column.width,minWidth:column.minWidth ?? 100,textAlign:column.align ?? 'start',...(column.pinned ? {insetInlineStart:column.pinned==='start'?offset:undefined,insetInlineEnd:column.pinned==='end'?offset:undefined,zIndex:1}:{})};
  };
  const maximumWidth=Math.max(600,viewportWidth);
  const resize=(column:Column<T>,value:number)=>setWidths({...widths,[column.key]:Math.min(maximumWidth,Math.max(column.minWidth ?? 100,value))});
  const columnOption=(key:string)=>{const column=orderedColumns.find(item=>item.key===key)!;return <Checkbox key={key} label={column.header} checked={displayedColumns.some(item=>item.key===key)} disabled={!columnVisibility||column.hideable===false || (displayedColumns.length===1 && displayedColumns[0].key===key)} onChange={event=>setShown(event.target.checked ? [...shown,key] : shown.filter(item=>item!==key))}/>;};
  const tableContent=<div ref={setScrollElement} className="bui-table-scroll" tabIndex={0} role="region" aria-label={caption + ' table'}><table className="bui-table" style={fixedLayout?{tableLayout:'fixed',width:tableWidth,minWidth:tableWidth}:undefined}><caption className="bui-sr-only">{caption}</caption>{fixedLayout && <colgroup>{onRowMove&&<col style={{width:48}}/>}{selectable && <col style={{width:48}} />}{displayedColumns.map(column=><col key={column.key} style={{width:width(column)}} />)}</colgroup>}<thead><tr>
        {onRowMove&&<th scope="col" className="bui-table-reorder"><span className="bui-sr-only">Row order</span></th>}{selectable && <th scope="col" className="bui-table-check"><SelectionCheckbox label="Select current page" checked={pageRows.length>0 && pageSelected===pageRows.length} mixed={pageSelected>0 && pageSelected<pageRows.length} onChange={input=>{selectionOrigin.current=input;toggle(pageRows.map(rowKey));}} /></th>}
        {displayedColumns.map(column=><th scope="col" aria-label={column.header} key={column.key} data-pinned={column.pinned} data-align={column.align ?? 'start'} style={columnStyle(column)} aria-sort={column.sortValue ? sorts[0]?.key===column.key ? sorts[0].descending ? 'descending' : 'ascending' : sorts.some(item=>item.key===column.key)?'other':'none' : undefined}>{column.sortValue ? <button type="button" title={multiSort?'Shift-click to add a sort criterion':undefined} onClick={event=>{const next=cycleTableSort(sorts,column.key,multiSort&&event.shiftKey);changeQuery({sort:next[0]??null,...(multiSort||state.sorts?{sorts:next}:{}),page:1});}}>{column.header}<Icon icon={sorts.find(item=>item.key===column.key)?.descending?ArrowDown:sorts.some(item=>item.key===column.key)?ArrowUp:ArrowUpDown} size={14} />{multiSort&&sorts.length>1&&sorts.some(item=>item.key===column.key)&&<sup aria-label={'Sort priority '+(sorts.findIndex(item=>item.key===column.key)+1)}>{sorts.findIndex(item=>item.key===column.key)+1}</sup>}</button> : column.header}{resizableColumns && column.resizable!==false && <span className="bui-column-resize" role="separator" tabIndex={0} aria-label={'Resize '+column.header} aria-orientation="vertical" aria-valuemin={column.minWidth ?? 100} aria-valuemax={maximumWidth} aria-valuenow={width(column)} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();resize(column,width(column)+(event.key==='ArrowRight'?10:-10));}if(event.key==='Home'){event.preventDefault();resize(column,column.minWidth ?? 100);}}} onPointerDown={event=>{event.preventDefault();const start=event.clientX,initial=width(column);const target=event.currentTarget;target.setPointerCapture(event.pointerId);const move=(move:PointerEvent)=>resize(column,initial+move.clientX-start);const stop=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',stop);target.removeEventListener('pointercancel',stop);};target.addEventListener('pointermove',move);target.addEventListener('pointerup',stop);target.addEventListener('pointercancel',stop);}} />}</th>)}
      </tr></thead>{bodySections.map((section,index)=><tbody key={section.header?.id??'rows-'+index}>
        {section.header&&<tr className="bui-table-group-row"><th scope="rowgroup" colSpan={displayedColumns.length+(selectable?1:0)+(onRowMove?1:0)}><div className="bui-table-group-heading">
          {selectable&&<SelectionCheckbox label={'Select all '+section.header.rows.length+' records in '+section.header.label} checked={section.header.rows.length>0&&section.header.rows.every(row=>selectedSet.has(rowKey(row)))} mixed={section.header.rows.some(row=>selectedSet.has(rowKey(row)))&&!section.header.rows.every(row=>selectedSet.has(rowKey(row)))} onChange={input=>{selectionOrigin.current=input;toggle(section.header!.rows.map(rowKey));}}/>}
          <button type="button" data-table-group-key={section.header.key} aria-expanded={!collapsed.includes(section.header.key)} onClick={event=>toggleGroup(section.header!.key,event.currentTarget)}><Icon icon={ChevronDown} size={15}/><span>{section.header.label}</span><span className="bui-table-group-count">{section.header.rows.length} records</span></button>
        </div></th></tr>}
        {section.rows.map(row=>{const key=rowKey(row),cells=<>{selectable && <td className="bui-table-check"><SelectionCheckbox label={'Select ' + rowLabel(row)} checked={selectedSet.has(rowKey(row))} onChange={input=>{selectionOrigin.current=input;toggle([rowKey(row)]);}} /></td>}
        {displayedColumns.map(column=><td key={column.key} data-pinned={column.pinned} data-align={column.align ?? 'start'} style={columnStyle(column)}><div className="bui-table-cell">{column.cell(row)}</div></td>)}
</>;return onRowMove?<OrderedTableRow key={key} id={key} label={rowLabel(row)} disabled={!canMoveRows} selected={selectable&&selectedSet.has(key)} onChoose={(key,button)=>{moveFocus.current=button;setMovingRow(key);setMovePosition('end');setMoveError('');}}>{cells}</OrderedTableRow>:<tr key={key} data-row-key={key} data-selected={selectable&&selectedSet.has(key)||undefined}>{cells}</tr>;})}
      </tbody>)}</table></div>;
  return <div ref={tableRoot} className="bui-data-table" data-density={density} aria-busy={loading || savingOrder || undefined}>
    {(searchText || server || filters.length>0 || columnVisibility || reorderableColumns) && <div className="bui-table-toolbar">
      {(searchText || server) && <Input type="search" aria-label={'Search ' + caption.toLowerCase()} placeholder="Filter records…" value={query} onChange={event=>{changeQuery({search:event.target.value,page:1});}} />}
      {filters.map(filter=><div className="bui-table-filter" key={filter.key}><Select label={filter.label} labelVisibility="hidden" value={facets[filter.key] ?? ''} options={[{value:'',label:'All '+filter.label.toLowerCase()},...filter.options]} onValueChange={value=>changeQuery({filters:{...facets,[filter.key]:value ?? ''},page:1})} /></div>)}
      <span className="bui-hint" aria-live="polite">{total} results</span>
      {(columnVisibility||reorderableColumns) && <Popover title="Visible columns" open={columnMenuOpen} onOpenChange={setColumnMenuOpen} onOpenChangeComplete={open=>{if(!open&&pendingColumn.current){setMovingColumn(pendingColumn.current);pendingColumn.current=null;}}} trigger={<Button ref={columnsTrigger} variant="secondary" className="bui-table-columns" leadingIcon={SlidersHorizontal}>Columns</Button>}><div className="bui-column-options">{viewOptions && <div className="bui-table-view-options">{viewOptions}</div>}{reorderableColumns?<TableColumnOrder columns={orderedColumns} onMove={moveColumn} onChoose={key=>{pendingColumn.current=key;setColumnPosition('end');setColumnMenuOpen(false);}}>{columnOption}</TableColumnOrder>:orderedColumns.map(column=>columnOption(column.key))}</div></Popover>}
    </div>}
    {grouping&&<p className="bui-table-group-notice bui-hint" role="status">{groupNotice}</p>}
    {grouping&&server&&<p className="bui-hint bui-table-group-scope">Groups describe this page of records.</p>}
    {(onRowMove||reorderableColumns)&&<p className="bui-hint bui-table-order-status" role="status">{rowMoveReason||moveNotice|| (onRowMove?'Select a row handle to choose a position on this page.':'')}</p>}
    {moveError&&<p className="bui-error" role="alert">{moveError}</p>}
    <Reveal open={selectable&&selected.length>0} className="bui-reveal--table-selection">{selectable&&selected.length>0?<div className="bui-table-selection" onFocusCapture={event=>{actionFocus.current=event.target as HTMLElement;}} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))actionFocus.current=null;}}><span role="status">{selected.length} selected</span><div>{renderSelectedActions ? renderSelectedActions(selected) : renderBulkActions?.(selectedRows)}<Button size="sm" variant="ghost" onClick={()=>{restoreSelectionFocus();setSelected([]);}}>Clear selection</Button></div></div>:null}</Reveal>
    {error && <Alert title="Unable to load records" tone="danger" live>{error}{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}</Alert>}
    {error && !rows.length ? null : loading && !rows.length ? <div className="bui-table-loading"><span role="status" className="bui-hint">Loading {caption.toLowerCase()}…</span>{[0,1,2].map(index=><Skeleton key={index} height="3rem" />)}</div> : <>
      {onRowMove?<TableOrderContext keys={pageRows.map(rowKey)} disabled={!canMoveRows} onMove={(rowKey,targetKey,after)=>void moveRow({rowKey,targetKey,position:after?'after':'before'})}>{tableContent}</TableOrderContext>:tableContent}
      {visible.length===0 && (emptyState ?? <EmptyState title={!query && !Object.values(facets).some(Boolean) ? 'No records yet' : 'No matching records'} action={query || Object.values(facets).some(Boolean) ? <Button variant="secondary" size="sm" onClick={()=>{changeQuery({search:'',filters:{},page:1});}}>Clear filter</Button> : undefined}>{!query && !Object.values(facets).some(Boolean) ? 'Records will appear here when they are added.' : 'Try another search or filter.'}</EmptyState>)}
      {fixedLayout && viewportWidth>0 && viewportWidth<baseTotal && <p className="bui-table-scroll-hint bui-hint">Scroll horizontally to see every column.</p>}
      <div className="bui-table-footer"><span className="bui-table-feedback bui-hint" role="status">{loading?<><Spinner /> Updating records…</>:total?`${groupedPage?groupedPage.start+1:(activePage-1)*size+1}–${groupedPage?groupedPage.end:Math.min(activePage*size,total)} of ${groupedPage?groupedPage.total:total}${groupedPage?' entries':''}`:'0 records'}</span><Pagination page={activePage} totalPages={pages} onPageChange={page=>changeQuery({page})} /></div>
    </>}
    <Dialog title="Move column" description={orderedColumns.find(column=>column.key===movingColumn)?.header??'Choose a column position.'} open={!!movingColumn} onOpenChange={open=>{if(!open)setMovingColumn(null);}} finalFocus={columnsTrigger}><form className="bui-table-move-form" onSubmit={event=>{event.preventDefault();const others=orderedColumns.filter(column=>column.key!==movingColumn),target=columnPosition==='end'?others.at(-1)?.key:columnPosition.slice(7);if(movingColumn&&target)moveColumn(movingColumn,target,columnPosition==='end');setMovingColumn(null);}}><Select label="Column position" value={columnPosition} options={[...orderedColumns.filter(column=>column.key!==movingColumn).map(column=>({value:'before:'+column.key,label:'Before '+column.header})),{value:'end',label:'At end'}]} onValueChange={value=>setColumnPosition(value??'end')}/><Button type="submit">Move column</Button></form></Dialog>
    {onRowMove&&<Dialog title="Move row" description={movingRow?'Choose a position for '+(rows.find(row=>rowKey(row)===movingRow)?rowLabel(rows.find(row=>rowKey(row)===movingRow)!):movingRow):'Choose a position on this page.'} open={!!movingRow} onOpenChange={open=>{if(!open&&!savingOrder)setMovingRow(null);}} finalFocus={moveFocus}><form ref={moveForm} className="bui-table-move-form" onSubmit={event=>{event.preventDefault();const others=pageRows.filter(row=>rowKey(row)!==movingRow),targetKey=movePosition==='end'?others.at(-1)&&rowKey(others.at(-1)!):movePosition.slice(7);if(movingRow&&targetKey)void moveRow({rowKey:movingRow,targetKey,position:movePosition==='end'?'after':'before'});}}><Select label="Row position" value={movePosition} options={[...pageRows.filter(row=>rowKey(row)!==movingRow).map(row=>({value:'before:'+rowKey(row),label:'Before '+rowLabel(row)})),{value:'end',label:'At end of page'}]} onValueChange={value=>setMovePosition(value??'end')} disabled={!canMoveRows}/>{moveError&&<p className="bui-error" role="alert">{moveError}</p>}<Button type="submit" loading={savingOrder} disabled={!canMoveRows||pageRows.length<2}>Save row position</Button></form></Dialog>}
  </div>;
}
