'use client';
import {useId,type Ref,type FocusEventHandler} from 'react';
import {NumberField as Primitive} from '@base-ui/react/number-field';
import {Minus,Plus} from 'lucide-react';
export interface NumberFieldProps {
  label:string; value?:number|null; defaultValue?:number; onValueChange?:(value:number|null)=>void;
  min?:number; max?:number; step?:number; smallStep?:number; largeStep?:number;
  locale?:string; format?:Intl.NumberFormatOptions; allowOutOfRange?:boolean;
  hint?:string; error?:string; placeholder?:string; name?:string; required?:boolean;
  disabled?:boolean; readOnly?:boolean; inputRef?:Ref<HTMLInputElement>; onBlur?:FocusEventHandler<HTMLInputElement>;
}
export function NumberField({label,value,defaultValue,onValueChange,min,max,step=1,smallStep=.1,largeStep=10,locale='en-AU',format,allowOutOfRange=false,hint,error,placeholder,name,required=false,disabled=false,readOnly=false,inputRef,onBlur}:NumberFieldProps) {
  const id=useId();let configurationError='';
  if(min!==undefined&&!Number.isFinite(min)||max!==undefined&&!Number.isFinite(max)||min!==undefined&&max!==undefined&&min>max||![step,smallStep,largeStep].every(value=>Number.isFinite(value)&&value>0))configurationError='Review the numeric limits and step sizes.';
  try{new Intl.NumberFormat(locale,format);}catch{configurationError='Review the number format and locale.';}
  const problem=error||configurationError,describedBy=[hint&&id+'-hint',problem&&id+'-error'].filter(Boolean).join(' ')||undefined;
  return <div className="bui-field"><label className="bui-label" htmlFor={id}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Primitive.Root id={id} className="bui-number-field" value={value===undefined?undefined:value===null||Number.isFinite(value)?value:null} defaultValue={defaultValue!==undefined&&Number.isFinite(defaultValue)?defaultValue:undefined} onValueChange={value=>onValueChange?.(value!==null&&Number.isFinite(value)?value:null)} min={configurationError?undefined:min} max={configurationError?undefined:max} step={configurationError?1:step} smallStep={configurationError ? 0.1 : smallStep} largeStep={configurationError?10:largeStep} locale={configurationError?'en-AU':locale} format={configurationError?undefined:format} allowOutOfRange={allowOutOfRange} snapOnStep name={name} required={required} disabled={disabled||!!configurationError} readOnly={readOnly}>
      <Primitive.Group className="bui-number-group" data-invalid={!!problem||undefined}>
        <Primitive.Decrement className="bui-number-button" aria-label={'Decrease '+label.toLowerCase()} disabled={readOnly||undefined}><Minus size={16} aria-hidden="true"/></Primitive.Decrement>
        <Primitive.Input ref={inputRef} onBlur={onBlur} className="bui-number-input" placeholder={placeholder} aria-invalid={!!problem||undefined} aria-describedby={describedBy}/>
        <Primitive.Increment className="bui-number-button" aria-label={'Increase '+label.toLowerCase()} disabled={readOnly||undefined}><Plus size={16} aria-hidden="true"/></Primitive.Increment>
      </Primitive.Group>
    </Primitive.Root>{hint&&<p id={id+'-hint'} className="bui-hint">{hint}</p>}{problem&&<p id={id+'-error'} className="bui-error" role="alert">{problem}</p>}
  </div>;
}
