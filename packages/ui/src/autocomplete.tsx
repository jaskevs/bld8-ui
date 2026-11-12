/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type ComponentProps,type ReactNode,type Ref} from 'react';
import {Autocomplete as AutocompletePrimitive} from '@base-ui/react/autocomplete';

/** IDs identify suggestions; labels are the text inserted into the native input. */
export interface AutocompleteOption {
  id:string;
  label:string;
  description?:string;
  group?:string;
  searchTerms?:readonly string[];
  disabled?:boolean;
}
export interface AutocompleteProps extends Omit<ComponentProps<'input'>,'value'|'defaultValue'|'onChange'|'children'|'size'> {
  label:string;
  options:readonly AutocompleteOption[];
  /** Free text, including values absent from the suggestions. */
  value?:string;
  defaultValue?:string;
  onValueChange?:(value:string)=>void;
  hint?:string;
  error?:string;
  inputRef?:Ref<HTMLInputElement>;
  density?:'comfortable'|'compact';
  clearable?:boolean;
  emptyText?:string;
  /** null preserves externally filtered suggestions, for example remote search results. */
  filter?:((option:AutocompleteOption,query:string)=>boolean)|null;
  /** Bounds rendered suggestions to 1–100. Defaults to 50. This is not virtualization. */
  maxSuggestions?:number;
  /** The host supplies loading state, request cancellation, errors and retry actions. */
  loading?:boolean;
  loadingText?:string;
  /** Keep custom suggestion content presentational; the accessible label remains option.label. */
  renderOption?:(option:AutocompleteOption)=>ReactNode;
}
function setRef(ref:Ref<HTMLInputElement>|undefined,node:HTMLInputElement|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}

/**
 * A native text field with optional suggestions, rather than an ID-valued choice.
 * Native required, pattern and type constraints apply to the actual text input.
 * The host owns domain validation, service requests and controlled form resets.
 */
