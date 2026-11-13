/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {forwardRef,useEffect,useId,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {AnimatePresence,LayoutGroup,animate,motion,useIsPresent} from 'motion/react';
import {useReducedMotionPreference} from './motion-preference.js';
import {cn} from './utils.js';
import {useUIConfig} from './ui-config.js';

const easing=[.16,1,.3,1] as const;
const duration=(value:number)=>Number.isFinite(value)?Math.max(0,Math.min(2,value)):.24;

export interface AutoHeightProps {children:ReactNode;className?:string;duration?:number;style?:CSSProperties;id?:string}
/** Measures intrinsic content without scaling text. Initial/SSR content stays visible. */
export function AutoHeight({children,className,duration:seconds=.24,style,id}:AutoHeightProps){
  const content=useRef<HTMLDivElement>(null),[height,setHeight]=useState<number>(),[moving,setMoving]=useState(false),reduced=useReducedMotionPreference();
  useLayoutEffect(()=>{
    const element=content.current;if(!element)return;
    const measure=()=>{const next=element.getBoundingClientRect().height;setHeight(previous=>previous===next?previous:next);};
    measure();if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(reduced)setMoving(false);},[reduced]);
  return <motion.div id={id} className={cn('bui-auto-height',className)} initial={false} animate={{height:reduced||height===undefined?'auto':height}} transition={{duration:reduced?0:duration(seconds),ease:easing}} onAnimationStart={()=>setMoving(true)} onAnimationComplete={()=>setMoving(false)} style={{...style,overflow:moving&&!reduced?'clip':style?.overflow}}><div ref={content} className="bui-auto-height-content">{children}</div></motion.div>;
}

export interface AnimatedNumberProps {value:number;locale?:string;format?:Intl.NumberFormatOptions;duration?:number;label?:string;className?:string}
/** The accessible value changes once; the visual interpolation never becomes a live region. */
export function AnimatedNumber({value,locale,format,duration:seconds=.45,label,className}:AnimatedNumberProps){
  const config=useUIConfig();locale=locale??config.locale;
  const visual=useRef<HTMLSpanElement>(null),root=useRef<HTMLSpanElement>(null),current=useRef(value),reduced=useReducedMotionPreference();
  const [visible,setVisible]=useState(true);
  let formatter:Intl.NumberFormat;try{formatter=new Intl.NumberFormat(locale,format);}catch{formatter=new Intl.NumberFormat('en-AU');}
  const target=Number.isFinite(value)?value:null,final=target===null?'—':formatter.format(target),formatKey=JSON.stringify(format??{});
  useEffect(()=>{
    const element=root.current;if(!element)return;
    let intersecting=true;const update=()=>setVisible(!document.hidden&&intersecting);document.addEventListener('visibilitychange',update);
    const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{intersecting=entries.some(entry=>entry.isIntersecting);update();});
    observer?.observe(element);return()=>{document.removeEventListener('visibilitychange',update);observer?.disconnect();};
  },[]);
  useLayoutEffect(()=>{
    const element=visual.current;if(!element)return;
    if(target===null){element.textContent='—';return;}
    if(!Number.isFinite(current.current)||!Number.isFinite(target-current.current)||reduced||!visible){current.current=target;element.textContent=final;return;}
    element.textContent=formatter.format(current.current);
    const playback=animate(current.current,target,{duration:duration(seconds),ease:easing,onUpdate:next=>{current.current=next;if(visual.current)visual.current.textContent=formatter.format(next);},onComplete:()=>{current.current=target;if(visual.current)visual.current.textContent=final;}});
    return()=>playback.stop();
  },[target,locale,formatKey,seconds,reduced,visible,final]);
  return <span ref={root} className={cn('bui-animated-number',className)} data-invalid={target===null||undefined}><span ref={visual} aria-hidden="true">{final}</span><span className="bui-sr-only">{label?label+': ':''}{final}</span></span>;
}

