/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';

import {createContext, useContext, useLayoutEffect, useRef, type ComponentType, type ReactNode} from 'react';
import {GripVertical} from 'lucide-react';
import {IconButton} from './core.js';
import {useReducedMotionPreference} from './motion-preference.js';

export interface TableOrderContextProps {
  keys: string[];
  disabled: boolean;
  onMove: (key: string, target: string, after: boolean) => void;
  children: ReactNode;
  kind?: 'row' | 'column';
}
export interface OrderedTableRowProps {
  id: string;
  label: string;
  disabled: boolean;
  children: ReactNode;
  onChoose: (key: string, button: HTMLButtonElement) => void;
  selected?: boolean;
}
export interface TableColumnListProps {
  columns: {key: string; header: string}[];
  onMove: (key: string, target: string, after: boolean) => void;
  onChoose: (key: string, button: HTMLButtonElement) => void;
  children: (key: string) => ReactNode;
}
export interface TableOrderingAdapter {
  Context: ComponentType<TableOrderContextProps>;
  Row: ComponentType<OrderedTableRowProps>;
  ColumnsList: ComponentType<TableColumnListProps>;
  pointerSorting?: boolean;
}

/** Keyboard moves share the same restrained layout motion without a drag runtime. */
export function PlainTableOrderContext({keys, children}: TableOrderContextProps) {
  const reduced = !!useReducedMotionPreference(), root = useRef<HTMLDivElement>(null), rects = useRef(new Map<string, number>());
  const identity = JSON.stringify(keys);
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    root.current?.querySelectorAll<HTMLElement>('[data-order-key]').forEach(element => {
      element.getAnimations().forEach(animation => animation.cancel());
      const key = element.dataset.orderKey!, top = element.getBoundingClientRect().top - (root.current?.getBoundingClientRect().top ?? 0);
      next.set(key, top);
      const before = rects.current.get(key);
      if (!reduced && before !== undefined && Math.abs(before - top) > 1) element.animate(
        [{transform: `translateY(${before - top}px)`}, {transform: 'translateY(0)'}],
        {duration: 260, easing: 'cubic-bezier(.16,1,.3,1)'},
      );
    });
    rects.current = next;
  }, [identity, reduced]);
  return <div ref={root} className="bui-table-order-context">{children}</div>;
}

export function PlainOrderedTableRow({id, label, disabled, children, onChoose, selected}: OrderedTableRowProps) {
  return <tr data-order-key={id} data-row-key={id} data-selected={selected || undefined}>
    <td className="bui-table-reorder"><IconButton icon={GripVertical} label={'Move ' + label} variant="ghost" disabled={disabled} onClick={event => onChoose(id, event.currentTarget)}/></td>
    {children}
  </tr>;
}

export function PlainColumnList({columns, onMove, onChoose, children}: TableColumnListProps) {
  return <PlainTableOrderContext keys={columns.map(column => column.key)} disabled={columns.length < 2} onMove={onMove} kind="column">
    {columns.map(column => <div key={column.key} className="bui-column-order-item" data-order-key={column.key}>
      {children(column.key)}
      <IconButton icon={GripVertical} variant="ghost" label={'Move ' + column.header + ' column'} disabled={columns.length < 2} onClick={event => onChoose(column.key, event.currentTarget)}/>
    </div>)}
  </PlainTableOrderContext>;
}

export const defaultTableOrderingAdapter: TableOrderingAdapter = {
  Context: PlainTableOrderContext,
  Row: PlainOrderedTableRow,
  ColumnsList: PlainColumnList,
};
export const TableOrderingContext = createContext<TableOrderingAdapter>(defaultTableOrderingAdapter);

/** The table owns the position dialog so it can close the menu before opening a modal. */
export function TableColumnOrder({columns, onMove, children, onChoose}: TableColumnListProps) {
  const {ColumnsList, pointerSorting} = useContext(TableOrderingContext);
  return <>
    <p className="bui-hint bui-column-order-help">{pointerSorting ? 'Drag a handle, or select it to choose a position.' : 'Select a move action to choose a position.'}</p>
    <ColumnsList columns={columns} onMove={onMove} onChoose={onChoose}>{children}</ColumnsList>
  </>;
}
