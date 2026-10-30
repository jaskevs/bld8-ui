'use client';

import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type KeyboardEvent,type ReactNode} from 'react';
import {ArrowDown,ArrowUp,ArrowUpDown,ArrowUpRight,ChevronRight} from 'lucide-react';
import {Icon} from './icons.js';
import {useControllableValue} from './state.js';
import {buildTableRows,getTableWindow,type TableGrouping,type TableRowNode} from './table-grouping.js';
import type {Column,TableQuery} from './data-table.js';

export type {TableGrouping} from './table-grouping.js';

export interface WindowedTableProps<T> {
  caption:string;
  /** Complete, already filtered records. Up to 20,000 records; no service fetching. */
  rows:readonly T[];
  /** Single-line display cells only. Keep forms and editable drafts outside this table. */
  columns:readonly Column<T>[];
  rowKey:(row:T)=>string;
  rowLabel?:(row:T)=>string;
  /** Viewport height in CSS pixels, clamped to 240–800. */
  height?:number;
  /** Uniform record and group height, clamped to 44–96 CSS pixels. */
  rowHeight?:number;
  overscan?:number;
  grouping?:TableGrouping<T>;
  collapsedGroupKeys?:readonly string[];
  defaultCollapsedGroupKeys?:readonly string[];
  onCollapsedGroupKeysChange?:(keys:string[])=>void;
  selectedKeys?:readonly string[];
  defaultSelectedKeys?:readonly string[];
  onSelectedKeysChange?:(keys:string[])=>void;
  selectable?:boolean;
  /** Open a detail view or editor owned outside the windowed rows. */
  onRowAction?:(row:T)=>void;
  /** The host applies sorting to rows; this component reports header intent. */
  sort?:TableQuery['sort'];
  onSortChange?:(sort:TableQuery['sort'])=>void;
}

const bounded=(value:number|undefined,fallback:number,min:number,max:number)=>Number.isFinite(value)?Math.min(max,Math.max(min,Math.round(value!))):fallback;
const HEADER_HEIGHT=44;
const EMPTY_KEYS:readonly string[]=[];

function WindowSelection({label,checked,mixed,disabled,onChange}:{label:string;checked:boolean;mixed?:boolean;disabled?:boolean;onChange:()=>void}) {
  const input=useRef<HTMLInputElement>(null);
  useLayoutEffect(()=>{if(input.current)input.current.indeterminate=!!mixed;},[mixed]);
  return <label className="bui-windowed-select"><input ref={input} type="checkbox" className="bui-checkbox" aria-label={label} aria-checked={mixed?'mixed':checked} checked={checked} disabled={disabled} onChange={onChange}/></label>;
}

