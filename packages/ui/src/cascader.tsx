'use client';
import {useCallback,useEffect,useId,useMemo,useRef,useState,type FocusEventHandler,type KeyboardEvent,type ReactNode,type Ref} from 'react';
import {Popover} from '@base-ui/react/popover';
import {ChevronDown,ChevronLeft,ChevronRight,Check,X} from 'lucide-react';
import {Button,Icon,IconButton,Input,Spinner} from './core.js';
import {Reveal} from './reveal.js';
import {useControllableValue} from './state.js';
import {useAsyncOptions} from './use-async-options.js';
import {validateCascaderValues,validateCascaderPage,validateCascaderResolvedPath,type CascaderNode,type CascaderOptionsLoader,type CascaderPathResolver} from './cascader-state.js';

export interface CascaderProps<T extends CascaderNode=CascaderNode> {
  label:string;loadOptions:CascaderOptionsLoader<T>;resolvePath?:CascaderPathResolver<T>;
  /** Complete initial display path. Ignore its records after a different value is chosen. */
  selectedPath?:readonly T[];
  value?:readonly string[];defaultValue?:readonly string[];onValueChange?:(path:string[])=>void;
  sourceKey?:string;maxDepth?:number;debounceMs?:number;minQueryLength?:number;renderNode?:(node:T)=>ReactNode;
  placeholder?:string;name?:string;disabled?:boolean;clearable?:boolean;hint?:string;error?:string;
  labelVisibility?:'visible'|'hidden';density?:'comfortable'|'compact';inputRef?:Ref<HTMLButtonElement>;onBlur?:FocusEventHandler<HTMLButtonElement>;
}
/** A paged hierarchy navigator. Only a confirmed leaf replaces the committed form path. */
export function Cascader<T extends CascaderNode=CascaderNode>({label,loadOptions,resolvePath,selectedPath,value,defaultValue=[],onValueChange,sourceKey='',maxDepth=8,debounceMs=200,minQueryLength=0,renderNode,placeholder='Choose an option…',name,disabled=false,clearable=true,hint,error,labelVisibility='visible',density='comfortable',inputRef,onBlur}:CascaderProps<T>) {
  const id=useId(),trigger=useRef<HTMLButtonElement|null>(null),search=useRef<HTMLInputElement|null>(null),popup=useRef<HTMLDivElement|null>(null),popupFocus=useRef<HTMLElement|null>(null),choicesRetry=useRef<HTMLButtonElement|null>(null);
  const [committed,setCommitted]=useControllableValue<readonly string[]>(value,defaultValue,next=>onValueChange?.([...next]));
  const values=validateCascaderValues(committed,maxDepth),valueKey=JSON.stringify(values);
  const [open,setOpen]=useState(false),[browse,setBrowse]=useState<T[]>([]),[query,setQuery]=useState(''),[active,setActive]=useState<string|null>(null),[resolutionEpoch,setResolutionEpoch]=useState(0);
  const liveOpen=useRef(open&&!disabled);liveOpen.current=open&&!disabled;
  const path=browse.map(node=>node.value),pathKey=JSON.stringify(path),parentValue=path.at(-1)??null;
  const selectedScope=useMemo(()=>({}),[loadOptions,resolvePath,sourceKey]);
  const pathCache=useRef<{source:object;key:string;nodes:T[]}>({source:selectedScope,key:'',nodes:[]}),ignoredSeeds=useRef<{source:object;key:string}|null>(null);
  if(pathCache.current.source!==selectedScope){pathCache.current={source:selectedScope,key:'',nodes:[]};ignoredSeeds.current=null;}
  const known=selectedPath?validateCascaderResolvedPath<T>(selectedPath,selectedPath.map(node=>node.value),maxDepth):[];
  const supplied=JSON.stringify(known.map(node=>node.value))===valueKey&&!(ignoredSeeds.current?.source===selectedScope&&ignoredSeeds.current.key===valueKey)?known:[];
  const seeds=pathCache.current.key===valueKey?pathCache.current.nodes:supplied;
  const loader=useCallback(async(request:{query:string;cursor:string|null;signal:AbortSignal})=>validateCascaderPage<T>(await loadOptions({...request,parentValue,path:JSON.parse(pathKey)}),JSON.parse(pathKey),parentValue,maxDepth),[loadOptions,pathKey,parentValue,maxDepth,sourceKey,resolutionEpoch]);
  const resolver=useCallback(async({values:missing,signal}:{values:readonly string[];signal:AbortSignal})=>{
    if(!resolvePath)throw new Error('A path resolver is unavailable.');
    const ids=JSON.parse(valueKey) as string[],nodes=validateCascaderResolvedPath<T>(await resolvePath({values:ids,signal}),ids,maxDepth);
    return nodes.filter(node=>missing.includes(node.value));
  },[resolvePath,valueKey,maxDepth,sourceKey,resolutionEpoch]);
  const state=useAsyncOptions<T>({loadOptions:loader,resolveOptions:resolvePath?resolver:undefined,selectedValues:values,selectedOptions:seeds,sourceKey,query,enabled:open&&!disabled,debounceMs,minQueryLength});
  const resolved=values.map(value=>state.optionForValue(value)),complete=resolved.every((node):node is T=>!!node);
  let pathInvalid=false;
  if(complete&&values.length)try{validateCascaderResolvedPath<T>(resolved,values,maxDepth);}catch{pathInvalid=true;}
  const pathDisabled=complete&&resolved.some(node=>node.disabled);
  if(complete)pathCache.current={source:selectedScope,key:valueKey,nodes:resolved};
  const resolutionError=pathInvalid||pathDisabled?'The selected path is no longer available. Its value is kept.':state.resolutionError;
  const text=values.length?resolved.map((node,index)=>node?.label??values[index]).join(' / '):placeholder;
  const pendingFocus=useRef<{path:string;query:string;value:string|null}|null>(null),actionOrigin=useRef<HTMLElement|null>(null),wasLoading=useRef(false);
  const resolutionAction=useRef<{origin:HTMLElement;key:string;source:object;started:boolean}|null>(null),resolutionRetry=useRef<HTMLButtonElement|null>(null);
  const previousSource=useRef({loadOptions,resolvePath,sourceKey});
  useEffect(()=>{
    const previous=previousSource.current;previousSource.current={loadOptions,resolvePath,sourceKey};
    if(previous.loadOptions!==loadOptions||previous.resolvePath!==resolvePath||previous.sourceKey!==sourceKey){const origin=popupFocus.current;setBrowse([]);setQuery('');setActive(null);pendingFocus.current=null;resolutionAction.current=null;requestAnimationFrame(()=>{if(liveOpen.current&&origin&&!origin.isConnected&&document.activeElement===document.body)search.current?.focus({preventScroll:true});});}
  },[loadOptions,resolvePath,sourceKey]);
  useEffect(()=>{if(disabled){setOpen(false);pendingFocus.current=null;}},[disabled]);
  function focusValue(value:string){const button=popup.current?.querySelector<HTMLButtonElement>('[data-cascader-value="'+CSS.escape(value)+'"]');if(button&&!button.disabled){setActive(value);button.focus({preventScroll:true});return true;}return false;}
  useEffect(()=>{
    const pending=pendingFocus.current;
    if(open&&pending&&pending.path===pathKey&&pending.query===query&&!state.loading){pendingFocus.current=null;const focused=document.activeElement;if(focused===search.current||focused===document.body){const target=pending.value??state.items.find(node=>!node.disabled&&(!node.hasChildren||browse.length+1<maxDepth))?.value;if(target)focusValue(target);}}
    if(wasLoading.current&&!state.loading&&!state.loadingMore&&actionOrigin.current){const origin=actionOrigin.current;actionOrigin.current=null;if(open&&(document.activeElement===origin||document.activeElement===document.body||document.activeElement===search.current||document.activeElement===popup.current))(state.error?choicesRetry.current:search.current)?.focus({preventScroll:true});}
    wasLoading.current=state.loading||state.loadingMore;
  },[state.items,state.loading,state.loadingMore,state.error,open,pathKey,query,browse.length,maxDepth]);
  useEffect(()=>{
    const action=resolutionAction.current;if(!action)return;
    if(action.key!==valueKey||action.source!==selectedScope){resolutionAction.current=null;return;}
    if(state.resolving){action.started=true;return;}
    if(action.started){resolutionAction.current=null;if(document.activeElement===action.origin||document.activeElement===document.body)(resolutionError?resolutionRetry.current:trigger.current)?.focus({preventScroll:true});}
  },[state.resolving,resolutionError,valueKey,selectedScope]);
  function setOpened(next:boolean){
    pendingFocus.current=null;actionOrigin.current=null;setQuery('');setActive(null);
    if(next){setBrowse(complete&&!pathInvalid&&!pathDisabled?resolved.slice(0,-1) as T[]:[]);}
    setOpen(next&&!disabled);
  }
  function navigate(next:T[],focus:string|null=null){search.current?.focus({preventScroll:true});setBrowse(next);setQuery('');setActive(null);pendingFocus.current={path:JSON.stringify(next.map(node=>node.value)),query:'',value:focus};}
  function choose(node:T){
    if(disabled||node.disabled||browse.some(ancestor=>ancestor.disabled))return;
    if(node.hasChildren){if(browse.length+1>=maxDepth)return;navigate([...browse,node]);}
    else{const nodes=[...browse,node],next=nodes.map(item=>item.value);validateCascaderResolvedPath(nodes,next,maxDepth);pathCache.current={source:selectedScope,key:JSON.stringify(next),nodes};resolutionAction.current=null;setCommitted(next);setOpened(false);}
  }
  const enabled=state.items.filter(node=>!node.disabled&&!browse.some(ancestor=>ancestor.disabled)&&(!node.hasChildren||browse.length+1<maxDepth));
  const currentActive=enabled.some(node=>node.value===active)?active:enabled.find(node=>values.includes(node.value))?.value??enabled[0]?.value;
  function rowKeyDown(event:KeyboardEvent<HTMLButtonElement>,node:T){
    const at=enabled.findIndex(item=>item.value===node.value);let target:string|undefined;
    if(event.key==='ArrowDown')target=enabled[(at+1)%enabled.length]?.value;
    else if(event.key==='ArrowUp')target=enabled[(at-1+enabled.length)%enabled.length]?.value;
    else if(event.key==='Home')target=enabled[0]?.value;
    else if(event.key==='End')target=enabled.at(-1)?.value;
    else if(event.key==='ArrowRight'&&node.hasChildren){event.preventDefault();choose(node);return;}
    else if(event.key==='ArrowLeft'&&browse.length){event.preventDefault();navigate(browse.slice(0,-1),browse.at(-1)!.value);return;}
    if(target){event.preventDefault();focusValue(target);}
  }
  const described=[id+'-value',hint&&id+'-hint',error&&id+'-error',(state.resolving||resolutionError)&&id+'-resolution'].filter(Boolean).join(' ');
  return <div className="bui-field bui-cascader">
    <label id={id+'-label'} htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}</label>
    <Popover.Root open={open&&!disabled} onOpenChange={setOpened}>
      <div className="bui-cascader-control"><Popover.Trigger render={<Button id={id} ref={node=>{trigger.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} variant="secondary" className="bui-cascader-trigger" disabled={disabled} data-density={density} aria-labelledby={id+'-label'} aria-describedby={described} aria-invalid={!!error||undefined} onBlur={onBlur}><span id={id+'-value'}>{text}</span><Icon icon={ChevronDown} size={16}/></Button>}/>
        {clearable&&values.length>0&&<IconButton icon={X} label={'Clear '+label.toLowerCase()} variant="ghost" className="bui-cascader-clear" disabled={disabled} onClick={()=>{setCommitted([]);setOpened(false);requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));}}/>}
      </div>
      <Popover.Portal><Popover.Positioner sideOffset={6} className="bui-positioner"><Popover.Popup ref={popup} onFocusCapture={event=>{popupFocus.current=event.target as HTMLElement;}} onPointerDownCapture={()=>{actionOrigin.current=null;}} onKeyDownCapture={()=>{actionOrigin.current=null;}} className="bui-popup bui-cascader-popup" initialFocus={search} finalFocus={trigger} aria-busy={state.loading||state.loadingMore||undefined}>
        <Popover.Title className="bui-sr-only">{label} choices</Popover.Title>
        <div className="bui-cascader-navigation"><Button className="bui-cascader-back" variant="ghost" size="sm" leadingIcon={ChevronLeft} disabled={!browse.length} aria-label={'Back to '+(browse.at(-2)?.label??'all options')} onClick={()=>navigate(browse.slice(0,-1),browse.at(-1)?.value??null)}>Back</Button><nav aria-label={label+' path'}><Button variant="ghost" size="sm" onClick={()=>navigate([])}>All options</Button>{browse.map((node,index)=><span key={node.value}><Icon icon={ChevronRight} size={12}/><Button variant="ghost" size="sm" onClick={()=>navigate(browse.slice(0,index+1))}>{node.label}</Button></span>)}</nav></div>
        <label htmlFor={id+'-search'} className="bui-label">Search this level</label><Input id={id+'-search'} ref={search} type="search" aria-label={'Search '+label.toLowerCase()+' choices'} value={query} placeholder="Find an option…" maxLength={1000} onChange={event=>{pendingFocus.current=null;actionOrigin.current=null;setQuery(event.target.value.slice(0,1000));setActive(null);}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Enter'){const target=event.key==='ArrowUp'?enabled.at(-1):enabled[0];if(target){event.preventDefault();focusValue(target.value);}}}}/>
        <div className="bui-cascader-status" role="status" aria-live="polite">{!state.canSearch?`Type at least ${minQueryLength} characters.`:state.loading?<><Spinner/> Loading choices…</>:state.loadingMore?<><Spinner/> Loading more…</>:`${state.items.length} choices${state.hasMore?' loaded':''}`}</div>
        <div key={pathKey} className="bui-cascader-level"><ul className="bui-cascader-list" aria-label={(browse.at(-1)?.label??'All options')+' options'}>{state.items.map(node=>{const depthBlocked=node.hasChildren&&browse.length+1>=maxDepth;return <li key={node.value}><button type="button" className="bui-cascader-node" data-cascader-value={node.value} data-selected={values.includes(node.value)||undefined} tabIndex={node.value===currentActive?0:-1} disabled={node.disabled||depthBlocked||browse.some(ancestor=>ancestor.disabled)} aria-label={(node.hasChildren?'Open ':'Choose ')+node.label} aria-current={values.includes(node.value)?'true':undefined} onFocus={()=>setActive(node.value)} onKeyDown={event=>rowKeyDown(event,node)} onClick={()=>choose(node)}><span>{renderNode?renderNode(node):<><span>{node.label}</span>{node.description&&<small>{node.description}</small>}{depthBlocked&&<small>Maximum depth reached</small>}</>}</span>{node.hasChildren?<Icon icon={ChevronRight} size={16}/>:values.includes(node.value)?<Icon icon={Check} size={16}/>:null}</button></li>;})}</ul>
          {!state.loading&&state.canSearch&&!state.items.length&&!state.error&&<p className="bui-hint bui-cascader-empty">No choices at this level.</p>}
        </div>
        <Reveal open={!!state.error}><div className="bui-cascader-feedback"><p className="bui-error" role="alert">{state.error}</p><Button ref={choicesRetry} variant="secondary" size="sm" onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.retry();}}>Retry {label.toLowerCase()} choices</Button></div></Reveal>
        {state.hasMore&&!state.error&&<Button className="bui-cascader-more" variant="ghost" size="sm" loading={state.loadingMore} onClick={event=>{actionOrigin.current=event.currentTarget;wasLoading.current=true;state.loadMore();}}>Load more {label.toLowerCase()}</Button>}
        {state.limitReached&&<p className="bui-hint">Narrow this level's search to see more choices.</p>}
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
    {name&&<input type="hidden" name={name} value={JSON.stringify(values)} disabled={disabled}/>}
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{error&&<p id={id+'-error'} className="bui-error" role="alert">{error}</p>}
    <Reveal open={state.resolving||!!resolutionError} id={id+'-resolution'}><div className="bui-cascader-feedback"><p className={resolutionError?'bui-error':'bui-hint'} role={resolutionError?'alert':'status'}>{state.resolving?<><Spinner/> Loading selected path…</>:resolutionError}</p><>{resolvePath&&<Button ref={resolutionRetry} variant="ghost" size="sm" loading={state.resolving} onClick={event=>{resolutionAction.current={origin:event.currentTarget,key:valueKey,source:selectedScope,started:false};pathCache.current={source:selectedScope,key:'',nodes:[]};ignoredSeeds.current={source:selectedScope,key:valueKey};setResolutionEpoch(epoch=>epoch+1);}}>Retry selected path</Button>}</></div></Reveal>
  </div>;
}
