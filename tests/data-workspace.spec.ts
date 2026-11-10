import {test,expect,type Locator,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const route='/blocks/data-workspace';
const workspace=(page:Page)=>page.getByRole('region',{name:'Data workspace',exact:true});
const grid=(page:Page)=>page.getByRole('grid',{name:'Issue data grid',exact:true});
const cell=(page:Page,id:string,key:string)=>grid(page).locator(`[data-row-id="${id}"][data-column-key="${key}"]`);
async function choose(page:Page,name:string,value:string){await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
async function edit(page:Page,id:string,key:string,value:string){const target=cell(page,id,key);await target.focus();await target.press('Enter');const input=target.getByRole('textbox');await expect(input).toBeFocused();await input.fill(value);await input.press('Enter');}
async function review(page:Page){await workspace(page).getByRole('button',{name:'Review changes',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Review pending changes',exact:true});await expect(dialog).toBeVisible();return dialog;}
async function paste(target:Locator,text:string){await target.focus();await target.evaluate((node,text)=>{const clipboard=new DataTransfer();clipboard.setData('text/plain',text);node.dispatchEvent(new ClipboardEvent('paste',{clipboardData:clipboard,bubbles:true,cancelable:true}));},text);}

test('paged drafts are reviewed and atomically saved with local undo and redo',async({page})=>{
  await page.goto(route);await expect(cell(page,'ISS-101','title')).toBeVisible();
  await edit(page,'ISS-101','title','Review keyboard and focus');
  await workspace(page).getByRole('navigation',{name:'Workspace pages',exact:true}).getByRole('button',{name:'Next',exact:true}).click();
  await expect(cell(page,'ISS-111','title')).toBeVisible();await edit(page,'ISS-111','title','Review profile errors');
  let dialog=await review(page);await expect(dialog).toContainText('Review keyboard and focus');await expect(dialog).toContainText('Review profile errors');await expect(dialog.getByRole('button',{name:'Save 2 records',exact:true})).toBeEnabled();
  await dialog.getByRole('button',{name:'Keep editing',exact:true}).click();await workspace(page).getByRole('button',{name:'Undo draft',exact:true}).click();await expect(cell(page,'ISS-111','title')).toContainText('Profile field validation');
  await workspace(page).getByRole('button',{name:'Redo draft',exact:true}).click();await expect(cell(page,'ISS-111','title')).toContainText('Review profile errors');
  dialog=await review(page);await dialog.getByRole('button',{name:'Save 2 records',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(workspace(page).getByRole('status').filter({hasText:'2 records saved in one batch.'})).toBeVisible();
  await workspace(page).getByRole('button',{name:'Reload records',exact:true}).click();await expect(cell(page,'ISS-111','title')).toContainText('Review profile errors');
  await workspace(page).getByRole('navigation',{name:'Workspace pages',exact:true}).getByRole('button',{name:'Previous',exact:true}).click();await expect(cell(page,'ISS-101','title')).toContainText('Review keyboard and focus');await expect(workspace(page).getByRole('button',{name:'Review changes',exact:true})).toHaveCount(0);
});

test('invalid pasted numbers remain in draft, block the batch and can be corrected',async({page})=>{
  await page.goto(route);await expect(cell(page,'ISS-101','estimate')).toBeVisible();await paste(cell(page,'ISS-101','estimate'),'not-a-number');
  await expect(cell(page,'ISS-101','estimate')).toHaveAttribute('aria-invalid','true');await expect(cell(page,'ISS-101','estimate')).toContainText('not-a-number');
  const dialog=await review(page);await expect(dialog).toContainText('Enter a decimal number without separators.');await expect(dialog.getByRole('button',{name:'Save 1 record',exact:true})).toBeDisabled();await dialog.getByRole('button',{name:'Fix ISS-101 Estimate',exact:true}).click();
  const details=page.getByRole('dialog',{name:'Issue ISS-101',exact:true}),estimate=details.getByRole('textbox',{name:'Estimate',exact:true});await expect(estimate).toBeFocused();await expect(estimate).toHaveValue('not-a-number');await estimate.fill('8');await details.getByRole('button',{name:'Add to pending changes',exact:true}).click();await expect(details).not.toBeVisible();await expect(cell(page,'ISS-101','estimate')).not.toHaveAttribute('aria-invalid','true');await expect(cell(page,'ISS-101','estimate')).toContainText('8');
  const corrected=await review(page);await corrected.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(corrected).not.toBeVisible();await expect(cell(page,'ISS-101','estimate')).toContainText('8');
});

test('retry reconciles a committed batch whose acknowledgement was lost',async({page})=>{
  await page.goto(route);await choose(page,'Data workspace preview','Lost save acknowledgement');await expect(cell(page,'ISS-101','title')).toBeVisible();await edit(page,'ISS-101','title','Confirmed exactly once');
  const dialog=await review(page);await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(dialog).toContainText('The save could not be confirmed.');await expect(dialog).toContainText('Confirmed exactly once');await dialog.getByRole('button',{name:'Keep editing',exact:true}).click();await expect(grid(page)).toHaveAttribute('aria-disabled','true');await expect(workspace(page).getByRole('button',{name:'Undo draft',exact:true})).toBeDisabled();await expect(workspace(page).getByRole('button',{name:'Discard drafts',exact:true})).toBeDisabled();await expect(workspace(page).getByRole('textbox',{name:'Search issues',exact:true})).toBeDisabled();await review(page);await expect(dialog).toContainText('The save could not be confirmed.');await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(dialog).not.toBeVisible();
  await cell(page,'ISS-101','title').focus();await workspace(page).getByRole('button',{name:'Open record',exact:true}).click();const details=page.getByRole('dialog',{name:'Issue ISS-101',exact:true});await expect(details).toContainText('Saved revision 2.');await expect(details.getByRole('textbox',{name:'Title',exact:true})).toHaveValue('Confirmed exactly once');
});

test('revision conflicts preserve drafts and require an explicit rebase before saving',async({page})=>{
  await page.goto(route);await choose(page,'Data workspace preview','Newer server revision');await expect(cell(page,'ISS-101','title')).toBeVisible();await edit(page,'ISS-101','title','Keep my reviewed title');
  const dialog=await review(page);await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(dialog).toContainText('Nothing in this batch was saved.');await expect(dialog).toContainText('Your draft: Keep my reviewed title');await expect(dialog).toContainText('Latest saved: Updated in another session');await expect(dialog.getByRole('button',{name:'Save 1 record',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Use latest revisions and keep my edits',exact:true}).click();await expect(dialog.getByRole('button',{name:'Save 1 record',exact:true})).toBeEnabled();await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(cell(page,'ISS-101','title')).toContainText('Keep my reviewed title');
  await cell(page,'ISS-101','title').focus();await workspace(page).getByRole('button',{name:'Open record',exact:true}).click();await expect(page.getByRole('dialog',{name:'Issue ISS-101',exact:true})).toContainText('Saved revision 3.');
});

test('an old save cannot repopulate a replacement data source',async({page})=>{
  await page.goto(route);await choose(page,'Data workspace preview','Source changes during save');await expect(cell(page,'ISS-101','title')).toBeVisible();await edit(page,'ISS-101','title','Old source only');const dialog=await review(page);await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();
  await expect(dialog).not.toBeVisible();await expect(page.getByRole('combobox',{name:'Data workspace preview',exact:true})).toContainText('Empty');await expect(workspace(page)).toContainText('0 matching records');
  // The fixture deliberately commits the old source after replacement, ignoring abort.
  await page.waitForTimeout(450);await expect(grid(page).getByRole('gridcell')).toHaveCount(0);await expect(workspace(page).getByText('1 record saved in one batch.',{exact:true})).toHaveCount(0);await expect(workspace(page).getByRole('button',{name:'Review changes',exact:true})).toHaveCount(0);
});

test('record drawer validates typed fields and adds them to one pending batch',async({page})=>{
  await page.goto(route);await expect(cell(page,'ISS-101','title')).toBeVisible();await cell(page,'ISS-101','title').focus();await workspace(page).getByRole('button',{name:'Open record',exact:true}).click();
  const details=page.getByRole('dialog',{name:'Issue ISS-101',exact:true});await details.getByRole('textbox',{name:'Title',exact:true}).fill('x');await details.getByRole('textbox',{name:'Estimate',exact:true}).fill('abc');await details.getByRole('button',{name:'Add to pending changes',exact:true}).click();await expect(details.getByRole('textbox',{name:'Title',exact:true})).toBeFocused();await expect(details).toContainText('Use at least 3 characters.');
  await details.getByRole('textbox',{name:'Title',exact:true}).fill('Review the complete record');await details.getByRole('textbox',{name:'Estimate',exact:true}).fill('13');await choose(page,'Priority','Urgent');await details.getByRole('button',{name:'Add to pending changes',exact:true}).click();await expect(details).not.toBeVisible();await expect(workspace(page).getByRole('button',{name:'Open record',exact:true})).toBeFocused();
  const dialog=await review(page);await expect(dialog).toContainText('Review the complete record');await expect(dialog).toContainText('13');await expect(dialog).toContainText('Urgent');await dialog.getByRole('button',{name:'Save 1 record',exact:true}).click();await expect(dialog).not.toBeVisible();
});

for(const theme of ['light','dark'])test(`phone ${theme} workspace contains the grid and exposes readable record editing`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.addInitScript(theme=>{document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.uiTheme=theme;},{once:true});},theme);await page.goto(route);await page.evaluate(theme=>{document.documentElement.dataset.uiTheme=theme;},theme);await expect(page.locator('html')).toHaveAttribute('data-ui-theme',theme);await expect(cell(page,'ISS-101','title')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await cell(page,'ISS-101','title').focus();await workspace(page).getByRole('button',{name:'Open record',exact:true}).click();const details=page.getByRole('dialog',{name:'Issue ISS-101',exact:true});await expect(details.getByRole('textbox',{name:'Title',exact:true})).toBeVisible();await expect.poll(()=>details.evaluate(element=>element.getBoundingClientRect().width<=window.innerWidth)).toBe(true);
  const violations=(await new AxeBuilder({page}).include('.bblocks-data-workspace-drawer').analyze()).violations;expect(violations).toEqual([]);
});
