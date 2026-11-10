'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,CalendarDays,Check,Hash,ListFilter,Search,SlidersHorizontal,Type,X} from 'lucide-react';
import {Button,Field,Icon,Input,MultiSelect,Popover,Reveal,Select,filterOperators,isFilterGroup,countFilterRules,emptyFilterQuery,validateFilterQuery,FILTER_QUERY_LIMITS,type AnyFilterQuery,type FilterField,type FilterRule,type FilterOperator} from '@bld8/ui';

interface Props {fields:readonly FilterField[];value:AnyFilterQuery;onValueChange:(value:AnyFilterQuery)=>void;onAdvanced:()=>void;advancedOpen:boolean;advancedId:string;disabled:boolean;blocked:boolean}
const fieldIcon=(field:FilterField)=>field.kind==='number'?Hash:field.kind==='date'?CalendarDays:field.kind==='select'?ListFilter:Type;
const directRules=(query:AnyFilterQuery):FilterRule[]=>query.version===1?query.rules:query.root.children.filter((node):node is FilterRule=>!isFilterGroup(node));
function replaceRule(query:AnyFilterQuery,rule:FilterRule,remove=false):AnyFilterQuery {
  const update=(rules:FilterRule[])=>remove?rules.filter(item=>item.id!==rule.id):rules.some(item=>item.id===rule.id)?rules.map(item=>item.id===rule.id?rule:item):[...rules,rule];
  if(query.version===1){const rules=update(query.rules);return rules.length?{...query,rules}:emptyFilterQuery();}
  const children=query.root.children;
  const next=remove?children.filter(item=>item.id!==rule.id):children.some(item=>item.id===rule.id)?children.map(item=>item.id===rule.id?rule:item):[...children,rule];
  return next.length?{...query,root:{...query.root,children:next}}:emptyFilterQuery();
}
function summary(rule:FilterRule,field:FilterField){
  const condition=filterOperators[field.kind].find(item=>item.value===rule.operator)?.label??rule.operator;
  const values=rule.values.map(value=>field.options?.find(item=>item.value===value)?.label??value);
  return {condition:condition.toLowerCase(),value:values.length>2?values.slice(0,2).join(', ')+' +'+(values.length-2):values.join(rule.operator==='between'?' – ':', ')};
}
function RuleEditor({rule,field,onApply,onCancel,disabled}:{rule:FilterRule;field:FilterField;onApply:(rule:FilterRule)=>void;onCancel:()=>void;disabled:boolean}) {
  const [draft,setDraft]=useState<FilterRule>(()=>({...rule,values:[...rule.values]})),[error,setError]=useState('');
  const condition=useRef<HTMLButtonElement>(null),valueInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{condition.current?.focus({preventScroll:true});},[]);
  const noValue=draft.operator==='empty'||draft.operator==='notEmpty';
  const changeValues=(value:string,index=0)=>{const values=draft.operator==='between'?[draft.values[0]??'',draft.values[1]??'']:[draft.values[0]??''];values[index]=value;setDraft({...draft,values});setError('');};
  function apply(){const invalid=validateFilterQuery({version:1,match:'all',rules:[draft]},[field]);if(Object.keys(invalid).length){setError(Object.values(invalid)[0]);valueInput.current?.focus();return;}onApply(draft);}
  return <form className="bblocks-filter-editor" onSubmit={event=>{event.preventDefault();apply();}}>
    <div className="bblocks-filter-editor-heading"><Icon icon={fieldIcon(field)} size={16}/><strong>{field.label}</strong></div>
    <Select inputRef={condition} density="compact" label="Condition" value={draft.operator} options={[...filterOperators[field.kind]]} disabled={disabled} onValueChange={operator=>{if(operator){setDraft({...draft,operator:operator as FilterOperator,values:[]});setError('');}}}/>
    {!noValue&&(field.kind==='select'?<MultiSelect inputRef={valueInput} label="Values" options={[...(field.options??[])]} value={draft.values} disabled={disabled} onValueChange={values=>{setDraft({...draft,values});setError('');}}/>:<div className="bblocks-filter-value-inputs">{Array.from({length:draft.operator==='between'?2:1},(_,index)=><Field key={index} label={draft.operator==='between'?(index?'To':'From'):'Value'} error={index===0&&error?error:undefined}><Input ref={index===0?valueInput:undefined} density="compact" type={field.kind==='date'?'date':'text'} inputMode={field.kind==='number'?'decimal':undefined} maxLength={200} value={draft.values[index]??''} disabled={disabled} onChange={event=>changeValues(event.target.value,index)}/></Field>)}</div>)}
    {error&&field.kind==='select'&&<p className="bui-error" role="alert">{error}</p>}
    <div className="bblocks-filter-editor-actions"><Button size="sm" variant="ghost" onClick={onCancel} disabled={disabled}>Cancel</Button><Button size="sm" type="submit" leadingIcon={Check} disabled={disabled}>Apply filter</Button></div>
  </form>;
}

