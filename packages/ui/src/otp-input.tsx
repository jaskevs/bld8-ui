/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState,type ComponentProps,type CSSProperties,type Ref} from 'react';
import {cx} from './core.js';

export interface OTPInputProps extends Omit<ComponentProps<'input'>,'value'|'defaultValue'|'type'|'maxLength'|'size'> {
  label:string;length?:number;value?:string;defaultValue?:string;
  onValueChange?:(value:string)=>void;
  /** Called when a user edit produces a complete code; this does not verify it. */
  onComplete?:(value:string)=>void;
  digitsOnly?:boolean;hint?:string;error?:string;inputRef?:Ref<HTMLInputElement>;
  /** Optional decorative progress slots; editing always stays in one native input. */
  showSlots?:boolean;
}
function assign(ref:Ref<HTMLInputElement>|undefined,node:HTMLInputElement|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
export function OTPInput({label,length=6,value,defaultValue='',onValueChange,onComplete,digitsOnly=true,hint,error,inputRef,ref,showSlots=false,id:suppliedId,className,onChange,onPaste,autoComplete='one-time-code',inputMode,pattern,style,...props}:OTPInputProps){
  const generated=useId(),id=suppliedId||generated,node=useRef<HTMLInputElement|null>(null),selection=useRef<number|null>(null);
  if(!Number.isInteger(length)||length<1||length>12)throw new RangeError('OTPInput length must be an integer from 1 to 12.');
  const clean=(text:string)=>text.normalize('NFKC').replace(digitsOnly?/[^0-9]/g:/[^a-zA-Z0-9]/g,'').slice(0,length);
  const [internal,setInternal]=useState(()=>clean(defaultValue)),current=clean(value??internal);
  const initial=useRef(internal);
  useEffect(()=>{const owner=node.current?.form;if(!owner||value!==undefined)return;const reset=(event:Event)=>queueMicrotask(()=>{if(!event.defaultPrevented)setInternal(initial.current);});owner.addEventListener('reset',reset);return()=>owner.removeEventListener('reset',reset);},[props.form,value]);
  const attach=useCallback((input:HTMLInputElement|null)=>{node.current=input;assign(ref,input);assign(inputRef,input);},[ref,inputRef]);
  useLayoutEffect(()=>{if(selection.current!==null&&node.current){node.current.setSelectionRange(selection.current,selection.current);selection.current=null;}},[current]);
  function update(raw:string,position:number|null){const next=clean(raw);selection.current=position===null?null:clean(raw.slice(0,position)).length;if(value===undefined)setInternal(next);if(next!==current){onValueChange?.(next);if(next.length===length)onComplete?.(next);}return next;}
  return <div className="bui-field bui-otp" style={{'--bui-otp-length':length} as CSSProperties}><label className="bui-label" htmlFor={id}>{label}{props.required&&<span aria-hidden="true"> *</span>}</label><input {...props} ref={attach} id={id} style={style} type="text" autoComplete={autoComplete} inputMode={inputMode??(digitsOnly?'numeric':'text')} pattern={pattern??(digitsOnly?'[0-9]{'+length+'}':'[a-zA-Z0-9]{'+length+'}')} minLength={length} value={current} spellCheck={false} autoCapitalize="off" className={cx('bui-input','bui-otp-input',className)} aria-invalid={error?true:props['aria-invalid']} aria-describedby={[hint&&id+'-hint',error&&id+'-error',props['aria-describedby']].filter(Boolean).join(' ')||undefined} onPaste={onPaste} onChange={event=>{
    const input=event.currentTarget,next=update(input.value,input.selectionStart);
    // Preserve native paste/selection events and expose the same canonical value
    // through both onChange and onValueChange. Raw maxlength would cut formatted
    // clipboard content before it can be normalised.
    if(input.value!==next){input.value=next;if(selection.current!==null){input.setSelectionRange(selection.current,selection.current);selection.current=null;}}
    onChange?.(event);
  }}/>
    {showSlots&&<div className="bui-otp-slots" aria-hidden="true">{Array.from({length},(_,index)=><span key={index} data-filled={index<current.length||undefined}/>)}</div>}
    {hint&&<p className="bui-hint" id={id+'-hint'}>{hint}</p>}{error&&<p className="bui-error" id={id+'-error'} role="alert">{error}</p>}
  </div>;
}
