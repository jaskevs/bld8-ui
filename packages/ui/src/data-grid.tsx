/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useLayoutEffect,useRef,useState,type ClipboardEvent,type KeyboardEvent,type PointerEvent,type CSSProperties,type ReactNode,type RefCallback,type FocusEvent} from 'react';
import {ArrowDown,ArrowUp,ArrowUpDown,Copy,ExternalLink,Plus,Redo2,SlidersHorizontal,Undo2,X} from 'lucide-react';
import {Button,Checkbox,Icon} from './core.js';
import {Select} from './controls.js';
import {Dialog} from './overlays.js';
import {useControllableValue} from './state.js';
import {createTableViewState,normalizeTableViewState,type TableViewState} from './table-view-state.js';
import {GridChoiceEditor,type GridChoiceResult} from './data-grid-choice.js';
import {GridRichEditor,GridCellValue,type GridRichEditResult} from './data-grid-editors.js';
import {isFilterDate} from './filter-query.js';
import {gridApplySelectionEdits,gridFillDownEdits,gridPasteEdits,gridRangeBounds,gridRangeContains,serializeGridClipboard,type GridPoint,type GridRange} from './data-grid-state.js';
import {DATA_WORKSPACE_LIMITS,dataValuesEqual,parseDataValue,type DataCellError,type DataColumn,type DataEdit,type DataRecord,type DataSort} from './data-workspace-state.js';

/** The presentation subset of a portable table view. Queries and drafts remain with the host. */
export type DataGridViewState=Pick<TableViewState,'columnOrderKeys'|'visibleColumnKeys'|'columnWidths'|'columnPinning'|'density'>;
const gridMinimum=<T extends DataRecord>(column:DataColumn<T>)=>column.minWidth??(column.type==='text'&&column.key!=='id'?220:128);
const gridViewPart=(state:TableViewState):DataGridViewState=>({columnOrderKeys:state.columnOrderKeys,visibleColumnKeys:state.visibleColumnKeys,columnWidths:state.columnWidths,columnPinning:state.columnPinning,density:state.density});
function normalizedGridView<T extends DataRecord>(columns:readonly DataColumn<T>[],view?:DataGridViewState):DataGridViewState {
  const options={columns:columns.map(column=>({key:column.key,hideable:column.hideable,minWidth:gridMinimum(column),pinned:column.pinned,sortable:column.sortable}))};
  const base=createTableViewState(options);
  const defaults={...base,columnWidths:Object.fromEntries(columns.flatMap(column=>column.width===undefined?[]:[[column.key,column.width]]))};
  const presentation=view?{columnOrderKeys:view.columnOrderKeys,visibleColumnKeys:view.visibleColumnKeys,columnWidths:view.columnWidths,columnPinning:view.columnPinning,density:view.density}:{};
  return gridViewPart(normalizeTableViewState({...defaults,...presentation},options));
}
/** Independent column defaults, ready for controlled state or persistence alongside a table view. */
export function createDataGridViewState<T extends DataRecord>(columns:readonly DataColumn<T>[]):DataGridViewState {return normalizedGridView(columns);}

export interface DataGridCellContext<T extends DataRecord> {
  row:T;column:DataColumn<T>;value:T[Extract<keyof T,string>];rowIndex:number;columnIndex:number;selected:boolean;active:boolean;
}
/** Custom editors keep canonical column validation and the grid's transaction boundary. */
export interface DataGridEditorContext<T extends DataRecord> extends DataGridCellContext<T> {
  draftValue:unknown;label:string;error?:string;disabled:boolean;
  onValueChange:(value:unknown)=>void;
  /** Validate and apply one cell. False keeps the editor open with its error. */
  commit:(value?:unknown)=>boolean;
  cancel:(restoreFocus?:boolean)=>void;inputRef:RefCallback<HTMLElement>;
  onKeyDown:(event:KeyboardEvent<HTMLElement>)=>void;
  onBlur:(event:FocusEvent<HTMLElement>)=>void;
  /** Spread on a custom portal root so outside focus is not mistaken for editor focus. */
  portalProps:{'data-grid-choice-owner':string};
}
export interface DataGridProps<T extends DataRecord> {
  label:string;
  rows:readonly T[];
  columns:readonly DataColumn<T>[];
  onEdit?:(edits:DataEdit<T>[])=>void;
  /** Return undefined to keep the built-in presentational cell. Do not add tab stops. */
  renderCell?:(context:DataGridCellContext<T>)=>ReactNode;
  /** Return undefined to keep the built-in editor. Render a component to use hooks. */
  renderEditor?:(context:DataGridEditorContext<T>)=>ReactNode;
  cellErrors?:readonly DataCellError[];
  dirtyCells?:readonly {id:string;key:string}[];
  disabled?:boolean;
  onOpenRow?:(row:T)=>void;
  sorts?:readonly DataSort[];
  onSortsChange?:(sorts:DataSort[])=>void;
  /** Show a touch and keyboard sort editor when onSortsChange is provided. */
  sortControls?:boolean;
  /** Optional controlled presentation, using the same fields as TableViewState. */
  view?:DataGridViewState;
  defaultView?:DataGridViewState;
  onViewChange?:(view:DataGridViewState)=>void;
  /** Column visibility, ordering, pinning and density controls. Opt-in. */
  layoutControls?:boolean;
  /** Pointer and keyboard resizing. Opt-in; minWidth is respected. */
  resizableColumns?:boolean;
  onUndo?:()=>void;
  onRedo?:()=>void;
  canUndo?:boolean;
  canRedo?:boolean;
  onClipboardError?:(message:string)=>void;
  /** Opt-in loaded-range operations. Each valid operation emits one onEdit batch; the host owns history and persistence. */
  bulkEditing?:boolean;
  onBulkEditError?:(message:string)=>void;
}
interface CellIdentity {id:string;key:string}
interface Editing extends CellIdentity {value:unknown;session:number;type:DataColumn<DataRecord>['type'];rawDate?:boolean}
const emptyPoint={row:0,column:0};
const cellKey=(id:string,key:string)=>JSON.stringify([id,key]);

