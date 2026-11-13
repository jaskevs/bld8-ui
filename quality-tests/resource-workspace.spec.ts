import {test,expect,openQualityPage,expectContained} from './fixtures';

test('adjustable panels preserve focus, logical sizing and reduced motion in both viewport modes',async({page},info)=>{
  await openQualityPage(page,'/components/resizable-panels/examples/resizable-workspace-panes',info);
  const group=page.getByRole('group',{name:'Workspace panels',exact:true});await expect(group).toBeVisible();
  const handle=group.getByRole('separator');
  if((page.viewportSize()?.width??0)>700){await expect(handle).toBeVisible();await handle.focus();const previous=Number(await handle.getAttribute('aria-valuenow'));await handle.press('ArrowLeft');await expect(handle).toHaveAttribute('aria-valuenow',String(previous-2));await expect(handle).toBeFocused();expect(await group.locator('.bui-resizable-part').first().evaluate(element=>getComputedStyle(element).transitionDuration)).not.toBe('0s');await page.emulateMedia({reducedMotion:'reduce'});expect(await group.locator('.bui-resizable-part').first().evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');}
  else {await expect(handle).toHaveCount(0);await expect(group.getByRole('region',{name:'Records',exact:true})).toBeVisible();await expect(group.getByRole('region',{name:'Inspector',exact:true})).toBeVisible();}
  await expectContained(page);
});

test('resource views retain canonical inventory editing and never include a private draft in shared state',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/resource-inventory-drafts',info);
  const grid=page.getByRole('grid',{name:'Inventory data grid',exact:true}),target=grid.locator('[data-row-id="SKU-101"][data-column-key="name"]');
  await target.scrollIntoViewIfNeeded();await target.focus();await target.press('Enter');const editor=target.getByRole('textbox');await editor.fill('Private inventory draft');await editor.press('Enter');await expect(target).toBeFocused();await page.getByRole('button',{name:'Share current view',exact:true}).click();expect(decodeURIComponent(page.url())).not.toContain('Private inventory draft');await expect(page.getByRole('button',{name:'Review changes',exact:true})).toBeVisible();await expectContained(page);
});
