import {expect} from '@playwright/test';

async function start(example,label){
  const run=example.getByRole('button',{name:'Run example',exact:true});
  if(await run.isVisible())await run.click();
  await expect(example.getByRole('button',{name:label,exact:true})).toBeVisible();
}
function popup(page,label){return page.getByRole('dialog',{name:label+' choices',exact:true});}

/** Shared by the showcase, normal-motion matrix and real installed consumers. Never navigates. */
export async function checkTreeSelectionExample(page,getExample){
  const example=getExample('tree-select-native');await start(example,'Team access');
  const field=example.getByRole('button',{name:'Team access',exact:true}),output=example.getByRole('status',{name:'Tree form values',exact:true}),read=example.getByRole('button',{name:'Read tree values',exact:true});
  expect(await field.evaluate(button=>button.form?.id)).toBe(await example.getByRole('form',{name:'Tree selection form',exact:true}).getAttribute('id'));
  await field.click();let panel=popup(page,'Team access'),product=panel.getByRole('treeitem',{name:'Product',exact:true}),search=panel.getByRole('searchbox',{name:'Search team access choices',exact:true});
  await expect(product).toHaveAttribute('aria-checked','mixed');
  await expect(panel.getByRole('treeitem',{name:'Archived patterns',exact:true})).toHaveAttribute('aria-disabled','true');
  await expect(panel.getByRole('treeitem',{name:'Private notes',exact:true})).toHaveAttribute('aria-disabled','true');
  await search.press('ArrowDown');await expect(product).toBeFocused();await product.press(' ');
  await expect(product).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Escape');await expect(field).toBeFocused();await read.click();
  await expect(output).toHaveText('interface,unavailable-id,motion | research | research | 0');
  const preventReset=example.getByRole('checkbox',{name:'Prevent tree reset',exact:true});await preventReset.check();
  await example.getByRole('button',{name:'Reset tree values',exact:true}).click();await read.click();
  await expect(output).toHaveText('interface,unavailable-id,motion | research | research | 0');await preventReset.uncheck();

  await field.click();panel=popup(page,'Team access');search=panel.getByRole('searchbox',{name:'Search team access choices',exact:true});
  await search.fill('animation');const motion=panel.getByRole('treeitem',{name:'Motion',exact:true});
  await expect(motion).toBeVisible();await expect(panel.getByRole('treeitem',{name:'Interface',exact:true})).toHaveCount(0);
  await motion.press(' ');await page.keyboard.press('Escape');await read.click();
  await expect(output).toHaveText('interface,unavailable-id | research | research | 0');

  const owned=example.getByRole('button',{name:'Application access',exact:true});
  await owned.click();panel=popup(page,'Application access');await panel.getByRole('searchbox').fill('animation');await panel.getByRole('treeitem',{name:'Motion',exact:true}).press(' ');await page.keyboard.press('Escape');
  await field.click();await popup(page,'Team access').getByRole('treeitem',{name:'Product',exact:true}).press(' ');await page.keyboard.press('Escape');
  const changes=await example.getByRole('status',{name:'Tree change count',exact:true}).textContent();
  await example.getByRole('button',{name:'Reset tree values',exact:true}).click();
  await expect.poll(()=>example.getByRole('form',{name:'Tree selection form',exact:true}).evaluate(form=>new FormData(form).getAll('access'))).toEqual(['interface','unavailable-id']);await read.click();
  await expect(output).toHaveText('interface,unavailable-id | research,motion | research | 0');
  await expect(example.getByRole('status',{name:'Tree change count',exact:true})).toHaveText(changes??'');

  const readonly=example.getByRole('button',{name:'Read-only access',exact:true});
  await readonly.click();panel=popup(page,'Read-only access');await panel.getByRole('searchbox').fill('Research');await panel.getByRole('treeitem',{name:'Research',exact:true}).press(' ');
  await expect(panel.getByRole('treeitem',{name:'Research',exact:true})).toHaveAttribute('aria-checked','true');await page.keyboard.press('Escape');
  await expect(example.getByRole('button',{name:'Disabled access',exact:true})).toBeDisabled();

  await example.getByRole('button',{name:'Clear team access',exact:true}).click();await read.click();
  await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');await expect(field).toHaveAccessibleDescription(/Choose at least one team area/);
  await field.click();panel=popup(page,'Team access');product=panel.getByRole('treeitem',{name:'Product',exact:true});await product.press(' ');await page.keyboard.press('Escape');await read.click();
  await expect(output).toHaveText('interface,motion | research,motion | research | 0');await expect(field).not.toHaveAttribute('aria-invalid','true');
  await field.click();await read.click();await expect(read).toBeFocused();await expect(field).toHaveAttribute('aria-expanded','false');
}

