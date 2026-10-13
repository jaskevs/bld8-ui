'use client';
import { useState } from 'react';
import { Avatar, Badge, Button } from '@bld8/ui';
import { MetricsOverview } from './metrics.js';

const activity = [
  { name:'Maya Chen', action:'updated the navigation study', time:'12 min ago', kind:'Updates' },
  { name:'Oliver Reed', action:'recorded a typography decision', time:'38 min ago', kind:'Decisions' },
  { name:'Sam Rivera', action:'shared the first dashboard draft', time:'1 hour ago', kind:'Updates' },
];
export function WorkspaceOverview() {
  const [filter,setFilter] = useState('All');
  const items = activity.filter(item => filter === 'All' || item.kind === filter);
  return <div className="bblocks-stack"><MetricsOverview /><section className="bblocks-panel" aria-label="Workspace activity"><div className="bblocks-heading"><div><p className="bblocks-kicker">IN THE WORKSPACE</p><h2>Small steps, together.</h2></div><Badge>Sample data</Badge></div><div className="bblocks-segment" role="group" aria-label="Activity filter">{['All','Updates','Decisions'].map(label => <Button key={label} size="sm" variant={filter === label ? 'primary' : 'ghost'} aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</Button>)}</div><ul className="bblocks-activity">{items.map(item => <li key={item.name}><Avatar name={item.name} /><div><strong>{item.name}</strong><p>{item.action}</p></div><time>{item.time}</time></li>)}</ul><p className="bblocks-note" role="status">{items.length} activity {items.length === 1 ? 'item' : 'items'}. Illustrative records, not live analytics.</p></section></div>;
}
