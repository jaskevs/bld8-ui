'use client';
import {useCallback,useRef,useState} from 'react';
import {Select} from '@bld8/ui';
import {AnalyticsDashboard,loadSampleAnalyticsReport,type AnalyticsDashboardProps,type AnalyticsReport} from '@bld8/blocks';

function delay(signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
  const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},2500);
  if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});
});}
export function AnalyticsDashboardDemo(){
  const[mode,setMode]=useState('sample'),rejected=useRef(new Set<string>());
  const load=useCallback<NonNullable<AnalyticsDashboardProps['loadReport']>>(async(period,{signal}):Promise<AnalyticsReport>=>{
    if(mode==='loading')return new Promise((_,reject)=>{
      const cancel=()=>reject(new DOMException('Cancelled','AbortError'));
      if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});
    });
    if(mode==='empty')return {period,records:[]};
    if(mode==='error')throw new Error('The example report is unavailable.');
    if(mode==='rejected'&&!rejected.current.has(period)){rejected.current.add(period);throw new Error('The example report is unavailable.');}
    if(mode==='slow')await delay(signal);
    if(mode==='invalid')return {period,records:[{id:'invalid',label:'Invalid',completed:-1,failed:0}]};
    return loadSampleAnalyticsReport(period,{signal});
  },[mode]);
  return <div className="bblocks-stack">
    <div className="file-preview-options"><Select label="Analytics preview state" value={mode} onValueChange={value=>{rejected.current.clear();setMode(value??'sample');}} options={[{value:'sample',label:'Sample data'},{value:'loading',label:'Loading'},{value:'empty',label:'Empty'},{value:'error',label:'Connection error'},{value:'rejected',label:'Rejected report'},{value:'slow',label:'Slow report'},{value:'invalid',label:'Invalid report'}]}/></div>
    <AnalyticsDashboard key={mode} loadReport={mode==='sample'?undefined:load}/>
  </div>;
}
