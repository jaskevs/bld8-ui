import type { LucideIcon } from 'lucide-react';

export interface TreeNode {
  /** Unique across the entire tree; keep stable while items are reordered. */
  id: string;
  label: string;
  /** undefined with hasChildren means children have not been loaded yet. */
  children?: readonly TreeNode[];
  hasChildren?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  description?: string;
}

export interface TreeIndexItem {
  node: TreeNode;
  parentId: string | null;
  level: number;
  position: number;
  siblingCount: number;
  branch: boolean;
  disabled: boolean;
}

export interface TreeIndex {
  items: readonly TreeIndexItem[];
  byId: ReadonlyMap<string, TreeIndexItem>;
  error: string | null;
}

/** A deterministic snapshot. Duplicate IDs and cyclic child references are rejected. */
export function createTreeIndex(nodes: readonly TreeNode[]): TreeIndex {
  const items: TreeIndexItem[] = [];
  const byId = new Map<string, TreeIndexItem>();
  const ancestors = new Set<TreeNode>();
  let error: string | null = null;
  function visit(siblings: readonly TreeNode[], parentId: string | null, level: number, inheritedDisabled: boolean) {
    for (let index = 0; index < siblings.length; index++) {
      const node = siblings[index];
      if (!node || typeof node.id !== 'string' || !node.id.trim() || typeof node.label !== 'string' || !node.label.trim()) {
        error = 'Tree items need a non-empty id and label.'; return;
      }
      if (ancestors.has(node) || byId.has(node.id)) { error = 'Tree item ids must be unique and children cannot contain cycles.'; return; }
      if (node.children !== undefined && !Array.isArray(node.children)) { error = 'Tree children must be an array.'; return; }
      const entry: TreeIndexItem = {node, parentId, level, position:index + 1, siblingCount:siblings.length,
        branch: node.children === undefined ? !!node.hasChildren : node.children.length > 0,
        disabled: inheritedDisabled || !!node.disabled};
      items.push(entry); byId.set(node.id, entry); ancestors.add(node);
      if (node.children) visit(node.children, node.id, level + 1, entry.disabled);
      ancestors.delete(node);
      if (error) return;
    }
  }
  if (!Array.isArray(nodes)) error = 'Tree nodes must be an array.';
  else visit(nodes, null, 1, false);
  return {items:error ? [] : items, byId:error ? new Map() : byId, error};
}

/** Pre-order visible rows, including disabled rows so ARIA positions stay truthful. */
export function getVisibleTreeItems(index: TreeIndex, expandedIds: readonly string[]): TreeIndexItem[] {
  const expanded = new Set(expandedIds), visible = new Set<string>();
  return index.items.filter(item => {
    const show = item.parentId === null || (visible.has(item.parentId) && expanded.has(item.parentId));
    if (show) visible.add(item.node.id);
    return show;
  });
}

/** Match names only; metadata does not make keyboard jumps unpredictable. */
export function findTreeTypeahead(items: readonly TreeIndexItem[], currentId: string | null, text: string, includeCurrent = false): string | null {
  const enabled = items.filter(item => !item.disabled);
  if (!enabled.length || !text) return null;
  const current = enabled.findIndex(item => item.node.id === currentId);
  const start = current < 0 ? 0 : current + (includeCurrent ? 0 : 1);
  for (let offset = 0; offset < enabled.length; offset++) {
    const item = enabled[(start + offset) % enabled.length];
    if (item.node.label.toLocaleLowerCase().startsWith(text.toLocaleLowerCase())) return item.node.id;
  }
  return null;
}
