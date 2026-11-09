import {test, expect, openQualityPage, expectContained} from './fixtures';

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
