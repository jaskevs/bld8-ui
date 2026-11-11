'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Combobox} from '@base-ui/react/combobox';
import {Icon,type Option} from './core.js';

/** Display groups follow first appearance; values retain their order within each group. */
export function groupChoiceOptions(options:readonly Option[]) {
  const groups=new Map<string,{label:string;options:Option[]}>();
  for(const option of options){const label=option.group?.trim()||'';let group=groups.get(label);if(!group){group={label,options:[]};groups.set(label,group);}group.options.push(option);}
  return [...groups.values()];
}
export function choiceSearchText(option:Option|undefined) {
  return option?[option.label,option.description,...(option.searchTerms??[])].filter(Boolean).join(' '):'';
}
export function ChoiceOptionContent({option,label,descriptionId,renderOption}:{option:Option;label:ReactNode;descriptionId?:string;renderOption?:(option:Option)=>ReactNode}) {
  return <>{option.icon&&<Icon icon={option.icon} size={16} className="bui-choice-option-icon"/>}<span className="bui-choice-option-copy">{renderOption?<><span className="bui-sr-only">{label}</span><span className="bui-choice-option-label">{renderOption(option)}</span></>:label}{option.description&&<small id={descriptionId} className="bui-choice-option-description">{option.description}</small>}</span></>;
}
export function ChoiceComboboxList({options,label,id,renderOption}:{options:readonly Option[];label:string;id:string;renderOption?:(option:Option)=>ReactNode}) {
  const lookup=new Map(options.map((option,index)=>[option.value,{option,index}]));
  function renderItem(value:string){const entry=lookup.get(value);if(!entry)return null;const {option,index}=entry,descriptionId=option.description?id+'-option-'+index+'-description':undefined;
    return <Combobox.Item key={value} value={value} aria-label={option.label} aria-describedby={descriptionId} disabled={option.disabled} className="bui-option bui-choice-option"><ChoiceOptionContent option={option} descriptionId={descriptionId} renderOption={renderOption} label={<span className="bui-option-label bui-choice-option-label">{option.label}</span>}/><Combobox.ItemIndicator keepMounted className="bui-choice-indicator"><Icon name="check"/></Combobox.ItemIndicator></Combobox.Item>;
  }
  return <Combobox.List className="bui-choice-list" aria-label={label+' options'}>{(group:{label:string;items:string[]})=>group.label?<Combobox.Group key={group.label} items={group.items} className="bui-choice-group"><Combobox.GroupLabel className="bui-choice-group-label">{group.label}</Combobox.GroupLabel><Combobox.Collection>{renderItem}</Combobox.Collection></Combobox.Group>:group.items.map(renderItem)}</Combobox.List>;
}

/** Reset only the uncontrolled value, without reporting a user change. The native owning form can be external. */
export function useChoiceValue<T>(value:T|undefined,defaultValue:T,onChange:((value:T)=>void)|undefined,owner:RefObject<HTMLElement|null>,form?:string){
  const [internal,setInternal]=useState(defaultValue),initial=useRef(defaultValue);
  const uncontrolled=value===undefined;
  useEffect(()=>{
    const root=owner.current;
    const associated=form?root?.ownerDocument.getElementById(form):undefined;
    const native=root?.querySelector<HTMLInputElement|HTMLSelectElement>('input,select');
    const formElement=associated?.tagName==='FORM'?associated as HTMLFormElement:native?.form;
    if(!uncontrolled||!formElement)return;
    const reset=(event:Event)=>queueMicrotask(()=>{if(!event.defaultPrevented)setInternal(initial.current);});
    formElement.addEventListener('reset',reset);
    return()=>formElement.removeEventListener('reset',reset);
  },[uncontrolled,owner,form]);
  return [value===undefined?internal:value,(next:T)=>{if(uncontrolled)setInternal(next);onChange?.(next);}] as const;
}

interface ChoicePopupProps {open:boolean;actions:RefObject<{unmount:()=>void}|null>;onOpenChangeComplete?:(open:boolean)=>void;children:ReactNode}
/** Outside-input comboboxes keep native input focus and never hide unrelated page controls. */
export function ChoiceComboboxPopup(props:ChoicePopupProps){
  return <Combobox.Portal><Combobox.Positioner className="bui-positioner" sideOffset={6} disableAnchorTracking={!props.open} render={(positioner,state)=><div {...positioner}><ChoicePopupShell {...props} side={state.side}/></div>}/></Combobox.Portal>;
}
function ChoicePopupShell({open,actions,onOpenChangeComplete,children,side}:ChoicePopupProps&{side:string}){
  const element=useRef<HTMLDivElement>(null),callback=useRef(onOpenChangeComplete);callback.current=onOpenChangeComplete;
  const [starting,setStarting]=useState(open);
  useLayoutEffect(()=>{if(!starting)return;void element.current?.getBoundingClientRect();const frame=requestAnimationFrame(()=>setStarting(false));return()=>cancelAnimationFrame(frame);},[starting]);
  useLayoutEffect(()=>{
    if(starting||!element.current)return;
    let active=true;
    const finish=()=>{if(!active)return;if(open)callback.current?.(true);else actions.current?.unmount();};
    const wait=()=>{if(!active||!element.current)return;Promise.all(element.current.getAnimations().map(animation=>animation.finished)).then(finish,()=>{if(active)wait();});};
    wait();return()=>{active=false;};
  },[open,starting,actions]);
  return <div ref={element} className="bui-popup bui-select-popup bui-choice-options bui-choice-shell" role="presentation" data-side={side} data-starting-style={starting?'':undefined} data-ending-style={!open?'':undefined} aria-hidden={!open||undefined} inert={!open||undefined}>{children}</div>;
}
