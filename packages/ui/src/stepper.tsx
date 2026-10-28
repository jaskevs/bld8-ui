'use client';
import {AnimatePresence,motion} from 'motion/react';
import {Check} from 'lucide-react';
import {useReducedMotionPreference} from './motion-preference.js';
export interface StepperStep { value:string; label:string; description?:string; disabled?:boolean }
export interface StepperProps {
  label:string; steps:readonly StepperStep[]; value:string; completed?:readonly string[];
  onValueChange?:(value:string)=>void; disabled?:boolean; orientation?:'horizontal'|'vertical';
}
export function Stepper({label,steps,value,completed=[],onValueChange,disabled=false,orientation='horizontal'}:StepperProps) {
  const reduced=useReducedMotionPreference();
  if(!steps.length||steps.length>12||new Set(steps.map(step=>step.value)).size!==steps.length||!steps.some(step=>step.value===value))return <p className="bui-error" role="alert">Provide unique steps and a supported current value.</p>;
  return <nav className="bui-stepper" aria-label={label} data-orientation={orientation}><ol>{steps.map((step,index)=>{const done=completed.includes(step.value),active=step.value===value;const content=<><span className="bui-stepper-marker" data-current={active||undefined} data-complete={done||undefined}><AnimatePresence initial={false} mode="popLayout"><motion.span key={done?'complete':'number'} initial={{opacity:reduced?1:0,y:reduced?0:2}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced?0:.16,ease:[.16,1,.3,1]}}>{done?<Check size={16} aria-hidden="true"/>:<span aria-hidden="true">{index+1}</span>}</motion.span></AnimatePresence></span><span className="bui-stepper-copy"><span>{step.label}</span>{step.description&&<small>{step.description}</small>}<span className="bui-sr-only">{done?'Completed':active?'Current step':'Not completed'}</span></span></>;
    return <li key={step.value}>{index<steps.length-1&&<span className="bui-stepper-connector" data-complete={done||undefined} aria-hidden="true"/>}{onValueChange?<button type="button" onClick={()=>onValueChange(step.value)} disabled={disabled||step.disabled} aria-current={active?'step':undefined}>{content}</button>:<div className="bui-stepper-static" aria-current={active?'step':undefined}>{content}</div>}</li>;})}</ol></nav>;
}