export interface AnimatedListProps<T> {items:readonly T[];getKey:(item:T)=>string;children:(item:T,index:number)=>ReactNode;label:string;className?:string;duration?:number;empty?:ReactNode}
interface ListItemProps {children:ReactNode;itemKey:string;seconds:number;reduced:boolean;onFocusItem:(key:string)=>void}
const ListItem=forwardRef<HTMLLIElement,ListItemProps>(function ListItem({children,itemKey,seconds,reduced,onFocusItem},ref){
  const present=useIsPresent();
  return <motion.li ref={ref} layout="position" data-motion-key={itemKey} tabIndex={-1} aria-hidden={!present||undefined} inert={!present||undefined} onFocusCapture={()=>onFocusItem(itemKey)} initial={reduced?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-4}} transition={{duration:reduced?0:seconds,ease:easing}}>{children}</motion.li>;
});
/** Stable keys preserve interactive children; removed focused rows recover to their nearest neighbour. */
export function AnimatedList<T>({items,getKey,children,label,className,duration:seconds=.24,empty}:AnimatedListProps<T>){
  const root=useRef<HTMLOListElement>(null),lastFocus=useRef<string|null>(null),previous=useRef<string[]>([]),reduced=useReducedMotionPreference();
  const keys=items.map(getKey),valid=items.length<=200&&keys.every(key=>typeof key==='string'&&key.length>0)&&new Set(keys).size===keys.length;
  const signature=JSON.stringify(keys);
  useLayoutEffect(()=>{
    const before=previous.current;previous.current=keys;
    if(!valid||!lastFocus.current||keys.includes(lastFocus.current))return;
    const active=document.activeElement;if(active!==document.body&&!root.current?.contains(active))return;
    const index=Math.max(0,Math.min(keys.length-1,before.indexOf(lastFocus.current))),key=keys[index];
    const row=(Array.from(root.current?.children??[]) as HTMLElement[]).find(element=>element.dataset.motionKey===key);
    const candidates=row?Array.from(row.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type=hidden]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')):[];
    const focus=candidates.find(element=>!element.closest('[hidden],[inert]')&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden')??row??root.current;
    focus?.focus({preventScroll:true});lastFocus.current=key??null;
  },[signature,valid]);
  if(!valid)return <p role="alert">AnimatedList needs up to 200 items with unique, non-empty keys.</p>;
  return <AutoHeight duration={seconds}><ol ref={root} className={cn('bui-animated-list',className)} aria-label={label} tabIndex={-1} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))lastFocus.current=null;}}><AnimatePresence initial={false} mode="popLayout">{items.map((item,index)=><ListItem key={keys[index]} itemKey={keys[index]} seconds={duration(seconds)} reduced={reduced} onFocusItem={key=>lastFocus.current=key}>{children(item,index)}</ListItem>)}</AnimatePresence>{!items.length&&empty?<li className="bui-animated-list-empty">{empty}</li>:null}</ol></AutoHeight>;
}

export interface LayoutTransitionGroupProps {children:ReactNode;id?:string}
/** Namespaces shared elements so separate workspaces cannot animate into each other. */
export function LayoutTransitionGroup({children,id}:LayoutTransitionGroupProps){const generated=useId();return <LayoutGroup id={id??generated}>{children}</LayoutGroup>;}
export interface LayoutTransitionProps {children:ReactNode;layoutId?:string;className?:string;duration?:number;style?:CSSProperties;mode?:'position'|'size'|'both'}
export function LayoutTransition({children,layoutId,className,duration:seconds=.24,style,mode='position'}:LayoutTransitionProps){
  const reduced=useReducedMotionPreference();return <motion.div className={cn('bui-layout-transition',className)} layout={reduced?false:mode==='both'?true:mode} layoutId={reduced?undefined:layoutId} initial={false} transition={{layout:{duration:reduced?0:duration(seconds),ease:easing}}} style={style}>{children}</motion.div>;
}
