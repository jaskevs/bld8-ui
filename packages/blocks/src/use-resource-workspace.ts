/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import type {DataRecord} from '@bld8/ui/data-workspace-state';
import {createResourceWorkspaceController,type ResourceControllerOptions} from './resource-workspace-state.js';
/** The adapter identity and schema bind drafts. Keep the adapter stable while editing. */
export function useResourceWorkspace<T extends DataRecord>(options:ResourceControllerOptions<T>){
  const schema=JSON.stringify({columns:options.columns,fields:options.fields}),source=options.dataSource;
  const controller=useMemo(()=>createResourceWorkspaceController(options),[source,schema]);
  const previous=useRef(controller),state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  useEffect(()=>{const prior=previous.current;if(prior!==controller&&(prior.getSnapshot().saving||prior.getSnapshot().uncertain))controller.setNotice('The data source changed. A previous write may have committed; reconcile it with that service.');previous.current=controller;return controller.start();},[controller]);
  useEffect(()=>{if(!state.hasDrafts)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[state.hasDrafts]);
  return {...state,controller};
}
