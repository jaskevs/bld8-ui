'use client';
import {useState} from 'react';
import {Kanban,applyKanbanMove,type KanbanItem} from '@bld8/ui';
const columns=[{id:'planned',title:'Planned'},{id:'progress',title:'In progress',limit:2},{id:'done',title:'Done'}];
export function KanbanDemo(){const[items,setItems]=useState<KanbanItem[]>([{id:'one',columnId:'planned',title:'Check the keyboard flow'},{id:'two',columnId:'planned',title:'Write the usage notes'},{id:'three',columnId:'progress',title:'Refine the details'}]);return <Kanban label="Release board" columns={columns} items={items} onMove={move=>setItems(items=>applyKanbanMove(items,move,columns))}/>;}
