'use client';

import { useMemo, useState } from 'react';
import { FolderOpen, Settings2, Users } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, Field, Input, Select, Skeleton, Timeline } from '@bld8/ui';

export interface ActivityRecord {
  id: string;
  title: string;
  actor: string;
  description?: string;
  kind: 'project' | 'people' | 'system';
  dateTime: string;
  /** Preformatted by the host so server and client render the same label. */
  time: string;
}

export interface ActivityFeedProps {
  records?: readonly ActivityRecord[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Number revealed at a time. This is local reveal, not server pagination. */
  pageSize?: number;
}

export const activitySample: readonly ActivityRecord[] = [
  {id:'review',title:'Keyboard review completed',actor:'Maya Chen',description:'Dialog focus and return behaviour checked.',kind:'project',dateTime:'2026-10-28T10:40:00+11:00',time:'28 Oct · 10:40'},
  {id:'invite',title:'Sam joined the workspace',actor:'Oliver Reed',description:'Added to the design group.',kind:'people',dateTime:'2026-10-28T10:15:00+11:00',time:'28 Oct · 10:15'},
  {id:'preferences',title:'Workspace preferences updated',actor:'Sam Rivera',description:'The weekly digest is now enabled.',kind:'system',dateTime:'2026-10-28T09:50:00+11:00',time:'28 Oct · 09:50'},
  {id:'draft',title:'Interface draft shared',actor:'Maya Chen',description:'An early look at the settings flow.',kind:'project',dateTime:'2026-10-28T09:20:00+11:00',time:'28 Oct · 09:20'},
  {id:'role',title:'Project access updated',actor:'Oliver Reed',description:'Sam can now edit the interface study.',kind:'people',dateTime:'2026-10-27T16:30:00+11:00',time:'27 Oct · 16:30'},
  {id:'archive',title:'Reference notes archived',actor:'Sam Rivera',description:'Earlier material is still available in the archive.',kind:'project',dateTime:'2026-10-27T15:10:00+11:00',time:'27 Oct · 15:10'},
];

const icons = {project:FolderOpen,people:Users,system:Settings2};
const kinds = [{value:'all',label:'All activity'},{value:'project',label:'Projects'},{value:'people',label:'People'},{value:'system',label:'System'}];

export function ActivityFeed({ records = activitySample, loading = false, error, onRetry, pageSize = 4 }: ActivityFeedProps) {
  const size = Number.isFinite(pageSize) ? Math.max(1,Math.floor(pageSize)) : 4;
  const [query,setQuery] = useState('');
  const [kind,setKind] = useState('all');
  const [revealed,setRevealed] = useState(size);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return records.filter(record => (kind === 'all' || record.kind === kind) && `${record.title} ${record.actor} ${record.description ?? ''}`.toLocaleLowerCase().includes(term));
  },[records,kind,query]);
  const visible = filtered.slice(0,Math.max(size,revealed));
  const remaining = filtered.length - visible.length;
  function reset() { setQuery('');setKind('all');setRevealed(size); }
  return <section className="bblocks-panel bblocks-feed" aria-label="Workspace activity" aria-busy={loading || undefined}>
    <div className="bblocks-heading"><div><p className="bblocks-kicker">THE RECENT DETAILS</p><h2>A record of the work.</h2><p className="bblocks-muted">{records === activitySample ? 'Illustrative workspace events. Search or filter the sample.' : 'Activity from your application, in the order supplied.'}</p></div><Badge>{records === activitySample ? 'Sample data' : 'Activity'}</Badge></div>
    <div className="bblocks-feed-toolbar"><Field label="Search activity"><Input type="search" placeholder="Find a person or event…" value={query} onChange={event => {setQuery(event.target.value);setRevealed(size);}} disabled={loading} /></Field><Select label="Activity type" value={kind} options={kinds} onValueChange={value => {setKind(value ?? 'all');setRevealed(size);}} disabled={loading} /></div>
    {loading ? <div className="bblocks-feed-loading"><p role="status" className="bblocks-muted">Loading activity…</p>{[1,2,3].map(id => <div key={id}><Skeleton width="60%" /><Skeleton width="85%" /></div>)}</div>
      : error ? <div className="bblocks-stack"><Alert title="Activity could not be loaded" tone="danger" live>{error}</Alert>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</div>
      : filtered.length === 0 ? <EmptyState title={query || kind !== 'all' ? 'No matching activity.' : 'No activity yet.'} action={(query || kind !== 'all') ? <Button variant="secondary" onClick={reset}>Clear activity filters</Button> : undefined}>{query || kind !== 'all' ? 'Try another search or show all activity.' : 'Events will appear here when your application supplies them.'}</EmptyState>
      : <Timeline label="Activity events" items={visible.map(record => ({id:record.id,title:record.title,description:<><strong>{record.actor}</strong>{record.description && <> · {record.description}</>}</>,icon:icons[record.kind],dateTime:record.dateTime,time:record.time}))} />}
    {!loading && !error && <div className="bblocks-feed-footer"><p className="bblocks-muted" role="status">Showing {visible.length} of {filtered.length} events</p>{filtered.length > size && <Button variant="secondary" onClick={() => setRevealed(remaining ? visible.length + size : size)}>{remaining ? `Show ${Math.min(size,remaining)} more` : 'Show fewer'}</Button>}</div>}
  </section>;
}
