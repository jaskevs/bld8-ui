/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import { forwardRef, useId, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { NavigationMenu as Primitive } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';
import { cx } from './core.js';

export interface NavigationMenuProps extends Omit<Primitive.Root.Props<string>, 'className'> { className?: string }
/** Website links and flyouts. A string value opens its item; null closes the menu. */
export const NavigationMenu = forwardRef<HTMLElement, NavigationMenuProps>(function NavigationMenu({ className, orientation = 'horizontal', ...props }, ref) {
  return <Primitive.Root {...props} ref={ref} orientation={orientation} data-orientation={orientation} className={cx('bui-navigation-menu', className)} />;
});
export interface NavigationMenuListProps extends Omit<Primitive.List.Props, 'className'> { className?: string }
export const NavigationMenuList = forwardRef<HTMLUListElement, NavigationMenuListProps>(function NavigationMenuList({ className, ...props }, ref) {
  return <Primitive.List {...props} ref={ref} className={cx('bui-navigation-list', className)} />;
});
export interface NavigationMenuItemProps extends Omit<Primitive.Item.Props, 'className'> { className?: string }
export const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(function NavigationMenuItem({ className, ...props }, ref) {
  return <Primitive.Item {...props} ref={ref} className={cx('bui-navigation-item', className)} />;
});
export interface NavigationMenuTriggerProps extends Omit<Primitive.Trigger.Props, 'className'> { className?: string; /** Hide the default chevron when supplying your own. */ indicator?: boolean }
export const NavigationMenuTrigger = forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(function NavigationMenuTrigger({ className, children, indicator = true, ...props }, ref) {
  return <Primitive.Trigger {...props} ref={ref} className={cx('bui-navigation-trigger', className)}><span className="bui-navigation-trigger-label">{children}</span>{indicator && <Primitive.Icon className="bui-navigation-indicator"><ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" /></Primitive.Icon>}</Primitive.Trigger>;
});
export interface NavigationMenuContentProps extends Omit<Primitive.Content.Props, 'className'> { className?: string }
export const NavigationMenuContent = forwardRef<HTMLDivElement, NavigationMenuContentProps>(function NavigationMenuContent({ className, ...props }, ref) {
  return <Primitive.Content {...props} ref={ref} className={cx('bui-navigation-content', className)} />;
});
export interface NavigationMenuLinkProps extends Omit<Primitive.Link.Props, 'className'> {
  className?: string;
  description?: string;
  /** Removes the destination and takes the link out of keyboard navigation. */
  disabled?: boolean;
}
/** Supply render={<RouterLink ... />} for framework routing; href remains host-owned. */
export const NavigationMenuLink = forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(function NavigationMenuLink({ className, children, description, disabled = false, href, onClick, closeOnClick = true, ...props }, ref) {
  return <Primitive.Link {...props} ref={ref} href={disabled ? undefined : href} role={disabled ? 'link' : props.role} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : props.tabIndex} closeOnClick={!disabled && closeOnClick} className={cx('bui-navigation-link', className)} onClick={event => { if (disabled) { event.preventDefault(); return; } onClick?.(event); }}><span className="bui-navigation-link-title">{children}</span>{description && <span className="bui-navigation-link-description">{description}</span>}</Primitive.Link>;
});
export interface NavigationMenuGroupProps extends HTMLAttributes<HTMLDivElement> { label: string }
export function NavigationMenuGroup({ label, className, children, ...props }: NavigationMenuGroupProps) {
  const id = useId();
  return <div {...props} role="group" aria-labelledby={id} className={cx('bui-navigation-group', className)}><div id={id} className="bui-navigation-group-label">{label}</div>{children}</div>;
}
export interface NavigationMenuViewportProps extends Omit<Primitive.Viewport.Props, 'className'> { className?: string }
/** Use directly for an inline nested menu; NavigationMenuPopup already includes one. */
export const NavigationMenuViewport = forwardRef<HTMLDivElement, NavigationMenuViewportProps>(function NavigationMenuViewport({ className, ...props }, ref) {
  return <Primitive.Viewport {...props} ref={ref} className={cx('bui-navigation-viewport', className)} />;
});
export interface NavigationMenuPopupProps extends Omit<Primitive.Positioner.Props, 'children' | 'className' | 'style' | 'ref'> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  minWidth?: CSSProperties['minWidth'];
  positionerClassName?: string;
  positionerRef?: Ref<HTMLDivElement>;
  portalContainer?: Primitive.Portal.Props['container'];
  popupProps?: Omit<Primitive.Popup.Props, 'children' | 'className' | 'style' | 'ref'>;
}
/** One shared, collision-aware viewport resizes between flyouts and retains its size during exit. The forwarded ref points to the popup nav. */
export const NavigationMenuPopup = forwardRef<HTMLElement, NavigationMenuPopupProps>(function NavigationMenuPopup({ children, className, style, minWidth = 240, positionerClassName, positionerRef, portalContainer, popupProps, sideOffset = 8, collisionPadding = 12, ...positionerProps }, ref) {
  return <Primitive.Portal container={portalContainer}><Primitive.Positioner {...positionerProps} ref={positionerRef} sideOffset={sideOffset} collisionPadding={collisionPadding} className={cx('bui-navigation-positioner', positionerClassName)}><Primitive.Popup {...popupProps} ref={ref} className={cx('bui-navigation-popup', className)} style={{ ...style, '--bui-navigation-min-width': typeof minWidth === 'number' ? minWidth + 'px' : minWidth } as CSSProperties}><NavigationMenuViewport>{children}</NavigationMenuViewport></Primitive.Popup></Primitive.Positioner></Primitive.Portal>;
});
