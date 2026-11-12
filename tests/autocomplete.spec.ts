import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function example(page:Page,id:string){
  const demo=page.locator('[data-example-id="'+id+'"]'),run=demo.getByRole('button',{name:'Run example',exact:true});
  if(await run.isVisible())await run.click();
  await expect(demo.locator('[data-example-ready]')).toBeVisible();return demo;
}

test('suggestions accept readable text while unmatched queries remain valid',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-search'),field=demo.getByRole('combobox',{name:'Search documentation',exact:true});
  await field.click();await expect(page.getByRole('group',{name:'Recent queries',exact:true})).toBeVisible();
  const list=page.getByRole('listbox',{name:'Search documentation suggestions',exact:true});await expect(list).toBeVisible();
  await field.press('ArrowDown');await expect(field).toBeFocused();
  await expect.poll(()=>field.evaluate(input=>document.getElementById(input.getAttribute('aria-activedescendant')||'')?.getAttribute('aria-label'))).toBe('Design tokens');
  await field.press('Enter');await expect(field).toHaveValue('Design tokens');await expect(field).toBeFocused();
  await demo.getByRole('button',{name:'Search documentation',exact:true}).click();await expect(demo.getByRole('status',{name:'Search query status',exact:true})).toHaveText('Query prepared: Design tokens');
  await field.fill('A completely new phrase');await expect(page.getByText('No suggestions. You can keep typing.',{exact:true})).toBeVisible();await field.press('Escape');await expect(field).toHaveValue('A completely new phrase');
  await demo.getByRole('button',{name:'Search documentation',exact:true}).click();await expect(demo.getByRole('status',{name:'Search query status',exact:true})).toHaveText('Query prepared: A completely new phrase');
  expect(await field.evaluate(input=>new FormData((input as HTMLInputElement).form!).get('query'))).toBe('A completely new phrase');
  await field.click();await demo.getByRole('button',{name:'Clear Search documentation',exact:true}).click();await expect(field).toHaveValue('');await expect(field).toBeFocused();
});

test('grouped rich suggestions retain labels, descriptions, aliases and disabled semantics',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-groups'),field=demo.getByRole('combobox',{name:'Destination',exact:true});
  await field.click();await expect(page.getByRole('group',{name:'Australia',exact:true})).toBeVisible();await expect(page.getByRole('group',{name:'Asia Pacific',exact:true})).toBeVisible();
  await expect(page.getByRole('option',{name:'Tokyo',exact:true})).toHaveAttribute('aria-disabled','true');
  await field.fill('harbour');const sydney=page.getByRole('option',{name:'Sydney',exact:true});await expect(sydney).toHaveAccessibleDescription('New South Wales · SYD');
  await field.press('ArrowDown');await field.press('Enter');await expect(field).toHaveValue('Sydney');await expect(demo.getByRole('status',{name:'Destination text',exact:true})).toHaveText('Destination text: Sydney');
  await field.fill('Independent place');await field.press('Escape');await expect(field).toHaveValue('Independent place');
});

test('native email constraints accept unsuggested valid addresses and recover from invalid text',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-email'),field=demo.getByRole('combobox',{name:'Invite email',exact:true});
  await demo.getByRole('button',{name:'Prepare invitation',exact:true}).click();await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');
  await field.fill('reader');await field.press('ArrowDown');await field.press('Enter');await expect(field).toHaveValue('reader@example.com');
  await field.fill('reader@independent.test');await field.press('Escape');await demo.getByRole('button',{name:'Prepare invitation',exact:true}).click();await expect(demo.getByRole('status',{name:'Invitation address status',exact:true})).toHaveText('Invitation address: reader@independent.test');
  expect(await field.evaluate(input=>(input as HTMLInputElement).checkValidity())).toBe(true);await expect(field).not.toHaveAttribute('aria-invalid','true');
  await field.fill('invalid-address');await field.press('Escape');await demo.getByRole('button',{name:'Prepare invitation',exact:true}).click();await expect(field).toBeFocused();await expect(field).toHaveAccessibleDescription(/Enter a complete email address/);
});

test('external native forms preserve text values, ref focus and uncontrolled and controlled reset',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-form'),team=demo.getByRole('combobox',{name:'Team name',exact:true}),controlled=demo.getByRole('combobox',{name:'Controlled team',exact:true}),readOnly=demo.getByRole('combobox',{name:'Read-only team',exact:true});
  await team.fill('Res');await expect(demo.getByRole('status',{name:'Autocomplete change count',exact:true})).toHaveText('1');await page.getByRole('option',{name:'Research',exact:true}).click();await expect(team).toHaveValue('Research');await expect(demo.getByRole('status',{name:'Autocomplete change count',exact:true})).toHaveText('2');
  await team.fill('Custom team');await controlled.fill('Platform');await controlled.press('Escape');
  await demo.getByRole('button',{name:'Read autocomplete values',exact:true}).click();await expect(demo.getByRole('status',{name:'Autocomplete form values',exact:true})).toHaveText('Values: Custom team | Platform | Operations | disabled 0');
  await expect(readOnly).toHaveAttribute('readonly','');await expect(demo.getByRole('combobox',{name:'Disabled team',exact:true})).toBeDisabled();
  await readOnly.focus();await readOnly.press('ArrowDown');await readOnly.press('Backspace');await expect(readOnly).toHaveValue('Operations');await expect(readOnly).toHaveAttribute('aria-expanded','false');
  const changes=await demo.getByRole('status',{name:'Autocomplete change count',exact:true}).textContent();
  await demo.getByRole('button',{name:'Reset autocomplete values',exact:true}).click();await expect(team).toHaveValue('Design');await expect(controlled).toHaveValue('Research');await expect(demo.getByRole('status',{name:'Autocomplete change count',exact:true})).toHaveText(changes||'');
  await team.fill('ab');await team.press('Escape');await demo.getByRole('button',{name:'Read autocomplete values',exact:true}).click();await expect(team).toBeFocused();await expect(team).toHaveAttribute('aria-invalid','true');await expect(team).toHaveAccessibleDescription(/at least three/);
  await team.fill('New team');await team.press('Escape');await expect(team).not.toHaveAttribute('aria-invalid','true');
  await team.fill('');await team.press('Escape');await demo.getByRole('button',{name:'Read autocomplete values',exact:true}).click();await expect(team).toBeFocused();expect(await team.evaluate(input=>(input as HTMLInputElement).validity.valueMissing)).toBe(true);
});

