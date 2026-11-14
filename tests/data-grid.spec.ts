import {test,expect} from '@playwright/test';
import {gridPasteEdits,gridRangeBounds,gridRangeContains,parseGridClipboard,serializeGridClipboard} from '../packages/ui/src/data-grid-state';
import type {DataColumn} from '../packages/ui/src/data-workspace-state';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

interface Row {id:string;revision:number;title:string;count:number;status:string}
const rows:Row[]=[{id:'A-1',revision:1,title:'First',count:1,status:'open'},{id:'A-2',revision:1,title:'Second',count:2,status:'closed'}];
const columns:DataColumn<Row>[]=[{key:'id',label:'ID',type:'text',editable:false},{key:'title',label:'Title',type:'text',editable:true},{key:'count',label:'Count',type:'number',editable:true},{key:'status',label:'Status',type:'select',editable:true,options:[{value:'open',label:'Open'},{value:'closed',label:'Closed'}]}];

test('quoted clipboard cells preserve embedded tabs, newlines, quotes and terminal blanks',()=>{
  expect(parseGridClipboard('"A\tB"\t"Line 1\nLine 2"\r\n"Say ""hello"""\t\r\n')).toEqual([['A\tB','Line 1\nLine 2'],['Say "hello"','']]);
  expect(parseGridClipboard('')).toEqual([['']]);
  expect(parseGridClipboard('\t\n')).toEqual([['','']]);
  const values=[['plain','two\twords'],['new\nline','quote " here']];
  expect(parseGridClipboard(serializeGridClipboard(values))).toEqual(values);
});

test('clipboard export protects formula strings without changing typed negative numbers',()=>{
  expect(serializeGridClipboard([['=SUM(1,2)',' +3','-7','@lookup',-7,0,null]])).toBe("'=SUM(1,2)\t' +3\t'-7\t'@lookup\t-7\t0\t");
});

test('clipboard rejects malformed, jagged and oversized input before editing',()=>{
  for(const text of ['"unfinished','"closed"suffix','unquoted"quote','a\tb\nc','a\tb\n\n'])expect(()=>parseGridClipboard(text),text).toThrow();
  expect(()=>parseGridClipboard('a'.repeat(65_537))).toThrow(/64 KiB/);
  expect(()=>parseGridClipboard('漢'.repeat(30_000))).toThrow(/64 KiB/);
  expect(()=>parseGridClipboard(Array.from({length:101},()=> 'a').join('\n'))).toThrow(/100 rows/);
  expect(()=>parseGridClipboard(Array.from({length:21},()=> 'a').join('\t'))).toThrow(/20 columns/);
  expect(()=>serializeGridClipboard([['漢'.repeat(30_000)]])).toThrow(/64 KiB/);
  expect(()=>serializeGridClipboard([['a'],['b','c']])).toThrow();
});

test('paste resolves every loaded cell once and keeps invalid raw values for validation',()=>{
  const before=JSON.stringify(rows);
  expect(gridPasteEdits(rows,columns,{row:0,column:1},'New title\tnot a number\nNext title\t9')).toEqual([
    {id:'A-1',key:'title',value:'New title'},{id:'A-1',key:'count',value:'not a number'},
    {id:'A-2',key:'title',value:'Next title'},{id:'A-2',key:'count',value:'9'},
  ]);
  expect(JSON.stringify(rows)).toBe(before);
});

test('paste rejects the whole range for readonly columns or unloaded rows without truncation',()=>{
  expect(()=>gridPasteEdits(rows,columns,{row:0,column:0},'Replacement ID\tTitle')).toThrow(/read-only/);
  expect(()=>gridPasteEdits(rows,columns,{row:1,column:1},'A\nB')).toThrow(/loaded rows/);
  expect(()=>gridPasteEdits(rows,columns,{row:0,column:3},'open\textra')).toThrow(/loaded rows/);
  expect(()=>gridPasteEdits(rows,columns,{row:-1,column:1},'A')).toThrow(/Choose/);
  expect(()=>gridPasteEdits(rows,columns,{row:0,column:1.5},'A')).toThrow(/Choose/);
  const implicit=columns.map(column=>({...column,editable:undefined}));
  expect(()=>gridPasteEdits(rows,implicit,{row:0,column:1},'A')).toThrow(/read-only/);
});

