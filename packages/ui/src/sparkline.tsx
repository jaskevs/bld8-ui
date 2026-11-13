/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId} from 'react';
import {cn} from './utils.js';
import {useUIConfig} from './ui-config.js';
import {chartNumber,sparklineModel,type SparklinePoint} from './analytics-chart-state.js';
export type {SparklinePoint} from './analytics-chart-state.js';
export interface SparklineProps {label:string;data:readonly SparklinePoint[];locale?:string;format?:Intl.NumberFormatOptions;className?:string;height?:number;tone?:'primary'|'accent';showData?:boolean}
/** A compact trend. Missing observations create gaps, rather than fabricated zeroes. */
export function Sparkline({label,data,locale,format,className,height=60,tone='primary',showData=true}:SparklineProps){
  const config=useUIConfig();locale=locale??config.locale;
  const id=useId();let model;try{model=sparklineModel(data);}catch(error){return <p role="alert">{error instanceof Error?error.message:'Review the trend data.'}</p>;}
  const number=(value:number|null)=>chartNumber(value,locale,format),pixels=Number.isFinite(height)?Math.min(160,Math.max(32,height)):60;
  return <figure className={cn('bui-sparkline',className)}><figcaption><strong>{label}</strong><span>{number(model.last)}</span></figcaption><svg viewBox="0 0 240 60" preserveAspectRatio="none" height={pixels} role="img" aria-labelledby={id+'-title '+id+'-description'}><title id={id+'-title'}>{label}</title><desc id={id+'-description'}>Latest {number(model.last)}. Minimum {number(model.minimum)}; maximum {number(model.maximum)}. {model.missing} missing observations.</desc><path d={model.path} fill="none" stroke={tone==='accent'?'var(--bui-chart-2)':'var(--bui-chart-1)'} strokeWidth="2" vectorEffect="non-scaling-stroke"/>{model.points.filter(point=>point.y!==null).slice(-1).map(point=><circle key={point.id} cx={point.x} cy={point.y!} r="3" fill={tone==='accent'?'var(--bui-chart-2)':'var(--bui-chart-1)'}/>)}</svg>{model.last===null&&<p className="bui-hint">No observations yet.</p>}{showData&&<details className="bui-analytics-exact"><summary>View data</summary><div role="region" aria-label={label+' data'} tabIndex={0}><table><caption>{label}: exact observations</caption><thead><tr><th scope="col">Observation</th><th scope="col">Value</th></tr></thead><tbody>{data.map(point=><tr key={point.id}><th scope="row">{point.label}</th><td>{number(point.value)}</td></tr>)}</tbody></table></div></details>}</figure>;
}
