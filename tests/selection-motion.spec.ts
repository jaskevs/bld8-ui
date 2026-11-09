import {test,expect,type Page,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Frame={height:number;slot:number;y:number;width:number;scroll:number;tick:number;dash:number};
type Recording={running:boolean;frames:Frame[]};
type MotionWindow=Window & {selectionRecording?:Recording};
test.use({viewport:{width:1280,height:1000},reducedMotion:'no-preference'});
async function resources(page:Page){await page.goto('/blocks/resources');await page.evaluate(()=>document.fonts.ready);const block=page.getByRole('region',{name:'Resource library',exact:true});await block.scrollIntoViewIfNeeded();return block;}
async function record(page:Page,selector='[aria-label="Resource library"]',barSelector='.bui-reveal--table-selection'){await page.evaluate(({selector,barSelector})=>{
  const recording:Recording={running:true,frames:[]};(window as MotionWindow).selectionRecording=recording;
  const sample=()=>{const root=document.querySelector(selector)!,bar=root.querySelector(barSelector)!,table=root.querySelector('.bui-table-scroll,.bui-windowed-scroll')!,checkbox=root.querySelector('thead input')!;
    recording.frames.push({height:bar.getBoundingClientRect().height,slot:(root.querySelector('.bblocks-large-issue-selection-slot')??bar).getBoundingClientRect().height,y:table.getBoundingClientRect().y,width:table.getBoundingClientRect().width,scroll:scrollY,tick:Number(getComputedStyle(checkbox,'::after').opacity),dash:Number(getComputedStyle(checkbox,'::before').opacity)});if(recording.running)requestAnimationFrame(sample);
  };sample();
},{selector,barSelector});}
async function stop(page:Page){return page.evaluate(()=>{const recording=(window as MotionWindow).selectionRecording!;recording.running=false;return recording.frames;});}
async function settle(reveal:Locator,open:boolean){await expect(reveal).toHaveAttribute('data-open',String(open));await expect.poll(()=>reveal.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);}

test('bulk actions expand and collapse real table space over multiple frames without shifting columns',async({page})=>{
  const block=await resources(page),checkbox=block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}),reveal=block.locator('.bui-reveal--table-selection');
  for(const open of [true,false]){
    await record(page);if(open)await checkbox.check();else await block.getByRole('button',{name:'Clear selection',exact:true}).click();
    await settle(reveal,open);const frames=await stop(page),first=frames[0],last=frames.at(-1)!;
    expect(Math.abs(last.height-first.height)).toBeGreaterThan(40);
    const intermediate=new Set(frames.filter(frame=>frame.height>1&&frame.height<Math.max(first.height,last.height)-1).map(frame=>Math.round(frame.height)));
    expect(intermediate.size,'Actual intermediate heights demonstrate layout motion, not only a fade').toBeGreaterThan(3);
    for(let index=1;index<frames.length;index++){expect(Math.abs(frames[index].width-first.width)).toBeLessThan(.5);expect(Math.abs(frames[index].scroll-first.scroll)).toBeLessThan(1);expect(Math.abs(frames[index].y-first.y-(frames[index].height-first.height))).toBeLessThan(1);if(open)expect(frames[index].height).toBeGreaterThanOrEqual(frames[index-1].height-.5);else expect(frames[index].height).toBeLessThanOrEqual(frames[index-1].height+.5);}
  }
  await expect(checkbox).toBeFocused();await expect(reveal.locator('.bui-table-selection')).toHaveCount(0);
});

test('quick keyboard reversals retarget the current height and count changes do not replay entry',async({page})=>{
  const block=await resources(page),first=block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}),second=block.getByRole('checkbox',{name:'Select Research notes.txt',exact:true}),reveal=block.locator('.bui-reveal--table-selection');
  await first.focus();await page.keyboard.press('Space');await page.waitForTimeout(90);await page.keyboard.press('Space');await page.waitForTimeout(70);await page.keyboard.press('Space');await settle(reveal,true);
  await expect(first).toBeChecked();await expect(block.getByRole('status').filter({hasText:'1 selected'})).toBeVisible();expect(await block.getByRole('button',{name:'Clear selection',exact:true}).count()).toBe(1);
  const height=(await reveal.boundingBox())!.height;await record(page);await second.focus();await page.keyboard.press('Space');await page.waitForTimeout(360);const frames=await stop(page);expect(frames.every(frame=>Math.abs(frame.height-height)<.5)).toBe(true);await expect(block.getByRole('status').filter({hasText:'2 selected'})).toBeVisible();
});

