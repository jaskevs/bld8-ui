'use client';
import {useId,useRef,useState,type FocusEventHandler,type ReactNode,type Ref} from 'react';
import {Combobox} from '@base-ui/react/combobox';
import {Icon} from './core.js';
import {useControllableValue} from './state.js';
import {useAsyncOptions} from './use-async-options.js';
import {AsyncOptionsPopup,AsyncResolutionFeedback} from './async-selection-parts.js';
import type {AsyncOption,AsyncOptionsLoader,AsyncOptionsResolver} from './async-options.js';

export interface AsyncComboboxProps<T extends AsyncOption=AsyncOption> {
  label:string;loadOptions:AsyncOptionsLoader<T>;resolveOptions?:AsyncOptionsResolver<T>;selectedOptions?:readonly T[];sourceKey?:string;
  value?:string|null;defaultValue?:string|null;onValueChange?:(value:string|null)=>void;
  /** Remote search debounce in milliseconds, from 0 through 1000. */
  debounceMs?:number;minQueryLength?:number;renderOption?:(item:T)=>ReactNode;
  placeholder?:string;name?:string;disabled?:boolean;required?:boolean;clearable?:boolean;hint?:string;error?:string;
  labelVisibility?:'visible'|'hidden';density?:'comfortable'|'compact';inputRef?:Ref<HTMLInputElement>;onBlur?:FocusEventHandler<HTMLInputElement>;
}
/** A remote single-value choice. Values submitted by native forms are stable IDs, never display labels. */
export function AsyncCombobox<T extends AsyncOption=AsyncOption>({label,loadOptions,resolveOptions,selectedOptions,sourceKey,value,defaultValue=null,onValueChange,debounceMs=200,minQueryLength=0,renderOption,placeholder='Search options…',name,disabled=false,required=false,clearable=true,hint,error,labelVisibility='visible',density='comfortable',inputRef,onBlur}:AsyncComboboxProps<T>) {
  const id=useId(),input=useRef<HTMLInputElement|null>(null);
  const [selected,setSelected]=useControllableValue(value,defaultValue,onValueChange),[open,setOpen]=useState(false),[query,setQuery]=useState(''),[typed,setTyped]=useState(''),[editing,setEditing]=useState(false);
  const state=useAsyncOptions({loadOptions,resolveOptions,selectedOptions,selectedValues:selected===null?[]:[selected],sourceKey,query,enabled:open&&!disabled,debounceMs,minQueryLength});
  const labelFor=(value:string)=>state.optionForValue(value)?.label??value;
  const descriptions=[hint&&id+'-hint',error&&id+'-error',(state.resolving||state.resolutionError)&&id+'-resolution'].filter(Boolean).join(' ')||undefined;
  return <div className="bui-field bui-async-selection">
    <label htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Combobox.Root items={state.items.map(item=>item.value)} filter={null} value={selected} inputValue={editing?typed:selected!==null?labelFor(selected):''} itemToStringLabel={labelFor} itemToStringValue={value=>value}
      name={name} disabled={disabled} required={required} open={open&&!disabled} onOpenChange={next=>{setOpen(next);if(!next){setEditing(false);setQuery('');}}}
      onInputValueChange={(next,details)=>{if(details.reason==='input-change'||details.reason==='input-clear'){setEditing(true);setTyped(next.slice(0,1000));setQuery(next.slice(0,1000));}}}
      onValueChange={(next,details)=>{if(details.reason==='escape-key'){details.cancel();return;}setSelected(next);setEditing(false);setTyped('');setQuery('');}}>
      <Combobox.InputGroup className="bui-combobox-input"><Combobox.Input id={id} ref={node=>{input.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={onBlur} className="bui-input" data-density={density} aria-invalid={!!error||undefined} aria-describedby={descriptions} placeholder={placeholder}/>
        {clearable&&selected!==null&&<Combobox.Clear className="bui-combobox-clear" aria-label={'Clear '+label.toLowerCase()}><Icon name="close"/></Combobox.Clear>}
        <Combobox.Trigger className="bui-combobox-trigger" aria-label={'Show '+label.toLowerCase()+' options'}><Icon name="chevron"/></Combobox.Trigger>
      </Combobox.InputGroup>
      <AsyncOptionsPopup {...{state,label,renderOption,input,open,minQueryLength}} selected={selected===null?[]:[selected]}/>
    </Combobox.Root>
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{error&&<p id={id+'-error'} className="bui-error" role="alert">{error}</p>}
    <AsyncResolutionFeedback state={state} input={input} id={id+'-resolution'}/>
  </div>;
}
