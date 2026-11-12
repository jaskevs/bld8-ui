'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, ClipboardCheck, Code2, Layers3, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Checkbox, DataTable, Field, Icon, Input, Progress, Select, Switch, Tabs, useReducedMotionPreference, type Column } from '@bld8/ui';

interface PreviewProject { id: string; name: string; type: string; owner: string; initials: string; status: string; date: string }
const projects: PreviewProject[] = [
  { id: '01', name: 'Design system', type: 'Library', owner: 'Maya Chen', initials: 'MC', status: 'In progress', date: '18 Nov' },
  { id: '02', name: 'Customer portal', type: 'Application', owner: 'Oliver Reed', initials: 'OR', status: 'In review', date: '21 Nov' },
  { id: '03', name: 'Product website', type: 'Marketing', owner: 'Sam Rivera', initials: 'SR', status: 'Planned', date: '24 Nov' },
  { id: '04', name: 'Account settings', type: 'Application', owner: 'Maya Chen', initials: 'MC', status: 'Done', date: '26 Nov' },
];
const projectColumns: Column<PreviewProject>[] = [
  { key: 'name', header: 'Project', cell: row => <span className="marketing-project-name"><span className="marketing-project-symbol"><Icon icon={Layers3} size={17} /></span><span><strong>{row.name}</strong><small>{row.type}</small></span></span>, sortValue: row => row.name, hideable: false },
  { key: 'owner', header: 'Owner', cell: row => <span className="marketing-project-owner"><span aria-hidden="true">{row.initials}</span>{row.owner}</span>, sortValue: row => row.owner },
  { key: 'status', header: 'Status', cell: row => <span className="marketing-project-status" data-status={row.status}><i />{row.status}</span>, sortValue: row => row.status },
  { key: 'date', header: 'Review date', cell: row => <span className="marketing-project-date">{row.date}</span>, sortValue: row => row.date },
];
const projectFilters = [{ key: 'status', label: 'Status', options: ['Planned', 'In progress', 'In review', 'Done'].map(value => ({ value, label: value })), value: (row: PreviewProject) => row.status }];

function TablePreview() {
  return <div className="marketing-preview-pane marketing-preview-pane--table">
    <div className="marketing-preview-heading"><div><p className="marketing-preview-breadcrumb">Workspace <span>/</span> Projects</p><h2>Project overview</h2><p>Keep the next review in view.</p></div><span className="marketing-preview-mark" aria-hidden="true"><Icon name="mark" size={24} /></span></div>
    <DataTable caption="Example projects" rows={projects} columns={projectColumns} rowKey={row => row.id} rowLabel={row => row.name} searchText={row => row.name + ' ' + row.owner} filters={projectFilters} pageSize={4} selectable density="comfortable" />
  </div>;
}

