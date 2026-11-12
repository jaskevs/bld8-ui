/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Combobox} from '@base-ui/react/combobox';
import {Button,Icon,Spinner} from './core.js';
import {Reveal} from './reveal.js';
import {ChoiceComboboxPopup} from './choice-option.js';
import type {AsyncOption} from './async-options.js';
import type {AsyncOptionsState} from './use-async-options.js';

export function AsyncOptionsPopup<T extends AsyncOption>({state,label,selected,renderOption,input,open,minQueryLength,actions,id}:{state:AsyncOptionsState<T>;label:string;selected:readonly string[];renderOption?:(item:T)=>ReactNode;input:RefObject<HTMLInputElement|null>;open:boolean;minQueryLength:number;actions:RefObject<Combobox.Root.Actions|null>;id:string}) {
  const actionOrigin=useRef<HTMLElement|null>(null),retryButton=useRef<HTMLButtonElement|null>(null),wasLoading=useRef(false);
  useEffect(()=>{
    if(wasLoading.current&&!state.loading&&!state.loadingMore&&actionOrigin.current){const origin=actionOrigin.current;actionOrigin.current=null;if(open&&(document.activeElement===origin||document.activeElement===document.body))(state.error?retryButton.current:input.current)?.focus({preventScroll:true});}
    wasLoading.current=state.loading||state.loadingMore;
  },[state.loading,state.loadingMore,state.error,open,input]);
  return <ChoiceComboboxPopup actions={actions} open={open} id={id} className="bui-async-popup" ariaBusy={state.loading||state.loadingMore}>
    <div className="bui-async-feedback" role="status" aria-live="polite">{!state.canSearch?`Type at least ${minQueryLength} characters to search.`:state.loading?<><Spinner/> Searching…</>:state.loadingMore?<><Spinner/> Loading more…</>:`${state.items.length} options${state.hasMore?' loaded':''}`}</div>
    <Combobox.List aria-label={label+' options'}>{(value:string)=>{const item=state.optionForValue(value);return item?<Combobox.Item key={value} value={value} disabled={item.disabled||selected.length>=100&&!selected.includes(value)} className="bui-option bui-async-option"><span className="bui-option-label">{renderOption?renderOption(item):<><span>{item.label}</span>{item.description&&<small className="bui-async-description">{item.description}</small>}</>}</span><Combobox.ItemIndicator><Icon name="check"/></Combobox.ItemIndicator></Combobox.Item>:null;}}</Combobox.List>
    {!state.loading&&state.canSearch&&!state.error&&<Combobox.Empty className="bui-combo-empty">No matching options.</Combobox.Empty>}
    <Reveal open={!!state.error}><div className="bui-async-error"><p className="bui-error" role="alert">{state.error}</p><Button ref={retryButton} variant="secondary" size="sm" onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.retry();}}>Retry {label.toLowerCase()} search</Button></div></Reveal>
    {state.hasMore&&!state.error&&<div className="bui-async-more"><Button variant="ghost" size="sm" loading={state.loadingMore} onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.loadMore();}}>Load more {label.toLowerCase()}</Button></div>}
    {state.limitReached&&<p className="bui-hint bui-async-feedback">Narrow the search to see more options.</p>}
  </ChoiceComboboxPopup>;
}

export function AsyncResolutionFeedback<T extends AsyncOption>({state,input,id}:{state:AsyncOptionsState<T>;input:RefObject<HTMLInputElement|null>;id:string}) {
  const origin=useRef<HTMLElement|null>(null),retryButton=useRef<HTMLButtonElement|null>(null),wasResolving=useRef(false);
  useEffect(()=>{
    if(wasResolving.current&&!state.resolving&&origin.current){const target=origin.current;origin.current=null;if(document.activeElement===target||document.activeElement===document.body)(state.resolutionError?retryButton.current:input.current)?.focus({preventScroll:true});}
    wasResolving.current=state.resolving;
  },[state.resolving,state.resolutionError,input]);
  return <Reveal open={state.resolving||!!state.resolutionError} id={id}><div className="bui-async-resolution"><p className={state.resolutionError?'bui-error':'bui-hint'} role={state.resolutionError?'alert':'status'}>{state.resolving?<><Spinner/> Loading selected labels…</>:state.resolutionError}</p><Button ref={retryButton} variant="ghost" size="sm" loading={state.resolving} onClick={event=>{origin.current=event.currentTarget;wasResolving.current=true;state.retryResolution();}}>Retry selected labels</Button></div></Reveal>;
}

/** Native reset observes cancellation after all listeners and does not report a user change. */
export function useAsyncChoiceValue<T>(value:T|undefined,defaultValue:T,onChange:((value:T)=>void)|undefined,input:RefObject<HTMLInputElement|null>,form:string|undefined,onReset:()=>void){
  const [internal,setInternal]=useState(defaultValue),initial=useRef(defaultValue),latest=useRef({controlled:value!==undefined,onReset});
  latest.current={controlled:value!==undefined,onReset};
  useEffect(()=>{
    const field=input.current,owner=form?field?.ownerDocument.getElementById(form):field?.form;
    if(!owner||owner.tagName!=='FORM')return;
    const pending=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{pending.delete(timer);if(event.defaultPrevented)return;if(!latest.current.controlled)setInternal(initial.current);latest.current.onReset();},0);pending.add(timer);};
    owner.addEventListener('reset',reset);
    return()=>{owner.removeEventListener('reset',reset);for(const timer of pending)clearTimeout(timer);};
  },[input,form]);
  return [value===undefined?internal:value,(next:T)=>{if(value===undefined)setInternal(next);onChange?.(next);}] as const;
}
