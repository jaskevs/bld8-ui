'use client';
import {useEffect,useRef,type ReactNode,type RefObject} from 'react';
import {Combobox} from '@base-ui/react/combobox';
import {Button,Icon,Spinner} from './core.js';
import {Reveal} from './reveal.js';
import type {AsyncOption} from './async-options.js';
import type {AsyncOptionsState} from './use-async-options.js';

export function AsyncOptionsPopup<T extends AsyncOption>({state,label,selected,renderOption,input,open,minQueryLength}:{state:AsyncOptionsState<T>;label:string;selected:readonly string[];renderOption?:(item:T)=>ReactNode;input:RefObject<HTMLInputElement|null>;open:boolean;minQueryLength:number}) {
  const actionOrigin=useRef<HTMLElement|null>(null),retryButton=useRef<HTMLButtonElement|null>(null),wasLoading=useRef(false);
  useEffect(()=>{
    if(wasLoading.current&&!state.loading&&!state.loadingMore&&actionOrigin.current){const origin=actionOrigin.current;actionOrigin.current=null;if(open&&(document.activeElement===origin||document.activeElement===document.body))(state.error?retryButton.current:input.current)?.focus({preventScroll:true});}
    wasLoading.current=state.loading||state.loadingMore;
  },[state.loading,state.loadingMore,state.error,open,input]);
  return <Combobox.Portal><Combobox.Positioner sideOffset={6} className="bui-positioner"><Combobox.Popup className="bui-popup bui-select-popup bui-async-popup" aria-busy={state.loading||state.loadingMore||undefined}>
    <div className="bui-async-feedback" role="status" aria-live="polite">{!state.canSearch?`Type at least ${minQueryLength} characters to search.`:state.loading?<><Spinner/> Searching…</>:state.loadingMore?<><Spinner/> Loading more…</>:`${state.items.length} options${state.hasMore?' loaded':''}`}</div>
    <Combobox.List aria-label={label+' options'}>{(value:string)=>{const item=state.optionForValue(value);return item?<Combobox.Item key={value} value={value} disabled={item.disabled||selected.length>=100&&!selected.includes(value)} className="bui-option bui-async-option"><span className="bui-option-label">{renderOption?renderOption(item):<><span>{item.label}</span>{item.description&&<small className="bui-async-description">{item.description}</small>}</>}</span><Combobox.ItemIndicator><Icon name="check"/></Combobox.ItemIndicator></Combobox.Item>:null;}}</Combobox.List>
    {!state.loading&&state.canSearch&&!state.error&&<Combobox.Empty className="bui-combo-empty">No matching options.</Combobox.Empty>}
    <Reveal open={!!state.error}><div className="bui-async-error"><p className="bui-error" role="alert">{state.error}</p><Button ref={retryButton} variant="secondary" size="sm" onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.retry();}}>Retry {label.toLowerCase()} search</Button></div></Reveal>
    {state.hasMore&&!state.error&&<div className="bui-async-more"><Button variant="ghost" size="sm" loading={state.loadingMore} onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.loadMore();}}>Load more {label.toLowerCase()}</Button></div>}
    {state.limitReached&&<p className="bui-hint bui-async-feedback">Narrow the search to see more options.</p>}
  </Combobox.Popup></Combobox.Positioner></Combobox.Portal>;
}

export function AsyncResolutionFeedback<T extends AsyncOption>({state,input,id}:{state:AsyncOptionsState<T>;input:RefObject<HTMLInputElement|null>;id:string}) {
  const origin=useRef<HTMLElement|null>(null),retryButton=useRef<HTMLButtonElement|null>(null),wasResolving=useRef(false);
  useEffect(()=>{
    if(wasResolving.current&&!state.resolving&&origin.current){const target=origin.current;origin.current=null;if(document.activeElement===target||document.activeElement===document.body)(state.resolutionError?retryButton.current:input.current)?.focus({preventScroll:true});}
    wasResolving.current=state.resolving;
  },[state.resolving,state.resolutionError,input]);
  return <Reveal open={state.resolving||!!state.resolutionError} id={id}><div className="bui-async-resolution"><p className={state.resolutionError?'bui-error':'bui-hint'} role={state.resolutionError?'alert':'status'}>{state.resolving?<><Spinner/> Loading selected labels…</>:state.resolutionError}</p><Button ref={retryButton} variant="ghost" size="sm" loading={state.resolving} onClick={event=>{origin.current=event.currentTarget;wasResolving.current=true;state.retryResolution();}}>Retry selected labels</Button></div></Reveal>;
}
