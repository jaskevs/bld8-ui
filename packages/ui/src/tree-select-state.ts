/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import type {LucideIcon} from 'lucide-react';

export interface TreeSelectNode {
  /** Stable and unique across the whole tree. Only leaf IDs are committed. */
  id:string;
  label:string;
  description?:string;
  icon?:LucideIcon;
  searchTerms?:readonly string[];
  disabled?:boolean;
  /** Undefined with hasChildren means this branch has not loaded yet. */
  children?:readonly TreeSelectNode[];
  hasChildren?:boolean;
}
export interface TreeSelectIndexItem {
  node:TreeSelectNode;parentId:string|null;level:number;position:number;siblingCount:number;branch:boolean;disabled:boolean;
}
export interface TreeSelectIndex {items:readonly TreeSelectIndexItem[];byId:ReadonlyMap<string,TreeSelectIndexItem>;error:string|null}
export interface TreeSelectBranchState {checked:boolean|'mixed';leafIds:readonly string[];incomplete:boolean}
export interface TreeSelectLoadRequest {id:string;node:TreeSelectNode;signal:AbortSignal}
export type TreeSelectChildrenLoader=(request:TreeSelectLoadRequest)=>Promise<readonly TreeSelectNode[]>;

/** A bounded snapshot. A declared empty branch never becomes a selectable leaf. */
export function createTreeSelectIndex(nodes:readonly TreeSelectNode[]):TreeSelectIndex {
  const items:TreeSelectIndexItem[]=[],byId=new Map<string,TreeSelectIndexItem>(),ancestors=new Set<TreeSelectNode>();let error:string|null=null;
  function visit(siblings:readonly TreeSelectNode[],parentId:string|null,level:number,inheritedDisabled:boolean){
    if(level>32){error='Tree choices support no more than 32 levels.';return;}
    for(let position=0;position<siblings.length;position++){
      const node=siblings[position];
      if(!node||typeof node.id!=='string'||!node.id.trim()||node.id.length>1000||typeof node.label!=='string'||!node.label.trim()||node.label.length>1000){error='Tree choices need a non-empty ID and label of at most 1,000 characters.';return;}
      if(ancestors.has(node)||byId.has(node.id)){error='Tree choice IDs must be unique and children cannot contain cycles.';return;}
      if(items.length>=5000){error='Tree choices support no more than 5,000 loaded items.';return;}
      if(node.children!==undefined&&!Array.isArray(node.children)){error='Tree choice children must be an array.';return;}
      if(node.description!==undefined&&typeof node.description!=='string'){error='Tree choice descriptions must be text.';return;}
      if(node.searchTerms!==undefined&&(!Array.isArray(node.searchTerms)||node.searchTerms.some(term=>typeof term!=='string'))){error='Tree choice search terms must be text.';return;}
      const item:TreeSelectIndexItem={node,parentId,level,position:position+1,siblingCount:siblings.length,branch:!!node.hasChildren||!!node.children?.length,disabled:inheritedDisabled||!!node.disabled};
      items.push(item);byId.set(node.id,item);ancestors.add(node);
      if(node.children?.length)visit(node.children,node.id,level+1,item.disabled);
      ancestors.delete(node);if(error)return;
    }
  }
  if(!Array.isArray(nodes))error='Tree choices must be an array.';else visit(nodes,null,1,false);
  return {items:error?[]:items,byId:error?new Map():byId,error};
}

/** Loaded children are local to the current source and never mutate caller data. */
export function mergeTreeSelectChildren(nodes:readonly TreeSelectNode[],loaded:ReadonlyMap<string,readonly TreeSelectNode[]>):readonly TreeSelectNode[]{
  const seen=new Set<TreeSelectNode>();
  function merge(siblings:readonly TreeSelectNode[],depth:number):readonly TreeSelectNode[]{
    if(depth>32||!Array.isArray(siblings))return siblings;
    return siblings.map(node=>{
      if(!node||seen.has(node))return node;
      seen.add(node);const children=node.children??(node.hasChildren?loaded.get(node.id):undefined);
      const result=children?{...node,children:merge(children,depth+1)}:node;seen.delete(node);return result;
    });
  }
  return merge(nodes,1);
}

/** Parent state excludes disabled descendants; incomplete branches cannot be checked-all. */
export function getTreeSelectStates(index:TreeSelectIndex,selected:ReadonlySet<string>):ReadonlyMap<string,TreeSelectBranchState>{
  const states=new Map<string,TreeSelectBranchState>(),children=new Map<string,TreeSelectIndexItem[]>();
  for(const item of index.items)if(item.parentId){let list=children.get(item.parentId);if(!list){list=[];children.set(item.parentId,list);}list.push(item);}
  for(let at=index.items.length-1;at>=0;at--){
    const item=index.items[at];let state:TreeSelectBranchState;
    if(item.disabled)state={checked:!item.branch&&selected.has(item.node.id),leafIds:[],incomplete:false};
    else if(!item.branch)state={checked:selected.has(item.node.id),leafIds:[item.node.id],incomplete:false};
    else{
      const descendants=(children.get(item.node.id)??[]).map(child=>states.get(child.node.id)!);
      const leafIds=descendants.flatMap(child=>[...child.leafIds]),incomplete=item.node.children===undefined||descendants.some(child=>child.incomplete);
      const count=leafIds.filter(value=>selected.has(value)).length;
      state={checked:count===0?false:!incomplete&&count===leafIds.length?true:'mixed',leafIds,incomplete};
    }
    states.set(item.node.id,state);
  }
  return states;
}

/** Searches loaded names, descriptions and aliases; matching branches retain loaded children. */
export function filterTreeSelectItems(index:TreeSelectIndex,query:string):ReadonlySet<string>|null {
  const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);if(!terms.length)return null;
  const matched=new Set<string>(),matchingBranches=new Set<string>();
  function ancestors(id:string){let current:string|null=id;while(current){matched.add(current);current=index.byId.get(current)?.parentId??null;}}
  for(const item of index.items){
    const text=[item.node.label,item.node.description,...(item.node.searchTerms??[])].filter(Boolean).join(' ').toLocaleLowerCase();
    if(!(item.parentId&&matchingBranches.has(item.parentId))&&!terms.every(term=>text.includes(term)))continue;
    ancestors(item.node.id);if(item.branch)matchingBranches.add(item.node.id);
  }
  return matched;
}
