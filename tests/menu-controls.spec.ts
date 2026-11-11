import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const example=(page:import('@playwright/test').Page,id:string)=>page.locator('[data-example-id="'+id+'"]');

test('nested dropdown actions skip disabled destinations and return focus after selection',async({page})=>{
  await page.goto('/components/dropdown');const surface=example(page,'dropdown-actions'),trigger=surface.getByRole('button',{name:'Record actions',exact:true});
  await trigger.focus();await trigger.press('ArrowDown');await expect(page.getByRole('menuitem',{name:'Mark reviewed',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowDown');const move=page.getByRole('menuitem',{name:'Move to',exact:true});await expect(move).toBeFocused();await page.keyboard.press('ArrowRight');
  const submenu=page.getByRole('menu',{name:'Move to',exact:true});await expect(submenu).toBeVisible();await expect(submenu.getByRole('menuitem',{name:'Restricted area',exact:true})).toHaveAttribute('aria-disabled','true');
  await expect(submenu.getByRole('menuitem',{name:'Inbox',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');await expect(submenu.getByRole('menuitem',{name:'Review queue',exact:true})).toBeFocused();await page.keyboard.press('Enter');
  await expect(submenu).not.toBeVisible();await expect(trigger).toBeFocused();await expect(surface.getByRole('status')).toContainText('Location: Review queue');
  await trigger.press('ArrowDown');await page.getByRole('menuitem',{name:'Move to',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(submenu).toBeVisible();await page.keyboard.press('Escape');await expect(submenu).not.toBeVisible();await expect(move).toBeFocused();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('controlled menu checkbox and radio values remain open and survive reopening',async({page})=>{
  await page.goto('/components/dropdown');const surface=example(page,'dropdown-preferences'),trigger=surface.getByRole('button',{name:'View preferences',exact:true});await trigger.click();
  const labels=page.getByRole('menuitemcheckbox',{name:'Show labels',exact:true});await expect(labels).toHaveAttribute('aria-checked','true');await labels.focus();await page.keyboard.press('Space');await expect(labels).toHaveAttribute('aria-checked','false');await expect(labels).toBeFocused();
  const compact=page.getByRole('menuitemradio',{name:'Compact spacing',exact:true});await compact.focus();await page.keyboard.press('Space');await expect(compact).toHaveAttribute('aria-checked','true');await expect(compact).toBeFocused();
  await expect(page.getByRole('menuitemradio',{name:'Automatic spacing',exact:true})).toHaveAttribute('aria-disabled','true');await expect(surface.getByRole('status')).toContainText('Labels hidden · Compact spacing');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await trigger.click();await expect(labels).toHaveAttribute('aria-checked','false');await expect(compact).toHaveAttribute('aria-checked','true');await page.getByRole('menuitem',{name:'Close view preferences',exact:true}).click();await expect(trigger).toBeFocused();
});

test('toggle groups use stable form values, keyboard focus, validation and reset',async({page})=>{
  await page.goto('/components/toggle-group');const surface=example(page,'toggle-formatting'),alignment=surface.getByRole('group',{name:/Text alignment/}),format=surface.getByRole('group',{name:'Text formatting',exact:true}),output=surface.getByLabel('Formatting form values');
  const left=alignment.getByRole('button',{name:'Align left',exact:true}),center=alignment.getByRole('button',{name:'Align center',exact:true});await expect(left).toHaveAttribute('aria-pressed','true');
  await left.focus();await page.keyboard.press('ArrowRight');await expect(center).toBeFocused();await page.keyboard.press('Space');await expect(center).toHaveAttribute('aria-pressed','true');await expect(left).toHaveAttribute('aria-pressed','false');
  await format.getByRole('button',{name:'Italic text',exact:true}).click();await expect(format.getByRole('button',{name:'Bold text',exact:true})).toHaveAttribute('aria-pressed','true');await expect(format.getByRole('button',{name:'Italic text',exact:true})).toHaveAttribute('aria-pressed','true');await expect(format.getByRole('button',{name:'Underline text',exact:true})).toBeDisabled();
  await expect(output).toContainText('Submit to inspect');await surface.getByRole('button',{name:'Apply formatting',exact:true}).click();expect(JSON.parse((await output.textContent())!)).toEqual({alignment:['center'],format:['bold','italic']});
  await center.click();await surface.getByRole('button',{name:'Apply formatting',exact:true}).click();await expect(surface.getByRole('alert')).toContainText('Choose at least one option.');await expect(left).toBeFocused();
  await surface.getByRole('button',{name:'Reset formatting',exact:true}).click();await expect(left).toHaveAttribute('aria-pressed','true');await expect(format.getByRole('button',{name:'Italic text',exact:true})).toHaveAttribute('aria-pressed','false');await expect(surface.getByRole('alert')).toHaveCount(0);
});

test('tag entry commits explicitly, preserves rejected text and focuses removals before deleting',async({page})=>{
  await page.goto('/components/tag-input');const surface=example(page,'tag-input-validation'),input=surface.getByRole('textbox',{name:'Topics',exact:true}),tags=surface.getByRole('list',{name:'Topics tags',exact:true}),output=surface.getByLabel('Tag form values');
  await input.fill('TypeScript');await input.press('Enter');await expect(tags.getByRole('listitem')).toHaveCount(2);await expect(output).toContainText('Submit to inspect');
  await input.fill('react');await input.press('Enter');await expect(surface.getByRole('alert')).toContainText('Already added: react');await expect(input).toHaveValue('react');await expect(tags.getByRole('listitem')).toHaveCount(2);
  await input.fill('#Design');await input.press(',');await expect(surface.getByRole('alert')).toContainText('Use the topic name without #.');await expect(input).toHaveValue('#Design');
  await input.fill('');await input.press('Backspace');const remove=surface.getByRole('button',{name:'Remove TypeScript',exact:true});await expect(remove).toBeFocused();await expect(tags.getByRole('listitem')).toHaveCount(2);await page.keyboard.press('Backspace');await expect(tags.getByRole('listitem')).toHaveCount(1);await page.keyboard.press('Escape');await expect(input).toBeFocused();
  await input.evaluate(element=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain','UI, Design');element.dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}));});await expect(tags.getByRole('listitem')).toHaveCount(3);await expect(input).toHaveValue('');
  await input.evaluate(element=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain','Extra, Another');element.dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}));});await expect(tags.getByRole('listitem')).toHaveCount(3);await expect(input).toHaveValue('Extra, Another');await expect(surface.getByRole('alert')).toContainText('Use no more than 3 tags.');
  await input.fill('');await surface.getByRole('button',{name:'Save topics',exact:true}).click();expect(JSON.parse((await output.textContent())!)).toEqual({topics:['React','UI','Design'],reviewers:['Documentation']});
});

test('tag forms preserve controlled readonly values, native required errors and reset',async({page})=>{
  await page.goto('/components/tag-input');const surface=example(page,'tag-input-validation'),input=surface.getByRole('textbox',{name:'Topics',exact:true}),reviewers=surface.getByRole('textbox',{name:'Reviewer labels',exact:true}),output=surface.getByLabel('Tag form values');
  await surface.getByRole('checkbox',{name:'Lock reviewer labels',exact:true}).check();await expect(reviewers).toHaveAttribute('readonly','');await expect(surface.getByRole('button',{name:'Remove Documentation',exact:true})).toHaveCount(0);await reviewers.focus();await reviewers.press('Enter');await expect(output).toContainText('Submit to inspect');
  await surface.getByRole('button',{name:'Remove React',exact:true}).click();await expect(input).toBeFocused();await surface.getByRole('button',{name:'Save topics',exact:true}).click();await expect(surface.getByRole('alert')).toContainText('Add at least one tag.');await expect(input).toBeFocused();
  await input.fill('Vue');await input.press('Enter');await surface.getByRole('button',{name:'Save topics',exact:true}).click();expect(JSON.parse((await output.textContent())!)).toEqual({topics:['Vue'],reviewers:['Documentation']});
  await surface.getByRole('button',{name:'Reset topics',exact:true}).click();await expect(surface.getByRole('list',{name:'Topics tags',exact:true})).toContainText('React');await expect(reviewers).not.toHaveAttribute('readonly','');await expect(surface.getByRole('alert')).toHaveCount(0);
});

for(const theme of ['light','dark'])test('menu, toggle and tag examples remain contained and accessible in '+theme,async({page})=>{
  await page.setViewportSize({width:390,height:900});
  for(const route of ['/components/dropdown','/components/toggle-group','/components/tag-input']){
    await page.goto(route);await page.evaluate(value=>{document.documentElement.dataset.uiTheme=value;},theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),route).toEqual([]);
  }
});
