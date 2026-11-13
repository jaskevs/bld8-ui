/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useSyncExternalStore} from 'react';
import {useUIConfig} from './ui-config.js';
const query='(prefers-reduced-motion: reduce)';
const subscribe=(notify:()=>void)=>{const media=window.matchMedia(query);media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const snapshot=()=>window.matchMedia(query).matches;
/** Reacts to system preference changes without requiring a reload. */
export function useReducedMotionPreference(){const system=useSyncExternalStore(subscribe,snapshot,()=>true),{motion}=useUIConfig();return system||motion==='reduced';}
