/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {forwardRef,useCallback,useLayoutEffect,useRef,useState,type HTMLAttributes} from 'react';
import {useUIConfig} from './ui-config.js';
export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>,'role'|'aria-label'> {
  label:string;orientation?:'vertical'|'horizontal'|'both';
  onOverflowChange?:(overflow:{horizontal:boolean;vertical:boolean})=>void;
}
/** Native scrolling, keyboard access when needed, and platform touch/momentum behaviour. */
export const ScrollArea=forwardRef<HTMLDivElement,ScrollAreaProps>(function ScrollArea({label,orientation='vertical',onOverflowChange,className,children,tabIndex,dir,...props},forwardedRef){
  const config=useUIConfig(),viewport=useRef<HTMLDivElement|null>(null),content=useRef<HTMLDivElement>(null),callback=useRef(onOverflowChange);callback.current=onOverflowChange;
  const [overflow,setOverflow]=useState({horizontal:false,vertical:false});
  const setRef=useCallback((element:HTMLDivElement|null)=>{viewport.current=element;if(typeof forwardedRef==='function')forwardedRef(element);else if(forwardedRef)forwardedRef.current=element;},[forwardedRef]);
  useLayoutEffect(()=>{const element=viewport.current,inner=content.current;if(!element||!inner)return;let previous='';const measure=()=>{const next={horizontal:orientation!=='vertical'&&element.scrollWidth>element.clientWidth+1,vertical:orientation!=='horizontal'&&element.scrollHeight>element.clientHeight+1},key=JSON.stringify(next);if(previous===key)return;previous=key;setOverflow(next);callback.current?.(next);};measure();const observer=new ResizeObserver(measure);observer.observe(element);observer.observe(inner);return()=>observer.disconnect();},[orientation]);
  return <div {...props} ref={setRef} className={['bui-scroll-area',className].filter(Boolean).join(' ')} role="region" aria-label={label} tabIndex={tabIndex??(overflow.horizontal||overflow.vertical?0:undefined)} dir={dir??config.direction} data-orientation={orientation} data-overflow-x={overflow.horizontal||undefined} data-overflow-y={overflow.vertical||undefined}><div className="bui-scroll-area-content" ref={content}>{children}</div></div>;
});
