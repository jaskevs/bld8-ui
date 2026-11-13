/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId,useState} from 'react';
import {cn} from './utils.js';
import {useUIConfig} from './ui-config.js';
import {useReducedMotionPreference} from './motion-preference.js';
import {chartNumber,donutModel,type ChartSlice} from './analytics-chart-state.js';
export type {ChartSlice} from './analytics-chart-state.js';
export interface DonutChartProps {label:string;description?:string;data:readonly ChartSlice[];locale?:string;format?:Intl.NumberFormatOptions;className?:string;size?:number}
/** Positive part-to-whole data with stable colours, real legend buttons and exact source values. */
export function DonutChart({label,description,data,locale,format,className,size=200}:DonutChartProps){
  const config=useUIConfig();locale=locale??config.locale;
  const [hidden,setHidden]=useState<string[]>([]),reduced=useReducedMotionPreference(),id=useId();let model;try{model=donutModel(data,hidden);}catch(error){return <p role="alert">{error instanceof Error?error.message:'Review the donut data.'}</p>;}
  const number=(value:number|null)=>chartNumber(value,locale,format),percent=(value:number)=>chartNumber(value/100,locale,{style:'percent',maximumFractionDigits:1}),width=Number.isFinite(size)?Math.min(400,Math.max(120,size)):200;
  return <figure className={cn('bui-donut-chart',className)}><figcaption><strong>{label}</strong>{description&&<p>{description}</p>}</figcaption><div className="bui-donut-layout"><div className="bui-donut-plot" style={{width,maxWidth:'100%'}}><svg viewBox="0 0 200 200" role="img" aria-labelledby={id+'-title '+id+'-description'}><title id={id+'-title'}>{label}</title><desc id={id+'-description'}>{number(model.total)} total across {model.segments.length} visible categories. Exact values follow.</desc><circle className="bui-donut-track" cx="100" cy="100" r="73" fill="none" strokeWidth="24"/>{model.segments.filter(item=>item.value>0).map(item=><circle key={item.id} data-series={item.id} className="bui-donut-segment" cx="100" cy="100" r="73" pathLength="100" strokeWidth="24" fill="none" stroke={`var(--bui-chart-${data.findIndex(value=>value.id===item.id)%6+1})`} strokeDasharray={`${Math.max(0,item.share-(model.segments.length>1 ? .35 : 0))} 100`} strokeDashoffset={-item.offset} transform="rotate(-90 100 100)" style={{transitionDuration:reduced?'0s':undefined}}/>)}</svg><div className="bui-donut-value" aria-hidden="true"><strong>{number(model.total)}</strong><span>Total</span></div></div><ul className="bui-analytics-legend" aria-label={label+' series'}>{data.map((item,index)=><li key={item.id}><button type="button" aria-pressed={!hidden.includes(item.id)} onClick={()=>setHidden(previous=>previous.includes(item.id)?previous.filter(key=>key!==item.id):[...previous,item.id])}><span className="bui-analytics-swatch" style={{background:`var(--bui-chart-${index%6+1})`}} aria-hidden="true"/><span>{item.label}</span><span className="bui-analytics-legend-value">{number(item.value)}</span></button></li>)}</ul></div>{!model.total&&<p className="bui-hint">No positive values in the visible series.</p>}<details className="bui-analytics-exact"><summary>View data</summary><div role="region" aria-label={label+' data'} tabIndex={0}><table><caption>{label}: original values and visible shares</caption><thead><tr><th scope="col">Category</th><th scope="col">Value</th><th scope="col">Share</th><th scope="col">Visible</th></tr></thead><tbody>{data.map(item=><tr key={item.id}><th scope="row">{item.label}</th><td>{number(item.value)}</td><td>{hidden.includes(item.id)?'—':percent(model.total?item.value/model.total*100:0)}</td><td>{hidden.includes(item.id)?'No':'Yes'}</td></tr>)}</tbody></table></div></details></figure>;
}
