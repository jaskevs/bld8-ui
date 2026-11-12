import type {Page} from '@playwright/test';
import {test,expect,openQualityPage,expectContained} from './fixtures';
import {checkTreeSelectionExample,checkLazyTreeSelectionExample} from '../scripts/check-tree-selection.mjs';


async function expectTreePopupContained(page:Page){
  const panel=page.getByRole('dialog',{name:'Project areas choices',exact:true});
  await expect.poll(async()=>{const bounds=await panel.boundingBox(),viewport=page.viewportSize();return !!bounds&&!!viewport&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height;}).toBe(true);
}
async function checkShortTreePopup(page:Page){
  const example=page.locator('[data-example-id="tree-select-lazy"]'),field=example.getByRole('button',{name:'Project areas',exact:true});
  for(const width of [390,320]){
    await page.setViewportSize({width,height:420});await field.click();const panel=page.getByRole('dialog',{name:'Project areas choices',exact:true}),workspace=panel.getByRole('treeitem',{name:'Workspace',exact:true}),search=panel.getByRole('searchbox');
    await expectTreePopupContained(page);
    const invalid=panel.getByRole('treeitem',{name:'Invalid example',exact:true});
    if(await invalid.getAttribute('aria-expanded')!=='true')await invalid.press('ArrowRight');
    await expect(panel.getByRole('button',{name:'Retry Invalid example',exact:true})).toBeVisible();
    await panel.getByRole('button',{name:'Retry Invalid example',exact:true}).click();await expectTreePopupContained(page);
    await expect(panel.getByRole('alert').filter({hasText:'Loaded choices are invalid.'})).toBeVisible();
    for(let cycle=0;cycle<2;cycle++){
      await workspace.press('ArrowLeft');await expect(workspace).toHaveAttribute('aria-expanded','false');await expectTreePopupContained(page);
      await workspace.press('ArrowRight');await expect(workspace).toHaveAttribute('aria-expanded','true');await expectTreePopupContained(page);
      await search.fill('no matching choices');await expect(panel.getByRole('status').filter({hasText:'No matching choices.'})).toBeVisible();await expectTreePopupContained(page);
      await search.fill('palette');await expectTreePopupContained(page);await search.fill('');await expectTreePopupContained(page);
    }
    await page.keyboard.press('Escape');await expect(field).toBeFocused();await expectContained(page);
  }
}

test('checked tree choices retain canonical forms, mixed states and keyboard context',async({page},info)=>{
  await openQualityPage(page,'/components/tree-select',info);
  await checkTreeSelectionExample(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const example=page.locator('[data-example-id="tree-select-native"]');
  await example.getByRole('button',{name:'Team access',exact:true}).click();
  const row=page.getByRole('dialog',{name:'Team access choices',exact:true}).getByRole('treeitem',{name:'Product',exact:true});
  expect(await row.locator(':scope>.bui-tree-select-row').evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(value=>parseFloat(value)===0))).toBe(true);
  await page.keyboard.press('Escape');await expectContained(page);
});

test('lazy tree choices recover without selecting future children or stale source values',async({page},info)=>{
  await openQualityPage(page,'/components/tree-select',info);
  await checkLazyTreeSelectionExample(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
  await checkShortTreePopup(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const field=page.locator('[data-example-id="tree-select-lazy"]').getByRole('button',{name:'Project areas',exact:true});
  await field.click();await expect(page.getByRole('tree',{name:'Project areas choices',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(field).toBeFocused();await expectContained(page);
});
