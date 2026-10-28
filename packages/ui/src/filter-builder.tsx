'use client';
import {useEffect,useRef} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'motion/react';
import {useReducedMotionPreference} from './motion-preference.js';
import {Plus,X} from 'lucide-react';
import {Button,Field,IconButton,Input} from './core.js';
import {Select} from './controls.js';
import {MultiSelect} from './multi-select.js';
import {filterOperators,type FilterField,type FilterQuery,type FilterRule,type FilterOperator} from './filter-query.js';

export interface FilterBuilderProps {
  label?:string; fields:readonly FilterField[]; value:FilterQuery; onValueChange:(query:FilterQuery)=>void;
  disabled?:boolean; maxRules?:number; errors?:Record<string,string>;
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
export function FilterBuilder({label='Filters',fields,value,onValueChange,disabled=false,maxRules=12,errors={}}:FilterBuilderProps) {
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
