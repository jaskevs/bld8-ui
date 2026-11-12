/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useRef,useState,type ReactElement,type ReactNode} from 'react';
import {AlertDialog as PrimitiveAlertDialog} from '@base-ui/react/alert-dialog';
import {TriangleAlert} from 'lucide-react';
import {Button,Icon,cx} from './core.js';

export interface AlertDialogConfirmContext {
  /** Aborted on Cancel, Escape, external close, resetKey change or unmount.
   * The host must honour this signal where possible; abort is not server rollback.
   */
  signal:AbortSignal;
  /** One-based attempt within the current open/reset session. */
  attempt:number;
}
export interface AlertDialogRenderContext {pending:boolean;error:string|null;attempt:number;clearError:()=>void}
export interface AlertDialogProps {
  trigger?:ReactElement;
  title:string;
  description:ReactNode;
  confirmLabel:string;
  cancelLabel?:string;
  pendingLabel?:string;
  destructive?:boolean;
  confirmDisabled?:boolean;
  open?:boolean;
  defaultOpen?:boolean;
  onOpenChange?:(open:boolean)=>void;
  onOpenChangeComplete?:(open:boolean)=>void;
  /** A successful return closes the dialog. Throw/reject to retain it with retry.
   * Without a callback, Confirm only acknowledges and closes the dialog.
   */
  onConfirm?:(context:AlertDialogConfirmContext)=>void|Promise<void>;
  onCancel?:()=>void;
  /** Change when the confirmation target/session changes to abort and reset it. */
  resetKey?:unknown;
  errorMessage?:(error:unknown)=>string;
  children?:ReactNode|((context:AlertDialogRenderContext)=>ReactNode);
  finalFocus?:PrimitiveAlertDialog.Popup.Props['finalFocus'];
  className?:string;
}
interface Confirmation {controller:AbortController;attempt:number;resetKey:unknown}
/** An explicit confirmation with Cancel-first focus, abortable host work and retry.
 * Base UI supplies alertdialog semantics, modal focus containment, Escape and focus
 * return. Outside pointer presses do not dismiss this alert dialog.
 */
export function AlertDialog({trigger,title,description,confirmLabel,cancelLabel='Cancel',pendingLabel='Working…',destructive=false,confirmDisabled=false,open,defaultOpen=false,onOpenChange,onOpenChangeComplete,onConfirm,onCancel,resetKey,errorMessage,children,finalFocus,className}:AlertDialogProps) {
  const [internalOpen,setInternalOpen]=useState(defaultOpen),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
  const isOpen=open??internalOpen,cancel=useRef<HTMLButtonElement>(null),confirm=useRef<HTMLButtonElement>(null),active=useRef<Confirmation|null>(null),attempts=useRef(0),mounted=useRef(true);
  const latest=useRef({isOpen,resetKey});latest.current={isOpen,resetKey};
  const abort=()=>{active.current?.controller.abort();active.current=null;};
  const reset=()=>{abort();attempts.current=0;setPending(false);setError(null);setAttempt(0);};
  useEffect(()=>{reset();},[isOpen,resetKey]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;abort();};},[]);
  useEffect(()=>{
    if(pending)cancel.current?.focus();
    else if(error)(confirm.current?.disabled?cancel.current:confirm.current)?.focus();
  },[pending,error]);
  const changeOpen=(next:boolean)=>{if(!next)reset();if(open===undefined)setInternalOpen(next);onOpenChange?.(next);};
  const runConfirm=async()=>{
    if(active.current||confirmDisabled||!latest.current.isOpen)return;
    const task:Confirmation={controller:new AbortController(),attempt:++attempts.current,resetKey};
    active.current=task;setPending(true);setError(null);setAttempt(task.attempt);
    const current=()=>mounted.current&&active.current===task&&!task.controller.signal.aborted&&latest.current.isOpen&&Object.is(latest.current.resetKey,task.resetKey);
    try {
      await onConfirm?.({signal:task.controller.signal,attempt:task.attempt});
      if(!current())return;
      active.current=null;setPending(false);changeOpen(false);
    } catch(problem) {
      if(!current())return;
      active.current=null;setPending(false);
      let message='The action could not be completed. Try again.';
      try{message=errorMessage?.(problem)||message;}catch{/* Retain a usable recovery message if formatting fails. */}
      setError(message);
    }
  };
  return <PrimitiveAlertDialog.Root open={isOpen} onOpenChange={(next)=>{changeOpen(next);if(!next)onCancel?.();}} onOpenChangeComplete={onOpenChangeComplete}>
    {trigger&&<PrimitiveAlertDialog.Trigger render={trigger}/>}
    <PrimitiveAlertDialog.Portal>
      <PrimitiveAlertDialog.Backdrop className="bui-alert-dialog-backdrop"/>
      <PrimitiveAlertDialog.Popup className={cx('bui-alert-dialog',className)} initialFocus={cancel} finalFocus={finalFocus} aria-busy={pending||undefined}>
        <div className="bui-alert-dialog-heading"><span className="bui-alert-dialog-mark" data-destructive={destructive||undefined} aria-hidden="true"><Icon icon={TriangleAlert} size={21}/></span><div><PrimitiveAlertDialog.Title className="bui-alert-dialog-title">{title}</PrimitiveAlertDialog.Title><PrimitiveAlertDialog.Description className="bui-alert-dialog-description">{description}</PrimitiveAlertDialog.Description></div></div>
        {children&&<div className="bui-alert-dialog-body">{typeof children==='function'?children({pending,error,attempt,clearError:()=>setError(null)}):children}</div>}
        <div className="bui-alert-dialog-feedback">{error&&<p className="bui-alert-dialog-error" role="alert">{error}</p>}{pending&&<p className="bui-alert-dialog-status" role="status">{pendingLabel} You can cancel this request.</p>}</div>
        <div className="bui-alert-dialog-actions"><PrimitiveAlertDialog.Close render={<Button ref={cancel} variant="secondary">{cancelLabel}</Button>}/><Button ref={confirm} variant={destructive?'danger':'primary'} disabled={confirmDisabled} loading={pending} onClick={()=>{void runConfirm();}}>{pending?pendingLabel:confirmLabel}</Button></div>
      </PrimitiveAlertDialog.Popup>
    </PrimitiveAlertDialog.Portal>
  </PrimitiveAlertDialog.Root>;
}
