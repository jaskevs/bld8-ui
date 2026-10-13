'use client';
import { useState } from 'react';
import { Badge, Button } from '@bld8/ui';

const periods = {
  week: { label:'This week', visits:'8,420', projects:'24', completion:'86%', bars:[42,58,48,76,65,92,80], labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  month: { label:'This month', visits:'32,680', projects:'91', completion:'89%', bars:[35,54,61,48,78,88,96], labels:['01','05','09','13','17','21','25'] },
};
export function MetricsOverview() {
  const [period, setPeriod] = useState<keyof typeof periods>('week');
  const current = periods[period];
  return <section className="bblocks-metrics" aria-label="Metrics overview">
    <div className="bblocks-heading"><div><p className="bblocks-kicker">THE BIG PICTURE</p><h2>A good rhythm.</h2></div><div className="bblocks-segment" role="group" aria-label="Metrics period">{(Object.keys(periods) as (keyof typeof periods)[]).map(key => <Button key={key} size="sm" variant={period === key ? 'primary' : 'ghost'} aria-pressed={period === key} onClick={() => setPeriod(key)}>{periods[key].label}</Button>)}</div></div>
    <div className="bblocks-stats">{[['Visits',current.visits,'+12%'],['Active projects',current.projects,'+4'],['Completion',current.completion,'+3%']].map(([label,value,change]) => <div className="bblocks-stat" key={label}><span>{label}</span><strong>{value}</strong><Badge tone="success">{change}</Badge></div>)}</div>
    <figure className="bblocks-panel bblocks-chart"><figcaption><span>Workspace activity</span><span className="bblocks-muted">{current.label} · sample data</span></figcaption><div className="bblocks-bars" role="img" aria-label={`${current.label} sample activity: ${current.bars.map((value,i) => `${current.labels[i]} ${value}`).join(', ')}`}>{current.bars.map((height,index) => <div key={index}><span style={{height:height + '%'}} /><small>{current.labels[index]}</small></div>)}</div></figure>
  </section>;
}
