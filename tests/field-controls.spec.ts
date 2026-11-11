import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('field validation keeps native constraints, descriptions and focus',async({page})=>{
  await page.goto('/components/input');const example=page.locator('[data-field-example="input-validation"]'),email=example.getByRole('textbox',{name:'Contact email',exact:true});
  await example.getByRole('button',{name:'Save contact example',exact:true}).click();await expect(email).toBeFocused();await expect(email).toHaveAttribute('aria-invalid','true');
  const linked=await email.getAttribute('aria-describedby');expect(linked?.split(' ')).toHaveLength(2);
  expect(await email.evaluate(input=>(input as HTMLInputElement).required)).toBe(true);
  await email.fill('reader@example.com');await example.getByRole('button',{name:'Save contact example',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Contact details saved for this example.');
  await expect(email).not.toHaveAttribute('aria-invalid','true');expect(await email.evaluate(input=>new FormData((input as HTMLInputElement).form!).get('contactEmail'))).toBe('reader@example.com');
});

test('native mixed checkbox selects a group and required choices submit stable values',async({page})=>{
  await page.goto('/components/checkbox');const mixed=page.locator('[data-field-example="checkbox-mixed"]'),all=mixed.getByRole('checkbox',{name:'Include all channels',exact:true});
  await expect(all).toHaveJSProperty('indeterminate',true);expect(await all.evaluate(input=>input.hasAttribute('indeterminate'))).toBe(false);
  await all.focus();await all.press('Space');await expect(all).toBeChecked();await expect(all).toHaveJSProperty('indeterminate',false);await expect(mixed.getByRole('status')).toHaveText('2 channels included');
  await all.press('Space');await expect(mixed.getByRole('status')).toHaveText('0 channels included');
  const required=page.locator('[data-field-example="checkbox-required"]'),agreement=required.getByRole('checkbox',{name:'Accept example terms',exact:true});
  await required.getByRole('button',{name:'Submit agreement example',exact:true}).click();await expect(agreement).toBeFocused();await expect(agreement).toHaveAttribute('aria-invalid','true');
  await agreement.press('Space');await required.getByRole('button',{name:'Submit agreement example',exact:true}).click();await expect(required.getByRole('status')).toHaveText('Agreement: accepted');
});

test('required radio groups retain native arrow navigation, labels and disabled choices',async({page})=>{
  await page.goto('/components/radio');const example=page.locator('[data-field-example="radio-validation"]'),first=example.getByRole('radio',{name:'Structured JSON',exact:true}),second=example.getByRole('radio',{name:'Spreadsheet CSV',exact:true});
  await example.getByRole('button',{name:'Read export preference',exact:true}).click();await expect(first).toBeFocused();await expect(first).toHaveAttribute('aria-invalid','true');
  await first.press('ArrowRight');await expect(second).toBeChecked();await expect(second).toBeFocused();await expect(example.getByRole('radio',{name:'Legacy XML',exact:true})).toBeDisabled();
  await example.getByRole('button',{name:'Read export preference',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Export format: csv');
});

test('switch validation preserves its input ref and native form value',async({page})=>{
  await page.goto('/components/switch');const example=page.locator('[data-field-example="switch-preference"]'),control=example.getByRole('switch',{name:'Quiet hours',exact:true});
  await example.getByRole('button',{name:'Save quiet hours example',exact:true}).click();await expect(control).toBeFocused();await expect(control).toHaveAttribute('aria-invalid','true');
  await control.press('Space');await expect(control).toBeChecked();expect(await control.evaluate(input=>new FormData((input as HTMLInputElement).form!).get('quietHours'))).toBe('enabled');await expect(control).not.toHaveAttribute('aria-invalid','true');
});

test('single slider preserves native value and increment behaviour',async({page})=>{
  await page.goto('/components/slider');const example=page.locator('[data-field-example="slider-preview"]'),slider=example.getByRole('slider',{name:'Thumbnail scale',exact:true});
  await expect(slider).toHaveValue('40');await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveValue('45');await slider.press('End');await expect(slider).toHaveValue('100');await slider.press('Home');await expect(slider).toHaveValue('20');
});

test('range thumbs keep order, minimum gap and keyboard commit feedback',async({page})=>{
  await page.goto('/components/range-slider');const example=page.locator('[data-field-example="range-budget"]'),lower=example.getByRole('slider',{name:'Minimum budget',exact:true}),upper=example.getByRole('slider',{name:'Maximum budget',exact:true});
  await expect(lower).toHaveValue('20');await expect(upper).toHaveValue('80');await lower.focus();await lower.press('ArrowRight');await expect(lower).toHaveValue('25');
  await lower.press('End');await expect(lower).toHaveValue('70');await upper.focus();await upper.press('Home');await expect(upper).toHaveValue('80');
  await expect(example.getByRole('status')).toContainText('Committed');expect(await lower.getAttribute('aria-describedby')).toBeTruthy();
});

test('uncontrolled range submits two values and resets to its initial range',async({page})=>{
  await page.goto('/components/range-slider');const example=page.locator('[data-field-example="range-uncontrolled"]'),lower=example.getByRole('slider',{name:'Earliest retention',exact:true}),upper=example.getByRole('slider',{name:'Latest retention',exact:true});
  await lower.focus();await lower.press('ArrowRight');await expect(lower).toHaveValue('20');await example.getByRole('button',{name:'Read retention values',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Retention values: 20, 45');
  await example.getByRole('button',{name:'Reset retention example',exact:true}).click();await expect(lower).toHaveValue('15');await expect(upper).toHaveValue('45');
  await expect(example.getByRole('slider',{name:'Lower Locked example range',exact:true})).toBeDisabled();
});

test('one code input supports formatted paste, native selection and linked validation',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/components/otp-input');const example=page.locator('[data-field-example="otp-code"]'),code=example.getByRole('textbox',{name:'Example verification code',exact:true});
  await expect(example.locator('input')).toHaveCount(1);await expect(code).toHaveAttribute('autocomplete','one-time-code');await expect(code).toHaveAttribute('inputmode','numeric');
  await example.getByRole('button',{name:'Check example code',exact:true}).click();await expect(code).toBeFocused();await expect(code).toHaveAttribute('aria-invalid','true');
  await page.evaluate(()=>navigator.clipboard.writeText('１２３ ４５６'));await code.press('Control+V');await expect(code).toHaveValue('123456');
  await code.evaluate(input=>(input as HTMLInputElement).setSelectionRange(2,4));await code.press('Backspace');await expect(code).toHaveValue('1256');
  await code.fill('654321');await example.getByRole('button',{name:'Check example code',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Code format is ready. This example does not verify a code.');
  expect(await code.evaluate(input=>new FormData((input as HTMLInputElement).form!).get('verificationCode'))).toBe('654321');
});

test('uncontrolled code completion and reset preserve native form ownership',async({page})=>{
  await page.goto('/components/otp-input');const example=page.locator('[data-field-example="otp-uncontrolled"]'),code=example.getByRole('textbox',{name:'Backup example code',exact:true});
  await expect(code).toHaveValue('12');await code.fill('1234');await expect(example.getByRole('status')).toHaveText('All four positions are filled.');await example.getByRole('button',{name:'Read backup example',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Entered code: 1234');
  await example.getByRole('button',{name:'Reset backup example',exact:true}).click();await expect(code).toHaveValue('12');await expect(example.getByRole('textbox',{name:'Locked example code',exact:true})).toBeDisabled();
});

test('native OTP onChange receives canonical paste and read-only entry stays unchanged',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/components/otp-input');
  const example=page.locator('[data-field-example="otp-native-change"]'),code=example.getByRole('textbox',{name:'Native change example code',exact:true});
  await code.focus();await page.evaluate(()=>navigator.clipboard.writeText('１２３ ４５６'));await code.press('Control+V');
  await expect(code).toHaveValue('123456');await expect(example.getByRole('status')).toHaveText('Canonical edit: 123456');await expect(example.getByText('Last complete code: 123456',{exact:true})).toBeVisible();
  await code.evaluate(input=>(input as HTMLInputElement).setSelectionRange(1,3));await code.press('Backspace');await expect(code).toHaveValue('1456');await expect(example.getByRole('status')).toHaveText('Canonical edit: 1456');
  const readOnly=example.getByRole('textbox',{name:'Read only example code',exact:true});await readOnly.focus();await readOnly.press('Control+V');await expect(readOnly).toHaveValue('1234');
});

for(const route of ['range-slider','otp-input'])test(route+' fields fit a phone and pass focused axe checks',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/components/'+route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
});
