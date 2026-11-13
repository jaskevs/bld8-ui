/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {UIPortal,useUIConfig} from './ui-config.js';
import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type FocusEventHandler,type KeyboardEvent,type ReactNode,type Ref} from 'react';
import {Popover} from '@base-ui/react/popover';
import {Check,ChevronDown,ChevronRight,Folder,FolderOpen,Minus,X} from 'lucide-react';
import {Button,Icon,IconButton,Input,Spinner} from './core.js';
import {Reveal} from './reveal.js';
import {useControllableValue} from './state.js';
import {createTreeSelectIndex,filterTreeSelectItems,getTreeSelectStates,mergeTreeSelectChildren,type TreeSelectChildrenLoader,type TreeSelectIndexItem,type TreeSelectNode} from './tree-select-state.js';

export type {TreeSelectNode,TreeSelectLoadRequest,TreeSelectChildrenLoader} from './tree-select-state.js';
export interface TreeSelectProps {
  label:string;nodes:readonly TreeSelectNode[];
  /** Formats the selected trigger text; full labels remain in its title. */
  formatValue?:(labels:readonly string[])=>string;
  /** Canonical leaf IDs. Unknown IDs remain selected until the host or user removes them. */
  value?:readonly string[];defaultValue?:readonly string[];onValueChange?:(values:string[])=>void;
  /** Parent actions affect loaded enabled leaves only; future children are never auto-selected. */
  loadChildren?:TreeSelectChildrenLoader;
  /** Replace nodes, this key or the loader to invalidate requests and locally loaded children. */
  sourceKey?:string;
  expandedIds?:readonly string[];defaultExpandedIds?:readonly string[];onExpandedChange?:(ids:string[])=>void;
  open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void;onOpenChangeComplete?:(open:boolean)=>void;
  name?:string;form?:string;disabled?:boolean;readOnly?:boolean;
  /** Announces required choice; the host validates this button field when submitting. */
  required?:boolean;
  placeholder?:string;hint?:string;error?:string;clearable?:boolean;searchable?:boolean;emptyMessage?:string;
  inputRef?:Ref<HTMLButtonElement>;onBlur?:FocusEventHandler<HTMLButtonElement>;
  density?:'comfortable'|'compact';labelVisibility?:'visible'|'hidden';className?:string;
  /** Non-reserved data-* metadata on the real popup, for composed editor ownership. */
  popupDataAttributes?:Record<`data-${string}`,string|number|boolean|undefined>;
}
interface SourceState {scope:object;children:Map<string,readonly TreeSelectNode[]>;loading:Set<string>;errors:Map<string,string>}
function emptySource(scope:object):SourceState{return {scope,children:new Map(),loading:new Set(),errors:new Map()};}
function safePopupData(attributes:TreeSelectProps['popupDataAttributes']){
  const reserved=new Set(['data-open','data-closed','data-side','data-align','data-starting-style','data-ending-style','data-instant']);
  return Object.fromEntries(Object.entries(attributes??{}).filter(([key,value])=>/^data-[a-z0-9]+(?:[-_.:][a-z0-9]+)*$/.test(key)&&!reserved.has(key)&&['string','number','boolean'].includes(typeof value)));
}
function snapshotChildren(nodes:readonly TreeSelectNode[]):readonly TreeSelectNode[]{
  return nodes.map(node=>({...node,searchTerms:node.searchTerms?[...node.searchTerms]:undefined,children:node.children?snapshotChildren(node.children):undefined}));
}

