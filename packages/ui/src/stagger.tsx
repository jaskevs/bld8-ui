/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {Children,useRef,type CSSProperties,type ReactNode} from 'react';
import {useVisualEntrance} from './visual-motion.js';
export interface StaggerProps {children:ReactNode;className?:string;interval?:number;delay?:number;style?:CSSProperties;label?:string}
/** A single entrance for up to 24 keyed blocks. Native child identity and focus are preserved. */
export function Stagger({children,className,interval=.05,delay=0,style,label}:StaggerProps){const root=useRef<HTMLDivElement>(null),{entered,reduced}=useVisualEntrance(root),items=Children.toArray(children);return <div ref={root} className={['bui-stagger',className].filter(Boolean).join(' ')} style={style} role={label?'group':undefined} aria-label={label} data-animate={entered&&items.length<=24||undefined} data-reduced={reduced||undefined}>{items.map((child,index)=><div key={typeof child==='object'&&child!==null&&'key' in child?child.key??index:index} className="bui-stagger-item" style={{'--bui-entrance-delay':Math.max(0,Math.min(1,Number.isFinite(delay)?delay:0))+index*Math.max(0,Math.min(.1,Number.isFinite(interval)?interval:.05))+'s'} as CSSProperties}>{child}</div>)}</div>;}