/** Optional spreadsheet interaction over the loaded page. Drafts and writes belong to the host. */
export function DataGrid<T extends DataRecord>({label,rows,columns:sourceColumns,onEdit,renderCell,renderEditor,cellErrors=[],dirtyCells=[],disabled=false,onOpenRow,sorts=[],onSortsChange,sortControls=true,view,defaultView,onViewChange,layoutControls=false,resizableColumns=false,onUndo,onRedo,canUndo,canRedo,onClipboardError,bulkEditing=false,onBulkEditError}:DataGridProps<T>) {
  const fallbackView:DataGridViewState={columnOrderKeys:sourceColumns.map(column=>column.key),visibleColumnKeys:sourceColumns.map(column=>column.key),columnWidths:{},columnPinning:{},density:'comfortable'};
  let initialView=fallbackView;try{initialView=normalizedGridView(sourceColumns);}catch{/* The schema alert below preserves the legacy validation boundary. */}
  if(defaultView)try{initialView=normalizedGridView(sourceColumns,defaultView);}catch{/* Keep independent column defaults when a saved view is malformed. */}
  const [rawView,setRawView]=useControllableValue(view,initialView,onViewChange);
  let layout=initialView;try{layout=normalizedGridView(sourceColumns,rawView);}catch{/* Ignore a malformed restored presentation rather than disturbing records. */}
  const layoutEnabled=layoutControls||resizableColumns||view!==undefined||defaultView!==undefined||onViewChange!==undefined||sourceColumns.some(column=>column.width!==undefined||column.minWidth!==undefined||column.pinned!==undefined);
  const ordered=layout.columnOrderKeys.flatMap(key=>{const column=sourceColumns.find(column=>column.key===key);return column?[column]:[];});
  const visible=ordered.filter(column=>layout.visibleColumnKeys.includes(column.key));
  const columns=layoutEnabled?[...visible.filter(column=>layout.columnPinning[column.key]==='start'),...visible.filter(column=>!layout.columnPinning[column.key]),...visible.filter(column=>layout.columnPinning[column.key]==='end')]:sourceColumns;
  const viewRef=useRef(layout);viewRef.current=layout;
  function changeView(next:DataGridViewState){const normalized=normalizedGridView(sourceColumns,next);viewRef.current=normalized;setRawView(normalized);}
  const scroll=useRef<HTMLDivElement>(null),[viewportWidth,setViewportWidth]=useState(0);
  useEffect(()=>{const node=scroll.current;if(!node||!layoutEnabled)return;const measure=()=>setViewportWidth(node.clientWidth);measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();},[layoutEnabled]);
  const baseWidth=(column:DataColumn<T>)=>Math.max(gridMinimum(column),Math.min(4096,layout.columnWidths[column.key]??column.width??gridMinimum(column)));
  const baseTotal=columns.reduce((total,column)=>total+baseWidth(column),0),extra=Math.max(0,viewportWidth-baseTotal);
  const stretch=columns.find(column=>!layout.columnPinning[column.key]&&layout.columnWidths[column.key]===undefined&&column.width===undefined);
  const width=(column:DataColumn<T>)=>baseWidth(column)+(column===stretch?extra:0);
  const columnStyle=(column:DataColumn<T>):CSSProperties|undefined=>{if(!layoutEnabled)return undefined;const index=columns.indexOf(column),pin=layout.columnPinning[column.key];const offset=pin==='start'?columns.slice(0,index).filter(item=>layout.columnPinning[item.key]==='start').reduce((sum,item)=>sum+width(item),0):columns.slice(index+1).filter(item=>layout.columnPinning[item.key]==='end').reduce((sum,item)=>sum+width(item),0);return {width:width(column),minWidth:width(column),maxWidth:width(column),...(pin?{insetInlineStart:pin==='start'?offset:undefined,insetInlineEnd:pin==='end'?offset:undefined}:{})};};
  const resizeSession=useRef<{column:DataColumn<T>;initial:number;start:number;direction:number;pointerId:number;target:HTMLSpanElement}|null>(null);
  function resize(column:DataColumn<T>,value:number){const current=viewRef.current;changeView({...current,columnWidths:{...current.columnWidths,[column.key]:Math.round(Math.min(4096,Math.max(gridMinimum(column),value)))}});}
  function finishResize(){const session=resizeSession.current;resizeSession.current=null;if(session?.target.hasPointerCapture(session.pointerId))session.target.releasePointerCapture(session.pointerId);}
  function startResize(event:PointerEvent<HTMLSpanElement>,column:DataColumn<T>){if(disabled||event.button!==0||!event.isPrimary)return;event.preventDefault();event.stopPropagation();finishResize();const target=event.currentTarget;resizeSession.current={column,initial:width(column),start:event.clientX,direction:getComputedStyle(target).direction==='rtl'?-1:1,pointerId:event.pointerId,target};target.setPointerCapture(event.pointerId);}

  const editorHost=useRef({rows,columns,sourceColumns,onEdit,disabled});editorHost.current={rows,columns,sourceColumns,onEdit,disabled};
  const uid=useId();const table=useRef<HTMLTableElement>(null);const cells=useRef(new Map<string,HTMLTableCellElement>());
  const focusIntent=useRef<CellIdentity|null>(null);const mounted=useRef(true);
  const ownedFocusNode=useRef<HTMLElement|null>(null),previousSchema=useRef({rowIds:rows.map(row=>row.id),columnKeys:columns.map(column=>column.key)});
  const pointerRange=useRef<{id:number;capture:HTMLTableCellElement;last:CellIdentity}|null>(null),ignoreClick=useRef(false);
  const [focus,setFocus]=useState<CellIdentity|null>(null),[anchor,setAnchor]=useState<CellIdentity|null>(null);
  const [editing,setEditing]=useState<Editing|null>(null),[notice,setNotice]=useState(''),[editorError,setEditorError]=useState('');
  const [closingChoice,setClosingChoice]=useState<Editing|null>(null);
  const editorSequence=useRef(0);
  const editor=useRef<HTMLElement|null>(null);const editingRef=useRef<Editing|null>(null);editingRef.current=editing;
  const errors=new Map(cellErrors.map(error=>[cellKey(error.id,error.key),error.message]));
  if(editing&&editorError)errors.set(cellKey(editing.id,editing.key),editorError);
  const dirty=new Set(dirtyCells.map(cell=>cellKey(cell.id,cell.key)));
  const at=(point:GridPoint):CellIdentity|null=>rows[point.row]&&columns[point.column]?{id:rows[point.row].id,key:columns[point.column].key}:null;
  const locate=(identity:CellIdentity|null):GridPoint=>{const row=rows.findIndex(row=>row.id===identity?.id),column=columns.findIndex(column=>column.key===identity?.key);return row>=0&&column>=0?{row,column}:emptyPoint;};
  const active=locate(focus),start=locate(anchor),range:GridRange={anchor:start,focus:active};
  const activeIdentity=at(active);const selectedBounds=gridRangeBounds(range);
  const hasSelection=!!focus&&rows.some(row=>row.id===focus.id)&&columns.some(column=>column.key===focus.key);
  const selectedCount=hasSelection?(selectedBounds.bottom-selectedBounds.top+1)*(selectedBounds.right-selectedBounds.left+1):0;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;finishPointerRange();finishResize();};},[]);
  useEffect(()=>{if(!editing)return;editor.current?.focus();if(editor.current instanceof HTMLInputElement&&['text','search'].includes(editor.current.type))editor.current.select();},[editing?.session]);
  // A portalled choice editor still belongs to this grid. Outside focus or pointer
  // activity relinquishes ownership, so a later schema update cannot steal it back.
  useEffect(()=>{
    const owns=(target:EventTarget|null)=>target instanceof HTMLElement&&(!!table.current?.contains(target)||target.closest('[data-grid-choice-owner]')?.getAttribute('data-grid-choice-owner')===uid);
    const entered=(event:globalThis.FocusEvent)=>{if(event.target===document.body&&ownedFocusNode.current&&!ownedFocusNode.current.isConnected)return;ownedFocusNode.current=owns(event.target)?event.target as HTMLElement:null;};
    const pressed=(event:globalThis.PointerEvent)=>{if(!owns(event.target))ownedFocusNode.current=null;};
    document.addEventListener('focusin',entered);document.addEventListener('pointerdown',pressed,true);
    return()=>{document.removeEventListener('focusin',entered);document.removeEventListener('pointerdown',pressed,true);};
  },[uid]);
  // Identity survives sorting and column moves. A removed anchor collapses rather
  // than silently extending the range to the first cell of the page.
  useLayoutEffect(()=>{
    const previous=previousSchema.current;previousSchema.current={rowIds:rows.map(row=>row.id),columnKeys:columns.map(column=>column.key)};
    const exists=(identity:CellIdentity|null)=>!!identity&&rows.some(row=>row.id===identity.id)&&columns.some(column=>column.key===identity.key);
    if(editing&&(!exists(editing)||disabled||!sourceColumns.some(column=>column.key===editing.key&&column.editable===true&&column.type===editing.type))){
      const active=document.activeElement,owned=ownedFocusNode.current;
      const restore=exists(editing)&&active instanceof HTMLElement&&(!!table.current?.contains(active)||active.closest('[data-grid-choice-owner]')?.getAttribute('data-grid-choice-owner')===uid||owned===active);
      editingRef.current=null;setEditing(null);setEditorError('');setClosingChoice(null);if(restore)scheduleFocus(editing);
    }
    if(focus&&!exists(focus)){
      const oldRow=Math.max(0,previous.rowIds.indexOf(focus.id)),oldColumn=Math.max(0,previous.columnKeys.findIndex(key=>key===focus.key));
      const row=rows.find(row=>row.id===focus.id)??rows[Math.min(oldRow,rows.length-1)],column=columns.find(column=>column.key===focus.key)??columns[Math.min(oldColumn,columns.length-1)];
      const next=row&&column?{id:row.id,key:column.key}:null;setFocus(next);setAnchor(next);
      const owned=ownedFocusNode.current;
      if(owned&&!owned.isConnected&&(!document.activeElement||document.activeElement===document.body)){if(next)scheduleFocus(next);else table.current?.focus({preventScroll:true});}
    }else if(anchor&&!exists(anchor))setAnchor(focus&&exists(focus)?focus:null);
  },[rows,columns,sourceColumns,disabled,focus,anchor,editing]);
  useEffect(()=>{if(closingChoice&&(!rows.some(row=>row.id===closingChoice.id)||!columns.some(column=>column.key===closingChoice.key&&['select','date','multi-select'].includes(column.type))))setClosingChoice(null);},[rows,columns,closingChoice]);
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
  function editableSession(current:Editing|null,session?:number){const live=editorHost.current;return !!current&&(session===undefined||current.session===session)&&mounted.current&&!live.disabled&&!!live.onEdit&&cells.current.has(cellKey(current.id,current.key))&&current.key!=='id'&&current.key!=='revision'&&live.sourceColumns.some(column=>column.key===current.key&&column.editable===true&&column.type===current.type);}
  function updateEditorValue(value:unknown,session?:number){const current=editingRef.current;if(!current||!editableSession(current,session))return;const next={...current,value};editingRef.current=next;setEditing(next);setEditorError('');}
  function begin(point=active,initial?:string){
    const row=rows[point.row],column=columns[point.column];if(disabled||!onEdit||!row||!column||column.editable!==true||column.key==='id'||column.key==='revision')return;
    const rawDate=column.type==='date'&&!!String(row[column.key]??'')&&!isFilterDate(String(row[column.key]));
    const value=column.type==='boolean'?row[column.key]:column.type==='multi-select'?(Array.isArray(row[column.key])?[...row[column.key] as string[]]:[]):column.type==='select'?String(row[column.key]??''):column.type==='date'?(rawDate?initial??String(row[column.key]??''):String(row[column.key]??'')):initial??String(row[column.key]??'');
    const next={id:row.id,key:column.key,value,session:++editorSequence.current,type:column.type,rawDate};setClosingChoice(null);setFocus(next);setAnchor(next);editingRef.current=next;setEditing(next);setEditorError('');setNotice('');
  }
  function commit(returnFocus=false,move?:GridPoint,session?:number){
    const current=editingRef.current;if(!current||session!==undefined&&current.session!==session)return;const live=editorHost.current,allowed=editableSession(current,session);editingRef.current=null;setEditing(null);setEditorError('');
    const row=live.rows.find(row=>row.id===current.id),column=live.sourceColumns.find(column=>column.key===current.key);
    const unchanged=row&&(column?.type==='boolean'||column?.type==='multi-select'?dataValuesEqual(row[current.key as keyof T],current.value):String(row[current.key as keyof T]??'')===String(current.value??''));
    if(allowed&&row&&!unchanged)live.onEdit?.([{id:current.id,key:current.key as Extract<keyof T,string>,value:current.value}]);
    if(editingRef.current)return;
    if(move){const row=live.rows[move.row],column=live.columns[move.column];if(row&&column){const identity={id:row.id,key:column.key};setFocus(identity);setAnchor(identity);scheduleFocus(identity);cells.current.get(cellKey(identity.id,identity.key))?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}}
    else if(returnFocus)scheduleFocus(current);
  }
  function commitValidated(returnFocus=true,move?:GridPoint,value?:unknown,session?:number){
    const current=editingRef.current,column=editorHost.current.sourceColumns.find(column=>column.key===current?.key);if(!current||!column||!editableSession(current,session))return false;
    const parsed=parseDataValue(column,value===undefined?current.value:value);if(parsed.error){setEditorError(parsed.error);return false;}
    editingRef.current={...current,value:parsed.value};commit(returnFocus,move,session);return true;
  }
  function cancel(returnFocus=true,session?:number){const current=editingRef.current;if(session!==undefined&&current?.session!==session)return;editingRef.current=null;setEditing(null);setEditorError('');if(returnFocus)scheduleFocus(current);}
  function settleChoiceFocus(identity:CellIdentity|null){
    // The primitive may finish list navigation after our commit in this event.
    // Settle in the same event turn, without a frame delay or taking outside focus.
    queueMicrotask(()=>{if(!editingRef.current&&document.activeElement?.closest('[data-grid-choice-owner]')?.getAttribute('data-grid-choice-owner')===uid)scheduleFocus(identity);});
  }
  function finishChoice(result:GridChoiceResult,_point:GridPoint,session:number){
    const current=editingRef.current;if(!current||current.session!==session)return;if(!editableSession(current,session)){cancel(false,session);setClosingChoice(null);return;}
    const live=editorHost.current,point={row:live.rows.findIndex(row=>row.id===current.id),column:live.columns.findIndex(column=>column.key===current.key)};
    const closing={...current,value:result.value};setClosingChoice(closing);
    if(result.intent==='dismiss'){cancel(result.restoreFocus,session);if(result.restoreFocus)settleChoiceFocus(current);return;}
    editingRef.current=closing;
    if(result.intent==='tab'){
      const index=point.row*live.columns.length+point.column+(result.reverse?-1:1);
      if(index>=0&&index<live.rows.length*live.columns.length){const next={row:Math.floor(index/live.columns.length),column:index%live.columns.length};const identity={id:live.rows[next.row].id,key:live.columns[next.column].key};commit(false,next,session);settleChoiceFocus(identity);}
      else {commit(true,undefined,session);return false;}
    }else {commit(result.restoreFocus,undefined,session);if(result.restoreFocus)settleChoiceFocus(current);}
  }
  function finishRich(result:GridRichEditResult,session:number){
    const current=editingRef.current;if(!current||current.session!==session)return;if(!editableSession(current,session)){cancel(false,session);setClosingChoice(null);return;}setClosingChoice({...current,value:result.value});
    if(result.intent==='dismiss'){cancel(result.restoreFocus);if(result.restoreFocus)settleChoiceFocus(current);return;}
    editingRef.current={...current,value:result.value};commit(result.restoreFocus);if(result.restoreFocus)settleChoiceFocus(current);
  }
  function selectionText(){const bounds=gridRangeBounds(range);return serializeGridClipboard(rows.slice(bounds.top,bounds.bottom+1).map(row=>columns.slice(bounds.left,bounds.right+1).map(column=>row[column.key])));}
  function copy(event:ClipboardEvent<HTMLDivElement>){if(editingRef.current||!table.current?.contains(event.target as Node)||!selectedCount)return;try{event.preventDefault();event.clipboardData.setData('text/plain',selectionText());setNotice(selectedCount+' cells copied.');}catch(error){event.preventDefault();failClipboard(error instanceof Error?error.message:'The cells could not be copied.');}}
  async function copyButton(){try{if(!navigator.clipboard?.writeText)throw new Error('Select the cells and use your keyboard Copy command.');await navigator.clipboard.writeText(selectionText());if(mounted.current)setNotice(selectedCount+' cells copied.');}catch(error){if(mounted.current)failClipboard(error instanceof Error?error.message:'Use your keyboard Copy command to copy these cells.');}}
  function paste(event:ClipboardEvent<HTMLDivElement>){if(editingRef.current||!table.current?.contains(event.target as Node)||!onEdit||disabled)return;event.preventDefault();try{const edits=gridPasteEdits(rows,columns,active,event.clipboardData.getData('text/plain'));onEdit(edits);const bottom=rows.findIndex(row=>row.id===edits[edits.length-1].id),right=columns.findIndex(column=>column.key===edits[edits.length-1].key),last=at({row:bottom,column:right});setAnchor(activeIdentity);setFocus(last);scheduleFocus(last);setNotice(edits.length+' cells added to the draft. Review the values before saving.');}catch(error){failClipboard(error instanceof Error?error.message:'The cells could not be pasted.');}}
  function clear(){if(disabled||!onEdit||!rows.length)return;const bounds=gridRangeBounds(range),targets=columns.slice(bounds.left,bounds.right+1);if(targets.some(column=>column.editable!==true||column.key==='id'||column.key==='revision')){setNotice('Choose editable cells to clear.');return;}onEdit(rows.slice(bounds.top,bounds.bottom+1).flatMap(row=>targets.map(column=>({id:row.id,key:column.key,value:column.type==='boolean'?false:column.type==='multi-select'?[]:''}))));setNotice(selectedCount+' cells cleared in the draft.');}
  const bulkSelectionReady=hasSelection&&!!anchor&&rows.some(row=>row.id===anchor.id)&&columns.some(column=>column.key===anchor.key)&&!editing;
  const bulkEditable=bulkSelectionReady&&columns.slice(selectedBounds.left,selectedBounds.right+1).some(column=>column.editable===true&&column.key!=='id'&&column.key!=='revision');
  function bulkEdit(operation:'fill-down'|'apply-active'){
    if(!bulkEditing||disabled||!onEdit||editingRef.current||!bulkSelectionReady||!bulkEditable||selectedCount<2||operation==='fill-down'&&selectedBounds.top===selectedBounds.bottom)return;
    let edits:DataEdit<T>[];
    try{edits=operation==='fill-down'?gridFillDownEdits(rows,columns,range):gridApplySelectionEdits(rows,columns,range,rows[active.row][columns[active.column].key]);}
    catch(error){const message='Nothing sent to the draft. '+(error instanceof Error?error.message:'The selected values could not be validated.');setNotice(message);onBulkEditError?.(message);return;}
    if(!edits.length){setNotice('The editable selected cells already match. Read-only cells were kept.');return;}
    onEdit(edits);setNotice(edits.length+' cell '+(edits.length===1?'change':'changes')+' sent to the draft as one batch. Read-only cells were kept. Review before saving.');
  }
  function keyDown(event:KeyboardEvent<HTMLTableCellElement>,point:GridPoint){
    if(event.defaultPrevented||editingRef.current||event.target!==event.currentTarget)return;
    const command=event.ctrlKey||event.metaKey;
    if(bulkEditing&&command&&!event.altKey&&!event.shiftKey&&event.key.toLowerCase()==='d'){event.preventDefault();bulkEdit('fill-down');return;}
    if(bulkEditing&&command&&event.key==='Enter'){event.preventDefault();bulkEdit('apply-active');return;}
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
  function editorKeyDown(event:KeyboardEvent<HTMLElement>,point:GridPoint,validated=false){
    if(event.defaultPrevented)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();return;}
    if(event.key==='Enter'){event.preventDefault();event.stopPropagation();if(validated)commitValidated(true);else commit(true);return;}
    if(event.key==='Tab'){const direction=event.shiftKey?-1:1,index=point.row*columns.length+point.column+direction;if(index>=0&&index<rows.length*columns.length){event.preventDefault();const next={row:Math.floor(index/columns.length),column:index%columns.length};if(validated)commitValidated(false,next);else commit(false,next);}else if(validated){if(!commitValidated(false))event.preventDefault();}else commit();return;}
    event.stopPropagation();
  }
  function sort(column:DataColumn<T>,append:boolean){if(!onSortsChange||disabled||column.sortable===false)return;const previous=sorts.find(sort=>sort.key===column.key);let next:DataSort[];if(append)next=previous?(previous.descending?sorts.filter(sort=>sort.key!==column.key):sorts.map(sort=>sort.key===column.key?{...sort,descending:true}:sort)):[...sorts,{key:column.key,descending:false}];else next=previous?(previous.descending?[]:[{key:column.key,descending:true}]):[{key:column.key,descending:false}];if(next.length>5){setNotice('Sort by up to five columns. Remove a sort before adding another.');return;}onSortsChange(next);}
  const sortDescription=sorts.length?'Sorted by '+sorts.map((sort,index)=>(index+1)+'. '+(sourceColumns.find(column=>column.key===sort.key)?.label??sort.key)+' '+(sort.descending?'descending':'ascending')).join(', ')+'.':'No sorting.';
  if(rows.length>DATA_WORKSPACE_LIMITS.rows||sourceColumns.length>DATA_WORKSPACE_LIMITS.columns)return <p className="bui-data-grid bui-error" role="alert">Load up to 100 records and 30 columns in one grid page. Page larger datasets through the data source.</p>;
  if(!sourceColumns.length||new Set(sourceColumns.map(column=>column.key)).size!==sourceColumns.length||new Set(rows.map(row=>row.id)).size!==rows.length)return <p className="bui-data-grid bui-error" role="alert">Provide at least one column, unique column keys and unique record IDs.</p>;
  return <div className="bui-data-grid" data-bulk-editing={bulkEditing||undefined} data-layout={layoutEnabled||undefined} data-density={layoutEnabled?layout.density:undefined} onCopy={copy} onPaste={paste} onPointerMove={movePointerRange} onPointerUp={event=>{if(pointerRange.current?.id===event.pointerId)finishPointerRange();}} onPointerCancel={finishPointerRange} onLostPointerCapture={finishPointerRange}>
    <div className="bui-data-grid-toolbar"><p id={uid+'-help'} className="bui-hint">Drag to select. Enter to edit.<span className="bui-sr-only"> Arrow keys move between cells. Shift extends the range. Copy and paste apply within this page.{bulkEditing?' Control or Command+D fills down; Control or Command+Enter applies the active value to the selection. Read-only columns are kept.':null}</span></p><div className="bui-data-grid-actions">{layoutControls&&<GridLayoutControls columns={sourceColumns} view={layout} onChange={changeView} disabled={disabled} resizable={resizableColumns}/>} {sortControls&&onSortsChange&&<GridSortControls columns={sourceColumns} sorts={sorts} onChange={onSortsChange} disabled={disabled}/>}{onUndo&&<Button variant="ghost" size="sm" leadingIcon={Undo2} onClick={onUndo} disabled={disabled||!canUndo}>Undo</Button>}{onRedo&&<Button variant="ghost" size="sm" leadingIcon={Redo2} onClick={onRedo} disabled={disabled||!canRedo}>Redo</Button>}{bulkEditing&&<><Button variant="ghost" size="sm" leadingIcon={ArrowDown} disabled={disabled||!onEdit||!bulkEditable||selectedCount<2||selectedBounds.top===selectedBounds.bottom} title="Repeat the top selected row down each editable column. Control or Command+D." onClick={()=>bulkEdit('fill-down')}>Fill down</Button><Button variant="ghost" size="sm" leadingIcon={Copy} disabled={disabled||!onEdit||!bulkEditable||selectedCount<2} title="Apply the active cell value to every editable selected cell. All destination columns must accept it. Control or Command+Enter." onClick={()=>bulkEdit('apply-active')}>Apply value</Button></>}<Button variant="ghost" size="sm" leadingIcon={Copy} disabled={!selectedCount} onClick={()=>void copyButton()}>Copy cells</Button>{onOpenRow&&<Button variant="secondary" size="sm" trailingIcon={ExternalLink} disabled={!rows.length||disabled} onClick={()=>rows[active.row]&&onOpenRow(rows[active.row])}>Open record</Button>}</div></div>
    <div ref={scroll} className="bui-data-grid-scroll"><table ref={table} tabIndex={-1} id={uid+'-table'} style={layoutEnabled?{width:baseTotal+(stretch?extra:0),minWidth:baseTotal+(stretch?extra:0)}:undefined} role="grid" aria-label={label} aria-describedby={uid+'-help '+uid+'-sort'} aria-rowcount={rows.length+1} aria-colcount={columns.length} aria-multiselectable="true" aria-disabled={disabled||undefined}>
      {layoutEnabled&&<colgroup>{columns.map(column=><col key={column.key} style={{width:width(column)}}/>)}</colgroup>}<thead><tr role="row" aria-rowindex={1}>{columns.map((column,columnIndex)=>{const order=sorts.findIndex(sort=>sort.key===column.key),sorting=sorts[order],pin=layoutEnabled?layout.columnPinning[column.key]:undefined;return <th key={column.key} role="columnheader" scope="col" aria-colindex={columnIndex+1} data-column-key={column.key} data-pinned={pin} aria-sort={order===0?(sorting.descending?'descending':'ascending'):order>0?'other':undefined} style={{'--bui-grid-column-min':column.type==='text'&&column.key!=='id'?'220px':'128px',...columnStyle(column)} as CSSProperties}>{onSortsChange&&column.sortable!==false?<button type="button" className="bui-data-grid-sort" disabled={disabled} aria-label={'Sort by '+column.label} title="Select to sort. Shift + select adds a sort." onClick={event=>sort(column,event.shiftKey)}>{column.label}<span>{order>=0&&<small>{order+1}</small>}<Icon icon={sorting?(sorting.descending?ArrowDown:ArrowUp):ArrowUpDown} size={14}/></span></button>:layoutEnabled?<span className="bui-data-grid-static-heading">{column.label}</span>:column.label}{resizableColumns&&column.resizable!==false&&<span role="separator" className="bui-data-grid-resize" tabIndex={disabled?-1:0} aria-label={'Resize '+column.label} aria-orientation="vertical" aria-disabled={disabled||undefined} aria-controls={uid+'-table'} aria-valuemin={gridMinimum(column)} aria-valuemax={4096} aria-valuenow={Math.round(width(column))} aria-valuetext={Math.round(width(column))+' pixels'} onKeyDown={event=>{if(disabled)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const direction=getComputedStyle(event.currentTarget).direction==='rtl'?-1:1;resize(column,width(column)+(event.key==='ArrowRight'?10:-10)*direction);}else if(event.key==='Home'||event.key==='End'){event.preventDefault();resize(column,event.key==='Home'?gridMinimum(column):4096);}else if(event.key==='Escape'&&resizeSession.current){event.preventDefault();resize(column,resizeSession.current.initial);finishResize();}}} onPointerDown={event=>startResize(event,column)} onPointerMove={event=>{if(disabled){finishResize();return;}const session=resizeSession.current;if(session?.pointerId===event.pointerId)resize(session.column,session.initial+(event.clientX-session.start)*session.direction);}} onPointerUp={finishResize} onPointerCancel={finishResize} onLostPointerCapture={finishResize} onDoubleClick={()=>{if(disabled)return;const widths={...viewRef.current.columnWidths};delete widths[column.key];changeView({...viewRef.current,columnWidths:widths});}}/>}</th>;})}</tr></thead>
      <tbody>{rows.map((row,rowIndex)=><tr key={row.id} role="row" aria-rowindex={rowIndex+2}>{columns.map((column,columnIndex)=>{
        const key=cellKey(row.id,column.key),point={row:rowIndex,column:columnIndex},selected=hasSelection&&gridRangeContains(range,point),isActive=active.row===rowIndex&&active.column===columnIndex,isEditing=editing?.id===row.id&&editing.key===column.key,error=errors.get(key),value=row[column.key],errorId=uid+'-error-'+rowIndex+'-'+columnIndex,valueId=uid+'-value-'+rowIndex+'-'+columnIndex;
        const context:DataGridCellContext<T>={row,column,value,rowIndex,columnIndex,selected,active:isActive};
        const cellContent=renderCell?.(context),editorSession=isEditing?editing.session:undefined;
        const custom=isEditing?renderEditor?.({...context,draftValue:editing.value,label:column.label+' for '+row.id,error,disabled,onValueChange:value=>updateEditorValue(value,editorSession),commit:value=>commitValidated(true,undefined,value,editorSession),cancel:restoreFocus=>cancel(restoreFocus,editorSession),inputRef:node=>{if(editingRef.current?.session===editorSession)editor.current=node;},portalProps:{'data-grid-choice-owner':uid},onKeyDown:event=>{if(editingRef.current?.session===editorSession)editorKeyDown(event,point,true);},onBlur:event=>{if(editingRef.current?.session!==editorSession)return;const target=event.relatedTarget as HTMLElement|null;if(!target||!event.currentTarget.closest('.bui-data-grid-custom-editor')?.contains(target)&&target.closest('[data-grid-choice-owner]')?.getAttribute('data-grid-choice-owner')!==uid)commitValidated(false,undefined,undefined,editorSession);}}):undefined;
        const retained=isEditing?editing:closingChoice?.id===row.id&&closingChoice.key===column.key?closingChoice:null;
        const choice=column.type==='select'&&custom===undefined?retained:null;
        const inlineDate=retained?.rawDate===true;
        const rich=['date','multi-select'].includes(column.type)&&!inlineDate&&custom===undefined?retained:null;
        const common={className:'bui-data-grid-editor','aria-label':column.label+' for '+row.id,'aria-invalid':!!error||undefined,'aria-describedby':error?errorId:undefined,disabled,value:isEditing?String(editing.value??''):'',ref:(node:HTMLInputElement|null)=>{if(editingRef.current?.session===editorSession)editor.current=node;},onChange:(event:{target:{value:string}})=>updateEditorValue(event.target.value,editorSession),onBlur:()=>inlineDate?commitValidated(false,undefined,undefined,editorSession):commit(false,undefined,editorSession),onKeyDown:(event:KeyboardEvent<HTMLInputElement>)=>{if(editingRef.current?.session===editorSession)editorKeyDown(event,point,inlineDate);}};
        return <td key={column.key} role="gridcell" ref={node=>{if(node)cells.current.set(key,node);else cells.current.delete(key);}} tabIndex={isActive?0:-1} aria-selected={selected} aria-readonly={!onEdit||column.editable!==true||column.key==='id'||column.key==='revision'||undefined} aria-invalid={!!error||undefined} aria-describedby={[!isEditing&&!choice&&!rich&&valueId,error&&errorId].filter(Boolean).join(' ')||undefined} aria-label={column.label+' for '+row.id} data-row-id={row.id} data-column-key={column.key} data-column-type={column.type} data-pinned={layoutEnabled?layout.columnPinning[column.key]:undefined} style={columnStyle(column)} aria-colindex={columnIndex+1} data-selected={selected||undefined} data-range-top={selected&&rowIndex===selectedBounds.top||undefined} data-range-bottom={selected&&rowIndex===selectedBounds.bottom||undefined} data-range-start={selected&&columnIndex===selectedBounds.left||undefined} data-range-end={selected&&columnIndex===selectedBounds.right||undefined} data-active={hasSelection&&isActive||undefined} data-editing={isEditing||undefined} data-dirty={dirty.has(key)||undefined} data-invalid={!!error||undefined} onFocus={event=>{if(event.target===event.currentTarget&&(!focus||!isActive)&&!focusIntent.current){setFocus({id:row.id,key:column.key});setAnchor({id:row.id,key:column.key});}}} onPointerDown={event=>startPointerRange(event,point)} onClick={event=>{if(ignoreClick.current){ignoreClick.current=false;return;}if(!isEditing)activate(point,event.shiftKey,true,false);}} onDoubleClick={()=>{if(!isEditing)begin(point);}} onKeyDown={event=>keyDown(event,point)}>
          {choice?<GridChoiceEditor key={key+'-'+choice.session} label={column.label+' for '+row.id} columnKey={column.key} owner={uid} options={column.options??[]} value={String(choice.value??'')} active={isEditing} searchable={column.searchable??(column.options?.length??0)>7} disabled={disabled} errorId={error?errorId:undefined} onFinish={result=>finishChoice(result,point,choice.session)} onClosed={()=>setClosingChoice(current=>current?.session===choice.session?null:current)}/>:rich?<GridRichEditor key={key+'-'+rich.session} label={column.label+' for '+row.id} column={column} value={rich.value} active={isEditing} disabled={disabled} owner={uid} errorId={error?errorId:undefined} onFinish={result=>finishRich(result,rich.session)} onOwnedFocus={node=>{if(editingRef.current?.session===rich.session)ownedFocusNode.current=node;}} onClosed={()=>setClosingChoice(current=>current?.session===rich.session?null:current)}/>:isEditing&&custom!==undefined?<div className="bui-data-grid-custom-editor" onFocusCapture={event=>{ownedFocusNode.current=event.target as HTMLElement;}} onPointerDownCapture={event=>{ownedFocusNode.current=event.target as HTMLElement;}} >{custom}</div>:isEditing&&column.type==='boolean'?<Checkbox className="bui-data-grid-checkbox-editor" label={editing.value===true?'Yes':'No'} aria-label={column.label+' for '+row.id} checked={editing.value===true} disabled={disabled} inputRef={node=>{if(editingRef.current?.session===editorSession)editor.current=node;}} onCheckedChange={value=>updateEditorValue(value,editorSession)} onBlur={()=>commitValidated(false,undefined,undefined,editorSession)} onKeyDown={event=>{if(editingRef.current?.session===editorSession)editorKeyDown(event,point,true);}}/>:isEditing?<input {...common} type="text" inputMode={column.type==='number'?'decimal':undefined} placeholder={inlineDate?'YYYY-MM-DD':undefined}/>:<span id={valueId} className="bui-data-grid-value" data-value={column.type==='select'&&typeof value==='string'?value:undefined} title={Array.isArray(value)?value.map(id=>column.options?.find(option=>option.value===id)?.label??String(id)).join(', '):String(value??'')}>{cellContent!==undefined?cellContent:<GridCellValue column={column} value={value}/>}</span>}
          {selected&&selectedCount>1&&rowIndex===selectedBounds.bottom&&columnIndex===selectedBounds.right&&<span aria-hidden="true" className="bui-data-grid-range-corner"/>}
          {error&&<span id={errorId} className="bui-data-grid-error">{error}</span>}
        </td>;
      })}</tr>)}</tbody>
    </table>{!rows.length&&<p className="bui-data-grid-empty-state">No loaded records match this view.</p>}</div>
    <div className="bui-data-grid-footer"><span>{selectedCount} {selectedCount===1?'cell':'cells'} selected{selectedCount>1?` · ${selectedBounds.bottom-selectedBounds.top+1} × ${selectedBounds.right-selectedBounds.left+1} range`:null}</span><span>{rows.length} loaded {rows.length===1?'record':'records'}</span><span className="bui-sr-only" id={uid+'-sort'}>{sortDescription}{onSortsChange&&(sortControls?' Use Sort to change priorities without modifier keys.':' Shift + select a heading to add another sort.')}</span></div>
    <p className="bui-data-grid-status bui-hint" role="status" aria-live="polite">{notice}</p>
  </div>;
}


