'use client';
import { useId, useState, type ReactElement, type ReactNode, type RefObject } from 'react';
import { Dialog as PrimitiveDialog } from '@base-ui/react/dialog';
import { Popover as PrimitivePopover } from '@base-ui/react/popover';
import { Tooltip as PrimitiveTooltip } from '@base-ui/react/tooltip';
import { Menu as PrimitiveMenu } from '@base-ui/react/menu';
import { Toast as PrimitiveToast } from '@base-ui/react/toast';
import { Check, ChevronRight, Circle, type LucideIcon } from 'lucide-react';
import { Button, Icon, cx } from './core.js';

export interface DialogProps { trigger?: ReactElement; title: string; description?: string; children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; initialFocus?:RefObject<HTMLElement|null>; finalFocus?:RefObject<HTMLElement|null> }
function DialogFrame({ trigger, title, description, children, sheet, initialFocus, finalFocus, ...props }: DialogProps & { sheet?: boolean }) {
  return <PrimitiveDialog.Root {...props}>{trigger && <PrimitiveDialog.Trigger render={trigger} />}<PrimitiveDialog.Portal><PrimitiveDialog.Backdrop className="bui-backdrop" /><PrimitiveDialog.Popup initialFocus={initialFocus} finalFocus={finalFocus} className={cx('bui-dialog', sheet && 'bui-sheet')}><div className="bui-dialog-heading"><div><PrimitiveDialog.Title className="bui-dialog-title">{title}</PrimitiveDialog.Title>{description && <PrimitiveDialog.Description className="bui-dialog-description">{description}</PrimitiveDialog.Description>}</div><PrimitiveDialog.Close render={<Button variant="ghost" className="bui-icon-button" aria-label="Close dialog"><Icon name="close" /></Button>} /></div><div className="bui-dialog-body">{children}</div></PrimitiveDialog.Popup></PrimitiveDialog.Portal></PrimitiveDialog.Root>;
}
export function Dialog(props: DialogProps) { return <DialogFrame {...props} />; }
export function Sheet(props: DialogProps) { return <DialogFrame {...props} sheet />; }
export function DialogClose({ children = 'Cancel' }: { children?: ReactNode }) { return <PrimitiveDialog.Close render={<Button variant="secondary">{children}</Button>} />; }
export interface PopoverProps {trigger:ReactElement;title:string;children:ReactNode;open?:boolean;onOpenChange?:(open:boolean)=>void;onOpenChangeComplete?:(open:boolean)=>void;/** Keep the popup visible if its trigger scrolls out of view. */sticky?:boolean}
export function Popover({ trigger, title, children, sticky, ...props }: PopoverProps) {
  return <PrimitivePopover.Root {...props}><PrimitivePopover.Trigger render={trigger} /><PrimitivePopover.Portal><PrimitivePopover.Positioner className="bui-positioner" sideOffset={8} sticky={sticky} disableAnchorTracking={props.open===false}><PrimitivePopover.Popup className="bui-popup bui-popover"><PrimitivePopover.Title className="bui-label">{title}</PrimitivePopover.Title><div>{children}</div></PrimitivePopover.Popup></PrimitivePopover.Positioner></PrimitivePopover.Portal></PrimitivePopover.Root>;
}
export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  const id = useId(); const [open, setOpen] = useState(false); return <PrimitiveTooltip.Root open={open} onOpenChange={setOpen}><PrimitiveTooltip.Trigger render={children} delay={350} aria-describedby={open ? id : undefined} /><PrimitiveTooltip.Portal><PrimitiveTooltip.Positioner className="bui-positioner" sideOffset={8}><PrimitiveTooltip.Popup className="bui-tooltip" id={id} role="tooltip">{content}</PrimitiveTooltip.Popup></PrimitiveTooltip.Positioner></PrimitiveTooltip.Portal></PrimitiveTooltip.Root>;
}
interface MenuPresentation {id?:string;label:string;description?:string;disabled?:boolean;icon?:LucideIcon;shortcut?:string}
export interface MenuItem extends MenuPresentation {onSelect?:()=>void;destructive?:boolean;closeOnSelect?:boolean}
export interface MenuActionItem extends MenuItem {type?:'item'}
export interface MenuCheckboxItem extends MenuPresentation {type:'checkbox';checked?:boolean;defaultChecked?:boolean;onCheckedChange?:(checked:boolean)=>void;closeOnSelect?:boolean}
export interface MenuRadioOption extends MenuPresentation {value:string}
export interface MenuRadioGroup {type:'radio-group';id?:string;label:string;items:readonly MenuRadioOption[];value?:string;defaultValue?:string;onValueChange?:(value:string)=>void;disabled?:boolean;closeOnSelect?:boolean}
export interface MenuItemGroup {type:'group';id?:string;label?:string;items:readonly DropdownMenuEntry[]}
export interface MenuSubmenu extends MenuPresentation {type:'submenu';items:readonly DropdownMenuEntry[]}
export interface MenuSeparator {type:'separator';id?:string}
/** Existing label/onSelect action objects remain supported alongside richer menu entries. */
export type DropdownMenuEntry=MenuActionItem|MenuCheckboxItem|MenuRadioGroup|MenuItemGroup|MenuSubmenu|MenuSeparator;
export interface DropdownMenuProps {trigger:ReactElement;items:readonly DropdownMenuEntry[];open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void;align?:'start'|'center'|'end';sideOffset?:number}
function MenuText({item,descriptionId}:{item:MenuPresentation;descriptionId?:string}) {return <><span className="bui-menu-label"><span>{item.label}</span>{item.description&&<small id={descriptionId} className="bui-menu-description">{item.description}</small>}</span>{item.shortcut&&<kbd className="bui-menu-shortcut" aria-hidden="true">{item.shortcut}</kbd>}</>;}
function MenuEntries({items}:{items:readonly DropdownMenuEntry[]}) {
  const id=useId();
  return <>{items.map((item,index)=>{const key=item.id??String(index),labelId=id+'-'+index;
    switch(item.type){
      case 'separator':return <PrimitiveMenu.Separator key={key} className="bui-menu-separator"/>;
      case 'group':return <PrimitiveMenu.Group key={key}>{item.label&&<PrimitiveMenu.GroupLabel className="bui-menu-group-label">{item.label}</PrimitiveMenu.GroupLabel>}<MenuEntries items={item.items}/></PrimitiveMenu.Group>;
      case 'submenu':return <PrimitiveMenu.SubmenuRoot key={key}><PrimitiveMenu.SubmenuTrigger disabled={item.disabled} label={item.label} aria-label={item.label} aria-describedby={item.description?labelId+'-description':undefined} className="bui-option bui-menu-entry"><span className="bui-menu-leading" aria-hidden="true">{item.icon&&<Icon icon={item.icon} size={16}/>}</span><MenuText item={item} descriptionId={labelId+'-description'}/><Icon icon={ChevronRight} size={15} className="bui-menu-submenu-arrow"/></PrimitiveMenu.SubmenuTrigger><PrimitiveMenu.Portal><PrimitiveMenu.Positioner className="bui-positioner" side="right" align="start" sideOffset={4}><PrimitiveMenu.Popup className="bui-popup bui-menu bui-menu-rich" aria-label={item.label}><MenuEntries items={item.items}/></PrimitiveMenu.Popup></PrimitiveMenu.Positioner></PrimitiveMenu.Portal></PrimitiveMenu.SubmenuRoot>;
      case 'checkbox':return <PrimitiveMenu.CheckboxItem key={key} label={item.label} aria-label={item.label} aria-describedby={item.description?labelId+'-description':undefined} checked={item.checked} defaultChecked={item.defaultChecked} onCheckedChange={checked=>item.onCheckedChange?.(checked)} disabled={item.disabled} closeOnClick={item.closeOnSelect??false} className="bui-option bui-menu-entry"><span className="bui-menu-leading" aria-hidden="true"><PrimitiveMenu.CheckboxItemIndicator className="bui-menu-choice-indicator"><Icon icon={Check} size={16}/></PrimitiveMenu.CheckboxItemIndicator></span><MenuText item={item} descriptionId={labelId+'-description'}/></PrimitiveMenu.CheckboxItem>;
      case 'radio-group':return <PrimitiveMenu.Group key={key}><PrimitiveMenu.GroupLabel id={labelId} className="bui-menu-group-label">{item.label}</PrimitiveMenu.GroupLabel><PrimitiveMenu.RadioGroup aria-labelledby={labelId} value={item.value} defaultValue={item.defaultValue} onValueChange={next=>{if(typeof next==='string')item.onValueChange?.(next);}} disabled={item.disabled}>{item.items.map((option,optionIndex)=><PrimitiveMenu.RadioItem key={option.id??option.value+'-'+optionIndex} label={option.label} aria-label={option.label} aria-describedby={option.description?labelId+'-'+optionIndex+'-description':undefined} value={option.value} disabled={option.disabled} closeOnClick={item.closeOnSelect??false} className="bui-option bui-menu-entry"><span className="bui-menu-leading" aria-hidden="true"><PrimitiveMenu.RadioItemIndicator className="bui-menu-choice-indicator"><Icon icon={Circle} size={8} fill="currentColor"/></PrimitiveMenu.RadioItemIndicator></span><MenuText item={option} descriptionId={labelId+'-'+optionIndex+'-description'}/></PrimitiveMenu.RadioItem>)}</PrimitiveMenu.RadioGroup></PrimitiveMenu.Group>;
      default:return <PrimitiveMenu.Item key={key} label={item.label} aria-label={item.label} aria-describedby={item.description?labelId+'-description':undefined} disabled={item.disabled} onClick={item.onSelect} closeOnClick={item.closeOnSelect??true} className={cx('bui-option bui-menu-entry',item.destructive&&'bui-destructive')}><span className="bui-menu-leading" aria-hidden="true">{item.icon&&<Icon icon={item.icon} size={16}/>}</span><MenuText item={item} descriptionId={labelId+'-description'}/></PrimitiveMenu.Item>;
    }
  })}</>;
}
/** Keyboard navigation, typeahead and focus return are supplied by the menu primitive. */
export function DropdownMenu({trigger,items,open,defaultOpen,onOpenChange,align='end',sideOffset=8}:DropdownMenuProps) {
  return <PrimitiveMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={next=>onOpenChange?.(next)}><PrimitiveMenu.Trigger render={trigger}/><PrimitiveMenu.Portal><PrimitiveMenu.Positioner className="bui-positioner" align={align} sideOffset={sideOffset} disableAnchorTracking={open===false}><PrimitiveMenu.Popup className="bui-popup bui-menu bui-menu-rich"><MenuEntries items={items}/></PrimitiveMenu.Popup></PrimitiveMenu.Positioner></PrimitiveMenu.Portal></PrimitiveMenu.Root>;
}
function ToastViewport() {
  const { toasts } = PrimitiveToast.useToastManager();
  return <PrimitiveToast.Portal><PrimitiveToast.Viewport className="bui-toast-viewport">{toasts.map(toast => <PrimitiveToast.Root key={toast.id} toast={toast} className="bui-toast"><PrimitiveToast.Content className="bui-toast-content"><PrimitiveToast.Title className="bui-label" /><PrimitiveToast.Description className="bui-hint" /></PrimitiveToast.Content><PrimitiveToast.Close className="bui-toast-close" aria-label="Dismiss notification" aria-hidden={false}><Icon name="close" /></PrimitiveToast.Close></PrimitiveToast.Root>)}</PrimitiveToast.Viewport></PrimitiveToast.Portal>;
}
export function UIProvider({ children }: { children: ReactNode }) { return <PrimitiveTooltip.Provider><PrimitiveToast.Provider timeout={5000} limit={3}>{children}<ToastViewport /></PrimitiveToast.Provider></PrimitiveTooltip.Provider>; }
export const useToast = PrimitiveToast.useToastManager;
