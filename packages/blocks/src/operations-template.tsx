'use client';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, FolderOpen, Search, Settings2, Sparkle } from 'lucide-react';
import { Alert, Badge, Button, CommandPalette, ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, SidebarProvider, Sidebar, SidebarHeader, SidebarGroup, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@bld8/ui';
import { OutlineProjects } from './outline-projects.js';
import { createOutlineRepository, type OutlineRepository } from './outline-repository.js';
import type { ResourceRecord } from './resource-manager.js';
import type { AccountValues } from './account-settings.js';
import { ResourceManager } from './resource-manager.js';
import { AccountSettings } from './account-settings.js';

const views=[{id:'Planning',icon:CalendarDays},{id:'Resources',icon:FolderOpen},{id:'Settings',icon:Settings2}] as const;
export function OperationsTemplate({repository:provided}:{repository?:OutlineRepository}={}) {
  const [repository,setRepository]=useState<OutlineRepository|null>(provided ?? null);
  const [storageError,setStorageError]=useState('');
  const [preferences,setPreferences]=useState<{resources?:ResourceRecord[];profile?:AccountValues}|null>(null);
  useEffect(()=>{try{setRepository(provided ?? createOutlineRepository(window.localStorage));const raw=window.localStorage.getItem('bld8-outline-preferences-v1');const value=raw?JSON.parse(raw):{};setPreferences({resources:Array.isArray(value.resources)?value.resources:undefined,profile:value.profile && typeof value.profile.name==='string' && typeof value.profile.email==='string' && typeof value.profile.digest==='boolean'?value.profile:undefined});}catch{setStorageError('Browser storage is unavailable. Enable storage for this site and reload to use the saved workspace.');setPreferences({});}},[provided]);
  const preferenceRef=useRef(preferences);preferenceRef.current=preferences;
  function savePreferences(patch:Partial<NonNullable<typeof preferences>>){const next={...preferenceRef.current,...patch};window.localStorage.setItem('bld8-outline-preferences-v1',JSON.stringify(next));preferenceRef.current=next;setPreferences(next);}

  const [view,setView]=useState('Planning');const heading=useRef<HTMLHeadingElement>(null);
  function navigate(next:string) {setView(next);requestAnimationFrame(()=>heading.current?.focus());}
  return <div className="bblocks-operations">
    <header className="bblocks-operations-header"><span className="bblocks-wordmark"><span aria-hidden="true">✳</span> Outline</span><Badge tone="accent">Example application</Badge><CommandPalette title="Outline navigation" trigger={<Button variant="secondary" size="sm" leadingIcon={Search}>Find a view</Button>} items={views.map(item=>({id:item.id,label:'Open '+item.id.toLowerCase(),category:'Navigate',icon:item.icon,onSelect:()=>navigate(item.id)}))} /></header>
    <SidebarProvider className="bblocks-operations-layout">
      <Sidebar label="Outline views">
        <SidebarHeader><Sparkle size={18} strokeWidth={1.75} aria-hidden="true" /><span className="bui-sidebar-label">Your workspace</span></SidebarHeader>
        <SidebarGroup label="WORKSPACE">{views.map(item=><SidebarMenuButton key={item.id} icon={item.icon} label={item.id} active={view===item.id} onClick={()=>setView(item.id)} />)}</SidebarGroup>
        <SidebarFooter>Small steps. Room to think.</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="bblocks-operations-toolbar"><SidebarTrigger /><span className="bblocks-muted">{view}</span></div>
        <ContextMenu><ContextMenuTrigger className="bblocks-operations-intro" aria-label="Workspace quick navigation">
          <p className="bblocks-kicker">SMALL PLANS. USEFUL DETAILS.</p><h2 ref={heading} tabIndex={-1}>{view==='Planning' ? 'Make room for the next idea.' : view==='Resources' ? 'Keep the references close.' : 'A few details, made yours.'}</h2><p className="bblocks-muted">{provided?'Projects use your connected service. References and preferences stay in this browser.':'Projects, references and preferences. Saved in this browser; no account required.'}</p>
        </ContextMenuTrigger><ContextMenuContent aria-label="Workspace quick navigation">{views.map(item=><ContextMenuItem key={item.id} onClick={()=>navigate(item.id)}><item.icon size={16} aria-hidden="true" />Open {item.id.toLowerCase()}</ContextMenuItem>)}</ContextMenuContent></ContextMenu>
        {storageError && <Alert title="Storage needs attention" tone="warning">{storageError}</Alert>}
        <div hidden={view!=='Planning'}>{repository?<OutlineProjects repository={repository} />:<p role="status">Opening the workspace…</p>}</div>
        <div hidden={view!=='Resources'}>{preferences && <ResourceManager initialRecords={preferences.resources} onRecordsChange={resources=>{try{savePreferences({resources});setStorageError('');}catch{setStorageError('Resource changes are only in memory: browser storage could not be updated.');}}} />}</div>
        <div hidden={view!=='Settings'}>{preferences && <AccountSettings initialValues={preferences.profile} onSave={async profile=>{savePreferences({profile});setStorageError('');}} />}</div>
      </SidebarInset>
    </SidebarProvider>
    <footer className="bblocks-note">Outline / BLD8 UI · MIT · Both collections free. {provided?'Connected project service · Browser preferences':'Local browser storage'} · File metadata only · Connect the repository adapter to your own API.</footer>
  </div>;
}
