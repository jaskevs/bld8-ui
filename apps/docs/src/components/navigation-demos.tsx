'use client';
import { useRef, useState } from 'react';
import { CalendarDays, FolderOpen, Settings2, Sparkle } from 'lucide-react';
import { Button, Drawer, DrawerClose, Field, Input, DropdownMenu, ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSeparator, ContextMenuGroup, ContextMenuLabel, SidebarProvider, Sidebar, SidebarHeader, SidebarGroup, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@bld8/ui';

export function DrawerDemo() {
  const input=useRef<HTMLInputElement>(null);
  const [name,setName]=useState('Interface notes');
  return <div className="stack"><Drawer title="A little room to plan." description="A short note for your next project." trigger={<Button>Open drawer</Button>} initialFocus={input}>
    <div className="stack"><Field label="Note title"><Input ref={input} value={name} onChange={event=>setName(event.target.value)} /></Field><p className="bui-hint">This draft stays here when you close and reopen the drawer.</p><DrawerClose>Keep draft</DrawerClose></div>
  </Drawer><p className="bui-hint">Drag the handle down, press Escape or use the close button.</p></div>;
}
export function ContextMenuDemo() {
  const [status,setStatus]=useState('No action yet.');const [pinned,setPinned]=useState(false);const [density,setDensity]=useState('comfortable');
  return <div className="stack">
    <ContextMenu><ContextMenuTrigger className="bui-context-demo" aria-label="Interface notes actions">
      <strong>Interface notes</strong><p className="bui-hint">Right-click, long-press or use Shift + F10.</p>
    </ContextMenuTrigger>
      <ContextMenuContent aria-label="Note actions">
        <ContextMenuGroup><ContextMenuLabel>Interface notes</ContextMenuLabel>
          <ContextMenuItem onClick={()=>setStatus('Opened interface notes.')}>Open note</ContextMenuItem>
          <ContextMenuItem disabled>Share link</ContextMenuItem>
          <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>Pinned</ContextMenuCheckboxItem>
        </ContextMenuGroup><ContextMenuSeparator />
        <ContextMenuSub><ContextMenuSubTrigger>Density</ContextMenuSubTrigger><ContextMenuContent aria-label="Note density"><ContextMenuRadioGroup value={density} onValueChange={setDensity}><ContextMenuRadioItem value="comfortable">Comfortable</ContextMenuRadioItem><ContextMenuRadioItem value="compact">Compact</ContextMenuRadioItem></ContextMenuRadioGroup></ContextMenuContent></ContextMenuSub>
        <ContextMenuSeparator /><ContextMenuItem destructive onClick={()=>setStatus('Note archived in this preview.')}>Archive note</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <DropdownMenu trigger={<Button variant="secondary">Note actions</Button>} items={[{label:'Open note',onSelect:()=>setStatus('Opened interface notes.')},{label:pinned?'Unpin note':'Pin note',onSelect:()=>setPinned(!pinned)},{label:density==='compact'?'Use comfortable spacing':'Use compact spacing',onSelect:()=>setDensity(density==='compact'?'comfortable':'compact')},{label:'Share link',disabled:true},{label:'Archive note',destructive:true,onSelect:()=>setStatus('Note archived in this preview.')}]}/>
    <p className="bui-hint" role="status">{status} {pinned?'Pinned.':'Not pinned.'} {density==='compact'?'Compact':'Comfortable'} spacing.</p>
  </div>;
}
const pages=[{label:'Planning',icon:CalendarDays},{label:'Resources',icon:FolderOpen},{label:'Settings',icon:Settings2}];
export function SidebarDemo() {
  const [page,setPage]=useState('Planning');
  return <SidebarProvider className="bui-sidebar-demo">
    <Sidebar label="Demo workspace"><SidebarHeader><Sparkle size={18} aria-hidden="true" /><span className="bui-sidebar-label">Outline</span></SidebarHeader>
      <SidebarGroup label="WORKSPACE">{pages.map(item=><SidebarMenuButton key={item.label} label={item.label} icon={item.icon} active={page===item.label} onClick={()=>setPage(item.label)} />)}</SidebarGroup>
      <SidebarFooter>Space for the next idea.</SidebarFooter></Sidebar>
    <SidebarInset><div className="bui-between"><SidebarTrigger /><span className="bui-hint">Workspace</span></div><div className="bui-sidebar-demo-content"><h3>{page}</h3><p className="bui-hint">Collapse the rail to make room. In a narrow container, navigation opens as a drawer.</p><Button className="bui:justify-self-start" size="sm" variant="secondary" onClick={()=>setPage('Planning')}>Back to planning</Button></div></SidebarInset>
  </SidebarProvider>;
}