export function Autocomplete({label,options,value,defaultValue='',onValueChange,hint,error,inputRef,ref,density='comfortable',clearable=true,emptyText='No suggestions. You can keep typing.',filter,maxSuggestions=50,loading=false,loadingText='Loading suggestions…',renderOption,id:suppliedId,name,form,required,disabled,readOnly,className,autoComplete='off',...inputProps}:AutocompleteProps){
  const generated=useId(),id=suppliedId||generated,input=useRef<HTMLInputElement|null>(null),initial=useRef(defaultValue),actions=useRef<{unmount:()=>void}|null>(null);
  const [internal,setInternal]=useState(defaultValue),[open,setOpen]=useState(false);
  const uncontrolled=value===undefined,current=value===undefined?internal:value;
  const change=(next:string)=>{if(disabled||readOnly)return;if(uncontrolled)setInternal(next);onValueChange?.(next);};
  const {contains}=AutocompletePrimitive.useFilter();
  const groups=useMemo(()=>{
    const grouped=new Map<string,{label:string;items:AutocompleteOption[]}>();
    for(const option of options){const group=option.group?.trim()||'';let entry=grouped.get(group);if(!entry){entry={label:group,items:[]};grouped.set(group,entry);}entry.items.push(option);}
    return [...grouped.values()];
  },[options]);
  const limit=Number.isFinite(maxSuggestions)?Math.max(1,Math.min(100,Math.floor(maxSuggestions))):50;
  const attach=useCallback((node:HTMLInputElement|null)=>{input.current=node;setRef(ref,node);setRef(inputRef,node);},[ref,inputRef]);
  useEffect(()=>{
    const owner=input.current?.form;if(!owner||!uncontrolled)return;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{
      // Observe preventDefault after React's delegated form onReset has run.
      const timer=setTimeout(()=>{timers.delete(timer);if(!event.defaultPrevented){setInternal(initial.current);setOpen(false);}},0);timers.add(timer);
    };
    owner.addEventListener('reset',reset);return()=>{owner.removeEventListener('reset',reset);for(const timer of timers)clearTimeout(timer);};
  },[form,uncontrolled]);
  useEffect(()=>{if(disabled||readOnly)setOpen(false);},[disabled,readOnly]);
  const description=[hint&&id+'-hint',error&&id+'-error',inputProps['aria-describedby']].filter(Boolean).join(' ')||undefined;
  // Item onClick is the public pointer/Enter acceptance hook. Cancel the upstream
  // fill path so the nonmodal shell can commit exactly one literal text value.
  const renderItem=(option:AutocompleteOption)=><AutocompletePrimitive.Item key={option.id} value={option} disabled={option.disabled} aria-label={option.label} aria-describedby={option.description?id+'-suggestion-'+encodeURIComponent(option.id):undefined} className="bui-autocomplete-option" data-suggestion-id={option.id} onClick={event=>{event.preventBaseUIHandler();if(option.disabled||disabled||readOnly)return;change(option.label);setOpen(false);input.current?.focus();}}>
    <span className="bui-autocomplete-option-copy"><span className="bui-autocomplete-option-label">{renderOption?renderOption(option):option.label}</span>{option.description&&<small id={id+'-suggestion-'+encodeURIComponent(option.id)} className="bui-autocomplete-option-description">{option.description}</small>}</span>
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="bui-autocomplete-option-arrow"><path d="M12 3v6H4m3-3L4 9l3 3"/></svg>
  </AutocompletePrimitive.Item>;
  return <div className={['bui-field','bui-autocomplete',className].filter(Boolean).join(' ')} data-disabled={disabled||undefined} data-readonly={readOnly||undefined}>
    <label className="bui-label" htmlFor={id}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <AutocompletePrimitive.Root actionsRef={actions} items={groups} itemToStringValue={option=>option.label} value={current} onValueChange={change} name={name} form={form} required={required} disabled={disabled} readOnly={readOnly} open={open&&!disabled&&!readOnly} onOpenChange={setOpen} openOnInputClick filter={filter===undefined?(option,query)=>contains([option.label,option.description,option.group,...(option.searchTerms??[])].filter(Boolean).join(' '),query):filter} limit={limit}>
      <AutocompletePrimitive.InputGroup className="bui-autocomplete-input-group">
        <AutocompletePrimitive.Input {...inputProps} ref={attach} id={id} autoComplete={autoComplete} aria-invalid={error?true:inputProps['aria-invalid']} aria-describedby={description} aria-busy={loading||undefined} data-density={density} className="bui-input bui-autocomplete-input" onBlur={event=>{inputProps.onBlur?.(event);if(!event.currentTarget.closest('.bui-autocomplete-input-group')?.contains(event.relatedTarget as Node|null))setOpen(false);}} onKeyDown={event=>{inputProps.onKeyDown?.(event);if(event.nativeEvent.isComposing||event.keyCode===229){event.preventBaseUIHandler();return;}if(!event.defaultPrevented&&event.key==='Tab')setOpen(false);}}/>
        {clearable&&!disabled&&!readOnly&&<AutocompletePrimitive.Clear aria-label={'Clear '+label} className="bui-autocomplete-clear"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></AutocompletePrimitive.Clear>}
      </AutocompletePrimitive.InputGroup>
      <AutocompletePrimitive.Portal><AutocompletePrimitive.Positioner className="bui-autocomplete-positioner" sideOffset={6} collisionPadding={12} disableAnchorTracking={!open} render={(positioner,state)=><div {...positioner}><AutocompletePopupShell open={open} side={state.side} unmount={()=>actions.current?.unmount()}>
          {loading&&<AutocompletePrimitive.Status className="bui-autocomplete-status">{loadingText}</AutocompletePrimitive.Status>}
          <AutocompletePrimitive.Empty className="bui-autocomplete-empty">{loading?loadingText:emptyText}</AutocompletePrimitive.Empty>
          <AutocompletePrimitive.List className="bui-autocomplete-list" aria-label={label+' suggestions'}>{(group:{label:string;items:AutocompleteOption[]})=>group.label?<AutocompletePrimitive.Group key={group.label} items={group.items} className="bui-autocomplete-group"><AutocompletePrimitive.GroupLabel className="bui-autocomplete-group-label">{group.label}</AutocompletePrimitive.GroupLabel><AutocompletePrimitive.Collection>{renderItem}</AutocompletePrimitive.Collection></AutocompletePrimitive.Group>:group.items.map(renderItem)}</AutocompletePrimitive.List>
        </AutocompletePopupShell></div>}/>
      </AutocompletePrimitive.Portal>
    </AutocompletePrimitive.Root>
    {hint&&<p className="bui-hint" id={id+'-hint'}>{hint}</p>}
    {error&&<p className="bui-error" id={id+'-error'} role="alert">{error}</p>}
  </div>;
}

/** Outside-input suggestions retain normal page focus and never hide unrelated controls. */
function AutocompletePopupShell({open,side,unmount,children}:{open:boolean;side:string;unmount:()=>void;children:ReactNode}){
  const element=useRef<HTMLDivElement>(null),complete=useRef(unmount);complete.current=unmount;
  const [starting,setStarting]=useState(open);
  useLayoutEffect(()=>{if(!starting)return;void element.current?.getBoundingClientRect();const frame=requestAnimationFrame(()=>setStarting(false));return()=>cancelAnimationFrame(frame);},[starting]);
  useLayoutEffect(()=>{
    if(starting||open||!element.current)return;let active=true;
    const finish=()=>{if(active)complete.current();};
    const wait=()=>{if(!active||!element.current)return;Promise.all(element.current.getAnimations().map(animation=>animation.finished)).then(finish,()=>{if(active)wait();});};
    wait();return()=>{active=false;};
  },[open,starting]);
  return <div ref={element} className="bui-autocomplete-popup" role="presentation" data-side={side} data-starting-style={starting?'':undefined} data-ending-style={!open?'':undefined} aria-hidden={!open||undefined} inert={!open||undefined}>{children}</div>;
}