function GridLayoutControls<T extends DataRecord>({columns,view,onChange,disabled,resizable}:{columns:readonly DataColumn<T>[];view:DataGridViewState;onChange:(view:DataGridViewState)=>void;disabled:boolean;resizable:boolean}) {
  const order=view.columnOrderKeys.flatMap(key=>{const column=columns.find(column=>column.key===key);return column?[column]:[];});
  function move(index:number,delta:number){const keys=[...view.columnOrderKeys];[keys[index],keys[index+delta]]=[keys[index+delta],keys[index]];onChange({...view,columnOrderKeys:keys});}
  return <Dialog title="Grid layout" description="Arrange columns, keep key fields in view and choose your reading density." trigger={<Button variant="secondary" size="sm" leadingIcon={SlidersHorizontal} disabled={disabled}>Columns</Button>}>
    <div className="bui-data-grid-settings">
      <Select label="Grid density" disabled={disabled} value={view.density} density="compact" options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]} onValueChange={value=>{if(value==='comfortable'||value==='compact')onChange({...view,density:value});}}/>
      <p className="bui-hint">Pinned columns appear at the logical start or end. At least one column stays visible.</p>
      <ol className="bui-data-grid-column-settings">{order.map((column,index)=>{const shown=view.visibleColumnKeys.includes(column.key),pin=view.columnPinning[column.key]??'none';return <li key={column.key} data-grid-layout-key={column.key}>
        <div className="bui-data-grid-column-identity"><Checkbox label={column.label} checked={shown} disabled={disabled||column.hideable===false||shown&&view.visibleColumnKeys.length===1} onCheckedChange={checked=>onChange({...view,visibleColumnKeys:checked?[...view.visibleColumnKeys,column.key]:view.visibleColumnKeys.filter(key=>key!==column.key)})}/><span className="bui-data-grid-column-position">{index+1} of {order.length}</span></div>
        <Select label={'Pin '+column.label} disabled={disabled} labelVisibility="hidden" density="compact" value={pin} options={[{value:'none',label:'Not pinned'},{value:'start',label:'Inline start'},{value:'end',label:'Inline end'}]} onValueChange={value=>{if(!value)return;const next={...view.columnPinning};if(value==='none')delete next[column.key];else if(value==='start'||value==='end')next[column.key]=value;onChange({...view,columnPinning:next});}}/>
        <div className="bui-data-grid-settings-actions"><Button variant="ghost" size="sm" className="bui-icon-button" aria-label={'Move '+column.label+' earlier'} disabled={disabled||index===0} onClick={()=>move(index,-1)}><Icon icon={ArrowUp} size={16}/></Button><Button variant="ghost" size="sm" className="bui-icon-button" aria-label={'Move '+column.label+' later'} disabled={disabled||index===order.length-1} onClick={()=>move(index,1)}><Icon icon={ArrowDown} size={16}/></Button></div>
      </li>;})}</ol>
      <div className="bui-data-grid-settings-footer">{resizable&&<p className="bui-hint">Resize a column from its heading. Arrow keys adjust by 10 pixels; Home uses its minimum.</p>}<Button variant="secondary" size="sm" disabled={disabled} onClick={()=>onChange(createDataGridViewState(columns))}>Reset layout</Button></div>
    </div>
  </Dialog>;
}

