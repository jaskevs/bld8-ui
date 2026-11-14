/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {useReducedMotionPreference} from './motion-preference.js';
/** First render remains readable. A single, bounded entrance runs after viewport observation. */
export function useVisualEntrance(root:RefObject<HTMLElement|null>){const reduced=useReducedMotionPreference(),[entered,setEntered]=useState(false),played=useRef(false);useEffect(()=>{if(played.current||reduced)return;const element=root.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){played.current=true;setEntered(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){played.current=true;setEntered(true);observer.disconnect();}},{threshold:.12});observer.observe(element);return()=>observer.disconnect();},[root,reduced]);return {entered:entered&&!reduced,reduced};}
