import {expect} from '@playwright/test';

async function ready(getExample,id){const example=getExample(id),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();return example;}
async function center(cell){await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();}
async function canonical(example,label,id){return JSON.parse((await example.getByLabel(label,{exact:true}).textContent())||'[]').find(row=>row.id===id);}
async function contained(page,popup){const box=await popup.boundingBox(),viewport=page.viewportSize();expect(box).not.toBeNull();expect(viewport).not.toBeNull();expect(box.x).toBeGreaterThanOrEqual(-.5);expect(box.y).toBeGreaterThanOrEqual(-.5);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+.5);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+.5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

/** Exercise the same canonical editor transactions in docs and clean source consumers. */
export async function checkMixedGridEditors(page,getExample){
  const example=await ready(getExample,'grid-editor-mixed'),grid=example.getByRole('grid',{name:'Delivery editor grid',exact:true});await expect(grid).toBeVisible();
  const approved=grid.getByRole('gridcell',{name:'Approved for REC-1',exact:true});
  await center(approved);await approved.press('Enter');let checkbox=grid.getByRole('checkbox',{name:'Approved for REC-1',exact:true});await expect(checkbox).toBeFocused();
  await checkbox.press('Space');await expect(checkbox).toBeChecked();await checkbox.press('Escape');await expect(approved).toBeFocused();expect((await canonical(example,'Delivery canonical values','REC-1')).approved).toBe(false);
  await approved.press('Enter');checkbox=grid.getByRole('checkbox',{name:'Approved for REC-1',exact:true});await checkbox.press('Space');await checkbox.press('Enter');
  await expect(approved).toBeFocused();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).approved).toBe(true);
  await example.getByRole('button',{name:'Undo',exact:true}).click();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).approved).toBe(false);
  await example.getByRole('button',{name:'Redo',exact:true}).click();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).approved).toBe(true);

  const due=grid.getByRole('gridcell',{name:'Due date for REC-1',exact:true});await center(due);await due.press('Enter');
  const datePanel=page.getByRole('dialog',{name:'Edit due date',exact:true});await expect(datePanel).toBeVisible();await contained(page,datePanel);
  const date=datePanel.getByRole('textbox',{name:'Due date for REC-1',exact:true});await expect(date).toBeFocused();await date.fill('2026-11-28');await date.press('Enter');
  await datePanel.getByRole('button',{name:'Open due date for rec-1 calendar',exact:true}).click();
  const calendar=page.getByRole('dialog',{name:'Due date for REC-1',exact:true});await expect(calendar).toBeVisible();await contained(page,calendar);
  await calendar.getByRole('button',{name:'Sunday, November 29th, 2026',exact:true}).click();await expect(calendar).toBeHidden();await expect(datePanel).toBeVisible();
  expect((await canonical(example,'Delivery canonical values','REC-1')).due).toBe('2026-11-20');
  await datePanel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(datePanel).toBeHidden();await expect(due).toBeFocused();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).due).toBe('2026-11-29');

  const assignees=grid.getByRole('gridcell',{name:'Assignees for REC-1',exact:true});await center(assignees);await assignees.press('Enter');
  const peoplePanel=page.getByRole('dialog',{name:'Edit assignees',exact:true});await expect(peoplePanel).toBeVisible();await contained(page,peoplePanel);
  const search=peoplePanel.getByRole('combobox',{name:'Assignees for REC-1',exact:true});await search.fill('Oliver');await page.getByRole('option',{name:'Oliver Reed',exact:true}).click();
  expect((await canonical(example,'Delivery canonical values','REC-1')).assignees).toEqual(['maya']);
  await search.press('ArrowDown');await expect(page.getByRole('listbox',{name:'Assignees for REC-1 options',exact:true})).toBeVisible();await search.press('Escape');await expect(peoplePanel).toBeVisible();await peoplePanel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(peoplePanel).toBeHidden();await expect(assignees).toBeFocused();
  await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).assignees).toEqual(['maya','oliver']);
  await assignees.press('Shift+ArrowLeft');await page.keyboard.press('Shift+ArrowLeft');
  const copied=await grid.locator('[data-active]').evaluate(element=>{const data=new DataTransfer(),event=new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data});element.dispatchEvent(event);return event.clipboardData.getData('text/plain');});
  expect(copied).toBe('2026-11-29\ttrue\t"[""maya"",""oliver""]"');
  await page.keyboard.press('Escape');
  const other=grid.getByRole('gridcell',{name:'Due date for REC-2',exact:true});await center(other);
  await other.evaluate((element,text)=>{const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:new DataTransfer()});event.clipboardData.setData('text/plain',text);element.dispatchEvent(event);},copied);
  await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-2')).assignees).toEqual(['maya','oliver']);expect((await canonical(example,'Delivery canonical values','REC-2')).due).toBe('2026-11-29');expect((await canonical(example,'Delivery canonical values','REC-2')).approved).toBe(true);
  await example.getByRole('button',{name:'Save delivery draft',exact:true}).click();await expect(example.getByText('Saved together in this local example.',{exact:true})).toBeVisible();await expect(example.getByRole('button',{name:'Save delivery draft',exact:true})).toBeDisabled();
  // Exercise repeated invalid-to-valid recovery without moving the pressed action.
  for(const value of ['2026-11-24','2026-11-25','2026-11-26']){
    await center(due);await due.press('Enter');await expect(datePanel).toBeVisible();
    await date.fill('2026-02-30');const apply=datePanel.getByRole('button',{name:'Apply changes',exact:true});await apply.click();
    await expect(datePanel).toBeVisible();await expect(date).toHaveAttribute('aria-invalid','true');
    const before=await apply.boundingBox();expect(before).not.toBeNull();await date.fill(value);expect(await date.inputValue()).toBe(value);
    const after=await apply.boundingBox();expect(after).not.toBeNull();expect(Math.abs(after.x-before.x)).toBeLessThanOrEqual(1);expect(Math.abs(after.y-before.y)).toBeLessThanOrEqual(1);
    await apply.click();await expect(datePanel).toBeHidden();await expect(due).toBeFocused();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).due).toBe(value);
    await example.getByRole('button',{name:'Restore saved records',exact:true}).click();await expect.poll(async()=>(await canonical(example,'Delivery canonical values','REC-1')).due).toBe('2026-11-29');
  }
  const reduced=await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches),mark=approved.locator('.bui-data-grid-boolean');
  await page.emulateMedia({reducedMotion:'no-preference'});await expect.poll(()=>mark.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>mark.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(value=>parseFloat(value)===0))).toBe(true);
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
}

