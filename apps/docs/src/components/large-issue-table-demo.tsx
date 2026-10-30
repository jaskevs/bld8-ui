'use client';
import {useMemo,useState} from 'react';
import {Select} from '@bld8/ui';
import {LargeIssueTable,createSampleLargeIssues,type LargeIssueTableProps} from '@bld8/blocks';
import type {Issue} from '@bld8/blocks/issue-repository';

function delay(signal:AbortSignal,milliseconds:number) {
  return new Promise<void>((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}
    const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},milliseconds);
    signal.addEventListener('abort',cancel,{once:true});
  });
}

export function LargeIssueTableDemo() {
  const[mode,setMode]=useState('sample');
  const source=useMemo<LargeIssueTableProps>(()=>{
    if(mode==='sample')return {};
    const records=new Map(createSampleLargeIssues().map(row=>[row.id,row]));
    let loads=0,saves=0;
    return {
      loadRows:async({signal})=>{
        if(mode==='loading')await delay(signal,86_400_000);
        await delay(signal,180);
        if(mode==='error'&&loads++===0)throw new Error('Example connection unavailable');
        if(mode==='empty')return [];
        if(mode==='invalid')return [{...records.values().next().value!},{...records.values().next().value!}];
        return [...records.values()].map(row=>({...row}));
      },
      onSaveIssue:async(change,{signal})=>{
        await delay(signal,mode==='slow'?1800:250);
        if(mode==='rejected'&&saves++===0)throw new Error('Example save rejected');
        const previous=records.get(change.id);
        if(!previous||previous.revision!==change.expectedRevision)throw new Error('Issue changed');
        const next:Issue={...previous,...change.patch,revision:previous.revision+1};
        records.set(next.id,next);return {...next};
      },
    };
  },[mode]);
  return <div className="stack"><Select label="Large issue preview state" value={mode} onValueChange={value=>setMode(value??'sample')} options={[{value:'sample',label:'Sample data'},{value:'loading',label:'Loading'},{value:'empty',label:'Empty'},{value:'error',label:'Connection error'},{value:'rejected',label:'Rejected save'},{value:'slow',label:'Slow save'},{value:'invalid',label:'Invalid data'}]}/><LargeIssueTable {...source}/></div>;
}
