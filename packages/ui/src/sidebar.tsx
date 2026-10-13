'use client';
// Adapted from shadcn/ui's provider / desktop-collapse / mobile-overlay pattern.
// No cookies or global keyboard shortcut. See SHADCN_LICENSE and docs/upstream.json.
import { createContext, useContext, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { PanelLeft, type LucideIcon } from 'lucide-react';
import { Button } from './core.js';
import { Drawer } from './drawer.js';
import { Tooltip } from './overlays.js';
import { useControllableValue } from './state.js';
import { cn } from './utils.js';

interface SidebarState {open:boolean;setOpen:(open:boolean)=>void;mobile:boolean;mobileOpen:boolean;setMobileOpen:(open:boolean)=>void;id:string;triggerRef:React.RefObject<HTMLButtonElement|null>}
const SidebarContext=createContext<SidebarState|null>(null);
export function useSidebar() {
  const value=useContext(SidebarContext);
  if(!value) throw new Error('Sidebar components need a SidebarProvider.');
  return value;
}
export interface SidebarProviderProps extends ComponentProps<'div'> {
  open?:boolean; defaultOpen?:boolean; onOpenChange?:(open:boolean)=>void;
}
export function SidebarProvider({open:controlled,defaultOpen=true,onOpenChange,children,className,...props}:SidebarProviderProps) {
  const [open,setOpen]=useControllableValue(controlled,defaultOpen,onOpenChange);
  const [mobile,setMobile]=useState(false);const [mobileOpen,setMobileOpen]=useState(false);
  const id=useId();const triggerRef=useRef<HTMLButtonElement>(null);const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=container.current;if(!element)return;
    // Container width also handles embedded previews and narrow application panes.
    const observer=new ResizeObserver(([entry])=>{const narrow=entry.contentRect.width<640;setMobile(narrow);if(!narrow)setMobileOpen(false);});
    observer.observe(element);return ()=>observer.disconnect();
  },[]);
  return <SidebarContext.Provider value={{open,setOpen,mobile,mobileOpen,setMobileOpen,id,triggerRef}}>
    <div {...props} ref={container} data-collapsed={!open || undefined} data-mobile={mobile || undefined} className={cn('bui-sidebar-layout bui:flex bui:w-full bui:min-w-0 bui:gap-5',className)}>{children}</div>
  </SidebarContext.Provider>;
}
export function Sidebar({children,label='Workspace navigation',className,...props}:ComponentProps<'nav'>&{label?:string}) {
  const {open,mobile,mobileOpen,setMobileOpen,id,triggerRef}=useSidebar();
  const navigation=<nav {...props} id={id} aria-label={label} className={cn('bui-sidebar-nav bui:flex bui:min-h-full bui:flex-col bui:gap-6 bui:p-3',className)}>{children}</nav>;
  if(mobile)return <Drawer title={label} side="left" open={mobileOpen} onOpenChange={setMobileOpen} finalFocus={triggerRef} className="bui-sidebar-mobile">{navigation}</Drawer>;
  return <aside data-collapsed={!open || undefined} className="bui-sidebar bui:shrink-0 bui:overflow-hidden bui:rounded-panel bui:bg-background">{navigation}</aside>;
}
export function SidebarTrigger({onClick,...props}:Omit<ComponentProps<typeof Button>,'children'>) {
  const {open,setOpen,mobile,mobileOpen,setMobileOpen,id,triggerRef}=useSidebar();
  return <Button variant="ghost" {...props} ref={triggerRef} aria-controls={id} aria-expanded={mobile?mobileOpen:open} aria-label={mobile?'Open navigation':open?'Collapse navigation':'Expand navigation'} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)mobile?setMobileOpen(!mobileOpen):setOpen(!open);}} className={cn('bui-icon-button',props.className)}><PanelLeft size={18} strokeWidth={1.75} aria-hidden="true" /></Button>;
}
export function SidebarInset({className,...props}:ComponentProps<'div'>) {
  return <div {...props} className={cn('bui:min-w-0 bui:flex-1',className)} />;
}
export function SidebarHeader({className,...props}:ComponentProps<'div'>) {
  return <div {...props} className={cn('bui-sidebar-header bui:flex bui:min-h-11 bui:items-center bui:gap-3 bui:px-2 bui:text-sm bui:font-semibold',className)} />;
}
export function SidebarFooter({className,...props}:ComponentProps<'div'>) {
  return <div {...props} className={cn('bui-sidebar-footer bui:mt-auto bui:px-2 bui:py-3 bui:text-xs bui:text-muted',className)} />;
}
export function SidebarGroup({children,label}:{children:ReactNode;label?:string}) {
  const id=useId();
  return <div className="bui:grid bui:gap-1" role="group" aria-labelledby={label?id:undefined}>
    {label && <p id={id} className="bui-sidebar-label bui:m-0 bui:px-3 bui:pb-2 bui:text-xs bui:text-muted">{label}</p>}{children}
  </div>;
}
export function SidebarMenuButton({label,icon:Symbol,active=false,onClick,...props}:Omit<ComponentProps<'button'>,'children'>&{label:string;icon:LucideIcon;active?:boolean}) {
  const {mobile,open,setMobileOpen}=useSidebar();
  const button=<button type="button" {...props} aria-label={label} aria-current={active?'page':undefined} data-active={active || undefined} onClick={event=>{onClick?.(event);if(!event.defaultPrevented && mobile)setMobileOpen(false);}} className={cn('bui-sidebar-button bui:flex bui:min-h-11 bui:w-full bui:items-center bui:gap-3 bui:rounded-control bui:border-0 bui:bg-transparent bui:px-3 bui:py-2 bui:text-left bui:font-body bui:text-sm bui:text-foreground bui:cursor-pointer bui:data-active:bg-accent bui:data-active:text-accent-foreground bui:disabled:opacity-45 bui:disabled:cursor-not-allowed',props.className)}>
    <Symbol size={18} strokeWidth={1.75} aria-hidden="true" className="bui:shrink-0" /><span className="bui-sidebar-label bui:truncate">{label}</span>
  </button>;
  return !mobile&&!open ? <Tooltip content={label}>{button}</Tooltip> : button;
}
