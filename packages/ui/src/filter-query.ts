export type FilterKind = 'text' | 'select' | 'number' | 'date';
export type FilterOperator = 'contains' | 'notContains' | 'equals' | 'notEquals' | 'anyOf' | 'noneOf' | 'gt' | 'gte' | 'lt' | 'lte' | 'before' | 'after' | 'between' | 'empty' | 'notEmpty';
export interface FilterField { id:string; label:string; kind:FilterKind; options?:readonly {value:string;label:string}[] }
export interface FilterRule { id:string; field:string; operator:FilterOperator; values:string[] }
export interface FilterQuery { version:1; match:'all'|'any'; rules:FilterRule[] }
export type FilterValue = string | number | readonly string[] | null | undefined;
export const emptyFilterQuery = ():FilterQuery => ({version:1,match:'all',rules:[]});
export const filterOperators:Record<FilterKind,readonly {value:FilterOperator;label:string}[]> = {
  text:[{value:'contains',label:'Contains'},{value:'notContains',label:'Does not contain'},{value:'equals',label:'Is'},{value:'notEquals',label:'Is not'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  select:[{value:'anyOf',label:'Is any of'},{value:'noneOf',label:'Is none of'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  number:[{value:'equals',label:'Equals'},{value:'notEquals',label:'Does not equal'},{value:'gt',label:'Greater than'},{value:'gte',label:'At least'},{value:'lt',label:'Less than'},{value:'lte',label:'At most'},{value:'between',label:'Between'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
  date:[{value:'equals',label:'On'},{value:'before',label:'Before'},{value:'after',label:'After'},{value:'between',label:'Between'},{value:'empty',label:'Is empty'},{value:'notEmpty',label:'Is not empty'}],
};
function record(value:unknown):value is Record<string,unknown> {return typeof value==='object'&&value!==null&&!Array.isArray(value);}
export function isFilterDate(value:string) {if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
const numberValue=(value:string)=>value.trim()!==''&&Number.isFinite(Number(value));

/** Structural, operator and value validation; incomplete drafts must not reach an evaluator. */
export function validateFilterQuery(input:unknown,fields:readonly FilterField[]):Record<string,string> {
  const errors:Record<string,string>=Object.create(null);
  if(!record(input)||input.version!==1||!['all','any'].includes(String(input.match))||!Array.isArray(input.rules)||input.rules.length>20){errors.query='Use a version 1 query with up to 20 conditions.';return errors;}
  const ids=new Set<string>();
  for(const [index,rule]of input.rules.entries()){
    const key=record(rule)&&typeof rule.id==='string'?rule.id:'rule-'+index;
    if(!record(rule)||typeof rule.id!=='string'||!/^[\w-]{1,64}$/.test(rule.id)||ids.has(rule.id)){errors.query='Each condition needs a unique identifier.';continue;}ids.add(rule.id);
    const field=fields.find(field=>field.id===rule.field);
    if(!field){errors[key]='Choose a supported field.';continue;}
    if(!filterOperators[field.kind].some(option=>option.value===rule.operator)){errors[key]='Choose a supported condition.';continue;}
    if(!Array.isArray(rule.values)||rule.values.length>50||Array.from(rule.values).some(value=>typeof value!=='string'||value.length>200)){errors[key]='Use supported values of up to 200 characters.';continue;}
    const values=rule.values as string[],operator=rule.operator;
    if(operator==='empty'||operator==='notEmpty'){if(values.length)errors[key]='This condition does not need a value.';continue;}
    if(field.kind==='select'){if(!values.length||new Set(values).size!==values.length||values.some(value=>!field.options?.some(option=>option.value===value)))errors[key]='Choose at least one supported value.';continue;}
    if(values.length!==(operator==='between'?2:1)||values.some(value=>!value.trim())){errors[key]=operator==='between'?'Enter both ends of the range.':'Enter a value.';continue;}
    if(field.kind==='number'&&values.some(value=>!numberValue(value))){errors[key]='Enter a finite number.';continue;}
    if(field.kind==='date'&&values.some(value=>!isFilterDate(value))){errors[key]='Enter a valid date.';continue;}
    if(operator==='between'&&(field.kind==='number'?Number(values[0])>Number(values[1]):values[0]>values[1]))errors[key]='The start must not be after the end.';
  }
  return errors;
}
export function serializeFilterQuery(query:FilterQuery,fields:readonly FilterField[]) {if(Object.keys(validateFilterQuery(query,fields)).length)throw new Error('Complete the filter conditions first.');return JSON.stringify({version:1,match:query.match,rules:query.rules.map(rule=>({id:rule.id,field:rule.field,operator:rule.operator,values:[...rule.values]}))});}
export function parseFilterQuery(text:string,fields:readonly FilterField[]):{query:FilterQuery|null;error?:string} {
  try{if(text.length>16000)throw new Error();const value:unknown=JSON.parse(text);if(Object.keys(validateFilterQuery(value,fields)).length)throw new Error();return {query:JSON.parse(serializeFilterQuery(value as FilterQuery,fields))};}
  catch{return {query:null,error:'This filter configuration is invalid or no longer supported.'};}
}
export function filterQueryKey(query:FilterQuery) {return JSON.stringify({match:query.match,rules:query.rules.map(({field,operator,values})=>({field,operator,values:operator==='anyOf'||operator==='noneOf'?[...values].sort():[...values]}))});}
/** Apply only allowlisted fields. This is not SQL or a server authorisation boundary. */
export function filterRecords<T>(rows:readonly T[],query:FilterQuery,fields:readonly FilterField[],getValue:(row:T,field:string)=>FilterValue):T[] {
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
  return rows.filter(row=>!query.rules.length||(query.match==='all'?query.rules.every(rule=>test(row,rule)):query.rules.some(rule=>test(row,rule))));
}
