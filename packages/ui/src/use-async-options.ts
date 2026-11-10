'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {validateAsyncPage,validateAsyncValues,validateResolvedOptions,type AsyncOption,type AsyncOptionsLoader,type AsyncOptionsResolver} from './async-options.js';

export interface UseAsyncOptionsOptions<T extends AsyncOption=AsyncOption> {
  loadOptions:AsyncOptionsLoader<T>;
  resolveOptions?:AsyncOptionsResolver<T>;
  selectedValues?:readonly string[];
  /** Seed selected labels; fetched records take precedence until the source changes. */
  selectedOptions?:readonly T[];
  query:string;
  enabled?:boolean;
  /** Change when a tenant, authorisation scope or parent branch changes. */
  sourceKey?:string;
  debounceMs?:number;
  minQueryLength?:number;
}
export type AsyncOptionsStatus='idle'|'waiting'|'loading'|'ready'|'error';
interface PageState<T extends AsyncOption> {source:object;query:string;items:T[];cursor:string|null;status:AsyncOptionsStatus;loadingMore:boolean;error:string|null;limitReached:boolean}
export interface AsyncOptionsState<T extends AsyncOption=AsyncOption> {
  items:readonly T[];status:AsyncOptionsStatus;loading:boolean;loadingMore:boolean;error:string|null;hasMore:boolean;limitReached:boolean;canSearch:boolean;
  resolving:boolean;resolutionError:string|null;optionForValue:(value:string)=>T|undefined;loadMore:()=>void;retry:()=>void;retryResolution:()=>void;
}
/** Bounded paging with separate query and selected-label lifetimes. The host owns transport and authorisation. */
export function useAsyncOptions<T extends AsyncOption=AsyncOption>({loadOptions,resolveOptions,selectedValues=[],selectedOptions=[],query,enabled=true,sourceKey='',debounceMs=200,minQueryLength=0}:UseAsyncOptionsOptions<T>):AsyncOptionsState<T> {
  if(typeof query!=='string'||query.length>1000||typeof sourceKey!=='string'||sourceKey.length>512||!Number.isInteger(debounceMs)||debounceMs<0||debounceMs>1000||!Number.isInteger(minQueryLength)||minQueryLength<0||minQueryLength>10)throw new Error('Use a bounded query, debounce and minimum query length.');
  const selected=validateAsyncValues(selectedValues),selectedKey=JSON.stringify(selected),seeds=validateResolvedOptions<T>(selectedOptions,selectedOptions.map(item=>item.value));
  const source=useMemo(()=>({}),[loadOptions,resolveOptions,sourceKey]);
  const blank=():PageState<T>=>({source,query,items:[],cursor:null,status:'idle',loadingMore:false,error:null,limitReached:false});
  const [page,setPage]=useState<PageState<T>>(blank),[resolution,setResolution]=useState<{source:object;resolving:boolean;error:string|null}>({source,resolving:false,error:null}),[resolutionRetry,setResolutionRetry]=useState(0);
  const cache=useRef<{source:object;items:Map<string,T>}>({source,items:new Map()});
  if(cache.current.source!==source)cache.current={source,items:new Map()};
  for(const item of seeds)if(selected.includes(item.value)&&!cache.current.items.has(item.value))cache.current.items.set(item.value,item);
  const pageRef=useRef(page);pageRef.current=page;
  const latest=useRef({source,query,enabled,selected});latest.current={source,query,enabled,selected};
  const request=useRef(0),controller=useRef<AbortController|null>(null),pending=useRef(false),consumed=useRef(new Set<string>()),resolutionRequest=useRef(0),resolutionController=useRef<AbortController|null>(null),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current++;resolutionRequest.current++;controller.current?.abort();resolutionController.current?.abort();};},[]);
  const current=page.source===source&&page.query===query?page:blank();
  const canSearch=query.trim().length>=minQueryLength;
  function mergeCache(items:readonly T[]) {
    const keep=new Set([...latest.current.selected,...items.map(item=>item.value)]);
    for(const value of cache.current.items.keys())if(!keep.has(value))cache.current.items.delete(value);
    for(const item of items)cache.current.items.set(item.value,item);
  }
  const run=useCallback((cursor:string|null,append:boolean)=>{
    if(!latest.current.enabled||latest.current.source!==source||latest.current.query!==query||pending.current||query.trim().length<minQueryLength)return;
    const previous=pageRef.current;
    if(append&&(previous.source!==source||previous.query!==query||!previous.cursor||previous.items.length>=500))return;
    const id=++request.current,abort=new AbortController();controller.current?.abort();controller.current=abort;pending.current=true;
    setPage(state=>append?{...state,loadingMore:true,error:null}:{source,query,items:[],cursor:null,status:'loading',loadingMore:false,error:null,limitReached:false});
    void(async()=>{
      try{
        const response=validateAsyncPage<T>(await loadOptions({query,cursor,signal:abort.signal}));
        if(!alive.current||abort.signal.aborted||request.current!==id||latest.current.source!==source||latest.current.query!==query)return;
        if(response.nextCursor!==null&&(response.nextCursor===cursor||consumed.current.has(response.nextCursor)))throw new Error('The source did not advance its cursor.');
        const records=new Map<string,T>((append?previous.items:[]).map(item=>[item.value,item]));
        for(const item of response.items)records.set(item.value,item);
        if(append&&records.size===previous.items.length&&response.nextCursor!==null)throw new Error('The source did not return a new page.');
        if(cursor!==null)consumed.current.add(cursor);
        const all=[...records.values()],items=all.slice(0,500);mergeCache(items);
        if(latest.current.selected.every(value=>cache.current.items.has(value))){resolutionRequest.current++;resolutionController.current?.abort();resolutionController.current=null;setResolution({source,resolving:false,error:null});}
        setPage({source,query,items,cursor:response.nextCursor,status:'ready',loadingMore:false,error:null,limitReached:all.length>500||items.length===500&&response.nextCursor!==null});
      }catch{
        if(alive.current&&!abort.signal.aborted&&request.current===id&&latest.current.source===source&&latest.current.query===query)setPage(state=>append?{...state,loadingMore:false,error:'More options could not be loaded. Try again.'}:{source,query,items:[],cursor:null,status:'error',loadingMore:false,error:'Options could not be loaded. Try again.',limitReached:false});
      }finally{if(request.current===id){pending.current=false;controller.current=null;}}
    })();
  },[loadOptions,source,query,minQueryLength]);
  useEffect(()=>{
    request.current++;controller.current?.abort();controller.current=null;pending.current=false;consumed.current.clear();
    if(!enabled||!canSearch){setPage(blank());return;}
    setPage({...blank(),status:'waiting'});
    const timer=setTimeout(()=>run(null,false),debounceMs);
    return()=>{clearTimeout(timer);request.current++;controller.current?.abort();controller.current=null;pending.current=false;};
  },[source,query,enabled,canSearch,debounceMs,run]);
  useEffect(()=>{
    const id=++resolutionRequest.current,abort=new AbortController(),missing=latest.current.selected.filter(value=>!cache.current.items.has(value));
    resolutionController.current?.abort();resolutionController.current=null;
    if(!missing.length){setResolution({source,resolving:false,error:null});return;}
    if(!resolveOptions){setResolution({source,resolving:false,error:'Some selected labels are unavailable. Supply selected options or a label resolver.'});return;}
    resolutionController.current=abort;setResolution({source,resolving:true,error:null});
    void(async()=>{
      try{
        const items=validateResolvedOptions<T>(await resolveOptions({values:missing,signal:abort.signal}),missing);
        if(!alive.current||abort.signal.aborted||resolutionRequest.current!==id||latest.current.source!==source)return;
        for(const item of items)if(latest.current.selected.includes(item.value)&&!cache.current.items.has(item.value))cache.current.items.set(item.value,item);
        const unresolved=latest.current.selected.some(value=>!cache.current.items.has(value));
        setResolution({source,resolving:false,error:unresolved?'Some selected options could not be found. Their values are kept.':null});
      }catch{if(alive.current&&!abort.signal.aborted&&resolutionRequest.current===id&&latest.current.source===source)setResolution({source,resolving:false,error:latest.current.selected.every(value=>cache.current.items.has(value))?null:'Selected labels could not be loaded. Their values are kept.'});}
    })();
    return()=>{abort.abort();if(resolutionController.current===abort)resolutionController.current=null;resolutionRequest.current++;};
  },[source,selectedKey,resolveOptions,resolutionRetry]);
  // Retain selected labels and the current result window, rather than all historical searches.
  const keep=new Set([...selected,...current.items.map(item=>item.value)]);
  for(const key of cache.current.items.keys())if(!keep.has(key))cache.current.items.delete(key);
  const status:AsyncOptionsStatus=enabled&&canSearch&&current.status==='idle'?'waiting':current.status;
  return {items:current.items,status,loading:enabled&&canSearch&&(status==='loading'||status==='waiting'),loadingMore:current.loadingMore,error:current.error,canSearch,limitReached:current.limitReached,
    hasMore:!!current.cursor&&!current.limitReached,resolving:resolution.source===source&&resolution.resolving,resolutionError:resolution.source===source?resolution.error:null,
    optionForValue:value=>cache.current.items.get(value),loadMore:()=>{const latestPage=pageRef.current;if(latestPage.cursor)run(latestPage.cursor,true);},
    retry:()=>{const latestPage=pageRef.current;if(latestPage.error&&latestPage.items.length&&latestPage.cursor)run(latestPage.cursor,true);else run(null,false);},retryResolution:()=>setResolutionRetry(value=>value+1)};
}
