'use client';
import {useRef,useState,type KeyboardEvent,type PointerEvent,type TouchEvent} from 'react';
import {Select} from '@base-ui/react/select';
import {Combobox} from '@base-ui/react/combobox';
import {Check,ChevronDown,Search} from 'lucide-react';
import {Icon} from './core.js';

export interface GridChoiceResult {value:string;intent:'choose'|'dismiss'|'tab';restoreFocus:boolean;reverse?:boolean}
interface GridChoiceProps {
  label:string;columnKey:string;owner:string;options:readonly {value:string;label:string}[];
  value:string;active:boolean;searchable:boolean;disabled:boolean;errorId?:string;
  onFinish:(result:GridChoiceResult)=>boolean|void;onClosed:()=>void;
}

/** Internal cell editor. Only a choice writes a value; filtering never does. */
export function GridChoiceEditor({label,columnKey,owner,options,value,active,searchable,disabled,errorId,onFinish,onClosed}:GridChoiceProps) {
  const [open,setOpen]=useState(true),[query,setQuery]=useState('');
  const finished=useRef(false),search=useRef<HTMLInputElement>(null);
  const touch=useRef<{id:number;value:string;x:number;y:number}|null>(null);
  const labelFor=(value:string)=>options.find(option=>option.value===value)?.label??value;
  function finish(result:GridChoiceResult){if(finished.current)return true;finished.current=true;setOpen(false);return onFinish(result);}
  function close(next:boolean,reason:string){
    setOpen(next);
    if(!next)finish({value,intent:reason==='item-press'?'choose':'dismiss',restoreFocus:reason!=='outside-press'&&reason!=='focus-out'&&reason!=='window-resize'});
  }
  function tab(event:KeyboardEvent){if(event.key!=='Tab')return;event.stopPropagation();if(finish({value,intent:'tab',reverse:event.shiftKey,restoreFocus:true})!==false)event.preventDefault();}
  function touchChoice(value:string){return {
    onPointerDown:(event:PointerEvent<HTMLDivElement>)=>{if(event.pointerType==='touch'&&event.isPrimary)touch.current={id:event.pointerId,value,x:event.clientX,y:event.clientY};},
    onPointerMove:(event:PointerEvent<HTMLDivElement>)=>{const start=touch.current;if(start?.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)touch.current=null;},
    onPointerCancel:()=>{touch.current=null;},
    onTouchStart:(event:TouchEvent<HTMLDivElement>)=>{const point=event.touches[0];if(event.touches.length===1&&point)touch.current={id:point.identifier,value,x:point.clientX,y:point.clientY};else touch.current=null;},
    onTouchMove:(event:TouchEvent<HTMLDivElement>)=>{const start=touch.current,point=event.touches[0];if(start&&(!point||event.touches.length!==1||Math.hypot(point.clientX-start.x,point.clientY-start.y)>8))touch.current=null;},
    onTouchCancel:()=>{touch.current=null;},
    onTouchEnd:(event:TouchEvent<HTMLDivElement>)=>{const start=touch.current,point=event.changedTouches[0];touch.current=null;if(disabled||!start||!point||start.value!==value||Math.hypot(point.clientX-start.x,point.clientY-start.y)>8||!event.currentTarget.contains(document.elementFromPoint(point.clientX,point.clientY)))return;event.preventDefault();finish({value,intent:'choose',restoreFocus:true});},
  };}
  const trigger={className:'bui-data-grid-choice-trigger','aria-label':label,'aria-invalid':!!errorId||undefined,'aria-describedby':errorId,'data-grid-choice-owner':owner,'data-closing':!active||undefined,tabIndex:-1,onKeyDownCapture:tab};
  const content=<><span className="bui-data-grid-value bui-data-grid-choice-value" data-value={value}>{labelFor(value)||'Choose an option'}</span><Icon icon={ChevronDown} size={14}/></>;
  const popup={className:'bui-data-grid-choice-popup','data-grid-column-key':columnKey,'data-grid-choice-owner':owner,'data-searchable':searchable||undefined,onKeyDownCapture:tab,finalFocus:false as const};
  const completed=(next:boolean)=>{if(!next)onClosed();};
  if(searchable)return <Combobox.Root items={options.map(option=>option.value)} value={value} itemToStringLabel={labelFor} itemToStringValue={value=>value} inputValue={query} autoHighlight open={active&&open} disabled={disabled}
    onInputValueChange={(next,details)=>{if(details.reason==='input-change'||details.reason==='input-clear')setQuery(next);}}
    onValueChange={(next,details)=>{if(details.reason==='item-press'&&next!==null)finish({value:next,intent:'choose',restoreFocus:true});}}
    onOpenChange={(next,details)=>close(next,details.reason)} onOpenChangeComplete={completed}>
    <Combobox.Trigger {...trigger}>{content}</Combobox.Trigger>
    <Combobox.Portal><Combobox.Positioner className="bui-positioner bui-data-grid-choice-positioner" align="start" sideOffset={5} collisionPadding={12} disableAnchorTracking={!active||!open}>
      <Combobox.Popup {...popup} initialFocus={search}>
        <div className="bui-data-grid-choice-search"><Icon icon={Search} size={14}/><Combobox.Input ref={search} aria-label={'Search '+label+' options'} placeholder="Find an option…" autoComplete="off"/></div>
        <Combobox.Empty className="bui-data-grid-choice-empty">No matching options. Try another search.</Combobox.Empty>
        <Combobox.List className="bui-data-grid-choice-list">{(item:string)=><Combobox.Item key={item} value={item} {...touchChoice(item)} className="bui-data-grid-choice-option"><span>{labelFor(item)}</span><Combobox.ItemIndicator className="bui-data-grid-choice-check"><Icon icon={Check} size={14}/></Combobox.ItemIndicator></Combobox.Item>}</Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner></Combobox.Portal>
  </Combobox.Root>;
  return <Select.Root items={options} value={value} open={active&&open} modal={false} disabled={disabled}
    onValueChange={(next,details)=>{if(details.reason==='item-press'&&next!==null)finish({value:next,intent:'choose',restoreFocus:true});}}
    onOpenChange={(next,details)=>close(next,details.reason)} onOpenChangeComplete={completed}>
    <Select.Trigger {...trigger}>{content}</Select.Trigger>
    <Select.Portal><Select.Positioner className="bui-positioner bui-data-grid-choice-positioner" align="start" sideOffset={5} collisionPadding={12} alignItemWithTrigger={false} disableAnchorTracking={!active||!open}>
      <Select.Popup {...popup}><Select.List className="bui-data-grid-choice-list">{options.map(option=><Select.Item key={option.value} value={option.value} {...touchChoice(option.value)} className="bui-data-grid-choice-option"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className="bui-data-grid-choice-check"><Icon icon={Check} size={14}/></Select.ItemIndicator></Select.Item>)}</Select.List></Select.Popup>
    </Select.Positioner></Select.Portal>
  </Select.Root>;
}
