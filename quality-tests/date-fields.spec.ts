import {test,expect,openQualityPage,expectContained} from './fixtures';
import {checkDateEntryExamples,checkDateRangeExample} from '../scripts/check-date-editing.mjs';
const example=(page:import('@playwright/test').Page,id:string)=>page.locator('[data-example-id="'+id+'"]');
test('editable dates preserve native form values and reset through normal and reduced motion',async({page},info)=>{
  await openQualityPage(page,'/components/date-picker',info);
  await checkDateEntryExamples(page,id=>example(page,id));await expectContained(page);
  const field=example(page,'date-entry-lifecycle'),opener=field.getByRole('button',{name:'Open review date calendar',exact:true});
  await opener.click();const popup=page.getByRole('dialog',{name:'Review date',exact:true});await expect(popup).toBeVisible();
  expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(value=>parseFloat(value)===0))).toBe(true);
  await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(field.getByRole('textbox',{name:'Review date',exact:true})).toBeFocused();await expectContained(page);
});
test('range presets preserve explicit draft confirmation and focus through live motion changes',async({page},info)=>{
  await openQualityPage(page,'/components/date-range',info);
  await checkDateRangeExample(page,id=>example(page,id));await expectContained(page);
  const field=example(page,'date-range-presets');await field.getByRole('button',{name:'Open reporting period calendar',exact:true}).click();
  const popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await expect(popup).toBeVisible();
  expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(value=>parseFloat(value)===0))).toBe(true);
  await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(field.getByRole('textbox',{name:'Start reporting period',exact:true})).toBeFocused();await expectContained(page);
});
