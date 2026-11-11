import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type {DataColumn} from '../packages/ui/src/data-workspace-state';
const example=(page:import('@playwright/test').Page,id:string)=>page.locator('[data-example-id="'+id+'"]');

test('grid presentation defaults reuse table view constraints and independent values',async()=>{
  const {createDataGridViewState}=await import('../packages/ui/dist/data-grid.js');
  type Row={id:string;revision:number;name:string;count:number};
  const columns:DataColumn<Row>[]=[{key:'id',label:'Key',type:'text',hideable:false,pinned:'start',width:80,minWidth:100},{key:'name',label:'Name',type:'text'},{key:'count',label:'Count',type:'number',pinned:'end'}];
  const first=createDataGridViewState(columns),second=createDataGridViewState(columns);
  expect(first).toEqual({columnOrderKeys:['id','name','count'],visibleColumnKeys:['id','name','count'],columnWidths:{id:100},columnPinning:{id:'start',count:'end'},density:'comfortable'});
  first.visibleColumnKeys.pop();first.columnWidths.id=900;expect(second.visibleColumnKeys).toEqual(['id','name','count']);expect(second.columnWidths.id).toBe(100);
});

test('column controls change layout without losing active cell identity',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true});
  const summary=grid.getByRole('gridcell',{name:'Summary for REC-21',exact:true});await summary.click();
  await demo.getByRole('button',{name:'Columns',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Grid layout',exact:true});await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('checkbox',{name:'Record',exact:true})).toBeDisabled();
  await dialog.getByRole('checkbox',{name:'Coordinator',exact:true}).uncheck();
  await dialog.getByRole('combobox',{name:'Pin Stage',exact:true}).click();await page.getByRole('option',{name:'Inline start',exact:true}).click();
  await dialog.getByRole('button',{name:'Move Summary later',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Grid density',exact:true}).click();await page.getByRole('option',{name:'Compact',exact:true}).click();
  await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();
  await expect(demo.getByRole('button',{name:'Columns',exact:true})).toBeFocused();
  await expect(grid.getByRole('columnheader')).toHaveText(['Record','Stage','Summary','Points']);
  await expect(grid.getByRole('gridcell',{name:'Coordinator for REC-21',exact:true})).toHaveCount(0);
  await expect(summary).toHaveAttribute('data-active','true');await expect(summary).toHaveAttribute('aria-selected','true');
  await expect(demo.getByLabel('Current grid density',{exact:true})).toHaveText('compact');
  const record=grid.getByRole('gridcell',{name:'Record for REC-21',exact:true}),stage=grid.getByRole('gridcell',{name:'Stage for REC-21',exact:true});
  await expect(record).toHaveCSS('inset-inline-start','0px');await expect(stage).toHaveCSS('inset-inline-start','112px');
  await demo.getByRole('button',{name:'Restore starting layout',exact:true}).click();await expect(grid.getByRole('columnheader')).toHaveText(['Record','Summary','Stage','Coordinator','Points']);
});

test('column resizing supports keyboard minimums and captured pointer movement',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),separator=demo.getByRole('separator',{name:'Resize Points',exact:true});
  await separator.focus();await separator.press('Home');await expect(separator).toHaveAttribute('aria-valuenow','88');await separator.press('ArrowRight');await expect(separator).toHaveAttribute('aria-valuenow','98');
  const rect=(await separator.boundingBox())!;await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+24,rect.y+rect.height/2,{steps:4});await page.mouse.up();
  await expect(separator).toHaveAttribute('aria-valuenow','122');
  const points=demo.getByRole('gridcell',{name:'Points for REC-21',exact:true});expect((await points.boundingBox())!.width).toBeCloseTo(122,0);
  await demo.getByRole('button',{name:'Restore starting layout',exact:true}).click();await expect(separator).toHaveAttribute('aria-valuenow','100');
});

