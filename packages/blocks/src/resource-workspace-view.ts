/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {createTableViewState,normalizeTableViewState,type DataGridViewState} from '@bld8/ui';
import {isDataObject,parseDataQuery,type DataColumn,type DataQuery,type DataRecord} from '@bld8/ui/data-workspace-state';
import {createResourceQuery,type ResourceFilterField} from './resource-workspace-state.js';
export interface ResourceWorkspaceView {version:1;query:Omit<DataQuery,'page'>;grid:DataGridViewState}
export interface SavedResourceView {id:string;label:string;view:ResourceWorkspaceView}
const gridPart=(value:ReturnType<typeof createTableViewState>):DataGridViewState=>({columnOrderKeys:value.columnOrderKeys,visibleColumnKeys:value.visibleColumnKeys,columnWidths:value.columnWidths,columnPinning:value.columnPinning,density:value.density});
export function normalizeResourceGridView<T extends DataRecord>(input:unknown,columns:readonly DataColumn<T>[]):DataGridViewState{
  const options={columns:columns.map(column=>({key:column.key,hideable:column.hideable,minWidth:column.minWidth??(column.type==='text'&&column.key!=='id'?220:128),pinned:column.pinned,sortable:column.sortable}))},base=createTableViewState(options);
  const values=isDataObject(input)?input:{};
  return gridPart(normalizeTableViewState({...base,columnOrderKeys:values.columnOrderKeys??base.columnOrderKeys,visibleColumnKeys:values.visibleColumnKeys??base.visibleColumnKeys,columnWidths:values.columnWidths??Object.fromEntries(columns.flatMap(column=>column.width===undefined?[]:[[column.key,column.width]])),columnPinning:values.columnPinning??base.columnPinning,density:values.density??base.density} as ReturnType<typeof createTableViewState>,options));
}
/** Only view fields are copied. Drafts, selection, caches and saved records never enter a URL. */
export function createResourceWorkspaceView<T extends DataRecord>(query:DataQuery,grid:DataGridViewState,columns:readonly DataColumn<T>[],fields:readonly ResourceFilterField<T>[]):ResourceWorkspaceView{
  const parsed=parseDataQuery(query,columns,fields);if(!parsed)throw Error('Use a supported resource view.');const {page,...portable}=parsed;return {version:1,query:portable,grid:normalizeResourceGridView(grid,columns)};
}
export function parseResourceWorkspaceView<T extends DataRecord>(text:string,columns:readonly DataColumn<T>[],fields:readonly ResourceFilterField<T>[]):ResourceWorkspaceView|null{
  if(typeof text!=='string'||text.length>48000||new TextEncoder().encode(text).byteLength>48000)return null;
  try{const input:unknown=JSON.parse(text);if(!isDataObject(input)||input.version!==1||!isDataObject(input.query)||!isDataObject(input.grid))return null;return createResourceWorkspaceView({...input.query,page:1} as DataQuery,input.grid as unknown as DataGridViewState,columns,fields);}catch{return null;}
}
export function serializeResourceWorkspaceView<T extends DataRecord>(view:ResourceWorkspaceView,columns:readonly DataColumn<T>[],fields:readonly ResourceFilterField<T>[]):string{
  const clean=createResourceWorkspaceView({...view.query,page:1},view.grid,columns,fields),text=JSON.stringify(clean);if(new TextEncoder().encode(text).byteLength>48000)throw Error('Share a view up to 48 KiB.');return text;
}
export function resourceWorkspaceViewUrl<T extends DataRecord>(href:string,view:ResourceWorkspaceView,columns:readonly DataColumn<T>[],fields:readonly ResourceFilterField<T>[],parameter='resourceView'):string{
  if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(parameter))throw Error('Use a supported view parameter.');const url=new URL(href,'http://localhost');url.searchParams.set(parameter,serializeResourceWorkspaceView(view,columns,fields));return url.pathname+url.search+url.hash;
}
export function resourceViewQuery(view?:ResourceWorkspaceView):DataQuery{return view?{...view.query,page:1}:createResourceQuery();}