test('range bounds work in all four directions without altering the anchor',()=>{
  const range={anchor:{row:3,column:4},focus:{row:1,column:2}};
  expect(gridRangeBounds(range)).toEqual({top:1,bottom:3,left:2,right:4});
  expect(gridRangeContains(range,{row:2,column:3})).toBe(true);
  expect(gridRangeContains(range,{row:0,column:3})).toBe(false);
  expect(gridRangeContains(range,{row:2,column:5})).toBe(false);
  expect(range.anchor).toEqual({row:3,column:4});
});

test('server-rendered grid has one roving cell, read-only identity and escaped values',async()=>{
  const {DataGrid}=await import('../packages/ui/dist/data-grid.js');
  const html=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Records',rows:[{...rows[0],title:'<script>unsafe</script>'}],columns,onEdit:()=>{}}));
  expect(html).toContain('role="grid"');expect(html).toContain('aria-label="Records"');
  expect(html.match(/role="gridcell"/g)).toHaveLength(4);
  expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  expect(html).toContain('aria-readonly="true"');
  expect(html).toContain('&lt;script&gt;unsafe&lt;/script&gt;');expect(html).not.toContain('<script>');
});

test('grid refuses ambiguous identities and unbounded pages before rendering cell controls',async()=>{
  const {DataGrid}=await import('../packages/ui/dist/data-grid.js');
  const duplicate=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Records',rows:[rows[0],rows[0]],columns}));
  expect(duplicate).toContain('role="alert"');expect(duplicate).not.toContain('role="gridcell"');
  const oversized=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Records',rows:Array.from({length:101},(_,index)=>({...rows[0],id:'row-'+index})),columns}));
  expect(oversized).toContain('100 records');expect(oversized).not.toContain('role="gridcell"');
});

test('grid keyboard range selection, editor cancellation and copy retain cell identity',async({page})=>{
  await page.goto('/blocks/data-workspace');
  const grid=page.getByRole('grid',{name:'Issue data grid'});
  const title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});
  await expect(title).toBeVisible();await title.click();
  await title.press('Shift+ArrowRight');
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(2);
  await page.keyboard.press('Shift+ArrowDown');
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
  const focused=grid.locator('[data-active]');
  const copied=await focused.evaluate(node=>{const event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:new DataTransfer()});node.dispatchEvent(event);return event.clipboardData!.getData('text/plain');});
  expect(parseGridClipboard(copied)).toHaveLength(2);
  await page.keyboard.press('Escape');await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
  await title.click();await title.press('F2');
  const editor=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});
  await expect(editor).toBeFocused();await editor.fill('A draft that is cancelled');await editor.press('Escape');
  await expect(title).toBeFocused();await expect(title).not.toContainText('A draft that is cancelled');
});

test('rapid range keys move DOM focus immediately when animation frames are paused',async({page})=>{
  await page.goto('/blocks/data-workspace');const grid=page.getByRole('grid',{name:'Issue data grid'}),title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});
  await expect(title).toBeVisible();
  await page.evaluate(()=>{const host=window as Window&{gridOriginalRaf?:typeof requestAnimationFrame};host.gridOriginalRaf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;});
  try{
    await title.focus();await page.keyboard.press('Shift+ArrowRight');
    await expect(grid.getByRole('gridcell',{name:'Status for ISS-101',exact:true})).toBeFocused();
    await page.keyboard.press('Shift+ArrowDown');
    await expect(grid.getByRole('gridcell',{name:'Status for ISS-102',exact:true})).toBeFocused();
    await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
    await page.keyboard.press('Escape');await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
  }finally{await page.evaluate(()=>{const host=window as Window&{gridOriginalRaf?:typeof requestAnimationFrame};if(host.gridOriginalRaf)window.requestAnimationFrame=host.gridOriginalRaf;delete host.gridOriginalRaf;});}
});