/** Complete async fixture proves failures, partial parents, source ownership and explicit cancellation. */
export async function checkLazyTreeSelectionExample(page,getExample){
  const example=getExample('tree-select-lazy');await start(example,'Project areas');
  const field=example.getByRole('button',{name:'Project areas',exact:true}),values=example.getByRole('status',{name:'Lazy tree values',exact:true});
  await field.click();let panel=popup(page,'Project areas'),workspace=panel.getByRole('treeitem',{name:'Workspace',exact:true}),design=panel.getByRole('treeitem',{name:'Design system',exact:true});
  await expect(workspace).toHaveAttribute('aria-checked','mixed');
  await design.press(' ');await expect(panel.getByRole('button',{name:'Retry Design system',exact:true})).toBeVisible();await expect(values).toHaveText('guide');
  await design.press('ArrowRight');await expect(panel.getByRole('treeitem',{name:'Colour system',exact:true})).toBeVisible();await design.press(' ');
  await expect(design).toHaveAttribute('aria-checked','true');await expect(workspace).toHaveAttribute('aria-checked','mixed');await expect(values).toHaveText('guide,studio-colour,studio-type');
  await panel.getByRole('searchbox').fill('palette');await panel.getByRole('treeitem',{name:'Colour system',exact:true}).press(' ');
  await expect(values).toHaveText('guide,studio-type');await panel.getByRole('searchbox').fill('');
  const count=await example.getByRole('status',{name:'Lazy tree changes',exact:true}).textContent();
  await panel.getByRole('treeitem',{name:'Empty collection',exact:true}).press(' ');
  await expect(panel.getByRole('status').filter({hasText:'No choices in Empty collection.'})).toBeVisible();
  await expect(example.getByRole('status',{name:'Lazy tree changes',exact:true})).toHaveText(count??'');
  await panel.getByRole('treeitem',{name:'Invalid example',exact:true}).press(' ');
  await expect(panel.getByRole('alert').filter({hasText:'Loaded choices are invalid.'})).toBeVisible();
  await expect(values).toHaveText('guide,studio-type');await page.keyboard.press('Escape');

  await example.getByRole('button',{name:'Switch tree source',exact:true}).click();
  await expect(example.getByRole('status',{name:'Lazy tree source',exact:true})).toHaveText('archive');await expect(values).toHaveText('guide,studio-type');
  await example.getByRole('button',{name:'Simulate slow tree request',exact:true}).click();await field.click();panel=popup(page,'Project areas');design=panel.getByRole('treeitem',{name:'Design system',exact:true});
  if(await design.getAttribute('aria-expanded')!=='true')await design.press('ArrowRight');
  await expect(design).toHaveAttribute('aria-busy','true');
  // A contained tall popup can cover the outside action; keyboard focus uses the real native path.
  const switchSource=example.getByRole('button',{name:'Switch tree source',exact:true});
  await switchSource.focus();await expect(switchSource).toBeFocused();await switchSource.press('Enter');
  await expect.poll(async()=>Number(await example.getByRole('status',{name:'Aborted tree requests',exact:true}).textContent())).toBeGreaterThan(0);
  await expect(example.getByRole('status',{name:'Lazy tree source',exact:true})).toHaveText('studio');await expect(values).toHaveText('guide,studio-type');
  await expect(field).toHaveAttribute('aria-expanded','false');
}
