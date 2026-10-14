export const playgroundNames=['Button','Input','Switch','Badge','Progress','Select','Tabs','Dialog','Drawer','MultiSelect','Calendar','DatePicker','DateRangePicker','DataTable'] as const;
export type PlaygroundName=typeof playgroundNames[number];
export interface PlaygroundSettings {
  component:PlaygroundName;variant:'primary'|'accent'|'secondary'|'ghost'|'danger';size:'sm'|'md'|'lg';state:string;label:string;
  density:'comfortable'|'compact';tone:'accent'|'neutral'|'success'|'warning'|'danger';value:number;icon:boolean;mobile:boolean;dark:boolean;
  side:'bottom'|'left'|'right';focus:'input'|'close';selected:string[];disabledOption:boolean;
  date:string;endDate:string;minDate:string;maxDate:string;pageSize:number;selectable:boolean;resizable:boolean;inlineEditing:boolean;
}
export const playgroundDefaults:PlaygroundSettings={component:'Button',variant:'primary',size:'md',state:'Default',label:'Save changes',density:'comfortable',tone:'accent',value:60,icon:false,mobile:false,dark:false,side:'bottom',focus:'input',selected:['design'],disabledOption:false,date:'2026-10-20',endDate:'2026-10-24',minDate:'',maxDate:'',pageSize:5,selectable:true,resizable:false,inlineEditing:false};
export const playgroundModules:Record<PlaygroundName,string>={Button:'button',Input:'input',Switch:'switch',Badge:'badge',Progress:'progress',Select:'select',Tabs:'tabs',Dialog:'dialog',Drawer:'drawer',MultiSelect:'multi-select',Calendar:'calendar',DatePicker:'date-picker',DateRangePicker:'date-range',DataTable:'table'};
export function statesFor(component:PlaygroundName){
  if(['Dialog','Drawer'].includes(component))return ['Default','Loading','Error'];
  if(component==='DataTable')return ['Default','Loading','Error','Empty'];
  if(['Input','MultiSelect','DatePicker','DateRangePicker'].includes(component))return ['Default','Disabled','Error'];
  if(['Button','Progress'].includes(component))return ['Default','Loading',...(component==='Button'?['Disabled']:[])];
  if(['Switch','Select','Calendar'].includes(component))return ['Default','Disabled'];
  return ['Default'];
}
export function localDate(value:string):Date|undefined {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return undefined;
  const [year,month,day]=value.split('-').map(Number);if(year<1900 || year>2100)return undefined;
  const date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:undefined;
}
export function readPlayground(search:string,initial:PlaygroundName='Button'):PlaygroundSettings {
  const params=new URLSearchParams(search);const result={...playgroundDefaults,component:initial,selected:[...playgroundDefaults.selected]};
  const pick=<K extends keyof PlaygroundSettings>(key:K,choices:readonly string[])=>{const value=params.get(key);if(value && choices.includes(value))Object.assign(result,{[key]:value});};
  pick('component',playgroundNames);pick('variant',['primary','accent','secondary','ghost','danger']);pick('size',['sm','md','lg']);pick('density',['comfortable','compact']);pick('tone',['accent','neutral','success','warning','danger']);pick('side',['bottom','left','right']);pick('focus',['input','close']);
  pick('state',statesFor(result.component));
  for(const key of ['icon','mobile','dark','disabledOption','selectable','resizable','inlineEditing'] as const){const value=params.get(key);if(value==='true'||value==='false')result[key]=value==='true';}
  for(const [key,min,max] of [['value',0,100],['pageSize',1,10]] as const){const raw=params.get(key);if(raw!==null){const value=Number(raw);if(Number.isFinite(value))result[key]=Math.min(max,Math.max(min,Math.round(value)));}}
  if(params.has('label'))result.label=(params.get('label')??'').replace(/[<>\{\}\x00-\x1f]/g,'').slice(0,60);
  if(params.has('selected'))result.selected=[...new Set((params.get('selected')??'').split(','))].filter(value=>['design','engineering','research','documentation'].includes(value));
  for(const key of ['date','endDate','minDate','maxDate'] as const){const value=params.get(key);if(value!==null && (!value||localDate(value)))result[key]=value;}
  if(result.endDate && result.date && result.endDate<result.date)result.endDate='';
  if(result.minDate && result.maxDate && result.maxDate<result.minDate)result.maxDate='';
  return result;
}
export function writePlayground(settings:PlaygroundSettings){
  const params=new URLSearchParams({v:'1',component:settings.component});
  for(const key of Object.keys(playgroundDefaults) as (keyof PlaygroundSettings)[]){if(key==='component')continue;const value=settings[key],fallback=playgroundDefaults[key];if(JSON.stringify(value)!==JSON.stringify(fallback))params.set(key,Array.isArray(value)?value.join(','):String(value));}
  return '?'+params.toString();
}
export function playgroundKeyboard(component:PlaygroundName){
  if(['Dialog','Drawer'].includes(component))return 'Enter opens the surface. Tab stays inside it; Escape dismisses it and returns focus to the trigger.';
  if(component==='MultiSelect')return 'Type to filter. Use arrows and Enter to choose, Backspace to remove a chip, and Escape to close an open list. When the list is already closed, Escape clears the selection.';
  if(['Calendar','DatePicker','DateRangePicker'].includes(component))return 'Use arrows to move by day, Home/End within the week, and Page Up/Down between months. Enter selects a date; Escape closes a popup.';
  if(component==='DataTable')return 'Tab reaches sorting, selection and edit actions. Enter saves an edited cell; Escape cancels it. Focus a resize handle and use Left/Right to adjust its width.';
  if(component==='Tabs')return 'Use Left/Right to move between tabs. Selection follows keyboard focus.';
  if(component==='Select')return 'Use arrows or typeahead to choose an option. Enter confirms; Escape closes the list.';
  return 'Use Tab to focus the control. Enter activates buttons; Space toggles switches. Focus remains visible in both themes.';
}

export function playgroundHref(id:string){const component=playgroundNames.find(name=>playgroundModules[name]===id) ?? (['advanced-table','editable-cell'].includes(id)?'DataTable':undefined);return component?'/playground?component='+component+(id==='editable-cell'?'&inlineEditing=true':''):'/playground';}
