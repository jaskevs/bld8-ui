import {test, expect, openQualityPage, expectContained} from './fixtures';

test('grid choice menus keep keyboard editing, canonical values and outside focus under normal motion',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);
  const grid=page.getByRole('grid',{name:'Issue data grid',exact:true}),priority=grid.getByRole('gridcell',{name:'Priority for ISS-102',exact:true});
  await priority.scrollIntoViewIfNeeded();const before=(await priority.boundingBox())!;await priority.focus();await page.keyboard.press('Enter');
  const popup=page.locator('.bui-data-grid-choice-popup');await expect(page.getByRole('option',{name:'Medium',exact:true})).toBeVisible();const box=(await popup.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width);expect(Math.abs((await priority.boundingBox())!.x-before.x)).toBeLessThan(1);
  expect(await popup.evaluate(el=>getComputedStyle(el).transitionDuration)).not.toBe('0s');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(priority).toContainText('High');await expect(priority).toBeFocused();expect(Math.round((await priority.boundingBox())!.height*64)).toBe(Math.round(before.height*64));
  await page.keyboard.press('Enter');await expect(page.getByRole('option',{name:'High',exact:true})).toBeVisible();await page.keyboard.press('Tab');
  const assignee=grid.getByRole('gridcell',{name:'Assignee for ISS-102',exact:true});await expect(assignee).toBeFocused();await page.keyboard.press('Enter');const search=page.getByRole('combobox',{name:'Search Assignee for ISS-102 options',exact:true});await expect(search).toBeFocused();await search.fill('sam');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(assignee).toContainText('Sam Rivera');await expect(assignee).toBeFocused();
  await assignee.press('Enter');await page.getByRole('textbox',{name:'Search issues',exact:true}).click();await expect(popup).toHaveCount(0);await expect(page.getByRole('textbox',{name:'Search issues',exact:true})).toBeFocused();
  await page.emulateMedia({reducedMotion:'reduce'});await priority.scrollIntoViewIfNeeded();await priority.focus();await priority.press('Enter');await expect(popup).toBeVisible();expect(await popup.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');await page.keyboard.press('Escape');await expect(priority).toBeFocused();await expectContained(page);
});

test('workspace quick filters preserve explicit apply, nested menu context and mobile containment under normal motion',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);await page.getByRole('button',{name:'Add filter',exact:true}).click();
  const search=page.getByRole('textbox',{name:'Find a filter field',exact:true});await search.fill('Status');await search.press('ArrowDown');await page.keyboard.press('Enter');
  const values=page.getByRole('combobox',{name:'Values',exact:true});await values.fill('Done');await page.getByRole('option',{name:'Done',exact:true}).click();if(await values.getAttribute('aria-expanded')==='true')await values.press('Escape');
  await expect(page.getByRole('button',{name:'Apply filter',exact:true})).toBeVisible();await expect(page.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toHaveCount(1);
  const popup=page.locator('.bui-popover');const box=(await popup.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Status filter',exact:true})).toContainText('Done');await expect(page.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Remove Status filter',exact:true}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();await expect(page.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toBeVisible();await expectContained(page);
});

test('dynamic filter menus stay contained through repeated picker and editor resizing',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);
  const viewport=page.viewportSize()!;await page.setViewportSize({width:viewport.width,height:viewport.width<600?460:720});
  const add=page.getByRole('button',{name:'Add filter',exact:true});await add.click();
  const search=page.getByRole('textbox',{name:'Find a filter field',exact:true}),popup=page.locator('.bui-popover:not([data-ending-style])');
  await expect(search).toBeVisible();expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration)).not.toBe('0s');
  const contained=async()=>{await expect.poll(()=>popup.evaluate(element=>{const box=element.getBoundingClientRect();return {left:Math.max(0,-box.left),top:Math.max(0,-box.top),right:Math.max(0,box.right-innerWidth),bottom:Math.max(0,box.bottom-innerHeight)};}), {message:'Dynamic filter menu stays inside its viewport'}).toEqual({left:0,top:0,right:0,bottom:0});};
  for(let cycle=0;cycle<3;cycle++){
    await search.fill('Status');await search.press('ArrowDown');await page.keyboard.press('Enter');
    await expect(page.getByRole('combobox',{name:'Condition',exact:true})).toBeFocused();await contained();
    await page.getByRole('button',{name:'Fields',exact:true}).click();await expect(search).toBeFocused();await search.fill('');await contained();
  }
  await search.fill('Status');await search.press('ArrowDown');await page.keyboard.press('Enter');
  const values=page.getByRole('combobox',{name:'Values',exact:true});await values.fill('Done');await page.getByRole('option',{name:'Done',exact:true}).click();if(await values.getAttribute('aria-expanded')==='true')await values.press('Escape');await contained();
  await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(add).toBeFocused();await expect(page.getByRole('button',{name:'Edit Status filter',exact:true})).toContainText('Done');
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Edit Status filter',exact:true}).click();await contained();expect(await popup.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Edit Status filter',exact:true})).toBeFocused();await expectContained(page);
});

test('data workspace pointer selection stays a clean range under normal motion',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);
  const grid=page.getByRole('grid',{name:'Issue data grid',exact:true}),start=grid.getByRole('gridcell',{name:'Issue for ISS-101',exact:true}),end=grid.getByRole('gridcell',{name:'Title for ISS-103',exact:true});
  await expect(end).toBeVisible();await end.scrollIntoViewIfNeeded();
  await grid.locator('..').evaluate(element=>{const from=element.querySelector<HTMLElement>('[data-row-id="ISS-101"][data-column-key="id"]')!.getBoundingClientRect(),to=element.querySelector<HTMLElement>('[data-row-id="ISS-103"][data-column-key="title"]')!.getBoundingClientRect(),box=element.getBoundingClientRect();element.scrollLeft+=(from.left+to.right)/2-(box.left+box.width/2);});
  const from=(await start.boundingBox())!,to=(await end.boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:12});await page.mouse.up();
  await expect(grid.locator('[aria-selected=true]')).toHaveCount(6);await expect(end).toBeFocused();expect(await page.evaluate(()=>getSelection()?.toString())).toBe('');
  await expect(grid.locator('.bui-data-grid-range-corner')).toHaveCount(1);expect(await end.evaluate(element=>getComputedStyle(element,'::before').borderBottomWidth)).toBe('1px');
  await page.keyboard.press('Shift+ArrowUp');await expect(grid.locator('[aria-selected=true]')).toHaveCount(4);await page.keyboard.press('Escape');await expect(grid.locator('[aria-selected=true]')).toHaveCount(1);
  const title=grid.getByRole('gridcell',{name:'Title for ISS-102',exact:true});const rowHeight=(await title.boundingBox())!.height;await title.dblclick();const editor=grid.getByRole('textbox',{name:'Title for ISS-102',exact:true});await editor.fill('Native editor selection');await editor.dblclick();await expect(editor).toHaveValue('Native editor selection');await expect(editor).toHaveCSS('outline-style','none');await expect(editor).toHaveCSS('box-shadow','none');expect((await title.boundingBox())!.height).toBe(rowHeight);await editor.press('Escape');await expect(title).toBeFocused();
  await page.emulateMedia({reducedMotion:'reduce'});expect(await title.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');await expectContained(page);
});

