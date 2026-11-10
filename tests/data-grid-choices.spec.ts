import {test,expect} from '@playwright/test';
const route='/blocks/data-workspace';

test('choice keyboard navigation commits once, returns focus and reopens during exit motion',async({page})=>{
  await page.goto(route);const grid=page.getByRole('grid',{name:'Issue data grid'}),cell=grid.getByRole('gridcell',{name:'Priority for ISS-102',exact:true});
  const height=(await cell.boundingBox())!.height;await cell.focus();await cell.press('Enter');
  await expect(page.getByRole('option',{name:'Medium',exact:true})).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(cell).toContainText('High');await expect(cell).toBeFocused();expect((await cell.boundingBox())!.height).toBe(height);
  await cell.press('Enter');await expect(page.getByRole('option',{name:'High',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(cell).toBeFocused();
  await cell.press('Enter');await page.keyboard.press('Tab');const next=grid.getByRole('gridcell',{name:'Assignee for ISS-102',exact:true});await expect(next).toBeFocused();
  await next.press('Enter');const search=page.getByRole('combobox',{name:'Search Assignee for ISS-102 options',exact:true});await expect(search).toBeFocused();await search.press('Shift+Tab');await expect(cell).toBeFocused();
  await expect(grid.locator('[data-dirty]')).toHaveCount(1);
});

test('assignee search resolves labels to canonical values and supports an empty result',async({page})=>{
  await page.goto(route);const cell=page.getByRole('gridcell',{name:'Assignee for ISS-101',exact:true});await cell.dblclick();
  const search=page.getByRole('combobox',{name:'Search Assignee for ISS-101 options',exact:true});await expect(search).toBeFocused();await search.fill('missing person');
  await expect(page.getByText('No matching options. Try another search.',{exact:true})).toBeVisible();await search.fill('sam');await expect(page.getByRole('option')).toHaveCount(1);await search.press('ArrowDown');await search.press('Enter');
  await expect(cell).toBeFocused();await expect(cell).toContainText('Sam Rivera');
  expect(await cell.evaluate(el=>{const data=new DataTransfer();el.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,cancelable:true,clipboardData:data}));return data.getData('text/plain');})).toBe('sam');
});

test('unchanged selection and dismissal create no drafts or outside focus jumps',async({page})=>{
  await page.goto(route);const cell=page.getByRole('gridcell',{name:'Status for ISS-101',exact:true}),search=page.getByRole('textbox',{name:'Search issues',exact:true});
  await cell.dblclick();await page.getByRole('option',{name:'In review',exact:true}).click();await expect(cell).toBeFocused();await expect(page.locator('[data-dirty]')).toHaveCount(0);
  await cell.press('Enter');await expect(page.getByRole('option',{name:'Done',exact:true})).toBeVisible();await search.click();await expect(page.locator('.bui-data-grid-choice-popup')).toHaveCount(0);await expect(search).toBeFocused();
  await expect(page.locator('[data-dirty]')).toHaveCount(0);await expect(cell).toContainText('In review');
});

test('filtering out an exiting choice editor cannot leave a stale trigger on return',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(route);await page.addStyleTag({content:'.bui-data-grid-choice-popup{transition-duration:2s}'});
  const cell=page.getByRole('gridcell',{name:'Assignee for ISS-101',exact:true});await cell.dblclick();const search=page.getByRole('combobox',{name:'Search Assignee for ISS-101 options',exact:true});await search.fill('Sam');await page.getByRole('option',{name:'Sam Rivera',exact:true}).click();await expect(cell).toBeFocused();
  await page.getByRole('button',{name:'Add filter',exact:true}).click();await page.getByRole('button',{name:'Status',exact:true}).click();const values=page.getByRole('combobox',{name:'Values',exact:true});await values.fill('Done');await page.getByRole('option',{name:'Done',exact:true}).click();if(await values.getAttribute('aria-expanded')==='true')await values.press('Escape');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(cell).toHaveCount(0);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(cell).toContainText('Sam Rivera');await expect(cell.locator('.bui-data-grid-choice-trigger')).toHaveCount(0);
});

for(const theme of ['light','dark'])test(`choice menu in ${theme} fits its viewport without moving the page`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(route);await page.evaluate(theme=>document.documentElement.dataset.uiTheme=theme,theme);
  const cell=page.getByRole('gridcell',{name:'Priority for ISS-101',exact:true});await cell.scrollIntoViewIfNeeded();const before=(await cell.boundingBox())!;await cell.focus();await cell.press('Enter');
  const menu=page.locator('.bui-data-grid-choice-popup');await expect(menu).toBeVisible();const after=(await cell.boundingBox())!,box=(await menu.boundingBox())!;
  expect(Math.abs(before.x-after.x)).toBeLessThan(1);expect(after.height).toBe(before.height);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);
  await expect(cell.getByRole('combobox')).toHaveCSS('outline-style','none');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');await expect(cell).toBeFocused();
});
