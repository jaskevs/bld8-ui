'use client';
import {useEffect,useRef,useState} from 'react';
import {Tree,type TreeNode} from '@bld8/ui/tree';
import {Alert,Button,EmptyState,Skeleton} from '@bld8/ui/core';

export interface TreeExampleConfig {state:string;treeExpanded:string[];treeSelected:string;treeLoaded:boolean;treeFailure:boolean}
const assetFiles:TreeNode[]=[{id:'tokens',label:'tokens.css',description:'Theme tokens'},{id:'logo',label:'mark.svg',description:'Vector mark'}];
export function TreeExample({config,onChange}:{config:TreeExampleConfig;onChange:(value:TreeExampleConfig)=>void}){
  const latest=useRef(config);latest.current=config;
  const operation=useRef<AbortController|null>(null),failedOnce=useRef(false);
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{operation.current?.abort();setLoading(false);setError('');failedOnce.current=false;return()=>operation.current?.abort();},[config.state,config.treeFailure]);
  useEffect(()=>{if(!config.treeExpanded.includes('assets')){operation.current?.abort();operation.current=null;setLoading(false);}},[config.treeExpanded.join(',')]);
  const nodes:TreeNode[]=[{id:'src',label:'src',children:[{id:'components',label:'components',children:[{id:'button',label:'button.tsx'},{id:'input',label:'input.tsx'}]},{id:'app',label:'app.tsx'},{id:'styles',label:'styles.css'}]},{id:'assets',label:'assets',hasChildren:true,children:config.treeLoaded?assetFiles:undefined},{id:'readme',label:'README.md'},{id:'private',label:'Private notes',disabled:true}];
  async function loadChildren(){
    if(config.treeLoaded||operation.current&&!operation.current.signal.aborted)return;
    const controller=new AbortController();operation.current=controller;setLoading(true);setError('');
    await new Promise<void>(resolve=>{const timer=setTimeout(resolve,500);controller.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve();},{once:true});});
    if(controller.signal.aborted)return;operation.current=null;setLoading(false);
    if(config.treeFailure&&!failedOnce.current){failedOnce.current=true;setError('Sample folder could not be loaded. Try again.');}
    else{onChange({...latest.current,treeLoaded:true});setMessage('Two sample assets loaded.');}
  }
  useEffect(()=>{if(config.state==='Default'&&config.treeExpanded.includes('assets')&&!config.treeLoaded&&!loading&&!error)void loadChildren();},[config.state,config.treeExpanded.join(','),config.treeLoaded,config.treeFailure,loading,error]);
  return <div style={{display:'grid',gap:16,minWidth:0,width:'100%'}}>
    <p className="bui-hint">Expand assets to try an abortable 500 ms sample load. Focus and selection are separate.</p>
    {config.state==='Loading'?<div role="status" aria-label="Loading files"><Skeleton width="100%" height={240}/></div>:config.state==='Error'?<Alert title="Files could not be loaded" tone="danger" live><p>Sample connection unavailable.</p><Button variant="secondary" size="sm" onClick={()=>onChange({...config,state:'Default'})}>Retry files</Button></Alert>:config.state==='Empty'?<EmptyState title="No files here" children="Restore the example to explore the tree." action={<Button variant="secondary" onClick={()=>onChange({...config,state:'Default'})}>Restore sample files</Button>}/>:<Tree label="Project files" nodes={nodes} expandedIds={config.treeExpanded} onExpandedChange={treeExpanded=>onChange({...latest.current,treeExpanded})} selectedId={config.treeSelected||null} onSelectedChange={treeSelected=>onChange({...latest.current,treeSelected})} onActivate={node=>setMessage('Opened '+node.label+'.')} loadingIds={loading?['assets']:[]} errors={error?{assets:error}:{}} onLoadChildren={()=>void loadChildren()} disabled={config.state==='Disabled'}/>}
    <p className="bui-hint">Selected: {config.treeSelected||'none'}</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}><Button variant="secondary" size="sm" onClick={()=>onChange({...config,treeExpanded:[]})}>Collapse folders</Button><Button variant="ghost" size="sm" onClick={()=>onChange({...config,treeSelected:''})}>Clear selection</Button></div>
    <p role="status" className="bui-hint">{message}</p>
  </div>;
}
