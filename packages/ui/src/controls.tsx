/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import { useId, useMemo, useRef, type ReactNode, type Ref, type FocusEventHandler } from 'react';
import { Select as PrimitiveSelect } from '@base-ui/react/select';
import { Combobox as PrimitiveCombobox } from '@base-ui/react/combobox';
import { Tabs as PrimitiveTabs } from '@base-ui/react/tabs';
import { Accordion as PrimitiveAccordion } from '@base-ui/react/accordion';
import { Icon, type Option } from './core.js';
import { useControllableValue } from './state.js';
import { ChoiceComboboxList, ChoiceComboboxPopup, ChoiceOptionContent, groupChoiceOptions, choiceSearchText, useChoiceValue } from './choice-option.js';
const noStringItems:readonly string[]=[];

export interface SelectProps {
  label:string;
  /** Stable, unique values; labels and optional rich content are display only. */
  options:readonly Option[];
  value?:string|null; defaultValue?:string|null; onValueChange?:(value:string|null)=>void;
  placeholder?:string; name?:string; form?:string; disabled?:boolean; required?:boolean; clearable?:boolean;
  labelVisibility?:'visible'|'hidden'; density?:'comfortable'|'compact';
  inputRef?:Ref<HTMLButtonElement>; onBlur?:FocusEventHandler<HTMLButtonElement>; hint?:string; error?:string;
  /** Optional controlled popup state, independent of the selected value. */
  open?:boolean; defaultOpen?:boolean; onOpenChange?:(open:boolean)=>void; onOpenChangeComplete?:(open:boolean)=>void;
  /** A presentational row body; do not add nested interactive elements. */
  renderOption?:(option:Option)=>ReactNode;
  emptyMessage?:string;
}
export function Select({label,options,placeholder='Select an option',value,defaultValue=null,onValueChange,clearable=false,labelVisibility='visible',density='comfortable',inputRef,onBlur,hint,error,open,defaultOpen=false,onOpenChange,onOpenChangeComplete,renderOption,emptyMessage='No options available.',...props}:SelectProps) {
  const id=useId(),trigger=useRef<HTMLButtonElement>(null),root=useRef<HTMLDivElement>(null);
  const [selected,setSelected]=useChoiceValue<string|null>(value,defaultValue,onValueChange,root,props.form);
  const [expanded,setExpanded]=useControllableValue(open,defaultOpen,onOpenChange),popupOpen=expanded&&!props.disabled;
  const descriptions=[hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  const groups=groupChoiceOptions(options);
  function renderItem(option:Option){
    const descriptionId=option.description?id+'-option-'+options.indexOf(option)+'-description':undefined;
    return <PrimitiveSelect.Item key={option.value} value={option.value} label={option.label} aria-label={option.label} aria-describedby={descriptionId} disabled={option.disabled} className="bui-option bui-choice-option">
      <ChoiceOptionContent option={option} descriptionId={descriptionId} renderOption={renderOption} label={<PrimitiveSelect.ItemText className="bui-option-label bui-choice-option-label">{option.label}</PrimitiveSelect.ItemText>}/>
      <PrimitiveSelect.ItemIndicator keepMounted className="bui-choice-indicator"><Icon name="check"/></PrimitiveSelect.ItemIndicator>
    </PrimitiveSelect.Item>;
  }
  return <div ref={root} className="bui-field bui-local-choice"><label className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'} htmlFor={id}>{label}{props.required&&<span aria-hidden="true"> *</span>}</label><div className="bui-date-field">
    <PrimitiveSelect.Root<string> items={options} value={selected} onValueChange={setSelected} open={popupOpen} onOpenChange={setExpanded} onOpenChangeComplete={onOpenChangeComplete} {...props}>
      <PrimitiveSelect.Trigger ref={node=>{trigger.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={onBlur} data-field-name={props.name} data-density={density} aria-invalid={!!error||undefined} aria-describedby={descriptions} id={id} className="bui-input bui-select-trigger">
        <PrimitiveSelect.Value placeholder={placeholder}>{selected!==null?options.find(option=>option.value===selected)?.label??selected:undefined}</PrimitiveSelect.Value><PrimitiveSelect.Icon><Icon name="chevron"/></PrimitiveSelect.Icon>
      </PrimitiveSelect.Trigger>
      <PrimitiveSelect.Portal><PrimitiveSelect.Positioner sideOffset={6} alignItemWithTrigger={false} disableAnchorTracking={!popupOpen} className="bui-positioner"><PrimitiveSelect.Popup className="bui-popup bui-select-popup bui-choice-options">
        <PrimitiveSelect.List aria-label={label+' options'}>{groups.length?groups.map(group=>group.label?<PrimitiveSelect.Group key={group.label} className="bui-choice-group"><PrimitiveSelect.GroupLabel className="bui-choice-group-label">{group.label}</PrimitiveSelect.GroupLabel>{group.options.map(renderItem)}</PrimitiveSelect.Group>:group.options.map(renderItem)):<PrimitiveSelect.Item value={null} disabled className="bui-option bui-choice-empty">{emptyMessage}</PrimitiveSelect.Item>}</PrimitiveSelect.List>
      </PrimitiveSelect.Popup></PrimitiveSelect.Positioner></PrimitiveSelect.Portal>
    </PrimitiveSelect.Root>
    {clearable&&selected!==null&&<button type="button" className="bui-select-clear" disabled={props.disabled} aria-label={'Clear '+label.toLowerCase()} onClick={()=>{setSelected(null);setExpanded(false);trigger.current?.focus({preventScroll:true});}}><Icon name="close"/></button>}
  </div>{hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{error&&<p id={id+'-error'} className="bui-error" role="alert">{error}</p>}</div>;
}
export interface ComboboxProps {
  label:string;
  /** Legacy local strings remain both their labels and submitted values. */
  items?:readonly string[];
  /** Stable-ID options take precedence over legacy items when supplied. */
  options?:readonly Option[];
  value?:string|null; defaultValue?:string|null; onValueChange?:(value:string|null)=>void;
  placeholder?:string; name?:string; form?:string; disabled?:boolean; required?:boolean; clearable?:boolean; hint?:string; error?:string;
  labelVisibility?:'visible'|'hidden'; density?:'comfortable'|'compact'; inputRef?:Ref<HTMLInputElement>; onBlur?:FocusEventHandler<HTMLInputElement>;
  open?:boolean; defaultOpen?:boolean; onOpenChange?:(open:boolean)=>void; onOpenChangeComplete?:(open:boolean)=>void;
  /** A presentational row body; do not add nested interactive elements. */
  renderOption?:(option:Option)=>ReactNode;
  emptyMessage?:string;
}
export function Combobox({label,items=noStringItems,options,value,defaultValue=null,onValueChange,placeholder='Search options…',clearable=false,hint,error,labelVisibility='visible',density='comfortable',inputRef,onBlur,open,defaultOpen=false,onOpenChange,onOpenChangeComplete,renderOption,emptyMessage='No matching options.',...props}:ComboboxProps) {
  const id=useId(),actions=useRef<PrimitiveCombobox.Root.Actions|null>(null),root=useRef<HTMLDivElement>(null);
  const choices=useMemo(()=>options??items.map(item=>({value:item,label:item})),[options,items]);
  const grouped=useMemo(()=>groupChoiceOptions(choices).map(group=>({label:group.label||'',items:group.options.map(option=>option.value)})),[choices]);
  const lookup=useMemo(()=>new Map(choices.map(option=>[option.value,option])),[choices]);
  const [selected,setSelected]=useChoiceValue<string|null>(value,defaultValue,onValueChange,root,props.form);
  const [expanded,setExpanded]=useControllableValue(open,defaultOpen,onOpenChange),popupOpen=expanded&&!props.disabled;
  const {contains}=PrimitiveCombobox.useFilter();
  const descriptions=[hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  return <div ref={root} className="bui-field bui-local-choice"><label className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'} htmlFor={id}>{label}{props.required&&<span aria-hidden="true"> *</span>}</label>
    <PrimitiveCombobox.Root<string> actionsRef={actions} items={grouped} value={selected} onValueChange={(next,details)=>{if(details.reason==='escape-key'){details.cancel();return;}setSelected(next);}} itemToStringLabel={value=>lookup.get(value)?.label??value} itemToStringValue={value=>value} filter={(item,query)=>query.trim().split(/\s+/).filter(Boolean).every(term=>contains(choiceSearchText(lookup.get(item)),term))} open={popupOpen} onOpenChange={setExpanded} onOpenChangeComplete={onOpenChangeComplete} {...props}>
      <PrimitiveCombobox.InputGroup className="bui-combobox-input"><PrimitiveCombobox.Input ref={inputRef} onBlur={event=>{onBlur?.(event);if(event.relatedTarget&&!event.currentTarget.closest('.bui-local-choice')?.contains(event.relatedTarget as Node))setExpanded(false);}} onKeyDown={event=>{if(event.key==='Tab')setExpanded(false);if(event.key==='Escape'&&!popupOpen)event.preventBaseUIHandler();}} id={id} data-density={density} aria-describedby={descriptions} aria-invalid={!!error||undefined} placeholder={placeholder} className="bui-input"/>
        {clearable&&<PrimitiveCombobox.Clear aria-label={'Clear '+label.toLowerCase()} className="bui-combobox-clear"><Icon name="close"/></PrimitiveCombobox.Clear>}
        <PrimitiveCombobox.Trigger aria-label={'Show '+label.toLowerCase()+' options'} className="bui-combobox-trigger"><Icon name="chevron"/></PrimitiveCombobox.Trigger>
      </PrimitiveCombobox.InputGroup>
      <ChoiceComboboxPopup open={popupOpen} actions={actions} onOpenChangeComplete={onOpenChangeComplete}><PrimitiveCombobox.Empty className="bui-combo-empty">{emptyMessage}</PrimitiveCombobox.Empty><ChoiceComboboxList options={choices} label={label} id={id} renderOption={renderOption}/></ChoiceComboboxPopup>
    </PrimitiveCombobox.Root>
    {hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{error&&<p id={id+'-error'} className="bui-error" role="alert">{error}</p>}
  </div>;
}

export function Tabs({ label, items, value, defaultValue, onValueChange }: { label: string; items: { value: string; label: string; content: ReactNode; disabled?: boolean }[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  return <PrimitiveTabs.Root className="bui-tabs" value={value} defaultValue={defaultValue ?? items[0]?.value} onValueChange={next => { if (typeof next === 'string') onValueChange?.(next); }}><PrimitiveTabs.List className="bui-tab-list" aria-label={label}>{items.map(item => <PrimitiveTabs.Tab key={item.value} value={item.value} disabled={item.disabled} className="bui-tab">{item.label}</PrimitiveTabs.Tab>)}<PrimitiveTabs.Indicator className="bui-tab-indicator" /></PrimitiveTabs.List>{items.map(item => <PrimitiveTabs.Panel key={item.value} value={item.value} className="bui-tab-panel">{item.content}</PrimitiveTabs.Panel>)}</PrimitiveTabs.Root>;
}
export function Accordion({ items, multiple = false, defaultValue, value, onValueChange }: { items: { value: string; title: string; content: ReactNode; disabled?: boolean }[]; multiple?: boolean; defaultValue?: string[]; value?: string[]; onValueChange?: (value: string[]) => void }) {
  return <PrimitiveAccordion.Root className="bui-accordion" multiple={multiple} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>{items.map(item => <PrimitiveAccordion.Item value={item.value} key={item.value} disabled={item.disabled} className="bui-accordion-item"><PrimitiveAccordion.Header><PrimitiveAccordion.Trigger className="bui-accordion-trigger"><span>{item.title}</span><Icon name="plus" /></PrimitiveAccordion.Trigger></PrimitiveAccordion.Header><PrimitiveAccordion.Panel className="bui-accordion-panel"><div>{item.content}</div></PrimitiveAccordion.Panel></PrimitiveAccordion.Item>)}</PrimitiveAccordion.Root>;
}
