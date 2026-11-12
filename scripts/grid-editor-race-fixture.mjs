import {expect} from '@playwright/test';

/** Test-only host fixture. This is embedded in full source consumers, never in public examples. */
export function createGridEditorRaceFixture(alias){
  return {
    imports:["import {useEffect as useGridRaceEffect,useRef as useGridRaceRef,useState as useGridRaceState} from 'react';","import {DataGrid as GridRaceDataGrid,type DataGridEditorContext as GridRaceEditorContext} from '"+alias+"/data-grid';","import {Button as GridRaceButton} from '"+alias+"/core';","import type {DataColumn as GridRaceColumn,DataEdit as GridRaceEdit} from '"+alias+"/data-workspace-state';"].join('\n'),
    element:'<GridEditorRaceFixture/>',
    source:String.raw`
interface GridRaceRow {id:string;revision:number;title:string;due:string}
function GridRaceInput({context,capture}:{context:GridRaceEditorContext<GridRaceRow>;capture:(context:GridRaceEditorContext<GridRaceRow>)=>void}){
  useGridRaceEffect(()=>capture(context),[context,capture]);
  return <input className="bui-data-grid-editor" aria-label={context.label} ref={context.inputRef} value={typeof context.draftValue==='string'?context.draftValue:''} disabled={context.disabled} onChange={event=>context.onValueChange(event.currentTarget.value)} onKeyDown={context.onKeyDown} onBlur={context.onBlur}/>;
}
function GridEditorRaceFixture(){
  const seed=()=>[{id:'RACE-1',revision:1,title:'Original title',due:'2026-11-20'}];
  const [rows,setRows]=useGridRaceState<GridRaceRow[]>(seed),[mode,setMode]=useGridRaceState<'enabled'|'readonly'|'disabled'>('enabled'),[present,setPresent]=useGridRaceState(true),[generation,setGeneration]=useGridRaceState(0),[callback,setCallback]=useGridRaceState(1);
  const [captured,setCaptured]=useGridRaceState(false),[result,setResult]=useGridRaceState('none'),[events,setEvents]=useGridRaceState<{callback:number;value:string}[]>([]);
  const retained=useGridRaceRef<GridRaceEditorContext<GridRaceRow>|null>(null);
  const columns:GridRaceColumn<GridRaceRow>[]=[{key:'id',label:'Race ID',type:'text',width:104,minWidth:104},{key:'title',label:'Race title',type:'text',editable:mode!=='readonly',required:true,minWidth:220},{key:'due',label:'Race date',type:'date',editable:mode!=='readonly',width:160}];
  function capture(context:GridRaceEditorContext<GridRaceRow>){if(!retained.current){retained.current=context;setCaptured(true);}}
  function edit(edits:GridRaceEdit<GridRaceRow>[]){
    for(const change of edits)if(typeof change.value==='string')setEvents(current=>[...current,{callback,value:change.value as string}]);
    setRows(current=>current.map(row=>edits.filter(change=>change.id===row.id).reduce((next,change)=>typeof change.value==='string'&&(change.key==='title'||change.key==='due')?{...next,[change.key]:change.value}:next,row)));
  }
  function reset(){retained.current=null;setRows(seed());setMode('enabled');setPresent(true);setGeneration(value=>value+1);setCallback(1);setCaptured(false);setResult('none');setEvents([]);}
  return <section data-grid-race-fixture style={{display:'grid',gap:12,minWidth:0}}>
    <h2>Grid editor lifecycle acceptance</h2>
    <GridRaceDataGrid key={generation} label="Grid permission fixture" rows={present?rows:[]} columns={columns} disabled={mode==='disabled'} onEdit={edit} renderEditor={context=>context.column.key==='title'?<GridRaceInput context={context} capture={capture}/>:undefined}/>
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      <GridRaceButton size="sm" variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>setMode('readonly')}>Race lock column</GridRaceButton>
      <GridRaceButton size="sm" variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>setMode('disabled')}>Race disable grid</GridRaceButton>
      <GridRaceButton size="sm" variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>setPresent(false)}>Race remove record</GridRaceButton>
      <GridRaceButton size="sm" variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>setRows(current=>current.map(row=>({...row,due:'2026-13-04'})))}>Race invalid date</GridRaceButton>
      <GridRaceButton size="sm" variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>setCallback(value=>value+1)}>Race next host callback</GridRaceButton>
      <GridRaceButton size="sm" variant="ghost" onMouseDown={event=>event.preventDefault()} onClick={()=>retained.current?.onValueChange('Stale buffer')}>Race retained change</GridRaceButton>
      <GridRaceButton size="sm" variant="ghost" onMouseDown={event=>event.preventDefault()} onClick={()=>retained.current?.cancel()}>Race retained cancel</GridRaceButton>
      <GridRaceButton size="sm" variant="ghost" onMouseDown={event=>event.preventDefault()} onClick={()=>setResult(String(retained.current?.commit('Delayed accepted')))}>Race retained apply</GridRaceButton>
      <GridRaceButton size="sm" variant="ghost">Race outside focus</GridRaceButton>
      <GridRaceButton size="sm" variant="ghost" onMouseDown={event=>event.preventDefault()} onClick={reset}>Reset grid race fixture</GridRaceButton>
    </div>
    <output aria-label="Grid race captured">{captured?'captured':'empty'}</output><output aria-label="Grid race result">{result}</output>
    <output aria-label="Grid race values" style={{overflowWrap:'anywhere'}}>{JSON.stringify(rows)}</output><output aria-label="Grid race events" style={{overflowWrap:'anywhere'}}>{JSON.stringify(events)}</output>
  </section>;
}
`
  };
}