test('shift-click extends the existing anchor and copies its rectangular range',async({page})=>{
  await page.goto('/blocks/data-workspace');const grid=page.getByRole('grid',{name:'Issue data grid'}),title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true}),end=grid.getByRole('gridcell',{name:'Status for ISS-102',exact:true});
  await expect(title).toBeVisible();await title.click();await end.click({modifiers:['Shift']});
  await expect(end).toBeFocused();await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
  const copied=await end.evaluate(node=>{const event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:new DataTransfer()});node.dispatchEvent(event);return event.clipboardData!.getData('text/plain');});
  expect(parseGridClipboard(copied)).toEqual([['Refine dialog focus','review'],['Keyboard shortcuts','in-progress']]);
});

for(const theme of ['light','dark'])test(`pointer selection in ${theme} is one outlined range without native text highlights`,async({page})=>{
  await page.goto('/blocks/data-workspace');await page.evaluate(theme=>{document.documentElement.dataset.uiTheme=theme;},theme);
  const grid=page.getByRole('grid',{name:'Issue data grid'}),start=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true}),end=grid.getByRole('gridcell',{name:'Status for ISS-103',exact:true});
  await expect(start).toBeVisible();await expect(grid.locator('[aria-selected=true]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Copy cells',exact:true})).toBeDisabled();
  await end.scrollIntoViewIfNeeded();const from=(await start.boundingBox())!,to=(await end.boundingBox())!;
  await page.mouse.move(from.x+24,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:12});await page.mouse.up();
  await expect(grid.locator('[aria-selected=true]')).toHaveCount(6);await expect(end).toBeFocused();
  expect(await page.evaluate(()=>window.getSelection()?.toString())).toBe('');
  const borders=async(cell:typeof start)=>cell.evaluate(node=>{const css=getComputedStyle(node,'::before');return [css.borderTopWidth,css.borderRightWidth,css.borderBottomWidth,css.borderLeftWidth];});
  expect(await borders(start)).toEqual(['1px','0px','0px','1px']);
  expect(await borders(grid.getByRole('gridcell',{name:'Title for ISS-102',exact:true}))).toEqual(['0px','0px','0px','1px']);
  expect(await borders(end)).toEqual(['0px','1px','1px','0px']);
  await expect(end).toHaveCSS('outline-style','none');await expect(grid.locator('.bui-data-grid-range-corner')).toHaveCount(1);
  const copied=await end.evaluate(node=>{const event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:new DataTransfer()});node.dispatchEvent(event);return event.clipboardData!.getData('text/plain');});
  expect(parseGridClipboard(copied)).toEqual([['Refine dialog focus','review'],['Keyboard shortcuts','in-progress'],['Empty-state copy','backlog']]);
  await start.click();await expect(grid.locator('[aria-selected=true]')).toHaveCount(1);await expect(grid.locator('.bui-data-grid-range-corner')).toHaveCount(0);
});

test('grid editors keep native text selection and double-click never resets the draft',async({page})=>{
  await page.goto('/blocks/data-workspace');const grid=page.getByRole('grid',{name:'Issue data grid'}),cell=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});
  await cell.dblclick();const editor=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});await editor.fill('Keep this draft while selecting text');await editor.dblclick();
  await expect(editor).toHaveValue('Keep this draft while selecting text');await expect(editor).toHaveCSS('user-select','text');
  await editor.press('ControlOrMeta+A');expect(await editor.evaluate(node=>({start:(node as HTMLInputElement).selectionStart,end:(node as HTMLInputElement).selectionEnd}))).toEqual({start:0,end:36});
  await editor.press('Escape');await expect(cell).toContainText('Refine dialog focus');await expect(cell).toBeFocused();
});

