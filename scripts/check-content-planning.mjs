/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {expect} from '@playwright/test';

/** These actual copyable examples must be installed in both clean framework consumers. */
export const contentPlanningExampleIds=['rich-text-review-form','mentions-async-directory','import-create-reviewed-batch','resource-scheduler-recovery','gantt-reviewed-delivery','recurrence-finite-rule'];

/** Check real installed controls, their canonical values and confirmed host operations. */
export async function checkInstalledContentPlanning(page,region){
  const rich=await region('rich-text-review-form'),note=rich.getByRole('textbox',{name:'Review note',exact:true});
  await expect(note).toHaveAttribute('contenteditable','true');
  await rich.getByRole('button',{name:'Read note values',exact:true}).click();
  await expect(note).toBeFocused();await expect(rich.getByRole('alert')).toHaveText('Enter some text.');
  await note.fill('Installed registry review.');
  await rich.getByRole('button',{name:'Read note values',exact:true}).click();
  await expect(rich.getByRole('status')).toHaveText('Note: Installed registry review. | Locked: Read-only reference. | Disabled: false');
  const document=JSON.parse(await rich.locator('input[name="note"]').inputValue());
  expect(document.type).toBe('doc');expect(document.content[0].content).toEqual([{type:'text',text:'Installed registry review.'}]);
  await rich.getByRole('button',{name:'Reset note',exact:true}).click();
  await expect(note).toHaveText('');
  await expect(rich.locator('.bui-rich-toolbar').first().getByRole('button',{name:'Undo',exact:true})).toBeDisabled();

  const mentions=await region('mentions-async-directory'),comment=mentions.getByRole('textbox',{name:'Comment with people',exact:true});
  await expect(comment).toHaveAttribute('contenteditable','true');await comment.fill('@ma');
  await expect(page.getByRole('option',{name:/Maya Chen/})).toBeVisible();
  await comment.press('Enter');await expect(comment).toBeFocused();
  await expect(comment.locator('[data-type="mention"]')).toHaveAttribute('data-id','person-maya');
  await mentions.getByRole('button',{name:'Read comment values',exact:true}).click();
  const mentioned=JSON.parse(await mentions.locator('input[name="comment"]').inputValue());
  expect(mentioned.content[0].content.find(node=>node.type==='mention')?.attrs).toEqual({id:'person-maya',label:'Maya Chen'});
  await expect(mentions.getByRole('status')).toContainText('"id":"person-maya"');

  const csv=await region('import-create-reviewed-batch');
  await csv.getByRole('textbox',{name:'Or paste CSV',exact:true}).fill('id,name,quantity,restock,approved\nSKU-901,Installed registry row,3,2026-12-01,true');
  await csv.getByRole('button',{name:'Read CSV',exact:true}).click();
  await expect(csv.getByRole('table')).toContainText('Installed registry row');
  await csv.getByRole('button',{name:'Review import',exact:true}).click();
  const applyImport=csv.getByRole('button',{name:'Apply 1 row',exact:true});await expect(applyImport).toBeDisabled();
  await csv.getByRole('checkbox',{name:'I reviewed 1 row and its mapping',exact:true}).check();await applyImport.click();
  await expect(csv.getByRole('status').filter({hasText:'1 row was acknowledged by your service.'})).toBeVisible();
  await expect(csv.getByText('Saved IDs: SKU-901',{exact:true})).toBeVisible();

  const scheduler=await region('resource-scheduler-recovery'),booking=scheduler.getByRole('button',{name:'Edit Interface review',exact:true}).filter({visible:true}).first();
  await booking.scrollIntoViewIfNeeded();await booking.focus();await booking.press('ArrowRight');
  await expect(booking).toBeFocused();await expect(scheduler.getByLabel('Scheduler save request IDs',{exact:true})).toHaveText('[]');
  await booking.press('Enter');const bookingReview=page.getByRole('dialog',{name:'Review scheduled event',exact:true});
  await expect(bookingReview).toBeVisible();await expect(bookingReview.getByRole('combobox',{name:'Start time',exact:true})).toContainText('09:15');
  await bookingReview.getByRole('button',{name:'Save change',exact:true}).click();await expect(bookingReview).toBeHidden();
  await expect(scheduler.locator('.bui-resource-scheduler-status')).toHaveText('Schedule change confirmed.');await expect(booking).toBeFocused();
  expect(JSON.parse(await scheduler.getByLabel('Scheduler save request IDs',{exact:true}).innerText())).toHaveLength(1);
  await scheduler.getByRole('button',{name:'Exact table',exact:true}).click();
  const savedBooking=scheduler.getByRole('row').filter({has:page.getByRole('button',{name:'Interface review',exact:true})});
  await expect(savedBooking).toContainText('2026-11-16T09:15:00.000Z');await expect(savedBooking).toContainText('2026-11-16T10:15:00.000Z');

  const gantt=await region('gantt-reviewed-delivery'),task=gantt.getByRole('button',{name:'Edit Interface plan',exact:true}).filter({visible:true}).first();
  await task.scrollIntoViewIfNeeded();await task.focus();await task.press('ArrowRight');
  await expect(task).toBeFocused();await expect(gantt.getByLabel('Gantt save request IDs',{exact:true})).toHaveText('[]');
  await task.press('Enter');const taskReview=page.getByRole('dialog',{name:'Review task plan',exact:true});
  await expect(taskReview).toBeVisible();await expect(taskReview.getByLabel('Start date',{exact:true})).toHaveValue('2026-11-17');
  await expect(taskReview.getByLabel('Exclusive end date',{exact:true})).toHaveValue('2026-11-19');
  await taskReview.getByRole('button',{name:'Save task change',exact:true}).click();await expect(taskReview).toBeHidden();
  await expect(gantt.locator('.bui-gantt-status')).toHaveText('Task change confirmed.');await expect(task).toBeFocused();
  expect(JSON.parse(await gantt.getByLabel('Gantt save request IDs',{exact:true}).innerText())).toHaveLength(1);
  await gantt.getByRole('button',{name:'Exact table',exact:true}).click();
  const savedTask=gantt.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Interface plan',exact:true})});
  await expect(savedTask).toContainText('2026-11-17');await expect(savedTask).toContainText('2026-11-19');

  const recurrence=await region('recurrence-finite-rule'),rule=recurrence.getByRole('region',{name:'Review recurrence',exact:true});
  await rule.getByRole('textbox',{name:'Base occurrences',exact:true}).fill('2');
  await expect(rule.locator('[data-recurrence-count]')).toHaveText('2 occurrences');
  await expect(recurrence.locator('[data-recurrence-host]')).toHaveText('Host revision: 1 | Save attempts: 0');
  await rule.getByRole('button',{name:'Apply change',exact:true}).click();
  await expect(recurrence.locator('[data-recurrence-host]')).toHaveText('Host revision: 2 | Save attempts: 1');
  await expect(rule.locator('[data-recurrence-status]')).toHaveText('Change confirmed at revision 2.');
}
