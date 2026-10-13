'use client';
import { useId, useState, type ReactElement, type ReactNode, type RefObject } from 'react';
import { Dialog as PrimitiveDialog } from '@base-ui/react/dialog';
import { Popover as PrimitivePopover } from '@base-ui/react/popover';
import { Tooltip as PrimitiveTooltip } from '@base-ui/react/tooltip';
import { Menu as PrimitiveMenu } from '@base-ui/react/menu';
import { Toast as PrimitiveToast } from '@base-ui/react/toast';
import { Button, Icon, cx } from './core.js';

export interface DialogProps { trigger?: ReactElement; title: string; description?: string; children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; initialFocus?:RefObject<HTMLElement|null>; finalFocus?:RefObject<HTMLElement|null> }
function DialogFrame({ trigger, title, description, children, sheet, initialFocus, finalFocus, ...props }: DialogProps & { sheet?: boolean }) {
  return <PrimitiveDialog.Root {...props}>{trigger && <PrimitiveDialog.Trigger render={trigger} />}<PrimitiveDialog.Portal><PrimitiveDialog.Backdrop className="bui-backdrop" /><PrimitiveDialog.Popup initialFocus={initialFocus} finalFocus={finalFocus} className={cx('bui-dialog', sheet && 'bui-sheet')}><div className="bui-dialog-heading"><div><PrimitiveDialog.Title className="bui-dialog-title">{title}</PrimitiveDialog.Title>{description && <PrimitiveDialog.Description className="bui-dialog-description">{description}</PrimitiveDialog.Description>}</div><PrimitiveDialog.Close render={<Button variant="ghost" className="bui-icon-button" aria-label="Close dialog"><Icon name="close" /></Button>} /></div><div className="bui-dialog-body">{children}</div></PrimitiveDialog.Popup></PrimitiveDialog.Portal></PrimitiveDialog.Root>;
}
export function Dialog(props: DialogProps) { return <DialogFrame {...props} />; }
export function Sheet(props: DialogProps) { return <DialogFrame {...props} sheet />; }
export function DialogClose({ children = 'Cancel' }: { children?: ReactNode }) { return <PrimitiveDialog.Close render={<Button variant="secondary">{children}</Button>} />; }
export function Popover({ trigger, title, children }: { trigger: ReactElement; title: string; children: ReactNode }) {
  return <PrimitivePopover.Root><PrimitivePopover.Trigger render={trigger} /><PrimitivePopover.Portal><PrimitivePopover.Positioner className="bui-positioner" sideOffset={8}><PrimitivePopover.Popup className="bui-popup bui-popover"><PrimitivePopover.Title className="bui-label">{title}</PrimitivePopover.Title><div>{children}</div></PrimitivePopover.Popup></PrimitivePopover.Positioner></PrimitivePopover.Portal></PrimitivePopover.Root>;
}
export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  const id = useId(); const [open, setOpen] = useState(false); return <PrimitiveTooltip.Root open={open} onOpenChange={setOpen}><PrimitiveTooltip.Trigger render={children} delay={350} aria-describedby={open ? id : undefined} /><PrimitiveTooltip.Portal><PrimitiveTooltip.Positioner className="bui-positioner" sideOffset={8}><PrimitiveTooltip.Popup className="bui-tooltip" id={id} role="tooltip">{content}</PrimitiveTooltip.Popup></PrimitiveTooltip.Positioner></PrimitiveTooltip.Portal></PrimitiveTooltip.Root>;
}
export interface MenuItem { label: string; onSelect?: () => void; disabled?: boolean; destructive?: boolean }
export function DropdownMenu({ trigger, items }: { trigger: ReactElement; items: MenuItem[] }) { return <PrimitiveMenu.Root><PrimitiveMenu.Trigger render={trigger} /><PrimitiveMenu.Portal><PrimitiveMenu.Positioner className="bui-positioner" align="end" sideOffset={8}><PrimitiveMenu.Popup className="bui-popup bui-menu">{items.map(item => <PrimitiveMenu.Item key={item.label} disabled={item.disabled} onClick={item.onSelect} className={cx('bui-option', item.destructive && 'bui-destructive')}>{item.label}</PrimitiveMenu.Item>)}</PrimitiveMenu.Popup></PrimitiveMenu.Positioner></PrimitiveMenu.Portal></PrimitiveMenu.Root>; }
function ToastViewport() {
  const { toasts } = PrimitiveToast.useToastManager();
  return <PrimitiveToast.Portal><PrimitiveToast.Viewport className="bui-toast-viewport">{toasts.map(toast => <PrimitiveToast.Root key={toast.id} toast={toast} className="bui-toast"><PrimitiveToast.Content className="bui-toast-content"><PrimitiveToast.Title className="bui-label" /><PrimitiveToast.Description className="bui-hint" /></PrimitiveToast.Content><PrimitiveToast.Close className="bui-toast-close" aria-label="Dismiss notification" aria-hidden={false}><Icon name="close" /></PrimitiveToast.Close></PrimitiveToast.Root>)}</PrimitiveToast.Viewport></PrimitiveToast.Portal>;
}
export function UIProvider({ children }: { children: ReactNode }) { return <PrimitiveTooltip.Provider><PrimitiveToast.Provider timeout={5000} limit={3}>{children}<ToastViewport /></PrimitiveToast.Provider></PrimitiveTooltip.Provider>; }
export const useToast = PrimitiveToast.useToastManager;
