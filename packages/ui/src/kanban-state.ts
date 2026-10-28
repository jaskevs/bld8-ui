export interface KanbanItem { id:string; columnId:string; title:string }
export interface KanbanColumn { id:string; title:string; description?:string; limit?:number }
/** beforeId is null to append; fromColumnId guards against a stale move. */
export interface KanbanMove { itemId:string; fromColumnId:string; toColumnId:string; beforeId:string|null }

export function validateKanban(items:readonly KanbanItem[],columns:readonly KanbanColumn[]):string|null {
  if(!columns.length||columns.length>20)return 'Provide between 1 and 20 columns.';
  const columnIds=new Set<string>();
  for(const column of columns){if(!column||typeof column.id!=='string'||!column.id||column.id.length>100||columnIds.has(column.id)||typeof column.title!=='string'||!column.title.trim()||column.limit!==undefined&&(!Number.isInteger(column.limit)||column.limit<1))return 'Columns need unique IDs, titles and positive limits.';columnIds.add(column.id);}
  if(items.length>500)return 'This board supports up to 500 items; use a paged workflow for larger sets.';
  const ids=new Set<string>();
  for(const item of items){if(!item||typeof item.id!=='string'||!item.id||item.id.length>100||ids.has(item.id)||typeof item.title!=='string'||!item.title.trim()||!columnIds.has(item.columnId))return 'Items need unique IDs, titles and a supported column.';ids.add(item.id);}
  return null;
}

/** Returns an immutable order. A host must apply its own ownership/revision check. */
export function applyKanbanMove<T extends KanbanItem>(items:readonly T[],move:KanbanMove,columns:readonly KanbanColumn[]):T[] {
  const error=validateKanban(items,columns);if(error)throw new Error(error);
  const item=items.find(item=>item.id===move.itemId),column=columns.find(column=>column.id===move.toColumnId);
  if(!item||item.columnId!==move.fromColumnId)throw new Error('This item changed. Review the latest board before moving it.');
  if(!column)throw new Error('Choose an available column.');
  const target=items.filter(item=>item.columnId===column.id&&item.id!==move.itemId);
  if(column.limit!==undefined&&target.length>=column.limit&&item.columnId!==column.id)throw new Error(column.title+' has reached its limit.');
  if(move.beforeId!==null&&!target.some(item=>item.id===move.beforeId))throw new Error('That position changed. Choose a new position.');
  const rest=items.filter(item=>item.id!==move.itemId),moved={...item,columnId:column.id};
  let index=move.beforeId===null?-1:rest.findIndex(item=>item.id===move.beforeId);
  if(index<0){const last=rest.map(item=>item.columnId).lastIndexOf(column.id);index=last<0?rest.length:last+1;}
  return [...rest.slice(0,index),moved,...rest.slice(index)];
}

export function kanbanOrderKey(items:readonly KanbanItem[]):string {return JSON.stringify(items.map(({id,columnId})=>[id,columnId]));}
