/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useRef,useState,type FocusEventHandler,type Ref} from 'react';
import {Slider as PrimitiveSlider} from '@base-ui/react/slider';
import {Field as PrimitiveField} from '@base-ui/react/field';
import {cx} from './core.js';

export type RangeSliderValue=[number,number];
export interface RangeSliderProps {
  label:string;
  value?:readonly [number,number];
  defaultValue?:readonly [number,number];
  onValueChange?:(value:RangeSliderValue)=>void;
  onValueCommitted?:(value:RangeSliderValue)=>void;
  min?:number;max?:number;step?:number;
  /** Minimum distance in value units, rounded up to a whole number of steps. */
  minGap?:number;
  /** Pointer collision: clamp stops the thumb; push moves its neighbour. Keyboard always preserves order and minGap. */
  crossing?:'clamp'|'push';
  /** Each thumb has its own accessible name. Defaults to Lower/Upper + label. */
  thumbLabels?:readonly [string,string];
  inputRefs?:readonly [Ref<HTMLInputElement>|undefined,Ref<HTMLInputElement>|undefined];
  onBlur?:FocusEventHandler<HTMLInputElement>;
  name?:string;form?:string;disabled?:boolean;id?:string;className?:string;
  hint?:string;error?:string;
}
/** Two native range inputs backed by Base UI keyboard, pointer and form behaviour. */
export function RangeSlider({label,value,defaultValue,onValueChange,onValueCommitted,min=0,max=100,step=1,minGap=0,crossing='clamp',thumbLabels,inputRefs,onBlur,name,form,disabled,id:suppliedId,className,hint,error}:RangeSliderProps){
  const generated=useId(),id=suppliedId||generated;
  if(!Number.isFinite(min)||!Number.isFinite(max)||!Number.isFinite(max-min)||max<=min||!Number.isFinite(step)||step<=0||!Number.isFinite(minGap)||minGap<0||minGap>max-min)throw new RangeError('RangeSlider needs finite min < max, step > 0 and minGap within the range.');
  const gapSteps=Math.ceil(minGap/step-1e-9),lastStep=Math.floor((max-min)/step+1e-9);
  if(gapSteps>lastStep)throw new RangeError('RangeSlider minGap must fit its stepped range.');
  const at=(index:number)=>Number((min+index*step).toPrecision(12));
  function normalise(input:readonly number[]):RangeSliderValue{
    const first=Number.isFinite(input[0])?input[0]:min,second=Number.isFinite(input[1])?input[1]:max;
    const points=[first,second].sort((a,b)=>a-b).map(item=>Math.max(0,Math.min(lastStep,Math.round((item-min)/step))));
    const lower=Math.min(points[0],lastStep-gapSteps),upper=Math.max(points[1],lower+gapSteps);
    return [at(lower),at(upper)];
  }
  const [internal,setInternal]=useState<RangeSliderValue>(()=>normalise(defaultValue??[min+(max-min)*.25,min+(max-min)*.75]));
  const initial=useRef(internal),root=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{const owner=root.current?.querySelector('input')?.form;if(!owner||value!==undefined)return;const reset=(event:Event)=>queueMicrotask(()=>{if(!event.defaultPrevented)setInternal(initial.current);});owner.addEventListener('reset',reset);return()=>owner.removeEventListener('reset',reset);},[form,value]);
  const current=normalise(value??internal),description=[hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  function change(next:readonly number[]){const range=normalise(next);if(value===undefined)setInternal(range);onValueChange?.(range);}
  return <PrimitiveField.Root invalid={!!error}><PrimitiveSlider.Root ref={root} className={cx('bui-field','bui-range-slider',className)} id={id} name={name} form={form} min={min} max={max} step={step} minStepsBetweenValues={gapSteps} thumbCollisionBehavior={crossing==='push'?'push':'none'} thumbAlignment="center" disabled={disabled} value={current} onValueChange={change} onValueCommitted={next=>onValueCommitted?.(normalise(next))}>
    <div className="bui-between"><PrimitiveSlider.Label className="bui-label">{label}</PrimitiveSlider.Label><output className="bui-range-value" aria-hidden="true">{current[0]} – {current[1]}</output></div>
    <PrimitiveSlider.Control className="bui-range-control"><PrimitiveSlider.Track className="bui-range-track"><PrimitiveSlider.Indicator className="bui-range-indicator"/>{[0,1].map(index=><PrimitiveSlider.Thumb className="bui-range-thumb" key={index} index={index} inputRef={inputRefs?.[index]} aria-label={thumbLabels?.[index]??(index?'Upper ':'Lower ')+label} aria-describedby={description} aria-invalid={!!error||undefined} onBlur={onBlur}/>)}</PrimitiveSlider.Track></PrimitiveSlider.Control>
    {hint&&<p className="bui-hint" id={id+'-hint'}>{hint}</p>}{error&&<p className="bui-error" id={id+'-error'} role="alert">{error}</p>}
  </PrimitiveSlider.Root></PrimitiveField.Root>;
}
