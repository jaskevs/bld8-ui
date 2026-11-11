import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const example=(page:import('@playwright/test').Page,id:string)=>page.locator('[data-choice-example="'+id+'"]');

test('rich Select preserves canonical form values and controlled popup focus',async({page})=>{
  await page.goto('/components/select');const demo=example(page,'select-rich-options'),field=demo.getByRole('combobox',{name:'Deployment target',exact:true});
  await demo.getByRole('button',{name:'Open target list',exact:true}).click();await expect(field).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('group',{name:'Delivery',exact:true})).toBeVisible();
  const primary=page.getByRole('option',{name:'Primary cluster',exact:true});await expect(primary).toHaveAccessibleDescription('The production destination.');
  await expect(page.getByRole('option',{name:'Archive cluster',exact:true})).toHaveAttribute('aria-disabled','true');
  await primary.click();await expect(field).toContainText('Primary cluster');await expect(field).toBeFocused();
  await demo.getByRole('button',{name:'Read deployment value',exact:true}).click();await expect(demo.locator('output')).toHaveText('cluster-primary');
  await demo.getByRole('button',{name:'Clear deployment target',exact:true}).click();await expect(field).toBeFocused();
  await demo.getByRole('button',{name:'Read deployment value',exact:true}).click();await expect(demo.locator('output')).toHaveText('');
});

test('empty Select feedback and validation recover when choices arrive',async({page})=>{
  await page.goto('/components/select');const demo=example(page,'select-empty-validation'),field=demo.getByRole('combobox',{name:'Release destination',exact:true});
  await field.click();const empty=page.getByRole('option',{name:'No destinations are available.',exact:true});await expect(empty).toHaveAttribute('aria-disabled','true');
  await page.keyboard.press('Escape');await demo.getByRole('button',{name:'Check destination',exact:true}).click();await expect(field).toHaveAttribute('aria-invalid','true');
  await demo.getByRole('button',{name:'Load example destinations',exact:true}).click();await field.focus();await page.keyboard.press('Enter');
  await page.getByRole('option',{name:'Edge destination',exact:true}).click();await expect(field).not.toHaveAttribute('aria-invalid','true');
  await demo.getByRole('button',{name:'Check destination',exact:true}).click();await expect(demo.locator('output')).toHaveText('edge');await expect(demo.getByRole('combobox',{name:'Managed region',exact:true})).toBeDisabled();
});

