/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from 'react';
import { Alert } from './core.js';

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export interface FormResult<T> { values?:T; fieldErrors?:FormErrors<T>; error?:string }
export interface FormOptions<T> {
  initialValues:T;
  validate?:(values:T, context:{signal:AbortSignal})=>FormErrors<T>|Promise<FormErrors<T>>;
  onSubmit:(values:T, context:{signal:AbortSignal})=>Promise<FormResult<T>|void>;
  onSuccess?:(values:T)=>void;
}
/** A small form state adapter. Validation and persistence stay with the application. */
export function useForm<T extends object>({initialValues,validate,onSubmit,onSuccess}:FormOptions<T>) {
  const [values,setValues]=useState(initialValues);const [baseline,setBaseline]=useState(initialValues);
  const [errors,setErrors]=useState<FormErrors<T>>({});const [error,setError]=useState('');
  const [pending,setPending]=useState(false);const [saved,setSaved]=useState(false);
  const formRef=useRef<HTMLFormElement>(null);const request=useRef<AbortController|null>(null);
  const dirty=JSON.stringify(values)!==JSON.stringify(baseline);
  useEffect(()=>()=>request.current?.abort(),[]);
  function focusError(next:FormErrors<T>) {const name=Object.keys(next).find(key=>next[key as keyof T]);if(name) requestAnimationFrame(()=>formRef.current?.querySelector<HTMLElement>(`[data-field-name="${CSS.escape(name)}"], [name="${CSS.escape(name)}"]:not([type="hidden"])`)?.focus());}
  function setField<K extends keyof T>(key:K,value:T[K]) {if(request.current)return;setValues(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:undefined}));setError('');setSaved(false);}
  function reset(next:T=baseline) {request.current?.abort();request.current=null;setPending(false);setValues(next);setBaseline(next);setErrors({});setError('');setSaved(false);}
  async function submit(event?:FormEvent) {
    event?.preventDefault();if(request.current)return false;
    const controller=new AbortController();request.current=controller;setPending(true);setError('');setSaved(false);
    try {
      const invalid=await validate?.(values,{signal:controller.signal}) ?? {};
      if(controller.signal.aborted)return false;
      setErrors(invalid);if(Object.values(invalid).some(Boolean)){focusError(invalid);return false;}
      const result=await onSubmit(values,{signal:controller.signal});
      if(controller.signal.aborted)return false;
      if(result?.error || Object.values(result?.fieldErrors ?? {}).some(Boolean)){setErrors(result?.fieldErrors ?? {});setError(result?.error ?? 'Check the highlighted fields.');focusError(result?.fieldErrors ?? {});return false;}
      const next=result?.values ?? values;setValues(next);setBaseline(next);setSaved(true);onSuccess?.(next);return true;
    } catch(cause) {if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Unable to save. Try again.');return false;}
    finally {if(request.current===controller){request.current=null;setPending(false);}}
  }
  return {values,errors,error,pending,saved,dirty,setField,reset,submit,formRef};
}
export function useUnsavedChanges(dirty:boolean) {
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
}
export interface FormErrorSummaryProps {
  error?:string;errors?:Record<string,string|undefined>;
  /** Map error keys to stable visible-control IDs. Named native controls also resolve automatically. */
  fieldIds?:Record<string,string>;fieldLabels?:Record<string,string>;
  /** Scope named-control lookup to this native form, including externally associated inputs. */
  formId?:string;
  /** Optional application-owned focus (for example React Hook Form setFocus). */
  onFocusField?:(name:string)=>void;
}
export function FormErrorSummary({error,errors,fieldIds,fieldLabels,formId,onFocusField}:FormErrorSummaryProps) {
  const messages=Object.entries(errors??{}).filter((entry):entry is [string,string]=>!!entry[1]);
  return error||messages.length?<div className="bui-form-error-summary"><Alert title={error||'Check the highlighted fields.'} tone="danger" live>{messages.length>0&&<ul>{messages.map(([name,message])=><li key={name}><a href={'#'+encodeURIComponent(fieldIds?.[name]??name)} onClick={event=>{
    event.preventDefault();if(onFocusField){onFocusField(name);return;}
    const document=event.currentTarget.ownerDocument,owner=formId?document.getElementById(formId):event.currentTarget.closest('form');
    const explicit=fieldIds?.[name]?document.getElementById(fieldIds[name]):null;
    const named=Array.from(document.querySelectorAll<HTMLElement>('[name], [data-field-name]')).find(node=>{
      if(node.getAttribute('name')!==name&&node.getAttribute('data-field-name')!==name)return false;
      if(node.matches('[type="hidden"], :disabled, [aria-disabled="true"]'))return false;
      return !owner||('form' in node?(node as HTMLInputElement).form===owner:owner.contains(node));
    });
    const target=explicit??named;if(target instanceof HTMLElement&&!target.matches(':disabled,[type="hidden"]')){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});}
  }}>{fieldLabels?.[name]?fieldLabels[name]+': ':''}{message}</a></li>)}</ul>}</Alert></div>:null;
}
export function Form<T extends object>({form,children,...props}:Omit<ComponentProps<'form'>,'onSubmit'|'ref'> & {form:ReturnType<typeof useForm<T>>}) {
  return <form {...props} ref={form.formRef} noValidate aria-busy={form.pending || undefined} onSubmit={form.submit}>{children}</form>;
}
