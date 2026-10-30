'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, useAnimate, usePresence } from 'motion/react';
import { AlertCircle, ChevronRight, File, Folder, FolderOpen, LoaderCircle } from 'lucide-react';
import { Icon } from './icons.js';
import { useReducedMotionPreference } from './motion-preference.js';
import { useControllableValue } from './state.js';
import { createTreeIndex, findTreeTypeahead, getVisibleTreeItems, type TreeIndexItem, type TreeNode } from './tree-state.js';
import { cn } from './utils.js';

export type { TreeNode } from './tree-state.js';

export interface TreeProps {
  label: string;
  nodes: readonly TreeNode[];
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string) => void;
  /** Enter/double-click activation. Folder activation also toggles expansion. */
  onActivate?: (node: TreeNode) => void;
  loadingIds?: readonly string[];
  errors?: Readonly<Record<string, string>>;
  /** Host owns requests, cancellation and the updated children/loading/error props. */
  onLoadChildren?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

function TreeGroup({children, reduced, level}: {children:ReactNode; reduced:boolean; level:number}) {
  const [present, remove] = usePresence();
  const [scope, animate] = useAnimate<HTMLUListElement>();
  useEffect(() => {
    let active = true;
    const animation = animate(scope.current, {height:present ? 'auto' : 0, opacity:present ? 1 : 0}, {duration:reduced ? 0 : .24, ease:[.16,1,.3,1]});
    void animation.then(() => { if (active && !present) remove?.(); });
    return () => {active = false; animation.stop();};
  }, [present, reduced, animate, remove, scope]);
  return <ul ref={scope} role="group" className="bui-tree-group" aria-hidden={!present || undefined} inert={!present || undefined}
    style={{height:reduced ? 'auto' : 0, opacity:reduced ? 1 : 0, '--bui-tree-level':level} as CSSProperties}>{children}</ul>;
}

