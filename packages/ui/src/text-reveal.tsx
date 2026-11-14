/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {createElement,useRef,type CSSProperties} from 'react';
import {useVisualEntrance} from './visual-motion.js';
export interface TextRevealProps {text:string;as?:'p'|'h1'|'h2'|'h3'|'span';className?:string;delay?:number;interval?:number;style?:CSSProperties}
/** Text stays in reading order, with no duplicate accessible copy or character scrambling. */
export function TextReveal({text,as='p',className,delay=0,interval=.018,style}:TextRevealProps){const root=useRef<HTMLElement>(null),{entered,reduced}=useVisualEntrance(root),tokens=text.match(/\S+\s*|\s+/g)??[],bounded=text.length<=4000&&tokens.length<=120;return createElement(as,{ref:root,className:['bui-text-reveal',className].filter(Boolean).join(' '),style,'data-animate':entered&&bounded||undefined,'data-reduced':reduced||undefined},bounded?tokens.map((token,index)=><span key={index} style={{'--bui-entrance-delay':Math.max(0,Math.min(1,Number.isFinite(delay)?delay:0))+Math.min(index,80)*Math.max(0,Math.min(.08,Number.isFinite(interval)?interval:.018))+'s'} as CSSProperties}>{token}</span>):text);}
