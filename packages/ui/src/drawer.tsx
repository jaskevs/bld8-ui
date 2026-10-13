'use client';
// Adapted from shadcn/ui's Base UI composition. See SHADCN_LICENSE and docs/upstream.json.
import type { ReactElement, ReactNode, RefObject } from 'react';
import { Drawer as Primitive } from '@base-ui/react/drawer';
import { Button, Icon } from './core.js';
import { cn } from './utils.js';

export interface DrawerProps {
  trigger?: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'bottom' | 'left' | 'right';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFocus?: RefObject<HTMLElement | null>;
  finalFocus?: RefObject<HTMLElement | null>;
  className?: string;
}
/** A modal drawer with Base UI focus management and swipe dismissal. */
export function Drawer({trigger,title,description,children,side='bottom',initialFocus,finalFocus,className,...props}:DrawerProps) {
  return <Primitive.Root {...props} swipeDirection={side==='bottom' ? 'down' : side}>
    {trigger && <Primitive.Trigger render={trigger} />}
    <Primitive.Portal>
      <Primitive.Backdrop className="bui-drawer-backdrop bui:fixed bui:inset-0 bui:z-80" />
      <Primitive.Viewport className="bui-drawer-viewport bui:fixed bui:inset-0 bui:z-[81] bui:pointer-events-none">
        <Primitive.Popup initialFocus={initialFocus} finalFocus={finalFocus} data-side={side} className={cn('bui-drawer bui:pointer-events-auto bui:fixed bui:flex bui:flex-col bui:bg-background bui:text-foreground bui:font-body bui:shadow-panel',className)}>
          {side==='bottom' && <div className="bui-drawer-handle bui:mx-auto bui:my-3 bui:h-1 bui:w-10 bui:rounded-full bui:bg-border" aria-hidden="true" />}
          <div className="bui:flex bui:items-start bui:justify-between bui:gap-4 bui:p-6">
            <div><Primitive.Title className="bui:font-semibold bui:text-lg bui:m-0">{title}</Primitive.Title>{description && <Primitive.Description className="bui:mt-2 bui:mb-0 bui:text-sm bui:leading-relaxed bui:text-muted">{description}</Primitive.Description>}</div>
            <Primitive.Close render={<Button variant="ghost" className="bui-icon-button" aria-label="Close drawer"><Icon name="close" /></Button>} />
          </div>
          <Primitive.Content className="bui:min-h-0 bui:overflow-y-auto bui:overscroll-contain bui:px-6 bui:pb-6">{children}</Primitive.Content>
        </Primitive.Popup>
      </Primitive.Viewport>
    </Primitive.Portal>
  </Primitive.Root>;
}
export function DrawerClose({children='Done'}:{children?:ReactNode}) {
  return <Primitive.Close render={<Button>{children}</Button>} />;
}
