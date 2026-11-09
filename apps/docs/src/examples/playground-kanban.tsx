'use client';
import {useEffect,useRef,useState} from 'react';
import {Kanban} from '@bld8/ui/kanban';
import {applyKanbanMove,type KanbanItem,type KanbanMove} from '@bld8/ui/kanban-state';
import {Alert,Button,EmptyState,Skeleton} from '@bld8/ui/core';
import {Reveal} from '@bld8/ui/reveal';

export interface KanbanExampleConfig {
  state:string;kanbanLayout:'board'|'backlog';kanbanLimit:number;
  kanbanOrder:string[];actionResult:'Success'|'Error';
}
const tasks:KanbanItem[]=[{id:'brief',columnId:'planned',title:'Prepare the brief'},{id:'keyboard',columnId:'active',title:'Review keyboard flow'},{id:'notes',columnId:'planned',title:'Keep the notes'},{id:'publish',columnId:'done',title:'Share the example'}];
function orderedTasks(order:readonly string[]){return order.map(value=>{const [id,columnId]=value.split(':');return {...tasks.find(item=>item.id===id)!,columnId};});}
export function KanbanExample({config,onChange}:{config:KanbanExampleConfig;onChange:(value:KanbanExampleConfig)=>void}){
  const root=useRef<HTMLDivElement>(null),operation=useRef<AbortController|null>(null),latest=useRef(config);latest.current=config;
  const [optimistic,setOptimistic]=useState<KanbanItem[]|null>(null),[pending,setPending]=useState(false),[failed,setFailed]=useState<KanbanMove|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
  const confirmed=orderedTasks(config.kanbanOrder),items=optimistic??confirmed,configKey=JSON.stringify(config);
  const columns=[{id:'planned',title:'Planned'},{id:'active',title:'In progress',limit:config.kanbanLimit},{id:'done',title:'Done'}];
  useEffect(()=>{const interrupted=!!operation.current;operation.current?.abort();operation.current=null;setOptimistic(null);setPending(false);setFailed(null);setError('');if(interrupted)setMessage('Sample move cancelled because configuration changed.');return()=>operation.current?.abort();},[configKey]);
  async function move(change:KanbanMove,recovery=false){
    if(operation.current&&!operation.current.signal.aborted||pending)return;
    let next:KanbanItem[];try{next=applyKanbanMove(confirmed,change,columns);}catch(cause){setError((cause as Error).message);return;}
    const controller=new AbortController();operation.current=controller;setOptimistic(next);setPending(true);setError('');setMessage('Saving this sample move.');
    await new Promise<void>(resolve=>{const timer=setTimeout(resolve,500);controller.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve();},{once:true});});
    if(controller.signal.aborted)return;
    if(config.actionResult==='Error'&&!recovery){setOptimistic(null);setFailed(change);setError('The move was not saved. The earlier order is restored.');setMessage('');}
    else{onChange({...latest.current,kanbanOrder:next.map(item=>item.id+':'+item.columnId)});setOptimistic(null);setFailed(null);setMessage('Sample move saved.');}
    setPending(false);operation.current=null;
    requestAnimationFrame(()=>{if(document.activeElement===document.body)root.current?.querySelector<HTMLButtonElement>(`[data-item-id="${change.itemId}"] button`)?.focus({preventScroll:true});});
  }
  return <div ref={root} style={{display:'grid',gap:16,minWidth:0,width:'100%'}}>
    <p className="bui-hint">Local sample. Moves simulate a 500 ms save; confirmed order is included in the configuration link.</p>
    {config.state==='Loading'?<div aria-label="Loading board" role="status"><Skeleton width="100%" height={280}/></div>:config.state==='Error'?<Alert title="The board could not be loaded" tone="danger" live><p>Sample connection unavailable.</p><Button variant="secondary" size="sm" onClick={()=>onChange({...config,state:'Default'})}>Retry board</Button></Alert>:config.state==='Empty'?<EmptyState title="No tasks yet" children="Start with a small example." action={<Button variant="secondary" onClick={()=>onChange({...config,state:'Default'})}>Restore sample tasks</Button>}/>:<Kanban label="Project board" columns={columns} items={items} layout={config.kanbanLayout} disabled={config.state==='Disabled'} pending={pending} onMove={change=>void move(change)}/>}
    <Reveal open={!!error}><Alert title="Move not saved" tone="danger" live><p>{error}</p>{failed&&<Button variant="secondary" size="sm" loading={pending} onClick={()=>void move(failed,true)}>Retry with a successful response</Button>}</Alert></Reveal>
    <p className="bui-hint" role="status">{message}</p>
  </div>;
}
