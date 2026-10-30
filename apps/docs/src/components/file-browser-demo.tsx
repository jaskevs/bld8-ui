'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import {Select} from '@bld8/ui';
import {FileBrowser,loadSampleFileChildren,type FileBrowserEntry} from '@bld8/blocks';

function wait(signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
  const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},2500);
  if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});
});}
export function FileBrowserDemo(){
  const[mode,setMode]=useState('sample'),rejected=useRef(new Set<string>());
  const wrapper=useRef<HTMLDivElement>(null),resetOrigin=useRef<HTMLElement|null>(null);
  useLayoutEffect(()=>{
    const origin=resetOrigin.current;resetOrigin.current=null;
    if(!origin||mode!=='sample')return;
    const active=origin.ownerDocument.activeElement;
    if(active!==origin&&!(active===origin.ownerDocument.body&&!origin.isConnected))return;
    wrapper.current?.querySelector<HTMLHeadingElement>('.bblocks-files-title h3')?.focus({preventScroll:true});
  },[mode]);
  async function load(parentId:string,{signal}:{signal:AbortSignal}):Promise<readonly FileBrowserEntry[]>{
    if(mode==='slow')await wait(signal);
    if(mode==='rejected'&&!rejected.current.has(parentId)){rejected.current.add(parentId);throw new Error('The sample folder could not be loaded.');}
    if(mode==='invalid')return [{id:'archive',label:'Invalid repeated folder',kind:'folder'}];
    return loadSampleFileChildren(parentId,{signal});
  }
  const reset=()=>{
    const active=wrapper.current?.ownerDocument.activeElement;
    resetOrigin.current=mode==='error'&&active instanceof HTMLElement&&active===wrapper.current?.querySelector('.bblocks-files-notice button')?active:null;
    rejected.current.clear();setMode('sample');
  };
  return <div ref={wrapper} className="bblocks-stack">
    <div className="file-preview-options"><Select label="File preview state" value={mode} onValueChange={value=>{rejected.current.clear();setMode(value??'sample');}} options={[{value:'sample',label:'Sample data'},{value:'loading',label:'Loading'},{value:'empty',label:'Empty'},{value:'error',label:'Connection error'},{value:'rejected',label:'Rejected folder load'},{value:'slow',label:'Slow folder load'},{value:'invalid',label:'Invalid folder data'}]}/></div>
    <FileBrowser key={mode} entries={mode==='empty'?[]:undefined} loading={mode==='loading'} error={mode==='error'?'The example connection is unavailable.':undefined} onRetry={reset} loadChildren={['rejected','slow','invalid'].includes(mode)?load:undefined}/>
  </div>;
}
