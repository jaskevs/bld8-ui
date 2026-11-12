/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {Popover} from '@base-ui/react/popover';
import {Check,ChevronDown} from 'lucide-react';
import {Button,Icon} from './core.js';
import {DatePicker,formatDateValue,parseDateValue} from './calendar.js';
import {MultiSelect} from './multi-select.js';
import {parseDataValue,type DataColumn,type DataRecord} from './data-workspace-state.js';

export interface GridRichEditResult {value:unknown;intent:'apply'|'dismiss';restoreFocus:boolean}
interface GridRichEditorProps<T extends DataRecord> {
  label:string;column:DataColumn<T>;value:unknown;active:boolean;disabled:boolean;owner:string;errorId?:string;
  onFinish:(result:GridRichEditResult)=>void;onClosed:()=>void;onOwnedFocus:(node:HTMLElement)=>void;
}
/** Default display stays presentational; focus and actions belong to the cell. */
export function GridCellValue<T extends DataRecord>({column,value}:{column:DataColumn<T>;value:unknown}):ReactNode {
  if(column.type==='boolean'&&typeof value==='boolean')return <><span className="bui-data-grid-boolean" data-checked={value||undefined} aria-hidden="true">{value&&<Icon icon={Check} size={12}/>}</span><span className="bui-sr-only">{value?'Yes':'No'}</span></>;
  if(column.type==='multi-select'&&Array.isArray(value))return value.length?<span className="bui-data-grid-tags">{value.map((id,index)=><span key={String(id)+'-'+index} className="bui-data-grid-tag">{column.options?.find(option=>option.value===id)?.label??String(id)}</span>)}</span>:<span className="bui-data-grid-empty">—</span>;
  const text=column.type==='select'?column.options?.find(option=>option.value===value)?.label??String(value??''):String(value??'');
  return text||<span className="bui-data-grid-empty">—</span>;
}
/** Multi-step controls get one local buffer. Apply is the only write boundary. */
export function GridRichEditor<T extends DataRecord>({label,column,value,active,disabled,owner,errorId,onFinish,onClosed,onOwnedFocus}:GridRichEditorProps<T>) {
  const [open,setOpen]=useState(true),[draft,setDraft]=useState(value),[error,setError]=useState('');
  const draftRef=useRef(value),finished=useRef(false),input=useRef<HTMLInputElement|null>(null),[fields,setFields]=useState<HTMLDivElement|null>(null),[fieldHeight,setFieldHeight]=useState(0),maximumHeight=useRef(0);
  // Reserve height on an outer box while observing only intrinsic inner content.
  // Observer writes wait for the next frame; user edits reserve before shrinking
  // feedback so a pointer's Apply target stays in place throughout the event.
  function contentHeight(node:HTMLElement){return Math.max(0,Number.parseFloat(getComputedStyle(node).height)||node.offsetHeight);}
  function reserveFields(){if(!fields)return;maximumHeight.current=Math.max(maximumHeight.current,contentHeight(fields));setFieldHeight(height=>Math.max(height,maximumHeight.current));}
  useLayoutEffect(()=>{
    const node=fields;if(!node)return;let frame:number|null=null,alive=true;
    maximumHeight.current=Math.max(maximumHeight.current,contentHeight(node));setFieldHeight(height=>Math.max(height,maximumHeight.current));
    const observer=new ResizeObserver(()=>{const next=contentHeight(node);if(next<=maximumHeight.current)return;maximumHeight.current=next;if(frame===null)frame=requestAnimationFrame(()=>{frame=null;if(alive)setFieldHeight(height=>Math.max(height,maximumHeight.current));});});
    observer.observe(node);return()=>{alive=false;observer.disconnect();if(frame!==null)cancelAnimationFrame(frame);};
  },[fields]);
  function change(next:unknown){reserveFields();draftRef.current=next;setDraft(next);setError('');}
  function finish(result:GridRichEditResult){if(finished.current)return;finished.current=true;setOpen(false);onFinish(result);}
  function apply(){
    if(disabled||!active)return;
    if(column.type==='date'&&input.current&&!input.current.checkValidity()){setError('');input.current.focus({preventScroll:true});return;}
    const parsed=parseDataValue(column,column.type==='date'&&input.current?input.current.value:draftRef.current);
    if(parsed.error){setError(parsed.error);input.current?.focus({preventScroll:true});return;}
    finish({value:parsed.value,intent:'apply',restoreFocus:true});
  }
  function close(next:boolean,reason:string){setOpen(next);if(!next)finish({value:draftRef.current,intent:'dismiss',restoreFocus:reason!=='outside-press'&&reason!=='focus-out'&&reason!=='window-resize'});}
  // Bubble input measurements with React's change handler. Capture updates can
  // restore a controlled field's old value before its change handler reads it.
  return <Popover.Root open={active&&open&&!disabled} onOpenChange={(next,details)=>close(next,details.reason)} onOpenChangeComplete={next=>{if(!next)onClosed();}}>
    <Popover.Trigger className="bui-data-grid-choice-trigger" aria-label={label} aria-invalid={!!errorId||undefined} aria-describedby={errorId} data-grid-choice-owner={owner} data-closing={!active||undefined} tabIndex={-1}><span className="bui-data-grid-value"><GridCellValue column={column} value={draft}/></span><Icon icon={ChevronDown} size={14}/></Popover.Trigger>
    <Popover.Portal><Popover.Positioner className="bui-positioner bui-data-grid-rich-positioner" align="start" sideOffset={6} collisionPadding={12} disableAnchorTracking={!active||!open}>
      <Popover.Popup className="bui-popup bui-data-grid-rich-popup" data-grid-choice-owner={owner} initialFocus={input} finalFocus={false} onFocusCapture={event=>onOwnedFocus(event.target as HTMLElement)} onPointerDownCapture={event=>onOwnedFocus(event.target as HTMLElement)} onInput={()=>{reserveFields();if(column.type==='date')setError('');}} onKeyDown={event=>{
        if(event.defaultPrevented||!event.currentTarget.contains(event.target as Node))return;
        if(event.key==='Enter'&&event.target===input.current&&column.type==='date'){event.preventDefault();apply();}
      }}>
        <Popover.Title className="bui-data-grid-rich-title">Edit {column.label.toLowerCase()}</Popover.Title>
        <Popover.Description className="bui-hint">Apply this cell value when you are ready.</Popover.Description>
        <div className="bui-data-grid-rich-fields" style={fieldHeight?{minHeight:fieldHeight}:undefined}><div ref={setFields} className="bui-data-grid-rich-field-content">{column.type==='date'?<DatePicker label={label} value={parseDateValue(typeof draft==='string'?draft:'')} onValueChange={date=>change(formatDateValue(date??undefined))} editable clearable density="compact" textInputRef={input} onInputKeyDown={event=>{if(event.key==='Escape'&&!event.currentTarget.closest('.bui-date-picker')?.querySelector('[aria-expanded="true"]')){event.preventDefault();event.stopPropagation();finish({value:draftRef.current,intent:'dismiss',restoreFocus:true});}}} required={column.required} minDate={parseDateValue(column.minDate??'')??undefined} maxDate={parseDateValue(column.maxDate??'')??undefined} disabled={disabled}/>:<MultiSelect label={label} options={column.options??[]} value={Array.isArray(draft)?draft.filter((item):item is string=>typeof item==='string'):[]} onValueChange={change} inputRef={input} density="compact" clearable disabled={disabled} required={column.required} error={error||undefined} hint="Choose one or more, then apply the cell."/>}
        {column.type==='date'&&error&&<p role="alert" className="bui-error">{error}</p>}</div></div>
        <div className="bui-data-grid-rich-actions"><Button variant="ghost" size="sm" disabled={disabled} onClick={()=>finish({value:draftRef.current,intent:'dismiss',restoreFocus:true})}>Cancel</Button><Button size="sm" disabled={disabled} onClick={apply}>Apply changes</Button></div>
      </Popover.Popup>
    </Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