/** Checked hierarchy with leaf values, bounded lazy data and native repeated form entries. */
export function TreeSelect({label,nodes,formatValue,value,defaultValue=[],onValueChange,loadChildren,sourceKey='',expandedIds,defaultExpandedIds=[],onExpandedChange,open,defaultOpen=false,onOpenChange,onOpenChangeComplete,name,form,disabled=false,readOnly=false,required=false,placeholder='Choose items…',hint,error,clearable=true,searchable=true,emptyMessage='No matching choices.',inputRef,onBlur,density='comfortable',labelVisibility='visible',className,popupDataAttributes}:TreeSelectProps){
  const {direction,message}=useUIConfig(),id=useId(),owner=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement|null>(null),search=useRef<HTMLInputElement>(null),popup=useRef<HTMLDivElement>(null),tree=useRef<HTMLUListElement>(null),elements=useRef(new Map<string,HTMLLIElement>());
  const initial=useRef(defaultValue),[internal,setInternal]=useState<readonly string[]>(defaultValue),[expanded,setExpanded]=useControllableValue<readonly string[]>(expandedIds,defaultExpandedIds,ids=>onExpandedChange?.([...ids]));
  const [opened,setOpened]=useControllableValue(open,defaultOpen,onOpenChange),[query,setQuery]=useState(''),[focused,setFocused]=useState<string|null>(null),[announcement,setAnnouncement]=useState('');
  const scope=useMemo(()=>({}),[nodes,loadChildren,sourceKey]),currentScope=useRef(scope);currentScope.current=scope;
  const [source,setSource]=useState<SourceState>(()=>emptySource(scope));const activeSource=source.scope===scope?source:emptySource(scope);
  const requests=useRef(new Map<string,{controller:AbortController;scope:object}>());
  const merged=useMemo(()=>mergeTreeSelectChildren(nodes,activeSource.children),[nodes,activeSource.children]),index=useMemo(()=>createTreeSelectIndex(merged),[merged]);
  const committed=value??internal,values=useMemo(()=>[...new Set(Array.isArray(committed)?committed.filter((item:unknown):item is string=>typeof item==='string'&&item.length>0):[])],[committed]),selected=useMemo(()=>new Set(values),[values]);
  const states=useMemo(()=>getTreeSelectStates(index,selected),[index,selected]),filtered=useMemo(()=>filterTreeSelectItems(index,query),[index,query]),expandedSet=new Set(expanded);
  const nodeIds=useMemo(()=>new Map(index.items.map((item,at)=>[item.node.id,id+'-node-'+at])),[index,id]);
  const popupOpen=!!opened&&!disabled&&!index.error;
  const visible:TreeSelectIndexItem[]=[],visibleIds=new Set<string>();
  for(const item of index.items){const shown=(!filtered||filtered.has(item.node.id))&&(item.parentId===null||(visibleIds.has(item.parentId)&&(!!filtered||expandedSet.has(item.parentId))));if(shown){visible.push(item);visibleIds.add(item.node.id);}}
  const enabled=visible.filter(item=>!item.disabled),enabledIds=new Set(enabled.map(item=>item.node.id)),previousVisible=useRef(visible),previousIndex=useRef(index),focusWithin=useRef(false),typeahead=useRef({text:'',at:0});
  let activeId=focused&&enabledIds.has(focused)?focused:null;
  if(!activeId&&focused){
    let parent=index.byId.get(focused)?.parentId??previousIndex.current.byId.get(focused)?.parentId;
    while(parent){if(enabledIds.has(parent)){activeId=parent;break;}parent=index.byId.get(parent)?.parentId??previousIndex.current.byId.get(parent)?.parentId;}
    if(!activeId){const at=previousVisible.current.findIndex(item=>item.node.id===focused);activeId=enabled[Math.min(Math.max(0,at),enabled.length-1)]?.node.id??null;}
  }
  activeId??=enabled[0]?.node.id??null;

  useEffect(()=>{
    const target=form?owner.current?.ownerDocument.getElementById(form):owner.current?.closest('form');if(!(target instanceof HTMLFormElement))return;
    const timers=new Set<number>();let active=true;
    const reset=(event:Event)=>{const timer=window.setTimeout(()=>{timers.delete(timer);if(!active||event.defaultPrevented)return;if(value===undefined)setInternal(initial.current);setQuery('');setAnnouncement('');},0);timers.add(timer);};
    target.addEventListener('reset',reset);return()=>{active=false;target.removeEventListener('reset',reset);for(const timer of timers)window.clearTimeout(timer);};
  },[form,value===undefined]);
  useEffect(()=>{const outside=(event:FocusEvent)=>{if(!tree.current?.contains(event.target as Node))focusWithin.current=false;};document.addEventListener('focusin',outside);return()=>document.removeEventListener('focusin',outside);},[]);
  useLayoutEffect(()=>{
    if(activeId!==focused){setFocused(activeId);const current=document.activeElement;if(focusWithin.current&&(current===document.body||tree.current?.contains(current))){if(activeId)elements.current.get(activeId)?.focus({preventScroll:true});else tree.current?.focus({preventScroll:true});}}
    previousVisible.current=visible;previousIndex.current=index;
  },[activeId,focused,index,visible]);
  useEffect(()=>{
    for(const request of requests.current.values())request.controller.abort();requests.current.clear();
    setSource(previous=>previous.scope===scope?previous:emptySource(scope));
    return()=>{for(const request of requests.current.values())request.controller.abort();requests.current.clear();};
  },[scope]);
  useEffect(()=>{
    if(popupOpen)return;for(const request of requests.current.values())request.controller.abort();requests.current.clear();
    setSource(previous=>previous.scope===scope&&previous.loading.size?{...previous,loading:new Set()}:previous);
  },[popupOpen,scope]);
  const expandedKey=JSON.stringify(expanded);
  useEffect(()=>{if(!popupOpen)return;for(const key of expanded){const item=index.byId.get(key);if(item?.branch&&item.node.children===undefined&&!activeSource.errors.has(key))requestChildren(item);}},[popupOpen,scope,expandedKey]);
  useEffect(()=>{if(disabled&&opened)setOpened(false);},[disabled]);

  function focusItem(next:string|null){if(!next||!enabledIds.has(next))return;setFocused(next);elements.current.get(next)?.focus({preventScroll:true});}
  function change(next:string[],message:string){
    if(disabled||readOnly||trigger.current?.matches(':disabled'))return;const result=[...new Set(next)];
    if(result.length===values.length&&result.every((item,at)=>item===values[at]))return;
    if(value===undefined)setInternal(result);onValueChange?.(result);setAnnouncement(message);
  }
  function changeOpen(next:boolean){if(next&&(disabled||index.error||trigger.current?.matches(':disabled')))return;if(!next){setQuery('');focusWithin.current=false;}setOpened(next);}
  function requestChildren(item:TreeSelectIndexItem){
    const key=item.node.id;if(!loadChildren||disabled||item.disabled||!item.branch||item.node.children!==undefined||requests.current.has(key))return;
    const controller=new AbortController(),request={controller,scope};requests.current.set(key,request);
    setSource(previous=>{const state=previous.scope===scope?previous:emptySource(scope),loading=new Set(state.loading),errors=new Map(state.errors);loading.add(key);errors.delete(key);return {...state,loading,errors};});
    void Promise.resolve().then(()=>loadChildren({id:key,node:item.node,signal:controller.signal})).then(children=>{
      if(controller.signal.aborted||currentScope.current!==scope||requests.current.get(key)!==request)return;
      const returned=createTreeSelectIndex(children);if(returned.error)throw new Error(returned.error);
      const snapshot=snapshotChildren(children);
      setSource(previous=>{
        if(currentScope.current!==scope||controller.signal.aborted)return previous;
        const state=previous.scope===scope?previous:emptySource(scope),loaded=new Map(state.children);loaded.set(key,snapshot);
        const candidate=createTreeSelectIndex(mergeTreeSelectChildren(nodes,loaded));
        if(candidate.error){const errors=new Map(state.errors);errors.set(key,'Loaded choices are invalid. Try again.');return {...state,errors};}
        return {...state,children:loaded};
      });
    }).catch(()=>{
      if(controller.signal.aborted||currentScope.current!==scope||requests.current.get(key)!==request)return;
      setSource(previous=>{const state=previous.scope===scope?previous:emptySource(scope),errors=new Map(state.errors);errors.set(key,'Choices could not be loaded. Try again.');return {...state,errors};});
    }).finally(()=>{
      if(requests.current.get(key)!==request)return;requests.current.delete(key);if(currentScope.current!==scope)return;
      setSource(previous=>{if(previous.scope!==scope)return previous;const loading=new Set(previous.loading);loading.delete(key);return {...previous,loading};});
    });
  }
  function toggleExpansion(item:TreeSelectIndexItem){
    if(disabled||item.disabled||!item.branch||filtered)return;
    if(expandedSet.has(item.node.id))setExpanded(expanded.filter(key=>key!==item.node.id));else{setExpanded([...expanded,item.node.id]);requestChildren(item);}
  }
  function choose(item:TreeSelectIndexItem){
    if(disabled||readOnly||item.disabled)return;const state=states.get(item.node.id)!;
    if(!state.leafIds.length){if(item.branch){if(!expandedSet.has(item.node.id))setExpanded([...expanded,item.node.id]);requestChildren(item);setAnnouncement(item.node.children===undefined?'Load '+item.node.label+' choices before selecting.':'This branch has no selectable choices.');}return;}
    const remove=state.leafIds.every(key=>selected.has(key));
    change(remove?values.filter(key=>!state.leafIds.includes(key)):[...values,...state.leafIds.filter(key=>!selected.has(key))],(remove?'Removed ':'Selected ')+state.leafIds.length+' loaded '+(state.leafIds.length===1?'choice.':'choices.'));
  }
  function keydown(event:KeyboardEvent<HTMLLIElement>,item:TreeSelectIndexItem){
    if(event.target!==event.currentTarget||disabled||item.disabled||event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing||event.keyCode===229)return;
    const at=enabled.findIndex(entry=>entry.node.id===item.node.id),key=event.key;
    if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Enter',' '].includes(key)){
      event.preventDefault();event.stopPropagation();typeahead.current.text='';
      if(key==='ArrowDown')focusItem(enabled[Math.min(at+1,enabled.length-1)]?.node.id??null);
      else if(key==='ArrowUp')focusItem(enabled[Math.max(at-1,0)]?.node.id??null);
      else if(key==='Home')focusItem(enabled[0]?.node.id??null);
      else if(key==='End')focusItem(enabled.at(-1)?.node.id??null);
      else if(key===' '||key==='Enter'&&!item.branch)choose(item);
      else if(key==='Enter')toggleExpansion(item);
      else if(key===(direction==='rtl'?'ArrowLeft':'ArrowRight')&&item.branch){if(!expandedSet.has(item.node.id)&&!filtered)toggleExpansion(item);else if(item.node.children===undefined)requestChildren(item);else focusItem(visible.find(entry=>entry.parentId===item.node.id&&!entry.disabled)?.node.id??null);}
      else if(key===(direction==='rtl'?'ArrowRight':'ArrowLeft')){if(item.branch&&expandedSet.has(item.node.id)&&!filtered)toggleExpansion(item);else focusItem(item.parentId);}
      return;
    }
    if(key.length===1&&key.trim()){
      event.preventDefault();const now=performance.now(),previous=now-typeahead.current.at<600?typeahead.current.text:'',candidate=previous+key,text=[...candidate.toLocaleLowerCase()].every(character=>character===key.toLocaleLowerCase())?key:candidate;typeahead.current={text,at:now};
      for(let offset=1;offset<=enabled.length;offset++){const match=enabled[(at+offset)%enabled.length];if(match.node.label.toLocaleLowerCase().startsWith(text.toLocaleLowerCase())){focusItem(match.node.id);break;}}
    }
  }
  function renderNodes(siblings:readonly TreeSelectNode[]):ReactNode{
    const shown=siblings.filter(node=>!filtered||filtered.has(node.id));
    return shown.map((node,position)=>{
      const item=index.byId.get(node.id);if(!item)return null;
      const state=states.get(node.id)!,unavailable=disabled||item.disabled,showChildren=item.branch&&(!!filtered||expandedSet.has(node.id)),loading=activeSource.loading.has(node.id),loadError=activeSource.errors.get(node.id),nodeId=nodeIds.get(node.id)!,statusId=nodeId+'-status';
      const status=loading?'Loading choices.':loadError?'Choices could not be loaded. Press Right Arrow to retry.':state.incomplete?'Parent actions affect loaded choices only. More choices may load when expanded.':item.branch&&!state.leafIds.length?'No selectable choices in this branch.':'';
      return <li key={node.id} ref={element=>{if(element)elements.current.set(node.id,element);else elements.current.delete(node.id);}} role="treeitem" tabIndex={!unavailable&&activeId===node.id?0:-1} aria-label={node.label} aria-level={item.level} aria-posinset={position+1} aria-setsize={shown.length} aria-expanded={item.branch?showChildren:undefined} aria-checked={state.checked} aria-disabled={unavailable||undefined} aria-busy={loading||undefined} aria-describedby={[node.description&&nodeId+'-description',status&&statusId].filter(Boolean).join(' ')||undefined} className="bui-tree-select-item" data-checked={state.checked} data-disabled={unavailable||undefined} data-expanded={showChildren||undefined} data-readonly={readOnly||undefined} style={{'--bui-tree-select-depth':item.level-1} as CSSProperties} onFocus={event=>{if(event.target===event.currentTarget&&!unavailable){focusWithin.current=true;setFocused(node.id);}}} onKeyDown={event=>keydown(event,item)}>
        <div className="bui-tree-select-row" onClick={()=>{if(unavailable)return;focusItem(node.id);choose(item);}}>
          <span className="bui-tree-select-disclosure" data-branch={item.branch||undefined} aria-hidden="true" onClick={event=>{if(!item.branch)return;event.stopPropagation();focusItem(node.id);toggleExpansion(item);}}>{item.branch&&<Icon icon={ChevronRight} size={14}/>}</span>
          <span className="bui-tree-select-check" aria-hidden="true"><Icon icon={Check} size={13} className="bui-tree-select-tick"/><Icon icon={Minus} size={13} className="bui-tree-select-mixed"/></span>
          {node.icon?<Icon icon={node.icon} size={17} className="bui-tree-select-node-icon"/>:item.branch?<Icon icon={showChildren?FolderOpen:Folder} size={17} className="bui-tree-select-node-icon"/>:null}
          <span className="bui-tree-select-copy"><span className="bui-tree-select-label">{node.label}</span>{node.description&&<small id={nodeId+'-description'}>{node.description}</small>}</span>{loading&&<Spinner/>}
        </div>
        {status&&<span id={statusId} className="bui-sr-only">{status}</span>}
        <Reveal open={showChildren&&!!loadError}><div className="bui-tree-select-feedback"><p role="alert" className="bui-error">{loadError}</p><Button size="sm" variant="secondary" tabIndex={-1} onClick={()=>{focusItem(node.id);requestChildren(item);}}>Retry {node.label}</Button></div></Reveal>
        {item.branch&&node.children!==undefined&&!node.children.length&&showChildren&&<p className="bui-tree-select-empty bui-hint" role="status">No choices in {node.label}.</p>}
        {item.branch&&node.children===undefined&&showChildren&&!loading&&!loadError&&<p className="bui-tree-select-empty bui-hint">{loadChildren?'Press Right Arrow to load choices.':'Children are not available. The host must provide them.'}</p>}
        <Reveal open={showChildren&&!!node.children?.length} className="bui-tree-select-group"><ul role="group">{node.children&&renderNodes(node.children)}</ul></Reveal>
      </li>;
    });
  }
  const labels=values.map(key=>index.byId.get(key)?.node.label??key),summary=labels.length?(formatValue?formatValue(labels):labels.slice(0,2).join(', ')+(labels.length>2?' +'+(labels.length-2):'')):placeholder,problem=error||index.error;
  const described=[id+'-value',hint&&id+'-hint',required&&id+'-required',readOnly&&id+'-readonly',problem&&id+'-error'].filter(Boolean).join(' '),unknown=values.filter(key=>!index.byId.has(key));
  return <div ref={owner} className={'bui-field bui-tree-select'+(className?' '+className:'')} data-disabled={disabled||undefined} data-readonly={readOnly||undefined}>
    <label id={id+'-label'} htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Popover.Root open={popupOpen} onOpenChange={changeOpen} onOpenChangeComplete={onOpenChangeComplete}>
      <div className="bui-tree-select-control" data-invalid={!!problem||undefined} data-density={density}>
        <Popover.Trigger render={<Button id={id} form={form} ref={element=>{trigger.current=element;if(typeof inputRef==='function')inputRef(element);else if(inputRef)inputRef.current=element;}} variant="secondary" className="bui-tree-select-trigger" disabled={disabled||!!index.error} aria-labelledby={id+'-label'} aria-describedby={described} aria-invalid={!!problem||undefined} onBlur={onBlur}><span id={id+'-value'} title={labels.join(', ')} data-placeholder={!values.length||undefined}>{summary}</span><Icon icon={ChevronDown} size={16}/></Button>}/>
        {clearable&&values.length>0&&!readOnly&&<IconButton icon={X} label={'Clear '+label.toLowerCase()} className="bui-tree-select-clear" variant="ghost" disabled={disabled} onClick={()=>{change([],'Cleared all choices.');trigger.current?.focus({preventScroll:true});}}/>}
      </div>
      <UIPortal render={Popover.Portal}><Popover.Positioner sideOffset={6} align="start" collisionPadding={12} sticky collisionAvoidance={{side:'shift',align:'shift'}} className="bui-positioner"><Popover.Popup {...safePopupData(popupDataAttributes)} ref={popup} className="bui-popup bui-tree-select-popup" initialFocus={interaction=>interaction==='touch'?popup.current:search.current??tree.current}>
        <Popover.Title className="bui-sr-only">{label} choices</Popover.Title>
        {searchable&&<Input ref={search} type="search" aria-label={message('searchChoices','Search {label} choices',{label:label.toLowerCase()})} placeholder="Search choices…" value={query} maxLength={1000} onChange={event=>{focusWithin.current=false;setQuery(event.target.value);}} onKeyDown={event=>{if(event.nativeEvent.isComposing||event.keyCode===229)return;if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Enter'){const target=event.key==='ArrowUp'?enabled.at(-1):enabled[0];if(target){event.preventDefault();focusItem(target.node.id);}}}}/>}
        <p id={id+'-keys'} className="bui-sr-only">Arrow keys move and expand branches. Space selects loaded choices. Enter opens a branch or selects a leaf. Escape closes.{query?' Search keeps matching branches open; clear search to collapse them.':''}</p>
        <ul ref={tree} role="tree" aria-label={label+' choices'} aria-multiselectable="true" aria-describedby={id+'-keys'} tabIndex={!activeId?0:-1} className="bui-tree-select-tree" onFocusCapture={()=>{focusWithin.current=true;}}>{renderNodes(Array.isArray(merged)?merged:[])}</ul>
        {!visible.length&&<p role="status" className="bui-tree-select-empty bui-hint">{query?emptyMessage:'No choices available.'}</p>}
        <div className="bui-tree-select-footer"><span className="bui-hint">{message('selectedCount','{count} selected',{count:values.length})}{unknown.length?' · '+unknown.length+' unavailable kept':''}</span><Popover.Close render={<Button variant="ghost" size="sm">{message('done','Done')}</Button>}/></div>
        {(loadChildren||index.items.some(item=>item.branch&&item.node.children===undefined))&&<p className="bui-tree-select-contract bui-hint">Parents select loaded choices only. New children stay unselected.</p>}
        <span className="bui-sr-only" role="status" aria-live="polite">{announcement}</span>
      </Popover.Popup></Popover.Positioner></UIPortal>
    </Popover.Root>
    {name&&values.map(key=><input type="hidden" key={key} name={name} form={form} value={key} disabled={disabled}/>)}
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{required&&<p id={id+'-required'} className="bui-sr-only">Choose at least one item. The application checks this requirement on submission.</p>}{readOnly&&<p id={id+'-readonly'} className="bui-sr-only">Read only. Selections cannot be changed.</p>}{problem&&<p id={id+'-error'} className="bui-error" role="alert">{problem}</p>}
  </div>;
}
