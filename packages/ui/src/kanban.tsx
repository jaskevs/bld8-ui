'use client';
import {useEffect,useId,useRef,useState,type ReactNode,type FormEvent} from 'react';
import {DndContext,DragOverlay,MouseSensor,TouchSensor,closestCenter,pointerWithin,useDroppable,useSensor,useSensors,type DragOverEvent,type CollisionDetection} from '@dnd-kit/core';
import {SortableContext,useSortable,verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {LayoutGroup,motion} from 'motion/react';
import {useReducedMotionPreference} from './motion-preference.js';
import {GripVertical} from 'lucide-react';
import {Button,IconButton} from './core.js';
import {Dialog} from './overlays.js';
import {Select} from './controls.js';
import {applyKanbanMove,kanbanOrderKey,validateKanban,type KanbanColumn,type KanbanItem,type KanbanMove} from './kanban-state.js';

export interface KanbanProps<T extends KanbanItem=KanbanItem> {
  label:string; columns:readonly KanbanColumn[]; items:readonly T[];
  /** Apply this move to owned state; pending/disabled prevents further moves while saving. */
  onMove:(move:KanbanMove)=>void;
  renderItem?:(item:T)=>ReactNode; disabled?:boolean; pending?:boolean;
  /** Backlog stacks columns and uses wider aligned rows. */
  layout?:'board'|'backlog';
}
const easing=[.16,1,.3,1] as const;
const cardKey=(id:string)=>'card:'+id;
const laneKey=(id:string)=>'column:'+id;
const collision:CollisionDetection=args=>{const hits=args.pointerCoordinates?pointerWithin(args):closestCenter(args);return hits.some(hit=>String(hit.id).startsWith('card:'))?hits.filter(hit=>String(hit.id).startsWith('card:')):hits;};

function SortableCard<T extends KanbanItem>({item,disabled,dragging,group,renderItem,onMove,reduced}:{item:T;disabled:boolean;dragging:boolean;group:string;renderItem?:(item:T)=>ReactNode;onMove:(item:T,button:HTMLButtonElement)=>void;reduced:boolean}) {
  const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:cardKey(item.id),data:{kind:'card',itemId:item.id,columnId:item.columnId},disabled,transition:{duration:reduced?0:220,easing:'cubic-bezier(.16,1,.3,1)'}});
  return <li ref={setNodeRef} className="bui-kanban-item" data-item-id={item.id} data-dragging={isDragging||undefined} style={{transform:CSS.Transform.toString(transform),transition:reduced?'none':transition}}>
    <motion.article className="bui-kanban-card" layout={!dragging?'position':false} layoutId={!dragging?group+'-'+item.id:undefined} initial={false} transition={{duration:reduced?0:.24,ease:easing}} aria-label={item.title}>
      <div className="bui-kanban-content">{renderItem?renderItem(item):<h4>{item.title}</h4>}</div>
      <IconButton ref={setActivatorNodeRef} {...attributes} {...listeners} icon={GripVertical} label={'Move '+item.title} variant="ghost" className="bui-kanban-handle" disabled={disabled} onClick={event=>onMove(item,event.currentTarget)}/>
    </motion.article>
  </li>;
}
function Lane<T extends KanbanItem>({column,items,disabled,dragging,group,renderItem,onMove,reduced}:{column:KanbanColumn;items:T[];disabled:boolean;dragging:boolean;group:string;renderItem?:(item:T)=>ReactNode;onMove:(item:T,button:HTMLButtonElement)=>void;reduced:boolean}) {
  const {setNodeRef,isOver}=useDroppable({id:laneKey(column.id),data:{kind:'column',columnId:column.id},disabled});
  return <section ref={setNodeRef} className="bui-kanban-column" data-over={isOver||undefined} data-column-id={column.id} aria-label={column.title+' column'}>
    <header className="bui-kanban-column-heading"><div><h3>{column.title}</h3>{column.description&&<p>{column.description}</p>}</div><span className="bui-kanban-count" aria-label={items.length+' items'+(column.limit?' of '+column.limit+' maximum':'')}>{items.length}{column.limit?' / '+column.limit:''}</span></header>
    <SortableContext items={items.map(item=>cardKey(item.id))} strategy={verticalListSortingStrategy}><ol className="bui-kanban-list" aria-label={column.title+' items'}>{items.map(item=><SortableCard key={item.id} {...{item,disabled,dragging,group,renderItem,onMove,reduced}}/>)}</ol></SortableContext>
    {!items.length&&<p className="bui-kanban-empty">Drop an item here, or use its Move action.</p>}
  </section>;
}