/** Public render hooks compose a hierarchical picker without changing its leaf IDs. */
export async function checkCustomGridEditor(page,getExample){
  const example=await ready(getExample,'grid-editor-custom'),grid=example.getByRole('grid',{name:'Custom team editor grid',exact:true});await expect(grid).toBeVisible();
  const cell=grid.getByRole('gridcell',{name:'Teams for OWN-1',exact:true});await center(cell);await cell.press('Enter');
  const panel=page.getByRole('dialog',{name:'Choose delivery teams',exact:true});await expect(panel).toBeVisible();await contained(page,panel);
  await panel.getByRole('button',{name:'Teams for OWN-1',exact:true}).click();const choices=page.getByRole('dialog',{name:'Teams for OWN-1 choices',exact:true});await expect(choices).toBeVisible();await contained(page,choices);
  const search=choices.getByRole('searchbox',{name:'Search teams for own-1 choices',exact:true});await search.fill('Motion');const motion=choices.getByRole('treeitem',{name:'Motion',exact:true});await expect(motion).toBeVisible();await motion.click();await expect(motion).toHaveAttribute('aria-checked','true');
  expect((await canonical(example,'Custom team canonical values','OWN-1')).teams).toEqual(['design-ui']);
  await choices.getByRole('button',{name:'Done',exact:true}).click();await expect(choices).toBeHidden();await expect(panel).toBeVisible();await panel.getByRole('button',{name:'Apply teams',exact:true}).click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();
  await expect.poll(async()=>(await canonical(example,'Custom team canonical values','OWN-1')).teams).toEqual(['design-ui','design-motion']);
  await cell.press('Enter');await expect(panel).toBeVisible();await panel.getByRole('button',{name:'Teams for OWN-1',exact:true}).click();await expect(choices).toBeVisible();await choices.getByRole('searchbox',{name:'Search teams for own-1 choices',exact:true}).fill('Accessibility');
  const accessibility=choices.getByRole('treeitem',{name:'Accessibility',exact:true});await accessibility.click();await choices.getByRole('button',{name:'Done',exact:true}).click();
  // Dismiss through a real outside pointer even when the popup covers the host action.
  const outside=example.getByRole('button',{name:'Outside editor action',exact:true});await outside.evaluate(element=>element.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  const actionBox=await outside.boundingBox(),panelBox=await panel.boundingBox(),viewport=page.viewportSize();expect(actionBox).not.toBeNull();expect(panelBox).not.toBeNull();expect(viewport).not.toBeNull();
  const actionX=actionBox.x+actionBox.width/2,actionY=actionBox.y+actionBox.height/2;
  if(actionX<panelBox.x||actionX>panelBox.x+panelBox.width||actionY<panelBox.y||actionY>panelBox.y+panelBox.height)await outside.click();
  else{await page.mouse.click(panelBox.x>1?1:viewport.width-1,1);await expect(panel).toBeHidden();await outside.click();}
  await expect(panel).toBeHidden();await expect(outside).toBeFocused();expect((await canonical(example,'Custom team canonical values','OWN-1')).teams).toEqual(['design-ui','design-motion']);
  const reduced=await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);await page.emulateMedia({reducedMotion:'reduce'});await center(cell);await cell.press('Enter');await expect(panel).toBeVisible();await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
}
