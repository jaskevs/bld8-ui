/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export type FilterKind = 'text' | 'select' | 'number' | 'date';
export type FilterOperator = 'contains' | 'notContains' | 'equals' | 'notEquals' | 'anyOf' | 'noneOf' | 'gt' | 'gte' | 'lt' | 'lte' | 'before' | 'after' | 'between' | 'empty' | 'notEmpty';
export interface FilterField { id:string; label:string; kind:FilterKind; options?:readonly {value:string;label:string}[] }
export interface FilterRule { id:string; field:string; operator:FilterOperator; values:string[] }
export interface FilterQuery { version:1; match:'all'|'any'; rules:FilterRule[] }
/** A recursive group. Root depth is zero; at most three nested levels are accepted. */
export interface FilterGroup { id:string; match:'all'|'any'; not?:boolean; children:FilterNode[] }
export type FilterNode = FilterRule | FilterGroup;
export interface NestedFilterQuery { version:2; root:FilterGroup }
export type AnyFilterQuery = FilterQuery | NestedFilterQuery;
export const FILTER_QUERY_LIMITS={rules:20,groups:8,depth:3,serialized:16000} as const;
export type FilterValue = string | number | readonly string[] | null | undefined;
export const emptyFilterQuery = ():FilterQuery => ({version:1,match:'all',rules:[]});
export const filterOperators:Record<FilterKind,readonly {value:FilterOperator;label:string}[]> = {
  text:[{value:'contains',label:'Contains'},{value:'notContains',label:'Does not contain'},{value:'equals',label:'Is'},{value:'notEquals',label:'Is not'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  select:[{value:'anyOf',label:'Is any of'},{value:'noneOf',label:'Is none of'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  number:[{value:'equals',label:'Equals'},{value:'notEquals',label:'Does not equal'},{value:'gt',label:'Greater than'},{value:'gte',label:'At least'},{value:'lt',label:'Less than'},{value:'lte',label:'At most'},{value:'between',label:'Between'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  date:[{value:'equals',label:'On'},{value:'before',label:'Before'},{value:'after',label:'After'},{value:'between',label:'Between'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
};
function record(value:unknown):value is Record<string,unknown> {
  if(typeof value!=='object'||value===null||Array.isArray(value))return false;
  const prototype=Object.getPrototypeOf(value);return prototype===Object.prototype||prototype===null;
}
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const reservedIds=new Set(['__proto__','prototype','constructor']);
const validId=(value:unknown):value is string=>typeof value==='string'&&/^[\w-]{1,64}$/.test(value)&&!reservedIds.has(value);
export function isFilterGroup(node:FilterNode):node is FilterGroup {return own(node,'children');}
export function isFilterDate(value:string) {if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
const numberValue=(value:string)=>value.trim()!==''&&Number.isFinite(Number(value));

/** Structural, operator and value validation; incomplete drafts never reach an evaluator. */
export function validateFilterQuery(input:unknown,fields:readonly FilterField[]):Record<string,string> {
  const errors:Record<string,string>=Object.create(null),ids=new Set<string>(),seen=new Set<object>();
  let ruleCount=0,groupCount=0;
  const register=(node:Record<string,unknown>,key:string)=>{
    if(!validId(node.id)||ids.has(node.id)){errors.query='Each condition and group needs a unique supported identifier.';return false;}
    ids.add(node.id);return true;
  };
  const rule=(node:unknown,index:number)=>{
    const key=record(node)&&validId(node.id)?node.id:'rule-'+index;
    if(!record(node)||seen.has(node)){errors.query='Use distinct conditions without circular references.';return;}
    seen.add(node);if(!register(node,key))return;
    if(++ruleCount>FILTER_QUERY_LIMITS.rules){errors.query='Use up to 20 conditions.';return;}
    if(own(node,'children')){errors[key]='Use a condition or a group, not both.';return;}
    const field=fields.find(field=>field.id===node.field);
    if(!field||!own(filterOperators,field.kind)){errors[key]='Choose a supported field.';return;}
    if(!filterOperators[field.kind].some(option=>option.value===node.operator)){errors[key]='Choose a supported condition.';return;}
    if(!Array.isArray(node.values)||node.values.length>50||Array.from(node.values).some(value=>typeof value!=='string'||value.length>200)){errors[key]='Use supported values of up to 200 characters.';return;}
    const values=node.values as string[],operator=node.operator;
    if(operator==='empty'||operator==='notEmpty'){if(values.length)errors[key]='This condition does not need a value.';return;}
    if(field.kind==='select'){if(!values.length||new Set(values).size!==values.length||values.some(value=>!field.options?.some(option=>option.value===value)))errors[key]='Choose at least one supported value.';return;}
    if(values.length!==(operator==='between'?2:1)||values.some(value=>!value.trim())){errors[key]=operator==='between'?'Enter both ends of the range.':'Enter a value.';return;}
    if(field.kind==='number'&&values.some(value=>!numberValue(value))){errors[key]='Enter a finite number.';return;}
    if(field.kind==='date'&&values.some(value=>!isFilterDate(value))){errors[key]='Enter a valid date.';return;}
    if(operator==='between'&&(field.kind==='number'?Number(values[0])>Number(values[1]):values[0]>values[1]))errors[key]='The start must not be after the end.';
  };
  const group=(node:unknown,depth:number)=>{
    if(!record(node)||seen.has(node)){errors.query='Use distinct groups without circular references.';return;}
    seen.add(node);if(!register(node,'query'))return;
    const key=node.id as string;
    if(++groupCount>FILTER_QUERY_LIMITS.groups||depth>FILTER_QUERY_LIMITS.depth){errors[key]='Use up to 8 groups and 3 nested levels.';return;}
    if(node.match!=='all'&&node.match!=='any'||!Array.isArray(node.children)||node.children.length>FILTER_QUERY_LIMITS.rules+FILTER_QUERY_LIMITS.groups||node.not!==undefined&&typeof node.not!=='boolean'||own(node,'field')||own(node,'values')||own(node,'operator')){errors[key]='Use a supported condition group.';return;}
    if(!node.children.length&&(depth>0||node.match!=='all'||node.not)){errors[key]='Add a condition or remove this empty group.';return;}
    for(const [index,child]of node.children.entries()){
      if(record(child)&&own(child,'children'))group(child,depth+1);else rule(child,index);
    }
  };
  if(!record(input)){errors.query='Use a supported filter query.';return errors;}
  if(input.version===1){
    if(input.match!=='all'&&input.match!=='any'||!Array.isArray(input.rules)||input.rules.length>FILTER_QUERY_LIMITS.rules){errors.query='Use a version 1 query with up to 20 conditions.';return errors;}
    for(const [index,node]of input.rules.entries())rule(node,index);
  }else if(input.version===2)group(input.root,0);
  else errors.query='Use a supported filter query version.';
  if(!Object.keys(errors).length){const query=input as unknown as AnyFilterQuery;const value=query.version===1?{version:1,match:query.match,rules:query.rules.map(copyRule)}:{version:2,root:copyGroup(query.root)};if(JSON.stringify(value).length>FILTER_QUERY_LIMITS.serialized)errors.query='Use a smaller filter query.';}
  return errors;
}
function copyRule(rule:FilterRule):FilterRule{return {id:rule.id,field:rule.field,operator:rule.operator,values:[...rule.values]};}
function copyGroup(group:FilterGroup):FilterGroup{return {id:group.id,match:group.match,not:!!group.not,children:group.children.map(node=>isFilterGroup(node)?copyGroup(node):copyRule(node))};}
export function serializeFilterQuery(query:AnyFilterQuery,fields:readonly FilterField[]) {
  if(Object.keys(validateFilterQuery(query,fields)).length)throw new Error('Complete the filter conditions first.');
  const value=query.version===1?{version:1,match:query.match,rules:query.rules.map(copyRule)}:{version:2,root:copyGroup(query.root)};
  const text=JSON.stringify(value);if(text.length>FILTER_QUERY_LIMITS.serialized)throw new Error('The filter query is too large.');return text;
}
export function parseFilterQuery(text:string,fields:readonly FilterField[]):{query:FilterQuery|null;error?:string};
export function parseFilterQuery(text:string,fields:readonly FilterField[],options:{allowNested:true}):{query:AnyFilterQuery|null;error?:string};
export function parseFilterQuery(text:string,fields:readonly FilterField[],options?:{allowNested:true}):{query:AnyFilterQuery|null;error?:string} {
  try{if(text.length>FILTER_QUERY_LIMITS.serialized)throw new Error();const value:unknown=JSON.parse(text);if(!record(value)||value.version===2&&!options?.allowNested||Object.keys(validateFilterQuery(value,fields)).length)throw new Error();return {query:JSON.parse(serializeFilterQuery(value as unknown as AnyFilterQuery,fields))};}
  catch{return {query:null,error:'This filter configuration is invalid or no longer supported.'};}
}
/** Explicit v1 migration preserves its empty-any match-all behaviour. */
export function migrateFilterQuery(query:FilterQuery,fields:readonly FilterField[]):NestedFilterQuery {
  if(Object.keys(validateFilterQuery(query,fields)).length)throw new Error('Complete the filter conditions first.');
  let id='group-root',suffix=1;const ids=new Set(query.rules.map(rule=>rule.id));while(ids.has(id))id='group-root-'+suffix++;
  return {version:2,root:{id,match:query.rules.length?query.match:'all',not:false,children:query.rules.map(copyRule)}};
}
/** Counts a bounded draft without evaluating it; malformed/cyclic input is rejected. */
export function countFilterRules(query:AnyFilterQuery):number {
  if(query.version===1)return query.rules.length;
  let count=0,groups=0;const seen=new Set<object>();
  function visit(group:FilterGroup,depth:number){if(seen.has(group)||++groups>8||depth>3)throw new Error('Invalid filter group structure.');seen.add(group);for(const child of group.children){if(isFilterGroup(child))visit(child,depth+1);else if(++count>20)throw new Error('Too many filter conditions.');}}
  visit(query.root,0);return count;
}
export function filterQueryKey(query:AnyFilterQuery) {
  const ruleKey=({field,operator,values}:FilterRule)=>({field,operator,values:operator==='anyOf'||operator==='noneOf'?[...values].sort():[...values]});
  if(query.version===1)return JSON.stringify({match:query.match,rules:query.rules.map(ruleKey)});
  countFilterRules(query);
  const groupKey=(group:FilterGroup):unknown=>({match:group.match,not:!!group.not,children:group.children.map(node=>isFilterGroup(node)?groupKey(node):ruleKey(node))});
  return JSON.stringify({version:2,root:groupKey(query.root)});
}
/** Apply only allowlisted fields. This is not SQL or a server authorisation boundary. */
export function filterRecords<T>(rows:readonly T[],query:AnyFilterQuery,fields:readonly FilterField[],getValue:(row:T,field:string)=>FilterValue):T[] {
  if(Object.keys(validateFilterQuery(query,fields)).length)throw new Error('Invalid filter configuration.');
  const test=(row:T,rule:FilterRule)=>{
    const field=fields.find(field=>field.id===rule.field)!,raw=getValue(row,rule.field),empty=raw===null||raw===undefined||raw===''||(Array.isArray(raw)&&!raw.length);
    if(rule.operator==='empty')return empty;if(rule.operator==='notEmpty')return !empty;if(empty)return false;
    const values=rule.values;if(field.kind==='select'){const actual=Array.isArray(raw)?raw:[String(raw)];const found=actual.some(value=>values.includes(value));return rule.operator==='anyOf'?found:!found;}
    if(field.kind==='text'){const actual=String(raw).toLowerCase(),wanted=values[0].toLowerCase();return rule.operator==='contains'?actual.includes(wanted):rule.operator==='notContains'?!actual.includes(wanted):rule.operator==='equals'?actual===wanted:actual!==wanted;}
    if(field.kind==='number'&&(typeof raw!=='number'||!Number.isFinite(raw)))return false;
    if(field.kind==='date'&&(typeof raw!=='string'||!isFilterDate(raw)))return false;
    const actual=field.kind==='number'?Number(raw):String(raw),start=field.kind==='number'?Number(values[0]):values[0],end=field.kind==='number'?Number(values[1]):values[1];
    switch(rule.operator){case'equals':return actual===start;case'notEquals':return actual!==start;case'gt':case'after':return actual>start;case'gte':return actual>=start;case'lt':case'before':return actual<start;case'lte':return actual<=start;case'between':return actual>=start&&actual<=end;default:return false;}
  };
  if(query.version===1)return rows.filter(row=>!query.rules.length||(query.match==='all'?query.rules.every(rule=>test(row,rule)):query.rules.some(rule=>test(row,rule))));
  const groupMatches=(row:T,group:FilterGroup):boolean=>{
    const predicate=(node:FilterNode)=>isFilterGroup(node)?groupMatches(row,node):test(row,node);
    const matched=group.match==='all'?group.children.every(predicate):group.children.some(predicate);
    return group.not?!matched:matched;
  };
  return rows.filter(row=>groupMatches(row,query.root));
}
