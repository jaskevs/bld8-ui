'use client';
import {useMemo,type Ref,type FocusEventHandler} from 'react';
import {Select} from './controls.js';
import {useControllableValue} from './state.js';
import {createTimeOptions,formatTimeLabel,parseTimeValue,type TimeOptions} from './time-options.js';
export interface TimePickerProps extends TimeOptions {
  label:string; value?:string|null; defaultValue?:string|null; onValueChange?:(value:string|null)=>void;
  placeholder?:string; hint?:string; error?:string; name?:string; required?:boolean; disabled?:boolean;
  clearable?:boolean; inputRef?:Ref<HTMLButtonElement>; onBlur?:FocusEventHandler<HTMLButtonElement>;
}
export function TimePicker({label,value,defaultValue=null,onValueChange,placeholder='Choose a time',hint,error,name,required,disabled,clearable=true,inputRef,onBlur,minTime,maxTime,interval=15,locale='en-AU',hourCycle,disabledTimes}:TimePickerProps) {
  const [selected,setSelected]=useControllableValue(value,defaultValue,onValueChange);
  const config=useMemo(()=>{try{const options=createTimeOptions({minTime,maxTime,interval,locale,hourCycle,disabledTimes});return {options,error:options.length?'':'No times fit the selected range.'};}catch{return {options:[],error:'Review the time range, interval and locale.'};}},[minTime,maxTime,interval,locale,hourCycle,disabledTimes]);
  const unavailable=selected!==null&&!config.options.some(option=>option.value===selected&&!option.disabled);
  const options=[...config.options];
  if(selected!==null&&!options.some(option=>option.value===selected)){let label='Unavailable time';try{if(parseTimeValue(selected)!==null)label=formatTimeLabel(selected,locale,hourCycle);}catch{}options.unshift({value:selected,label,disabled:true});}
  return <Select label={label} options={options} value={selected} onValueChange={setSelected} placeholder={placeholder} hint={hint} error={error||config.error||(unavailable?'Choose a time within the available range.':undefined)} name={name} required={required} disabled={disabled||!!config.error} clearable={clearable} inputRef={inputRef} onBlur={onBlur}/>;
}
