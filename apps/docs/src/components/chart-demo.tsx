'use client';
import {useState,type CSSProperties} from 'react';
import {Button, Chart, Select, type ChartDatum, type ChartSeries, type ChartType} from '@bld8/ui';

const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const ids=['mon','tue','wed','thu','fri','sat','sun'];
const series:readonly ChartSeries[]=[{id:'completed',label:'Completed',tone:'primary'},{id:'failed',label:'Failed',tone:'accent'}];
const sample:readonly ChartDatum[]=labels.map((label,index)=>({id:ids[index],label,values:{completed:[42,56,48,72,64,38,51][index],failed:[4,7,3,8,5,2,4][index]}}));
const signed:readonly ChartDatum[]=labels.slice(0,6).map((label,index)=>({id:ids[index],label,values:{completed:[12,-8,null,22,0,16][index],failed:[6,null,-4,12,8,-2][index]}}));
const invalid:readonly ChartDatum[]=[sample[0],{...sample[1],id:'mon'}];
const fullSeries:readonly ChartSeries[]=Array.from({length:6},(_,index)=>({id:'series-'+(index+1),label:'Series '+(index+1),tone:(['primary','accent','muted'] as const)[index%3]}));
const fullYear:readonly ChartDatum[]=Array.from({length:366},(_,index)=>({id:'day-'+(index+1),label:'Day '+(index+1),values:Object.fromEntries(fullSeries.map((item,seriesIndex)=>[item.id,20+seriesIndex*7+((index*13+seriesIndex*5)%47)]))}));

export function ChartDemo(){
  const[mode,setMode]=useState('sample'),[type,setType]=useState<ChartType>('line');
  const data=mode==='signed'?signed:mode==='empty'?[]:mode==='invalid'?invalid:mode==='year'?fullYear:sample;
  return <div className="stack chart-example">
    <div className="chart-example-options"><Select label="Chart preview state" value={mode} onValueChange={value=>setMode(value??'sample')} options={[{value:'sample',label:'Sample data'},{value:'signed',label:'Signed values and gaps'},{value:'empty',label:'Empty'},{value:'invalid',label:'Invalid data'},{value:'year',label:'Full year (366 points)'}]}/><div className="chart-example-type" role="group" aria-label="Chart type" style={{'--chart-type-index':['line','bar','area'].indexOf(type)} as CSSProperties}>{(['line','bar','area'] as const).map(value=><Button key={value} variant="ghost" size="sm" aria-pressed={type===value} onClick={()=>setType(value)}>{value[0].toUpperCase()+value.slice(1)}</Button>)}</div></div>
    <Chart label={mode==='year'?'Daily observations':'Weekly requests'} description={mode==='year'?'A bounded full-year dataset with six series. Explore a point or read the exact values.':'Illustrative counts. Explore a day, compare series or open the data table.'} data={data} series={mode==='year'?fullSeries:series} type={type}/>
    <p className="bui-hint">Arrow keys explore the points. Legends change the visible series; the data table keeps every value available.</p>
  </div>;
}
