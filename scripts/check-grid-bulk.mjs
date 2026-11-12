import {expect} from '@playwright/test';

const read=async(example,label)=>JSON.parse((await example.getByLabel(label,{exact:true}).textContent())||'null');
async function choose(grid,label){const cell=grid.getByRole('gridcell',{name:label,exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();return cell;}
async function counts(example,batches,lastBatch,saves=0){await expect.poll(()=>read(example,'Bulk transaction counts')).toEqual({batches,lastBatch,saves});}

/** Exercise real host batches in documentation and clean installed-source consumers. */
export async function checkGridBulk(page,getExample){
  const example=getExample('grid-bulk-operations'),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();
  const grid=example.getByRole('grid',{name:'Bulk draft grid',exact:true}),fill=example.getByRole('button',{name:'Fill down',exact:true}),apply=example.getByRole('button',{name:'Apply value',exact:true});
  await expect(grid).toBeVisible();await expect(fill).toBeDisabled();await expect(apply).toBeDisabled();
  let cell=await choose(grid,'Estimate for BULK-1');await cell.press('Shift+ArrowDown');await page.keyboard.press('Shift+ArrowDown');
  await expect(fill).toBeEnabled();await fill.click();await counts(example,1,2);
  let rows=await read(example,'Bulk canonical values');expect(rows.map(row=>row.estimate)).toEqual([3,3,3,13]);expect(rows.map(row=>row.revision)).toEqual([1,2,3,4]);
  await example.getByRole('button',{name:'Undo',exact:true}).click();rows=await read(example,'Bulk canonical values');expect(rows.map(row=>row.estimate)).toEqual([3,5,8,13]);await expect(example.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await example.getByRole('button',{name:'Redo',exact:true}).click();expect((await read(example,'Bulk canonical values')).map(row=>row.estimate)).toEqual([3,3,3,13]);
  await example.getByRole('button',{name:'Restore bulk example',exact:true}).click();
  cell=await choose(grid,'Estimate for BULK-1');await cell.press('Shift+ArrowDown');await page.keyboard.press('Shift+ArrowDown');await page.keyboard.press('ControlOrMeta+Enter');await counts(example,1,2);
  expect((await read(example,'Bulk canonical values')).map(row=>row.estimate)).toEqual([8,8,8,13]);
  await example.getByRole('button',{name:'Undo',exact:true}).click();expect((await read(example,'Bulk canonical values')).map(row=>row.estimate)).toEqual([3,5,8,13]);
  await example.getByRole('button',{name:'Restore bulk example',exact:true}).click();
  cell=await choose(grid,'Estimate for BULK-1');await cell.press('Shift+ArrowRight');await apply.click();
  await expect(example.locator('.bui-data-grid-status')).toContainText('Nothing sent to the draft. Estimate for BULK-1:');await counts(example,0,0);expect((await read(example,'Bulk canonical values'))[0].estimate).toBe(3);await expect(example.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  cell=await choose(grid,'Task for BULK-1');await cell.press('ControlOrMeta+a');await page.keyboard.press('ControlOrMeta+d');await counts(example,1,11);
  rows=await read(example,'Bulk canonical values');expect(rows.map(row=>row.id)).toEqual(['BULK-1','BULK-2','BULK-3','BULK-4']);expect(rows.map(row=>row.revision)).toEqual([1,2,3,4]);expect(rows.every(row=>row.title==='Review keyboard focus'&&row.estimate===3&&row.approved&&row.people.join(',')==='maya')).toBe(true);
  await expect(example.getByRole('button',{name:'Save bulk draft',exact:true})).toBeEnabled();await example.getByRole('button',{name:'Save bulk draft',exact:true}).click();await counts(example,1,11,1);await expect(example.getByRole('button',{name:'Save bulk draft',exact:true})).toBeDisabled();
  await example.getByRole('button',{name:'Disable grid editing',exact:true}).click();await expect(fill).toBeDisabled();await expect(apply).toBeDisabled();
  cell=grid.getByRole('gridcell',{name:'Task for BULK-1',exact:true});await cell.focus();await cell.press('ControlOrMeta+d');await counts(example,1,11,1);
  await example.getByRole('button',{name:'Enable grid editing',exact:true}).click();
  cell=await choose(grid,'Record for BULK-1');await cell.press('Shift+ArrowDown');await expect(fill).toBeDisabled();await expect(apply).toBeDisabled();await cell.press('Escape');await counts(example,1,11,1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