export function Kanban<T extends KanbanItem>({label,columns,items,onMove,renderItem,disabled=false,pending=false,layout='board'}:KanbanProps<T>) {
  const group=useId(),root=useRef<HTMLElement>(null),reduced=!!useReducedMotionPreference(),blocked=disabled||pending;
  const [preview,setPreview]=useState<T[]|null>(null),[activeId,setActiveId]=useState<string|null>(null),[message,setMessage]=useState('');
  const snapshot=useRef<readonly T[]|null>(null),draft=useRef<T[]|null>(null),cancelled=useRef(false),dropAllowed=useRef(true);
  const [moving,setMoving]=useState<string|null>(null),[destination,setDestination]=useState(''),[position,setPosition]=useState('end'),[moveError,setMoveError]=useState('');
  const finalFocus=useRef<HTMLElement|null>(null),focusId=useRef<string|null>(null);
  const sensors=useSensors(useSensor(MouseSensor,{activationConstraint:{distance:6}}),useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}));
  const shown=preview??[...items],active=items.find(item=>item.id===activeId),movingItem=items.find(item=>item.id===moving),invalid=validateKanban(items,columns);
  useEffect(()=>{if(snapshot.current&&snapshot.current!==items){cancelled.current=true;setPreview(null);setActiveId(null);setMessage('The board changed. The move was cancelled.');}},[items]);
  useEffect(()=>{if(!moving&&!pending&&focusId.current){const id=focusId.current;focusId.current=null;requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('[data-item-id="'+globalThis.CSS.escape(id)+'"] .bui-kanban-handle')?.focus({preventScroll:true}));}},[items,moving,pending,activeId]);
  function openMove(item:T,button:HTMLButtonElement){finalFocus.current=button;setMoving(item.id);setDestination(item.columnId);setPosition('end');setMoveError('');}
  function resetDrag(){focusId.current=activeId;snapshot.current=null;draft.current=null;setPreview(null);setActiveId(null);}
  function over(event:DragOverEvent){if(cancelled.current||!snapshot.current||!event.over)return;dropAllowed.current=true;const current=draft.current??[...items],id=String(event.active.id).slice(5),item=current.find(item=>item.id===id),data=event.over.data.current;if(!item||!data)return;
    const target=String(data.columnId),targetItems=current.filter(item=>item.columnId===target&&item.id!==id);let beforeId:string|null=null;
    if(data.kind==='card'){const overItem=current.find(item=>item.id===data.itemId);if(!overItem||overItem.id===id)return;const after=(event.active.rect.current.translated?.top??0)>event.over.rect.top+event.over.rect.height/2;beforeId=after?targetItems[targetItems.findIndex(item=>item.id===overItem.id)+1]?.id??null:overItem.id;}
    try{const next=applyKanbanMove(current,{itemId:id,fromColumnId:item.columnId,toColumnId:target,beforeId},columns);if(kanbanOrderKey(next)!==kanbanOrderKey(current)){draft.current=next;setPreview(next);}}catch{dropAllowed.current=false;setMessage('That column is full. Choose another position.');}
  }
  function submit(event:FormEvent){event.preventDefault();if(!movingItem||blocked)return;const move:KanbanMove={itemId:movingItem.id,fromColumnId:movingItem.columnId,toColumnId:destination,beforeId:position==='end'?null:position.slice(7)};
    try{const next=applyKanbanMove(items,move,columns);focusId.current=movingItem.id;setMoving(null);if(kanbanOrderKey(next)!==kanbanOrderKey(items))onMove(move);setMessage(movingItem.title+' moved to '+columns.find(column=>column.id===destination)?.title+'.');}catch(error){setMoveError(error instanceof Error?error.message:'Choose an available position.');}}
  if(invalid)return <p role="alert" className="bui-error">{invalid}</p>;
  return <section ref={root} className="bui-kanban" data-layout={layout} data-reduced-motion={reduced} aria-label={label} aria-busy={pending}>
    <p className="bui-kanban-instructions">Drag a handle to reorder. Select the same handle to choose a column and position.</p>
    <DndContext id={group} sensors={sensors} collisionDetection={collision} accessibility={{screenReaderInstructions:{draggable:'Select the Move button to choose a column and position. Pointer and touch dragging are also available.'},announcements:{onDragStart:({active})=>'Picked up '+items.find(item=>cardKey(item.id)===active.id)?.title+'. Press Escape to cancel.',onDragOver:({over})=>over?'Over '+columns.find(column=>column.id===over.data.current?.columnId)?.title+'.':undefined,onDragCancel:()=> 'Move cancelled. Original order restored.',onDragEnd:()=> 'Drag finished. Check the board status for the save result.'}}}
      onDragStart={event=>{snapshot.current=items;draft.current=[...items];cancelled.current=false;dropAllowed.current=true;setActiveId(String(event.active.id).slice(5));setMessage('');}}
      onDragOver={over} onDragCancel={()=>{resetDrag();setMessage('Move cancelled. Original order restored.');}}
      onDragEnd={event=>{const original=snapshot.current,next=draft.current,id=String(event.active.id).slice(5);if(event.over&&!cancelled.current&&dropAllowed.current&&original&&next){const item=original.find(item=>item.id===id),moved=next.find(item=>item.id===id);if(item&&moved&&kanbanOrderKey(original)!==kanbanOrderKey(next)){const lane=next.filter(item=>item.columnId===moved.columnId),index=lane.findIndex(item=>item.id===id);try{onMove({itemId:id,fromColumnId:item.columnId,toColumnId:moved.columnId,beforeId:lane[index+1]?.id??null});setMessage(item.title+' moved to '+columns.find(column=>column.id===moved.columnId)?.title+'.');}catch{setMessage('The move could not be applied. Review the latest board.');}}}else setMessage('Move cancelled. Original order restored.');resetDrag();}}>
      <LayoutGroup id={group}><div className="bui-kanban-columns">{columns.map(column=><Lane key={column.id} {...{column,disabled:blocked,dragging:!!activeId,group,renderItem,onMove:openMove,reduced}} items={shown.filter(item=>item.columnId===column.id)}/>)}</div></LayoutGroup>
      <DragOverlay dropAnimation={reduced?null:{duration:220,easing:'cubic-bezier(.16,1,.3,1)'}}>{active?<div aria-hidden="true" className="bui-kanban-card bui-kanban-overlay"><div className="bui-kanban-content">{renderItem?renderItem(active):<h4>{active.title}</h4>}</div><GripVertical size={18}/></div>:null}</DragOverlay>
    </DndContext>
    <p role="status" className="bui-kanban-status">{message}</p>
    <Dialog title="Move item" description={movingItem?.title??'Choose a new column and position.'} open={!!moving} onOpenChange={open=>{if(!open)setMoving(null);}} finalFocus={finalFocus}>
      <form className="bui-kanban-move-form" onSubmit={submit}><Select label="Destination column" value={destination} options={columns.map(column=>({value:column.id,label:column.title,disabled:column.id!==movingItem?.columnId&&column.limit!==undefined&&items.filter(item=>item.columnId===column.id).length>=column.limit}))} onValueChange={value=>{setDestination(value??'');setPosition('end');setMoveError('');}} disabled={blocked}/>
        <Select label="Position" value={position} options={[{value:'end',label:'At end of column'},...items.filter(item=>item.columnId===destination&&item.id!==moving).map(item=>({value:'before:'+item.id,label:'Before '+item.title}))]} onValueChange={value=>{setPosition(value??'end');setMoveError('');}} disabled={blocked}/>
        {moveError&&<p className="bui-error" role="alert">{moveError}</p>}<Button type="submit" disabled={blocked||!movingItem}>Move item</Button>
      </form>
    </Dialog>
  </section>;
}