test('data workspace range, draft history and keyboard editing preserve context under normal motion',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);
  const grid=page.getByRole('grid',{name:'Issue data grid',exact:true}),title=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});
  await expect(title).toBeVisible();await title.focus();
  expect(await title.evaluate(element=>getComputedStyle(element).transitionDuration)).not.toBe('0s');
  await page.keyboard.press('Shift+ArrowRight');await page.keyboard.press('Shift+ArrowDown');
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);await page.keyboard.press('Escape');await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
  await title.focus();await page.keyboard.press('Enter');const input=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});
  await expect(input).toBeFocused();await input.fill('Cancelled keyboard draft');await page.keyboard.press('Escape');await expect(title).toBeFocused();await expect(title).not.toContainText('Cancelled keyboard draft');
  await page.keyboard.press('F2');await input.fill('A clearer keyboard workflow');await page.keyboard.press('Enter');await expect(title).toBeFocused();await expect(title).toHaveAttribute('data-dirty');
  await page.keyboard.press('Control+z');await expect(title).not.toHaveAttribute('data-dirty');await expect(title).toBeFocused();
  await page.keyboard.press('Control+Shift+z');await expect(title).toHaveAttribute('data-dirty');await expect(title).toBeFocused();
  await expectContained(page);expect(await page.locator('.bui-data-grid-scroll').evaluate(element=>element.getBoundingClientRect().right<=innerWidth+1/64)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});expect(await title.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');expect(await grid.locator('.bui-data-grid-sort').first().evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
});

test('playground board rollback and recovery retain confirmed order under normal motion',async({page},info)=>{
  await openQualityPage(page,'/playground?component=Kanban&actionResult=Error&dark='+(info.project.use.colorScheme==='dark'),info);
  const sample=page.getByRole('region',{name:'Component preview',exact:true});
  const move=sample.getByRole('button',{name:'Move Prepare the brief',exact:true});await move.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Move item',exact:true});await dialog.getByRole('combobox',{name:'Destination column',exact:true}).click();await page.getByRole('option',{name:'In progress',exact:true}).click();await dialog.getByRole('button',{name:'Move item',exact:true}).click();
  await expect(sample.getByRole('alert')).toContainText('earlier order is restored');await sample.getByRole('button',{name:'Retry with a successful response',exact:true}).click();
  await expect.poll(()=>new URL(page.url()).searchParams.get('kanbanOrder')).toContain('brief:active');await page.reload();await expect(sample.getByRole('region',{name:'In progress column',exact:true})).toContainText('Prepare the brief');await expectContained(page);
});

test('playground lazy tree and chart preserve shared state and keyboard context',async({page},info)=>{
  const dark=info.project.use.colorScheme==='dark';await openQualityPage(page,'/playground?component=Tree&treeFailure=true&dark='+dark,info);
  const sample=page.getByRole('region',{name:'Component preview',exact:true}),assets=sample.getByRole('treeitem',{name:'assets',exact:true});await assets.focus();await page.keyboard.press('ArrowRight');await expect(assets).toContainText('could not be loaded');await page.keyboard.press('ArrowRight');const tokens=sample.getByRole('treeitem',{name:'tokens.css',exact:true});await expect(tokens).toBeVisible();await tokens.click();await expect(tokens).toHaveAttribute('aria-selected','true');await expect.poll(()=>new URL(page.url()).searchParams.get('treeSelected')).toBe('tokens');await expect.poll(()=>new URL(page.url()).searchParams.get('treeLoaded')).toBe('true');await expectContained(page);
  const controls=page.getByRole('region',{name:'Playground controls',exact:true});await controls.getByRole('combobox',{name:'Component',exact:true}).click();await page.getByRole('option',{name:'Chart',exact:true}).click();await controls.getByRole('combobox',{name:'Period',exact:true}).click();await page.getByRole('option',{name:'fortnight',exact:true}).click();await controls.getByRole('switch',{name:'Include a missing observation',exact:true}).check();const points=sample.getByRole('group',{name:'Request outcomes observations',exact:true});await expect(points.getByRole('button')).toHaveCount(14);await points.getByRole('button').first().focus();await page.keyboard.press('End');await expect(points.getByRole('button').last()).toBeFocused();await sample.getByRole('button',{name:'Area',exact:true}).click();await expect(sample.locator('.bui-chart')).toHaveAttribute('data-chart-type','area');await expect.poll(()=>new URL(page.url()).searchParams.get('chartType')).toBe('area');await sample.getByRole('button',{name:'Show data',exact:true}).click();await expect(sample.getByRole('table')).toContainText('Not recorded');await expectContained(page);
});

test('playground shares native choices and disclosures and downloads matching source',async({page},info)=>{
  await openQualityPage(page,'/playground?component=Checkbox&mixed=true&dark='+(info.project.use.colorScheme==='dark'),info);
  const controls=page.getByRole('region',{name:'Playground controls',exact:true}),preview=page.getByRole('region',{name:'Component preview',exact:true});
  const checkbox=preview.getByRole('checkbox',{name:'Include archived',exact:true});await expect(checkbox).toHaveAttribute('aria-checked','mixed');await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();await expect(checkbox).toHaveJSProperty('indeterminate',false);
  async function choose(name:string){await controls.getByRole('combobox',{name:'Component',exact:true}).click();await page.getByRole('option',{name,exact:true}).click();}
  await choose('RadioGroup');await preview.getByRole('radio',{name:'Comfortable',exact:true}).focus();await page.keyboard.press('ArrowDown');await expect(preview.getByRole('radio',{name:'Compact',exact:true})).toBeChecked();
  await choose('Accordion');await controls.getByRole('switch',{name:'Multiple open sections',exact:true}).check();await preview.getByRole('button',{name:'Try it with the keyboard',exact:true}).click();await expect(preview.getByRole('button',{name:'Keep the useful context',exact:true})).toHaveAttribute('aria-expanded','true');await page.reload();await expect(preview.getByRole('button',{name:'Try it with the keyboard',exact:true})).toHaveAttribute('aria-expanded','true');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download example',exact:true}).click();expect((await pending).suggestedFilename()).toBe('accordion-example.tsx');await expectContained(page);
});

