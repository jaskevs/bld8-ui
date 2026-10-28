'use client';
import {useRef,useState} from 'react';
import {Select} from '@bld8/ui';
import {TaskWorkspace,type TaskWorkspaceSaveContext,type WorkspaceTask} from '@bld8/blocks';
export function TaskWorkspaceDemo(){const[mode,setMode]=useState('sample'),[failed,setFailed]=useState(false),rejected=useRef(false);
  async function save(tasks:WorkspaceTask[],{signal,expectedRevision}:TaskWorkspaceSaveContext){await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},mode==='slow'?3000:350);function cancel(){clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));}if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});});if(mode==='rejected'&&!rejected.current){rejected.current=true;throw new Error('Example rejection.');}return {tasks,revision:expectedRevision+1};}
  return <div className="bblocks-stack"><Select label="Task preview state" value={mode} options={[{value:'sample',label:'Sample data'},{value:'rejected',label:'Rejected save'},{value:'slow',label:'Slow save'},{value:'loading',label:'Loading'},{value:'error',label:'Connection error'},{value:'empty',label:'Empty'}]} onValueChange={value=>{setMode(value??'sample');setFailed(false);rejected.current=false;}}/><TaskWorkspace key={mode} initialTasks={mode==='empty'?[]:undefined} loading={mode==='loading'} error={mode==='error'&&!failed?'Example connection unavailable.':undefined} onRetry={()=>setFailed(true)} onSave={mode==='rejected'||mode==='slow'?save:undefined}/></div>;
}
