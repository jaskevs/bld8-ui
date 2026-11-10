'use client';
import {useEffect,useId,useRef,useState,type ClipboardEvent,type KeyboardEvent,type PointerEvent,type CSSProperties} from 'react';
import {ArrowDown,ArrowUp,ArrowUpDown,Copy,ExternalLink,Redo2,Undo2} from 'lucide-react';
import {Button,Icon} from './core.js';
import {GridChoiceEditor,type GridChoiceResult} from './data-grid-choice.js';
import {gridPasteEdits,gridRangeBounds,gridRangeContains,serializeGridClipboard,type GridPoint,type GridRange} from './data-grid-state.js';
import {DATA_WORKSPACE_LIMITS,type DataCellError,type DataColumn,type DataEdit,type DataRecord,type DataSort} from './data-workspace-state.js';

export interface DataGridProps<T extends DataRecord> {
  label:string;
  rows:readonly T[];
  columns:readonly DataColumn<T>[];
  onEdit?:(edits:DataEdit<T>[])=>void;
  cellErrors?:readonly DataCellError[];
  dirtyCells?:readonly {id:string;key:string}[];
  disabled?:boolean;
  onOpenRow?:(row:T)=>void;
  sorts?:readonly DataSort[];
  onSortsChange?:(sorts:DataSort[])=>void;
  onUndo?:()=>void;
  onRedo?:()=>void;
  canUndo?:boolean;
  canRedo?:boolean;
  onClipboardError?:(message:string)=>void;
}
interface CellIdentity {id:string;key:string}
interface Editing extends CellIdentity {value:string;session:number}
const emptyPoint={row:0,column:0};
const cellKey=(id:string,key:string)=>JSON.stringify([id,key]);

