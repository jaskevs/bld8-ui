/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {cn} from './utils.js';
import {useReducedMotionPreference} from './motion-preference.js';

export interface RevealProps {open:boolean;children:ReactNode;className?:string;id?:string}
/** Retains exiting content until its reversible intrinsic-height transition ends. */
export function Reveal({open,children,className,id}:RevealProps){
  const previous=useRef(children),root=useRef<HTMLDivElement>(null);
  const [present,setPresent]=useState(open);const reduced=useReducedMotionPreference();
  useLayoutEffect(()=>{if(open)previous.current=children;},[open,children]);
  useLayoutEffect(()=>{
    if(open){setPresent(true);return;}
    if(!present)return;
    const finish=()=>{setPresent(false);previous.current=null;};
    if(reduced){finish();return;}
    const style=getComputedStyle(root.current!);
    const milliseconds=(value:string)=>parseFloat(value)*(value.trim().endsWith('ms')?1:1000)||0;
    const duration=style.transitionDuration.split(',').map(milliseconds),delay=style.transitionDelay.split(',').map(milliseconds);
    const total=Math.max(0,...duration.map((value,index)=>value+(delay[index%delay.length]||0)));
    const timer=window.setTimeout(finish,total?total+50:0);return()=>window.clearTimeout(timer);
  },[open,reduced]);
  return <div id={id} ref={root} className={cn('bui-reveal',className)} data-open={open} aria-hidden={!open||undefined} inert={!open} onTransitionEnd={event=>{if(!open&&event.target===event.currentTarget&&event.propertyName==='grid-template-rows'){setPresent(false);previous.current=null;}}}>
    <div className="bui-reveal-clip"><div className="bui-reveal-content">{open?children:present?previous.current:null}</div></div>
  </div>;
}
