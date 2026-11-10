'use client';
import {DataTable,type DataTableProps} from './data-table.js';
import {TableOrderingContext,type TableOrderingAdapter} from './table-order-controls.js';
import {TableOrderContext,OrderedTableRow,DndColumnList} from './table-ordering.js';

const ordering:TableOrderingAdapter={Context:TableOrderContext,Row:OrderedTableRow,ColumnsList:DndColumnList,pointerSorting:true};

/** Opt-in pointer/touch ordering with the same keyboard, query and persistence contract as DataTable. */
export function SortableDataTable<T>(props:DataTableProps<T>){
  return <TableOrderingContext.Provider value={ordering}><DataTable {...props}/></TableOrderingContext.Provider>;
}
