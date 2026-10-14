'use client';
import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Button, Input } from './core.js';

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

/** An explicit edit action with validation and recoverable async saves. */
export function EditableCell({label, value, display, type='text', options, validate, onSave, disabled, revision}:EditableCellProps) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(value);
  const [error,setError]=useState('');
  const [pending,setPending]=useState(false);
  const original=useRef({value,revision});
  const id=useId();const field=useRef<HTMLInputElement|HTMLSelectElement|null>(null);
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
  if(!editing)return <div className="bui-editable-cell"><span>{display ?? value}</span><Button ref={trigger} variant="ghost" size="sm" className="bui-editable-trigger" aria-label={'Edit '+label} disabled={disabled} leadingIcon={Pencil} onClick={()=>{original.current={value,revision};setDraft(value);setError('');setEditing(true);}}>Edit</Button></div>;
  const attributes={id, 'aria-label':label, 'aria-invalid':!!error || undefined, 'aria-describedby':error?id+'-error':undefined, disabled:pending, value:draft, onChange:(event:ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{setDraft(event.target.value);setError('');}};
  return <div className="bui-cell-editor" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}if(event.key==='Enter' && event.target===field.current){event.preventDefault();void save();}}}>
    <div className="bui-cell-editor-controls">{options?<select {...attributes} ref={node=>{field.current=node;}} className="bui-input">{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<Input {...attributes} ref={node=>{field.current=node;}} type={type} density="compact" />}
      <Button size="sm" variant="ghost" aria-label={'Save '+label} leadingIcon={Check} loading={pending} onClick={()=>void save()}>Save</Button><Button size="sm" variant="ghost" aria-label={'Cancel editing '+label} disabled={pending} leadingIcon={X} onClick={close}>Cancel</Button>
    </div>{error && <p id={id+'-error'} className="bui-error" role="alert">{error}</p>}<span className="bui-sr-only" role="status">{pending?'Saving '+label+'…':''}</span>
  </div>;
}
