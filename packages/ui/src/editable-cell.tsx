'use client';
import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Button, Input } from './core.js';
import { Select } from './controls.js';

export interface EditableCellProps {
  label: string;
  value: string;
  display?: ReactNode;
  type?: 'text' | 'date';
  options?: {value:string;label:string}[];
  validate?: (value:string) => string | undefined;
  onSave: (value:string, context:{signal:AbortSignal;originalValue:string;revision?:string|number}) => Promise<void>;
  disabled?: boolean;
  revision?:string|number;
}

/** Editable values with keyboard activation, validation and recoverable saves. */
export function EditableCell({label, value, display, type='text', options, validate, onSave, disabled, revision}:EditableCellProps) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(value);
  const [error,setError]=useState('');
  const [pending,setPending]=useState(false);
  const original=useRef({value,revision});
  const id=useId();const field=useRef<HTMLInputElement|HTMLButtonElement|null>(null);
  const trigger=useRef<HTMLButtonElement>(null);const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
  useEffect(()=>{if(editing && !pending)field.current?.focus();},[editing,pending,error]);
  function close(){if(request.current)return;setEditing(false);setError('');requestAnimationFrame(()=>trigger.current?.focus());}
  async function save(){
    if(request.current)return;
    const invalid=validate?.(draft);if(invalid){setError(invalid);field.current?.focus();return;}
    if(draft===original.current.value){close();return;}
    const controller=new AbortController();request.current=controller;setPending(true);setError('');
    try{await onSave(draft,{signal:controller.signal,originalValue:original.current.value,revision:original.current.revision});if(controller.signal.aborted)return;setEditing(false);requestAnimationFrame(()=>trigger.current?.focus());}
    catch(cause){if(!controller.signal.aborted){setError(cause instanceof Error?cause.message:'Unable to save. Try again.');field.current?.focus();}}
    finally{if(request.current===controller){request.current=null;setPending(false);}}
  }
  const begin=()=>{original.current={value,revision};setDraft(value);setError('');setEditing(true);};
  if(!editing)return <div className="bui-editable-cell"><button ref={trigger} type="button" className="bui-cell-value" aria-label={'Edit '+label} aria-describedby={id+'-help'} aria-keyshortcuts="Enter F2" title={'Edit '+label} disabled={disabled} onClick={begin} onKeyDown={event=>{if(event.key==='F2'){event.preventDefault();begin();}}}><span>{display ?? value}</span></button><span id={id+'-help'} className="bui-sr-only">Press Enter or F2 to edit. Use Save to keep the change, or Escape to cancel.</span></div>;
  const attributes={id, 'aria-label':label, 'aria-invalid':!!error || undefined, 'aria-describedby':error?id+'-error':undefined, disabled:pending, value:draft, onChange:(event:ChangeEvent<HTMLInputElement>)=>{setDraft(event.target.value);setError('');}};
  return <div className="bui-cell-editor" onKeyDown={event=>{if(event.defaultPrevented)return;if(event.key==='Escape'){if(options && field.current?.getAttribute('aria-expanded')==='true')return;event.preventDefault();event.stopPropagation();close();}if(event.key==='Enter' && !options && event.target===field.current){event.preventDefault();void save();}}}>
    <div className="bui-cell-editor-controls">{options?<Select label={label} labelVisibility="hidden" density="compact" value={draft} options={options} disabled={pending} inputRef={node=>{field.current=node;}} error={error || undefined} onValueChange={value=>{setDraft(value ?? '');setError('');}} />:<Input {...attributes} ref={node=>{field.current=node;}} type={type} density="compact" />}
      <Button size="sm" variant="ghost" aria-label={'Save '+label} leadingIcon={Check} loading={pending} onClick={()=>void save()}>Save</Button><Button size="sm" variant="ghost" aria-label={'Cancel editing '+label} disabled={pending} leadingIcon={X} onClick={close}>Cancel</Button>
    </div>{error && !options && <p id={id+'-error'} className="bui-error" role="alert">{error}</p>}<span className="bui-sr-only" role="status">{pending?'Saving '+label+'…':''}</span>
  </div>;
}
