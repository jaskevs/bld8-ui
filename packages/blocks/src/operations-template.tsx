'use client';
import { useRef, useState } from 'react';
import { CalendarDays, FolderOpen, Search, Settings2, Sparkle } from 'lucide-react';
import { Badge, Button, CommandPalette, ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, SidebarProvider, Sidebar, SidebarHeader, SidebarGroup, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@bld8/ui';
import { ProjectPlanner } from './project-planner.js';
import { ResourceManager } from './resource-manager.js';
import { AccountSettings } from './account-settings.js';

const views=[{id:'Planning',icon:CalendarDays},{id:'Resources',icon:FolderOpen},{id:'Settings',icon:Settings2}] as const;
export function OperationsTemplate() {
  const [view,setView]=useState('Planning');const heading=useRef<HTMLHeadingElement>(null);
  function navigate(next:string) {setView(next);requestAnimationFrame(()=>heading.current?.focus());}
  return <div className="bblocks-operations">
    <header className="bblocks-operations-header"><span className="bblocks-wordmark"><span aria-hidden="true">✳</span> Outline</span><Badge tone="accent">Frontend starter</Badge><CommandPalette title="Outline navigation" trigger={<Button variant="secondary" size="sm" leadingIcon={Search}>Find a view</Button>} items={views.map(item=>({id:item.id,label:'Open '+item.id.toLowerCase(),category:'Navigate',icon:item.icon,onSelect:()=>navigate(item.id)}))} /></header>
    <SidebarProvider className="bblocks-operations-layout">
      <Sidebar label="Outline views">
        <SidebarHeader><Sparkle size={18} strokeWidth={1.75} aria-hidden="true" /><span className="bui-sidebar-label">Your workspace</span></SidebarHeader>
        <SidebarGroup label="WORKSPACE">{views.map(item=><SidebarMenuButton key={item.id} icon={item.icon} label={item.id} active={view===item.id} onClick={()=>setView(item.id)} />)}</SidebarGroup>
        <SidebarFooter>Small steps. Room to think.</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="bblocks-operations-toolbar"><SidebarTrigger /><span className="bblocks-muted">{view}</span></div>
        <ContextMenu><ContextMenuTrigger className="bblocks-operations-intro" aria-label="Workspace quick navigation">
          <p className="bblocks-kicker">SMALL PLANS. USEFUL DETAILS.</p><h2 ref={heading} tabIndex={-1}>{view==='Planning' ? 'Make room for the next idea.' : view==='Resources' ? 'Keep the references close.' : 'A few details, made yours.'}</h2><p className="bblocks-muted">A working workspace for planning and references. Changes stay in memory.</p>
        </ContextMenuTrigger><ContextMenuContent aria-label="Workspace quick navigation">{views.map(item=><ContextMenuItem key={item.id} onClick={()=>navigate(item.id)}><item.icon size={16} aria-hidden="true" />Open {item.id.toLowerCase()}</ContextMenuItem>)}</ContextMenuContent></ContextMenu>
        <div hidden={view!=='Planning'}><ProjectPlanner /></div><div hidden={view!=='Resources'}><ResourceManager /></div><div hidden={view!=='Settings'}><AccountSettings /></div>
      </SidebarInset>
    </SidebarProvider>
    <footer className="bblocks-note">Outline / BLD8 UI · MIT · Both collections free. Authentication and persistence belong to your application.</footer>
  </div>;
}
