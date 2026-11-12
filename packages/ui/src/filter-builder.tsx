/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useRef,type ReactElement} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'motion/react';
import {useReducedMotionPreference} from './motion-preference.js';
import {Plus,X} from 'lucide-react';
import {Button,Checkbox,Field,IconButton,Input} from './core.js';
import {Select} from './controls.js';
import {MultiSelect} from './multi-select.js';
import {filterOperators,isFilterGroup,countFilterRules,FILTER_QUERY_LIMITS,type FilterField,type FilterQuery,type FilterRule,type FilterOperator,type FilterGroup,type FilterNode,type AnyFilterQuery} from './filter-query.js';

export interface FilterBuilderProps {
  label?:string; fields:readonly FilterField[]; value:FilterQuery; onValueChange:(query:FilterQuery)=>void;
  disabled?:boolean; maxRules?:number; errors?:Record<string,string>;
  allowGroups?:false;
}
const easing=[.16,1,.3,1] as const;
function RuleRow({rule,index,fields,disabled,error,onChange,onRemove,inputRef}:{rule:FilterRule;index:number;fields:readonly FilterField[];disabled?:boolean;error?:string;onChange:(rule:FilterRule)=>void;onRemove:()=>void;inputRef:(node:HTMLButtonElement|null)=>void}) {
  const present=useIsPresent(),reduced=useReducedMotionPreference(),field=fields.find(field=>field.id===rule.field)??fields[0];
  const noValue=rule.operator==='empty'||rule.operator==='notEmpty';
  const updateValue=(value:string,index=0)=>{const values=rule.operator==='between'?[rule.values[0]??'',rule.values[1]??'']:[rule.values[0]??''];values[index]=value;onChange({...rule,values});};
  if(!field)return <fieldset className="bui-filter-rule"><legend>Filter {index+1}</legend><p role="alert">Configure a supported field first.</p><Button onClick={onRemove} disabled={disabled}>Remove filter</Button></fieldset>;
  return <motion.fieldset className="bui-filter-rule" layout="position" initial={{opacity:0,height:reduced?'auto':0,marginBottom:0}} animate={{opacity:1,height:'auto',marginBottom:12}} exit={{opacity:0,height:reduced?'auto':0,marginBottom:0}} transition={{duration:reduced?0:.24,ease:easing}} disabled={disabled||!present} inert={!present} aria-hidden={!present||undefined}>
    <legend className="bui-sr-only">Filter {index+1}</legend><div className="bui-filter-rule-grid">
      <Select label={'Filter '+(index+1)+' field'} value={rule.field} options={fields.map(({id,label})=>({value:id,label}))} inputRef={inputRef} onValueChange={id=>{const next=fields.find(field=>field.id===id);if(next)onChange({...rule,field:next.id,operator:filterOperators[next.kind][0].value,values:[]});}} />
      <Select label={'Filter '+(index+1)+' condition'} value={rule.operator} options={[...filterOperators[field.kind]]} onValueChange={value=>{if(value)onChange({...rule,operator:value as FilterOperator,values:value==='empty'||value==='notEmpty'?[]:field.kind==='select'?rule.values:value==='between'?[rule.values[0]??'',rule.values[1]??'']:rule.values.slice(0,1)});}} />
      <div className="bui-filter-values">{noValue?<p className="bui-filter-no-value">No value needed</p>:field.kind==='select'?<MultiSelect label={'Filter '+(index+1)+' values'} options={[...(field.options??[])]} value={rule.values} onValueChange={values=>onChange({...rule,values})} error={error}/>:<div className={'bui-filter-value-inputs'+(rule.operator==='between'?' bui-filter-value-inputs--range':'')}><Field label={'Filter '+(index+1)+(rule.operator==='between'?' from':' value')} error={error}><Input type={field.kind==='number'?'number':field.kind==='date'?'date':'text'} step={field.kind==='number'?'any':undefined} maxLength={field.kind==='text'?200:undefined} value={rule.values[0]??''} onChange={event=>updateValue(event.target.value)}/></Field>{rule.operator==='between'&&<Field label={'Filter '+(index+1)+' to'}><Input type={field.kind==='date'?'date':'number'} step={field.kind==='number'?'any':undefined} value={rule.values[1]??''} onChange={event=>updateValue(event.target.value,1)}/></Field>}</div>}</div>
      <IconButton className="bui-filter-remove" label={'Remove filter '+(index+1)} icon={X} variant="ghost" onClick={onRemove}/>
    </div>{error&&(noValue||!fields.some(field=>field.id===rule.field))&&<p className="bui-error" role="alert">{error}</p>}
  </motion.fieldset>;
}
function FlatFilterBuilder({label='Filters',fields,value,onValueChange,disabled=false,maxRules=12,errors={}}:FilterBuilderProps) {
  const add=useRef<HTMLButtonElement>(null),inputs=useRef(new Map<string,HTMLButtonElement>()),focus=useRef<string|null>(null);
  const limit=Number.isFinite(maxRules)?Math.min(20,Math.max(1,Math.floor(maxRules))):12;
  useEffect(()=>{if(focus.current){(inputs.current.get(focus.current)??add.current)?.focus();focus.current=null;}},[value.rules]);
  return <section className="bui-filter-builder" aria-label={label}><div className="bui-filter-builder-heading"><div><h3>{label}</h3><p className="bui-hint">Combine conditions, then apply them to the results.</p></div><Select label="Match conditions" value={value.match} options={[{value:'all',label:'Match all'},{value:'any',label:'Match any'}]} onValueChange={match=>{if(match==='all'||match==='any')onValueChange({...value,match});}} disabled={disabled}/></div>
    {errors.query&&<p className="bui-error" role="alert">{errors.query}</p>}
    <div className="bui-filter-rules"><AnimatePresence initial={false}>{value.rules.map((rule,index)=><RuleRow key={rule.id} rule={rule} index={index} fields={fields} disabled={disabled} error={errors[rule.id]} inputRef={node=>{if(node)inputs.current.set(rule.id,node);else inputs.current.delete(rule.id);}} onChange={next=>onValueChange({...value,rules:value.rules.map(item=>item.id===next.id?next:item)})} onRemove={()=>{focus.current=value.rules[index+1]?.id??value.rules[index-1]?.id??'add';onValueChange({...value,rules:value.rules.filter(item=>item.id!==rule.id)});}} />)}</AnimatePresence></div>
    {!value.rules.length&&<p className="bui-filter-empty">No conditions. All records can match.</p>}
    <div className="bui-filter-builder-footer"><Button ref={add} variant="secondary" leadingIcon={Plus} disabled={disabled||!fields.length||value.rules.length>=limit} onClick={()=>{const field=fields[0],id=crypto.randomUUID();focus.current=id;onValueChange({...value,rules:[...value.rules,{id,field:field.id,operator:filterOperators[field.kind][0].value,values:[]}]});}}>Add filter</Button><span className="bui-hint">{value.rules.length} of {limit} conditions</span></div>
  </section>;
}


