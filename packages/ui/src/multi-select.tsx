'use client';
import { useId, type Ref, type FocusEventHandler } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Icon, type Option } from './core.js';
import { useControllableValue } from './state.js';

export interface MultiSelectProps {
  label: string;
  options: Option[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  inputRef?:Ref<HTMLInputElement>;
  onBlur?:FocusEventHandler<HTMLInputElement>;
}

export function MultiSelect({ label, options, value, defaultValue = [], onValueChange, placeholder = 'Choose options…', hint, error, inputRef, onBlur, ...props }: MultiSelectProps) {
  const id = useId();
  const [selected, setSelected] = useControllableValue(value, defaultValue, onValueChange);
  const labelFor = (value: string) => options.find(option => option.value === value)?.label ?? value;
  const descriptions = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return <div className="bui-field">
    <label htmlFor={id} className="bui-label">{label}{props.required && <span aria-hidden="true"> *</span>}</label>
    <Combobox.Root multiple items={options.map(option => option.value)} value={selected} onValueChange={setSelected} itemToStringLabel={labelFor} {...props}>
      <Combobox.Chips className="bui-multi-input" data-invalid={!!error || undefined}>
        <Combobox.Value>{(values: string[]) => values.map(value => <Combobox.Chip key={value} className="bui-chip">
          {labelFor(value)}<Combobox.ChipRemove aria-label={'Remove ' + labelFor(value)}><Icon name="close" size={14} /></Combobox.ChipRemove>
        </Combobox.Chip>)}</Combobox.Value>
        <Combobox.Input ref={inputRef} onBlur={onBlur} id={id} aria-describedby={descriptions} aria-invalid={!!error || undefined} placeholder={selected.length ? 'Add another…' : placeholder} className="bui-chip-input" />
        <Combobox.Trigger className="bui-combobox-trigger" aria-label={'Show ' + label.toLowerCase() + ' options'}><Icon name="chevron" /></Combobox.Trigger>
      </Combobox.Chips>
      <Combobox.Portal><Combobox.Positioner className="bui-positioner" sideOffset={6}><Combobox.Popup className="bui-popup bui-select-popup">
        <Combobox.Empty className="bui-combo-empty">No matching options.</Combobox.Empty>
        <Combobox.List>{(value: string) => <Combobox.Item key={value} value={value} disabled={options.find(option => option.value === value)?.disabled} className="bui-option">
          {labelFor(value)}<Combobox.ItemIndicator><Icon name="check" /></Combobox.ItemIndicator>
        </Combobox.Item>}</Combobox.List>
      </Combobox.Popup></Combobox.Positioner></Combobox.Portal>
    </Combobox.Root>
    {hint && <p id={id + '-hint'} className="bui-hint">{hint}</p>}
    {error && <p id={id + '-error'} className="bui-error" role="alert">{error}</p>}
  </div>;
}
