/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useId,useRef,type FocusEventHandler,type Ref} from 'react';
import {Checkbox,type Option} from './core.js';
import {Fieldset} from './fieldset.js';
import {useChoiceValue} from './choice-option.js';

export interface CheckboxGroupProps {
  label:string;options:readonly Option[];
  value?:readonly string[];defaultValue?:readonly string[];onValueChange?:(value:string[])=>void;
  name?:string;form?:string;id?:string;hint?:string;error?:string;
  disabled?:boolean;readOnly?:boolean;required?:boolean;
  /** Bounds apply to enabled submitted choices. Required sets a minimum of one. */
  minSelected?:number;maxSelected?:number;
  inputRef?:Ref<HTMLInputElement>;onBlur?:FocusEventHandler<HTMLInputElement>;
  className?:string;
}
function assign(ref:Ref<HTMLInputElement>|undefined,node:HTMLInputElement|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
/** A named native checkbox collection. Disabled choices are excluded from submission and bounds. */
export function CheckboxGroup({label,options,value,defaultValue=[],onValueChange,name,form,id:suppliedId,hint,error,disabled=false,readOnly=false,required=false,minSelected=0,maxSelected,inputRef,onBlur,className}:CheckboxGroupProps){
  const generated=useId(),id=suppliedId||generated,owner=useRef<HTMLDivElement>(null),validation=useRef<HTMLInputElement|null>(null);
  const [selected,setSelected]=useChoiceValue<readonly string[]>(value,defaultValue,onValueChange?next=>onValueChange([...next]):undefined,owner,form);
  const seen=new Set<string>(),choices=options.filter(option=>option.value&&!seen.has(option.value)&&!!seen.add(option.value));
  const values=new Set(selected),enabled=choices.filter(option=>!option.disabled),first=enabled[0]?.value;
  const min=Math.max(required?1:0,Number.isFinite(minSelected)?Math.max(0,Math.floor(minSelected)):0);
  const max=maxSelected===undefined||!Number.isFinite(maxSelected)?Infinity:Math.max(min,Math.floor(maxSelected));
  const count=enabled.filter(option=>values.has(option.value)).length;
  const validity=!disabled&&(count<min?'Choose at least '+min+' '+(min===1?'option.':'options.'):count>max?'Choose no more than '+max+' '+(max===1?'option.':'options.'):'');
  const validityRef=useRef(validity);validityRef.current=validity;
  const attach=useCallback((node:HTMLInputElement|null)=>{const previous=validation.current;if(previous&&previous!==node)previous.setCustomValidity('');validation.current=node;if(node)node.setCustomValidity(validityRef.current||'');assign(inputRef,node);},[inputRef]);
  useEffect(()=>{validation.current?.setCustomValidity(validity||'');},[validity,first]);
  const description=[hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  return <div ref={owner} className="bui-checkbox-group" data-readonly={readOnly||undefined}>
    <Fieldset legend={<>{label}{required&&<><span aria-hidden="true"> *</span><span className="bui-sr-only"> (required)</span></>}</>} id={id} hint={hint} error={error} disabled={disabled} className={className}>
      {choices.map(option=><Checkbox key={option.value} label={option.label} hint={option.description} name={name} form={form} value={option.value} checked={values.has(option.value)} disabled={option.disabled} inputRef={option.value===first?attach:undefined} readOnly={readOnly} aria-readonly={readOnly||undefined} aria-invalid={!!error||!!validity||undefined} aria-describedby={description} onBlur={onBlur}
        onClick={event=>{if(readOnly)event.preventDefault();}}
        onKeyDown={event=>{if(readOnly&&event.key===' ')event.preventDefault();}}
        onCheckedChange={checked=>{if(disabled||readOnly||option.disabled)return;const next=new Set(selected);if(checked)next.add(option.value);else next.delete(option.value);setSelected([...next]);}}/>) }
    </Fieldset>
  </div>;
}
