'use client';
import {Chart,type ChartDatum,type ChartSeries,type ChartType} from '@bld8/ui/chart';
import {Alert,Button,EmptyState,Skeleton} from '@bld8/ui/core';

export interface ChartExampleConfig {state:string;chartType:ChartType;chartPeriod:'week'|'fortnight';chartSeries:'both'|'completed'|'failed';chartHeight:number;chartMissing:boolean}
const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const counts=[42,56,48,72,64,38,51,54,61,45,79,68,43,58];
export function ChartExample({config,onChange}:{config:ChartExampleConfig;onChange:(value:ChartExampleConfig)=>void}){
  const series:ChartSeries[]=[{id:'completed',label:'Completed',tone:'primary'},{id:'failed',label:'Failed',tone:'accent'}].filter(item=>config.chartSeries==='both'||config.chartSeries===item.id) as ChartSeries[];
  const data:ChartDatum[]=counts.slice(0,config.chartPeriod==='week'?7:14).map((count,index)=>({id:'day-'+index,label:days[index%7]+(index>6?' · 2':''),values:{completed:config.chartMissing&&index===4?null:count,failed:index%3+2}}));
  return <div style={{display:'grid',gap:16,minWidth:0,width:'100%'}}>
    <div><h3>Weekly requests</h3><p className="bui-hint">Illustrative counts. Missing observations stay missing rather than becoming zero.</p></div>
    <div style={{display:'flex',flexWrap:'wrap',gap:8}} role="group" aria-label="Chart style">{(['line','bar','area'] as const).map(type=><Button key={type} size="sm" variant={config.chartType===type?'secondary':'ghost'} aria-pressed={config.chartType===type} onClick={()=>onChange({...config,chartType:type})}>{type[0].toUpperCase()+type.slice(1)}</Button>)}</div>
    {config.state==='Loading'?<div role="status" aria-label="Loading chart"><Skeleton width="100%" height={config.chartHeight}/></div>:config.state==='Error'?<Alert title="The report could not be loaded" tone="danger" live><p>Sample connection unavailable.</p><Button variant="secondary" size="sm" onClick={()=>onChange({...config,state:'Default'})}>Retry report</Button></Alert>:config.state==='Empty'?<EmptyState title="No observations yet" children="Restore the sample to inspect the series." action={<Button variant="secondary" onClick={()=>onChange({...config,state:'Default'})}>Restore sample report</Button>}/>:<Chart label="Request outcomes" description="Sample counts for exploring values, series and the exact data table." data={data} series={series} type={config.chartType} height={config.chartHeight}/>}
  </div>;
}
