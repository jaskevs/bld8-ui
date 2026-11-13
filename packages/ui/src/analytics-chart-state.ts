/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export interface ChartSlice {id:string;label:string;value:number}
export interface SparklinePoint {id:string;label:string;value:number|null}
export interface StackedSeries {id:string;label:string}
export interface StackedDatum {id:string;label:string;values:Readonly<Record<string,number|null>>}
function identity(items:readonly {id:string;label:string}[],maximum:number){if(!Array.isArray(items)||items.length>maximum||items.some(item=>!item||typeof item.id!=='string'||!item.id||typeof item.label!=='string'||!item.label.trim())||new Set(items.map(item=>item.id)).size!==items.length)throw Error('Supply unique IDs, readable labels and a bounded dataset.');}
export function donutModel(data:readonly ChartSlice[],hidden:readonly string[]=[]){
  identity(data,24);if(data.some(item=>!Number.isFinite(item.value)||item.value<0))throw Error('Donut values must be finite and non-negative.');
  const visible=data.filter(item=>!hidden.includes(item.id)),total=visible.reduce((sum,item)=>sum+item.value,0);if(!Number.isFinite(total))throw Error('The donut total is too large.');let offset=0;
  return {total,segments:visible.map(item=>{const share=total?item.value/total*100:0,result={...item,share,offset};offset+=share;return result;})};
}
export function sparklineModel(data:readonly SparklinePoint[],width=240,height=60){
  identity(data,366);if(data.some(item=>item.value!==null&&!Number.isFinite(item.value)))throw Error('Sparkline values must be finite numbers or null.');
  const finite=data.flatMap(item=>item.value===null?[]:[item.value]),minimum=finite.length?Math.min(...finite):0,maximum=finite.length?Math.max(...finite):0,scale=Math.max(1,Math.abs(minimum),Math.abs(maximum)),low=minimum/scale,high=maximum/scale,padding=minimum===maximum?.05:(high-low)*.08,lower=low-padding,upper=high+padding;
  let path='',connected=false;const points=data.map((item,index)=>{if(item.value===null){connected=false;return {...item,x:4+index/Math.max(1,data.length-1)*(width-8),y:null};}const x=4+index/Math.max(1,data.length-1)*(width-8),y=height-4-(item.value/scale-lower)/(upper-lower)*(height-8);path+=(connected?' L':'M')+x.toFixed(3)+','+y.toFixed(3);connected=true;return {...item,x,y};});
  return {path,points,minimum:finite.length?minimum:null,maximum:finite.length?maximum:null,last:[...data].reverse().find(item=>item.value!==null)?.value??null,missing:data.filter(item=>item.value===null).length};
}
export function stackedModel(data:readonly StackedDatum[],series:readonly StackedSeries[],hidden:readonly string[]=[]){
  identity(data,100);identity(series,6);if(!series.length)throw Error('Supply at least one stacked series.');
  for(const row of data)for(const item of series)if(!Object.prototype.hasOwnProperty.call(row.values,item.id)||row.values[item.id]!==null&&(!Number.isFinite(row.values[item.id])||row.values[item.id]!<0))throw Error('Every series needs a finite non-negative value or null in each row.');
  const visible=series.filter(item=>!hidden.includes(item.id)),rows=data.map(row=>({...row,total:visible.reduce((sum,item)=>sum+(row.values[item.id]??0),0)}));if(rows.some(row=>!Number.isFinite(row.total)))throw Error('A stacked total is too large.');return {visible,rows,maximum:Math.max(0,...rows.map(row=>row.total))};
}
export function chartNumber(value:number|null,locale:string,options?:Intl.NumberFormatOptions){if(value===null)return 'Missing';try{return new Intl.NumberFormat(locale,options).format(value);}catch{return String(value);}}
