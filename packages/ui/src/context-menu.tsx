'use client';
// Adapted from shadcn/ui's Base UI composition. See SHADCN_LICENSE and docs/upstream.json.
import { ContextMenu as Primitive } from '@base-ui/react/context-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from './utils.js';

export const ContextMenu = Primitive.Root;
export const ContextMenuGroup = Primitive.Group;
export const ContextMenuRadioGroup = Primitive.RadioGroup;
export const ContextMenuSub = Primitive.SubmenuRoot;
export function ContextMenuTrigger(props:Primitive.Trigger.Props) {
  return <Primitive.Trigger tabIndex={0} {...props} />;
}
type Styled<P> = Omit<P,'className'> & {className?:string};
export function ContextMenuContent({className,side='right',align='start',sideOffset=4,...props}:Styled<Primitive.Popup.Props> & Pick<Primitive.Positioner.Props,'side'|'align'|'sideOffset'>) {
  return <Primitive.Portal><Primitive.Positioner className="bui:fixed bui:z-90" sideOffset={sideOffset} side={side} align={align}>
    <Primitive.Popup {...props} className={cn('bui-context-menu bui:min-w-52 bui:max-w-[calc(100vw-24px)] bui:rounded-panel bui:bg-background bui:p-1.5 bui:font-body bui:text-sm bui:text-foreground bui:shadow-panel',className)} />
  </Primitive.Positioner></Primitive.Portal>;
}
const itemClass='bui-context-item bui:relative bui:flex bui:min-h-10 bui:items-center bui:gap-3 bui:rounded-control bui:px-3 bui:py-2 bui:cursor-default bui:outline-none bui:select-none bui:data-highlighted:bg-surface bui:data-disabled:opacity-45 bui:data-disabled:pointer-events-none';
export function ContextMenuItem({className,destructive=false,...props}:Styled<Primitive.Item.Props>&{destructive?:boolean}) {
  return <Primitive.Item {...props} className={cn(itemClass,destructive && 'bui:text-danger',className)} />;
}
export function ContextMenuCheckboxItem({className,children,...props}:Styled<Primitive.CheckboxItem.Props>) {
  return <Primitive.CheckboxItem {...props} className={cn(itemClass,className)}>
    <span className="bui:flex bui:size-4 bui:shrink-0"><Primitive.CheckboxItemIndicator><Check size={16} strokeWidth={1.75} aria-hidden="true" /></Primitive.CheckboxItemIndicator></span>{children}
  </Primitive.CheckboxItem>;
}
export function ContextMenuRadioItem({className,children,...props}:Styled<Primitive.RadioItem.Props>) {
  return <Primitive.RadioItem {...props} className={cn(itemClass,className)}>
    <span className="bui:flex bui:size-4 bui:shrink-0"><Primitive.RadioItemIndicator><Circle size={12} fill="currentColor" aria-hidden="true" /></Primitive.RadioItemIndicator></span>{children}
  </Primitive.RadioItem>;
}
export function ContextMenuSubTrigger({className,children,...props}:Styled<Primitive.SubmenuTrigger.Props>) {
  return <Primitive.SubmenuTrigger {...props} className={cn(itemClass,className)}>{children}<ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" className="bui:ml-auto" /></Primitive.SubmenuTrigger>;
}
export function ContextMenuSeparator({className,...props}:Styled<Primitive.Separator.Props>) {
  return <Primitive.Separator {...props} className={cn('bui:my-1 bui:h-px bui:border-0 bui:bg-border',className)} />;
}
export function ContextMenuLabel({className,...props}:Styled<Primitive.GroupLabel.Props>) {
  return <Primitive.GroupLabel {...props} className={cn('bui:px-3 bui:py-2 bui:text-xs bui:text-muted',className)} />;
}
