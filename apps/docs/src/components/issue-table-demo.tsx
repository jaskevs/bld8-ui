'use client';
import {useMemo,useState} from 'react';
import {Select} from '@bld8/ui';
import {IssueTable} from '@bld8/blocks';
import {createMemoryIssueRepository,type IssueRepository} from '@bld8/blocks/issue-repository';

export function IssueTableDemo(){const[mode,setMode]=useState('sample');const repository=useMemo<IssueRepository|undefined>(()=>{
  if(mode==='sample')return undefined;const source=createMemoryIssueRepository(mode==='empty'?[]:undefined);let failRead=mode==='error',failWrite=mode==='write-error';
  return {...source,list:async(query,signal)=>{if(mode==='loading')return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true}));if(failRead){failRead=false;throw new Error('Example connection failure.');}return source.list(query,signal);},create:async(draft,signal)=>{if(failWrite){failWrite=false;throw new Error('Example save rejected. Your draft is kept; try again.');}return source.create(draft,signal);},update:async(changes,signal)=>{if(failWrite){failWrite=false;throw new Error('Example save rejected. Your draft is kept; try again.');}return source.update(changes,signal);}};
},[mode]);return <div className="bblocks-stack"><Select label="Issue preview state" value={mode} onValueChange={value=>setMode(value??'sample')} options={[{value:'sample',label:'Sample data'},{value:'loading',label:'Loading'},{value:'error',label:'Connection error'},{value:'write-error',label:'Rejected save'},{value:'empty',label:'Empty'}]}/><IssueTable key={mode} repository={repository}/></div>;}
