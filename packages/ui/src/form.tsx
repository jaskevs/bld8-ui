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
  function focusError(next:FormErrors<T>) {const name=Object.keys(next).find(key=>next[key as keyof T]);if(name) requestAnimationFrame(()=>formRef.current?.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`)?.focus());}
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
export function FormErrorSummary({error,errors}:{error?:string;errors?:Record<string,string|undefined>}) {
  const messages=Object.values(errors ?? {}).filter(Boolean);
  return error || messages.length ? <Alert title={error || 'Check the highlighted fields.'} tone="danger" live>{messages.length>0 && <ul>{messages.map((message,index)=><li key={index}>{message}</li>)}</ul>}</Alert> : null;
}
export function Form<T extends object>({form,children,...props}:Omit<ComponentProps<'form'>,'onSubmit'|'ref'> & {form:ReturnType<typeof useForm<T>>}) {
  return <form {...props} ref={form.formRef} noValidate aria-busy={form.pending || undefined} onSubmit={form.submit}>{children}</form>;
}
