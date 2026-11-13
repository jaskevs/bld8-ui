/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type Ref,type FocusEventHandler,type KeyboardEventHandler} from 'react';
import {Popover} from '@base-ui/react/popover';
import {Clock3,X} from 'lucide-react';
import {Select} from './controls.js';
import {Button,Icon,IconButton,Input} from './core.js';
import {useChoiceValue} from './choice-option.js';
import {UIPortal,useUIConfig} from './ui-config.js';
import {createTimeOptions,formatTimeLabel,parseTimeValue,type TimeOptions} from './time-options.js';
export interface TimePickerProps extends TimeOptions {
  label:string;value?:string|null;defaultValue?:string|null;onValueChange?:(value:string|null)=>void;
  placeholder?:string;hint?:string;error?:string;name?:string;form?:string;required?:boolean;disabled?:boolean;readOnly?:boolean;
  clearable?:boolean;inputRef?:Ref<HTMLButtonElement>;onBlur?:FocusEventHandler<HTMLButtonElement>;
  /** Opt-in strict HH:mm entry. Slot-only presentation remains the default. */
  editable?:boolean;textInputRef?:Ref<HTMLInputElement>;onInputBlur?:FocusEventHandler<HTMLInputElement>;onInputKeyDown?:KeyboardEventHandler<HTMLInputElement>;
  /** Explicit commits only Apply. Dismissal and Cancel restore the committed value. */
  commitMode?:'immediate'|'explicit';labelVisibility?:'visible'|'hidden';density?:'comfortable'|'compact';
}
function assignRef<T>(ref:Ref<T>|undefined,node:T|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
/** Canonical time-of-day values never acquire a date, zone or UTC offset. */
export function TimePicker({label,value,defaultValue=null,onValueChange,placeholder,hint,error,name,form,required=false,disabled=false,readOnly=false,clearable=true,inputRef,onBlur,
  editable=false,textInputRef,onInputBlur,onInputKeyDown,commitMode='immediate',labelVisibility='visible',density='comfortable',minTime,maxTime,interval=15,locale,hourCycle,disabledTimes}:TimePickerProps){
  const ui=useUIConfig(),formatLocale=locale??ui.locale,id=useId(),root=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null),buttons=useRef(new Map<string,HTMLButtonElement>());
  const initial=useRef(defaultValue),[selected,setSelected]=useChoiceValue(value,initial.current,onValueChange,root,form),key=selected??'',explicit=commitMode==='explicit';
  const [text,setText]=useState(key),[open,setOpen]=useState(false),[touched,setTouched]=useState(false),[active,setActive]=useState(key);
  const live=useRef({selected,text}),committed=useRef(selected),closeReason=useRef<string|undefined>(undefined);live.current={selected,text};committed.current=selected;
  const pointerActive=useRef(false),pendingBlurFeedback=useRef(false),feedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  function cancelBlurFeedback(){pendingBlurFeedback.current=false;if(feedbackTimer.current!==null){clearTimeout(feedbackTimer.current);feedbackTimer.current=null;}}
  function discloseBlurError(){if(pointerActive.current)pendingBlurFeedback.current=true;else setTouched(true);}
  useEffect(()=>{
    const document=root.current?.ownerDocument;if(!document)return;
    const down=()=>{pointerActive.current=true;};
    const release=()=>{pointerActive.current=false;if(!pendingBlurFeedback.current)return;pendingBlurFeedback.current=false;
      // Let the original pointerup/click and native submit finish before adding layout.
      feedbackTimer.current=setTimeout(()=>{feedbackTimer.current=null;if(root.current&&!root.current.contains(document.activeElement))setTouched(true);},0);
    };
    document.addEventListener('pointerdown',down,true);document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);document.defaultView?.addEventListener('blur',release);
    return()=>{cancelBlurFeedback();document.removeEventListener('pointerdown',down,true);document.removeEventListener('pointerup',release,true);document.removeEventListener('pointercancel',release,true);document.defaultView?.removeEventListener('blur',release);};
  },[]);
  const config=useMemo(()=>{try{const options=createTimeOptions({minTime,maxTime,interval,locale:formatLocale,hourCycle,disabledTimes});return {options,error:options.some(option=>!option.disabled)?'':'No times fit the selected range.'};}catch{return {options:[],error:'Review the time range, interval and locale.'};}},[minTime,maxTime,interval,formatLocale,hourCycle,disabledTimes]);
  const dirty=text!==key,unavailable=selected!==null&&!config.options.some(option=>option.value===selected&&!option.disabled);
  function validation(next:string){if(!next)return required?ui.message('timeRequired','Enter a time.'):'';if(parseTimeValue(next)===null)return ui.message('timeInvalid','Enter a valid time as HH:mm.');return config.options.some(option=>option.value===next&&!option.disabled)?'':ui.message('timeUnavailable','Choose an available time.');}
  const invalid=validation(text),pending=explicit&&dirty?ui.message('timePending','Apply or cancel the time changes.'):'',message=invalid||pending,feedback=error||config.error||(touched?message:'');
  useLayoutEffect(()=>{cancelBlurFeedback();setText(key);setTouched(false);},[key]);
  useLayoutEffect(()=>{input.current?.setCustomValidity(readOnly||disabled?'':message);},[message,readOnly,disabled]);
  useEffect(()=>{if(disabled||readOnly){cancelBlurFeedback();setOpen(false);setText(key);setTouched(false);}},[disabled,readOnly,key]);
  useEffect(()=>{
    const owner=root.current,associated=form?owner?.ownerDocument.getElementById(form):null,native=owner?.querySelector<HTMLInputElement>('input'),target=associated?.tagName==='FORM'?associated as HTMLFormElement:native?.form??owner?.closest('form');
    if(!target)return;const pending=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{pending.delete(timer);if(event.defaultPrevented)return;cancelBlurFeedback();setText((value===undefined?initial.current:live.current.selected)??'');setTouched(false);setOpen(false);},0);pending.add(timer);};
    target.addEventListener('reset',reset);return()=>{target.removeEventListener('reset',reset);for(const timer of pending)clearTimeout(timer);};
  },[form,value===undefined]);
  function restore(){cancelBlurFeedback();setText(committed.current??'');setTouched(false);}
  function commit(next:string|null){if(disabled||readOnly||config.error)return;cancelBlurFeedback();setText(value===undefined?next??'':committed.current??'');setTouched(false);if(next!==committed.current){committed.current=next;setSelected(next);}}
  function commitText(fromBlur=false){if(disabled||readOnly)return true;const next=live.current.text;if(validation(next)){if(fromBlur)discloseBlurError();else setTouched(true);return false;}if(!explicit)commit(next||null);return true;}
  function opened(next:boolean,reason?:string){closeReason.current=reason;if(next){if(disabled||readOnly||config.error)return;setActive(config.options.find(option=>option.value===text&&!option.disabled)?.value??config.options.find(option=>!option.disabled)?.value??'');}else if(explicit||reason==='escape-key')restore();else if(editable)commitText(true);setOpen(next);}
  function choose(next:string){setText(next);live.current.text=next;setTouched(false);if(!explicit){commit(next);setOpen(false);}}
  function apply(){if(validation(text))return;commit(text||null);setOpen(false);(editable?input.current:trigger.current)?.focus({preventScroll:true});}
  function cancel(){restore();setOpen(false);(editable?input.current:trigger.current)?.focus({preventScroll:true});}
  const footer=explicit?<div className="bui-time-actions"><Button size="sm" variant="ghost" onClick={cancel}>{ui.message('cancel','Cancel')}</Button><Button size="sm" disabled={!!invalid||!dirty||disabled||readOnly} onClick={apply}>{ui.message('apply','Apply')}</Button></div>:null;
  const options=[...config.options];if(selected!==null&&!options.some(option=>option.value===selected)){let formatted='Unavailable time';try{if(parseTimeValue(selected)!==null)formatted=formatTimeLabel(selected,formatLocale,hourCycle);}catch{}options.unshift({value:selected,label:formatted,disabled:true});}
  // Preserve the familiar Select and its native form behaviour for existing consumers.
  if(!editable&&!explicit)return <div ref={root}><Select label={label} options={options} value={selected} onValueChange={next=>commit(next)} placeholder={placeholder??ui.message('chooseTime','Choose a time')} hint={hint} error={error||config.error||(unavailable?ui.message('timeUnavailable','Choose a time within the available range.'):undefined)} name={name} form={form} required={required} disabled={disabled||!!config.error} readOnly={readOnly} clearable={clearable&&!readOnly} inputRef={inputRef} onBlur={onBlur} labelVisibility={labelVisibility} density={density}/></div>;
  const described=(hint||feedback)?id+'-description':undefined;
  let display=placeholder??ui.message('chooseTime','Choose a time');try{if(text&&parseTimeValue(text)!==null)display=formatTimeLabel(text,formatLocale,hourCycle);}catch{}
  return <div ref={root} className="bui-field bui-time-picker" data-disabled={disabled||undefined} onBlurCapture={event=>{const next=event.relatedTarget as Node|null;if(editable&&!root.current?.contains(next)&&!popup.current?.contains(next)){if(explicit){if(dirty)discloseBlurError();}else commitText(true);}}}>
    <label htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Popover.Root open={open&&!disabled&&!readOnly} onOpenChange={(next,details)=>opened(next,details.reason)}>
      <div className={editable?'bui-date-entry bui-time-entry':'bui-date-field'}>
        {editable&&<Input ref={node=>{input.current=node;assignRef(textInputRef,node);}} id={id} type="text" inputMode="text" dir="ltr" name={!explicit?name:undefined} form={form} value={text} required={required} readOnly={readOnly} disabled={disabled}
          placeholder={placeholder??'HH:mm'} maxLength={5} pattern="[0-9]{2}:[0-9]{2}" autoComplete="off" spellCheck={false} aria-invalid={!!feedback||undefined} aria-describedby={described} density={density}
          onChange={event=>{const next=event.currentTarget.value;live.current.text=next;setText(next);event.currentTarget.setCustomValidity(validation(next)||(explicit&&next!==key?ui.message('timePending','Apply or cancel the time changes.'):''));}}
          onInvalid={()=>setTouched(true)} onBlur={onInputBlur} onKeyDown={event=>{onInputKeyDown?.(event);if(event.defaultPrevented)return;if(event.key==='Escape'&&(open||dirty)){event.preventDefault();cancel();}else if(event.key==='Enter'){event.preventDefault();if(commitText()&&explicit)apply();}else if(event.key==='ArrowDown'&&event.altKey){event.preventDefault();opened(true);}}}/>}
        <Popover.Trigger ref={(node:HTMLButtonElement|null)=>{trigger.current=node;assignRef(inputRef,node);}} id={editable?id+'-picker':id} onBlur={onBlur} disabled={disabled||readOnly||!!config.error} aria-label={editable?ui.message('openTime','Choose {label}',{label}):undefined} aria-describedby={described} data-density={density}
          className={editable?'bui-button bui-button--ghost bui-button--sm bui-icon-button bui-date-open':'bui-input bui-date-trigger'}><Icon icon={Clock3}/>{!editable&&<><span data-placeholder={!text||undefined}>{display}</span><Icon name="chevron"/></>}</Popover.Trigger>
        {clearable&&!readOnly&&!!text&&<IconButton icon={X} label={ui.message('clearField','Clear {label}',{label:label.toLowerCase()})} size="sm" variant="ghost" className={editable?'bui-date-clear':undefined} disabled={disabled} onClick={()=>{if(explicit){setText('');live.current.text='';setTouched(false);}else commit(null);(editable?input.current:trigger.current)?.focus({preventScroll:true});}}/>}
      </div>
      <UIPortal render={Popover.Portal}><Popover.Positioner className="bui-positioner" sideOffset={8}><Popover.Popup ref={popup} className="bui-popup bui-time-popup" initialFocus={()=>buttons.current.get(active)??false} finalFocus={()=>closeReason.current==='outside-press'||closeReason.current==='focus-out'?false:editable?input.current:trigger.current}>
        <Popover.Title className="bui-time-title">{label}</Popover.Title><div className="bui-time-options" role="listbox" aria-label={label} onKeyDown={event=>{const available=config.options.filter(option=>!option.disabled),index=available.findIndex(option=>option.value===active);let next=index;
          if(event.key==='ArrowDown')next=Math.min(available.length-1,index+1);else if(event.key==='ArrowUp')next=Math.max(0,index-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=available.length-1;else return;event.preventDefault();const slot=available[next];if(slot){setActive(slot.value);buttons.current.get(slot.value)?.focus({preventScroll:true});buttons.current.get(slot.value)?.scrollIntoView({block:'nearest'});}}}>
          {config.options.map(option=><button key={option.value} ref={node=>{if(node)buttons.current.set(option.value,node);else buttons.current.delete(option.value);}} type="button" role="option" aria-selected={text===option.value} disabled={option.disabled} tabIndex={active===option.value?0:-1} className="bui-option bui-time-option" onFocus={()=>setActive(option.value)} onClick={()=>choose(option.value)}><span>{option.label}</span><Icon name="check" className="bui-time-check"/></button>)}
        </div>{footer}
      </Popover.Popup></Popover.Positioner></UIPortal>
    </Popover.Root>
    {explicit&&!open&&dirty&&footer}
    {explicit&&name&&<input type="hidden" name={name} form={form} value={key} disabled={disabled}/>}
    {(hint||feedback)&&<p id={id+'-description'} className={feedback?'bui-error':'bui-hint'} role={feedback?'alert':undefined}>{feedback||hint}</p>}
  </div>;
}