function GridSortControls<T extends DataRecord>({columns,sorts,onChange,disabled}:{columns:readonly DataColumn<T>[];sorts:readonly DataSort[];onChange:(sorts:DataSort[])=>void;disabled:boolean}) {
  const available=columns.filter(column=>column.sortable!==false);
  const addButton=useRef<HTMLButtonElement>(null),fields=useRef(new Map<number,HTMLButtonElement>()),pendingFocus=useRef<number|null>(null);
  useEffect(()=>{if(pendingFocus.current===null)return;const index=pendingFocus.current;pendingFocus.current=null;if(index<0||!sorts.length)addButton.current?.focus();else fields.current.get(Math.min(index,sorts.length-1))?.focus();},[sorts]);
  function add(){const column=available.find(column=>!sorts.some(sort=>sort.key===column.key));if(!column||sorts.length>=DATA_WORKSPACE_LIMITS.sorts)return;pendingFocus.current=sorts.length;onChange([...sorts,{key:column.key,descending:false}]);}
  function remove(index:number){pendingFocus.current=index;onChange(sorts.filter((_,position)=>position!==index));}
  function move(index:number,delta:number){const next=[...sorts];[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(next);}
  return <Dialog title="Sort records" description="The first rule has highest priority. Changes are applied by your data source." trigger={<Button variant="secondary" size="sm" leadingIcon={ArrowUpDown} disabled={disabled||!available.length}>Sort{sorts.length?' · '+sorts.length:''}</Button>}>
    <div className="bui-data-grid-settings">
      {!sorts.length&&<p className="bui-hint">No sort rules yet. Add a column to choose the reading order.</p>}
      <div className="bui-data-grid-sort-settings">{sorts.map((sort,index)=><fieldset key={index}><legend>Sort {index+1}</legend><div className="bui-data-grid-sort-fields">
        <Select label={'Sort column '+(index+1)} disabled={disabled} value={sort.key} density="compact" inputRef={node=>{if(node)fields.current.set(index,node);else fields.current.delete(index);}} options={available.filter(column=>column.key===sort.key||!sorts.some(item=>item.key===column.key)).map(column=>({value:column.key,label:column.label}))} onValueChange={value=>{if(value)onChange(sorts.map((item,position)=>position===index?{...item,key:value}:item));}}/>
        <Select label={'Sort direction '+(index+1)} disabled={disabled} value={sort.descending?'descending':'ascending'} density="compact" options={[{value:'ascending',label:'Ascending'},{value:'descending',label:'Descending'}]} onValueChange={value=>{if(value)onChange(sorts.map((item,position)=>position===index?{...item,descending:value==='descending'}:item));}}/>
        <div className="bui-data-grid-settings-actions"><Button variant="ghost" size="sm" className="bui-icon-button" aria-label={'Raise sort priority '+(index+1)} disabled={disabled||index===0} onClick={()=>move(index,-1)}><Icon icon={ArrowUp} size={16}/></Button><Button variant="ghost" size="sm" className="bui-icon-button" aria-label={'Lower sort priority '+(index+1)} disabled={disabled||index===sorts.length-1} onClick={()=>move(index,1)}><Icon icon={ArrowDown} size={16}/></Button><Button variant="ghost" size="sm" className="bui-icon-button" aria-label={'Remove sort '+(index+1)} disabled={disabled} onClick={()=>remove(index)}><Icon icon={X} size={16}/></Button></div>
      </div></fieldset>)}</div>
      <div className="bui-data-grid-settings-footer"><Button ref={addButton} variant="secondary" size="sm" leadingIcon={Plus} onClick={add} disabled={disabled||sorts.length>=DATA_WORKSPACE_LIMITS.sorts||sorts.length>=available.length}>Add sort</Button><Button variant="ghost" size="sm" disabled={disabled||!sorts.length} onClick={()=>{pendingFocus.current=-1;onChange([]);}}>Clear sorting</Button><span className="bui-hint">Up to {DATA_WORKSPACE_LIMITS.sorts} ordered rules.</span></div>
    </div>
  </Dialog>;
}