test('playground retains bulk failure context and incomplete filter drafts under normal motion',async({page},info)=>{
  await openQualityPage(page,'/playground?component=DataTable&tableSelected=1&actionResult=Error&dark='+(info.project.use.colorScheme==='dark'),info);
  const controls=page.getByRole('region',{name:'Playground controls',exact:true}),preview=page.getByRole('region',{name:'Component preview',exact:true});
  await preview.getByRole('button',{name:'Mark ready',exact:true}).click();await expect(preview.getByRole('alert')).toContainText('No rows changed.');await expect(preview.getByRole('button',{name:'Mark ready',exact:true})).toBeFocused();await preview.getByRole('button',{name:'Use successful response',exact:true}).click();await preview.getByRole('button',{name:'Mark ready',exact:true}).click();await expect(preview.getByRole('checkbox',{name:'Select Study tokens',exact:true})).not.toBeChecked();await expect(preview.getByRole('row').filter({hasText:'Study tokens'})).toContainText('Ready');
  await controls.getByRole('combobox',{name:'Component',exact:true}).click();await page.getByRole('option',{name:'FilterBuilder',exact:true}).click();await preview.getByRole('button',{name:'Add filter',exact:true}).click();await preview.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(preview.getByText('Enter a value.',{exact:true})).toBeVisible();const input=preview.getByRole('textbox',{name:'Filter 1 value',exact:true});await input.fill('motion');await preview.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(preview.getByRole('checkbox',{name:'Select Refine motion',exact:true})).toBeVisible();await expect(preview.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toHaveCount(0);await input.fill('tokens');await page.reload();await expect(input).toHaveValue('tokens');await expect(preview.getByRole('checkbox',{name:'Select Refine motion',exact:true})).toBeVisible();await expect(preview.getByText('Unapplied changes',{exact:true})).toBeVisible();await expectContained(page);
});

test('Outline records comments and reverses status changes without losing context',async({page},info)=>{
  await openQualityPage(page,'/templates/outline',info);
  const projects=page.getByRole('region',{name:'Outline projects',exact:true}),trigger=projects.getByRole('button',{name:'Actions for Keyboard review',exact:true}),editor=page.getByRole('dialog',{name:'Edit project',exact:true});
  async function open(){await trigger.click();await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();await expect(editor).not.toHaveAttribute('data-starting-style');}
  await open();const feed=editor.getByRole('region',{name:'Project activity',exact:true}),comment=feed.getByRole('textbox',{name:'Add a comment',exact:true});await comment.fill('Keep the keyboard path clear.');await feed.getByRole('button',{name:'Post comment',exact:true}).click();await expect(feed.getByText('Comment added.',{exact:true})).toBeVisible();await expect(comment).toBeFocused();await expect(comment).toHaveValue('');
  await editor.getByRole('button',{name:'Cancel',exact:true}).click();await expect(editor).not.toBeVisible();await expect(trigger).toBeFocused();
  await projects.getByRole('checkbox',{name:'Select Keyboard review',exact:true}).check();await projects.getByRole('button',{name:'Archive',exact:true}).click();await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeVisible();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='bld8-outline-projects-v1'){Storage.prototype.setItem=original;throw new DOMException('Full','QuotaExceededError');}return original.call(this,key,value);};});
  await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(projects.getByRole('alert')).toContainText('Browser storage is unavailable or full.');await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeFocused();
  await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(projects).toContainText('1 project status restored.');await expect(page.getByLabel('Project table updates',{exact:true})).toBeFocused();
  await open();await expect(feed.getByText('Keep the keyboard path clear.',{exact:true})).toBeVisible();await expect(feed.getByText('Status restored to Planned.',{exact:true})).toBeVisible();expect(await editor.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);await page.keyboard.press('Escape');await expect(editor).not.toBeVisible();await expectContained(page);
});

test('bulk selection motion keeps native checkbox state, layout and return focus',async({page},info)=>{
  await openQualityPage(page,'/blocks/resources',info);const block=page.getByRole('region',{name:'Resource library',exact:true});
  const first=block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}),header=block.getByRole('checkbox',{name:'Select current page',exact:true}),reveal=block.locator('.bui-reveal--table-selection');
  await first.focus();
  // Sample the real CSS timeline rather than assuming a headless renderer's frame
  // rate. Unpaused frame cadence and rapid reversal have separate regular tests.
  await reveal.evaluate(element=>{
    element.getBoundingClientRect();
    const observer=new MutationObserver(()=>{
      if(element.getAttribute('data-open')!=='true')return;
      const animation=element.getAnimations().find(item=>(item as CSSTransition).transitionProperty==='grid-template-rows');
      if(!animation)return;
      animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*.25;
      (window as Window & {bulkAnimation?:Animation}).bulkAnimation=animation;observer.disconnect();
    });observer.observe(element,{attributes:true,attributeFilter:['data-open']});
  });
  await page.keyboard.press('Space');await expect(header).toHaveAttribute('aria-checked','mixed');
  await expect.poll(()=>page.evaluate(()=>!!(window as Window & {bulkAnimation?:Animation}).bulkAnimation)).toBe(true);
  await page.screenshot({animations:'allow'});const firstHeight=(await reveal.boundingBox())!.height;
  await page.evaluate(()=>{const animation=(window as Window & {bulkAnimation?:Animation}).bulkAnimation!;animation.currentTime=Number(animation.effect!.getTiming().duration)*.75;});
  await page.screenshot({animations:'allow'});const laterHeight=(await reveal.boundingBox())!.height;
  expect(firstHeight).toBeGreaterThan(0);expect(laterHeight).toBeGreaterThan(firstHeight+10);
  await page.evaluate(()=>{const host=window as Window & {bulkAnimation?:Animation};host.bulkAnimation!.play();delete host.bulkAnimation;});
  await expect.poll(()=>header.evaluate(element=>getComputedStyle(element,'::before').opacity)).toBe('1');
  await header.focus();await page.keyboard.press('Space');await expect(header).toBeChecked();await expect.poll(()=>header.evaluate(element=>getComputedStyle(element,'::after').opacity)).toBe('1');await expect.poll(()=>header.evaluate(element=>getComputedStyle(element,'::before').opacity)).toBe('0');
  await block.getByRole('button',{name:'Clear selection',exact:true}).click();await expect(header).toBeFocused();await expect(header).not.toBeChecked();await expect(reveal).toHaveAttribute('inert','');await expect(block.getByRole('button',{name:'Clear selection',exact:true})).toHaveCount(0);await expect.poll(()=>reveal.evaluate(element=>element.getBoundingClientRect().height)).toBe(0);await expect(reveal.locator('.bui-table-selection')).toHaveCount(0);await expectContained(page);
});