export interface NestedFilterBuilderProps extends Omit<FilterBuilderProps,'value'|'onValueChange'|'allowGroups'> {
  /** Opt into bounded groups and accept both legacy and nested query envelopes. */
  allowGroups:true;
  value:AnyFilterQuery;
  onValueChange:(query:AnyFilterQuery)=>void;
}
interface GroupEditorProps {
  group:FilterGroup; depth:number; title:string; groupNumbers:Map<string,number>; ruleNumbers:Map<string,number>;
  fields:readonly FilterField[]; disabled:boolean; errors:Record<string,string>; total:number; limit:number; groups:number;
  inputRef:(id:string,node:HTMLButtonElement|null)=>void; addRef:(id:string,node:HTMLButtonElement|null)=>void;
  change:(id:string,next:FilterNode)=>void; remove:(parent:string,id:string)=>void; add:(parent:string,group:boolean)=>void;
  removeSelf?:()=>void; legacyEmpty?:boolean;
}
function GroupEditor(props:GroupEditorProps) {
  const {group,depth,title,groupNumbers,ruleNumbers,fields,disabled,errors,total,limit,groups,inputRef,addRef,change,remove,add,removeSelf}=props;
  const present=useIsPresent(),reduced=!!useReducedMotionPreference(),root=depth===0;
  const heading=<div className={root?'bui-filter-builder-heading':'bui-filter-group-heading'}>
    <div>{root?<><h3>{title}</h3><p className="bui-hint">Combine conditions, then apply them to the results.</p></>:<h4>Group {groupNumbers.get(group.id)}</h4>}</div>
    <Select label={root?'Match conditions':`Group ${groupNumbers.get(group.id)} match`} value={group.match} options={[{value:'all',label:'Match all'},{value:'any',label:'Match any'}]} onValueChange={match=>{if(match==='all'||match==='any')change(group.id,{...group,match});}} disabled={disabled} error={errors[group.id]}/>
    <Checkbox label={root?'Exclude matches':`Exclude group ${groupNumbers.get(group.id)}`} checked={!!group.not} disabled={disabled||(!group.children.length&&!group.not)} onChange={event=>change(group.id,{...group,not:event.target.checked})}/>
    {!root&&<IconButton label={`Remove group ${groupNumbers.get(group.id)}`} icon={X} variant="ghost" onClick={removeSelf} disabled={disabled}/>}
  </div>;
  const content=<>{heading}<div className="bui-filter-rules"><AnimatePresence initial={false}>{group.children.map(node=>isFilterGroup(node)?<GroupEditor key={node.id} {...props} group={node} depth={depth+1} title={`Group ${groupNumbers.get(node.id)}`} removeSelf={()=>remove(group.id,node.id)}/>:<RuleRow key={node.id} rule={node} index={ruleNumbers.get(node.id)??0} fields={fields} disabled={disabled} error={errors[node.id]} inputRef={element=>inputRef(node.id,element)} onChange={next=>change(node.id,next)} onRemove={()=>remove(group.id,node.id)}/>)}</AnimatePresence></div>
    {!group.children.length&&<p className="bui-filter-empty">{root?(group.match==='all'&&!group.not||props.legacyEmpty?'No conditions. All records can match.':'No conditions yet. Add one, or use Match all without exclusion.'):'Add a condition to this group.'}</p>}
    <div className={root?'bui-filter-builder-footer':'bui-filter-group-actions'}><div className="bui-filter-group-buttons">
      <Button ref={node=>addRef(group.id,node)} variant="secondary" size={root?'md':'sm'} leadingIcon={Plus} disabled={disabled||!fields.length||total>=limit} onClick={()=>add(group.id,false)}>{root?'Add filter':`Add filter to group ${groupNumbers.get(group.id)}`}</Button>
      <Button variant="ghost" size={root?'md':'sm'} leadingIcon={Plus} disabled={disabled||!fields.length||total>=limit||groups>=FILTER_QUERY_LIMITS.groups||depth>=FILTER_QUERY_LIMITS.depth} onClick={()=>add(group.id,true)}>{root?'Add group':`Add group to group ${groupNumbers.get(group.id)}`}</Button>
    </div>{root&&<span className="bui-hint">{total} of {limit} conditions</span>}</div></>;
  return root?<>{content}</>:<motion.fieldset className="bui-filter-group" layout="position" initial={{opacity:0,height:reduced?'auto':0,marginBottom:0}} animate={{opacity:1,height:'auto',marginBottom:12}} exit={{opacity:0,height:reduced?'auto':0,marginBottom:0}} transition={{duration:reduced?0:.24,ease:easing}} disabled={disabled||!present} inert={!present} aria-hidden={!present||undefined}>
    <legend className="bui-sr-only">Condition group {groupNumbers.get(group.id)}</legend>{content}
  </motion.fieldset>;
}
function NestedFilterBuilder({label='Filters',fields,value,onValueChange,disabled=false,maxRules=12,errors={}}:NestedFilterBuilderProps) {
  const identity=useId(),inputs=useRef(new Map<string,HTMLButtonElement>()),adds=useRef(new Map<string,HTMLButtonElement>()),focus=useRef<string|null>(null);
  const limit=Number.isFinite(maxRules)?Math.min(20,Math.max(1,Math.floor(maxRules))):12;
  const existingIds=new Set(value.version===1?value.rules.map(rule=>rule.id):[]);
  let rootId='group-'+identity.replace(/[^A-Za-z0-9_-]/g,'');while(existingIds.has(rootId))rootId+='x';
  const root:FilterGroup=value.version===1?{id:rootId,match:value.match,not:false,children:value.rules}:value.root;
  const ruleNumbers=new Map<string,number>(),groupNumbers=new Map<string,number>();let groupCount=0;
  function index(group:FilterGroup){groupCount++;for(const node of group.children){if(isFilterGroup(node)){groupNumbers.set(node.id,groupNumbers.size+1);index(node);}else ruleNumbers.set(node.id,ruleNumbers.size);}}
  index(root);const total=countFilterRules(value);
  useEffect(()=>{if(focus.current){const key=focus.current;focus.current=null;const target=key.startsWith('add:')?adds.current.get(key.slice(4)):inputs.current.get(key);(target??adds.current.get(root.id))?.focus({preventScroll:true});}},[value,root.id]);
  function commit(next:FilterGroup){
    if(value.version===1&&!next.not&&next.children.every(node=>!isFilterGroup(node)))onValueChange({version:1,match:next.match,rules:next.children as FilterRule[]});
    else onValueChange({version:2,root:next});
  }
  function map(group:FilterGroup,id:string,replace:(node:FilterNode)=>FilterNode):FilterGroup {
    if(group.id===id)return replace(group) as FilterGroup;
    return {...group,children:group.children.map(node=>node.id===id?replace(node):isFilterGroup(node)?map(node,id,replace):node)};
  }
  function change(id:string,next:FilterNode){commit(map(root,id,()=>next));}
  function firstRule(node:FilterNode|undefined):string|undefined {if(!node)return undefined;if(!isFilterGroup(node))return node.id;return node.children.map(firstRule).find(Boolean);}
  function remove(parent:string,id:string){const next=map(root,parent,node=>{const group=node as FilterGroup,index=group.children.findIndex(child=>child.id===id);focus.current=firstRule(group.children[index+1])??firstRule(group.children[index-1])??'add:'+parent;return {...group,children:group.children.filter(child=>child.id!==id)};});commit(!next.children.length?{...next,match:'all',not:false}:next);}
  function add(parent:string,group:boolean){if(disabled||!fields.length||total>=limit)return;const field=fields[0],id=crypto.randomUUID(),rule:FilterRule={id,field:field.id,operator:filterOperators[field.kind][0].value,values:[]};focus.current=id;
    commit(map(root,parent,node=>{const current=node as FilterGroup;return {...current,children:[...current.children,group?{id:crypto.randomUUID(),match:'all',not:false,children:[rule]}:rule]};}));
  }
  return <section className="bui-filter-builder bui-filter-nested" aria-label={label}>
    {errors.query&&<p className="bui-error" role="alert" tabIndex={-1} aria-invalid="true">{errors.query}</p>}
    <GroupEditor legacyEmpty={value.version===1} group={root} depth={0} title={label} groupNumbers={groupNumbers} ruleNumbers={ruleNumbers} fields={fields} disabled={disabled} errors={errors} total={total} limit={limit} groups={groupCount} inputRef={(id,node)=>{if(node)inputs.current.set(id,node);else inputs.current.delete(id);}} addRef={(id,node)=>{if(node)adds.current.set(id,node);else adds.current.delete(id);}} {...{change,remove,add}}/>
  </section>;
}
export function FilterBuilder(props:FilterBuilderProps|NestedFilterBuilderProps):ReactElement {
  return props.allowGroups?<NestedFilterBuilder {...props}/>:<FlatFilterBuilder {...props}/>;
}
