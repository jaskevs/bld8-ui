/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId,useRef,useState,type FocusEventHandler,type Ref} from 'react';
import {Star} from 'lucide-react';
import {Button} from './core.js';
import {useChoiceValue} from './choice-option.js';
import {useUIConfig} from './ui-config.js';
export interface RatingProps {label:string;value?:number|null;defaultValue?:number|null;onValueChange?:(value:number|null)=>void;max?:number;step?:1|0.5;name?:string;form?:string;required?:boolean;disabled?:boolean;readOnly?:boolean;clearable?:boolean;hint?:string;error?:string;className?:string;inputRef?:Ref<HTMLInputElement>;onBlur?:FocusEventHandler<HTMLInputElement>}
/** Native radio values, fractional hit areas and an explicit keyboard path. */
export function Rating({label,value,defaultValue=null,onValueChange,max=5,step=1,name,form,required=false,disabled=false,readOnly=false,clearable=true,hint,error,className,inputRef,onBlur}:RatingProps){
 if(!Number.isInteger(max)||max<1||max>10||![1,.5].includes(step))throw Error('Rating supports 1–10 stars and steps of 1 or 0.5.');
 const ui=useUIConfig(),id=useId(),root=useRef<HTMLDivElement>(null),[selected,setSelected]=useChoiceValue(value,defaultValue,onValueChange,root,form),[preview,setPreview]=useState<number|null>(null),refs=useRef(new Map<number,HTMLInputElement>()),normal=selected===null||Number.isFinite(selected)&&selected>=step&&selected<=max&&Number.isInteger(selected/step)?selected:null,current=preview??normal??0,points=Array.from({length:max/step},(_,index)=>(index+1)*step),description=hint||error?id+'-help':undefined;
 const accessible=(point:number)=>new Intl.NumberFormat(ui.locale).format(point)+' of '+max+' stars';
 return <div ref={root} className={['bui-field','bui-rating',className].filter(Boolean).join(' ')} dir={ui.direction} data-disabled={disabled||undefined}>
  <span className="bui-label" id={id+'-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</span><div className="bui-rating-line"><div role="radiogroup" aria-labelledby={id+'-label'} aria-describedby={description} aria-readonly={readOnly||undefined} aria-disabled={disabled||undefined} aria-invalid={!!error||undefined} className="bui-rating-control" style={{'--bui-rating-max':max,'--bui-rating-step':step} as React.CSSProperties} onPointerLeave={()=>setPreview(null)}>
   <div className="bui-rating-stars" aria-hidden="true">{Array.from({length:max},(_,index)=><span key={index} className="bui-rating-star"><Star size={28} strokeWidth={1.5}/><span style={{clipPath:`inset(0 ${100-Math.max(0,Math.min(1,current-index))*100}% 0 0)`}}><Star size={28} fill="currentColor" strokeWidth={1.5}/></span></span>)}</div>
   {points.map((point,index)=><label key={point} className="bui-rating-hit" onPointerEnter={()=>{if(!disabled&&!readOnly)setPreview(point);}}><input ref={node=>{if(node)refs.current.set(point,node);else refs.current.delete(point);if(point===(normal??step)){if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}}} type="radio" name={name??id} form={form} value={point} checked={normal===point} disabled={disabled} required={required&&!readOnly} aria-label={accessible(point)} aria-describedby={description} onBlur={onBlur} tabIndex={point===(normal??step)?0:-1} className="bui-rating-native" onClick={event=>{if(readOnly)event.preventDefault();}} onChange={()=>{if(!readOnly&&!disabled){setPreview(null);setSelected(point);}}} onKeyDown={event=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();if(readOnly||disabled)return;const forward=event.key==='ArrowUp'||event.key===(ui.direction==='rtl'?'ArrowLeft':'ArrowRight'),next=event.key==='Home'?points[0]:event.key==='End'?points[points.length-1]:points[Math.max(0,Math.min(points.length-1,index+(forward?1:-1)))];setPreview(null);setSelected(next);refs.current.get(next)?.focus({preventScroll:true});}}/><span className="bui-sr-only">{accessible(point)}</span></label>)}
  </div><span className="bui-rating-value" aria-hidden="true">{normal===null?'Not rated':normal+' / '+max}</span>{clearable&&<Button size="sm" variant="ghost" disabled={disabled||readOnly||normal===null} onClick={()=>{setSelected(null);setPreview(null);refs.current.get(step)?.focus({preventScroll:true});}}>Clear rating</Button>}</div>
  {(hint||error)&&<p id={id+'-help'} className={error?'bui-error':'bui-hint'} role={error?'alert':undefined}>{error||hint}</p>}
 </div>;
}