export async function checkGridEditorRaceFixture(page){
  const root=page.locator('[data-grid-race-fixture]'),grid=root.getByRole('grid',{name:'Grid permission fixture',exact:true}),events=root.getByLabel('Grid race events',{exact:true}),values=root.getByLabel('Grid race values',{exact:true}),result=root.getByLabel('Grid race result',{exact:true}),outside=root.getByRole('button',{name:'Race outside focus',exact:true});
  const reset=async()=>{await root.getByRole('button',{name:'Reset grid race fixture',exact:true}).click();await expect(events).toHaveText('[]');await expect(root.getByLabel('Grid race captured',{exact:true})).toHaveText('empty');};
  const begin=async()=>{const cell=grid.getByRole('gridcell',{name:'Race title for RACE-1',exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();await cell.press('Enter');const input=grid.getByRole('textbox',{name:'Race title for RACE-1',exact:true});await expect(input).toBeFocused();await expect(root.getByLabel('Grid race captured',{exact:true})).toHaveText('captured');return input;};
  for(const action of ['Race lock column','Race disable grid','Race remove record']){
    await reset();const input=await begin();await input.fill('Unsaved permission draft');await root.getByRole('button',{name:action,exact:true}).click();await expect(input).toHaveCount(0);await expect(events).toHaveText('[]');await expect(values).toContainText('Original title');
    await outside.focus();await root.getByRole('button',{name:'Race retained apply',exact:true}).click();await expect(result).toHaveText('false');await expect(events).toHaveText('[]');await expect(outside).toBeFocused();
  }
  await reset();let input=await begin();await input.press('Escape');await expect(input).toHaveCount(0);input=await begin();await input.fill('Current draft');
  await root.getByRole('button',{name:'Race retained change',exact:true}).click();await expect(input).toHaveValue('Current draft');await expect(input).toBeFocused();
  await root.getByRole('button',{name:'Race retained cancel',exact:true}).click();await expect(input).toBeVisible();await expect(input).toBeFocused();
  await root.getByRole('button',{name:'Race retained apply',exact:true}).click();await expect(result).toHaveText('false');await expect(input).toHaveValue('Current draft');await expect(input).toBeFocused();await expect(events).toHaveText('[]');
  await input.press('Enter');await expect(events).toContainText('Current draft');expect(JSON.parse((await events.textContent())||'[]')).toHaveLength(1);
  await reset();input=await begin();await input.fill('Current pending value');await root.getByRole('button',{name:'Race next host callback',exact:true}).click();await expect(input).toBeFocused();await root.getByRole('button',{name:'Race retained apply',exact:true}).click();await expect(result).toHaveText('true');
  const receipt=JSON.parse((await events.textContent())||'[]');expect(receipt).toEqual([{callback:2,value:'Delayed accepted'}]);await expect(values).toContainText('Delayed accepted');
  await reset();await root.getByRole('button',{name:'Race invalid date',exact:true}).click();const dateCell=grid.getByRole('gridcell',{name:'Race date for RACE-1',exact:true});await dateCell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await dateCell.click();await dateCell.press('Enter');
  const rawDate=grid.getByRole('textbox',{name:'Race date for RACE-1',exact:true});await expect(rawDate).toBeFocused();await expect(rawDate).toHaveValue('2026-13-04');await rawDate.press('Enter');await expect(rawDate).toBeVisible();await expect(events).toHaveText('[]');
  await rawDate.fill('2026-11-26');await expect(rawDate).toBeFocused();await expect(page.getByRole('dialog',{name:'Edit race date',exact:true})).toHaveCount(0);await rawDate.press('Enter');await expect(rawDate).toHaveCount(0);await expect(values).toContainText('2026-11-26');expect(JSON.parse((await events.textContent())||'[]')).toEqual([{callback:1,value:'2026-11-26'}]);
  await dateCell.press('Enter');const datePanel=page.getByRole('dialog',{name:'Edit race date',exact:true});await expect(datePanel).toBeVisible();await expect(datePanel.getByRole('textbox',{name:'Race date for RACE-1',exact:true})).toHaveValue('2026-11-26');await datePanel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(datePanel).toBeHidden();await expect(dateCell).toBeFocused();
  await reset();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
