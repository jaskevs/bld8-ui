/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useLayoutEffect,useRef,useState,type Ref,type FocusEventHandler,type KeyboardEventHandler,type RefObject} from 'react';
import {DayPicker,type DateRange,type DayPickerLocale} from 'react-day-picker';
import {Popover} from '@base-ui/react/popover';
import {CalendarDays,X} from 'lucide-react';
import {Button,Icon,IconButton,Input} from './core.js';
import {useChoiceValue} from './choice-option.js';
import {parseDateValue,formatDateValue,dateEntryMessage,rangeEntryMessage} from './date-fields-state.js';
export type {DateRange,DayPickerLocale} from 'react-day-picker';
export {parseDateValue,formatDateValue} from './date-fields-state.js';

export interface CalendarBaseProps {
  label?:string;defaultMonth?:Date;minDate?:Date;maxDate?:Date;disabled?:boolean;
  locale?:DayPickerLocale;weekStartsOn?:0|1|2|3|4|5|6;autoFocus?:boolean;
}
export type CalendarProps=CalendarBaseProps&(
  {mode?:'single';value?:Date;onValueChange?:(value:Date|undefined)=>void}|
  {mode:'range';value?:DateRange;onValueChange?:(value:DateRange|undefined)=>void}
);
const calendarClasses={
  root:'bui-calendar',months:'bui-calendar-months',month:'bui-calendar-month',month_caption:'bui-calendar-caption',
  caption_label:'bui-calendar-label',nav:'bui-calendar-nav',button_previous:'bui-calendar-nav-button',button_next:'bui-calendar-nav-button',
  chevron:'bui-calendar-chevron',month_grid:'bui-calendar-grid',weekday:'bui-calendar-weekday',day:'bui-calendar-day',day_button:'bui-calendar-day-button',
  today:'bui-calendar-today',selected:'bui-calendar-selected',outside:'bui-calendar-outside',disabled:'bui-calendar-disabled',
  range_start:'bui-calendar-range-start',range_end:'bui-calendar-range-end',range_middle:'bui-calendar-range-middle',hidden:'bui-calendar-hidden',
};
export function Calendar({label='Choose a date',defaultMonth,minDate,maxDate,disabled,locale,weekStartsOn=1,autoFocus,...selection}:CalendarProps){
  const lower=dateOrNull(minDate),upper=dateOrNull(maxDate),single=selection.mode==='range'?null:dateOrNull(selection.value),range=selection.mode==='range'?safeRange(selection.value):null;
  const common={classNames:calendarClasses,'aria-label':label,defaultMonth:dateOrNull(defaultMonth)??(selection.mode==='range'?range?.from:single)??undefined,
    startMonth:lower??undefined,endMonth:upper??undefined,locale,weekStartsOn,autoFocus,showOutsideDays:true,fixedWeeks:true,
    disabled:disabled?true:[...(lower?[{before:lower}]:[]),...(upper?[{after:upper}]:[])]};
  return selection.mode==='range'
    ? <DayPicker {...common} mode="range" selected={range??undefined} onSelect={selection.onValueChange} excludeDisabled/>
    : <DayPicker {...common} mode="single" selected={single??undefined} onSelect={selection.onValueChange}/>;
}
function assignRef<T>(ref:Ref<T>|undefined,node:T|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
function dateOrNull(value:Date|null|undefined){return formatDateValue(value)?value!:null;}
function safeRange(value:DateRange|null|undefined):DateRange|null {const from=dateOrNull(value?.from),to=dateOrNull(value?.to);return from?{from,to:to??undefined}:null;}
function rangeKey(value:DateRange|null|undefined){return formatDateValue(value?.from)+'|'+formatDateValue(value?.to);}
function rangeOrNull(from:string,to:string):DateRange|null {const start=parseDateValue(from);return start?{from:start,to:parseDateValue(to)??undefined}:null;}
function useDateReset(owner:RefObject<HTMLDivElement|null>,form:string|undefined,reset:()=>void){
  const callback=useRef(reset);callback.current=reset;
  useEffect(()=>{
    const root=owner.current,associated=form?root?.ownerDocument.getElementById(form):null;
    const native=root?.querySelector<HTMLInputElement>('input');
    const target=associated?.tagName==='FORM'?associated as HTMLFormElement:native?.form??root?.closest('form');
    if(!target)return;
    const pending=new Set<ReturnType<typeof setTimeout>>();
    const listener=(event:Event)=>{const timer=setTimeout(()=>{pending.delete(timer);if(!event.defaultPrevented)callback.current();},0);pending.add(timer);};
    target.addEventListener('reset',listener);return()=>{target.removeEventListener('reset',listener);for(const timer of pending)clearTimeout(timer);};
  },[owner,form]);
}
export interface DatePickerProps extends Omit<CalendarBaseProps,'label'|'autoFocus'> {
  label:string;value?:Date|null;defaultValue?:Date|null;onValueChange?:(value:Date|null)=>void;
  name?:string;form?:string;required?:boolean;placeholder?:string;hint?:string;error?:string;formatLocale?:string;
  /** Keep the existing button ref. In editable mode this is the calendar-opening button. */
  inputRef?:Ref<HTMLButtonElement>;onBlur?:FocusEventHandler<HTMLButtonElement>;
  /** Editable fields use strict YYYY-MM-DD text and real native constraint validation. */
  editable?:boolean;textInputRef?:Ref<HTMLInputElement>;onInputBlur?:FocusEventHandler<HTMLInputElement>;onInputKeyDown?:KeyboardEventHandler<HTMLInputElement>;
  readOnly?:boolean;clearable?:boolean;labelVisibility?:'visible'|'hidden';density?:'comfortable'|'compact';
}
export function DatePicker({label,value,defaultValue=null,onValueChange,name,form,required=false,placeholder,hint,error,formatLocale='en-AU',
  inputRef,onBlur,editable=false,textInputRef,onInputBlur,onInputKeyDown,readOnly=false,clearable=true,labelVisibility='visible',density='comfortable',...calendar}:DatePickerProps){
  const id=useId(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),input=useRef<HTMLInputElement>(null),popup=useRef<HTMLDivElement>(null),closeReason=useRef<string|undefined>(undefined);
  const initial=useRef(dateOrNull(defaultValue)),[selected,setSelected]=useChoiceValue(value,initial.current,onValueChange,root,form);
  const key=formatDateValue(selected),[text,setText]=useState(key),[touched,setTouched]=useState(false),[open,setOpen]=useState(false);
  const live=useRef({selected,text}),committedKey=useRef(key);live.current={selected,text};committedKey.current=key;
  const message=dateEntryMessage(text,{required,...calendar}),feedback=error||(touched?message:'');
  const described=[required&&!editable&&id+'-required',(hint||feedback)&&id+'-description'].filter(Boolean).join(' ')||undefined;
  // Accepted controlled dates must reach the DOM before the next native activation.
  useLayoutEffect(()=>{setText(key);setTouched(false);},[key]);
  useLayoutEffect(()=>{input.current?.setCustomValidity(readOnly||calendar.disabled?'':message);},[message,error,readOnly,calendar.disabled]);
  useEffect(()=>{if(calendar.disabled||readOnly)setOpen(false);},[calendar.disabled,readOnly]);
  useDateReset(root,form,()=>{const next=value===undefined?initial.current:live.current.selected;setText(formatDateValue(next));setTouched(false);setOpen(false);});
  function restore(){setText(key);setTouched(false);}
  function commit(next:Date|null){
    if(calendar.disabled||readOnly)return;
    const nextKey=formatDateValue(next);setText(value===undefined?nextKey:key);setTouched(false);
    if(nextKey!==committedKey.current){committedKey.current=nextKey;setSelected(next);}
  }
  function commitText(){
    if(calendar.disabled||readOnly)return true;
    const current=live.current.text,invalid=dateEntryMessage(current,{required,...calendar});
    if(invalid){setTouched(true);input.current?.setCustomValidity(invalid);return false;}
    commit(parseDateValue(current));return true;
  }
  function opened(next:boolean,reason?:string){
    closeReason.current=next?undefined:reason;
    if(next&&(calendar.disabled||readOnly))return;
    if(!next&&editable){if(reason==='escape-key')restore();else commitText();}
    setOpen(next);
  }
  const selectedDate=dateOrNull(selected),display=selectedDate?new Intl.DateTimeFormat(formatLocale,{day:'numeric',month:'short',year:'numeric'}).format(selectedDate):placeholder??'Choose a date';
  const opener=<Popover.Trigger ref={(node:HTMLButtonElement|null)=>{trigger.current=node;assignRef(inputRef,node);}} onBlur={onBlur} data-field-name={name} id={editable?id+'-calendar':id}
    title={editable?'Open '+label.toLowerCase()+' calendar':display} disabled={calendar.disabled||readOnly} aria-describedby={described}
    aria-invalid={!editable&&!!error||undefined} className={editable?'bui-button bui-button--ghost bui-button--sm bui-icon-button bui-date-open':'bui-input bui-date-trigger'} data-density={density}
    aria-label={editable?'Open '+label.toLowerCase()+' calendar':undefined}>
      <Icon icon={CalendarDays}/>{!editable&&<><span data-placeholder={!selectedDate||undefined}>{display}</span><Icon name="chevron"/></>}
    </Popover.Trigger>;
  return <div ref={root} className="bui-field bui-date-picker" data-disabled={calendar.disabled||undefined} onBlurCapture={event=>{const target=event.relatedTarget as Node|null;if(editable&&!root.current?.contains(target)&&!popup.current?.contains(target))commitText();}}>
    <label htmlFor={id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Popover.Root open={open&&!calendar.disabled&&!readOnly} onOpenChange={(next,details)=>opened(next,details.reason)}>
      <div className={editable?'bui-date-entry':'bui-date-field'} data-density={density}>
        {editable&&<Input id={id} ref={node=>{input.current=node;assignRef(textInputRef,node);}} type="text" name={name} form={form} required={required} value={text}
          placeholder={placeholder??'YYYY-MM-DD'} disabled={calendar.disabled} readOnly={readOnly} autoComplete="off" spellCheck={false} maxLength={10}
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" aria-invalid={!!feedback||undefined} aria-describedby={described} density={density}
          onChange={event=>{const next=event.currentTarget.value;live.current.text=next;setText(next);event.currentTarget.setCustomValidity(dateEntryMessage(next,{required,...calendar}));}}
          onInvalid={()=>setTouched(true)}
          onBlur={onInputBlur}
          onKeyDown={event=>{onInputKeyDown?.(event);if(event.defaultPrevented)return;
            if(event.key==='Enter'){event.preventDefault();commitText();}
            else if(event.key==='Escape'&&(open||text!==key)){event.preventDefault();restore();setOpen(false);}
            else if(event.key==='ArrowDown'&&event.altKey){event.preventDefault();opened(true);}
          }}/>}
        {opener}
        {clearable&&!readOnly&&(!!key||editable&&!!text)&&<IconButton icon={X} label={'Clear '+label.toLowerCase()} size="sm" variant="ghost" className={editable?'bui-date-clear':undefined}
          disabled={calendar.disabled} onClick={()=>{commit(null);setOpen(false);(editable?input.current:trigger.current)?.focus({preventScroll:true});}}/>}
      </div>
      <Popover.Portal><Popover.Positioner className="bui-positioner" sideOffset={8}><Popover.Popup ref={popup} className="bui-popup bui-calendar-popup"
        finalFocus={()=>closeReason.current==='outside-press'||closeReason.current==='focus-out'?false:editable?input.current:trigger.current}>
        <Popover.Title className="bui-sr-only">{label}</Popover.Title>
        <Calendar {...calendar} label={label} value={parseDateValue(text)??selectedDate??undefined} autoFocus onValueChange={date=>{commit(date??null);setOpen(false);}}/>
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
    {required&&!editable&&<span className="bui-sr-only" id={id+'-required'}>Required. Choose a date before submitting.</span>}
    {!editable&&name&&<input type="hidden" name={name} form={form} value={key} disabled={calendar.disabled}/>}
    {(hint||feedback)&&<p id={id+'-description'} className={feedback?'bui-error':'bui-hint'} role={feedback?'alert':undefined}>{feedback||hint}</p>}
  </div>;
}
export interface DateRangePreset {id:string;label:string;value:DateRange|null}
export interface DateRangePickerProps extends Omit<DatePickerProps,'value'|'defaultValue'|'onValueChange'|'textInputRef'|'onInputBlur'|'onInputKeyDown'> {
  value?:DateRange|null;defaultValue?:DateRange|null;onValueChange?:(value:DateRange|null)=>void;
  /** Immediate keeps legacy selection callbacks. Explicit commits only Apply and discards drafts on dismissal. */
  commitMode?:'immediate'|'explicit';presets?:readonly DateRangePreset[];
  textInputRefs?:readonly [Ref<HTMLInputElement>|undefined,Ref<HTMLInputElement>|undefined];
  onInputBlur?:FocusEventHandler<HTMLInputElement>;onInputKeyDown?:KeyboardEventHandler<HTMLInputElement>;
}
export function DateRangePicker({label,value,defaultValue=null,onValueChange,name,form,required=false,placeholder='Choose a date range',hint,error,formatLocale='en-AU',
  inputRef,onBlur,editable=false,textInputRefs,onInputBlur,onInputKeyDown,readOnly=false,clearable=true,labelVisibility='visible',density='comfortable',
  commitMode='immediate',presets=[],...calendar}:DateRangePickerProps){
  const id=useId(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),start=useRef<HTMLInputElement>(null),end=useRef<HTMLInputElement>(null),popup=useRef<HTMLDivElement>(null),closeReason=useRef<string|undefined>(undefined);
  const initial=useRef(defaultValue),[selected,setSelected]=useChoiceValue(value,initial.current,onValueChange,root,form),key=rangeKey(selected),explicit=commitMode==='explicit';
  const [texts,setTexts]=useState<[string,string]>([formatDateValue(selected?.from),formatDateValue(selected?.to)]),[draft,setDraft]=useState<DateRange|null>(safeRange(selected)),
    [open,setOpen]=useState(false),[touched,setTouched]=useState(false),[calendarEpoch,setCalendarEpoch]=useState(0);
  const selectedRef=useRef(selected),committedKey=useRef(key);selectedRef.current=selected;committedKey.current=key;
  const textKey=texts.join('|'),draftKey=rangeKey(draft),dirty=(editable?textKey:draftKey)!==key;
  const baseMessage=rangeEntryMessage(texts[0],texts[1],{required,...calendar});
  const message=baseMessage||(explicit&&dirty?'Apply or cancel the date range changes.':'');
  const feedback=error||(touched?message:'');
  const described=[required&&!editable&&id+'-required',(hint||feedback)&&id+'-description'].filter(Boolean).join(' ')||undefined;
  const applyMessage=editable?baseMessage:rangeEntryMessage(formatDateValue(draft?.from),formatDateValue(draft?.to),{required,...calendar});
  // Keep committed range inputs synchronized before a following native form action.
  useLayoutEffect(()=>{setTexts([formatDateValue(selected?.from),formatDateValue(selected?.to)]);setDraft(safeRange(selected));setTouched(false);},[key]);
  useLayoutEffect(()=>{for(const field of [start.current,end.current])field?.setCustomValidity(readOnly||calendar.disabled?'':message);},[message,error,readOnly,calendar.disabled]);
  useEffect(()=>{if(calendar.disabled||readOnly){setOpen(false);restore();}},[calendar.disabled,readOnly]);
  useDateReset(root,form,()=>{const next=value===undefined?initial.current:selectedRef.current;setTexts([formatDateValue(next?.from),formatDateValue(next?.to)]);setDraft(safeRange(next));setTouched(false);setOpen(false);});
  function restore(){const current=selectedRef.current;setTexts([formatDateValue(current?.from),formatDateValue(current?.to)]);setDraft(safeRange(current));setTouched(false);}
  function commit(next:DateRange|null){
    if(calendar.disabled||readOnly)return;
    if(rangeKey(next)!==committedKey.current){committedKey.current=rangeKey(next);setSelected(next);}
    const current=value===undefined?next:selectedRef.current;
    setTexts([formatDateValue(current?.from),formatDateValue(current?.to)]);setDraft(current);setTouched(false);
  }
  function updateDraft(next:DateRange|null){setDraft(next);setTexts([formatDateValue(next?.from),formatDateValue(next?.to)]);setTouched(false);if(!explicit)commit(next);}
  function commitTexts(){
    if(calendar.disabled||readOnly)return true;
    const invalid=rangeEntryMessage(texts[0],texts[1],{required,...calendar});
    if(invalid){setTouched(true);return false;}
    if(!explicit)commit(rangeOrNull(...texts));return true;
  }
  function setOpened(next:boolean,reason?:string){
    closeReason.current=next?undefined:reason;
    if(next&&(calendar.disabled||readOnly))return;
    if(next){setCalendarEpoch(0);if(!editable||!dirty)setDraft(safeRange(selectedRef.current));}
    else if(explicit)restore();
    else if(editable)commitTexts();
    setOpen(next);
  }
  function apply(){
    if(applyMessage||!dirty)return;
    commit(draft);setOpen(false);(editable?start.current:trigger.current)?.focus({preventScroll:true});
  }
  function cancel(){restore();setOpen(false);(editable?start.current:trigger.current)?.focus({preventScroll:true});}
  const format=(date:Date)=>new Intl.DateTimeFormat(formatLocale,{day:'numeric',month:'short',year:'numeric'}).format(date);
  const display=selected?.from&&formatDateValue(selected.from)?format(selected.from)+(selected.to&&formatDateValue(selected.to)?' – '+format(selected.to):' – Choose end date'):placeholder;
  const footer=<div className="bui-calendar-footer bui-date-range-footer"><span className="bui-hint" aria-live="polite">{applyMessage||'Range ready'}</span>
    <div className="bui-date-range-actions">{explicit?<><Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button><Button size="sm" disabled={!!applyMessage||!dirty} onClick={apply}>Apply range</Button></>:<Button size="sm" disabled={!draft?.from||!draft.to} onClick={()=>setOpened(false)}>Done</Button>}</div>
  </div>;
  const opener=<Popover.Trigger ref={(node:HTMLButtonElement|null)=>{trigger.current=node;assignRef(inputRef,node);}} onBlur={onBlur} id={editable?id+'-calendar':id}
    disabled={calendar.disabled||readOnly} aria-describedby={described} aria-invalid={!editable&&!!error||undefined} data-field-name={name} data-density={density}
    className={editable?'bui-button bui-button--ghost bui-button--sm bui-icon-button bui-date-range-open':'bui-input bui-date-trigger'} aria-label={editable?'Open '+label.toLowerCase()+' calendar':undefined} title={display}>
      <Icon icon={CalendarDays}/>{!editable&&<><span data-placeholder={!selected?.from||undefined}>{display}</span><Icon name="chevron"/></>}
    </Popover.Trigger>;
  return <div ref={root} className="bui-field bui-date-range-picker" data-disabled={calendar.disabled||undefined} onBlurCapture={event=>{const target=event.relatedTarget as Node|null;if(editable&&!root.current?.contains(target)&&!popup.current?.contains(target)){if(explicit)setTouched(dirty);else commitTexts();}}}>
    <label id={id+'-label'} htmlFor={editable?id+'-from':id} className={labelVisibility==='hidden'?'bui-sr-only':'bui-label'}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <Popover.Root open={open&&!calendar.disabled&&!readOnly} onOpenChange={(next,details)=>setOpened(next,details.reason)}>
      <div className={editable?'bui-date-range-entry':'bui-date-field'} data-density={density} role={editable?'group':undefined} aria-labelledby={editable?id+'-label':undefined}>
        {editable&&<>{(['from','to'] as const).map((side,index)=><Input key={side} id={id+'-'+side} ref={node=>{(index===0?start:end).current=node;assignRef(textInputRefs?.[index],node);}} type="text"
          name={!explicit&&name?name+'.'+side:undefined} form={form} value={texts[index]} required={required} disabled={calendar.disabled} readOnly={readOnly}
          aria-label={(index===0?'Start ':'End ')+label.toLowerCase()} aria-describedby={described} aria-invalid={!!feedback||undefined} density={density}
          placeholder={index===0?'Start YYYY-MM-DD':'End YYYY-MM-DD'} autoComplete="off" spellCheck={false} maxLength={10} pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
          onChange={event=>{const next:[string,string]=[...texts];next[index]=event.currentTarget.value;setTexts(next);setDraft(rangeOrNull(...next));
            const invalid=rangeEntryMessage(next[0],next[1],{required,...calendar})||(explicit&&next.join('|')!==key?'Apply or cancel the date range changes.':'');
            for(const field of [start.current,end.current])field?.setCustomValidity(invalid);}}
          onInvalid={()=>setTouched(true)}
          onBlur={onInputBlur}
          onKeyDown={event=>{onInputKeyDown?.(event);if(event.defaultPrevented)return;
            if(event.key==='Escape'&&(open||dirty)){event.preventDefault();cancel();}
            else if(event.key==='Enter'){event.preventDefault();if(explicit){if(!baseMessage)apply();else setTouched(true);}else commitTexts();}
            else if(event.key==='ArrowDown'&&event.altKey){event.preventDefault();setOpened(true);}
          }}/>)}</>}
        {opener}
        {clearable&&!readOnly&&(!!selected?.from||editable&&(!!texts[0]||!!texts[1]))&&<IconButton icon={X} label={'Clear '+label.toLowerCase()} size="sm" variant="ghost" className={editable?'bui-date-range-clear':undefined}
          disabled={calendar.disabled} onClick={()=>{if(explicit){setDraft(null);setTexts(['','']);setTouched(false);if(!editable)setOpen(true);}else{commit(null);setOpen(false);}(editable?start.current:trigger.current)?.focus({preventScroll:true});}}/>}
      </div>
      <Popover.Portal><Popover.Positioner className="bui-positioner" sideOffset={8}><Popover.Popup ref={popup} className="bui-popup bui-calendar-popup" finalFocus={()=>closeReason.current==='outside-press'||closeReason.current==='focus-out'?false:editable?start.current:trigger.current}>
        <Popover.Title className="bui-sr-only">{label}</Popover.Title>
        {presets.length>0&&<div className="bui-date-presets" role="group" aria-label={label+' presets'}>{presets.map(preset=>{
          const invalid=preset.value&&(!dateOrNull(preset.value.from)||!dateOrNull(preset.value.to))?'Choose both start and end dates.':rangeEntryMessage(formatDateValue(preset.value?.from),formatDateValue(preset.value?.to),{required,...calendar});
          return <Button key={preset.id} size="sm" variant="ghost" disabled={!!invalid} title={invalid||undefined} aria-pressed={rangeKey(preset.value)===draftKey} onClick={()=>{updateDraft(preset.value);setCalendarEpoch(epoch=>epoch+1);}}>{preset.label}</Button>;
        })}</div>}
        <Calendar {...calendar} key={calendarEpoch} defaultMonth={draft?.from??calendar.defaultMonth} label={label} mode="range" value={draft??undefined} autoFocus={calendarEpoch===0} onValueChange={range=>updateDraft(range??null)}/>
        {footer}
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
    {editable&&explicit&&!open&&dirty&&<div className="bui-date-inline-actions">{footer}</div>}
    {required&&!editable&&<span className="bui-sr-only" id={id+'-required'}>Required. Choose start and end dates before submitting.</span>}
    {name&&(!editable||explicit)&&<><input type="hidden" name={name+'.from'} form={form} value={formatDateValue(selected?.from)} disabled={calendar.disabled}/><input type="hidden" name={name+'.to'} form={form} value={formatDateValue(selected?.to)} disabled={calendar.disabled}/></>}
    {(hint||feedback)&&<p id={id+'-description'} className={feedback?'bui-error':'bui-hint'} role={feedback?'alert':undefined}>{feedback||hint}</p>}
  </div>;
}
