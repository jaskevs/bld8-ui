import ts from 'typescript';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const configPath=join(root,'packages/ui/tsconfig.json');
const config=ts.readConfigFile(configPath,ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,dirname(configPath));
const program=ts.createProgram(parsed.fileNames,{...parsed.options,noEmit:true});
const checker=program.getTypeChecker();
const symbols=new Map();
for(const name of ['index.ts','react-hook-form.tsx']){
  const source=program.getSourceFile(join(root,'packages/ui/src',name));
  const module=source && checker.getSymbolAtLocation(source);
  if(module)for(const symbol of checker.getExportsOfModule(module))symbols.set(symbol.name,symbol.flags & ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol);
}
const groups={
  'day-agenda':['DayAgenda','ScheduleSnapshot','ScheduleSlot','ScheduleEvent','ScheduleStart'],
  'windowed-table':['WindowedTable','Column','TableGrouping'],
  chart:['Chart','ChartDatum','ChartSeries'],
  tree:['Tree','TreeNode'],
  'number-field':['NumberField'], 'time-picker':['TimePicker','TimeOptions'], stepper:['Stepper','StepperStep'], kanban:['Kanban','KanbanItem','KanbanColumn','KanbanMove'], 'filter-builder':['FilterBuilder','FilterField','FilterQuery','FilterRule'], timeline:['Timeline','TimelineItem'], button:['Button'], 'icon-button':['IconButton'], icon:['Icon'], input:['Field','Input'], textarea:['Field','Textarea'], 'input-group':['InputGroup'],
  checkbox:['Checkbox'], switch:['Switch'], radio:['RadioGroup','Option'], select:['Select','Option'], combobox:['Combobox'], slider:['Slider'],
  tabs:['Tabs'],accordion:['Accordion'],breadcrumb:['Breadcrumb'],pagination:['Pagination'],dialog:['Dialog','DialogClose'],sheet:['Sheet','DialogClose'],
  popover:['Popover'],tooltip:['Tooltip'],dropdown:['DropdownMenu','MenuItem'],toast:['UIProvider'],alert:['Alert'],badge:['Badge'],progress:['Progress'],
  loading:['Spinner','Skeleton'],empty:['EmptyState'],avatar:['Avatar'],card:['Card','Separator'],
  table:['DataTable','Column','TableQuery','TableFilter','TableGrouping'], 'advanced-table':['DataTable','Column','TableQuery','TableFilter','TableGrouping'],
  calendar:['Calendar','CalendarBaseProps'], 'date-picker':['DatePicker'], 'date-range':['DateRangePicker'],
  'multi-select':['MultiSelect','Option'],command:['CommandPalette','CommandItem'], 'file-upload':['FileUpload','UploadContext'],
  drawer:['Drawer','DrawerClose'],sidebar:['SidebarProvider','Sidebar','SidebarHeader','SidebarGroup','SidebarMenuButton','SidebarFooter','SidebarInset','SidebarTrigger'],
  'context-menu':['ContextMenu','ContextMenuTrigger','ContextMenuContent','ContextMenuItem','ContextMenuCheckboxItem','ContextMenuRadioGroup','ContextMenuRadioItem','ContextMenuSub','ContextMenuSubTrigger','ContextMenuGroup','ContextMenuSeparator','ContextMenuLabel'],
  form:['Form','useForm','FormOptions','FormResult','FormErrorSummary'], 'editable-cell':['EditableCell'], 'react-hook-form':['RHFField','RHFControl'],
};
function defaults(declaration){
  const result={};const parameter=declaration?.parameters?.[0];
  if(parameter && ts.isObjectBindingPattern(parameter.name))for(const element of parameter.name.elements){if(element.initializer){const name=element.propertyName?.getText() ?? element.name.getText();result[name]=element.initializer.getText();}}
  return result;
}
function describe(name){
  const symbol=symbols.get(name);if(!symbol)throw new Error('Missing documented export: '+name);
  const declaration=symbol.valueDeclaration ?? symbol.declarations?.[0];
  const value=checker.getTypeOfSymbolAtLocation(symbol,declaration);
  const call=value.getCallSignatures()[0];
  const parameter=call?.getParameters()[0];
  const type=parameter?checker.getTypeOfSymbolAtLocation(parameter,parameter.valueDeclaration ?? declaration):checker.getDeclaredTypeOfSymbol(symbol);
  const initial=defaults(declaration);
  const properties=checker.getPropertiesOfType(type).map(property=>{
    const location=property.valueDeclaration ?? property.declarations?.[0] ?? declaration;
    const origin=location.getSourceFile().fileName.replaceAll('\\','/');
    return {name:property.name,type:checker.typeToString(checker.getTypeOfSymbolAtLocation(property,location),location,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope),required:!(property.flags & ts.SymbolFlags.Optional),defaultValue:initial[property.name] ?? '—',description:ts.displayPartsToString(property.getDocumentationComment(checker)),native:origin.includes('/@types/react/')};
  }).sort((a,b)=>Number(a.native)-Number(b.native)||Number(b.required)-Number(a.required)||a.name.localeCompare(b.name));
  return {name,kind:call?'Component props':'Related type',properties};
}
const api=Object.fromEntries(Object.entries(groups).map(([id,names])=>[id,names.map(describe)]));
const target=join(root,'apps/docs/src/lib/generated/api.ts');mkdirSync(dirname(target),{recursive:true});
writeFileSync(target,`// Built from public TypeScript declarations by scripts/prepare-api.mjs.\nexport const api = ${JSON.stringify(api)};\n`);
console.log(`Prepared API tables for ${Object.keys(api).length} component pages.`);
