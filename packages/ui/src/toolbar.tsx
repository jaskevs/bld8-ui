/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {Toolbar as PrimitiveToolbar} from '@base-ui/react/toolbar';

function classes<State>(base:string,value?:string|((state:State)=>string|undefined)) {
  return (state:State)=>[base,typeof value==='function'?value(state):value].filter(Boolean).join(' ');
}
export interface ToolbarProps extends Omit<PrimitiveToolbar.Root.Props,'aria-label'> {
  /** Accessible name for this set of related actions. */
  label:string;
}
/** One roving tab stop across buttons, links, ToggleGroup choices and menu triggers.
 * Use ToolbarButton's render prop to compose a Button or IconButton. Links remain
 * navigable when the toolbar is disabled, following the upstream link contract.
 */
export function Toolbar({label,className,...props}:ToolbarProps) {
  return <PrimitiveToolbar.Root {...props} aria-label={label} className={classes('bui-toolbar',className)}/>;
}
export interface ToolbarGroupProps extends PrimitiveToolbar.Group.Props {}
export function ToolbarGroup({className,...props}:ToolbarGroupProps) {
  return <PrimitiveToolbar.Group {...props} className={classes('bui-toolbar-group',className)}/>;
}
export interface ToolbarButtonProps extends PrimitiveToolbar.Button.Props {}
/** Disabled items remain discoverable by default. Set focusableWhenDisabled=false
 * to skip them, including when rendering a natively disabled BLD8 Button.
 */
export function ToolbarButton({className,type='button',...props}:ToolbarButtonProps) {
  return <PrimitiveToolbar.Button {...props} type={type} className={classes('bui-toolbar-button',className)}/>;
}
export interface ToolbarLinkProps extends PrimitiveToolbar.Link.Props {}
export function ToolbarLink({className,...props}:ToolbarLinkProps) {
  return <PrimitiveToolbar.Link {...props} className={classes('bui-toolbar-link',className)}/>;
}
export interface ToolbarInputProps extends PrimitiveToolbar.Input.Props {}
export function ToolbarInput({className,...props}:ToolbarInputProps) {
  return <PrimitiveToolbar.Input {...props} className={classes('bui-toolbar-input',className)}/>;
}
export interface ToolbarSeparatorProps extends PrimitiveToolbar.Separator.Props {}
export function ToolbarSeparator({className,...props}:ToolbarSeparatorProps) {
  return <PrimitiveToolbar.Separator {...props} className={classes('bui-toolbar-separator',className)}/>;
}
