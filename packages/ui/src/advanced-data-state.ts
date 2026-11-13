/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import type {DataRecord} from './data-workspace-state.js';

export const ADVANCED_DATA_LIMITS={rows:20_000,depth:8,retainedRows:3,summaries:20} as const;
export interface DataGridVirtualization {height?:number;rowHeight?:number;overscan?:number}
export function dataGridWindow(count:number,scrollTop:number,height:number,rowHeight:number,overscan:number,retained:readonly number[]=[]){
  if(!Number.isSafeInteger(count)||count<0||count>ADVANCED_DATA_LIMITS.rows)throw new Error('Provide up to 20,000 loaded records.');
  const size=Math.max(56,Math.min(96,Number.isFinite(rowHeight)?Math.round(rowHeight):64));
  const pane=Math.max(240,Math.min(800,Number.isFinite(height)?Math.round(height):480));
  const extra=Math.max(0,Math.min(12,Number.isFinite(overscan)?Math.round(overscan):4));
  const offset=Math.max(0,Number.isFinite(scrollTop)?scrollTop:0);
  const start=Math.max(0,Math.min(count,Math.floor(offset/size)-extra));
  const end=Math.max(start,Math.min(count,Math.ceil((offset+pane-44)/size)+extra));
  const indices=new Set(Array.from({length:end-start},(_,index)=>start+index));
  for(const index of retained.slice(0,ADVANCED_DATA_LIMITS.retainedRows))if(Number.isInteger(index)&&index>=0&&index<count)indices.add(index);
  return {size,height:pane,start,end,indices:[...indices].sort((a,b)=>a-b)};
}

export interface DataTreeNode<T extends DataRecord>{row:T;parentId:string|null;depth:number;hasChildren:boolean;expanded:boolean}
/** Every supplied child has one supplied parent. Unknown children are never inferred. */
export function flattenDataTree<T extends DataRecord>(rows:readonly T[],parentId:(row:T)=>string|null,expanded:readonly string[],hasChildren?:(row:T)=>boolean):DataTreeNode<T>[] {
  if(rows.length>ADVANCED_DATA_LIMITS.rows||rows.some(row=>!row||typeof row.id!=='string'||!row.id.trim()||row.id.length>256)||new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error('Use up to 20,000 distinct loaded records with bounded IDs.');
  const records=new Map(rows.map(row=>[row.id,row])),parents=new Map<string,string|null>(),children=new Map<string|null,T[]>(),depths=new Map<string,number>();
  for(const row of rows){const parent=parentId(row);if(parent!==null&&(typeof parent!=='string'||!records.has(parent)))throw new Error('Every loaded child needs a loaded parent.');parents.set(row.id,parent);let group=children.get(parent);if(!group){group=[];children.set(parent,group);}group.push(row);}
  function depth(id:string,path=new Set<string>()):number{const cached=depths.get(id);if(cached!==undefined)return cached;if(path.has(id))throw new Error('Tree rows cannot contain a cycle.');if(path.size>=ADVANCED_DATA_LIMITS.depth)throw new Error('Use up to eight tree levels.');path.add(id);const parent=parents.get(id),value=parent==null?0:depth(parent,path)+1;path.delete(id);if(value>=ADVANCED_DATA_LIMITS.depth)throw new Error('Use up to eight tree levels.');depths.set(id,value);return value;}
  rows.forEach(row=>depth(row.id));
  const open=new Set(expanded),result:DataTreeNode<T>[]=[];
  function visit(parent:string|null){for(const row of children.get(parent)??[]){const childRows=children.get(row.id)??[],canExpand=childRows.length>0||hasChildren?.(row)===true;result.push({row,parentId:parent,depth:depths.get(row.id)!,hasChildren:canExpand,expanded:canExpand&&open.has(row.id)});if(canExpand&&open.has(row.id))visit(row.id);}}
  visit(null);return result;
}

export interface DataSummarySpec<T extends DataRecord>{id:string;label:string;operation:'count'|'sum'|'average';key?:Extract<keyof T,string>}
export interface DataSummaryValue{id:string;value:number|null;count:number}
export interface DataSummarySnapshot{queryKey:string;recordCount:number;values:readonly DataSummaryValue[]}
/** Numeric summaries ignore only absent values. Invalid numeric values fail explicitly. */
export function summarizeDataRows<T extends DataRecord>(rows:readonly T[],specs:readonly DataSummarySpec<T>[]):DataSummaryValue[]{
  if(rows.length>ADVANCED_DATA_LIMITS.rows||specs.length>ADVANCED_DATA_LIMITS.summaries||new Set(specs.map(spec=>spec.id)).size!==specs.length)throw new Error('Use bounded records and distinct summary IDs.');
  return specs.map(spec=>{if(!spec.id||!spec.label||!['count','sum','average'].includes(spec.operation))throw new Error('Provide a labelled count, sum or average summary.');if(spec.operation==='count')return {id:spec.id,value:rows.length,count:rows.length};if(!spec.key)throw new Error('Numeric summaries need a field key.');let sum=0,count=0;for(const row of rows){const value=row[spec.key];if(value===null||value===undefined)continue;if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Summary '+spec.label+' needs finite numeric values.');sum+=value;count++;if(!Number.isFinite(sum))throw new Error('The summary exceeds a finite numeric value.');}return {id:spec.id,value:spec.operation==='sum'?sum:count?sum/count:null,count};});
}
/** The query identity prevents an older service total being labelled as current. */
export function validDataSummarySnapshot<T extends DataRecord>(snapshot:DataSummarySnapshot,queryKey:string,specs:readonly DataSummarySpec<T>[]):boolean {
  if(!snapshot||typeof snapshot.queryKey!=='string'||snapshot.queryKey!==queryKey||!Number.isSafeInteger(snapshot.recordCount)||snapshot.recordCount<0||!Array.isArray(snapshot.values)||snapshot.values.length!==specs.length)return false;
  const values=Array.from(snapshot.values);if(values.some(value=>!value||typeof value.id!=='string')||new Set(values.map(value=>value.id)).size!==specs.length)return false;
  return values.every(value=>{const spec=specs.find(spec=>spec.id===value.id);return !!spec&&Number.isSafeInteger(value.count)&&value.count>=0&&value.count<=snapshot.recordCount&&(spec.operation==='count'?value.value===snapshot.recordCount&&value.count===snapshot.recordCount:spec.operation==='average'&&value.count===0?value.value===null:typeof value.value==='number'&&Number.isFinite(value.value));});
}
