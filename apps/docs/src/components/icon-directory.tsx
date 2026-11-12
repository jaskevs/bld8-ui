'use client';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Bookmark, Check, Copy, Download, Ellipsis, Link2, Pencil, Plus, RotateCcw, Save, Search, Settings, Trash2, X } from 'lucide-react';
import { Button, Icon, IconButton, Input, InputGroup, Pagination, Sheet } from '@bld8/ui';
import { iconCatalog, lucideVersion } from '@/lib/generated/icons';
import { CodeBlock } from './code-block';
import {withSourceNotice} from '@/lib/source-notice';

const categories = ['All', ...new Set(iconCatalog.map(icon => icon.category))];
const sizes = [16,18,20,24,32], strokes = [1.5,1.75,2], tones = ['Ink','Muted','Accent'];
const pageSize = 72, savedKey = 'bld8-ui-saved-icons-v1';
type Entry = typeof iconCatalog[number];
const names = new Set(iconCatalog.map(icon => icon.name));
const commonActions = [{label:'Add',icon:Plus,name:'plus'},{label:'Save',icon:Save,name:'save'},{label:'Search',icon:Search,name:'search'},{label:'Edit',icon:Pencil,name:'pencil'},{label:'Delete',icon:Trash2,name:'trash'},{label:'Download',icon:Download,name:'download'},{label:'Copy',icon:Copy,name:'copy'},{label:'Settings',icon:Settings,name:'settings'},{label:'More',icon:Ellipsis,name:'ellipsis'}];
const aliases:Record<string,string> = {'plus':'new create insert add','save':'disk submit store','search':'find lookup magnify','pencil':'edit rename write','trash':'delete remove bin','x':'close dismiss cancel','ellipsis':'more options actions kebab','menu':'hamburger navigation','settings':'preferences configuration gear','settings-2':'preferences controls sliders','bookmark':'save favourite favorite','heart':'like favourite favorite','circle-alert':'warning error problem','circle-check':'success done complete','loader-circle':'loading busy spinner','mail':'email envelope inbox','user':'person profile account','log-in':'signin login enter','log-out':'signout logout exit','shopping-cart':'basket checkout'};
function asset(icon:Entry,stroke:number) { return `/icon-assets/${icon.name}-${stroke}.svg`; }
function Mask({icon,size,stroke}:{icon:Entry;size:number;stroke:number}) {
  const image=`url("${asset(icon,stroke)}")`;
  return <span className="icon-mask" aria-hidden="true" style={{width:size,height:size,maskImage:image,WebkitMaskImage:image}} />;
}
function svgAtSize(source:string,size:number) {
  const document=new DOMParser().parseFromString(source,'image/svg+xml'),svg=document.documentElement;
  if(svg.localName!=='svg'||document.querySelector('parsererror'))throw new Error('Invalid SVG');
  svg.setAttribute('width',String(size));svg.setAttribute('height',String(size));svg.setAttribute('stroke','currentColor');
  svg.removeAttribute('role');svg.removeAttribute('aria-label');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  return new XMLSerializer().serializeToString(document);
}
export function IconDirectory() {
  const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[page,setPage]=useState(1);
  const [selected,setSelected]=useState(iconCatalog.find(icon=>icon.name==='camera')||iconCatalog[0]);
  const [size,setSize]=useState(24),[stroke,setStroke]=useState(1.75),[tone,setTone]=useState('Ink');
  const [message,setMessage]=useState(''),[mobile,setMobile]=useState(false),[drawerOpen,setDrawerOpen]=useState(false);
  const [saved,setSaved]=useState<string[]>([]),[collection,setCollection]=useState<'all'|'saved'>('all'),[focused,setFocused]=useState<string|null>(null);
  const exportRequest=useRef(0),returnFocus=useRef<HTMLElement|null>(null),inspectButton=useRef<HTMLButtonElement>(null);
  const [svgSource,setSvgSource]=useState<{key:string;source:string}|null>(null),[svgError,setSvgError]=useState(false),[svgAttempt,setSvgAttempt]=useState(0);
  const svgKey=selected.name+':'+stroke;
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 760px)');
    const update=()=>{setMobile(media.matches);if(!media.matches)setDrawerOpen(false);};update();media.addEventListener('change',update);
    try {const stored:unknown=JSON.parse(localStorage.getItem(savedKey)||'[]');if(Array.isArray(stored))setSaved([...new Set(stored.filter((name):name is string=>typeof name==='string'&&names.has(name)))]);}catch{}
    const params=new URLSearchParams(window.location.search),icon=iconCatalog.find(item=>item.name===params.get('icon')||item.aliases.includes(params.get('icon')||''));
    if(icon){setSelected(icon);setQuery(icon.name);if(media.matches){returnFocus.current=inspectButton.current;setDrawerOpen(true);}}
    const urlSize=Number(params.get('size')),urlStroke=Number(params.get('stroke')),urlTone=params.get('tone');
    if(sizes.includes(urlSize))setSize(urlSize);if(strokes.includes(urlStroke))setStroke(urlStroke);if(urlTone&&tones.includes(urlTone))setTone(urlTone);
    return()=>{media.removeEventListener('change',update);exportRequest.current++;};
  },[]);
  useEffect(()=>{setMessage('');exportRequest.current++;},[selected,size,stroke,tone]);
  useEffect(()=>{
    const controller=new AbortController(),key=selected.name+':'+stroke;setSvgError(false);
    fetch(asset(selected,stroke),{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Unavailable');const source=await response.text();if(!controller.signal.aborted)setSvgSource({key,source});}).catch(()=>{if(!controller.signal.aborted)setSvgError(true);});
    return()=>controller.abort();
  },[selected,stroke,svgAttempt]);
  const filtered=useMemo(()=>{
    const terms=query.toLowerCase().replace(/[-_]/g,' ').trim().split(/\s+/).filter(Boolean);
    return iconCatalog.filter(icon=>(category==='All'||icon.category===category)&&(collection==='all'||saved.includes(icon.name))&&terms.every(term=>`${icon.name.replaceAll('-',' ')} ${icon.label} ${icon.exportName} ${icon.category} ${icon.aliases.join(' ').replaceAll('-',' ')} ${icon.aliases.map(alias=>alias.replaceAll('-','')).join(' ')} ${aliases[icon.name]||''}`.toLowerCase().includes(term)));
  },[category,query,collection,saved]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),activePage=Math.min(page,pages),visible=filtered.slice((activePage-1)*pageSize,activePage*pageSize);
  const tabStop=visible.find(icon=>icon.name===focused)?.name||visible.find(icon=>icon.name===selected.name)?.name||visible[0]?.name;
  const isSaved=saved.includes(selected.name),importCode=`import { ${selected.exportName} } from 'lucide-react';`;
  const code=withSourceNotice(`'use client';\nimport { useState } from 'react';\n${importCode}\nimport { Icon, IconButton, Button } from '@bld8/ui';\n\nexport function ${selected.exportName}Actions() {\n  const [status, setStatus] = useState('');\n  async function copy(value: string) {\n    try { await navigator.clipboard.writeText(value); setStatus('Copied'); }\n    catch { setStatus('Clipboard unavailable'); }\n  }\n  return (\n    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>\n      <Icon icon={${selected.exportName}} size={${size}} strokeWidth={${stroke}} />\n      <Button size="sm" onClick={() => copy(${JSON.stringify(importCode)})}>\n        <Icon icon={${selected.exportName}} size={18} strokeWidth={${stroke}} /> Copy import\n      </Button>\n      <Button size="sm" variant="secondary" onClick={() => copy(${JSON.stringify(selected.name)})}>\n        Copy name <Icon icon={${selected.exportName}} size={18} strokeWidth={${stroke}} />\n      </Button>\n      <IconButton size="sm" label=${JSON.stringify('Copy '+selected.label+' import')} variant="ghost" onClick={() => copy(${JSON.stringify(importCode)})}>\n        <Icon icon={${selected.exportName}} size={18} strokeWidth={${stroke}} />\n      </IconButton>\n      <span role="status">{status}</span>\n    </div>\n  );\n}`);
  async function copy(value:string,success:string) {try{await navigator.clipboard.writeText(value);setMessage(success);}catch{setMessage('Clipboard unavailable. Select the code or download the SVG.');}}
  async function exportSvg(download=false) {
    const request=++exportRequest.current,icon=selected,exportSize=size,exportStroke=stroke;
    try {
      if(!svgSource||svgSource.key!==icon.name+':'+exportStroke)throw new Error('Not ready');
      const svg=svgAtSize(svgSource.source,exportSize);if(request!==exportRequest.current)return;
      if(download){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),link=document.createElement('a');link.href=url;link.download=icon.name+'.svg';document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('SVG downloaded at '+exportSize+'px, with licence notices.');}
      else {await navigator.clipboard.writeText(svg);if(request===exportRequest.current)setMessage('SVG copied, with licence notices.');}
    }catch{if(request===exportRequest.current)setMessage('Unable to export SVG here. The React example is still available.');}
  }
  function choose(icon:Entry,trigger?:HTMLElement){setSelected(icon);if(mobile){returnFocus.current=trigger||inspectButton.current;setDrawerOpen(true);}}
  function chooseCommon(name:string,trigger?:HTMLElement){const icon=iconCatalog.find(item=>item.name===name);if(!icon)return;setCollection('all');setCategory('All');setQuery(name);setPage(1);setFocused(null);choose(icon,trigger);}
  function toggleSaved(){if(isSaved&&collection==='saved')returnFocus.current=inspectButton.current;const next=isSaved?saved.filter(name=>name!==selected.name):[...saved,selected.name];setSaved(next);try{localStorage.setItem(savedKey,JSON.stringify(next));setMessage(isSaved?'Removed from saved icons.':'Added to saved icons.');}catch{setMessage('Saved for this session. Browser storage is unavailable.');}}
  function copyLink(){const url=new URL(window.location.pathname,window.location.origin);url.searchParams.set('icon',selected.name);url.searchParams.set('size',String(size));url.searchParams.set('stroke',String(stroke));url.searchParams.set('tone',tone);void copy(url.href,'Icon link copied.');}
  function moveFocus(event:KeyboardEvent<HTMLDivElement>){
    if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.icon-tile')),index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;
    const columns=getComputedStyle(event.currentTarget).gridTemplateColumns.split(' ').length;
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:index+(event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?columns:-columns);
    event.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,next))]?.focus();
  }
  const inspector=<>
    <div className="icon-inspector-heading"><div><p className="eyebrow">SELECTED ICON</p><h2>{selected.label}</h2></div><span className="collection-label">Lucide</span></div>
    <div className="icon-inspector-meta"><code>{selected.exportName}</code><span>{selected.category}</span></div>
    <div className="icon-showcase" data-tone={tone}><div><Mask icon={selected} size={size} stroke={stroke}/><small>Actual size · {size}px</small></div><div><Mask icon={selected} size={size*2} stroke={stroke}/><small>2× detail</small></div></div>
    <div className="icon-preview-settings">
      <fieldset className="icon-controls"><legend>Preview size</legend><div>{sizes.map(value=><Button key={value} size="sm" variant="ghost" aria-pressed={size===value} onClick={()=>setSize(value)}>{value}px</Button>)}</div></fieldset>
      <fieldset className="icon-controls"><legend>Stroke width</legend><div>{strokes.map(value=><Button key={value} size="sm" variant="ghost" aria-pressed={stroke===value} onClick={()=>setStroke(value)}>{value}</Button>)}</div></fieldset>
      <fieldset className="icon-controls"><legend>Preview colour</legend><div>{tones.map(value=><Button key={value} size="sm" variant="ghost" aria-pressed={tone===value} onClick={()=>setTone(value)}>{value}</Button>)}</div></fieldset>
      <p className="bui-hint">Settings apply to this preview. The gallery stays at 24px / 1.75.</p>
    </div>
    <section className="icon-context-preview" aria-label="Icon button examples"><div className="icon-context-row"><h3>Try it in a button</h3><span>18px icons · consistent control sizes</span></div><div className="icon-context-buttons">
      <Button size="sm" onClick={()=>void copy(importCode,'Import copied.')}><Mask icon={selected} size={18} stroke={stroke}/>Copy import</Button>
      <Button size="sm" variant="secondary" onClick={()=>void copy(selected.name,'Icon name copied.')}>Copy name<Mask icon={selected} size={18} stroke={stroke}/></Button>
      <IconButton size="sm" label={'Copy '+selected.label+' import'} variant="ghost" onClick={()=>void copy(importCode,'Import copied.')}><Mask icon={selected} size={18} stroke={stroke}/></IconButton>
    </div><p className="bui-hint">Leading, trailing and icon-only. Every example is a working copy action. Exports inherit text colour.</p></section>
    <div className="icon-inspector-utilities"><Button size="sm" variant="ghost" leadingIcon={isSaved?Check:Bookmark} aria-pressed={isSaved} onClick={toggleSaved}>{isSaved?'Unsave icon':'Save icon'}</Button><Button size="sm" variant="ghost" leadingIcon={Link2} onClick={copyLink}>Copy link</Button><Button size="sm" variant="ghost" leadingIcon={RotateCcw} onClick={()=>{setSize(24);setStroke(1.75);setTone('Ink');}}>Reset settings</Button></div>
    <div className="icon-download-actions icon-export-actions" aria-busy={svgSource?.key!==svgKey&&!svgError}><Button size="sm" variant="secondary" leadingIcon={Copy} disabled={svgSource?.key!==svgKey||svgError} onClick={()=>void exportSvg()}>Copy SVG</Button><Button size="sm" variant="secondary" leadingIcon={Download} disabled={svgSource?.key!==svgKey||svgError} onClick={()=>void exportSvg(true)}>Download SVG</Button></div>
    <p className="icon-status" role="status">{message||(svgError?'SVG unavailable. Retry or use the React example.':svgSource?.key!==svgKey?'Preparing SVG…':'')}</p>{svgError&&<Button size="sm" variant="secondary" onClick={()=>setSvgAttempt(value=>value+1)}>Retry SVG</Button>}
    <CodeBlock code={code}/><p className="bui-hint">Workspace and ZIP imports shown. For registry installs, use your local <code>bld8/</code> source path.</p>
    <p className="icon-provenance">Lucide {lucideVersion} · ISC, with MIT notices for Feather-derived icons. <a href="/icon-assets/LICENSE.txt">Licence notices</a></p>
  </>;
  return <div className="icon-directory"><div className="icon-browser">
    <div className="icon-browser-heading"><div><p className="eyebrow">ICON DIRECTORY</p><h2>Find the right shape.</h2></div><p>Search a name, category or common action.</p></div>
    <div className="icon-search"><InputGroup leading={<Icon icon={Search}/>} trailing={<IconButton label="Clear icon search" icon={X} variant="ghost" size="sm" disabled={!query} onClick={()=>{setQuery('');setPage(1);setFocused(null);}}/>}><Input type="search" aria-label="Search icons" placeholder="Search icons or actions…" maxLength={80} value={query} onChange={event=>{setQuery(event.target.value);setPage(1);setFocused(null);}}/></InputGroup><Button ref={inspectButton} className="icon-mobile-toggle" size="sm" variant="secondary" onClick={()=>{returnFocus.current=inspectButton.current;setDrawerOpen(true);}}>Inspect {selected.label}<Icon/></Button></div>
    <div className="icon-quick-actions" role="group" aria-label="Common action icons">{commonActions.map(action=><Button key={action.name} leadingIcon={action.icon} variant="ghost" size="sm" aria-label={'Choose '+action.label+' icon'} onClick={event=>chooseCommon(action.name,event.currentTarget)}>{action.label}</Button>)}</div>
    <div className="icon-browser-collections" role="group" aria-label="Icon collection"><Button variant="ghost" size="sm" aria-pressed={collection==='all'} onClick={()=>{setCollection('all');setPage(1);}}>All icons</Button><Button variant="ghost" size="sm" aria-pressed={collection==='saved'} onClick={()=>{setCollection('saved');setPage(1);}}>Saved icons <span>{saved.length}</span></Button></div>
    <div className="icon-category-filter" role="group" aria-label="Icon categories">{categories.map(label=><Button key={label} size="sm" variant="ghost" aria-pressed={category===label} onClick={()=>{setCategory(label);setPage(1);setFocused(null);}}>{label}</Button>)}</div>
    <div className="icon-browser-meta"><span role="status">{filtered.length.toLocaleString('en-AU')} icons</span><span>Arrow keys move · Enter inspects</span></div>
    {filtered.length?<><div className="icon-grid" role="group" aria-label="Icon results" onKeyDown={moveFocus}>{visible.map(icon=><button type="button" className="icon-tile" key={icon.name} tabIndex={icon.name===tabStop?0:-1} aria-pressed={selected.name===icon.name} onFocus={()=>setFocused(icon.name)} onClick={event=>choose(icon,event.currentTarget)} title={icon.label}><Mask icon={icon} size={24} stroke={1.75}/><span>{icon.label}</span></button>)}</div><Pagination label="Icon pages" page={activePage} totalPages={pages} onPageChange={next=>{setPage(next);setFocused(null);}}/></>:<div className="library-empty"><Icon name="search"/><h2>No matching icons.</h2><p>{collection==='saved'&&saved.length===0?'Save an icon from its inspector, or browse the full collection.':'Try a shorter name or another category.'}</p><Button variant="secondary" onClick={()=>{setQuery('');setCategory('All');setCollection('all');setPage(1);}}>Reset icon filters</Button></div>}
  </div><aside className="icon-inspector" aria-label="Selected icon">{inspector}</aside><Sheet title={selected.label} description="Adjust the selected icon, try button examples and export its source." open={drawerOpen} finalFocus={returnFocus} onOpenChange={setDrawerOpen}><div className="icon-inspector icon-inspector--sheet">{inspector}</div></Sheet></div>;
}
