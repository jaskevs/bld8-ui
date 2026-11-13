/* SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT */
export const analyticsChartExamples = [
  {id:'chart-donut-allocation',componentId:'donut-chart',title:'Allocation with exact values',description:'Compare parts of a total, change visible categories and inspect the original values.',keyboard:['Tab reaches each series button and the exact data disclosure.'],states:['visible series','zero totals','empty data','locale formatting'],source:`'use client';
import {DonutChart} from '@bld8/ui';
export default function Allocation(){return <DonutChart label="Project allocation" description="Illustrative hours across three disciplines." data={[{id:'design',label:'Design',value:28},{id:'engineering',label:'Engineering',value:52},{id:'review',label:'Review',value:20}]} format={{maximumFractionDigits:0}}/>;}`},
  {id:'chart-sparkline-missing',componentId:'sparkline',title:'A trend that preserves missing observations',description:'A compact metric trend leaves a real gap when an observation is unavailable.',keyboard:['Open View data to read every original observation.'],states:['missing value','signed values','constant series','exact data'],source:`'use client';
import {Sparkline} from '@bld8/ui';
export default function Trend(){return <Sparkline label="Weekly change" data={[{id:'mon',label:'Monday',value:-4},{id:'tue',label:'Tuesday',value:2},{id:'wed',label:'Wednesday',value:null},{id:'thu',label:'Thursday',value:5},{id:'fri',label:'Friday',value:3}]} format={{maximumFractionDigits:1}}/>;}`},
  {id:'chart-stacked-periods',componentId:'stacked-bar-chart',title:'Absolute and percentage stacks',description:'Use the same source values to compare totals or proportions, with stable series colours.',keyboard:['Series buttons retain focus while the chart updates.','View data exposes the complete values and visible totals.'],states:['absolute totals','percent view','series visibility','missing values'],source:`'use client';
import {useState} from 'react';
import {Button,StackedBarChart} from '@bld8/ui';
export default function Periods(){const [percent,setPercent]=useState(false);return <section><Button variant="secondary" aria-pressed={percent} onClick={()=>setPercent(previous=>!previous)}>Percentage view</Button><StackedBarChart label="Review work by month" mode={percent?'percent':'absolute'} series={[{id:'complete',label:'Complete'},{id:'pending',label:'Pending'}]} data={[{id:'sep',label:'September',values:{complete:24,pending:8}},{id:'oct',label:'October',values:{complete:36,pending:12}},{id:'nov',label:'November',values:{complete:40,pending:null}}]}/></section>;}`}
];