function FormPreview() {
  const [name, setName] = useState('Studio workspace');
  const [slug, setSlug] = useState('studio');
  const [digest, setDigest] = useState<string | null>('weekly');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const change = () => setSaved(false);
  function reset() { setName('Studio workspace'); setSlug('studio'); setDigest('weekly'); setNotifications(true); setSaved(false); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); }
  return <div className="marketing-preview-pane marketing-preview-pane--form">
    <div className="marketing-preview-heading"><div><p className="marketing-preview-breadcrumb">Workspace <span>/</span> Preferences</p><h2>Make room for your work.</h2><p>The details that make a workspace yours.</p></div><span className="marketing-preview-mark" aria-hidden="true"><Icon icon={SlidersHorizontal} size={23} /></span></div>
    <form onSubmit={submit} onReset={reset} className="marketing-settings-form">
      <div className="marketing-settings-fields"><Field label="Workspace name" required><Input required type="text" pattern=".*\S.*" value={name} onChange={event => { setName(event.target.value); change(); }} maxLength={60} /></Field><Field label="Workspace slug" required hint="Letters, numbers and hyphens."><Input required type="text" value={slug} onChange={event => { setSlug(event.target.value); change(); }} pattern="(?:[a-z0-9]|-)+" maxLength={40} /></Field><Select label="Activity digest" value={digest} onValueChange={value => { setDigest(value); change(); }} options={[{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Once a week' }, { value: 'off', label: 'No digest' }]} /></div>
      <div className="marketing-settings-switch"><Switch label="Project notifications" hint="Include project updates in your workspace preferences." checked={notifications} onCheckedChange={value => { setNotifications(value); change(); }} /></div>
      <div className="marketing-settings-actions"><Button type="reset" variant="ghost">Reset</Button><Button type="submit">Save changes <Icon name="check" size={16} /></Button><p role="status">{saved ? 'Changes saved in this preview.' : 'Try the controls. Changes stay in this preview.'}</p></div>
    </form>
  </div>;
}

const initialTasks = ['Review keyboard navigation', 'Check small-screen layouts', 'Connect the save callback', 'Share the preview'];
function WorkflowPreview() {
  const [complete, setComplete] = useState<string[]>([initialTasks[0], initialTasks[1]]);
  return <div className="marketing-preview-pane marketing-preview-pane--workflow">
    <div className="marketing-preview-heading"><div><p className="marketing-preview-breadcrumb">Workspace <span>/</span> Release checklist</p><h2>From draft to ready.</h2><p>A shared view of the work ahead.</p></div><Badge tone={complete.length === initialTasks.length ? 'success' : 'neutral'}>{complete.length === initialTasks.length ? 'Ready for review' : 'In progress'}</Badge></div>
    <div className="marketing-checklist-layout"><div className="marketing-checklist">{initialTasks.map((task, index) => <div key={task} className="marketing-checklist-row" data-complete={complete.includes(task)}><Checkbox label={task} checked={complete.includes(task)} onCheckedChange={checked => setComplete(current => checked ? [...current, task] : current.filter(item => item !== task))} /><span>{String(index + 1).padStart(2, '0')}</span></div>)}</div><aside className="marketing-checklist-summary"><span className="marketing-checklist-icon" aria-hidden="true"><Icon icon={ClipboardCheck} size={24} /></span><strong>{complete.length}<span> / {initialTasks.length}</span></strong><p>items completed</p><Progress label="Release progress" value={complete.length} max={initialTasks.length} /><p className="marketing-checklist-note">Check off an item to update the progress.</p></aside></div>
    <div className="marketing-workflow-foot"><span><Icon icon={Check} size={14} /> Local preview · no service required</span><Button variant="ghost" size="sm" onClick={() => setComplete(current => current.length ? [] : [...initialTasks])}>{complete.length ? 'Clear checklist' : 'Complete all'}</Button></div>
  </div>;
}

const views = {
  forms: { hint: 'Edit a field. Change a preference. Save the draft.', href: '/components/input', link: 'Explore form controls' },
  tables: { hint: 'Search a project. Sort a column. Select a row.', href: '/components/table', link: 'Explore data tables' },
  workflows: { hint: 'Check off an item. Watch the progress update.', href: '/blocks', link: 'Explore interface blocks' },
};
type View = keyof typeof views;

/** Measures natural content separately from the animated viewport to avoid resize feedback. */
function MarketingPreviewStage({ children, view }: { children: ReactNode; view: View }) {
  const stage = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const resize = useRef<(() => void) | null>(null);
  const reduced = useReducedMotionPreference();

  useLayoutEffect(() => {
    const viewport = stage.current, natural = content.current;
    if (!viewport || !natural) return;
    let targetHeight = natural.getBoundingClientRect().height;
    let animation: Animation | null = null;

    function cancel() {
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
      viewport!.removeAttribute('data-resizing');
    }
    function measure() {
      const nextHeight = natural!.getBoundingClientRect().height;
      if (Math.abs(nextHeight - targetHeight) < 0.5) return;
      // Read the interrupted frame before cancelling; idle stages start at their previous natural height.
      const fromHeight = animation ? viewport!.getBoundingClientRect().height : targetHeight;
      targetHeight = nextHeight;
      cancel();
      if (reduced || typeof viewport!.animate !== 'function' || Math.abs(fromHeight - nextHeight) < 0.5) return;
      const style = getComputedStyle(viewport!);
      const token = style.getPropertyValue('--bui-duration-slow').trim();
      const duration = (parseFloat(token) || 0) * (token.endsWith('ms') ? 1 : 1000);
      if (duration <= 0) return;
      viewport!.dataset.resizing = 'true';
      try {
        const next = viewport!.animate([{ height: fromHeight + 'px' }, { height: nextHeight + 'px' }], {
          duration, easing: style.getPropertyValue('--bui-ease').trim() || 'ease-out', fill: 'none',
        });
        animation = next;
        next.onfinish = () => { if (animation === next) cancel(); };
      } catch { cancel(); }
    }

    resize.current = measure;
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(natural);
    return () => { resize.current = null; observer?.disconnect(); cancel(); };
  }, [reduced]);

  // Run before paint on a tab commit; ResizeObserver also covers content and responsive size changes.
  useLayoutEffect(() => { resize.current?.(); }, [view]);

  return <div ref={stage} className="marketing-preview-stage"><div ref={content} className="marketing-preview-stage-content">{children}</div></div>;
}

export function MarketingPreview() {
  const [view, setView] = useState<View>('tables');
  return <div className="marketing-live-preview">
    <div className="marketing-preview-topline"><span className="marketing-preview-live"><i />LIVE COMPONENTS</span><span>Made from the same source you install.</span></div>
    <MarketingPreviewStage view={view}><Tabs label="Try the library" value={view} onValueChange={value => setView(value as View)} items={[
      { value: 'forms', label: 'Forms', content: <FormPreview /> },
      { value: 'tables', label: 'Data tables', content: <TablePreview /> },
      { value: 'workflows', label: 'Workflows', content: <WorkflowPreview /> },
    ]} /></MarketingPreviewStage>
    <div className="marketing-preview-caption"><span>{views[view].hint}</span><Link href={views[view].href}>{views[view].link}<Icon icon={ArrowUpRight} size={15} /></Link></div>
    <div className="marketing-preview-signature" aria-hidden="true"><Icon icon={Code2} size={15} /> REACT + TYPESCRIPT</div>
  </div>;
}

const installCommand = 'npx shadcn@latest add https://ui.bld8.dev/r/button.json';
export function MarketingInstallCommand() {
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(installCommand); setStatus('Command copied.'); }
    catch { setStatus('Select the command to copy it manually.'); }
    timer.current = setTimeout(() => setStatus(''), 4000);
  }
  return <><div className="marketing-install-command"><code>{installCommand}</code><button type="button" aria-label="Copy installation command" onClick={copy}><Icon name={status === 'Command copied.' ? 'check' : 'copy'} size={15} /></button></div><span role="status">{status}</span></>;
}
