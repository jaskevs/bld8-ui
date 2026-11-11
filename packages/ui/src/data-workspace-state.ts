import {parseFilterQuery, type AnyFilterQuery, type FilterField, isFilterDate} from './filter-query.js';

/** Stable identity and monotonically increasing service revision. */
export interface DataRecord { id:string; revision:number }
export interface DataSort { key:string; descending:boolean }
export interface DataColumn<T extends DataRecord> {
  key:Extract<keyof T,string>;
  label:string;
  type:'text'|'number'|'date'|'select';
  /** Editing is opt-in. Identity and revision fields always remain read-only. */
  editable?:boolean;
  options?:readonly {value:string;label:string}[];
  /** Search within select choices. Defaults to true for more than seven options. */
  searchable?:boolean;
  required?:boolean;
  min?:number;
  max?:number;
  minLength?:number;
  maxLength?:number;
  /** Optional presentation constraints shared with portable table views. */
  width?:number;
  minWidth?:number;
  hideable?:boolean;
  pinned?:'start'|'end';
  resizable?:boolean;
  sortable?:boolean;
}
export interface DataEdit<T extends DataRecord> { id:string; key:Extract<keyof T,string>; value:unknown }
export interface DataCellError { id:string; key:string; message:string }
export interface DataQuery { search:string; filters:AnyFilterQuery; sorts:DataSort[]; page:number; pageSize:number }
export interface DataChange<T extends DataRecord> { id:string; expectedRevision:number; values:Partial<Omit<T,'id'|'revision'>> }
export interface DataBatchRequest<T extends DataRecord> { requestId:string; changes:DataChange<T>[] }
export type BatchResult<T extends DataRecord> = {ok:true;rows:T[]} | {ok:false;code:'conflict'|'validation';conflicts?:T[];errors?:DataCellError[]};
export interface DataSource<T extends DataRecord> {
  load:(query:DataQuery,context:{signal:AbortSignal})=>Promise<{rows:T[];total:number}>;
  save:(request:DataBatchRequest<T>,context:{signal:AbortSignal})=>Promise<BatchResult<T>>;
}
export const DATA_WORKSPACE_LIMITS={rows:100,columns:30,sorts:5,clipboardCells:2000,clipboardBytes:100000,history:50,queryBytes:24000} as const;
const reserved=new Set(['__proto__','prototype','constructor']);
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
export const isDataId=(input:unknown):input is string=>typeof input==='string'&&/^[a-zA-Z0-9][\w-]{0,79}$/.test(input)&&!reserved.has(input);
export function isDataObject(input:unknown):input is Record<string,unknown> {if(!input||typeof input!=='object'||Array.isArray(input))return false;const proto=Object.getPrototypeOf(input);return proto===Object.prototype||proto===null;}

/** Clipboard and editor strings use canonical decimal numbers and YYYY-MM-DD dates. */
export function parseDataValue<T extends DataRecord>(column:DataColumn<T>,input:unknown):{value:unknown;error?:string} {
  const invalid=(message:string)=>({value:input,error:message});
  if(column.key==='id'||column.key==='revision'||column.editable!==true)return invalid('This field is read-only.');
  if(column.type==='number'){
    if(typeof input!=='number'&&typeof input!=='string')return invalid('Enter a finite decimal number.');
    if(typeof input==='string'&&!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input.trim()))return invalid('Enter a decimal number without separators.');
    const value=typeof input==='number'?input:Number(input.trim());
    if(!Number.isFinite(value))return invalid('Enter a finite decimal number.');
    if(column.min!==undefined&&value<column.min)return invalid('Use '+column.min+' or more.');
    if(column.max!==undefined&&value>column.max)return invalid('Use '+column.max+' or less.');
    return {value};
  }
  if(typeof input!=='string')return invalid('Enter a text value.');
  if(input.length>(column.maxLength??1000))return invalid('Use up to '+(column.maxLength??1000)+' characters.');
  if(column.required&&!input.trim())return invalid('Enter '+column.label.toLowerCase()+'.');
  if(column.minLength!==undefined&&input.trim().length<column.minLength)return invalid('Use at least '+column.minLength+' characters.');
  if(column.type==='date'&&input&&!isFilterDate(input))return invalid('Use a valid YYYY-MM-DD date.');
  if(column.type==='select'&&!column.options?.some(option=>option.value===input))return invalid('Choose a supported '+column.label.toLowerCase()+'.');
  return {value:input};
}

