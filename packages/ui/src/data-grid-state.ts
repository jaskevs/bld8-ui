/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {DATA_WORKSPACE_LIMITS,dataValuesEqual,parseDataValue,parseDataTsv,stringifyDataTsv,type DataColumn,type DataEdit,type DataRecord} from './data-workspace-state.js';

export interface GridPoint { row:number; column:number }
export interface GridRange { anchor:GridPoint; focus:GridPoint }
export const gridClipboardLimits={rows:100,columns:20,characters:65_536} as const;

export function gridRangeBounds(range:GridRange){return {top:Math.min(range.anchor.row,range.focus.row),bottom:Math.max(range.anchor.row,range.focus.row),left:Math.min(range.anchor.column,range.focus.column),right:Math.max(range.anchor.column,range.focus.column)};}
export function gridRangeContains(range:GridRange,point:GridPoint){const bounds=gridRangeBounds(range);return point.row>=bounds.top&&point.row<=bounds.bottom&&point.column>=bounds.left&&point.column<=bounds.right;}

/** Bounded quoted TSV. A terminal line break is a separator, not another record. */
export function parseGridClipboard(text:string):string[][] {
  if(typeof text!=='string'||text.length>gridClipboardLimits.characters||new TextEncoder().encode(text).byteLength>gridClipboardLimits.characters)throw new Error('Paste up to 64 KiB at a time.');
  const rows=parseDataTsv(text);
  if(rows.length>gridClipboardLimits.rows)throw new Error('Paste up to 100 rows at a time.');
  if(rows.some(row=>row.length>gridClipboardLimits.columns))throw new Error('Paste up to 20 columns at a time.');
  return rows;
}

/** Text values beginning with spreadsheet formula characters are copied as text. */
export function serializeGridClipboard(values:readonly (readonly unknown[])[]):string {
  if(!values.length||values.length>gridClipboardLimits.rows||values.some(row=>row.length!==values[0].length||!row.length||row.length>gridClipboardLimits.columns))throw new Error('Copy up to 100 rows and 20 columns at a time.');
  const text=stringifyDataTsv(values.map(row=>row.map(value=>typeof value==='string'&&/^[\s]*[=+\-@]/.test(value)?"'"+value:value)));
  if(text.length>gridClipboardLimits.characters||new TextEncoder().encode(text).byteLength>gridClipboardLimits.characters)throw new Error('Copy up to 64 KiB at a time.');
  return text;
}

/** Resolve the entire range before reporting any edits; never silently truncate. */
export function gridPasteEdits<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],start:GridPoint,text:string):DataEdit<T>[] {
  if(!Number.isInteger(start.row)||!Number.isInteger(start.column)||start.row<0||start.column<0)throw new Error('Choose a loaded cell before pasting.');
  const values=parseGridClipboard(text);
  if(start.row+values.length>rows.length||start.column+values[0].length>columns.length)throw new Error('The pasted range must fit within the loaded rows and columns.');
  const targetColumns=columns.slice(start.column,start.column+values[0].length);
  if(targetColumns.some(column=>column.editable!==true||column.key==='id'||column.key==='revision'))throw new Error('The pasted range contains a read-only column. Choose editable cells.');
  return values.flatMap((row,rowIndex)=>row.map((value,columnIndex)=>({id:rows[start.row+rowIndex].id,key:targetColumns[columnIndex].key,value})));
}


/** Validate the loaded rectangle before resolving any bulk edit. No range is truncated. */
function bulkBounds<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],range:GridRange){
  if(!rows.length||rows.length>DATA_WORKSPACE_LIMITS.rows||!columns.length||columns.length>DATA_WORKSPACE_LIMITS.columns||new Set(rows.map(row=>row.id)).size!==rows.length||new Set(columns.map(column=>column.key)).size!==columns.length)throw new Error('Use a loaded page with unique records and columns.');
  for(const point of [range.anchor,range.focus])if(!Number.isInteger(point.row)||!Number.isInteger(point.column)||point.row<0||point.column<0||point.row>=rows.length||point.column>=columns.length)throw new Error('The selected range must fit within the loaded rows and columns.');
  const bounds=gridRangeBounds(range);
  if((bounds.bottom-bounds.top+1)*(bounds.right-bounds.left+1)>DATA_WORKSPACE_LIMITS.clipboardCells)throw new Error('Change up to 2,000 selected cells at a time.');
  return bounds;
}

function bulkEdits<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],range:GridRange,source:(column:number)=>unknown,fillDown:boolean):DataEdit<T>[]{
  const bounds=bulkBounds(rows,columns,range),edits:DataEdit<T>[]=[];
  for(let rowIndex=bounds.top+(fillDown?1:0);rowIndex<=bounds.bottom;rowIndex++)for(let columnIndex=bounds.left;columnIndex<=bounds.right;columnIndex++){
    const row=rows[rowIndex],column=columns[columnIndex];
    if(column.editable!==true||column.key==='id'||column.key==='revision')continue;
    const parsed=parseDataValue(column,source(columnIndex));
    if(parsed.error)throw new Error(column.label+' for '+row.id+': '+parsed.error);
    if(!dataValuesEqual(row[column.key],parsed.value))edits.push({id:row.id,key:column.key,value:parsed.value});
  }
  return edits;
}

/** Repeat the top selected row down each editable column. The source row is unchanged.
 * Resolve and validate the complete operation before calling the host once. Read-only
 * columns and unchanged values are omitted; arrays retain independent canonical values.
 */
export function gridFillDownEdits<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],range:GridRange):DataEdit<T>[]{
  const top=gridRangeBounds(range).top;
  return bulkEdits(rows,columns,range,column=>rows[top][columns[column].key],true);
}

/** Apply one canonical source value to every editable selected destination.
 * Each destination's own column rules must accept it. Mixed types can reject the
 * whole operation; no host edits are emitted until every value has been resolved.
 */
export function gridApplySelectionEdits<T extends DataRecord>(rows:readonly T[],columns:readonly DataColumn<T>[],range:GridRange,value:unknown):DataEdit<T>[]{
  return bulkEdits(rows,columns,range,()=>value,false);
}