/** A bounded native-table view. Its paged counterpart remains useful for sequential reading. */
export function WindowedTable<T>({caption,rows,columns,rowKey,rowLabel=rowKey,height=480,rowHeight=56,overscan=5,grouping,
  collapsedGroupKeys,defaultCollapsedGroupKeys=EMPTY_KEYS,onCollapsedGroupKeysChange,selectedKeys,defaultSelectedKeys=EMPTY_KEYS,
  onSelectedKeysChange,selectable=false,onRowAction,sort=null,onSortChange}:WindowedTableProps<T>) {
  const id=useId(),viewport=useRef<HTMLDivElement>(null),body=useRef<HTMLTableSectionElement>(null);
  const elements=useRef(new Map<string,HTMLTableRowElement>()),ownsFocus=useRef(false),pendingFocus=useRef<string|null>(null);
  const frame=useRef<number|null>(null);
  const [collapsed,setCollapsed]=useControllableValue<readonly string[]>(collapsedGroupKeys,defaultCollapsedGroupKeys,keys=>onCollapsedGroupKeysChange?.([...keys]));
  const [selected,setSelected]=useControllableValue<readonly string[]>(selectedKeys,defaultSelectedKeys,keys=>onSelectedKeysChange?.([...keys]));
  const [focused,setFocused]=useState<string|null>(null),[scrollTop,setScrollTop]=useState(0),[viewportWidth,setViewportWidth]=useState(0),[viewportHeight,setViewportHeight]=useState(height);
  const size=bounded(rowHeight,56,44,96),paneHeight=bounded(height,480,240,800),extra=bounded(overscan,5,0,12);
  const nodes=useMemo(()=>buildTableRows(rows,rowKey,grouping,collapsed),[rows,rowKey,grouping,collapsed]);
  const records=useMemo(()=>rows.map(row=>({key:rowKey(row),row})),[rows,rowKey]);
  const selectedSet=useMemo(()=>new Set(selected),[selected]),collapsedSet=useMemo(()=>new Set(collapsed),[collapsed]);
  const selectedCount=useMemo(()=>records.reduce((count,item)=>count+Number(selectedSet.has(item.key)),0),[records,selectedSet]);
  const groupKeys=useMemo(()=>new Map(nodes.flatMap(node=>node.kind==='group'?[[node.id,node.rows.map(rowKey)] as const]:[])),[nodes,rowKey]);
  const groupSelected=useMemo(()=>new Map([...groupKeys].map(([key,keys])=>[key,keys.reduce((total,item)=>total+Number(selectedSet.has(item)),0)])),[groupKeys,selectedSet]);
  const nodePositions=useMemo(()=>new Map(nodes.map((node,index)=>[node.id,index])),[nodes]);
  const previous=useRef<readonly TableRowNode<T>[]>(nodes);
  const activeId=useMemo(()=>{
    if(!focused)return nodes[Math.min(Math.floor(Math.max(0,scrollTop)/size),Math.max(0,nodes.length-1))]?.id??null;
    if(nodePositions.has(focused))return focused;
    const oldNode=previous.current.find(node=>node.id===focused),oldPosition=focused?previous.current.findIndex(node=>node.id===focused):-1;
    let next=focused&&nodes.some(node=>node.id===focused)?focused:null;
    if(!next&&oldNode?.kind==='row'&&oldNode.groupKey!==undefined)next=nodes.find(node=>node.kind==='group'&&node.key===oldNode.groupKey)?.id??null;
    return next??nodes[Math.min(Math.max(oldPosition,0),Math.max(0,nodes.length-1))]?.id??null;
  },[nodes,focused,scrollTop,size,nodePositions]);
  const activeIndex=activeId?nodePositions.get(activeId)??-1:-1;
  const availableHeight=Math.max(1,viewportHeight-HEADER_HEIGHT);
  const tableWindow=getTableWindow(nodes.length,scrollTop,availableHeight,size,extra,activeIndex>=0?activeIndex:undefined);
  const columnCount=columns.length+(selectable?1:0)+(onRowAction?1:0);
  const columnLayout=useMemo(()=>{
    if(!columns.length||new Set(columns.map(column=>column.key)).size!==columns.length||columns.some(column=>typeof column.key!=='string'||!column.key.trim()))throw new Error('WindowedTable columns need nonempty, unique keys.');
    const base=(column:Column<T>)=>Math.max(bounded(column.minWidth,100,44,2000),bounded(column.width,180,44,2000));
    const baseTotal=columns.reduce((total,column)=>total+base(column),(selectable?48:0)+(onRowAction?52:0));
    const flex=(column:Column<T>)=>Number.isFinite(column.flex)&&column.flex!>0?Math.min(column.flex!,1000):0;
    const flexible=columns.filter(column=>flex(column)>0);
    const stretching=flexible.length?flexible:columns.slice(0,1);
    const weight=stretching.reduce((total,column)=>total+(flex(column)||1),0);
    const surplus=Math.max(0,viewportWidth-baseTotal);
    const widths=columns.map(column=>base(column)+(stretching.includes(column)?surplus*(flex(column)||1)/weight:0));
    return {widths,total:Math.max(baseTotal,viewportWidth),baseTotal};
  },[columns,selectable,onRowAction,viewportWidth]);

  useLayoutEffect(()=>{
    const element=viewport.current;if(!element)return;
    const measure=()=>{setViewportWidth(element.clientWidth);setViewportHeight(element.clientHeight);};
    measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const outside=(event:FocusEvent)=>{if(!body.current?.contains(event.target as Node)){ownsFocus.current=false;pendingFocus.current=null;}};
    const blur=()=>{ownsFocus.current=false;pendingFocus.current=null;};
    document.addEventListener('focusin',outside);window.addEventListener('blur',blur);
    return()=>{document.removeEventListener('focusin',outside);window.removeEventListener('blur',blur);if(frame.current!==null)cancelAnimationFrame(frame.current);};
  },[]);
  useLayoutEffect(()=>{
    const element=viewport.current;
    if(element){const limit=Math.max(0,nodes.length*size-availableHeight);if(element.scrollTop>limit){element.scrollTop=limit;setScrollTop(limit);}}
    if(activeId!==focused&&(focused!==null||ownsFocus.current)){setFocused(activeId);if(ownsFocus.current)pendingFocus.current=activeId;}
    const target=pendingFocus.current;
    if(target){
      const position=nodePositions.get(target);
      // Reveal only a requested focus repair or keyboard move. Manual scrolling keeps its offset.
      if(element&&position!==undefined){
        const top=position*size,bottom=top+size,offset=element.scrollTop;
        const requested=top<offset?top:bottom>offset+availableHeight?bottom-availableHeight:offset;
        const next=Math.max(0,Math.min(requested,Math.max(0,nodes.length*size-availableHeight)));
        if(next!==offset){element.scrollTop=next;setScrollTop(element.scrollTop);}
      }
      const row=elements.current.get(target);if(row){row.focus({preventScroll:true});pendingFocus.current=null;}
    }
    else if(!activeId&&ownsFocus.current)element?.focus({preventScroll:true});
    previous.current=nodes;
  },[nodes,size,availableHeight,activeId,focused]);

  function move(index:number){
    const position=Math.min(Math.max(index,0),nodes.length-1),next=nodes[position],element=viewport.current;if(!next||!element)return;
    const top=position*size,bottom=top+size;
    let offset=element.scrollTop;if(top<offset)offset=top;else if(bottom>offset+availableHeight)offset=bottom-availableHeight;
    offset=Math.max(0,Math.min(offset,Math.max(0,nodes.length*size-availableHeight)));
    element.scrollTop=offset;setScrollTop(offset);pendingFocus.current=next.id;setFocused(next.id);
    const mounted=elements.current.get(next.id);if(mounted){mounted.focus({preventScroll:true});pendingFocus.current=null;}
  }
  function toggleSelection(keys:readonly string[]){
    const next=new Set(selected),remove=keys.length>0&&keys.every(key=>next.has(key));
    keys.forEach(key=>remove?next.delete(key):next.add(key));setSelected([...next]);
  }
  function toggleGroup(node:Extract<TableRowNode<T>,{kind:'group'}>){
    const closing=!collapsedSet.has(node.key);
    if(closing){const child=nodes.find(item=>item.id===focused);if(child?.kind==='row'&&child.groupKey===node.key){pendingFocus.current=ownsFocus.current?node.id:null;setFocused(node.id);}}
    setCollapsed(closing?[...collapsed,node.key]:collapsed.filter(key=>key!==node.key));
  }
  function keydown(event:KeyboardEvent<HTMLTableRowElement>,node:TableRowNode<T>,index:number){
    if(event.defaultPrevented||event.altKey||event.metaKey||event.ctrlKey)return;
    const target=event.target as HTMLElement;
    if(target.closest('textarea,select,[contenteditable="true"],input:not([type="checkbox"])'))return;
    const direction=event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:event.key==='PageDown'?Math.max(1,Math.floor(availableHeight/size)):event.key==='PageUp'?-Math.max(1,Math.floor(availableHeight/size)):0;
    if(direction||event.key==='Home'||event.key==='End'){
      event.preventDefault();event.stopPropagation();move(event.key==='Home'?0:event.key==='End'?nodes.length-1:index+direction);return;
    }
    if(node.kind==='group'&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){
      event.preventDefault();event.stopPropagation();if((event.key==='ArrowLeft'&&!collapsedSet.has(node.key))||(event.key==='ArrowRight'&&collapsedSet.has(node.key)))toggleGroup(node);return;
    }
    if(event.target!==event.currentTarget)return;
    if(event.key==='Enter'&&(node.kind==='group'||onRowAction)){event.preventDefault();event.stopPropagation();if(node.kind==='group')toggleGroup(node);else onRowAction?.(node.row);}
    if(event.key===' '&&selectable){event.preventDefault();event.stopPropagation();toggleSelection(node.kind==='group'?node.rows.map(rowKey):[node.key]);}
  }
  function cellStyle(index:number):CSSProperties{
    const column=columns[index];
    const offset=column.pinned==='start'?columns.slice(0,index).reduce((total,item,i)=>total+(item.pinned==='start'?columnLayout.widths[i]:0),selectable?48:0):columns.slice(index+1).reduce((total,item,i)=>total+(item.pinned==='end'?columnLayout.widths[index+1+i]:0),onRowAction?52:0);
    return {width:columnLayout.widths[index],textAlign:column.align??'start',...(column.pinned==='start'?{insetInlineStart:offset}:column.pinned==='end'?{insetInlineEnd:offset}:{})};
  }
  function renderNode(node:TableRowNode<T>,index:number){
    const common={'data-windowed-id':node.id,'aria-rowindex':index+2,tabIndex:activeId===node.id?0:-1,
      ref:(element:HTMLTableRowElement|null)=>{if(element)elements.current.set(node.id,element);else elements.current.delete(node.id);},
      onFocusCapture:()=>{ownsFocus.current=true;setFocused(node.id);},onKeyDown:(event:KeyboardEvent<HTMLTableRowElement>)=>keydown(event,node,index)};
    if(node.kind==='group'){
      const keys=groupKeys.get(node.id)??[],count=groupSelected.get(node.id)??0,expanded=!collapsedSet.has(node.key);
      return <tr key={node.id} {...common} className="bui-windowed-group" data-expanded={expanded}>
        {selectable&&<td className="bui-windowed-check bui-windowed-pinned-start"><WindowSelection label={'Select all '+node.label+' records'} checked={keys.length>0&&count===keys.length} mixed={count>0&&count<keys.length} onChange={()=>toggleSelection(keys)}/></td>}
        <th scope="row" colSpan={columns.length+(onRowAction?1:0)}><div className="bui-windowed-group-body"><button type="button" className="bui-windowed-disclosure" aria-expanded={expanded} aria-label={(expanded?'Collapse ':'Expand ')+node.label+' group ('+node.rows.length+' records)'} onClick={()=>toggleGroup(node)}><Icon icon={ChevronRight} size={16}/><span>{node.label}</span><span className="bui-windowed-group-count">{node.rows.length}</span></button></div></th>
      </tr>;
    }
    const group=grouping&&node.groupKey!==undefined?grouping.label(node.groupKey):undefined;
    return <tr key={node.id} {...common} className="bui-windowed-row" data-selected={selectable&&selectedSet.has(node.key)||undefined} aria-label={rowLabel(node.row)+(group?', '+group+' group':'')}>
      {selectable&&<td className="bui-windowed-check bui-windowed-pinned-start"><WindowSelection label={'Select '+rowLabel(node.row)} checked={selectedSet.has(node.key)} onChange={()=>toggleSelection([node.key])}/></td>}
      {columns.map((column,columnIndex)=>{const content=column.cell(node.row);return <td key={column.key} data-pinned={column.pinned} style={cellStyle(columnIndex)}><div className="bui-windowed-cell" data-align={column.align??'start'} title={typeof content==='string'||typeof content==='number'?String(content):undefined}>{content}</div></td>;})}
      {onRowAction&&<td className="bui-windowed-action-cell bui-windowed-pinned-end"><button type="button" className="bui-windowed-action" aria-label={'Open '+rowLabel(node.row)} title={'Open '+rowLabel(node.row)} onClick={()=>onRowAction(node.row)}><Icon icon={ArrowUpRight} size={17}/></button></td>}
    </tr>;
  }
  const rendered:ReactNode[]=[];let last=0;
  const spacer=(start:number,end:number)=><tr key={'space-'+start+'-'+end} className="bui-windowed-spacer" role="presentation" aria-hidden="true"><td colSpan={columnCount} role="presentation" style={{height:(end-start)*size}}/></tr>;
  for(const index of tableWindow.indices){if(index>last)rendered.push(spacer(last,index));rendered.push(renderNode(nodes[index],index));last=index+1;}
  if(last<nodes.length)rendered.push(spacer(last,nodes.length));
  const style={'--bui-windowed-row-height':size+'px','--bui-windowed-viewport-width':viewportWidth+'px'} as CSSProperties;
  return <div className="bui-windowed-table" style={style}>
    <p id={id+'-help'} className="bui-windowed-help bui-hint">Arrow keys move between rows. Home and End jump to the first and last row.{selectable?' Space selects records.':''}{onRowAction?' Enter opens a record.':''}</p>
    <div ref={viewport} className="bui-windowed-scroll" style={{height:paneHeight}} role="region" aria-label={caption+' scrolling table'} aria-describedby={id+'-help'} tabIndex={0} onScroll={()=>{if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;if(viewport.current)setScrollTop(viewport.current.scrollTop);});}}>
      <table className="bui-table" aria-rowcount={nodes.length+1} style={{width:columnLayout.total,minWidth:columnLayout.total}}><caption className="bui-sr-only">{caption}</caption><colgroup>{selectable&&<col style={{width:48}}/>}{columns.map((column,index)=><col key={column.key} style={{width:columnLayout.widths[index]}}/>)}{onRowAction&&<col style={{width:52}}/>}</colgroup>
        <thead><tr aria-rowindex={1}>{selectable&&<th scope="col" className="bui-windowed-check bui-windowed-pinned-start"><WindowSelection label="Select all supplied records" checked={records.length>0&&selectedCount===records.length} mixed={selectedCount>0&&selectedCount<records.length} disabled={!records.length} onChange={()=>toggleSelection(records.map(item=>item.key))}/></th>}
          {columns.map((column,index)=><th scope="col" key={column.key} data-pinned={column.pinned} style={cellStyle(index)} aria-sort={column.sortValue&&onSortChange?sort?.key===column.key?sort.descending?'descending':'ascending':'none':undefined}>{column.sortValue&&onSortChange?<button type="button" onClick={()=>onSortChange(sort?.key===column.key&&sort.descending?null:{key:column.key,descending:sort?.key===column.key&&!sort.descending})}>{column.header}<Icon icon={sort?.key===column.key?sort.descending?ArrowDown:ArrowUp:ArrowUpDown} size={14}/></button>:column.header}</th>)}
          {onRowAction&&<th scope="col" className="bui-windowed-action-cell bui-windowed-pinned-end"><span className="bui-sr-only">Actions</span></th>}
        </tr></thead><tbody ref={body}>{rendered}</tbody>
      </table>
      {!nodes.length&&<div className="bui-windowed-empty"><strong>No records in this view.</strong><p>Try another search or filter.</p></div>}
    </div>
    <div className="bui-windowed-feedback"><p className="bui-hint">{rows.length.toLocaleString('en-US')} {rows.length===1?'record':'records'}</p>{selectable&&<p className="bui-hint" role="status">{selected.length} selected{selected.length!==selectedCount?' · '+selectedCount+' in this view':''}</p>}</div>
    {viewportWidth>0&&viewportWidth<columnLayout.baseTotal&&<p className="bui-hint">Scroll horizontally to see every column.</p>}
  </div>;
}
