'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ArrowUpRight, Folder, Layers, Plus, SlidersHorizontal} from 'lucide-react';
import {Badge, Button, Card, Chart, Checkbox, DataTable, Dialog, DialogClose, Field, Icon, Input, NumberField, Progress, RadioGroup, Select, Slider, Switch, Tabs} from '@bld8/ui';
import {DEFAULT_THEME, getThemeTokens, parseThemeConfig, type ThemeConfig, type ThemeMode} from '@bld8/ui/theme-config';

type Project = {id:number; name:string; status:'In progress'|'Ready'; detail:string};
const reviewData = [
  {id:'mon',label:'Mon',values:{reviewed:8,ready:5}},
  {id:'tue',label:'Tue',values:{reviewed:6,ready:4}},
  {id:'wed',label:'Wed',values:{reviewed:10,ready:8}},
  {id:'thu',label:'Thu',values:{reviewed:9,ready:7}},
  {id:'fri',label:'Fri',values:{reviewed:12,ready:9}},
];
const initialProjects: Project[] = [
  {id:1,name:'Interface audit',status:'In progress',detail:'Components and keyboard flows'},
  {id:2,name:'Navigation patterns',status:'Ready',detail:'A clearer way through the workspace'},
  {id:3,name:'Release notes',status:'In progress',detail:'Small changes, written down'},
];