test('prevented native reset retains text and outside Tab stays natural',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-form'),team=demo.getByRole('combobox',{name:'Team name',exact:true}),controlled=demo.getByRole('combobox',{name:'Controlled team',exact:true});
  await demo.getByRole('checkbox',{name:'Prevent autocomplete reset',exact:true}).check();await team.fill('Keep my draft');await controlled.fill('Owned draft');await controlled.press('Escape');
  await demo.getByRole('button',{name:'Reset autocomplete values',exact:true}).click();await expect(team).toHaveValue('Keep my draft');await expect(controlled).toHaveValue('Owned draft');
  await team.click();await expect(team).toHaveAttribute('aria-expanded','true');await team.press('Tab');await expect(controlled).toBeFocused();await expect(team).toHaveAttribute('aria-expanded','false');
  await controlled.press('ArrowDown');await controlled.press('Shift+Tab');await expect(team).toBeFocused();await expect(controlled).toHaveAttribute('aria-expanded','false');
  await team.click();await expect(team).toHaveAttribute('aria-expanded','true');await page.mouse.click(4,4);await expect(team).toHaveAttribute('aria-expanded','false');await expect(team).toHaveValue('Keep my draft');
});

test('asynchronous host suggestions keep newest text and recover after a failed request',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-async'),field=demo.getByRole('combobox',{name:'Search help articles',exact:true}),status=demo.getByRole('status',{name:'Suggestion request status',exact:true});
  await field.fill('de');await expect(status).toHaveText('Loading suggestions…');await field.fill('form');await expect(status).toHaveText('1 suggestions ready.');
  await expect(page.getByRole('option',{name:'Form validation',exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'Design tokens',exact:true})).toHaveCount(0);await expect(field).toHaveValue('form');
  await demo.getByRole('button',{name:'Fail next suggestion request',exact:true}).click();await expect(demo.getByRole('alert',{name:'Suggestion request status',exact:true})).toHaveText('Suggestions could not be loaded.');await expect(field).toHaveValue('form');
  await demo.getByRole('button',{name:'Retry suggestions',exact:true}).click();await expect(status).toHaveText('1 suggestions ready.');await field.focus();await field.press('ArrowDown');await expect(field).toHaveAttribute('aria-expanded','true');await field.press('ArrowDown');await field.press('Enter');await expect(field).toHaveValue('Form validation');
});

test('IME confirmation does not accept a highlighted suggestion prematurely',async({page})=>{
  await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-groups'),field=demo.getByRole('combobox',{name:'Destination',exact:true});
  await field.fill('Syd');await field.press('ArrowDown');await field.dispatchEvent('compositionstart',{data:'Syd'});await field.dispatchEvent('keydown',{key:'Enter',code:'Enter',keyCode:229,which:229,isComposing:true,bubbles:true,cancelable:true});await expect(field).toHaveValue('Syd');await expect(field).toBeFocused();await field.dispatchEvent('compositionend',{data:'Syd'});await field.press('Escape');await field.press('ArrowDown');await expect(field).toHaveAttribute('aria-expanded','true');await field.press('ArrowDown');await field.press('Enter');await expect(field).toHaveValue('Sydney');
});

for(const theme of ['light','dark'])test('autocomplete popup fits narrow pages and keeps accessible semantics in '+theme,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:320,height:740});await page.goto('/components/autocomplete');await page.evaluate(value=>{document.documentElement.dataset.uiTheme=value;},theme);
  const demo=await example(page,'autocomplete-groups'),field=demo.getByRole('combobox',{name:'Destination',exact:true});await field.click();const popup=page.locator('.bui-autocomplete-popup');await expect(popup).toBeVisible();const box=await popup.boundingBox();expect(box?.x).toBeGreaterThanOrEqual(0);expect((box?.x||0)+(box?.width||0)).toBeLessThanOrEqual(320);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const result=await new AxeBuilder({page}).include('.bui-autocomplete-popup').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);await field.press('Escape');await expect(field).toBeFocused();expect(errors).toEqual([]);
});

test('live reduced motion settles an interrupted autocomplete close',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/autocomplete');const demo=await example(page,'autocomplete-groups'),field=demo.getByRole('combobox',{name:'Destination',exact:true});await field.click();await expect(page.locator('.bui-autocomplete-popup')).toBeVisible();await field.press('Escape');await field.click();await field.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.bui-autocomplete-popup')).toHaveCount(0);await expect(field).toHaveValue('');await expect(field).toBeFocused();
});
