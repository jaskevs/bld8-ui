'use client';
import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {LayoutGroup,motion} from 'motion/react';
import {CircleAlert,Columns3,List,Plus,RotateCcw} from 'lucide-react';
import {useReducedMotionPreference,Badge,Button,Dialog,EmptyState,Field,Input,Kanban,Select,Skeleton,applyKanbanMove,validateKanban,type KanbanColumn,type KanbanMove} from '@bld8/ui';

export interface WorkspaceTask { id:string; columnId:string; title:string; category:string; priority:'low'|'medium'|'high'; owner:string }
export interface TaskWorkspaceSaveContext { signal:AbortSignal; expectedRevision:number }
export interface TaskWorkspaceSaveResult { tasks:WorkspaceTask[]; revision:number }
export interface TaskWorkspaceProps {
  initialTasks?:WorkspaceTask[]; initialRevision?:number;
  /** Commit a complete board order atomically, checking expectedRevision on your server. */
  onSave?:(tasks:WorkspaceTask[],context:TaskWorkspaceSaveContext)=>Promise<TaskWorkspaceSaveResult>;
  loading?:boolean; error?:string; onRetry?:()=>void; disabled?:boolean;
}
export const taskColumns:readonly KanbanColumn[]=[{id:'planned',title:'Planned',description:'Ready when there is room.'},{id:'progress',title:'In progress',description:'Keep the active work small.',limit:3},{id:'done',title:'Done',description:'Small steps, finished.'}];
export const taskSamples:WorkspaceTask[]=[
  {id:'task-1',columnId:'planned',title:'Review keyboard navigation',category:'Accessibility',priority:'high',owner:'Maya'},
  {id:'task-2',columnId:'planned',title:'Refine the empty state',category:'Interface',priority:'medium',owner:'Sam'},
  {id:'task-3',columnId:'planned',title:'Document the loading states',category:'Documentation',priority:'low',owner:'Oliver'},
  {id:'task-4',columnId:'progress',title:'Build the settings form',category:'Engineering',priority:'high',owner:'Maya'},
  {id:'task-5',columnId:'progress',title:'Tune the focus transitions',category:'Interface',priority:'medium',owner:'Oliver'},
  {id:'task-6',columnId:'done',title:'Set the spacing scale',category:'Foundations',priority:'low',owner:'Sam'},
];
function validTasks(tasks:WorkspaceTask[]){return Array.isArray(tasks)&&!validateKanban(tasks,taskColumns)&&taskColumns.every(column=>column.limit===undefined||tasks.filter(task=>task.columnId===column.id).length<=column.limit)&&tasks.every(task=>typeof task.category==='string'&&task.category.length<=60&&typeof task.owner==='string'&&task.owner.length<=60&&['low','medium','high'].includes(task.priority)&&task.title.length<=120);}
const clone=(tasks:readonly WorkspaceTask[])=>tasks.map(task=>({...task}));
function TaskNotice({title,children,action}:{title:string;children:ReactNode;action?:ReactNode}) {
  const reduced=useReducedMotionPreference();
  return <motion.div className="bblocks-task-notice" role="alert" initial={{opacity:0,y:reduced?0:4}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.22,ease:[.16,1,.3,1]}}>
    <span className="bblocks-task-notice-icon" aria-hidden="true"><CircleAlert size={18}/></span>
    <div className="bblocks-task-notice-copy"><h3>{title}</h3><p>{children}</p></div>
    {action&&<div className="bblocks-task-notice-action">{action}</div>}
  </motion.div>;
}
export function TaskWorkspace({initialTasks=taskSamples,initialRevision=1,onSave,loading=false,error:loadError,onRetry,disabled=false}:TaskWorkspaceProps) {
  const [tasks,setTasks]=useState(()=>clone(initialTasks)),[revision,setRevision]=useState(initialRevision),[layout,setLayout]=useState<'board'|'backlog'>('board');
  const [pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[retry,setRetry]=useState<{tasks:WorkspaceTask[];revision:number}|null>(null);
  const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[priority,setPriority]=useState('medium'),[createError,setCreateError]=useState('');
  const titleInput=useRef<HTMLInputElement>(null);
  const current=useRef<AbortController|null>(null),rollback=useRef<WorkspaceTask[]>(tasks),mounted=useRef(true),reduced=!!useReducedMotionPreference();
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;current.current?.abort();};},[]);
  const invalid=!validTasks(tasks)||!Number.isInteger(revision)||revision<1,busy=pending||loading||disabled||!!loadError||invalid;
  async function commit(next:WorkspaceTask[],created=false){if(current.current||busy)return false;if(!validTasks(next)){setError('Review the task data before saving.');return false;}const before=clone(tasks),base=revision,controller=new AbortController();current.current=controller;rollback.current=before;setTasks(clone(next));setPending(true);setError('');setRetry(null);setMessage('Saving the task order…');
    try{const result=onSave?await onSave(clone(next),{signal:controller.signal,expectedRevision:base}):{tasks:clone(next),revision:base+1};
      if(controller.signal.aborted||!mounted.current||current.current!==controller)return false;
      if(!result||!validTasks(result.tasks)||!Number.isInteger(result.revision)||result.revision<=base)throw new Error('Invalid saved board.');
      setTasks(clone(result.tasks));setRevision(result.revision);setMessage(onSave?'Task changes saved.':'Task changes kept for this session.');if(created){setOpen(false);setTitle('');setCreateError('');}return true;
    }catch{if(!controller.signal.aborted&&mounted.current&&current.current===controller){setTasks(before);setError('The task changes could not be saved. The previous order is restored.');setRetry(created?null:{tasks:clone(next),revision:base});setMessage('');if(created)setCreateError('The task could not be saved. Your draft is kept. Try again.');}return false;}
    finally{if(current.current===controller){current.current=null;if(mounted.current)setPending(false);}}
  }
  function move(move:KanbanMove){try{void commit(applyKanbanMove(tasks,move,taskColumns));}catch(cause){setError(cause instanceof Error?cause.message:'Review the latest board before moving.');}}
  function cancel(){const controller=current.current;if(!controller)return;current.current=null;controller.abort();setTasks(rollback.current);setPending(false);setRetry(null);setError('');setMessage('Save cancelled. The previous order is restored.');}
  function create(event:FormEvent){event.preventDefault();if(title.trim().length<3||title.trim().length>120){setCreateError('Use a title between 3 and 120 characters.');titleInput.current?.focus();return;}void commit([...tasks,{id:crypto.randomUUID(),columnId:'planned',title:title.trim(),category:'Workspace',priority:priority as WorkspaceTask['priority'],owner:'Unassigned'}],true);}
  return <section className="bblocks-panel bblocks-task-workspace" aria-label="Task workspace" data-reduced-motion={reduced}>
    <div className="bblocks-heading"><div><p className="bblocks-kicker">A LITTLE MOMENTUM</p><h2>Make room for the next step.</h2><p className="bblocks-muted">{onSave?'Task order connects through your save callback.':'Sample tasks. Changes last for this session.'}</p></div><Button leadingIcon={Plus} onClick={()=>{setCreateError('');setOpen(true);}} disabled={busy}>New task</Button></div>
    <div className="bblocks-task-toolbar"><LayoutGroup><div className="bblocks-task-views" role="group" aria-label="Task layout">{([{value:'board',label:'Board',icon:Columns3},{value:'backlog',label:'Backlog',icon:List}] as const).map(view=><button key={view.value} type="button" aria-pressed={layout===view.value} onClick={()=>setLayout(view.value)} disabled={pending}>
      {layout===view.value&&<motion.span layoutId="task-layout" className="bblocks-task-view-indicator" transition={{duration:reduced?0:.24,ease:[.16,1,.3,1]}}/>}<view.icon size={16} aria-hidden="true"/><span>{view.label}</span></button>)}</div></LayoutGroup><span className="bui-hint">{tasks.length} tasks · In progress limit 3</span></div>
    {invalid?<TaskNotice title="Review the task data">Use valid tasks and a positive starting revision.</TaskNotice>:loadError?<TaskNotice title="Tasks could not be loaded" action={onRetry?<Button variant="secondary" leadingIcon={RotateCcw} onClick={onRetry}>Retry loading tasks</Button>:undefined}>{loadError}</TaskNotice>:loading?<div className="bblocks-task-skeleton" aria-label="Loading tasks" role="status"><span className="bui-sr-only">Loading tasks</span>{[1,2,3].map(id=><Skeleton key={id} height={260}/>)}</div>:<>
      {error&&<TaskNotice title="Task changes need attention" action={retry?<Button variant="secondary" leadingIcon={RotateCcw} disabled={busy} onClick={()=>{if(retry.revision!==revision){setRetry(null);setError('The board has changed. Choose the move again.');return;}void commit(retry.tasks);}}>Retry task changes</Button>:undefined}>{error}</TaskNotice>}
      {!tasks.length&&<div className="bblocks-task-empty"><EmptyState title="A clear board.">Create a task, then move it as work progresses.</EmptyState></div>}
      <Kanban label={layout==='board'?'Task board':'Task backlog'} columns={taskColumns} items={tasks} onMove={move} pending={pending} disabled={disabled} layout={layout} renderItem={task=><div className="bblocks-task-card-content"><span className="bblocks-task-category">{task.category}</span><h4>{task.title}</h4><div className="bblocks-task-card-meta"><Badge tone={task.priority==='high'?'warning':'neutral'}>{task.priority[0].toUpperCase()+task.priority.slice(1)}</Badge><span className="bblocks-task-owner"><span aria-hidden="true">{task.owner[0]}</span>{task.owner}</span></div></div>}/>
    </>}
    <div className="bblocks-task-feedback"><p role="status">{message}</p>{pending&&<Button size="sm" variant="ghost" onClick={cancel}>Cancel save</Button>}</div>
    <Dialog title="Create a task" description="Start with a short title. The task joins Planned." open={open} onOpenChange={next=>{if(!pending)setOpen(next);}}><form onSubmit={create} className="bblocks-stack" noValidate><Field label="Task title" error={createError}><Input ref={titleInput} maxLength={120} value={title} disabled={pending} onChange={event=>{setTitle(event.target.value);setCreateError('');}}/></Field><Select label="Task priority" value={priority} onValueChange={value=>setPriority(value??'medium')} options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]} disabled={pending}/><Button type="submit" loading={pending}>Create task</Button>{pending&&<Button variant="secondary" onClick={cancel}>Cancel task save</Button>}</form></Dialog>
  </section>;
}
