/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {useUIConfig} from './ui-config.js';
import {normalizePanelLayout,resizePanelPair,togglePanelLayout,type PanelLayout,type ResizablePanelConstraint} from './resizable-panel-state.js';
export interface ResizablePanel extends ResizablePanelConstraint {label:string;children:ReactNode}
export interface PanelLayoutDetails {reason:'pointer'|'keyboard'|'collapse'|'restore'|'reset'|'cancel'}
export interface ResizablePanelsProps {
  label:string;panels:readonly ResizablePanel[];orientation?:'horizontal'|'vertical';
  layout?:Readonly<PanelLayout>;defaultLayout?:Readonly<PanelLayout>;
  onLayoutChange?:(layout:PanelLayout,details:PanelLayoutDetails)=>void;
  /** Persist only committed layouts. Pointer cancellation restores the starting proposal. */
  onLayoutCommit?:(layout:PanelLayout,details:PanelLayoutDetails)=>void;
  disabled?:boolean;mobileBreakpoint?:number;showControls?:boolean;className?:string;style?:CSSProperties;
}
type Drag={pointerId:number;index:number;start:number;available:number;origin:PanelLayout;latest:PanelLayout};
export function ResizablePanels({label,panels,orientation='horizontal',layout,defaultLayout,onLayoutChange,onLayoutCommit,disabled=false,mobileBreakpoint=640,showControls=true,className,style}:ResizablePanelsProps){
  const config=useUIConfig(),id=useId(),root=useRef<HTMLDivElement>(null),area=useRef<HTMLDivElement>(null),drag=useRef<Drag|null>(null),remembered=useRef<PanelLayout>({});
  const [uncontrolled,setUncontrolled]=useState(()=>normalizePanelLayout(panels,defaultLayout)),[compact,setCompact]=useState(false),[dragging,setDragging]=useState(false),[announcement,setAnnouncement]=useState('');
  const current=normalizePanelLayout(panels,layout??uncontrolled),currentRef=useRef(current);currentRef.current=current;
  const signature=panels.map(panel=>panel.id).join('|');
  useLayoutEffect(()=>{const element=root.current;if(!element)return;const measure=()=>setCompact(orientation==='horizontal'&&element.getBoundingClientRect().width<Math.max(0,mobileBreakpoint));measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[orientation,mobileBreakpoint]);
  const constraints=JSON.stringify(panels.map(({id,minSize,maxSize,collapsible})=>({id,minSize,maxSize,collapsible})));
  useLayoutEffect(()=>{const active=drag.current;if(!active)return;drag.current=null;setDragging(false);const next=normalizePanelLayout(panels,active.origin);currentRef.current=next;if(layout===undefined)setUncontrolled(next);onLayoutChange?.({...next},{reason:'cancel'});},[disabled,compact,orientation,signature,constraints]);
  useLayoutEffect(()=>()=>{drag.current=null;},[]);
  function update(next:PanelLayout,reason:PanelLayoutDetails['reason'],commit=false){currentRef.current=next;if(layout===undefined)setUncontrolled(next);onLayoutChange?.({...next},{reason});if(commit)onLayoutCommit?.({...next},{reason});}
  function toggle(index:number){if(disabled||compact)return;const panel=panels[index],before=currentRef.current[panel.id];if(before>0)remembered.current[panel.id]=before;const next=togglePanelLayout(panels,currentRef.current,panel.id,remembered.current[panel.id]);if(JSON.stringify(next)===JSON.stringify(currentRef.current))return;const content=area.current?.querySelector<HTMLElement>('[data-panel-id="'+panel.id+'"]');if(next[panel.id]===0&&content?.contains(document.activeElement))root.current?.querySelector<HTMLButtonElement>('[data-panel-toggle="'+panel.id+'"]')?.focus({preventScroll:true});update(next,before===0?'restore':'collapse',true);setAnnouncement(panel.label+(next[panel.id]===0?' collapsed.':' restored.'));}
  function finish(cancel=false){const active=drag.current;if(!active)return;drag.current=null;setDragging(false);if(cancel)update(active.origin,'cancel');else onLayoutCommit?.({...active.latest},{reason:'pointer'});}
  return <div ref={root} className={['bui-resizable',className].filter(Boolean).join(' ')} style={style} data-orientation={orientation} data-compact={compact||undefined} data-dragging={dragging||undefined} data-motion={config.motion} dir={config.direction} role="group" aria-label={label}>
    {showControls&&panels.some(panel=>panel.collapsible)&&!compact&&<div className="bui-resizable-controls">{panels.map((panel,index)=>panel.collapsible?<button key={panel.id} type="button" data-panel-toggle={panel.id} aria-controls={id+'-'+panel.id} aria-expanded={current[panel.id]>0} disabled={disabled} onClick={()=>toggle(index)}>{current[panel.id]===0?'Restore':'Collapse'} {panel.label}</button>:null)}</div>}
    <div className="bui-resizable-area" ref={area}>{panels.map((panel,index)=>{const collapsed=!compact&&current[panel.id]===0,after=panels[index+1],pairTotal=after?current[panel.id]+current[after.id]:0;return <div className="bui-resizable-part" key={panel.id} style={compact?undefined:{flexGrow:current[panel.id],flexBasis:0}} data-collapsed={collapsed||undefined}>
      <section id={id+'-'+panel.id} data-panel-id={panel.id} className="bui-resizable-panel" aria-label={panel.label} aria-hidden={collapsed||undefined} inert={collapsed||undefined}>{panel.children}</section>
      {after&&!compact&&<div className="bui-resize-handle" role="separator" tabIndex={disabled?-1:0} aria-label={'Resize '+panel.label+' and '+after.label} aria-orientation={orientation==='horizontal'?'vertical':'horizontal'} aria-controls={id+'-'+panel.id+' '+id+'-'+after.id} aria-valuemin={Math.max(panel.collapsible?0:panel.minSize??10,pairTotal-(after.maxSize??100))} aria-valuemax={Math.min(panel.maxSize??100,pairTotal-(after.collapsible?0:after.minSize??10))} aria-valuenow={Math.round(current[panel.id]*10)/10} aria-valuetext={panel.label+' '+Math.round(current[panel.id])+' percent'} aria-disabled={disabled||undefined}
        onPointerDown={event=>{if(disabled||event.button!==0||!area.current)return;const rect=area.current.getBoundingClientRect(),available=(orientation==='horizontal'?rect.width:rect.height)-(panels.length-1)*12;if(available<=0)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointerId:event.pointerId,index,start:orientation==='horizontal'?event.clientX:event.clientY,available,origin:{...currentRef.current},latest:{...currentRef.current}};setDragging(true);}}
        onPointerMove={event=>{const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;if(disabled||compact){finish(true);return;}const position=orientation==='horizontal'?event.clientX:event.clientY,sign=orientation==='horizontal'&&config.direction==='rtl'?-1:1,next=resizePanelPair(panels,active.origin,index,active.origin[panel.id]+(position-active.start)/active.available*100*sign);active.latest=next;update(next,'pointer');}}
        onPointerUp={event=>{if(drag.current?.pointerId===event.pointerId)finish(disabled||compact);}}
        onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>{if(drag.current)finish(true);}}
        onDoubleClick={()=>{if(disabled)return;const next=normalizePanelLayout(panels,defaultLayout);update(next,'reset',true);}}
        onKeyDown={event=>{if(disabled)return;if(event.key==='Escape'&&drag.current){event.preventDefault();finish(true);return;}if(event.key==='Enter'){const target=panel.collapsible?index:after.collapsible?index+1:-1;if(target>=0){event.preventDefault();toggle(target);}return;}const previous=orientation==='horizontal'?'ArrowLeft':'ArrowUp',nextKey=orientation==='horizontal'?'ArrowRight':'ArrowDown';if(![previous,nextKey,'Home','End'].includes(event.key))return;event.preventDefault();const sign=orientation==='horizontal'&&config.direction==='rtl'?-1:1,step=event.shiftKey?10:2,proposed=event.key==='Home'?0:event.key==='End'?100:currentRef.current[panel.id]+(event.key===nextKey?step:-step)*sign;update(resizePanelPair(panels,currentRef.current,index,proposed),'keyboard',true);}}
      ><span aria-hidden="true"/></div>}
    </div>;})}</div><span className="bui-sr-only" role="status">{announcement}</span>
  </div>;
}