/** Check every field before saving; the data source must also check revisions atomically. */
export function validateDataChanges<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],changes:readonly DataChange<T>[]):DataCellError[] {
  const errors:DataCellError[]=[],ids=new Set<string>();
  if(!Array.isArray(changes)||!changes.length||changes.length>DATA_WORKSPACE_LIMITS.rows)return [{id:'',key:'',message:'Change between 1 and 100 distinct records.'}];
  for(const change of Array.from(changes)){
    if(!isDataObject(change)||!isDataId(change.id)||ids.has(change.id)||!Number.isSafeInteger(change.expectedRevision)||Number(change.expectedRevision)<1||!isDataObject(change.values)){
      errors.push({id:isDataObject(change)&&typeof change.id==='string'?change.id:'',key:'',message:'Use distinct record IDs, positive revisions and supported changes.'});continue;
    }
    ids.add(change.id);
    if(!rows.some(row=>row.id===change.id)){errors.push({id:change.id,key:'',message:'This record is no longer available.'});continue;}
    const keys=Object.keys(change.values);
    if(!keys.length||keys.length>DATA_WORKSPACE_LIMITS.columns){errors.push({id:change.id,key:'',message:'Change at least one supported field.'});continue;}
    for(const key of keys){const column=columns.find(column=>column.key===key);if(!column||reserved.has(key)||!own(change.values,key)){errors.push({id:change.id,key,message:'This field cannot be edited.'});continue;}const parsed=parseDataValue(column,change.values[key]);if(parsed.error)errors.push({id:change.id,key,message:parsed.error});else if(!Object.is(parsed.value,change.values[key]))errors.push({id:change.id,key,message:'Convert this value to its canonical field type before saving.'});}
  }
  return errors;
}

/** Bounded reusable query parser. No field names or operators are interpolated into SQL. */
export function parseDataQuery<T extends DataRecord>(input:unknown,columns:readonly DataColumn<T>[],fields:readonly FilterField[]):DataQuery|null {
  if(!isDataObject(input)||typeof input.search!=='string'||input.search.length>200||!Number.isSafeInteger(input.page)||Number(input.page)<1||Number(input.page)>100000||![5,10,20,50,100].includes(Number(input.pageSize))||!Array.isArray(input.sorts)||input.sorts.length>DATA_WORKSPACE_LIMITS.sorts)return null;
  if(typeof input.pageSize!=='number')return null;
  const keys=new Set<string>(),sorts:DataSort[]=[];
  for(const sort of Array.from(input.sorts)){if(!isDataObject(sort)||typeof sort.key!=='string'||!columns.some(column=>column.key===sort.key)||keys.has(sort.key)||typeof sort.descending!=='boolean')return null;keys.add(sort.key);sorts.push({key:sort.key,descending:sort.descending});}
  try{const text=JSON.stringify(input);if(text.length>DATA_WORKSPACE_LIMITS.queryBytes)return null;const filters=parseFilterQuery(JSON.stringify(input.filters),fields,{allowNested:true}).query;if(!filters)return null;return {search:input.search,filters,sorts,page:Number(input.page),pageSize:Number(input.pageSize)};}catch{return null;}
}

/** A range is exported as plain TSV; quoted tabs, newlines and quotes round-trip. */
export function stringifyDataTsv(values:readonly (readonly unknown[])[]):string {return values.map(row=>row.map(value=>{const text=value==null?'':String(value);return /[\t\r\n"]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;}).join('\t')).join('\n');}
export function parseDataTsv(text:string):string[][] {
  if(typeof text!=='string')throw new Error('Paste a text range.');
  if(new TextEncoder().encode(text).byteLength>DATA_WORKSPACE_LIMITS.clipboardBytes)throw new Error('Paste up to 100 KB at a time.');
  const rows:string[][]=[[]];let value='',quoted=false,closed=false,cells=0;
  const push=()=>{if(++cells>DATA_WORKSPACE_LIMITS.clipboardCells)throw new Error('Paste up to 2,000 cells at a time.');rows[rows.length-1].push(value);value='';closed=false;};
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}if(c==='"'){if(value||closed)throw new Error('Use a rectangular tab-separated range.');quoted=true;continue;}if(c==='\t'){push();continue;}if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;push();rows.push([]);continue;}if(closed)throw new Error('Use a rectangular tab-separated range.');value+=c;}
  if(quoted)throw new Error('The pasted range contains an unfinished quoted cell.');
  if(value||rows[rows.length-1].length||rows.length===1)push();else rows.pop();
  if(!rows.length||rows.some(row=>row.length!==rows[0].length))throw new Error('Use a rectangular tab-separated range.');
  return rows;
}
