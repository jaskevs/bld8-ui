import {test,expect,openQualityPage} from './fixtures';

test('keyed motion preserves draft and focus while live reduced motion changes',async({page},info)=>{
 await openQualityPage(page,'/components/animated-list/examples/motion-list-updates',info);const region=page.locator('[data-example-id=motion-list-updates]');
 const input=region.getByRole('textbox',{name:'Title for one',exact:true});await input.fill('Keep this draft');await region.getByRole('button',{name:'Reverse order',exact:true}).click();await expect(input).toHaveValue('Keep this draft');
 await region.getByRole('button',{name:'Remove Keyboard review',exact:true}).click();await expect(region.getByRole('textbox',{name:'Title for two',exact:true})).toBeFocused();await page.emulateMedia({reducedMotion:'reduce'});await region.getByRole('button',{name:'Add update',exact:true}).click();await expect(region.getByRole('textbox',{name:'Title for 4',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('scoped RTL portals retain their theme and modal return focus',async({page},info)=>{
 await openQualityPage(page,'/components/dialog/examples/scoped-workspaces-overlays',info);const region=page.locator('[data-example-id=scoped-workspaces-overlays]'),trigger=region.getByRole('button',{name:'فتح المراجعة',exact:true});
 await trigger.click();const dialog=page.getByRole('dialog',{name:'لوحة المراجعة',exact:true});await expect(dialog).toBeVisible();expect(await dialog.evaluate(element=>{const scope=element.closest('[data-bui-scope]');return [scope?.getAttribute('dir'),scope?.getAttribute('data-ui-theme')];})).toEqual(['rtl','dark']);
 await dialog.getByRole('button',{name:'إغلاق الحوار',exact:true}).click();await expect(trigger).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('additional chart legends retain exact values and remain contained',async({page},info)=>{
 await openQualityPage(page,'/components/donut-chart/examples/chart-donut-allocation',info);const region=page.locator('[data-example-id=chart-donut-allocation]'),button=region.getByRole('button',{name:'Engineering 52',exact:true});
 await button.click();await expect(button).toHaveAttribute('aria-pressed','false');await expect(button).toBeFocused();await region.getByText('View data',{exact:true}).click();await expect(region.getByRole('row',{name:'Engineering 52 — No',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('typed time fields preserve native validation, external form values and reset',async({page},info)=>{
 await openQualityPage(page,'/components/time-picker/examples/time-entry-form-lifecycle',info);const region=page.locator('[data-example-id=time-entry-form-lifecycle]'),field=region.getByRole('textbox',{name:'Session time',exact:true}),submit=region.getByRole('button',{name:'Read time values',exact:true});
 await expect(region.locator('[data-example-ready]')).toBeVisible();await field.evaluate(element=>{element.setAttribute('data-native-invalid-count','0');element.addEventListener('invalid',()=>element.setAttribute('data-native-invalid-count',String(Number(element.getAttribute('data-native-invalid-count'))+1)));});await field.fill('09:10');await submit.click();await expect(field).toBeFocused();await expect(field).toHaveAttribute('data-native-invalid-count',/^[1-9][0-9]*$/);expect(await field.evaluate(element=>(element as HTMLInputElement).validity.valid)).toBe(false);await field.fill('10:15');await submit.click();await expect(region.getByRole('status')).toContainText('Time: 10:15 | Owned: 10:00 | Locked: 11:00 | Disabled: false');await region.getByRole('button',{name:'Reset times',exact:true}).click();await expect(field).toHaveValue('09:30');
});

test('virtual editing retains one native editor while the window moves',async({page},info)=>{
 await openQualityPage(page,'/components/data-grid/examples/data-grid-virtualized-10000',info);const region=page.locator('[data-example-id=data-grid-virtualized-10000]'),run=region.getByRole('button',{name:'Run example',exact:true});if(await run.isVisible())await run.click();const grid=region.getByRole('grid',{name:'Ten thousand editable records',exact:true});await expect(grid).toHaveAttribute('aria-rowcount','10001');expect(await grid.getByRole('gridcell').count()).toBeLessThan(150);
 await region.getByRole('button',{name:'Focus the last record',exact:true}).click();const last=grid.getByRole('gridcell',{name:'Title for BIG-10000',exact:true});await expect(last).toBeFocused();await last.press('Enter');const input=grid.getByRole('textbox',{name:'Title for BIG-10000',exact:true});await input.fill('Retained native editor');await region.locator('.bui-data-grid-scroll').evaluate(element=>{element.scrollTop=0;});await expect(input).toBeFocused();await expect(input).toHaveValue('Retained native editor');expect(await grid.getByRole('gridcell').count()).toBeLessThan(150);await input.press('Enter');await expect(last).toContainText('Retained native editor');
});