test('visible pinned offsets stay aligned during scroll in both reading directions',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true}),scroll=demo.locator('.bui-data-grid-scroll');
  await demo.locator('.bui-data-grid').evaluate(node=>{node.style.maxWidth='420px';});
  const record=grid.getByRole('gridcell',{name:'Record for REC-21',exact:true}),points=grid.getByRole('gridcell',{name:'Points for REC-21',exact:true});
  const beforeRecord=(await record.boundingBox())!,beforePoints=(await points.boundingBox())!;
  await scroll.evaluate(node=>{node.scrollLeft=180;});const afterRecord=(await record.boundingBox())!,afterPoints=(await points.boundingBox())!;
  expect(afterRecord.x).toBeCloseTo(beforeRecord.x,0);expect(afterPoints.x+afterPoints.width).toBeCloseTo(beforePoints.x+beforePoints.width,0);
  await demo.getByRole('button',{name:'Use right-to-left layout',exact:true}).click();await scroll.evaluate(node=>{node.scrollLeft=0;});
  await expect(record).toHaveCSS('inset-inline-start','0px');await expect(points).toHaveCSS('inset-inline-end','0px');
  const rtlRecord=(await record.boundingBox())!,rtlPoints=(await points.boundingBox())!;await scroll.evaluate(node=>{node.scrollLeft=-180;});
  const shiftedRecord=(await record.boundingBox())!,shiftedPoints=(await points.boundingBox())!;
  expect(shiftedRecord.x+shiftedRecord.width).toBeCloseTo(rtlRecord.x+rtlRecord.width,0);expect(shiftedPoints.x).toBeCloseTo(rtlPoints.x,0);
});

test('sort editor adds unique criteria and changes priority without modifier keys',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-priority-sorting'),grid=demo.getByRole('grid',{name:'Sorted release queue',exact:true});
  await demo.getByRole('button',{name:'Sort · 2',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Sort records',exact:true});
  await dialog.getByRole('button',{name:'Add sort',exact:true}).click();const third=dialog.getByRole('combobox',{name:'Sort column 3',exact:true});await expect(third).toBeFocused();await expect(third).toContainText('Release phase');await expect(dialog.getByRole('button',{name:'Add sort',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Raise sort priority 3',exact:true}).click();await expect(dialog.getByRole('combobox',{name:'Sort column 2',exact:true})).toContainText('Release phase');
  await dialog.getByRole('combobox',{name:'Sort direction 2',exact:true}).click();await page.getByRole('option',{name:'Descending',exact:true}).click();
  await dialog.getByRole('button',{name:'Remove sort 1',exact:true}).click();await expect(dialog.getByRole('combobox',{name:'Sort column 1',exact:true})).toBeFocused();
  await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();await expect(demo.getByLabel('Active sort rules',{exact:true})).toHaveText('1. phase descending; 2. title ascending');
  await expect(grid.getByRole('columnheader').filter({hasText:'Release phase'})).toHaveAttribute('aria-sort','descending');
  await expect(grid.getByRole('columnheader').filter({hasText:'Release summary'})).toHaveAttribute('aria-sort','other');
  await expect(grid.getByRole('columnheader').filter({hasText:'Release priority'})).not.toHaveAttribute('aria-sort');
  await expect(grid.getByRole('button',{name:'Sort by Release',exact:true})).toHaveCount(0);
});

test('clearing the final sort focuses Add sort and leaves the grid usable',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-priority-sorting');await demo.getByRole('button',{name:'Sort · 2',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Sort records',exact:true});
  await dialog.getByRole('button',{name:'Clear sorting',exact:true}).click();await expect(dialog.getByRole('button',{name:'Add sort',exact:true})).toBeFocused();
  await dialog.getByRole('button',{name:'Add sort',exact:true}).click();await expect(dialog.getByRole('combobox',{name:'Sort column 1',exact:true})).toContainText('Release summary');
  await dialog.getByRole('button',{name:'Remove sort 1',exact:true}).click();await expect(dialog.getByRole('button',{name:'Add sort',exact:true})).toBeFocused();
  await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();await expect(demo.getByRole('grid',{name:'Sorted release queue',exact:true})).toBeVisible();
});

test('phone layout and sort controls fit the viewport and expose labelled controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout');await demo.getByRole('button',{name:'Columns',exact:true}).click();
  const layout=page.getByRole('dialog',{name:'Grid layout',exact:true});await expect(layout).toBeVisible();const rect=(await layout.boundingBox())!;expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({page}).include('[role="dialog"]').analyze()).violations).toEqual([]);
  await layout.getByRole('button',{name:'Close dialog',exact:true}).click();await example(page,'data-grid-priority-sorting').getByRole('button',{name:'Sort · 2',exact:true}).click();
  const sort=page.getByRole('dialog',{name:'Sort records',exact:true});await expect(sort).toBeVisible();expect((await new AxeBuilder({page}).include('[role="dialog"]').analyze()).violations).toEqual([]);
});


