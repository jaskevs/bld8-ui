'use client';
import { useState, type FormEvent } from 'react';
import { Avatar, Badge, Button, DataTable, Dialog, Field, Input, Select, type Column } from '@bld8/ui';

export interface TeamMember { id:string; name:string; email:string; role:string; status:'Active' | 'Invited' }
const sample: TeamMember[] = [
  {id:'1',name:'Maya Chen',email:'maya@example.com',role:'Admin',status:'Active'},
  {id:'2',name:'Oliver Reed',email:'oliver@example.com',role:'Editor',status:'Active'},
  {id:'3',name:'Sam Rivera',email:'sam@example.com',role:'Editor',status:'Active'},
  {id:'4',name:'Avery Brooks',email:'avery@example.com',role:'Viewer',status:'Active'},
];
export function TeamDirectory({ initialMembers = sample }: { initialMembers?: TeamMember[] }) {
  const [members,setMembers] = useState(initialMembers);
  const [open,setOpen] = useState(false);
  const [email,setEmail] = useState('');
  const [role,setRole] = useState('Editor');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const columns: Column<TeamMember>[] = [
    {key:'name',header:'Person',sortValue:row => row.name,cell:row => <div className="bblocks-person"><Avatar name={row.name} /><div><strong>{row.name}</strong><small>{row.email}</small></div></div>},
    {key:'role',header:'Role',sortValue:row => row.role,cell:row => row.role},
    {key:'status',header:'Status',cell:row => <Badge tone={row.status === 'Active' ? 'success' : 'accent'}>{row.status}</Badge>},
  ];
  function invite(event: FormEvent) {
    event.preventDefault(); const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError('Enter a valid email address.'); return; }
    if (members.some(member => member.email.toLowerCase() === address.toLowerCase())) { setError('This email is already in the workspace.'); return; }
    setMembers(current => [...current,{id:crypto.randomUUID(),name:address.split('@')[0],email:address,role,status:'Invited'}]);
    setOpen(false); setEmail(''); setError(''); setMessage('Invitation added to this demo. No email was sent.');
  }
  return <section className="bblocks-panel" aria-label="Team directory"><div className="bblocks-heading"><div><p className="bblocks-kicker">PEOPLE & ACCESS</p><h2>Better, together.</h2><p className="bblocks-muted">{members.length} people in this sample workspace.</p></div><Dialog open={open} onOpenChange={next => {setOpen(next);setError('');}} title="Invite a teammate" description="Add a person to this sample workspace. No invitation email is sent." trigger={<Button>Invite person</Button>}><form className="bblocks-stack" onSubmit={invite} noValidate><Field label="Invite email" error={error} required><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field><Select label="Workspace role" options={['Admin','Editor','Viewer'].map(value => ({value,label:value}))} value={role} onValueChange={value => { if (value) setRole(value); }} /><Button type="submit">Add invitation</Button></form></Dialog></div><DataTable caption="Team members" rows={members} columns={columns} rowKey={row => row.id} searchText={row => row.name + ' ' + row.email + ' ' + row.role} pageSize={5} /><p className="bblocks-status" role="status">{message}</p></section>;
}