test('local Combobox searches option aliases and submits IDs instead of display labels',async({page})=>{
  await page.goto('/components/combobox');const demo=example(page,'combobox-canonical-options'),field=demo.getByRole('combobox',{name:'Office location',exact:true});
  await field.fill('aotearoa');const option=page.getByRole('option',{name:'Wellington studio',exact:true});await expect(option).toHaveAccessibleDescription('Waterfront workspace.');await expect(page.getByRole('group',{name:'New Zealand',exact:true})).toBeVisible();
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(field).toHaveValue('Wellington studio');
  await demo.getByRole('button',{name:'Read office ID',exact:true}).click();await expect(demo.locator('output')).toHaveText('wlg-studio');
  await field.fill('no matching studio');await expect(page.getByText('No matching options.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await demo.getByRole('button',{name:'Read office ID',exact:true}).click();await expect(demo.locator('output')).toHaveText('wlg-studio');await expect(demo.getByText('Office field touched: yes',{exact:true})).toBeVisible();
});

test('legacy Combobox items remain values while empty and disabled fields are explicit',async({page})=>{
  await page.goto('/components/combobox');const demo=example(page,'combobox-legacy-states'),field=demo.getByRole('combobox',{name:'Legacy city strings',exact:true});
  await field.fill('Oslo');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await demo.getByRole('button',{name:'Read legacy city',exact:true}).click();await expect(demo.locator('output')).toHaveText('Oslo');
  const empty=demo.getByRole('combobox',{name:'Unavailable office',exact:true});await empty.click();await expect(page.getByText('No office choices are available.',{exact:true})).toBeVisible();await expect(empty).toHaveAttribute('aria-invalid','true');await page.keyboard.press('Escape');
  await expect(demo.getByRole('combobox',{name:'Managed office',exact:true})).toBeDisabled();
});

test('grouped MultiSelect keeps canonical IDs, disabled choices and input focus on clear',async({page})=>{
  await page.goto('/components/multi-select');const demo=example(page,'multi-select-grouped-reviewers'),field=demo.getByRole('combobox',{name:'Review panel',exact:true});
  await demo.getByRole('button',{name:'Open reviewer list',exact:true}).click();await expect(field).toHaveAttribute('aria-expanded','true');await expect(page.getByRole('group',{name:'Contributors',exact:true})).toBeVisible();
  await expect(page.getByRole('option',{name:'Noor Sethi',exact:true})).toHaveAttribute('aria-disabled','true');await page.getByRole('option',{name:'Jules Park',exact:true}).click();
  await page.keyboard.press('Escape');await demo.getByRole('button',{name:'Read reviewer IDs',exact:true}).click();await expect(demo.locator('output')).toHaveText('avery, jules');
  await demo.getByRole('button',{name:'Clear review panel',exact:true}).click();await expect(field).toBeFocused();await demo.getByRole('button',{name:'Read reviewer IDs',exact:true}).click();await expect(demo.locator('output')).toHaveText('');
});

test('required MultiSelect links errors and recovers without losing the selected IDs',async({page})=>{
  await page.goto('/components/multi-select');const demo=example(page,'multi-select-validation'),field=demo.getByRole('combobox',{name:'Required reviewers',exact:true});
  await demo.getByRole('button',{name:'Check reviewers',exact:true}).click();await expect(field).toHaveAttribute('aria-invalid','true');await expect(field).toBeFocused();await expect(field).toHaveAccessibleDescription(/Choose at least one reviewer/);
  await field.fill('Erin');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(field).not.toHaveAttribute('aria-invalid','true');await page.keyboard.press('Escape');
  await demo.getByRole('button',{name:'Check reviewers',exact:true}).click();await expect(demo.locator('output')).toHaveText('erin');await expect(demo.getByRole('combobox',{name:'Managed review panel',exact:true})).toBeDisabled();
});

test('rich choice popups retain labelled option semantics and narrow-page containment',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const [route,id,label] of [['select','select-rich-options','Deployment target'],['combobox','combobox-canonical-options','Office location'],['multi-select','multi-select-grouped-reviewers','Review panel']]){
    await page.goto('/components/'+route);const demo=example(page,id),field=demo.getByRole('combobox',{name:label,exact:true});await field.click();
    await expect(page.getByRole('listbox')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;expect(violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);await page.keyboard.press('Escape');
  }
});

test('native external forms reset uncontrolled choices while controlled values stay host-owned',async({page})=>{
  await page.goto('/components/select');const demo=example(page,'choice-native-form-reset');
  const select=demo.getByRole('combobox',{name:'Resettable environment',exact:true}),combo=demo.getByRole('combobox',{name:'Resettable search',exact:true}),multi=demo.getByRole('combobox',{name:'Resettable reviewers',exact:true}),controlled=demo.getByRole('combobox',{name:'Application-owned environment',exact:true});
  await select.click();await page.getByRole('option',{name:'Beta environment',exact:true}).click();
  for(const field of [combo,controlled]){await field.fill('Beta');await field.press('ArrowDown');await field.press('Enter');}
  await demo.getByRole('button',{name:'Remove Alpha environment',exact:true}).click();await multi.fill('Beta');await multi.press('ArrowDown');await multi.press('Enter');await multi.press('Escape');
  await demo.getByRole('button',{name:'Read external choice values',exact:true}).click();await expect(demo.getByRole('status',{name:'External choice values'})).toHaveText('beta-id | beta-id | beta-id | beta-id');
  const count=await demo.getByRole('status',{name:'Choice change count'}).textContent();
  await demo.getByRole('form',{name:'External choice form'}).evaluate((form:HTMLFormElement)=>form.reset());
  await expect(select).toContainText('Alpha environment');await expect(combo).toHaveValue('Alpha environment');await expect(demo.getByRole('button',{name:'Remove Alpha environment',exact:true})).toBeVisible();await expect(controlled).toHaveValue('Beta environment');await expect(demo.getByRole('status',{name:'Choice change count'})).toHaveText(count??'');
  await demo.getByRole('button',{name:'Read external choice values',exact:true}).click();await expect(demo.getByRole('status',{name:'External choice values'})).toHaveText('alpha-id | alpha-id | alpha-id | beta-id');
  expect(await demo.getByRole('form',{name:'External choice form'}).evaluate((form:HTMLFormElement)=>form.checkValidity())).toBe(true);
  await select.click();await page.getByRole('option',{name:'Beta environment',exact:true}).click();
  await demo.getByRole('form',{name:'External choice form'}).evaluate((form:HTMLFormElement)=>{form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();});
  await expect(select).toContainText('Beta environment');
});

test('local combobox keeps native focus, active option visibility and natural dismissal',async({page})=>{
  await page.goto('/components/combobox');const demo=example(page,'combobox-focus-lifecycle'),field=demo.getByRole('combobox',{name:'Room search lifecycle',exact:true});
  await demo.getByRole('button',{name:'Open room choices',exact:true}).click();await expect(field).toBeFocused();
  const list=page.getByRole('listbox',{name:'Room search lifecycle options',exact:true});await expect(list).toBeVisible();await expect(field).toHaveAttribute('aria-controls',await list.getAttribute('id')??'missing-list-id');
  await expect.poll(()=>field.evaluate(input=>document.getElementById(input.getAttribute('aria-activedescendant')??'')?.textContent)).toBe('Review room 01');
  for(let index=0;index<35;index++)await field.press('ArrowDown');
  await expect(field).toBeFocused();await expect.poll(()=>field.evaluate(input=>{const id=input.getAttribute('aria-activedescendant'),option=id&&document.getElementById(id),list=option?.closest('[role="listbox"]');if(!option||!list)return false;const item=option.getBoundingClientRect(),viewport=list.getBoundingClientRect();return option.textContent?.includes('Review room 36')&&item.top>=viewport.top-1&&item.bottom<=viewport.bottom+1;})).toBe(true);
  await field.press('Enter');await expect(field).toHaveValue('Review room 36');
  await field.fill('Unmatched room');await field.press('Escape');await expect(field).toHaveValue('Review room 36');await expect(field).toBeFocused();
  await field.click();await field.press('Tab');await expect(demo.getByRole('button',{name:'After room search',exact:true})).toBeFocused();await expect(field).toHaveAttribute('aria-expanded','false');
  await page.keyboard.press('Shift+Tab');await expect(field).toBeFocused();await field.press('ArrowDown');await field.press('Shift+Tab');await expect(demo.getByRole('button',{name:'Before room search',exact:true})).toBeFocused();await expect(field).toHaveAttribute('aria-expanded','false');
  await field.click();await demo.getByRole('button',{name:'After room search',exact:true}).click();await expect(demo.getByRole('status',{name:'Room outside actions'})).toHaveText('1');await expect(field).toHaveAttribute('aria-expanded','false');
  await demo.getByRole('button',{name:'Clear room search lifecycle',exact:true}).click();await expect(field).toBeFocused();await expect(field).toHaveValue('');
});

test('combobox popup completion survives rapid reversal and live reduced motion exactly once',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/combobox');const demo=example(page,'combobox-focus-lifecycle'),field=demo.getByRole('combobox',{name:'Room search lifecycle',exact:true}),output=demo.getByRole('status',{name:'Room popup completions'});
  await demo.getByRole('button',{name:'Open room choices',exact:true}).click();await expect(output).toHaveText('open');await field.press('Escape');await expect(output).toHaveText('open, closed');
  await demo.getByRole('button',{name:'Clear room completions',exact:true}).click();
  const interrupted=await demo.evaluate(async root=>{
    const button=(label:string)=>Array.from(root.querySelectorAll('button')).find(element=>element.textContent===label)!;
    const transition=async(ending:boolean)=>{for(let frame=0;frame<120;frame++){const popup=document.querySelector('.bui-choice-shell');const animation=popup?.getAnimations().find(item=>item.playState==='running');if(animation&&popup?.hasAttribute('data-ending-style')===ending)return animation;await new Promise(requestAnimationFrame);}throw Error('Expected a running native popup transition.');};
    button('Open room choices').click();const opening=await transition(false);
    // Inspect the real entry transition at its midpoint so closing actually interrupts it.
    opening.pause();opening.currentTime=Number(opening.effect?.getTiming().duration)*.5;
    button('Close room choices').click();const closing=await transition(true);
    const states={opening:opening.playState,closing:closing.playState};button('Open room choices').click();return states;
  });
  expect(interrupted).toEqual({opening:'idle',closing:'running'});
  await expect(output).toHaveText('open');await expect(field).toHaveAttribute('aria-expanded','true');
  await field.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});await expect(output).toHaveText('open, closed');
  await demo.getByRole('button',{name:'Open room choices',exact:true}).click();await expect(output).toHaveText('open, closed, open');await field.press('Escape');await expect(output).toHaveText('open, closed, open, closed');
});

test('combobox options belong to the parent dialog and Escape closes the list first',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/components/combobox');const demo=example(page,'combobox-focus-lifecycle');
  await demo.getByRole('button',{name:'Open room dialog',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Review room dialog',exact:true}),field=dialog.getByRole('combobox',{name:'Dialog review room',exact:true});await field.click();
  const list=page.getByRole('listbox',{name:'Dialog review room options',exact:true});await expect(list).toBeVisible();await field.press('ArrowDown');await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-activedescendant',/\S+/);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
  await page.getByRole('option',{name:'Review room 02',exact:true}).click();await expect(field).toHaveValue('Review room 02');await expect(field).toBeFocused();await expect(dialog).toBeVisible();
  await field.click();await field.press('Escape');await expect(list).toHaveCount(0);await expect(dialog).toBeVisible();await field.press('Escape');await expect(dialog).toHaveCount(0);await expect(demo.getByRole('button',{name:'Open room dialog',exact:true})).toBeFocused();
});