test('hiding a range anchor collapses to the surviving focused cell',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true});
  const stage=grid.getByRole('gridcell',{name:'Stage for REC-21',exact:true}),coordinator=grid.getByRole('gridcell',{name:'Coordinator for REC-22',exact:true});
  await stage.click();await coordinator.click({modifiers:['Shift']});await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
  await demo.getByRole('button',{name:'Toggle stage column',exact:true}).dispatchEvent('click');
  await expect(coordinator).toBeFocused();await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);await expect(coordinator).toHaveAttribute('aria-selected','true');
  const text=await coordinator.evaluate(node=>{const event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:new DataTransfer()});node.dispatchEvent(event);return event.clipboardData!.getData('text/plain');});
  expect(text).toBe('Imani Bell');
});

test('externally hiding the focused column restores the nearest surviving cell',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true});
  const stage=grid.getByRole('gridcell',{name:'Stage for REC-22',exact:true});await stage.click();
  await demo.getByRole('button',{name:'Toggle stage column',exact:true}).dispatchEvent('click');
  const next=grid.getByRole('gridcell',{name:'Coordinator for REC-22',exact:true});await expect(next).toBeFocused();await expect(next).toHaveAttribute('aria-selected','true');await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
});

test('outside controls retain focus when they hide the previously active column',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true});
  await grid.getByRole('gridcell',{name:'Stage for REC-22',exact:true}).click();const button=demo.getByRole('button',{name:'Toggle stage column',exact:true});await button.click();
  await expect(button).toBeFocused();await expect(grid.getByRole('gridcell',{name:'Stage for REC-22',exact:true})).toHaveCount(0);
});


test('hiding a choice editor column cancels it and restores a surviving cell',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true}),stage=grid.getByRole('gridcell',{name:'Stage for REC-21',exact:true});
  await stage.click();await stage.press('Enter');await expect(page.getByRole('listbox')).toBeVisible();
  await demo.getByRole('button',{name:'Toggle stage column',exact:true}).dispatchEvent('click');
  await expect(grid.getByRole('gridcell',{name:'Coordinator for REC-21',exact:true})).toBeFocused();await expect(page.getByRole('listbox')).toHaveCount(0);
  await demo.getByRole('button',{name:'Toggle stage column',exact:true}).dispatchEvent('click');await expect(stage).toContainText('Review');
});

test('hiding an adjacent column keeps the surviving native editor draft',async({page})=>{
  await page.goto('/components/data-grid');const demo=example(page,'data-grid-column-layout'),grid=demo.getByRole('grid',{name:'Portable record layout',exact:true}),cell=grid.getByRole('gridcell',{name:'Coordinator for REC-22',exact:true});
  await cell.click();await cell.press('Enter');const editor=grid.getByRole('textbox',{name:'Coordinator for REC-22',exact:true});await editor.fill('Temporary coordinator');
  await demo.getByRole('button',{name:'Toggle stage column',exact:true}).dispatchEvent('click');await expect(editor).toBeFocused();await expect(editor).toHaveValue('Temporary coordinator');
  await editor.press('Escape');await expect(cell).toBeFocused();await expect(cell).toContainText('Imani Bell');
});
