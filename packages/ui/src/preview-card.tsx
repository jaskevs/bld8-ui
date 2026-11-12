/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import { forwardRef, type CSSProperties, type ReactNode, type Ref } from 'react';
import { PreviewCard as Primitive } from '@base-ui/react/preview-card';
import { cx } from './core.js';

export type PreviewCardProps<Payload = unknown> = Primitive.Root.Props<Payload>;
/** Supplementary destination information. Keep essential content at the link destination; use Popover for actions. */
export function PreviewCard<Payload = unknown>(props: PreviewCardProps<Payload>) { return <Primitive.Root {...props} />; }
export interface PreviewCardTriggerProps<Payload = unknown> extends Omit<Primitive.Trigger.Props<Payload>, 'className'> { className?: string }
/** A real anchor. Mouse hover and keyboard focus follow Base UI timing; touch activates the destination. */
export function PreviewCardTrigger<Payload = unknown>({ className, ...props }: PreviewCardTriggerProps<Payload> & { ref?: Ref<HTMLElement> }) {
  return <Primitive.Trigger {...props} className={cx('bui-preview-link', className)} />;
}
export const createPreviewCardHandle = Primitive.createHandle;
export type PreviewCardHandle<Payload = unknown> = Primitive.Handle<Payload>;
export interface PreviewCardPopupProps extends Omit<Primitive.Positioner.Props, 'children' | 'className' | 'style' | 'ref'> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  width?: CSSProperties['width'];
  positionerClassName?: string;
  positionerRef?: Ref<HTMLDivElement>;
  portalContainer?: Primitive.Portal.Props['container'];
  popupProps?: Omit<Primitive.Popup.Props, 'children' | 'className' | 'style' | 'ref'>;
}
/** Visual preview only: no buttons, inputs or unique instructions. Popup content is hidden from assistive technology so the link keeps its reading context. */
export const PreviewCardPopup = forwardRef<HTMLDivElement, PreviewCardPopupProps>(function PreviewCardPopup({ children, className, style, width = 304, positionerClassName, positionerRef, portalContainer, popupProps, sideOffset = 8, collisionPadding = 12, align = 'start', ...positionerProps }, ref) {
  return <Primitive.Portal container={portalContainer}><Primitive.Positioner {...positionerProps} ref={positionerRef} align={align} sideOffset={sideOffset} collisionPadding={collisionPadding} className={cx('bui-preview-positioner', positionerClassName)}><Primitive.Popup {...popupProps} ref={ref} aria-hidden="true" className={cx('bui-preview-popup', className)} style={{ width, ...style }}><Primitive.Viewport className="bui-preview-viewport">{children}</Primitive.Viewport></Primitive.Popup></Primitive.Positioner></Primitive.Portal>;
});
