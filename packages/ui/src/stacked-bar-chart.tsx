/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useState} from 'react';
import {cn} from './utils.js';
import {useUIConfig} from './ui-config.js';
import {useReducedMotionPreference} from './motion-preference.js';
import {chartNumber,stackedModel,type StackedDatum,type StackedSeries} from './analytics-chart-state.js';
export type {StackedDatum,StackedSeries} from './analytics-chart-state.js';
export interface StackedBarChartProps {label:string;description?:string;data:readonly StackedDatum[];series:readonly StackedSeries[];mode?:'absolute'|'percent';locale?:string;format?:Intl.NumberFormatOptions;className?:string}
/** Exact non-negative categorical stacks, with explicit missing values in the source table. */
export function StackedBarChart({label,description,data,series,mode='absolute',locale,format,className}:StackedBarChartProps){
  const config=useUIConfig();locale=locale??config.locale;
  const [hidden,setHidden]=useState<string[]>([]),reduced=useReducedMotionPreference();let model;try{model=stackedModel(data,series,hidden);}catch(error){return <p role="alert">{error instanceof Error?error.message:'Review the stacked data.'}</p>;}
  const number=(value:number|null)=>chartNumber(value,locale,format),percentage=mode==='percent';
  return <figure className={cn('bui-stacked-chart',className)}><figcaption><strong>{label}</strong>{description&&<p>{description}</p>}</figcaption><ul className="bui-analytics-legend bui-analytics-legend--inline" aria-label={label+' series'}>{series.map((item,index)=><li key={item.id}><button type="button" aria-pressed={!hidden.includes(item.id)} onClick={()=>setHidden(previous=>previous.includes(item.id)?previous.filter(key=>key!==item.id):[...previous,item.id])}><span className="bui-analytics-swatch" aria-hidden="true" style={{background:`var(--bui-chart-${index+1})`}}/>{item.label}</button></li>)}</ul><div className="bui-stacked-rows" aria-label={label+' bars'}>{model.rows.map(row=><div className="bui-stacked-row" key={row.id}><span>{row.label}</span><div className="bui-stacked-track" role="img" aria-label={row.label+': '+model.visible.map(item=>item.label+' '+number(row.values[item.id])).join(', ')+'. Total '+number(row.total)}><div className="bui-stacked-bar" style={{width:(percentage?(row.total?100:0):model.maximum?row.total/model.maximum*100:0)+'%',transitionDuration:reduced?'0s':undefined}}>{model.visible.map(item=><span key={item.id} data-series={item.id} style={{width:(row.total?(row.values[item.id]??0)/row.total*100:0)+'%',background:`var(--bui-chart-${series.findIndex(value=>value.id===item.id)+1})`,transitionDuration:reduced?'0s':undefined}}/>)}</div></div><span className="bui-stacked-total">{percentage?chartNumber(row.total?1:0,locale,{style:'percent'}):number(row.total)}</span></div>)}</div>{!model.rows.length&&<p className="bui-hint">No records yet.</p>}{!model.visible.length&&<p className="bui-hint">Choose a series to display its values.</p>}<details className="bui-analytics-exact"><summary>View data</summary><div role="region" aria-label={label+' data'} tabIndex={0}><table><caption>{label}: original values; totals include visible series</caption><thead><tr><th scope="col">Category</th>{series.map(item=><th scope="col" key={item.id}>{item.label}</th>)}<th scope="col">Visible total</th></tr></thead><tbody>{model.rows.map(row=><tr key={row.id}><th scope="row">{row.label}</th>{series.map(item=><td key={item.id}>{number(row.values[item.id])}</td>)}<td>{number(row.total)}</td></tr>)}</tbody></table></div></details></figure>;
}
