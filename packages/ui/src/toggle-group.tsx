'use client';
import {useEffect,useId,useImperativeHandle,useRef,useState,type FocusEventHandler,type Ref} from 'react';
import {ToggleGroup as PrimitiveGroup} from '@base-ui/react/toggle-group';
import {Toggle as PrimitiveToggle} from '@base-ui/react/toggle';
import type {LucideIcon} from 'lucide-react';
import {Icon} from './icons.js';

export interface ToggleOption {value:string;label:string;disabled?:boolean;icon?:LucideIcon}
export interface ToggleGroupProps {
  label:string;options:readonly ToggleOption[];value?:readonly string[];defaultValue?:readonly string[];onValueChange?:(value:string[])=>void;
  multiple?:boolean;orientation?:'horizontal'|'vertical';loopFocus?:boolean;disabled?:boolean;required?:boolean;
  id?:string;name?:string;form?:string;hint?:string;error?:string;inputRef?:Ref<HTMLButtonElement>;onBlur?:FocusEventHandler<HTMLDivElement>;
}
/** Single and multiple selection both use arrays; an empty array means no pressed choices. */
export function ToggleGroup({label,options,value,defaultValue=[],onValueChange,multiple=false,orientation='horizontal',loopFocus=true,disabled=false,required=false,id:suppliedId,name,form,hint,error,inputRef,onBlur}:ToggleGroupProps) {
  const generated=useId(),id=suppliedId??generated,[internal,setInternal]=useState<readonly string[]>(defaultValue),[invalid,setInvalid]=useState(false);
  const group=useRef<HTMLDivElement>(null),first=useRef<HTMLButtonElement>(null),validation=useRef<HTMLInputElement>(null),defaults=useRef(defaultValue);defaults.current=defaultValue;
  const unique=options.filter((option,index)=>options.findIndex(candidate=>candidate.value===option.value)===index);
  const current=[...new Set(value??internal)].filter(item=>unique.some(option=>option.value===item)).slice(0,multiple?undefined:1);
  const problem=error||(invalid&&required&&!current.length?'Choose at least one option.':undefined),describedBy=[hint&&id+'-hint',problem&&id+'-error'].filter(Boolean).join(' ')||undefined;
  useImperativeHandle(inputRef,()=>first.current!);
  useEffect(()=>{const target=validation.current?.form;if(!target)return;const reset=()=>{if(value===undefined)setInternal(defaults.current);setInvalid(false);};target.addEventListener('reset',reset);return()=>target.removeEventListener('reset',reset);},[value===undefined,form]);
  return <div className="bui-toggle-field"><span id={id+'-label'} className="bui-label">{label}{required&&<><span aria-hidden="true"> *</span><span className="bui-sr-only"> (required)</span></>}</span>
    <PrimitiveGroup ref={group} id={id} className="bui-toggle-group" value={current} onValueChange={next=>{if(value===undefined)setInternal(next);setInvalid(false);onValueChange?.(next);}} multiple={multiple} orientation={orientation} loopFocus={loopFocus} disabled={disabled} aria-labelledby={id+'-label'} aria-describedby={describedBy} aria-invalid={!!problem||undefined} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))onBlur?.(event);}}>
      {unique.map(option=><PrimitiveToggle key={option.value} ref={option===unique.find(item=>!item.disabled)?first:undefined} type="button" value={option.value} disabled={option.disabled} className="bui-toggle-button">{option.icon&&<Icon icon={option.icon} size={16}/>}<span>{option.label}</span></PrimitiveToggle>)}
    </PrimitiveGroup>
    {name&&current.map(item=><input key={item} type="hidden" name={name} form={form} value={item} disabled={disabled}/>)}
    <input ref={validation} className="bui-sr-only" aria-hidden="true" tabIndex={-1} type="text" form={form} required={required} disabled={disabled} value={current.length?'selected':''} onChange={()=>{}} onInvalid={event=>{event.preventDefault();setInvalid(true);first.current?.focus();}}/>
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{problem&&<p id={id+'-error'} className="bui-error" role="alert">{problem}</p>}
  </div>;
}
