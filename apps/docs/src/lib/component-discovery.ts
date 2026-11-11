import {categories,components,type Category,type ComponentEntry} from './catalog';

export const componentCapabilityDefinitions = [
  {id:'forms',label:'Form values',description:'Named values for form integration.'},
  {id:'validation',label:'Validation',description:'Field or value validation feedback.'},
  {id:'search',label:'Search',description:'Searchable choices, commands or records.'},
  {id:'async',label:'Async & recovery',description:'Asynchronous operations with loading or recovery states.'},
  {id:'multiple',label:'Multiple values',description:'More than one selected or committed value.'},
  {id:'nested',label:'Nested choices',description:'Structured child items or grouped conditions.'},
  {id:'ranges',label:'Ranges',description:'A pair of values, dates or a rectangular cell selection.'},
  {id:'ordering',label:'Ordering',description:'Pointer or keyboard ordering APIs.'},
  {id:'keyboard',label:'Keyboard patterns',description:'Documented composite keyboard interactions.'},
  {id:'windowed',label:'Windowed rows',description:'A bounded window over supplied table records.'},
] as const;
export type ComponentCapability=typeof componentCapabilityDefinitions[number]['id'];
export interface ComponentFilters {query:string;category:Category;capability:ComponentCapability|'all'}
export const defaultComponentFilters:ComponentFilters={query:'',category:'All components',capability:'all'};

const capabilitySets:Record<ComponentCapability,readonly string[]>={
  forms:['input','input-group','textarea','checkbox','switch','radio','select','combobox','multi-select','async-combobox','async-multi-select','number-field','time-picker','slider','range-slider','otp-input','toggle-group','tag-input','date-picker','date-range','file-upload','form','react-hook-form'],
  validation:['input','input-group','textarea','radio','select','combobox','multi-select','async-combobox','async-multi-select','cascader','number-field','time-picker','range-slider','otp-input','toggle-group','tag-input','form','react-hook-form','data-grid','editable-cell','filter-builder','upload-queue'],
  search:['combobox','multi-select','async-combobox','async-multi-select','command','table','advanced-table'],
  async:['async-combobox','async-multi-select','cascader','form','editable-cell','file-upload','upload-queue'],
  multiple:['multi-select','async-multi-select','toggle-group','tag-input'],
  nested:['dropdown','context-menu','cascader','tree','filter-builder'],
  ranges:['range-slider','date-range','data-grid'],
  ordering:['kanban','table','advanced-table'],
  keyboard:['button','icon-button','input-group','checkbox','switch','radio','select','combobox','multi-select','async-combobox','async-multi-select','cascader','slider','range-slider','otp-input','toggle-group','tag-input','tabs','accordion','pagination','dialog','sheet','drawer','popover','tooltip','dropdown','context-menu','command','sidebar','tree','kanban','stepper','data-grid','windowed-table','calendar','date-picker','date-range','day-agenda','event-calendar','time-picker','number-field','filter-builder','chart'],
  windowed:['windowed-table'],
};
const searchAliases:Record<string,string>={
  'input':'text field label hint error required', 'input-group':'input adornment prefix suffix clear search', 'textarea':'multiline long text field',
  'otp-input':'otp verification one time password pin code digits', 'tag-input':'tags tokens chips free text labels commit paste',
  'toggle-group':'segmented pressed toolbar single multiple choice', 'range-slider':'minimum maximum interval two thumbs numeric range',
  'select':'single choice listbox picker', 'combobox':'autocomplete typeahead searchable single choice',
  'multi-select':'multiple choices chips tags searchable', 'async-combobox':'remote autocomplete paging retry retained labels',
  'async-multi-select':'remote multiple choices paging retry retained labels', 'cascader':'hierarchy path dependent choices lazy children',
  'dropdown':'action menu submenu checkbox radio groups separator', 'context-menu':'right click menu submenu checkbox radio groups',
  'data-grid':'spreadsheet cells editing clipboard tsv ranges undo redo drafts', 'windowed-table':'virtual virtualized virtualised bounded rows scrolling window',
  'table':'records columns visibility pinning resizing sorting pagination selection export', 'advanced-table':'records drag reorder saved layouts grouping facets',
  'date-range':'dates start end interval', 'calendar':'date month day picker', 'event-calendar':'week month appointments timezone events overlap',
  'upload-queue':'files progress cancel retry transport', 'file-upload':'files drag drop browse transfer', 'tree':'folders hierarchy expand collapse',
  'react-hook-form':'rhf controller forms integration', 'loading':'spinner skeleton busy pending', 'empty':'zero results empty state',
};
const families=[
  ['input','textarea','input-group','number-field','otp-input','slider','range-slider'],
  ['select','combobox','multi-select','async-combobox','async-multi-select','cascader','radio','checkbox','switch','toggle-group','tag-input'],
  ['dropdown','context-menu','command'], ['dialog','sheet','drawer','popover','tooltip'],
  ['table','advanced-table','data-grid','windowed-table','editable-cell','filter-builder'],
  ['calendar','date-picker','date-range','event-calendar','day-agenda','time-picker'],
  ['tabs','accordion','breadcrumb','pagination','sidebar','stepper'], ['file-upload','upload-queue'],
  ['form','react-hook-form'], ['alert','toast','badge','progress','loading','empty'],
  ['button','icon-button','icon','avatar','card'], ['tree','kanban','timeline','chart'],
];
const slug=(value:string)=>value.toLowerCase().replace(/\s+/g,'-');
export function getComponentCapabilities(id:string):ComponentCapability[]{return componentCapabilityDefinitions.filter(capability=>capabilitySets[capability.id].includes(id)).map(capability=>capability.id);}
export function parseComponentFilters(params:URLSearchParams):ComponentFilters {
  const category=categories.find(item=>slug(item)===slug(params.get('category')??''))??'All components';
  const capability=componentCapabilityDefinitions.find(item=>item.id===params.get('capability'))?.id??'all';
  return {query:(params.get('q')??'').slice(0,80),category,capability};
}
export function componentFiltersUrl(href:string,filters:ComponentFilters):string {
  const url=new URL(href,'http://localhost');
  for(const key of ['q','category','capability'])url.searchParams.delete(key);
  if(filters.query.trim())url.searchParams.set('q',filters.query.trim().slice(0,80));
  if(filters.category!=='All components')url.searchParams.set('category',slug(filters.category));
  if(filters.capability!=='all')url.searchParams.set('capability',filters.capability);
  return url.pathname+url.search+url.hash;
}
export function filterComponents(filters:ComponentFilters,candidates:readonly ComponentEntry[]=components):ComponentEntry[]{
  const terms=filters.query.toLowerCase().replace(/[-_]/g,' ').trim().split(/\s+/).filter(Boolean);
  return candidates.filter(item=>{
    const capabilities=getComponentCapabilities(item.id);
    const text=[item.title,item.description,item.category,searchAliases[item.id]??'',...capabilities.map(id=>componentCapabilityDefinitions.find(capability=>capability.id===id)!.label)].join(' ').toLowerCase().replace(/[-_]/g,' ');
    return (filters.category==='All components'||item.category===filters.category)&&(filters.capability==='all'||capabilities.includes(filters.capability))&&terms.every(term=>text.includes(term));
  });
}
export function getRelatedComponents(id:string,limit=4):ComponentEntry[]{
  const selected=components.find(item=>item.id===id);if(!selected)return [];
  const family=families.find(group=>group.includes(id));
  const related=components.filter(item=>item.id!==id&&(family?family.includes(item.id):item.category===selected.category));
  return related.slice(0,Math.max(0,limit));
}
