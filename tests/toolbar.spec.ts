import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function example(page:Page,id:string){
  await page.goto('/components/toolbar');
  const section=page.locator('[data-example-id="'+id+'"]'),run=section.getByRole('button',{name:'Run example',exact:true});
  if(await run.count()&&await run.isVisible())await run.click();
  await expect(section.locator('[data-example-ready]')).toBeVisible();return section;
}

test('mixed toolbar roves through composed buttons, toggles, link and menu then returns menu focus',async({page})=>{
  const section=await example(page,'toolbar-editor-actions'),toolbar=section.getByRole('toolbar',{name:'Note actions'}),save=toolbar.getByRole('button',{name:'Save note',exact:true}),bold=toolbar.getByRole('button',{name:'Bold',exact:true}),italic=toolbar.getByRole('button',{name:'Italic',exact:true}),link=toolbar.getByRole('link',{name:'Writing guide',exact:true}),more=toolbar.getByRole('button',{name:'More',exact:true});
  expect(await toolbar.locator('button,a,input:not([type="hidden"])').evaluateAll(nodes=>nodes.filter(node=>(node as HTMLElement).tabIndex===0).length)).toBe(1);
  await save.focus();await save.press('ArrowRight');await expect(bold).toBeFocused();await bold.press('Space');await expect(bold).toHaveAttribute('aria-pressed','true');
  await bold.press('ArrowRight');await expect(italic).toBeFocused();await italic.press('ArrowRight');await expect(link).toBeFocused();await link.press('ArrowRight');await expect(more).toBeFocused();
  await more.press('ArrowRight');await expect(save).toBeFocused();await save.press('ArrowLeft');await expect(more).toBeFocused();
  await more.press('Enter');await expect(page.getByRole('menu')).toBeVisible();await page.getByRole('menu').press('Escape');await expect(more).toBeFocused();
  await more.press('Tab');await expect(section.getByRole('textbox',{name:'Release note',exact:true})).toBeFocused();
  await save.click();await expect(section.getByRole('status')).toContainText('Saved');
});

test('disabled group actions are discoverable but cannot mutate selected rows',async({page})=>{
  const section=await example(page,'toolbar-bulk-actions'),toolbar=section.getByRole('toolbar',{name:'Selected row actions'}),archive=toolbar.getByRole('button',{name:'Archive selected',exact:true});
  await expect(archive).toHaveAttribute('aria-disabled','true');await archive.focus();await expect(archive).toBeFocused();await archive.press('Enter');await expect(section.getByRole('checkbox')).toHaveCount(3);
  await section.getByRole('checkbox',{name:'Colour tokens',exact:true}).check();await archive.click();await expect(section.getByRole('status')).toHaveText('Archived 1 local rows');await expect(section.getByRole('checkbox')).toHaveCount(2);await expect(archive).toHaveAttribute('aria-disabled','true');
  await toolbar.getByRole('button',{name:'Restore rows',exact:true}).click();await expect(section.getByRole('checkbox')).toHaveCount(3);
});

test('native filter form submits canonical values and toolbar clear does not submit',async({page})=>{
  const section=await example(page,'toolbar-filter-actions'),input=section.getByRole('searchbox',{name:'Search issues',exact:true}),submitted=section.getByRole('status',{name:'Submitted filters'});
  await input.fill('Review');await section.getByRole('button',{name:'Open',exact:true}).click();await section.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(submitted).toHaveText('Review | open');await expect(section.locator('form li')).toHaveCount(2);
  await section.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(input).toHaveValue('');await expect(submitted).toHaveText('Review | open');await expect(section.locator('form li')).toHaveCount(2);
  await input.fill('Publish');await input.press('Enter');await expect(submitted).toHaveText('Publish | all');await expect(section.locator('form li')).toHaveCount(1);
  expect(await section.locator('form').evaluate(form=>new FormData(form as HTMLFormElement).getAll('status'))).toEqual(['all']);
});

test('vertical toolbar stops at its bounds, skips a locked action and preserves upstream disabled links',async({page})=>{
  const section=await example(page,'toolbar-vertical-tools'),toolbar=section.getByRole('toolbar',{name:'Review tools'}),select=toolbar.getByRole('button',{name:'Select tool',exact:true}),pan=toolbar.getByRole('button',{name:'Pan tool',exact:true}),comment=toolbar.getByRole('button',{name:'Comment tool',exact:true}),help=toolbar.getByRole('link',{name:'Tool help',exact:true});
  await expect(toolbar).toHaveAttribute('aria-orientation','vertical');await select.focus();await select.press('ArrowUp');await expect(select).toBeFocused();await select.press('ArrowDown');await expect(pan).toBeFocused();await pan.press('Enter');await expect(section.getByRole('status')).toHaveText('Active tool: Pan');
  await pan.press('ArrowDown');await expect(comment).toBeFocused();await comment.press('ArrowDown');await expect(help).toBeFocused();await help.press('ArrowDown');await expect(help).toBeFocused();
  await section.getByRole('checkbox',{name:'Disable review tools',exact:true}).check();await expect(select).toHaveAttribute('aria-disabled','true');await select.focus();await select.press('Enter');await expect(section.getByRole('status')).toHaveText('Active tool: Pan');await expect(help).not.toHaveAttribute('aria-disabled','true');
});

test('toolbar layout, focus and live reduced motion work in both themes on a narrow screen',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});
  const section=await example(page,'toolbar-editor-actions'),toolbar=section.getByRole('toolbar',{name:'Note actions'}),button=toolbar.getByRole('button',{name:'Save note',exact:true});
  for(const theme of ['light','dark']){
    await page.evaluate(value=>document.documentElement.setAttribute('data-ui-theme',value),theme);await button.focus();expect(await button.evaluate(node=>getComputedStyle(node).outlineStyle)).toBe('solid');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  expect(await button.evaluate(node=>getComputedStyle(node).transitionDuration)).not.toBe('0s');await page.emulateMedia({reducedMotion:'reduce'});expect(await button.evaluate(node=>getComputedStyle(node).transitionDuration)).toBe('0s');
  const results=await new AxeBuilder({page}).include('[data-example-id="toolbar-editor-actions"]').analyze();expect(results.violations).toEqual([]);
});
