'use client';
import { useId, useRef, type ReactNode, type Ref, type FocusEventHandler } from 'react';
import { Select as PrimitiveSelect } from '@base-ui/react/select';
import { Combobox as PrimitiveCombobox } from '@base-ui/react/combobox';
import { Tabs as PrimitiveTabs } from '@base-ui/react/tabs';
import { Accordion as PrimitiveAccordion } from '@base-ui/react/accordion';
import { Icon, type Option } from './core.js';
import { useControllableValue } from './state.js';

export interface SelectProps { label: string; options: Option[]; value?: string | null; defaultValue?: string; onValueChange?: (value: string | null) => void; placeholder?: string; name?: string; disabled?: boolean; required?: boolean; clearable?: boolean; labelVisibility?: 'visible' | 'hidden'; density?: 'comfortable' | 'compact'; inputRef?:Ref<HTMLButtonElement>; onBlur?:FocusEventHandler<HTMLButtonElement>; hint?:string; error?:string }
export function Select({ label, options, placeholder = 'Select an option', value, defaultValue, onValueChange, clearable, labelVisibility='visible', density='comfortable', inputRef, onBlur, hint, error, ...props }: SelectProps) {
  const id = useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const descriptions=[hint && id+'-hint',error && id+'-error'].filter(Boolean).join(' ') || undefined;
  const [selected, setSelected] = useControllableValue<string | null>(value, defaultValue ?? null, onValueChange);
  return <div className="bui-field"><label className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'} htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label><div className="bui-date-field"><PrimitiveSelect.Root items={options} value={selected} onValueChange={setSelected} {...props}><PrimitiveSelect.Trigger ref={node=>{trigger.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node;}} onBlur={onBlur} data-field-name={props.name} data-density={density} aria-invalid={!!error || undefined} aria-describedby={descriptions} id={id} className="bui-input bui-select-trigger"><PrimitiveSelect.Value placeholder={placeholder}>{selected!==null?options.find(option=>option.value===selected)?.label:undefined}</PrimitiveSelect.Value><PrimitiveSelect.Icon><Icon name="chevron" /></PrimitiveSelect.Icon></PrimitiveSelect.Trigger><PrimitiveSelect.Portal><PrimitiveSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="bui-positioner"><PrimitiveSelect.Popup className="bui-popup bui-select-popup"><PrimitiveSelect.List>{options.map(option => <PrimitiveSelect.Item key={option.value} value={option.value} disabled={option.disabled} className="bui-option"><PrimitiveSelect.ItemText className="bui-option-label">{option.label}</PrimitiveSelect.ItemText><PrimitiveSelect.ItemIndicator><Icon name="check" /></PrimitiveSelect.ItemIndicator></PrimitiveSelect.Item>)}</PrimitiveSelect.List></PrimitiveSelect.Popup></PrimitiveSelect.Positioner></PrimitiveSelect.Portal></PrimitiveSelect.Root>{clearable && selected !== null && <button type="button" className="bui-select-clear" disabled={props.disabled} aria-label={'Clear ' + label.toLowerCase()} onClick={() => {setSelected(null);trigger.current?.focus();}}><Icon name="close" /></button>}</div>{hint && <p id={id+'-hint'} className="bui-hint">{hint}</p>}{error && <p id={id+'-error'} className="bui-error" role="alert">{error}</p>}</div>;
}
export interface ComboboxProps {
  label: string; items: string[]; value?: string | null; defaultValue?: string;
  onValueChange?: (value: string | null) => void; placeholder?: string; name?: string;
  disabled?: boolean; required?: boolean; clearable?: boolean; hint?: string; error?: string;
  labelVisibility?: 'visible' | 'hidden'; density?: 'comfortable' | 'compact';
  inputRef?: Ref<HTMLInputElement>; onBlur?: FocusEventHandler<HTMLInputElement>;
}
export function Combobox({ label, placeholder = 'Search options…', clearable, hint, error, labelVisibility='visible', density='comfortable', inputRef, onBlur, ...props }: ComboboxProps) {
  const id = useId();
  const descriptions=[hint && id+'-hint',error && id+'-error'].filter(Boolean).join(' ') || undefined;
  return <div className="bui-field">
    <label className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'} htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
    <PrimitiveCombobox.Root {...props}>
      <PrimitiveCombobox.InputGroup className="bui-combobox-input">
        <PrimitiveCombobox.Input ref={inputRef} onBlur={onBlur} id={id} data-density={density} aria-describedby={descriptions} aria-invalid={!!error || undefined} placeholder={placeholder} className="bui-input" />
        {clearable && <PrimitiveCombobox.Clear aria-label={'Clear ' + label.toLowerCase()} className="bui-combobox-clear"><Icon name="close" /></PrimitiveCombobox.Clear>}
        <PrimitiveCombobox.Trigger aria-label={'Show ' + label.toLowerCase() + ' options'} className="bui-combobox-trigger"><Icon name="chevron" /></PrimitiveCombobox.Trigger>
      </PrimitiveCombobox.InputGroup>
      <PrimitiveCombobox.Portal><PrimitiveCombobox.Positioner sideOffset={6} className="bui-positioner"><PrimitiveCombobox.Popup className="bui-popup bui-select-popup">
        <PrimitiveCombobox.Empty className="bui-combo-empty">No matching options.</PrimitiveCombobox.Empty>
        <PrimitiveCombobox.List>{(item: string) => <PrimitiveCombobox.Item key={item} value={item} className="bui-option"><span className="bui-option-label">{item}</span><PrimitiveCombobox.ItemIndicator><Icon name="check" /></PrimitiveCombobox.ItemIndicator></PrimitiveCombobox.Item>}</PrimitiveCombobox.List>
      </PrimitiveCombobox.Popup></PrimitiveCombobox.Positioner></PrimitiveCombobox.Portal>
    </PrimitiveCombobox.Root>
    {hint && <p id={id+'-hint'} className="bui-hint">{hint}</p>}{error && <p id={id+'-error'} className="bui-error" role="alert">{error}</p>}
  </div>;
}
export function Tabs({ label, items, value, defaultValue, onValueChange }: { label: string; items: { value: string; label: string; content: ReactNode; disabled?: boolean }[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  return <PrimitiveTabs.Root className="bui-tabs" value={value} defaultValue={defaultValue ?? items[0]?.value} onValueChange={next => { if (typeof next === 'string') onValueChange?.(next); }}><PrimitiveTabs.List className="bui-tab-list" aria-label={label}>{items.map(item => <PrimitiveTabs.Tab key={item.value} value={item.value} disabled={item.disabled} className="bui-tab">{item.label}</PrimitiveTabs.Tab>)}<PrimitiveTabs.Indicator className="bui-tab-indicator" /></PrimitiveTabs.List>{items.map(item => <PrimitiveTabs.Panel key={item.value} value={item.value} className="bui-tab-panel">{item.content}</PrimitiveTabs.Panel>)}</PrimitiveTabs.Root>;
}
export function Accordion({ items, multiple = false, defaultValue, value, onValueChange }: { items: { value: string; title: string; content: ReactNode; disabled?: boolean }[]; multiple?: boolean; defaultValue?: string[]; value?: string[]; onValueChange?: (value: string[]) => void }) {
  return <PrimitiveAccordion.Root className="bui-accordion" multiple={multiple} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>{items.map(item => <PrimitiveAccordion.Item value={item.value} key={item.value} disabled={item.disabled} className="bui-accordion-item"><PrimitiveAccordion.Header><PrimitiveAccordion.Trigger className="bui-accordion-trigger"><span>{item.title}</span><Icon name="plus" /></PrimitiveAccordion.Trigger></PrimitiveAccordion.Header><PrimitiveAccordion.Panel className="bui-accordion-panel"><div>{item.content}</div></PrimitiveAccordion.Panel></PrimitiveAccordion.Item>)}</PrimitiveAccordion.Root>;
}
