/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useMemo,useRef} from 'react';
import type {LucideIcon} from 'lucide-react';
import {Button,Icon} from './core.js';
import {TreeSelect,type TreeSelectNode,type TreeSelectProps} from './tree-select.js';
import {useChoiceValue} from './choice-option.js';

export interface FacetOption {
  value:string;label:string;group?:string;description?:string;icon?:LucideIcon;
  /** A supplied count is descriptive; zero never silently disables a choice. */
  count?:number;disabled?:boolean;searchTerms?:readonly string[];
}
export interface FacetedFilterProps extends Omit<TreeSelectProps,'nodes'|'loadChildren'|'sourceKey'|'expandedIds'|'defaultExpandedIds'|'onExpandedChange'|'value'|'defaultValue'|'onValueChange'|'formatValue'> {
  options:readonly FacetOption[];value?:readonly string[];defaultValue?:readonly string[];
  onValueChange?:(values:string[])=>void;
  /** Optional removable summary below the trigger. Hidden values remain selected. */
  showChips?:boolean;maxVisibleChips?:number;
}
/** Group actions include every supplied enabled option, even when search hides it. */
export function FacetedFilter({options,value,defaultValue=[],onValueChange,showChips=false,maxVisibleChips=3,...props}:FacetedFilterProps){
  const owner=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
  const [selected,setSelected]=useChoiceValue<readonly string[]>(value,defaultValue,values=>onValueChange?.([...values]),owner,props.form);
  const unique=[...new Set(selected)];
  const nodes=useMemo(()=>{
    const values=new Set(options.map(option=>option.value));let prefix='facet-group:';while(options.some(option=>option.value.startsWith(prefix)))prefix='_'+prefix;
    const roots:TreeSelectNode[]=[],groups=new Map<string,TreeSelectNode>();
    for(const option of options){
      const count=typeof option.count==='number'&&Number.isFinite(option.count)&&option.count>=0?String(option.count)+(option.count===1?' result':' results'):undefined;
      const node:TreeSelectNode={id:option.value,label:option.label,description:[option.description,count].filter(Boolean).join(' · ')||undefined,icon:option.icon,searchTerms:option.searchTerms,disabled:option.disabled};
      if(option.group){let group=groups.get(option.group);if(!group){let id=prefix+option.group;while(values.has(id))id+=':';group={id,label:option.group,description:'All supplied enabled choices',children:[]};groups.set(option.group,group);roots.push(group);}group.children=[...(group.children??[]),node];}else roots.push(node);
    }
    return roots;
  },[options]);
  const limit=Number.isFinite(maxVisibleChips)?Math.max(0,Math.min(10,Math.floor(maxVisibleChips))):3;
  const lookup=new Map(options.map(option=>[option.value,option]));
  return <div ref={owner} className="bui-faceted-filter">
    <TreeSelect {...props} inputRef={node=>{trigger.current=node;if(typeof props.inputRef==='function')props.inputRef(node);else if(props.inputRef)props.inputRef.current=node;}} defaultExpandedIds={nodes.filter(node=>node.children?.length).map(node=>node.id)} nodes={nodes} value={unique} onValueChange={values=>{if(!props.disabled&&!props.readOnly)setSelected(values);}} formatValue={labels=>labels.length===1?labels[0]:labels.length+' selected'}/>
    {showChips&&unique.length>0&&<div className="bui-facet-chips" aria-label={props.label+' selected values'}>{unique.slice(0,limit).map(value=><span className="bui-facet-chip" key={value}><span>{lookup.get(value)?.label??value}</span>{!props.readOnly&&<Button size="sm" variant="ghost" disabled={props.disabled||lookup.get(value)?.disabled} aria-label={'Remove '+(lookup.get(value)?.label??value)} onClick={()=>{setSelected(unique.filter(item=>item!==value));trigger.current?.focus({preventScroll:true});}}><Icon name="close" size={12}/></Button>}</span>)}{unique.length>limit&&<span className="bui-hint">+{unique.length-limit} more</span>}</div>}
  </div>;
}