test('dash and tick crossfade with fixed geometry and the tick eases away when cleared',async({page})=>{
  const block=await resources(page),first=block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}),header=block.getByRole('checkbox',{name:'Select current page',exact:true}),reveal=block.locator('.bui-reveal--table-selection');
  await first.focus();await page.keyboard.press('Space');await settle(reveal,true);await expect(header).toHaveAttribute('aria-checked','mixed');
  await expect.poll(()=>header.evaluate(element=>getComputedStyle(element,'::before').opacity)).toBe('1');
  const geometry=()=>header.evaluate(element=>{const tick=getComputedStyle(element,'::after'),dash=getComputedStyle(element,'::before');return[tick.width,tick.height,tick.left,tick.top,dash.width,dash.height,dash.left,dash.top];});const before=await geometry();
  await record(page);await header.focus();await page.keyboard.press('Space');await expect.poll(()=>header.evaluate(element=>getComputedStyle(element,'::after').opacity)).toBe('1');const checking=await stop(page);expect(checking.some(frame=>frame.tick>.05&&frame.tick<.95&&frame.dash>.05&&frame.dash<.95)).toBe(true);expect(await geometry()).toEqual(before);
  await record(page);await page.keyboard.press('Space');await settle(reveal,false);const clearing=await stop(page);expect(clearing.some(frame=>frame.tick>.05&&frame.tick<.95)).toBe(true);expect(clearing.at(-1)!.tick).toBe(0);expect(await geometry()).toEqual(before);await expect(header).toBeFocused();
});

test('live reduced motion settles the reveal and all checkbox indicators immediately',async({page})=>{
  const block=await resources(page),first=block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}),reveal=block.locator('.bui-reveal--table-selection');
  await first.focus();await page.keyboard.press('Space');await page.waitForTimeout(80);await page.emulateMedia({reducedMotion:'reduce'});await settle(reveal,true);await expect(reveal).toHaveCSS('transition-duration','0s');
  expect(await first.evaluate(element=>getComputedStyle(element,'::after').transitionDuration)).toBe('0s');await page.keyboard.press('Space');await expect(reveal.locator('.bui-table-selection')).toHaveCount(0);expect((await reveal.boundingBox())!.height).toBe(0);
  await page.emulateMedia({forcedColors:'active'});await first.focus();await page.keyboard.press('Space');expect(await first.evaluate(element=>getComputedStyle(element).outlineStyle)).toBe('solid');expect(await first.evaluate(element=>getComputedStyle(element).boxShadow)).toBe('none');
});

test('archiving and undo share the reveal and keep a useful keyboard destination',async({page})=>{
  const block=await resources(page),reveal=block.locator('.bui-reveal--table-selection');await block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}).check();await settle(reveal,true);
  await block.getByRole('button',{name:'Archive',exact:true}).click();await settle(reveal,false);await expect(block.getByRole('button',{name:'Undo archive',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.activeElement===document.body)).toBe(false);const height=(await block.locator('.bblocks-resource-footer').boundingBox())!.height;
  await block.getByRole('button',{name:'Undo archive',exact:true}).click();await expect(block.getByRole('button',{name:'Undo archive',exact:true})).toHaveCount(0);await expect(block.getByRole('region',{name:'Resources table',exact:true})).toBeFocused();expect((await block.locator('.bblocks-resource-footer').boundingBox())!.height).toBeCloseTo(height,0);
});

for(const width of [390,1280])test(`large issue selection stays in its reserved slot at ${width}px and has one action bar`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/blocks/large-issue-table');const block=page.getByRole('region',{name:'Large issue workspace',exact:true});const row=block.getByRole('checkbox',{name:'Select ISS-10001',exact:true});await row.waitFor();await row.scrollIntoViewIfNeeded();const slot=block.locator('.bblocks-large-issue-selection-slot'),height=(await slot.boundingBox())!.height;
  await record(page,'[aria-label="Large issue workspace"]','.bblocks-large-issue-selection-slot>.bui-reveal');await row.check();await expect(block.getByRole('button',{name:'Clear selection',exact:true})).toBeVisible();await settle(slot.locator('.bui-reveal'),true);const frames=await stop(page),last=frames.at(-1)!;expect(last.slot).toBeGreaterThanOrEqual(height-.5);if(last.slot>height+2)expect(new Set(frames.filter(frame=>frame.slot>height+.1&&frame.slot<last.slot-.1).map(frame=>frame.slot)).size).toBeGreaterThan(1);expect(await block.getByRole('button',{name:'Clear selection',exact:true}).count()).toBe(1);await block.getByRole('button',{name:'Clear selection',exact:true}).click();await settle(slot.locator('.bui-reveal'),false);expect((await slot.boundingBox())!.height).toBeCloseTo(height,0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(slot.locator(':scope>p')).toHaveCSS('transition-duration','0s');
});

for(const theme of ['light','dark'] as const)test(`moving bulk actions remain accessible and contained in ${theme}`,async({page})=>{
  await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width:390,height:900});const block=await resources(page);await block.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}).check();await settle(block.locator('.bui-reveal--table-selection'),true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const result=await new AxeBuilder({page}).include('[aria-label="Resource library"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
});

test('issue filters use the same reversible reveal without losing their draft',async({page})=>{
  await page.goto('/blocks/issue-table');const block=page.getByRole('region',{name:'Issue workspace',exact:true}),trigger=block.getByRole('button',{name:'Filters',exact:true}),reveal=block.locator('.bblocks-issue-filter-reveal');
  await trigger.click();await settle(reveal,true);await block.getByRole('button',{name:'Add filter',exact:true}).click();await expect(block.getByRole('button',{name:'Remove filter 1',exact:true})).toBeVisible();
  await trigger.click();await settle(reveal,false);await expect(trigger).toBeFocused();await trigger.click();await settle(reveal,true);await expect(block.getByRole('button',{name:'Remove filter 1',exact:true})).toBeVisible();
});
