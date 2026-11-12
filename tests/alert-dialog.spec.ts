import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function example(page:Page,id:string){
  await page.goto('/components/alert-dialog');const section=page.locator('[data-example-id="'+id+'"]'),run=section.getByRole('button',{name:'Run example',exact:true});
  if(await run.count()&&await run.isVisible())await run.click();await expect(section.locator('[data-example-ready]')).toBeVisible();return section;
}

test('alert confirmation focuses Cancel, traps focus, resists outside press and restores safe focus',async({page})=>{
  const section=await example(page,'alert-dialog-delete'),trigger=section.getByRole('button',{name:'Delete draft',exact:true});await trigger.click();const dialog=page.getByRole('alertdialog',{name:'Delete this draft?',exact:true}),cancel=dialog.getByRole('button',{name:'Cancel',exact:true}),confirm=dialog.getByRole('button',{name:'Delete draft',exact:true});
  await expect(cancel).toBeFocused();await expect(dialog).toHaveAttribute('aria-describedby',/.+/);await cancel.press('Shift+Tab');await expect(confirm).toBeFocused();await confirm.press('Tab');await expect(cancel).toBeFocused();
  await page.mouse.click(4,4);await expect(dialog).toBeVisible();await dialog.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();await expect(section.getByRole('status')).toHaveText('Draft available');
  await trigger.click();await page.getByRole('alertdialog').getByRole('button',{name:'Delete draft',exact:true}).click();await expect(dialog).toBeHidden();await expect(section.getByRole('status')).toHaveText('Draft deleted locally');await expect(section.getByRole('button',{name:'Create another draft',exact:true})).toBeFocused();
});

test('pending host work rejects safely, prevents duplicate requests and retries with focus recovery',async({page})=>{
  const section=await example(page,'alert-dialog-pending-recovery');await section.getByRole('button',{name:'Prepare export',exact:true}).click();const dialog=page.getByRole('alertdialog',{name:'Prepare a local export?',exact:true}),confirm=dialog.getByRole('button',{name:'Retry export',exact:true});
  await confirm.evaluate(node=>{(node as HTMLButtonElement).click();(node as HTMLButtonElement).click();});await expect(dialog).toHaveAttribute('aria-busy','true');await expect(section.getByLabel('Export request count')).toHaveText('Requests: 1');await expect(dialog.getByRole('button',{name:'Preparing export…',exact:true})).toBeDisabled();
  await expect(dialog.getByRole('alert')).toHaveText('The sample export failed. Retry to recover.');await expect(confirm).toBeFocused();await expect(dialog).not.toHaveAttribute('aria-busy','true');await confirm.click();await expect(dialog).toBeHidden();await expect(section.getByRole('status',{name:'Export result',exact:true})).toHaveText('Local export prepared');await expect(section.getByLabel('Export request count')).toHaveText('Requests: 2');
});

test('Cancel and reset abort a held task without performing its local action',async({page})=>{
  const section=await example(page,'alert-dialog-pending-recovery'),trigger=section.getByRole('button',{name:'Prepare export',exact:true});await trigger.click();let dialog=page.getByRole('alertdialog');await dialog.getByRole('checkbox',{name:'Hold request until cancelled',exact:true}).check();await dialog.getByRole('button',{name:'Retry export',exact:true}).click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();await expect(section.getByLabel('Export cancellation count')).toHaveText('Aborted tasks: 1');
  await trigger.click();dialog=page.getByRole('alertdialog');await dialog.getByRole('button',{name:'Retry export',exact:true}).click();await dialog.getByRole('button',{name:'Reset request',exact:true}).click();await expect(dialog).not.toHaveAttribute('aria-busy','true');await expect(dialog.getByRole('button',{name:'Retry export',exact:true})).toBeEnabled();await expect(section.getByLabel('Export cancellation count')).toHaveText('Aborted tasks: 2');await expect(section.locator('[aria-label="Export result"]')).toHaveText('No export prepared');
});