export function ThemePreview() {
  const [theme, setTheme] = useState<{config:ThemeConfig;mode:ThemeMode}>({config:{...DEFAULT_THEME},mode:'light'});
  const [projects,setProjects] = useState(initialProjects);
  const [filter,setFilter] = useState('all');
  const [open,setOpen] = useState(false);
  const [name,setName] = useState('');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [progress,setProgress] = useState(65);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const before = {mode:html.getAttribute('data-ui-theme'),preview:html.getAttribute('data-theme-preview'),host:html.classList.contains('bld8-theme')};
    html.setAttribute('data-theme-preview','');
    html.classList.add('bld8-theme');
    const receive = (event:MessageEvent) => {
      if (window.parent === window || event.source !== window.parent || event.origin !== location.origin) return;
      const data:unknown = event.data;
      if (!data || typeof data !== 'object' || !('type' in data) || data.type !== 'bld8-theme-config' || !('config' in data) || !('mode' in data) || (data.mode !== 'light' && data.mode !== 'dark')) return;
      if (!data.config || typeof data.config !== 'object' || Array.isArray(data.config)) return;
      try {
        const config = parseThemeConfig(JSON.stringify({version:1,...data.config}));
        if (config) setTheme({config,mode:data.mode});
      } catch { /* Ignore malformed messages; keep the last valid preview. */ }
    };
    window.addEventListener('message',receive);
    if (window.parent !== window) window.parent.postMessage({type:'bld8-theme-ready'},location.origin);
    return () => {
      window.removeEventListener('message',receive);
      if (!before.host) html.classList.remove('bld8-theme');
      if (before.preview === null) html.removeAttribute('data-theme-preview'); else html.setAttribute('data-theme-preview',before.preview);
      if (before.mode === null) html.removeAttribute('data-ui-theme'); else html.setAttribute('data-ui-theme',before.mode);
    };
  },[]);

  useEffect(() => {
    const html = document.documentElement;
    const tokens = getThemeTokens(theme.config,theme.mode);
    // The showcase already bundles these fonts. Exported CSS uses portable names
    // and system fallbacks instead of these application-specific font aliases.
    if (theme.config.typography === 'standard') {
      tokens['--bui-font'] = 'var(--font-body, Arial, sans-serif)';
      tokens['--bui-heading'] = 'var(--font-display, Arial, sans-serif)';
    } else if (theme.config.typography === 'geometric') {
      tokens['--bui-font'] = 'var(--font-display, Arial, sans-serif)';
      tokens['--bui-heading'] = 'var(--font-display, Arial, sans-serif)';
    }
    const previous = Object.keys(tokens).map(key => [key,html.style.getPropertyValue(key),html.style.getPropertyPriority(key)]);
    const previousScheme = html.style.colorScheme;
    html.dataset.uiTheme = theme.mode;
    for (const [key,value] of Object.entries(tokens)) html.style.setProperty(key,value);
    html.style.colorScheme = theme.mode;
    html.dataset.themeReady = 'true';
    if (window.parent !== window) window.parent.postMessage({type:'bld8-theme-applied'},location.origin);
    return () => {
      for (const [key,value,priority] of previous) { if (value) html.style.setProperty(key,value,priority); else html.style.removeProperty(key); }
      html.style.colorScheme = previousScheme;
      delete html.dataset.themeReady;
    };
  },[theme]);

  const shown = projects.filter(project => filter === 'all' || project.status === filter);
  function createProject(event:FormEvent) {
    event.preventDefault();
    const title = name.trim();
    if (!title || title.length > 60) { setError('Use a project name from 1 to 60 characters.');field.current?.focus();return; }
    setProjects(current => [...current,{id:Math.max(...current.map(project=>project.id))+1,name:title,status:'In progress',detail:'Added in this preview'}]);
    setNotice('Project added to this preview.');setOpen(false);setName('');setError('');
  }
  const controls = <div className="theme-sample-controls">
    <Card><div className="theme-sample-card-heading"><Icon icon={SlidersHorizontal}/><h2>Useful defaults.</h2></div><Field label="Project title" hint="Keep the name short and clear."><Input defaultValue="Interface studies"/></Field><NumberField label="Team size" defaultValue={3} min={1} max={12} hint="Room for the people doing the work."/><Checkbox label="Include archived" description="Keep earlier work within reach." defaultChecked/><Switch label="Weekly digest" defaultChecked/><RadioGroup label="Review cadence" options={[{value:'weekly',label:'Weekly'},{value:'fortnightly',label:'Fortnightly'}]} defaultValue="weekly"/></Card>
    <Card><h2>A little momentum.</h2><p>Try the controls with your own settings.</p><Slider label="Review progress" min={0} max={100} value={progress} onChange={event=>setProgress(Number(event.target.value))}/><Progress label="Interface review" value={progress}/><div className="theme-sample-action-pair"><Button variant="accent" onClick={()=>{setProgress(100);setNotice('Review marked ready in this preview.');}}>Mark ready <Icon icon={ArrowUpRight}/></Button><Button variant="secondary" onClick={()=>{setProgress(65);setNotice('Review progress reset.');}}>Reset progress</Button></div><div className="theme-sample-callout"><Icon icon={Layers}/><div><strong>One shared theme.</strong><p>Fields, actions and floating controls use the same tokens.</p></div></div></Card>
  </div>;

  return <div className="theme-preview-root" data-testid="theme-preview-root">
    <section className="theme-sample" aria-label="Themed workspace">
      <header className="theme-sample-header"><div className="theme-sample-brand"><span aria-hidden="true"><Icon icon={Layers}/></span><strong>Fieldwork</strong><span>Workspace</span></div><Badge>Interactive preview</Badge></header>
      <div className="theme-sample-intro"><div><p className="theme-sample-kicker">SMALL PLANS, USEFUL DETAILS</p><h1>Make room for good work.</h1><p>Projects, preferences and the details between them.</p></div><Dialog title="Create a project" description="Add a local example to the preview." open={open} onOpenChange={value=>{setOpen(value);if(!value)setError('');}} initialFocus={field} trigger={<Button leadingIcon={Plus}>New project</Button>}><form onSubmit={createProject} className="theme-sample-form"><Field label="Project name" error={error} required><Input ref={field} value={name} maxLength={60} onChange={event=>setName(event.target.value)}/></Field><div className="theme-sample-action-pair"><DialogClose/><Button type="submit">Create project</Button></div></form></Dialog></div>
      <Tabs label="Workspace sections" defaultValue="overview" items={[
        {value:'overview',label:'Overview',content:<div className="theme-sample-overview"><Card><div className="theme-sample-project-heading"><h2>Current projects</h2><span>{shown.length} {shown.length === 1 ? 'project' : 'projects'}</span></div><Select label="Project status" value={filter} onValueChange={value=>setFilter(value??'all')} options={[{value:'all',label:'All projects'},{value:'In progress',label:'In progress'},{value:'Ready',label:'Ready'}]}/><div className="theme-sample-projects">{shown.map(project=><article key={project.id}><span className="theme-sample-project-icon"><Icon icon={Folder}/></span><div><h3>{project.name}</h3><p>{project.detail}</p></div><Badge tone={project.status==='Ready'?'neutral':'accent'}>{project.status}</Badge></article>)}</div><p className="theme-sample-footnote">A local example, ready for your own data.</p></Card><Card className="theme-sample-summary"><p className="theme-sample-kicker">AT A GLANCE</p><h2>The next useful step.</h2><p>Review the interface and keep the small decisions together.</p><Progress label="Interface review" value={progress}/><Button variant="accent" onClick={()=>{setProgress(100);setNotice('Review marked ready in this preview.');}}>Mark ready <Icon icon={ArrowUpRight}/></Button><div className="theme-sample-mini-preferences"><Checkbox label="Include archived" defaultChecked/><Switch label="Weekly digest" defaultChecked/></div></Card></div>},
        {value:'controls',label:'Controls',content:controls},
        {value:'study',label:'Interface study',content:<div className="theme-sample-study">
          <Card className="theme-sample-study-settings"><h2>Workspace settings</h2><Field label="Study name" hint="Changes stay in this preview."><Input defaultValue="Interface review"/></Field><Select label="Review schedule" defaultValue="weekly" options={[{value:'weekly',label:'Every week'},{value:'fortnightly',label:'Every two weeks'}]}/><Checkbox label="Include archived" defaultChecked/><Switch label="Weekly digest" defaultChecked/><RadioGroup label="Review detail" defaultValue="comfortable" options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]}/><Slider label="Review progress" value={progress} onChange={event=>setProgress(Number(event.target.value))}/><Button onClick={()=>setNotice('Settings saved for this preview.')}>Save settings</Button><Button variant="secondary" onClick={()=>{setProgress(65);setNotice('Preview settings reset.');}}>Reset progress</Button></Card>
          <Card className="theme-sample-study-data"><Chart label="Review activity" description="Illustrative counts for this week." height={200} data={reviewData} series={[{id:'reviewed',label:'Reviewed',tone:'primary'},{id:'ready',label:'Ready',tone:'accent'}]}/><DataTable caption="Project review" rows={projects} rowKey={project=>String(project.id)} rowLabel={project=>project.name} selectable defaultSelectedKeys={['1']} columns={[{key:'name',header:'Project',cell:project=>project.name,flex:1},{key:'status',header:'Status',cell:project=><Badge tone={project.status==='Ready'?'success':'accent'}>{project.status}</Badge>,width:130}]}/></Card>
        </div>},
      ]}/>
      <p className="theme-sample-status" role="status" aria-live="polite">{notice || 'Local preview. Changes reset when this frame reloads.'}</p>
    </section>
  </div>;
}