/** Single selection is explicit; moving focus never opens a file or changes selection. */
export function Tree({label, nodes, expandedIds, defaultExpandedIds=[], onExpandedChange, selectedId, defaultSelectedId=null,
  onSelectedChange, onActivate, loadingIds=[], errors={}, onLoadChildren, disabled=false, className}: TreeProps) {
  const reduced = useReducedMotionPreference();
  const [expanded, setExpanded] = useControllableValue<readonly string[]>(expandedIds, defaultExpandedIds, ids => onExpandedChange?.([...ids]));
  const [selected, setSelected] = useControllableValue<string | null>(selectedId, defaultSelectedId, id => {if (id !== null) onSelectedChange?.(id);});
  const index = useMemo(() => createTreeIndex(nodes), [nodes]);
  const visible = useMemo(() => getVisibleTreeItems(index, expanded), [index, expanded]);
  const enabled = visible.filter(item => !item.disabled && !disabled);
  const [focused, setFocused] = useState<string | null>(defaultSelectedId);
  const previousIndex = useRef(index);
  const previousVisible = useRef(visible);
  const root = useRef<HTMLUListElement>(null);
  const elements = useRef(new Map<string, HTMLLIElement>());
  const focusWithin = useRef(false);
  const typeahead = useRef({text:'', at:0});
  const id = useId();
  const expandedSet = new Set(expanded), loadingSet = new Set(loadingIds);
  const enabledIds = new Set(enabled.map(item => item.node.id));
  let activeId = focused && enabledIds.has(focused) ? focused : null;
  if (!activeId && focused) {
    let ancestor = index.byId.get(focused)?.parentId ?? previousIndex.current.byId.get(focused)?.parentId;
    while (ancestor) {
      if (enabledIds.has(ancestor)) {activeId = ancestor; break;}
      ancestor = index.byId.get(ancestor)?.parentId ?? previousIndex.current.byId.get(ancestor)?.parentId;
    }
    if (!activeId) {
      const oldPosition = previousVisible.current.findIndex(item => item.node.id === focused);
      activeId = enabled[Math.min(Math.max(oldPosition, 0), enabled.length - 1)]?.node.id ?? null;
    }
  }
  activeId ??= selected && enabledIds.has(selected) ? selected : enabled[0]?.node.id ?? null;

  useLayoutEffect(() => {
    if (activeId !== focused) {
      setFocused(activeId);
      if (focusWithin.current) {
        if (activeId) elements.current.get(activeId)?.focus({preventScroll:true});
        else if (!disabled) root.current?.focus({preventScroll:true});
      }
    }
    previousIndex.current = index;
    previousVisible.current = visible;
  }, [activeId, focused, disabled, index, visible]);
  useEffect(() => {
    const outsideFocus = (event: FocusEvent) => {if (!root.current?.contains(event.target as Node)) focusWithin.current = false;};
    document.addEventListener('focusin', outsideFocus);
    return () => document.removeEventListener('focusin', outsideFocus);
  }, []);

  function focusItem(next: string | null) {
    if (!next || !enabledIds.has(next)) return;
    setFocused(next); elements.current.get(next)?.focus();
  }
  function requestChildren(item: TreeIndexItem) {
    if (!disabled && !item.disabled && item.branch && item.node.children === undefined && !loadingSet.has(item.node.id)) onLoadChildren?.(item.node.id);
  }
  function toggle(item: TreeIndexItem) {
    if (!item.branch || item.disabled || disabled) return;
    if (expandedSet.has(item.node.id)) setExpanded(expanded.filter(key => key !== item.node.id));
    else {setExpanded([...expanded, item.node.id]); requestChildren(item);}
  }
  function select(item: TreeIndexItem) { if (!item.disabled && !disabled) setSelected(item.node.id); }
  function activate(item: TreeIndexItem) {
    if (item.disabled || disabled) return;
    select(item);
    if (item.branch) {
      if (expandedSet.has(item.node.id) && item.node.children === undefined && errors[item.node.id]) requestChildren(item);
      else toggle(item);
    }
    onActivate?.(item.node);
  }
  function keydown(event: KeyboardEvent<HTMLLIElement>, item: TreeIndexItem) {
    if (event.target !== event.currentTarget || disabled || item.disabled || event.altKey || event.metaKey || event.ctrlKey) return;
    const position = enabled.findIndex(entry => entry.node.id === item.node.id);
    const key = event.key;
    if (['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End','Enter',' '].includes(key)) {
      event.preventDefault(); event.stopPropagation(); typeahead.current.text='';
      if (key === 'ArrowDown') focusItem(enabled[Math.min(position + 1, enabled.length - 1)]?.node.id ?? null);
      if (key === 'ArrowUp') focusItem(enabled[Math.max(position - 1, 0)]?.node.id ?? null);
      if (key === 'Home') focusItem(enabled[0]?.node.id ?? null);
      if (key === 'End') focusItem(enabled.at(-1)?.node.id ?? null);
      if (key === 'ArrowRight' && item.branch) {
        if (!expandedSet.has(item.node.id)) toggle(item);
        else if (item.node.children === undefined) requestChildren(item);
        else focusItem(visible.find(entry => entry.parentId === item.node.id && !entry.disabled)?.node.id ?? null);
      }
      if (key === 'ArrowLeft') {
        if (item.branch && expandedSet.has(item.node.id)) toggle(item);
        else focusItem(item.parentId);
      }
      if (key === ' ') select(item);
      if (key === 'Enter') activate(item);
      return;
    }
    if (key.length === 1 && key.trim()) {
      event.preventDefault(); event.stopPropagation();
      const now = performance.now(), previous = now - typeahead.current.at < 600 ? typeahead.current.text : '';
      let text = previous + key;
      const repeated = [...text.toLocaleLowerCase()].every(character => character === key.toLocaleLowerCase());
      if (repeated) text = key;
      typeahead.current = {text, at:now};
      focusItem(findTreeTypeahead(visible, item.node.id, text, previous.length > 0 && !repeated));
    }
  }

  function renderNodes(siblings: readonly TreeNode[]) : ReactNode {
    return siblings.map(node => {
      const item = index.byId.get(node.id)!;
      const open = item.branch && expandedSet.has(node.id), loading = loadingSet.has(node.id), error = errors[node.id];
      const nodeId = `${id}-${index.items.indexOf(item)}`, descriptionId = nodeId + '-description', statusId = nodeId + '-status';
      const unavailable = disabled || item.disabled;
      const glyph = node.icon ?? (item.branch ? open ? FolderOpen : Folder : File);
      const status = loading ? 'Loading children.' : error ? 'Children could not be loaded. Press Right Arrow to retry.'
        : open && item.branch && node.children === undefined ? 'Children are not loaded. Press Right Arrow to load.' : '';
      return <li key={node.id} ref={element => {if (element) elements.current.set(node.id, element); else elements.current.delete(node.id);}}
        role="treeitem" tabIndex={!unavailable && activeId === node.id ? 0 : -1} aria-label={node.label}
        aria-level={item.level} aria-posinset={item.position} aria-setsize={item.siblingCount} aria-expanded={item.branch ? open : undefined}
        aria-selected={!unavailable ? selected === node.id : undefined} aria-disabled={unavailable || undefined} aria-busy={loading || undefined}
        aria-describedby={[node.description ? descriptionId : '', status ? statusId : ''].filter(Boolean).join(' ') || undefined}
        className="bui-tree-item" data-selected={!unavailable && selected === node.id || undefined} data-disabled={unavailable || undefined}
        data-loading={loading || undefined} data-expanded={open || undefined} style={{'--bui-tree-depth':item.level - 1} as CSSProperties}
        onFocus={event => {if (event.target === event.currentTarget && !unavailable) {focusWithin.current = true;setFocused(node.id);}}}
        onKeyDown={event => keydown(event, item)}>
        <div className="bui-tree-row" onClick={() => {if (unavailable) return; focusItem(node.id); select(item);}}
          onDoubleClick={event => {if ((event.target as HTMLElement).closest('[data-tree-disclosure]')) return; activate(item);}}>
          <span className="bui-tree-disclosure" aria-hidden="true" data-tree-disclosure="" data-branch={item.branch || undefined}
            onDoubleClick={event => event.stopPropagation()} onClick={event => {if (!item.branch) return;event.stopPropagation();if (!unavailable) {focusItem(node.id);toggle(item);}}}>
            {item.branch && <Icon icon={ChevronRight} size={14} />}
          </span>
          <span className="bui-tree-symbol" aria-hidden="true"><Icon icon={glyph} size={17} /></span>
          <span className="bui-tree-copy"><span className="bui-tree-label" title={node.label}>{node.label}</span>{node.description && <span className="bui-tree-description" id={descriptionId}>{node.description}</span>}</span>
          {loading ? <Icon icon={LoaderCircle} className="bui-tree-loading" size={15} /> : error ? <Icon icon={AlertCircle} className="bui-tree-error" size={15} /> : null}
          {status && <span id={statusId} className="bui-sr-only">{status}</span>}
        </div>
        <AnimatePresence initial={false}>{open && node.children && node.children.length > 0 && <TreeGroup key="children" reduced={reduced} level={item.level}>{renderNodes(node.children)}</TreeGroup>}</AnimatePresence>
      </li>;
    });
  }

  if (index.error) return <p role="alert" className="bui-error">{index.error}</p>;
  return <div className={cn('bui-tree-wrap',className)}>
    <ul ref={root} role="tree" aria-label={label} aria-disabled={disabled || undefined} tabIndex={!activeId && !disabled ? 0 : undefined}
      className="bui-tree" data-reduced-motion={reduced} onFocusCapture={() => {focusWithin.current = true;}}
      onBlurCapture={event => {if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) focusWithin.current = false;}}>
      {renderNodes(nodes)}
    </ul>
    {nodes.length === 0 && <p className="bui-tree-empty" role="status">No items.</p>}
  </div>;
}