test('late resolution after cancellation cannot close a newly opened confirmation',async({page})=>{
  const section=await example(page,'alert-dialog-pending-recovery');await page.clock.install();const trigger=section.getByRole('button',{name:'Prepare export',exact:true});await trigger.click();let dialog=page.getByRole('alertdialog');await dialog.getByRole('checkbox',{name:'Let the sample finish after cancellation',exact:true}).check();await dialog.getByRole('button',{name:'Retry export',exact:true}).click();await dialog.press('Escape');await expect(dialog).toBeHidden();await trigger.click();dialog=page.getByRole('alertdialog');await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.clock.fastForward(800);await expect(dialog).toBeVisible();await expect(dialog.getByRole('alert')).toHaveCount(0);await expect(section.locator('[aria-label="Export result"]')).toHaveText('No export prepared');
});

test('typed target validation is host-owned and resets after cancellation',async({page})=>{
  const section=await example(page,'alert-dialog-type-confirm'),trigger=section.getByRole('button',{name:'Archive project',exact:true});await trigger.click();let dialog=page.getByRole('alertdialog'),field=dialog.getByRole('textbox',{name:'Project name',exact:true}),confirm=dialog.getByRole('button',{name:'Archive ARCHIVE',exact:true});await expect(confirm).toBeDisabled();await field.fill('archive');await expect(confirm).toBeDisabled();await field.fill('ARCHIVE');await expect(confirm).toBeEnabled();await field.press('Enter');await expect(dialog).toBeVisible();await dialog.press('Escape');await trigger.click();dialog=page.getByRole('alertdialog');field=dialog.getByRole('textbox',{name:'Project name',exact:true});await expect(field).toHaveValue('');await field.fill('ARCHIVE');await dialog.getByRole('button',{name:'Archive ARCHIVE',exact:true}).click();await expect(dialog).toBeHidden();await expect(section.getByRole('status')).toHaveText('ARCHIVE is archived locally');
});

test('dirty exit keeps a cancelled draft and explicit discard restores its local save and focus',async({page})=>{
  const section=await example(page,'alert-dialog-dirty-exit'),field=section.getByRole('textbox',{name:'Editor note',exact:true}),leave=section.getByRole('button',{name:'Leave editor',exact:true});await expect(leave).toBeDisabled();await field.fill('Unsaved review');await leave.click();let dialog=page.getByRole('alertdialog');await expect(dialog.getByRole('button',{name:'Keep editing',exact:true})).toBeFocused();await dialog.press('Escape');await expect(field).toHaveValue('Unsaved review');await expect(leave).toBeFocused();await leave.click();dialog=page.getByRole('alertdialog');await dialog.getByRole('button',{name:'Discard changes',exact:true}).click();await expect(dialog).toBeHidden();await expect(field).toHaveValue('Review before publishing.');await expect(field).toBeDisabled();await expect(section.getByRole('button',{name:'Open editor',exact:true})).toBeFocused();
});

test('normal dialog motion respects live reduction, keeps narrow layout and has no automated accessibility violations',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});const section=await example(page,'alert-dialog-delete');await section.getByRole('button',{name:'Delete draft',exact:true}).click();const dialog=page.getByRole('alertdialog');
  for(const theme of ['light','dark']){await page.evaluate(value=>document.documentElement.setAttribute('data-ui-theme',value),theme);const box=await dialog.boundingBox();expect(box?.x).toBeGreaterThanOrEqual(0);expect((box?.x??0)+(box?.width??0)).toBeLessThanOrEqual(390);}
  expect(await dialog.evaluate(node=>getComputedStyle(node).transitionDuration)).not.toBe('0s');await page.emulateMedia({reducedMotion:'reduce'});expect(await dialog.evaluate(node=>getComputedStyle(node).transitionDuration)).toBe('0s');await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();const results=await new AxeBuilder({page}).include('.bui-alert-dialog').analyze();expect(results.violations).toEqual([]);
});