for(const theme of ['light','dark'])test(`inline editor in ${theme} shares one cell boundary without nested focus rings`,async({page})=>{
  await page.goto('/blocks/data-workspace');await page.evaluate(theme=>{document.documentElement.dataset.uiTheme=theme;},theme);
  const grid=page.getByRole('grid',{name:'Issue data grid'}),cell=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});await expect(cell).toBeVisible();
  const before=await cell.boundingBox(),textLeft=await cell.locator('.bui-data-grid-value').evaluate(el=>el.getBoundingClientRect().left);
  await cell.dblclick();const editor=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});await expect(editor).toBeFocused();
  await expect(editor).toHaveCSS('outline-style','none');await expect(editor).toHaveCSS('box-shadow','none');await expect(editor).toHaveCSS('border-top-width','0px');await expect(editor).toHaveCSS('border-radius','0px');
  const after=await cell.boundingBox();expect(after!.height).toBe(before!.height);expect(Math.abs((await editor.boundingBox())!.x-textLeft)).toBeLessThanOrEqual(1);
  expect(await cell.evaluate(el=>{const css=getComputedStyle(el,'::before');return [css.borderTopWidth,css.borderRightWidth,css.borderBottomWidth,css.borderLeftWidth];})).toEqual(['1px','1px','1px','1px']);
  const editorSelection=await editor.evaluate(el=>getComputedStyle(el,'::selection').backgroundColor),fieldSelection=await page.getByRole('textbox',{name:'Search issues',exact:true}).evaluate(el=>getComputedStyle(el,'::selection').backgroundColor);expect(editorSelection).not.toBe(fieldSelection);
  await editor.fill('A clean inline edit');await editor.press('Enter');await expect(cell).toContainText('A clean inline edit');await expect(cell).toBeFocused();
});

test('grid rejects off-page and readonly paste without producing any drafts',async({page})=>{
  await page.goto('/blocks/data-workspace');const grid=page.getByRole('grid',{name:'Issue data grid'});
  const id=grid.getByRole('gridcell',{name:'Issue for ISS-101',exact:true});await id.click();
  await id.evaluate(node=>{const data=new DataTransfer();data.setData('text/plain','NOT-AN-ID\tNew title');node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));});
  await expect(page.locator('.bui-data-grid-status')).toContainText('read-only');
  await expect(grid.locator('[data-dirty]')).toHaveCount(0);
  const title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});await title.click();
  await title.evaluate(node=>{const data=new DataTransfer();data.setData('text/plain',Array.from({length:100},()=> 'Title').join('\n'));node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));});
  await expect(page.locator('.bui-data-grid-status')).toContainText('loaded rows');
  await expect(grid.locator('[data-dirty]')).toHaveCount(0);
});

test('double activation requires consecutive clicks on the same logical grid cell',async({page})=>{
  await page.goto('/blocks/data-workspace');const grid=page.getByRole('grid',{name:'Issue data grid',exact:true}),title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true}),assignee=grid.getByRole('gridcell',{name:'Assignee for ISS-101',exact:true});
  await title.click();await expect(title).toBeFocused();await expect(title).toHaveAttribute('aria-selected','true');
  const activate=async(cell:typeof title,detail:number)=>{await cell.evaluate((element,detail)=>{element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail}));if(detail===2)element.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,detail}));},detail);};
  // Chromium can emit this native click/detail sequence after two touches land on different cells.
  // Dispatch explicit details here so the regression does not depend on an OS double-tap interval.
  await activate(title,1);await activate(assignee,2);await expect(grid.locator('[data-editing]')).toHaveCount(0);await expect(assignee).toBeFocused();await expect(page.locator('.bui-data-grid-choice-popup')).toHaveCount(0);
  await assignee.press('Enter');const search=page.getByRole('combobox',{name:'Search Assignee for ISS-101 options',exact:true});await expect(search).toBeFocused();await search.press('Escape');await expect(assignee).toBeFocused();
  await activate(title,1);await activate(title,2);const editor=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});await expect(editor).toBeFocused();await editor.press('Escape');
  await page.getByRole('textbox',{name:'Search issues',exact:true}).click();await activate(title,2);await expect(grid.locator('[data-editing]')).toHaveCount(0);
  await grid.getByRole('columnheader').first().evaluate(element=>element.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'mouse',isPrimary:true,button:0})));await activate(title,2);await expect(grid.locator('[data-editing]')).toHaveCount(0);
  await title.dblclick();await expect(editor).toBeFocused();await editor.press('Escape');await expect(title).toBeFocused();await expect(grid.locator('[data-dirty]')).toHaveCount(0);
});
