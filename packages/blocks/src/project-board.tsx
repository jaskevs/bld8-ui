'use client';
import { useState, type FormEvent } from 'react';
import { Badge, Button, Dialog, Field, Input, Select } from '@bld8/ui';

const stages = ['Planned','In progress','Done'] as const;
type Stage = typeof stages[number];
export interface BoardTask { id:string; title:string; category:string; stage:Stage }
const sample: BoardTask[] = [
  {id:'1',title:'Review keyboard navigation',category:'Accessibility',stage:'Planned'},
  {id:'2',title:'Refine the empty state',category:'Interface',stage:'Planned'},
  {id:'3',title:'Build the settings form',category:'Engineering',stage:'In progress'},
  {id:'4',title:'Set the spacing scale',category:'Foundations',stage:'Done'},
];
export function ProjectBoard({ initialTasks = sample }: { initialTasks?: BoardTask[] }) {
  const [tasks,setTasks] = useState(initialTasks);
  const [open,setOpen] = useState(false);
  const [title,setTitle] = useState('');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  function add(event: FormEvent) {
    event.preventDefault(); if (!title.trim()) {setError('Enter a task title.');return;}
    setTasks(current => [...current,{id:crypto.randomUUID(),title:title.trim(),category:'Workspace',stage:'Planned'}]);
    setOpen(false);setTitle('');setError('');setMessage('Task added for this session.');
  }
  function move(id:string,stage:Stage) { setTasks(current => current.map(task => task.id === id ? {...task,stage} : task)); setMessage(`Task moved to ${stage.toLowerCase()}.`); }
  return <section className="bblocks-board" aria-label="Project board"><div className="bblocks-heading"><div><p className="bblocks-kicker">A LITTLE MOMENTUM</p><h2>From idea to done.</h2><p className="bblocks-muted">Sample tasks. Change a status or add your own.</p></div><Dialog title="Add a task" description="Create a task for this session." open={open} onOpenChange={setOpen} trigger={<Button>New task</Button>}><form onSubmit={add} noValidate className="bblocks-stack"><Field label="Task title" error={error} required><Input value={title} onChange={e => setTitle(e.target.value)} /></Field><Button type="submit">Add task</Button></form></Dialog></div><div className="bblocks-columns">{stages.map(stage => <section className="bblocks-lane" key={stage} aria-label={stage + ' tasks'}><div className="bblocks-heading"><h3>{stage}</h3><Badge>{tasks.filter(task => task.stage === stage).length}</Badge></div>{tasks.filter(task => task.stage === stage).map(task => <article className="bblocks-task" key={task.id}><span className="bblocks-kicker">{task.category}</span><h4>{task.title}</h4><Select label={'Status for ' + task.title} value={task.stage} options={stages.map(value => ({value,label:value}))} onValueChange={value => move(task.id,value as Stage)} /></article>)}{!tasks.some(task => task.stage === stage) && <p className="bblocks-note">A little room for the next task.</p>}</section>)}</div><p className="bblocks-status" role="status">{message}</p></section>;
}
