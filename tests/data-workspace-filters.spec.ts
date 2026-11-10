import {test,expect,type Page} from '@playwright/test';
const route='/blocks/data-workspace';
async function add(page:Page,field:string){await page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true}).click();const search=page.getByRole('textbox',{name:'Find a filter field',exact:true});await search.fill(field);await search.press('ArrowDown');await page.keyboard.press('Enter');}
async function values(page:Page,value:string){const input=page.getByRole('combobox',{name:'Values',exact:true});await input.fill(value);await page.getByRole('option',{name:value,exact:true}).click();if(await input.getAttribute('aria-expanded')==='true')await input.press('Escape');await expect(page.getByRole('button',{name:'Apply filter',exact:true})).toBeVisible();}

test('quick facets stay unapplied until confirmed and retain an editable summary',async({page})=>{
  await page.goto(route);const backlog=page.getByRole('gridcell',{name:'Title for ISS-103',exact:true});await expect(backlog).toBeVisible();await add(page,'Status');await values(page,'In progress');
  await expect(backlog).toBeVisible();await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(backlog).toHaveCount(0);
  const chip=page.getByRole('button',{name:'Edit Status filter',exact:true});await expect(chip).toContainText('In progress');expect((await page.locator('[data-column-key=status] .bui-data-grid-value').allTextContents()).every(value=>value==='In progress')).toBe(true);
  await chip.click();await page.getByRole('button',{name:'Remove In progress',exact:true}).click();await values(page,'Done');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(chip).toContainText('Done');await expect(page.getByRole('gridcell',{name:'Title for ISS-105',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remove Status filter',exact:true}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();await expect(backlog).toBeVisible();
});

test('numeric ranges reject reversed values before changing the query',async({page})=>{
  await page.goto(route);await add(page,'Estimate');await page.getByRole('combobox',{name:'Condition',exact:true}).click();await page.getByRole('option',{name:'Between',exact:true}).click();
  await page.getByRole('textbox',{name:'From',exact:true}).fill('8');await page.getByRole('textbox',{name:'To',exact:true}).fill('2');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByText('The start must not be after the end.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Edit Estimate filter',exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:'From',exact:true}).fill('3');await page.getByRole('textbox',{name:'To',exact:true}).fill('5');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Estimate filter',exact:true})).toContainText('3 – 5');
  await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();await expect(page.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toHaveCount(0);
});

test('quick filtering and clearing preserve drafts from hidden rows',async({page})=>{
  await page.goto(route);const cell=page.getByRole('gridcell',{name:'Title for ISS-101',exact:true});await cell.focus();await cell.press('Enter');const input=cell.getByRole('textbox');await input.fill('Keep this hidden draft');await input.press('Enter');
  await add(page,'Status');await values(page,'Done');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(cell).toHaveCount(0);await expect(page.getByRole('button',{name:'Review changes',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(cell).toContainText('Keep this hidden draft');await expect(cell).toHaveAttribute('data-dirty','true');
});

test('unapplied advanced edits are protected from quick filter replacement',async({page})=>{
  await page.goto(route);await page.getByRole('button',{name:'Advanced',exact:true}).click();const advanced=page.getByRole('region',{name:'Workspace filters',exact:true});await advanced.getByRole('button',{name:'Add filter',exact:true}).click();
  await expect(page.getByText('Apply or clear the advanced changes before editing quick filters.',{exact:true})).toBeVisible();await expect(page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true})).toBeDisabled();
  await page.locator('.bblocks-data-workspace-filters').getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true})).toBeEnabled();
});

test('quick root conditions keep nested group semantics intact',async({page})=>{
  await page.goto(route);await page.getByRole('button',{name:'Advanced',exact:true}).click();const advanced=page.getByRole('region',{name:'Workspace filters',exact:true});await advanced.getByRole('button',{name:'Add group',exact:true}).click();
  const group=page.getByRole('group',{name:'Condition group 1',exact:true});await group.getByRole('textbox').fill('Keyboard');await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();
  await add(page,'Status');await values(page,'In review');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByText('No loaded records match this view.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'1 group · edit conditions',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remove Status filter',exact:true}).click();await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();await expect(group.getByRole('textbox')).toHaveValue('Keyboard');
});