/** Optional spreadsheet interaction over the loaded page. Drafts and writes belong to the host. */
export function DataGrid<T extends DataRecord>({label,rows,columns,onEdit,cellErrors=[],dirtyCells=[],disabled=false,onOpenRow,sorts=[],onSortsChange,onUndo,onRedo,canUndo,canRedo,onClipboardError}:DataGridProps<T>) {
  const uid=useId();const table=useRef<HTMLTableElement>(null);const cells=useRef(new Map<string,HTMLTableCellElement>());
  const focusIntent=useRef<CellIdentity|null>(null);const mounted=useRef(true);
  const pointerRange=useRef<{id:number;capture:HTMLTableCellElement;last:CellIdentity}|null>(null),ignoreClick=useRef(false);
  const [focus,setFocus]=useState<CellIdentity|null>(null),[anchor,setAnchor]=useState<CellIdentity|null>(null);
  const [editing,setEditing]=useState<Editing|null>(null),[notice,setNotice]=useState('');
  const [closingChoice,setClosingChoice]=useState<Editing|null>(null);
  const editorSequence=useRef(0);
  const editor=useRef<HTMLInputElement|null>(null);const editingRef=useRef<Editing|null>(null);editingRef.current=editing;
  const errors=new Map(cellErrors.map(error=>[cellKey(error.id,error.key),error.message]));
  const dirty=new Set(dirtyCells.map(cell=>cellKey(cell.id,cell.key)));
  const at=(point:GridPoint):CellIdentity|null=>rows[point.row]&&columns[point.column]?{id:rows[point.row].id,key:columns[point.column].key}:null;
  const locate=(identity:CellIdentity|null):GridPoint=>{const row=rows.findIndex(row=>row.id===identity?.id),column=columns.findIndex(column=>column.key===identity?.key);return row>=0&&column>=0?{row,column}:emptyPoint;};
  const active=locate(focus),start=locate(anchor),range:GridRange={anchor:start,focus:active};
  const activeIdentity=at(active);const selectedBounds=gridRangeBounds(range);
  const hasSelection=!!focus&&rows.some(row=>row.id===focus.id)&&columns.some(column=>column.key===focus.key);
  const selectedCount=hasSelection?(selectedBounds.bottom-selectedBounds.top+1)*(selectedBounds.right-selectedBounds.left+1):0;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;finishPointerRange();};},[]);
  useEffect(()=>{if(!editing)return;editor.current?.focus();if(editor.current instanceof HTMLInputElement)editor.current.select();},[editing?.session]);
  // Reconcile record identity after a new service page without stealing focus from its controls.
  useEffect(()=>{if(focus&&!rows.some(row=>row.id===focus.id)||focus&&!columns.some(column=>column.key===focus.key)){setFocus(null);setAnchor(null);}if(editing&&!rows.some(row=>row.id===editing.id))setEditing(null);},[rows,columns,focus,editing]);
  useEffect(()=>{if(closingChoice&&(!rows.some(row=>row.id===closingChoice.id)||!columns.some(column=>column.key===closingChoice.key&&column.type==='select')))setClosingChoice(null);},[rows,columns,closingChoice]);
  // Loaded cells already exist. Move focus in this key event, even when animation
  // frames are paused; otherwise a following key can act on the previous cell.
  function scheduleFocus(identity:CellIdentity|null){if(!identity||!mounted.current)return;focusIntent.current=identity;try{cells.current.get(cellKey(identity.id,identity.key))?.focus({preventScroll:true});}finally{focusIntent.current=null;}}
  function activate(point:GridPoint,extend=false,moveFocus=true,scroll=true){const identity=at(point);if(!identity)return;setFocus(identity);if(!extend)setAnchor(identity);if(moveFocus){scheduleFocus(identity);if(scroll)cells.current.get(cellKey(identity.id,identity.key))?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}}
  function clearNativeSelection(){const selection=window.getSelection();if(selection&&(table.current?.contains(selection.anchorNode)||table.current?.contains(selection.focusNode)))selection.removeAllRanges();}
  function finishPointerRange(){const pointer=pointerRange.current;pointerRange.current=null;if(pointer?.capture.hasPointerCapture(pointer.id))pointer.capture.releasePointerCapture(pointer.id);}
  function startPointerRange(event:PointerEvent<HTMLTableCellElement>,point:GridPoint){
    if(event.button!==0||!event.isPrimary||event.pointerType==='touch'||editingRef.current)return;
    event.preventDefault();finishPointerRange();ignoreClick.current=false;clearNativeSelection();activate(point,event.shiftKey,true,false);
    const identity=at(point);if(!identity)return;
    pointerRange.current={id:event.pointerId,capture:event.currentTarget,last:identity};event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePointerRange(event:PointerEvent<HTMLDivElement>){
    const pointer=pointerRange.current;if(!pointer||pointer.id!==event.pointerId)return;
    if(!(event.buttons&1)){finishPointerRange();return;}
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLTableCellElement>('td[data-row-id][data-column-key]');
    if(!cell||!table.current?.contains(cell))return;
    const identity={id:cell.dataset.rowId!,key:cell.dataset.columnKey!};
    if(identity.id===pointer.last.id&&identity.key===pointer.last.key)return;
    pointer.last=identity;ignoreClick.current=true;activate(locate(identity),true,true,false);
  }
  function failClipboard(message:string){setNotice(message);onClipboardError?.(message);}
  function begin(point=active,initial?:string){const row=rows[point.row],column=columns[point.column];if(disabled||!onEdit||!row||!column||column.editable!==true||column.key==='id'||column.key==='revision')return;const next={id:row.id,key:column.key,value:column.type==='select'?String(row[column.key]??''):initial??String(row[column.key]??''),session:++editorSequence.current};setClosingChoice(null);setFocus(next);setAnchor(next);setEditing(next);setNotice('');}
  function commit(returnFocus=false,move?:GridPoint){const current=editingRef.current;if(!current)return;editingRef.current=null;setEditing(null);const row=rows.find(row=>row.id===current.id);if(row&&String(row[current.key as keyof T]??'')!==current.value)onEdit?.([{id:current.id,key:current.key as Extract<keyof T,string>,value:current.value}]);if(move)activate(move);else if(returnFocus)scheduleFocus(current);}
  function cancel(returnFocus=true){const current=editingRef.current;editingRef.current=null;setEditing(null);if(returnFocus)scheduleFocus(current);}
  function settleChoiceFocus(identity:CellIdentity|null){
    // The primitive may finish list navigation after our commit in this event.
    // Settle in the same event turn, without a frame delay or taking outside focus.
    queueMicrotask(()=>{if(!editingRef.current&&document.activeElement?.closest('[data-grid-choice-owner]')?.getAttribute('data-grid-choice-owner')===uid)scheduleFocus(identity);});
  }
  function finishChoice(result:GridChoiceResult,point:GridPoint){
    const current=editingRef.current;if(!current)return;
    const closing={...current,value:result.value};setClosingChoice(closing);
    if(result.intent==='dismiss'){cancel(result.restoreFocus);if(result.restoreFocus)settleChoiceFocus(current);return;}
    editingRef.current=closing;
    if(result.intent==='tab'){
      const index=point.row*columns.length+point.column+(result.reverse?-1:1);
      if(index>=0&&index<rows.length*columns.length){const next={row:Math.floor(index/columns.length),column:index%columns.length};commit(false,next);settleChoiceFocus(at(next));}
      else {commit(true);return false;}
    }else {commit(result.restoreFocus);if(result.restoreFocus)settleChoiceFocus(current);}
  }
  function selectionText(){const bounds=gridRangeBounds(range);return serializeGridClipboard(rows.slice(bounds.top,bounds.bottom+1).map(row=>columns.slice(bounds.left,bounds.right+1).map(column=>row[column.key])));}
  function copy(event:ClipboardEvent<HTMLDivElement>){if(editingRef.current||!table.current?.contains(event.target as Node)||!selectedCount)return;try{event.preventDefault();event.clipboardData.setData('text/plain',selectionText());setNotice(selectedCount+' cells copied.');}catch(error){event.preventDefault();failClipboard(error instanceof Error?error.message:'The cells could not be copied.');}}
  async function copyButton(){try{if(!navigator.clipboard?.writeText)throw new Error('Select the cells and use your keyboard Copy command.');await navigator.clipboard.writeText(selectionText());if(mounted.current)setNotice(selectedCount+' cells copied.');}catch(error){if(mounted.current)failClipboard(error instanceof Error?error.message:'Use your keyboard Copy command to copy these cells.');}}
  function paste(event:ClipboardEvent<HTMLDivElement>){if(editingRef.current||!table.current?.contains(event.target as Node)||!onEdit||disabled)return;event.preventDefault();try{const edits=gridPasteEdits(rows,columns,active,event.clipboardData.getData('text/plain'));onEdit(edits);const bottom=rows.findIndex(row=>row.id===edits[edits.length-1].id),right=columns.findIndex(column=>column.key===edits[edits.length-1].key),last=at({row:bottom,column:right});setAnchor(activeIdentity);setFocus(last);scheduleFocus(last);setNotice(edits.length+' cells added to the draft. Review the values before saving.');}catch(error){failClipboard(error instanceof Error?error.message:'The cells could not be pasted.');}}
  function clear(){if(disabled||!onEdit||!rows.length)return;const bounds=gridRangeBounds(range),targets=columns.slice(bounds.left,bounds.right+1);if(targets.some(column=>column.editable!==true||column.key==='id'||column.key==='revision')){setNotice('Choose editable cells to clear.');return;}onEdit(rows.slice(bounds.top,bounds.bottom+1).flatMap(row=>targets.map(column=>({id:row.id,key:column.key,value:''}))));setNotice(selectedCount+' cells cleared in the draft.');}
  function keyDown(event:KeyboardEvent<HTMLTableCellElement>,point:GridPoint){
    if(event.defaultPrevented||editingRef.current||event.target!==event.currentTarget)return;
    const command=event.ctrlKey||event.metaKey;
    if(command&&event.key.toLowerCase()==='z'){if(event.shiftKey?canRedo&&onRedo:canUndo&&onUndo){event.preventDefault();if(event.shiftKey)onRedo?.();else onUndo?.();}return;}
    if(command&&event.key.toLowerCase()==='y'){if(canRedo&&onRedo){event.preventDefault();onRedo();}return;}
    let next:GridPoint|null=null;
    if(event.key==='ArrowDown')next={...point,row:Math.min(rows.length-1,point.row+1)};
    if(event.key==='ArrowUp')next={...point,row:Math.max(0,point.row-1)};
    if(event.key==='ArrowRight')next={...point,column:Math.min(columns.length-1,point.column+1)};
    if(event.key==='ArrowLeft')next={...point,column:Math.max(0,point.column-1)};
    if(event.key==='Home')next={row:command?0:point.row,column:0};
    if(event.key==='End')next={row:command?rows.length-1:point.row,column:columns.length-1};
    if(event.key==='PageDown')next={...point,row:Math.min(rows.length-1,point.row+10)};
    if(event.key==='PageUp')next={...point,row:Math.max(0,point.row-10)};
    if(next){event.preventDefault();activate(next,event.shiftKey);return;}
    if(event.key==='Escape'){event.preventDefault();setAnchor(at(point));setNotice('Range selection cleared.');return;}
    if(event.key==='Enter'||event.key==='F2'){event.preventDefault();begin(point);return;}
    if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();clear();return;}
    if(command&&event.key.toLowerCase()==='a'){event.preventDefault();const last=at({row:rows.length-1,column:columns.length-1});setAnchor(at(emptyPoint));setFocus(last);scheduleFocus(last);setNotice('All loaded cells selected.');return;}
    if(event.key.length===1&&!command&&!event.altKey){event.preventDefault();begin(point,event.key);}
  }
  function editorKeyDown(event:KeyboardEvent<HTMLInputElement>,point:GridPoint){
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();return;}
    if(event.key==='Enter'){event.preventDefault();event.stopPropagation();commit(true);return;}
    if(event.key==='Tab'){const direction=event.shiftKey?-1:1,index=point.row*columns.length+point.column+direction;if(index>=0&&index<rows.length*columns.length){event.preventDefault();commit(false,{row:Math.floor(index/columns.length),column:index%columns.length});}else commit();return;}
    event.stopPropagation();
  }
  function sort(column:DataColumn<T>,append:boolean){if(!onSortsChange||disabled)return;const previous=sorts.find(sort=>sort.key===column.key);let next:DataSort[];if(append)next=previous?(previous.descending?sorts.filter(sort=>sort.key!==column.key):sorts.map(sort=>sort.key===column.key?{...sort,descending:true}:sort)):[...sorts,{key:column.key,descending:false}];else next=previous?(previous.descending?[]:[{key:column.key,descending:true}]):[{key:column.key,descending:false}];if(next.length>5){setNotice('Sort by up to five columns. Remove a sort before adding another.');return;}onSortsChange(next);}
  const sortDescription=sorts.length?'Sorted by '+sorts.map((sort,index)=>(index+1)+'. '+(columns.find(column=>column.key===sort.key)?.label??sort.key)+' '+(sort.descending?'descending':'ascending')).join(', ')+'.':'No sorting.';
  if(rows.length>DATA_WORKSPACE_LIMITS.rows||columns.length>DATA_WORKSPACE_LIMITS.columns)return <p className="bui-data-grid bui-error" role="alert">Load up to 100 records and 30 columns in one grid page. Page larger datasets through the data source.</p>;
  if(!columns.length||new Set(columns.map(column=>column.key)).size!==columns.length||new Set(rows.map(row=>row.id)).size!==rows.length)return <p className="bui-data-grid bui-error" role="alert">Provide at least one column, unique column keys and unique record IDs.</p>;
  return <div className="bui-data-grid" onCopy={copy} onPaste={paste} onPointerMove={movePointerRange} onPointerUp={event=>{if(pointerRange.current?.id===event.pointerId)finishPointerRange();}} onPointerCancel={finishPointerRange} onLostPointerCapture={finishPointerRange}>
    <div className="bui-data-grid-toolbar"><p id={uid+'-help'} className="bui-hint">Drag to select. Enter to edit.<span className="bui-sr-only"> Arrow keys move between cells. Shift extends the range. Copy and paste apply within this page.</span></p><div className="bui-data-grid-actions">{onUndo&&<Button variant="ghost" size="sm" leadingIcon={Undo2} onClick={onUndo} disabled={disabled||!canUndo}>Undo</Button>}{onRedo&&<Button variant="ghost" size="sm" leadingIcon={Redo2} onClick={onRedo} disabled={disabled||!canRedo}>Redo</Button>}<Button variant="ghost" size="sm" leadingIcon={Copy} disabled={!selectedCount} onClick={()=>void copyButton()}>Copy cells</Button>{onOpenRow&&<Button variant="secondary" size="sm" trailingIcon={ExternalLink} disabled={!rows.length||disabled} onClick={()=>rows[active.row]&&onOpenRow(rows[active.row])}>Open record</Button>}</div></div>
    <div className="bui-data-grid-scroll"><table ref={table} role="grid" aria-label={label} aria-describedby={uid+'-help '+uid+'-sort'} aria-rowcount={rows.length+1} aria-colcount={columns.length} aria-multiselectable="true" aria-disabled={disabled||undefined}>
      <thead><tr role="row" aria-rowindex={1}>{columns.map(column=>{const order=sorts.findIndex(sort=>sort.key===column.key),sorting=sorts[order];return <th key={column.key} role="columnheader" scope="col" aria-sort={order===0?(sorting.descending?'descending':'ascending'):order>0?'other':undefined} style={{'--bui-grid-column-min':column.type==='text'&&column.key!=='id'?'220px':'128px'} as CSSProperties}>{onSortsChange?<button type="button" className="bui-data-grid-sort" disabled={disabled} aria-label={'Sort by '+column.label} title="Select to sort. Shift + select adds a sort." onClick={event=>sort(column,event.shiftKey)}>{column.label}<span>{order>=0&&<small>{order+1}</small>}<Icon icon={sorting?(sorting.descending?ArrowDown:ArrowUp):ArrowUpDown} size={14}/></span></button>:column.label}</th>;})}</tr></thead>
      <tbody>{rows.map((row,rowIndex)=><tr key={row.id} role="row" aria-rowindex={rowIndex+2}>{columns.map((column,columnIndex)=>{
        const key=cellKey(row.id,column.key),point={row:rowIndex,column:columnIndex},selected=hasSelection&&gridRangeContains(range,point),isActive=active.row===rowIndex&&active.column===columnIndex,isEditing=editing?.id===row.id&&editing.key===column.key,error=errors.get(key),value=row[column.key],errorId=uid+'-error-'+rowIndex+'-'+columnIndex,valueId=uid+'-value-'+rowIndex+'-'+columnIndex;
        const choice=column.type==='select'?(isEditing?editing:closingChoice?.id===row.id&&closingChoice.key===column.key?closingChoice:null):null;
        const common={className:'bui-data-grid-editor','aria-label':column.label+' for '+row.id,'aria-invalid':!!error||undefined,'aria-describedby':error?errorId:undefined,disabled,value:isEditing?editing.value:'',ref:(node:HTMLInputElement|null)=>{editor.current=node;},onChange:(event:{target:{value:string}})=>setEditing(current=>current?{...current,value:event.target.value}:null),onBlur:()=>commit(),onKeyDown:(event:KeyboardEvent<HTMLInputElement>)=>editorKeyDown(event,point)};
        return <td key={column.key} role="gridcell" ref={node=>{if(node)cells.current.set(key,node);else cells.current.delete(key);}} tabIndex={isActive?0:-1} aria-selected={selected} aria-readonly={!onEdit||column.editable!==true||column.key==='id'||column.key==='revision'||undefined} aria-invalid={!!error||undefined} aria-describedby={[!isEditing&&!choice&&valueId,error&&errorId].filter(Boolean).join(' ')||undefined} aria-label={column.label+' for '+row.id} data-row-id={row.id} data-column-key={column.key} data-column-type={column.type} data-selected={selected||undefined} data-range-top={selected&&rowIndex===selectedBounds.top||undefined} data-range-bottom={selected&&rowIndex===selectedBounds.bottom||undefined} data-range-start={selected&&columnIndex===selectedBounds.left||undefined} data-range-end={selected&&columnIndex===selectedBounds.right||undefined} data-active={hasSelection&&isActive||undefined} data-editing={isEditing||undefined} data-dirty={dirty.has(key)||undefined} data-invalid={!!error||undefined} onFocus={event=>{if(event.target===event.currentTarget&&(!focus||!isActive)&&!focusIntent.current){setFocus({id:row.id,key:column.key});setAnchor({id:row.id,key:column.key});}}} onPointerDown={event=>startPointerRange(event,point)} onClick={event=>{if(ignoreClick.current){ignoreClick.current=false;return;}if(!isEditing)activate(point,event.shiftKey,true,false);}} onDoubleClick={()=>{if(!isEditing)begin(point);}} onKeyDown={event=>keyDown(event,point)}>
          {choice?<GridChoiceEditor key={key+'-'+choice.session} label={column.label+' for '+row.id} columnKey={column.key} owner={uid} options={column.options??[]} value={choice.value} active={isEditing} searchable={column.searchable??(column.options?.length??0)>7} disabled={disabled} errorId={error?errorId:undefined} onFinish={result=>finishChoice(result,point)} onClosed={()=>setClosingChoice(current=>current?.session===choice.session?null:current)}/>:isEditing?<input {...common} type="text" inputMode={column.type==='number'?'decimal':undefined} placeholder={column.type==='date'?'YYYY-MM-DD':undefined}/>:<span id={valueId} className="bui-data-grid-value" data-value={column.type==='select'&&typeof value==='string'?value:undefined} title={String(value??'')}>{column.type==='select'?column.options?.find(option=>option.value===value)?.label??String(value??''):String(value??'')||<span className="bui-data-grid-empty">—</span>}</span>}
          {selected&&selectedCount>1&&rowIndex===selectedBounds.bottom&&columnIndex===selectedBounds.right&&<span aria-hidden="true" className="bui-data-grid-range-corner"/>}
          {error&&<span id={errorId} className="bui-data-grid-error">{error}</span>}
        </td>;
      })}</tr>)}</tbody>
    </table>{!rows.length&&<p className="bui-data-grid-empty-state">No loaded records match this view.</p>}</div>
    <div className="bui-data-grid-footer"><span>{selectedCount} {selectedCount===1?'cell':'cells'} selected{selectedCount>1?` · ${selectedBounds.bottom-selectedBounds.top+1} × ${selectedBounds.right-selectedBounds.left+1} range`:null}</span><span>{rows.length} loaded {rows.length===1?'record':'records'}</span><span className="bui-sr-only" id={uid+'-sort'}>{sortDescription}{onSortsChange&&' Shift + select a heading to add another sort.'}</span></div>
    <p className="bui-data-grid-status bui-hint" role="status" aria-live="polite">{notice}</p>
  </div>;
}
