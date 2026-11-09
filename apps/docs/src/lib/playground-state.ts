import {emptyFilterQuery,validateFilterQuery,type FilterQuery} from '@bld8/ui/filter-query';
import {playgroundFilterFields,readPlaygroundFilterDraft} from './playground-data';
export const playgroundNames=['Button','Input','Checkbox','RadioGroup','Switch','Badge','Progress','Select','Tabs','Accordion','Dialog','Drawer','MultiSelect','Calendar','DatePicker','DateRangePicker','DataTable','FilterBuilder','Kanban','Tree','Chart'] as const;
export type PlaygroundName=typeof playgroundNames[number];
export interface PlaygroundSettings {
  component:PlaygroundName;variant:'primary'|'accent'|'secondary'|'ghost'|'danger';size:'sm'|'md'|'lg';state:string;label:string;
  density:'comfortable'|'compact';tone:'accent'|'neutral'|'success'|'warning'|'danger';value:number;icon:boolean;mobile:boolean;dark:boolean;
  side:'bottom'|'left'|'right';focus:'input'|'close';selected:string[];disabledOption:boolean;
  date:string;endDate:string;minDate:string;maxDate:string;pageSize:number;selectable:boolean;resizable:boolean;inlineEditing:boolean;
  checked:boolean;mixed:boolean;radioValue:'comfortable'|'compact'|'automatic';multiple:boolean;accordionOpen:string[];
  selectValue:'design'|'engineering'|'research'|'documentation';tabValue:'overview'|'activity';
  tableSelected:string[];tableColumns:string[];tableSearch:string;tableStatus:''|'Planned'|'Ready';tableSort:string;tablePage:number;
  groupRows:boolean;collapsedGroups:string[];bulkActions:boolean;actionResult:'Success'|'Error';advancedFilters:boolean;filters:FilterQuery;appliedFilters:FilterQuery;
  kanbanLayout:'board'|'backlog';kanbanLimit:number;kanbanOrder:string[];
  treeExpanded:string[];treeSelected:string;treeLoaded:boolean;treeFailure:boolean;
  chartType:'line'|'bar'|'area';chartPeriod:'week'|'fortnight';chartSeries:'both'|'completed'|'failed';chartHeight:number;chartMissing:boolean;
}
export const playgroundDefaults:PlaygroundSettings={component:'Button',variant:'primary',size:'md',state:'Default',label:'Save changes',density:'comfortable',tone:'accent',value:60,icon:false,mobile:false,dark:false,side:'bottom',focus:'input',selected:['design'],disabledOption:false,date:'2026-10-20',endDate:'2026-10-24',minDate:'',maxDate:'',pageSize:5,selectable:true,resizable:false,inlineEditing:false,selectValue:'design',tabValue:'overview',checked:false,mixed:false,radioValue:'comfortable',multiple:false,accordionOpen:['overview'],tableSelected:[],tableColumns:['name','status'],tableSearch:'',tableStatus:'',tableSort:'none',tablePage:1,groupRows:false,collapsedGroups:[],bulkActions:true,actionResult:'Success',advancedFilters:false,filters:emptyFilterQuery(),appliedFilters:emptyFilterQuery(),kanbanLayout:'board',kanbanLimit:2,kanbanOrder:['brief:planned','keyboard:active','notes:planned','publish:done'],treeExpanded:['src'],treeSelected:'readme',treeLoaded:false,treeFailure:false,chartType:'bar',chartPeriod:'week',chartSeries:'both',chartHeight:280,chartMissing:false};
export const playgroundModules:Record<PlaygroundName,string>={Button:'button',Input:'input',Checkbox:'checkbox',RadioGroup:'radio',Switch:'switch',Badge:'badge',Progress:'progress',Select:'select',Tabs:'tabs',Accordion:'accordion',Dialog:'dialog',Drawer:'drawer',MultiSelect:'multi-select',Calendar:'calendar',DatePicker:'date-picker',DateRangePicker:'date-range',DataTable:'table',FilterBuilder:'filter-builder',Kanban:'kanban',Tree:'tree',Chart:'chart'};
export function statesFor(component:PlaygroundName){
  if(['Kanban','Tree'].includes(component))return ['Default','Disabled','Loading','Error','Empty'];
  if(component==='Chart')return ['Default','Loading','Error','Empty'];
  if(['Dialog','Drawer'].includes(component))return ['Default','Loading','Error'];
  if(component==='DataTable')return ['Default','Loading','Error','Empty'];
  if(['Input','MultiSelect','DatePicker','DateRangePicker'].includes(component))return ['Default','Disabled','Error'];
  if(['Button','Progress'].includes(component))return ['Default','Loading',...(component==='Button'?['Disabled']:[])];
  if(['Switch','Checkbox','RadioGroup','Accordion','FilterBuilder','Select','Calendar'].includes(component))return ['Default','Disabled'];
  return ['Default'];
}
export function localDate(value:string):Date|undefined {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return undefined;
  const [year,month,day]=value.split('-').map(Number);if(year<1900 || year>2100)return undefined;
  const date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:undefined;
}
export function readPlayground(search:string,initial:PlaygroundName='Button'):PlaygroundSettings {
  const params=new URLSearchParams(search.length<=64000?search:'');const result:PlaygroundSettings={...playgroundDefaults,component:initial,kanbanOrder:[...playgroundDefaults.kanbanOrder],treeExpanded:[...playgroundDefaults.treeExpanded],selected:[...playgroundDefaults.selected],accordionOpen:[...playgroundDefaults.accordionOpen],tableSelected:[],tableColumns:[...playgroundDefaults.tableColumns],collapsedGroups:[],filters:emptyFilterQuery(),appliedFilters:emptyFilterQuery()};
  if(params.has('v')&&!['1','2'].includes(params.get('v')!))return result;
  const pick=<K extends keyof PlaygroundSettings>(key:K,choices:readonly string[])=>{const value=params.get(key);if(value && choices.includes(value))Object.assign(result,{[key]:value});};
  pick('component',playgroundNames);pick('variant',['primary','accent','secondary','ghost','danger']);pick('size',['sm','md','lg']);pick('density',['comfortable','compact']);pick('tone',['accent','neutral','success','warning','danger']);pick('side',['bottom','left','right']);pick('focus',['input','close']);
  pick('state',statesFor(result.component));
  pick('kanbanLayout',['board','backlog']);pick('chartType',['line','bar','area']);pick('chartPeriod',['week','fortnight']);pick('chartSeries',['both','completed','failed']);
  pick('radioValue',['comfortable','compact','automatic']);pick('selectValue',['design','engineering','research','documentation']);pick('tabValue',['overview','activity']);pick('tableStatus',['Planned','Ready']);pick('tableSort',['none','name-asc','name-desc','status-asc','status-desc','due-asc','due-desc']);pick('actionResult',['Success','Error']);
  for(const key of ['icon','mobile','dark','disabledOption','selectable','resizable','inlineEditing','checked','mixed','multiple','groupRows','bulkActions','advancedFilters','treeLoaded','treeFailure','chartMissing'] as const){const value=params.get(key);if(value==='true'||value==='false')result[key]=value==='true';}
  for(const [key,min,max] of [['value',0,100],['pageSize',1,10],['tablePage',1,6],['kanbanLimit',1,4],['chartHeight',160,480]] as const){const raw=params.get(key);if(raw!==null){const value=Number(raw);if(Number.isFinite(value))result[key]=Math.min(max,Math.max(min,Math.round(value)));}}
  if(params.has('label'))result.label=(params.get('label')??'').replace(/[<>\{\}\x00-\x1f]/g,'').slice(0,60);
  if(params.has('selected'))result.selected=[...new Set((params.get('selected')??'').split(','))].filter(value=>['design','engineering','research','documentation'].includes(value));
  for(const [key,allowed] of [['accordionOpen',['overview','keyboard','sharing']],['tableSelected',['1','2','3','4','5','6']],['tableColumns',['name','status','due']],['collapsedGroups',['Planned','Ready']]] as const){if(params.has(key))result[key]=[...new Set((params.get(key)??'').split(','))].filter(value=>(allowed as readonly string[]).includes(value));}
  if(!result.multiple)result.accordionOpen=result.accordionOpen.slice(0,1);
  if(!result.tableColumns.includes('name'))result.tableColumns.unshift('name');
  if(!result.selectable)result.tableSelected=[];
  if(params.has('kanbanOrder')){
    const entries=(params.get('kanbanOrder')??'').split(',').slice(0,20),seen=new Set<string>();
    result.kanbanOrder=entries.filter(value=>{const [id,columnId,...extra]=value.split(':');if(extra.length||!['brief','keyboard','notes','publish'].includes(id)||!['planned','active','done'].includes(columnId)||seen.has(id))return false;seen.add(id);return true;});
    result.kanbanOrder.push(...playgroundDefaults.kanbanOrder.filter(value=>!seen.has(value.split(':')[0])));
  }
  if(params.has('treeExpanded'))result.treeExpanded=[...new Set((params.get('treeExpanded')??'').split(','))].filter(value=>['src','components','assets'].includes(value));
  if(params.has('treeSelected')){const selected=params.get('treeSelected')??'';result.treeSelected=['','src','components','button','input','app','styles','assets','readme',...(result.treeLoaded?['tokens','logo']:[])].includes(selected)?selected:'';}
  result.tableSearch=(params.get('tableSearch')??'').replace(/[\x00-\x1f]/g,'').slice(0,100);
  for(const key of ['filters','appliedFilters'] as const){const raw=params.get(key);if(raw){const query=readPlaygroundFilterDraft(raw);if(query&&(key==='filters'||!Object.keys(validateFilterQuery(query,playgroundFilterFields)).length))result[key]=query;}}
  for(const key of ['date','endDate','minDate','maxDate'] as const){const value=params.get(key);if(value!==null && (!value||localDate(value)))result[key]=value;}
  if(result.endDate && result.date && result.endDate<result.date)result.endDate='';
  if(result.minDate && result.maxDate && result.maxDate<result.minDate)result.maxDate='';
  return result;
}
export function writePlayground(settings:PlaygroundSettings){
  const params=new URLSearchParams({v:'2',component:settings.component});
  for(const key of Object.keys(playgroundDefaults) as (keyof PlaygroundSettings)[]){if(key==='component')continue;const value=settings[key],fallback=playgroundDefaults[key];if(JSON.stringify(value)!==JSON.stringify(fallback))params.set(key,Array.isArray(value)?value.join(','):typeof value==='object'?JSON.stringify(value):String(value));}
  return '?'+params.toString();
}
/** Keep exported links within this showcase's conservative query-length budget. */
export const playgroundLinkLimit=8000;
export function playgroundKeyboard(component:PlaygroundName){
  if(component==='Kanban')return 'Tab to a Move action and press Enter to choose a column and position. Escape cancels the dialog and returns focus. Pointer and touch dragging are also available; a pending save blocks another move.';
  if(component==='Tree')return 'Arrow keys move focus; Home/End reach the first/last item. Right/Left expand or collapse folders. Space selects; Enter activates. Loading is abortable and disabled nodes are skipped.';
  if(component==='Chart')return 'Focus the plot and use arrows to explore observations. Legend buttons toggle series, and the data-table action exposes exact values. Exploration stays local; the link preserves the supplied chart configuration.';
  if(['Dialog','Drawer'].includes(component))return 'Enter opens the surface. Tab stays inside it; Escape dismisses it and returns focus to the trigger.';
  if(component==='MultiSelect')return 'Type to filter. Use arrows and Enter to choose, Backspace to remove a chip, and Escape to close an open list. When the list is already closed, Escape clears the selection.';
  if(['Calendar','DatePicker','DateRangePicker'].includes(component))return 'Use arrows to move by day, Home/End within the week, and Page Up/Down between months. Enter selects a date; Escape closes a popup.';
  if(component==='DataTable')return 'Tab reaches sorting, selection and edit actions. Enter saves a text/date cell; choose a status and use Save for select cells. Escape closes an open menu, then cancels the edit. Focus a resize handle and use Left/Right to adjust its width.';
  if(component==='FilterBuilder')return 'Add conditions, choose fields and values, then Apply filters. Incomplete drafts stay separate from results. Tab reaches each condition; removing one returns focus to a neighbouring field or Add filter.';
  if(component==='Accordion')return 'Tab reaches each heading. Enter or Space toggles it; Up/Down and Home/End move between headings. Disabled headings are skipped.';
  if(component==='Checkbox')return 'Tab focuses the checkbox. Space toggles it and clears the mixed state. The dash and tick ease independently while the native state updates immediately.';
  if(component==='RadioGroup')return 'Tab enters the group. Arrow keys move between enabled options; Space selects the focused option.';
  if(component==='Tabs')return 'Use Left/Right to move between tabs. Selection follows keyboard focus.';
  if(component==='Select')return 'Use arrows or typeahead to choose an option. Enter confirms; Escape closes the list.';
  return 'Use Tab to focus the control. Enter activates buttons; Space toggles switches. Focus remains visible in both themes.';
}

export function playgroundHref(id:string){const component=playgroundNames.find(name=>playgroundModules[name]===id) ?? (['advanced-table','editable-cell'].includes(id)?'DataTable':undefined);return component?'/playground?component='+component+(id==='editable-cell'?'&inlineEditing=true':''):'/playground';}

export function playgroundInstall(s:PlaygroundSettings){
  const items=[playgroundModules[s.component]];
  if(['DataTable','FilterBuilder'].includes(s.component)){
    items.push('table');if(s.inlineEditing)items.push('editable-cell');
    if(s.component==='FilterBuilder'||s.advancedFilters)items.push('filter-builder');
    if(s.component==='FilterBuilder'||s.advancedFilters||s.appliedFilters.rules.length)items.push('filter-query');
  }
  if(s.component==='Tree')items.push('button');
  if(s.component==='Kanban')items.push('reveal');
  return 'npx shadcn@latest add '+[...new Set(items)].map(item=>'https://ui.bld8.dev/r/'+item+'.json').join(' ');
}
