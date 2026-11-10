'use client';
import {useId,useLayoutEffect,useRef,type CSSProperties} from 'react';
import {DndContext,MouseSensor,TouchSensor,closestCenter,useSensor,useSensors} from '@dnd-kit/core';
import {SortableContext,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical} from 'lucide-react';
import {IconButton} from './core.js';
import {useReducedMotionPreference} from './motion-preference.js';
import type {TableOrderContextProps,OrderedTableRowProps,TableColumnListProps} from './table-order-controls.js';

export function TableOrderContext({keys,disabled,onMove,children,kind='row'}:TableOrderContextProps) {
  const id=useId(),reduced=!!useReducedMotionPreference(),root=useRef<HTMLDivElement>(null),rects=useRef(new Map<string,number>()),dragging=useRef(false),snapshot=useRef(''),invalidated=useRef(false);
  const sensors=useSensors(useSensor(MouseSensor,{activationConstraint:{distance:6}}),useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}));
  const identity=JSON.stringify(keys),latest=useRef(identity);latest.current=identity;
  useLayoutEffect(()=>{
    if(dragging.current&&identity!==snapshot.current)invalidated.current=true;
    const next=new Map<string,number>();
    root.current?.querySelectorAll<HTMLElement>('[data-order-key]').forEach(element=>{
      element.getAnimations().forEach(animation=>animation.cancel());
      const key=element.dataset.orderKey!,top=element.getBoundingClientRect().top-(root.current?.getBoundingClientRect().top??0);next.set(key,top);
      const before=rects.current.get(key);
      if(!reduced&&!dragging.current&&before!==undefined&&Math.abs(before-top)>1)element.animate([{transform:`translateY(${before-top}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
    });
    rects.current=next;
  },[identity,reduced]);
  return <div ref={root} className="bui-table-order-context"><DndContext id={id} sensors={sensors} collisionDetection={closestCenter} accessibility={{screenReaderInstructions:{draggable:'Use the Move action to choose a position. Pointer and touch dragging are also available.'},announcements:{onDragStart:()=>`Moving ${kind}. Press Escape to cancel.`,onDragOver:()=>undefined,onDragCancel:()=> 'Move cancelled.',onDragEnd:()=> 'Drag finished. Check the table status for the result.'}}} onDragStart={()=>{snapshot.current=latest.current;invalidated.current=false;dragging.current=true;}} onDragCancel={()=>{dragging.current=false;}} onDragEnd={event=>{
    dragging.current=false;if(disabled||invalidated.current||snapshot.current!==latest.current||!event.over||event.active.id===event.over.id)return;
    const from=String(event.active.id),to=String(event.over.id);if(keys.includes(from)&&keys.includes(to))onMove(from,to,keys.indexOf(from)<keys.indexOf(to));
  }}><SortableContext items={keys} strategy={verticalListSortingStrategy} disabled={disabled}>{children}</SortableContext></DndContext></div>;
}

export function OrderedTableRow({id,label,disabled,children,onChoose,selected}:OrderedTableRowProps) {
  const reduced=!!useReducedMotionPreference();
  const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id,disabled,transition:{duration:reduced?0:240,easing:'cubic-bezier(.16,1,.3,1)'}});
  return <tr ref={setNodeRef} data-order-key={id} data-row-key={id} data-selected={selected||undefined} data-dragging={isDragging||undefined} style={{transform:CSS.Transform.toString(transform),transition:reduced?'none':transition}}><td className="bui-table-reorder"><IconButton ref={setActivatorNodeRef} {...attributes} {...listeners} icon={GripVertical} label={'Move '+label} variant="ghost" disabled={disabled} onClick={event=>onChoose(id,event.currentTarget)}/></td>{children}</tr>;
}

function ColumnOrderItem({id,label,disabled,children,onChoose}:OrderedTableRowProps) {
  const reduced=!!useReducedMotionPreference(),{attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id,disabled,transition:{duration:reduced?0:240,easing:'cubic-bezier(.16,1,.3,1)'}});
  return <div ref={setNodeRef} className="bui-column-order-item" data-order-key={id} data-dragging={isDragging||undefined} style={{transform:CSS.Transform.toString(transform),transition:reduced?'none':transition} as CSSProperties}>{children}<IconButton ref={setActivatorNodeRef} {...attributes} {...listeners} icon={GripVertical} variant="ghost" label={'Move '+label+' column'} disabled={disabled} onClick={event=>onChoose(id,event.currentTarget)}/></div>;
}

/** Pointer/touch sorting is opt-in; position dialogs belong to the shared controls. */
export function DndColumnList({columns,onMove,onChoose,children}:TableColumnListProps) {
  return <TableOrderContext keys={columns.map(column=>column.key)} disabled={columns.length<2} onMove={onMove} kind="column">{columns.map(column=><ColumnOrderItem key={column.key} id={column.key} label={column.header} disabled={columns.length<2} onChoose={onChoose}>{children(column.key)}</ColumnOrderItem>)}</TableOrderContext>;
}
