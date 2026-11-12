/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId,useMemo,useRef,type Ref,type FocusEventHandler,type ReactNode} from 'react';
import {Combobox} from '@base-ui/react/combobox';
import {Icon,type Option} from './core.js';
import {useControllableValue} from './state.js';
import {ChoiceComboboxList,ChoiceComboboxPopup,groupChoiceOptions,choiceSearchText,useChoiceValue} from './choice-option.js';

export interface MultiSelectProps {
  label:string;
  /** Stable, unique values. Rich labels never replace submitted IDs. */
  options:readonly Option[];
  value?:string[]; defaultValue?:string[]; onValueChange?:(value:string[])=>void;
  placeholder?:string; hint?:string; error?:string; name?:string; form?:string; disabled?:boolean; required?:boolean;
  inputRef?:Ref<HTMLInputElement>; onBlur?:FocusEventHandler<HTMLInputElement>;
  labelVisibility?:'visible'|'hidden'; density?:'comfortable'|'compact'; clearable?:boolean;
  open?:boolean; defaultOpen?:boolean; onOpenChange?:(open:boolean)=>void; onOpenChangeComplete?:(open:boolean)=>void;
  /** A presentational row body; do not add nested interactive elements. */
  renderOption?:(option:Option)=>ReactNode;
  emptyMessage?:string;
}
export function MultiSelect({label,options,value,defaultValue=[],onValueChange,placeholder='Choose options…',hint,error,inputRef,onBlur,labelVisibility='visible',density='comfortable',clearable=false,open,defaultOpen=false,onOpenChange,onOpenChangeComplete,renderOption,emptyMessage='No matching options.',...props}:MultiSelectProps) {
  const id=useId(),input=useRef<HTMLInputElement|null>(null),root=useRef<HTMLDivElement>(null),actions=useRef<Combobox.Root.Actions|null>(null);
  const [selected,setSelected]=useChoiceValue(value,defaultValue,onValueChange,root,props.form),[expanded,setExpanded]=useControllableValue(open,defaultOpen,onOpenChange),popupOpen=expanded&&!props.disabled;
  const grouped=useMemo(()=>groupChoiceOptions(options).map(group=>({label:group.label||'',items:group.options.map(option=>option.value)})),[options]);
  const lookup=new Map(options.map(option=>[option.value,option])),labelFor=(value:string)=>lookup.get(value)?.label??value;
  const {contains}=Combobox.useFilter({multiple:true});
  const descriptions=[hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  return <div ref={root} className="bui-field bui-local-choice"><label htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{props.required&&<span aria-hidden="true"> *</span>}</label>
    <Combobox.Root<string,true> multiple actionsRef={actions} items={grouped} value={selected} onValueChange={(values,details)=>{if(details.reason==='escape-key'){details.cancel();return;}setSelected(values);}} itemToStringLabel={labelFor} itemToStringValue={value=>value} filter={(item,query)=>query.trim().split(/\s+/).filter(Boolean).every(term=>contains(choiceSearchText(lookup.get(item)),term))} {...props} open={popupOpen} onOpenChange={setExpanded} onOpenChangeComplete={onOpenChangeComplete}>
      <Combobox.Chips className="bui-multi-input bui-local-multi" data-invalid={!!error||undefined} data-density={density} data-clearable={clearable&&selected.length>0||undefined}>
        <Combobox.Value>{(values:string[])=>values.map(value=><Combobox.Chip key={value} className="bui-chip"><span className="bui-chip-label" title={labelFor(value)}>{labelFor(value)}</span><Combobox.ChipRemove aria-label={'Remove '+labelFor(value)}><Icon name="close" size={14}/></Combobox.ChipRemove></Combobox.Chip>)}</Combobox.Value>
        <Combobox.Input ref={node=>{input.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={event=>{onBlur?.(event);if(event.relatedTarget&&!event.currentTarget.closest('.bui-local-choice')?.contains(event.relatedTarget as Node))setExpanded(false);}} onKeyDown={event=>{if(event.key==='Tab')setExpanded(false);if(event.key==='Escape'&&!popupOpen)event.preventBaseUIHandler();}} id={id} aria-describedby={descriptions} aria-invalid={!!error||undefined} placeholder={selected.length?'Add another…':placeholder} className="bui-chip-input"/>
        {clearable&&selected.length>0&&<button type="button" className="bui-combobox-clear" aria-label={'Clear '+label.toLowerCase()} disabled={props.disabled} onClick={()=>{setSelected([]);input.current?.focus({preventScroll:true});}}><Icon name="close"/></button>}
        <Combobox.Trigger className="bui-combobox-trigger" aria-label={'Show '+label.toLowerCase()+' options'}><Icon name="chevron"/></Combobox.Trigger>
      </Combobox.Chips>
      <ChoiceComboboxPopup open={popupOpen} actions={actions} onOpenChangeComplete={onOpenChangeComplete}><Combobox.Empty className="bui-combo-empty">{emptyMessage}</Combobox.Empty><ChoiceComboboxList options={options} label={label} id={id} renderOption={renderOption}/></ChoiceComboboxPopup>
    </Combobox.Root>
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{error&&<p id={id+'-error'} className="bui-error" role="alert">{error}</p>}
  </div>;
}