/** A quick view of root conditions. Grouped queries retain their original tree. */
export function DataWorkspaceFilters({fields,value,onValueChange,onAdvanced,advancedOpen,advancedId,disabled:hostDisabled,blocked}:Props) {
  const [open,setOpen]=useState<string|null>(null),[search,setSearch]=useState(''),[newRule,setNewRule]=useState<FilterRule|null>(null);
  const add=useRef<HTMLButtonElement>(null),picker=useRef<HTMLDivElement>(null);
  const rules=directRules(value),count=countFilterRules(value),groups=value.version===2?value.root.children.filter(isFilterGroup).length:0;
  const match=value.version===1?value.match:value.root.match;
  const disabled=hostDisabled||blocked;
  function changed(next:AnyFilterQuery){onValueChange(next);setOpen(null);setNewRule(null);setSearch('');}
  const filtered=fields.filter(field=>field.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  function focusField(delta:number){const buttons=Array.from(picker.current?.querySelectorAll<HTMLButtonElement>('[data-filter-field]')??[]);const index=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[Math.max(0,Math.min(buttons.length-1,index+delta))]?.focus();}
  return <div className="bblocks-quick-filters" aria-label="Workspace quick filters">
    <div className="bblocks-quick-filter-actions"><Popover title={newRule?'Configure filter':'Filter by'} open={open==='add'} onOpenChange={next=>{setOpen(next?'add':null);if(next){setNewRule(null);setSearch('');}}} trigger={<Button ref={add} size="sm" variant="secondary" leadingIcon={ListFilter} disabled={disabled||count>=FILTER_QUERY_LIMITS.rules}>Add filter</Button>}>
      {newRule?<><Button size="sm" variant="ghost" leadingIcon={ArrowLeft} onClick={()=>setNewRule(null)}>Fields</Button><RuleEditor key={newRule.id} rule={newRule} field={fields.find(field=>field.id===newRule.field)!} disabled={disabled} onApply={rule=>changed(replaceRule(value,rule))} onCancel={()=>setOpen(null)}/></>:<div className="bblocks-filter-field-picker" ref={picker}>
        <div className="bblocks-filter-search"><Icon icon={Search} size={15}/><Input aria-label="Find a filter field" placeholder="Find a field…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();focusField(1);}}}/></div>
        <div className="bblocks-filter-fields" onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();focusField(event.key==='ArrowDown'?1:-1);}if(event.key==='Home'){event.preventDefault();picker.current?.querySelector<HTMLButtonElement>('[data-filter-field]')?.focus();}if(event.key==='End'){event.preventDefault();picker.current?.querySelectorAll<HTMLButtonElement>('[data-filter-field]').item(filtered.length-1)?.focus();}}}>{filtered.map(field=><button type="button" key={field.id} data-filter-field={field.id} onClick={()=>{const existing=rules.find(rule=>rule.field===field.id);setNewRule(existing??{id:crypto.randomUUID(),field:field.id,operator:filterOperators[field.kind][0].value,values:[]});}}><Icon icon={fieldIcon(field)} size={16}/><span>{field.label}</span>{rules.some(rule=>rule.field===field.id)&&<span className="bblocks-filter-applied">Applied</span>}</button>)}</div>
        {!filtered.length&&<p className="bui-hint">No matching fields. Try another search.</p>}
      </div>}
    </Popover><Button size="sm" variant="ghost" leadingIcon={SlidersHorizontal} aria-expanded={advancedOpen} aria-controls={advancedId} onClick={onAdvanced} disabled={hostDisabled}>Advanced</Button>{count>0&&<Button size="sm" variant="ghost" leadingIcon={X} onClick={()=>changed(emptyFilterQuery())} disabled={disabled}>Clear filters</Button>}</div>
    {blocked&&<p className="bui-hint">Apply or clear the advanced changes before editing quick filters.</p>}
    <Reveal open={count>0}><div className="bblocks-filter-chips">
      {count>1&&<Select label="Match conditions" labelVisibility="hidden" density="compact" value={match} options={[{value:'all',label:'Match all'},{value:'any',label:'Match any'}]} disabled={disabled} onValueChange={next=>{if(next==='all'||next==='any')changed(value.version===1?{...value,match:next}:{...value,root:{...value.root,match:next}});}}/>}
      {value.version===2&&value.root.not&&<span className="bblocks-filter-logic">Exclude matches</span>}
      {rules.map(rule=>{const field=fields.find(field=>field.id===rule.field);if(!field)return null;const text=summary(rule,field);return <div className="bblocks-filter-chip" key={rule.id}><Popover title={'Edit '+field.label+' filter'} open={open===rule.id} onOpenChange={next=>setOpen(next?rule.id:null)} trigger={<button type="button" className="bblocks-filter-chip-edit" aria-label={'Edit '+field.label+' filter'} disabled={disabled}><Icon icon={fieldIcon(field)} size={14}/><strong>{field.label}</strong><span>{text.condition}</span>{text.value&&<span className="bblocks-filter-chip-value" title={text.value}>{text.value}</span>}</button>}><RuleEditor key={rule.id} rule={rule} field={field} disabled={disabled} onApply={next=>changed(replaceRule(value,next))} onCancel={()=>setOpen(null)}/></Popover><button type="button" className="bblocks-filter-chip-remove" aria-label={'Remove '+field.label+' filter'} disabled={disabled} onClick={()=>{changed(replaceRule(value,rule,true));add.current?.focus();}}><Icon icon={X} size={12}/></button></div>;})}
      {groups>0&&<Button size="sm" variant="secondary" onClick={onAdvanced} disabled={disabled}>{groups} {groups===1?'group':'groups'} · edit conditions</Button>}
    </div></Reveal>
  </div>;
}