test('Outline detail drafts recover, save and return focus under normal motion',async({page},info)=>{
  await openQualityPage(page,'/templates/outline',info);
  const trigger=page.getByRole('button',{name:'Actions for Keyboard review',exact:true});
  await trigger.focus();await trigger.press('Enter');await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
  const drawer=page.getByRole('dialog',{name:'Edit project',exact:true});
  await expect(drawer.getByRole('heading',{name:'Keyboard review',exact:true})).toBeFocused();
  await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeInViewport();
  await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Review the details with the keyboard.');
  await page.keyboard.press('Escape');await expect(drawer.getByRole('button',{name:'Keep editing',exact:true})).toBeFocused();
  await drawer.getByRole('button',{name:'Keep draft & close',exact:true}).click();await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
  await trigger.press('Enter');await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
  await expect(drawer.getByText('Recovered draft',{exact:true})).toBeVisible();
  await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Review the details with the keyboard.');
  await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
  await page.reload();await trigger.click();await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
  await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Review the details with the keyboard.');
  await expectContained(page);
});

test('keyboard choices and interrupted dialog return focus', async ({page}, info) => {
  await openQualityPage(page, '/foundations#control-states', info);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  const controls = page.getByRole('region', {name:'Control standards', exact:true});
  const checkbox = controls.getByRole('checkbox', {name:'Include archived', exact:true});
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  const density = controls.getByRole('radio', {name:'Comfortable', exact:true});
  await density.focus();
  await page.keyboard.press('ArrowDown');
  await expect(controls.getByRole('radio', {name:'Compact', exact:true})).toBeChecked();

  const trigger = controls.getByRole('button', {name:'Review changes', exact:true});
  await trigger.click();
  const dialog = page.getByRole('dialog', {name:'Review changes', exact:true});
  expect(await dialog.evaluate(element => getComputedStyle(element).transitionDuration.split(',').some(value => parseFloat(value) > 0))).toBe(true);
  // Dismiss immediately, during the normal entry transition; then reopen. No
  // screenshot helper, animation disabling or reduced-motion override is used.
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', {name:'Review note', exact:true}).fill('A portable keyboard review');
  await dialog.getByRole('button', {name:'Done', exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expectContained(page);
});

test('session workflow keeps canonical values, focus and tab draft', async ({page}, info) => {
  await openQualityPage(page, '/blocks/session-setup', info);
  const setup = page.getByRole('region', {name:'Session setup', exact:true});
  await expect(setup).toHaveAttribute('data-reduced-motion', 'false');
  await page.getByRole('textbox', {name:'Workspace name', exact:true}).fill('Cross-browser working session');
  await page.getByRole('button', {name:'Continue', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Session preferences.', exact:true})).toBeFocused();
  const duration = page.getByRole('textbox', {name:'Session length', exact:true});
  await duration.focus();
  await page.keyboard.press('ArrowUp');
  await expect(duration).toHaveValue('60');
  await page.getByRole('combobox', {name:'Preferred start', exact:true}).click();
  await page.getByRole('option', {name:'10:00', exact:true}).click();
  await expect(setup.locator('input[name="startTime"]')).toHaveValue('10:00');
  await page.getByRole('button', {name:'Continue', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Review the details.', exact:true})).toBeFocused();
  await expect(setup).toContainText('60 minutes');
  await expectContained(page);
  await page.reload();
  await expect(page.getByRole('heading', {name:'Review the details.', exact:true})).toBeVisible();
  await expect(setup).toContainText('Cross-browser working session');
  await page.getByRole('button', {name:'Finish setup', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Your preferences are ready.', exact:true})).toBeFocused();
  await expect(setup).toContainText('3 people · 60 minutes');
  await expectContained(page);
});


test('theme preview isolates tokens and keeps real controls interactive', async ({page}, info) => {
  test.setTimeout(45000);
  await openQualityPage(page, '/themes', info);
  const mode = info.project.use.colorScheme === 'dark' ? 'dark' : 'light';
  const parentRoot = page.locator('html');
  const parentAccent = await parentRoot.evaluate(element => getComputedStyle(element).getPropertyValue('--bui-accent').trim());
  const live = page.getByRole('status').filter({hasText:'Live. Buttons, menus and dialogs use your theme.'});
  await expect(live).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);

  await page.getByRole('button', {name:/^Cobalt /}).click();
  await expect(page.getByRole('button', {name:/^Cobalt /})).toHaveAttribute('aria-pressed', 'true');
  const preview = page.frameLocator('iframe[title="Theme preview"]');
  const previewRoot = preview.locator('html');
  await expect(previewRoot).toHaveCSS('--bui-accent', '#3859b8');
  await expect(parentRoot).toHaveCSS('--bui-accent', parentAccent);
  const colourMode = page.getByRole('button', {name:mode === 'dark' ? 'Dark preview' : 'Light preview', exact:true});
  await colourMode.click();
  await expect(colourMode).toHaveAttribute('aria-pressed', 'true');
  await expect(previewRoot).toHaveAttribute('data-ui-theme', mode);
  await expect(live).toBeVisible();
  expect(await previewRoot.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);

  const status = preview.getByRole('combobox', {name:'Project status', exact:true});
  await expect(status).toContainText('All projects');
  await status.click();
  await preview.getByRole('option', {name:'Ready', exact:true}).click();
  await expect(preview.getByRole('heading', {name:'Navigation patterns', exact:true})).toBeVisible();
  await expect(preview.getByRole('heading', {name:'Interface audit', exact:true})).toHaveCount(0);
  await status.click();
  await preview.getByRole('option', {name:'All projects', exact:true}).click();
  await expect(preview.getByRole('heading', {name:'Interface audit', exact:true})).toBeVisible();

  const create = preview.getByRole('button', {name:'New project', exact:true});
  await create.click();
  const dialog = preview.getByRole('dialog', {name:'Create a project', exact:true});
  const name = dialog.getByRole('textbox', {name:'Project name', exact:true});
  await expect(name).toBeFocused();
  expect(await dialog.evaluate(element => getComputedStyle(element).transitionDuration.split(',').some(value => parseFloat(value) > 0))).toBe(true);
  await name.fill('A portable themed project');
  await name.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(create).toBeFocused();

  await preview.getByRole('tab', {name:'Controls', exact:true}).click();
  const team = preview.getByRole('textbox', {name:'Team size', exact:true});
  await expect(team).toHaveValue('3');
  expect((await team.locator('..').boundingBox())!.height).toBeCloseTo(40, 0);
  const digest = preview.getByRole('switch', {name:'Weekly digest', exact:true});
  await expect(digest).toBeChecked();
  await digest.focus();
  await digest.press('Space');
  await expect(digest).not.toBeChecked();
  await expect(digest).toBeFocused();
  await expect(previewRoot).toHaveCSS('--bui-accent', '#3859b8');
  await expect(parentRoot).toHaveCSS('--bui-accent', parentAccent);
  await expect(parentRoot).toHaveAttribute('data-ui-theme', mode);
  expect(await previewRoot.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'The themed frame must fit its viewport').toBe(true);
  await expectContained(page);
});

test('tree roving focus and lazy file metadata work under normal motion', async ({page}, info) => {
  test.setTimeout(45000);
  await openQualityPage(page, '/components/tree', info);
  const tree = page.getByRole('tree', {name:'Project files', exact:true});
  await expect(tree).toHaveAttribute('data-reduced-motion', 'false');
  const readme = tree.getByRole('treeitem', {name:'README.md', exact:true});
  const source = tree.getByRole('treeitem', {name:'src', exact:true});
  const components = tree.getByRole('treeitem', {name:'components', exact:true});
  await expect(readme).toHaveAttribute('aria-selected', 'true');
  await readme.focus();
  await page.keyboard.press('Home');
  await expect(source).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(components).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(components).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tree.getByRole('treeitem', {name:'button.tsx', exact:true})).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(components).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(components).toHaveAttribute('aria-expanded', 'false');
  await expect(tree.getByRole('treeitem', {name:'button.tsx', exact:true})).toHaveCount(0);
  await expect(readme).toHaveAttribute('aria-selected', 'true');
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
  await expectContained(page);

  await openQualityPage(page, '/blocks/file-browser', info);
  const folders = page.getByRole('tree', {name:'Workspace folders', exact:true});
  await expect(folders).toHaveAttribute('data-reduced-motion', 'false');
  const archive = folders.getByRole('treeitem', {name:'Archive', exact:true});
  await expect(page.getByRole('button', {name:'Inspect archived-brief.pdf', exact:true})).toHaveCount(0);
  await archive.focus();
  await archive.press('Space');
  await expect(archive).toHaveAttribute('aria-selected', 'true');
  // Keep the real lazy-load timer running; do not advance or disable motion.
  const files = page.getByRole('table', {name:'Files in Archive', exact:true});
  const brief = files.getByRole('button', {name:'Inspect archived-brief.pdf', exact:true});
  await expect(brief).toBeVisible();
  await expect(files.getByRole('button', {name:'Inspect earlier-notes.txt', exact:true})).toBeVisible();
  await brief.click();
  const details = page.getByRole('region', {name:'File details', exact:true});
  await expect(details.getByRole('heading', {name:'archived-brief.pdf', exact:true})).toBeVisible();
  await expect(details.getByText('The previous project brief.', {exact:true})).toBeVisible();
  await expect(details.getByText('PDF', {exact:true})).toBeVisible();
  await expect(details.getByText('94 KB', {exact:true})).toBeVisible();
  await expect(details.getByText('20 Oct 2026', {exact:true})).toBeVisible();
  await expect(details.getByText('Workspace / Archive', {exact:true})).toBeVisible();
  // Navigation moves focus to a stable destination; clearing a search returns to it.
  const workspace = page.getByRole('button', {name:'Show Workspace', exact:true});
  await workspace.focus();
  await workspace.press('Enter');
  const mainHeading = page.locator('.bblocks-files-title h3');
  await expect(mainHeading).toHaveText('Workspace');
  await expect(mainHeading).toBeFocused();
  const projects = page.getByRole('button', {name:'Open Projects', exact:true});
  await projects.focus();
  await projects.press('Enter');
  await expect(mainHeading).toHaveText('Projects');
  await expect(mainHeading).toBeFocused();
  const search = page.getByRole('searchbox', {name:'Search this folder', exact:true});
  await search.fill('missing metadata');
  const clear = page.getByRole('button', {name:'Clear file search', exact:true});
  await clear.focus();
  await clear.press('Enter');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(folders.locator('[tabindex="0"]')).toHaveCount(1);
  await expectContained(page);
});

test('analytics period and chart exploration retain keyboard context under normal motion', async ({page}, info) => {
  test.setTimeout(45000);
  await openQualityPage(page, '/blocks/analytics-dashboard', info);
  const workspace = page.getByRole('region',{name:'Analytics workspace',exact:true});
  await expect(workspace).toHaveAttribute('data-reduced-motion','false');
  const period = workspace.getByRole('combobox',{name:'Reporting period',exact:true});
  await period.focus();await period.press('Enter');
  const month = page.getByRole('option',{name:'Last 30 days',exact:true});await month.focus();await month.press('Enter');
  const chart = workspace.getByRole('figure',{name:'Request activity',exact:true});
  const points = chart.locator('.bui-chart-point');
  await expect(points).toHaveCount(30);await expect(period).toBeFocused();
  await expect.poll(()=>chart.locator('.bui-chart-labels').evaluate(element=>{
    const strip=element.getBoundingClientRect(),labels=Array.from(element.querySelectorAll('span')).map(label=>label.getBoundingClientRect()).filter(box=>box.width>0&&box.height>0).sort((a,b)=>a.left-b.left);
    return labels.length>=2&&labels.every((box,index)=>box.left>=strip.left-.5&&box.right<=strip.right+.5&&(!index||box.left>=labels[index-1].right-.5));
  }),'Chart labels fit without overlapping in each browser viewport').toBe(true);
  await expect(chart).toHaveAttribute('data-reduced-motion','false');
  await expect(chart.locator('.bui-chart-point[tabindex="0"]')).toHaveCount(1);
  await points.first().focus();await page.keyboard.press('ArrowRight');await expect(points.nth(1)).toBeFocused();
  await page.keyboard.press('End');await expect(points.last()).toBeFocused();
  await page.keyboard.press('Home');await expect(points.first()).toBeFocused();
  const completed = chart.getByRole('button',{name:'Completed series',exact:true});
  await completed.focus();await completed.press('Space');await expect(completed).toHaveAttribute('aria-pressed','false');await expect(completed).toBeFocused();
  const show = chart.getByRole('button',{name:'Show data',exact:true});await show.focus();await show.press('Enter');
  const table = chart.getByRole('table',{name:'Request activity data',exact:true});await expect(table).toBeVisible();await expect(table.locator('tbody tr')).toHaveCount(30);
  await expect(table.getByRole('columnheader',{name:/^Completed/})).toBeVisible();
  await completed.focus();await completed.press('Space');await expect(completed).toHaveAttribute('aria-pressed','true');await expect(completed).toBeFocused();
  const hide = chart.getByRole('button',{name:'Hide data',exact:true});await hide.focus();await hide.press('Enter');
  await expect(table).not.toBeVisible();await expect(chart.getByRole('button',{name:'Show data',exact:true})).toBeFocused();
  await expectContained(page);
});
test('large table keeps keyboard identity and selection across reading views',async({page},info)=>{
  await openQualityPage(page,'/components/windowed-table',info);
  const specimen=page.locator('.windowed-demo');
  await specimen.getByRole('combobox',{name:'Record count',exact:true}).click();
  await page.getByRole('option',{name:'10,000 records',exact:true}).click();
  await specimen.getByRole('combobox',{name:'Group records by',exact:true}).click();
  await page.getByRole('option',{name:'None',exact:true}).click();
  const first=specimen.locator('tr[data-windowed-id="row:ROW-00001"]');await first.focus();
  await page.keyboard.press('End');
  const last=specimen.locator('tr[data-windowed-id="row:ROW-10000"]');
  await expect(last).toBeFocused();await expect(last).toHaveAttribute('aria-rowindex','10001');
  expect(await specimen.locator('tr[data-windowed-id]').count()).toBeLessThan(35);
  await page.keyboard.press('Space');await expect(last).toHaveAttribute('data-selected','true');
  await specimen.getByRole('button',{name:'Pages',exact:true}).click();
  await expect(specimen.getByRole('table',{name:'Release records',exact:true})).toBeVisible();
  await expect(specimen).toContainText('1 selected');
  await specimen.getByRole('button',{name:'Scroll',exact:true}).click();
  await specimen.getByRole('searchbox',{name:'Find records',exact:true}).fill('ROW-10000');
  await expect(specimen.getByRole('checkbox',{name:'Select ROW-10000',exact:true})).toBeChecked();
  await expectContained(page);
  await openQualityPage(page,'/blocks/large-issue-table',info);
  await page.getByRole('region',{name:'Large issue workspace',exact:true}).getByRole('checkbox',{name:'Select ISS-10001',exact:true}).waitFor();
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  const queue=page.getByRole('region',{name:'Large issue workspace',exact:true});
  await expect.poll(()=>queue.evaluate(panel=>{const box=panel.getBoundingClientRect();return [...panel.querySelectorAll('.bblocks-large-issue-toolbar > *')].every(field=>{const rect=field.getBoundingClientRect();return rect.left>=box.left&&rect.right<=box.right;});})).toBe(true);
  await expectContained(page);
});

test('schedule booking preserves explicit instants, draft and return focus',async({page},info)=>{
  await openQualityPage(page,'/blocks/schedule-planner',info);
  const specimen=page.getByRole('region',{name:'Schedule planner',exact:true});
  const slot=specimen.getByRole('button',{name:/^Book 09:00/}).first();await expect(slot).toBeVisible();
  await slot.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Book a time',exact:true}),title=dialog.getByRole('textbox',{name:'Appointment title',exact:true});
  await expect(title).toBeFocused();await title.fill('Keyboard schedule review');
  await expect(dialog).toContainText('UTC+11:00');
  await dialog.getByRole('button',{name:'Book appointment',exact:true}).click();await expect(dialog).not.toBeVisible();
  const event=specimen.getByRole('button',{name:'View Keyboard schedule review',exact:true});await expect(event).toBeVisible();
  await event.click();const details=page.getByRole('dialog',{name:'Appointment details',exact:true});
  await expect(details.locator('time[dateTime="2026-11-01T22:00:00.000Z"]')).toBeVisible();
  await page.keyboard.press('Escape');await expect(details).not.toBeVisible();await expect(event).toBeFocused();
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  expect(await specimen.evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1)).toBe(true);await expectContained(page);
});

test('table ordering retains failed move drafts, selection and keyboard context under normal motion',async({page},info)=>{
  await openQualityPage(page,'/examples/table-ordering',info);
  const example=page.getByRole('region',{name:'Table ordering example',exact:true,includeHidden:true});
  const table=example.getByRole('table',{name:'Ordered projects',exact:true,includeHidden:true});
  const order=()=>table.locator('tbody tr[data-row-key]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-row-key')));
  const columns=example.getByRole('button',{name:'Columns',exact:true});
  await columns.focus();await page.keyboard.press('Enter');
  const owner=page.getByRole('button',{name:'Move Owner column',exact:true});
  await owner.focus();await page.keyboard.press('Enter');
  const columnDialog=page.getByRole('dialog',{name:'Move column',exact:true});
  await expect(columnDialog).not.toHaveAttribute('data-starting-style');
  await expect(page.locator('.bui-popover')).not.toBeVisible();
  const columnPosition=columnDialog.getByRole('combobox',{name:'Column position',exact:true});
  await columnPosition.focus();await page.keyboard.press('Enter');
  const beforeProject=page.getByRole('option',{name:'Before Project',exact:true});
  await beforeProject.focus();await page.keyboard.press('Enter');
  await columnDialog.getByRole('button',{name:'Move column',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(columnDialog).not.toBeVisible();await expect(columns).toBeFocused();
  await page.keyboard.press('Escape');
  await expect.poll(()=>table.locator('thead th[aria-label]').evaluateAll(headers=>headers.map(header=>header.getAttribute('aria-label')))).toEqual(['Owner','Project','Status']);
  await expectContained(page);

  const selection=example.getByRole('checkbox',{name:'Select Navigation study',exact:true});
  await selection.focus();await page.keyboard.press('Space');await expect(selection).toBeChecked();
  const fail=example.getByRole('checkbox',{name:'Fail next row save',exact:true});
  await fail.focus();await page.keyboard.press('Space');
  const handle=example.getByRole('button',{name:'Move Navigation study',exact:true});
  await handle.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Move row',exact:true});
  await expect(dialog).not.toHaveAttribute('data-starting-style');
  const position=dialog.getByRole('combobox',{name:'Row position',exact:true});
  await position.focus();await page.keyboard.press('Enter');
  const beforeIcon=page.getByRole('option',{name:'Before Icon audit',exact:true});
  await beforeIcon.focus();await page.keyboard.press('Enter');
  const save=dialog.getByRole('button',{name:'Save row position',exact:true});
  await save.focus();await page.keyboard.press('Enter');
  await expect(dialog.getByRole('alert')).toContainText('could not be saved');
  await expect.poll(order).toEqual(['navigation','forms','motion','end']);
  await expect(position).toContainText('Before Icon audit');await expect(save).toBeFocused();
  await page.keyboard.press('Enter');await expect(dialog).not.toBeVisible();
  await expect.poll(order).toEqual(['forms','motion','navigation','end']);
  await expect(handle).toBeFocused();await expect(selection).toBeChecked();
  await example.getByRole('button',{name:'Clear selection',exact:true}).click();
  await expect(selection).toBeFocused();await expect(selection).not.toBeChecked();
  await expectContained(page);
});


test('nested filters preserve invalid drafts, group motion and keyboard context through exclusion',async({page},info)=>{
  await openQualityPage(page,'/blocks/issue-table',info);
  await expect(page.getByText('12 results',{exact:true})).toBeVisible();
  const filters=page.getByRole('button',{name:/^Filters/});await filters.focus();await page.keyboard.press('Enter');
  const add=page.getByRole('button',{name:'Add group',exact:true});await add.focus();
  // Capture the insertion before its first animation frame; the browser controls
  // subsequent frame cadence and the test waits for the real settled layout.
  await page.evaluate(()=>{
    const host=window as Window & {nestedMotionStart?:{height:number;inlineHeight:string}};
    const observer=new MutationObserver(()=>{
      const group=document.querySelector<HTMLElement>('.bui-filter-group');if(!group)return;
      host.nestedMotionStart={height:group.getBoundingClientRect().height,inlineHeight:group.style.height};observer.disconnect();
    });observer.observe(document.body,{childList:true,subtree:true});
  });
  await page.keyboard.press('Enter');
  const group=page.locator('.bui-filter-group'),field=page.getByRole('combobox',{name:'Filter 1 field',exact:true});
  await expect(field).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>(window as Window & {nestedMotionStart?:unknown}).nestedMotionStart!==undefined)).toBe(true);
  const initial=await page.evaluate(()=>(window as Window & {nestedMotionStart?:{height:number;inlineHeight:string}}).nestedMotionStart!);
  expect(parseFloat(initial.inlineHeight)).toBe(0);
  await expect.poll(()=>group.evaluate(element=>(element as HTMLElement).style.height)).toBe('auto');
  expect((await group.boundingBox())!.height).toBeGreaterThan(initial.height+30);
  const apply=page.getByRole('button',{name:'Apply filters',exact:true});await apply.focus();await page.keyboard.press('Enter');
  await expect(page.getByText('Enter a value.',{exact:true})).toBeVisible();
  const value=page.getByRole('textbox',{name:'Filter 1 value',exact:true});await expect(value).toBeFocused();
  await expect(page.getByText('12 results',{exact:true})).toBeVisible();
  await value.fill('dialog');await apply.focus();await page.keyboard.press('Enter');
  await expect(page.getByText('1 results',{exact:true})).toBeVisible();
  const exclude=page.getByRole('checkbox',{name:'Exclude group 1',exact:true});await exclude.focus();await page.keyboard.press('Space');
  await expect(exclude).toBeChecked();await expect(page.getByText('1 results',{exact:true})).toBeVisible();
  await apply.focus();await page.keyboard.press('Enter');await expect(page.getByText('11 results',{exact:true})).toBeVisible();
  await expect.poll(()=>JSON.parse(new URL(page.url()).searchParams.get('buiIssues')!).filters.root.children[0].not).toBe(true);
  const remove=page.getByRole('button',{name:'Remove group 1',exact:true});await remove.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();await expect(group).toHaveCount(0);
  await expect(page.getByRole('combobox',{name:'Match conditions',exact:true})).toContainText('Match all');
  await expectContained(page);
});

test('remote choices keep selected labels, recover failed search and submit stable IDs under normal motion',async({page},info)=>{
  await openQualityPage(page,'/examples/async-selection',info);
  const assignee=page.getByRole('combobox',{name:'Assignee',exact:true}),reviewers=page.getByRole('combobox',{name:'Reviewers',exact:true});
  await expect(assignee).toHaveValue('Maya Chen');await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();
  await reviewers.fill('Oliver');await expect(page.getByRole('option').filter({hasText:'Oliver Reed'})).toBeVisible();await reviewers.press('ArrowDown');await reviewers.press('Enter');
  await expect(page.getByRole('button',{name:'Remove Oliver Reed',exact:true})).toBeVisible();await reviewers.fill('Casey');await expect(page.getByRole('option').filter({hasText:'Casey'})).toHaveCount(3);await reviewers.press('Escape');
  await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Remove Oliver Reed',exact:true})).toBeVisible();
  const fail=page.getByRole('checkbox',{name:'Fail next search',exact:true});await fail.focus();await page.keyboard.press('Space');
  await page.getByRole('button',{name:'Show assignee options',exact:true}).click();const retry=page.getByRole('button',{name:'Retry assignee search',exact:true});await expect(retry).toBeVisible();await retry.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox',{name:'Assignee options',exact:true}).getByRole('option')).toHaveCount(20);await expect(assignee).toBeFocused();await assignee.press('Escape');
  await page.getByRole('button',{name:'Read form values',exact:true}).click();await expect(page.getByLabel('Submitted IDs')).toContainText('["assignee","maya"]');await expect(page.getByLabel('Submitted IDs')).toContainText('["reviewers","oliver"]');await expectContained(page);
});

test('hierarchical choices keep labels, keyboard focus and a continuous level transition under normal motion',async({page},info)=>{
  await openQualityPage(page,'/examples/cascader',info);
  const trigger=page.getByRole('button',{name:'Project area',exact:true});await expect(trigger).toContainText('Engineering / Frontend / React');await trigger.focus();await trigger.press('Enter');
  await page.getByRole('button',{name:'All options',exact:true}).click();await page.getByRole('button',{name:'Open Engineering',exact:true}).click();const backend=page.getByRole('button',{name:'Open Backend',exact:true});await expect(backend).toBeVisible();
  // Sample the actual CSS timeline at two phases; do not depend on a renderer's frame cadence.
  await page.locator('.bui-cascader-popup').evaluate(element=>{
    const observer=new MutationObserver(()=>{const level=element.querySelector('.bui-cascader-level'),animation=level?.getAnimations().find(item=>(item as CSSAnimation).animationName==='bui-cascader-level-in');if(!animation)return;animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*.2;(window as Window & {cascaderMotion?:Animation}).cascaderMotion=animation;observer.disconnect();});
    observer.observe(element,{childList:true,subtree:true});
  });
  await backend.focus();await backend.press('ArrowRight');await expect(page.getByRole('button',{name:'Choose .NET',exact:true})).toBeFocused();await expect.poll(()=>page.evaluate(()=>!!(window as Window & {cascaderMotion?:Animation}).cascaderMotion)).toBe(true);
  const level=page.locator('.bui-cascader-level');await page.screenshot({animations:'allow'});const early=await level.evaluate(element=>({opacity:Number(getComputedStyle(element).opacity),height:element.getBoundingClientRect().height,minHeight:getComputedStyle(element).minHeight}));expect(early.opacity).toBeGreaterThan(0);expect(early.opacity).toBeLessThan(1);expect(early.minHeight).toBe('144px');expect(Math.round(early.height*64)/64).toBeGreaterThanOrEqual(144);
  await page.evaluate(()=>{const animation=(window as Window & {cascaderMotion?:Animation}).cascaderMotion!;animation.currentTime=Number(animation.effect!.getTiming().duration)*.8;});await page.screenshot({animations:'allow'});expect(await level.evaluate(element=>Number(getComputedStyle(element).opacity))).toBeGreaterThan(early.opacity);
  await expect(trigger).toContainText('Engineering / Frontend / React');await page.evaluate(()=>{const host=window as Window & {cascaderMotion?:Animation};host.cascaderMotion!.play();delete host.cascaderMotion;});await page.keyboard.press('Enter');await expect(page.locator('.bui-cascader-popup')).not.toBeVisible();await expect(trigger).toBeFocused();await expect(trigger).toContainText('Engineering / Backend / .NET');await page.getByRole('button',{name:'Read path value',exact:true}).click();await expect(page.getByLabel('Submitted path',{exact:true})).toHaveText('["engineering","backend","dotnet"]');await expectContained(page);
});

test('calendar view height, keyboard dates and retry preserve context under normal motion',async({page},info)=>{
  // Isolate the view transition from the workspace's separate range-loading
  // transition, which legitimately retargets height when the response arrives.
  await openQualityPage(page,'/components/event-calendar',info);
  const calendar=page.getByRole('region',{name:'Team calendar',exact:true}),stage=calendar.locator('.bui-event-calendar-stage');
  await expect(calendar.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  await expect.poll(()=>stage.evaluate(element=>parseFloat((element as HTMLElement).style.height)||0)).toBeGreaterThan(0);
  await stage.evaluate(element=>{
    const observer=new MutationObserver(()=>{
      element.getBoundingClientRect();
      const animation=element.getAnimations().find(item=>(item as CSSTransition).transitionProperty==='height');if(!animation)return;
      animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*.2;
      (window as Window&{calendarHeightMotion?:Animation}).calendarHeightMotion=animation;observer.disconnect();
    });observer.observe(element,{attributes:true,attributeFilter:['style']});
  });
  const week=calendar.getByRole('button',{name:'Week',exact:true});await week.focus();await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>!!(window as Window&{calendarHeightMotion?:Animation}).calendarHeightMotion)).toBe(true);
  await page.screenshot({animations:'allow'});const early=(await stage.boundingBox())!.height;
  await page.evaluate(()=>{const animation=(window as Window&{calendarHeightMotion?:Animation}).calendarHeightMotion!;animation.currentTime=Number(animation.effect!.getTiming().duration)*.8;});
  await page.screenshot({animations:'allow'});expect((await stage.boundingBox())!.height).toBeLessThan(early-5);
  await page.evaluate(()=>{const host=window as Window&{calendarHeightMotion?:Animation};host.calendarHeightMotion!.play();delete host.calendarHeightMotion;});
  await expect(calendar.locator('[data-calendar-date]')).toHaveCount(7);await expect(week).toBeFocused();await expectContained(page);
  await openQualityPage(page,'/blocks/calendar-workspace',info);
  const sample=page.getByRole('region',{name:'Workspace calendar',exact:true}),workspaceStage=sample.locator('.bui-event-calendar-stage');
  const date=(value:string)=>sample.locator('[data-calendar-date="'+value+'"]');
  await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  await sample.getByRole('button',{name:'Week',exact:true}).focus();await page.keyboard.press('Enter');await expect(sample.locator('[data-calendar-date]')).toHaveCount(7);await expect(sample.getByRole('button',{name:'View Interface review',exact:true})).toBeVisible();
  await date('2026-11-02').focus();await page.keyboard.press('ArrowRight');await expect(date('2026-11-03')).toBeFocused();await page.keyboard.press('Enter');await expect(date('2026-11-03')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('PageDown');await expect(date('2026-11-10')).toBeFocused();const action=sample.getByRole('button',{name:'View Documentation review',exact:true});await expect(action).toBeVisible();await action.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Calendar event details',exact:true});await expect(dialog.locator('time').first()).toHaveAttribute('datetime','2026-11-09T22:00:00.000Z');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(action).toBeFocused();
  await page.getByRole('checkbox',{name:'Fail next calendar load',exact:true}).check();await page.getByRole('button',{name:'Reload events',exact:true}).click();const retry=sample.getByRole('button',{name:'Retry loading events',exact:true});await expect(retry).toBeVisible();await retry.focus();await page.keyboard.press('Enter');await expect(action).toBeVisible();await expect(date('2026-11-10')).toBeFocused();
  await page.emulateMedia({reducedMotion:'reduce'});const month=sample.getByRole('button',{name:'Month',exact:true});await month.focus();await page.keyboard.press('Enter');await expect(sample.locator('[data-calendar-date]')).toHaveCount(42);await expect(month).toBeFocused();expect(await workspaceStage.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');expect(await sample.locator('.bui-event-calendar-grid').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');await expectContained(page);
});

test('upload insertion, failed acknowledgement and keyboard retry preserve context under normal motion',async({page},info)=>{
  await openQualityPage(page,'/examples/upload-http',info);
  const queue=page.getByRole('group',{name:'Files to receive',exact:true}),list=queue.locator('.bui-upload-queue-list');
  await list.evaluate(element=>{
    const observer=new MutationObserver(()=>{const row=element.querySelector('[data-upload-id]'),animation=row?.getAnimations().find(item=>(item as CSSAnimation).animationName==='bui-upload-row-in');if(!animation)return;animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*.2;(window as Window&{uploadRowMotion?:Animation}).uploadRowMotion=animation;observer.disconnect();});observer.observe(element,{childList:true});
  });
  await page.getByLabel('Files to receive files',{exact:true}).setInputFiles({name:'motion-review.txt',mimeType:'text/plain',buffer:Buffer.from('Useful material')});
  const row=queue.locator('[data-upload-id]');await expect(row).toHaveAttribute('data-upload-status','queued');await expect.poll(()=>page.evaluate(()=>!!(window as Window&{uploadRowMotion?:Animation}).uploadRowMotion)).toBe(true);
  await page.screenshot({animations:'allow'});const early=await row.evaluate(element=>Number(getComputedStyle(element).opacity));expect(early).toBeGreaterThan(0);expect(early).toBeLessThan(1);
  await page.evaluate(()=>{const animation=(window as Window&{uploadRowMotion?:Animation}).uploadRowMotion!;animation.currentTime=Number(animation.effect!.getTiming().duration)*.8;});await page.screenshot({animations:'allow'});expect(await row.evaluate(element=>Number(getComputedStyle(element).opacity))).toBeGreaterThan(early);
  await page.evaluate(()=>{const host=window as Window&{uploadRowMotion?:Animation};host.uploadRowMotion!.play();delete host.uploadRowMotion;});
  const fail=page.getByRole('checkbox',{name:'Fail next upload',exact:true});await fail.focus();await page.keyboard.press('Space');const start=queue.getByRole('button',{name:'Start queued',exact:true});await start.focus();await page.keyboard.press('Enter');
  await expect(row).toHaveAttribute('data-upload-status','error');const retry=queue.getByRole('button',{name:'Retry motion-review.txt',exact:true});await expect(retry).toBeFocused();await page.keyboard.press('Enter');await expect(row).toHaveAttribute('data-upload-status','complete');
  const remove=queue.getByRole('button',{name:'Remove motion-review.txt',exact:true});await expect(remove).toBeFocused();await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Enter');await expect(queue.getByRole('button',{name:'Browse files',exact:true})).toBeFocused();expect(await queue.locator('.bui-upload-queue-stage').evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.getByLabel('Files to receive files',{exact:true}).setInputFiles({name:'reduced-review.txt',mimeType:'text/plain',buffer:Buffer.from('More useful material')});expect(await queue.locator('[data-upload-id]').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');await expectContained(page);
});
