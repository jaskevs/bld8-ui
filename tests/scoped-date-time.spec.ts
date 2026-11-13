import {test,expect} from '@playwright/test';
import {parseDateValue,dateEntryMessage,rangeEntryMessage} from '../packages/ui/src/date-fields-state';

test('date availability rejects exact, interior and throwing rules without timezone conversion',()=>{
  const day=(text:string)=>parseDateValue(text)!,rules={unavailableDates:[day('2026-11-17')],isDateUnavailable:(date:Date)=>date.getDay()===0||date.getDay()===6};
  expect(dateEntryMessage('2026-11-17',rules)).toBe('Choose an available date.');expect(dateEntryMessage('2026-11-21',rules)).toBe('Choose an available date.');expect(dateEntryMessage('2026-11-18',rules)).toBe('');
  expect(rangeEntryMessage('2026-11-16','2026-11-18',rules)).toBe('The range includes an unavailable date.');expect(rangeEntryMessage('2026-11-02','2026-11-04',rules)).toBe('');
  expect(dateEntryMessage('2026-11-18',{isDateUnavailable:()=>{throw Error('Unavailable policy');}})).toBe('Choose an available date.');
  expect(rangeEntryMessage('9999-12-31','9999-12-31',{isDateUnavailable:()=>false})).toBe('');
  expect(rangeEntryMessage('0001-01-01','9999-12-31',{isDateUnavailable:()=>false})).toBe('Choose a shorter date range.');
});

test('scoped themes follow nested portals without changing the document theme and restore modal focus',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/dialog/examples/scoped-workspaces-overlays');
  const example=page.locator('[data-example-id=scoped-workspaces-overlays]'),before=await page.evaluate(()=>({theme:document.documentElement.getAttribute('data-ui-theme'),style:document.documentElement.style.cssText,className:document.documentElement.className}));
  await expect(example.locator('[data-scope-workspace=light] [data-scope-readout]')).toHaveText('en-AU | ltr | system');await expect(example.locator('[data-scope-workspace=dark] [data-scope-readout]')).toHaveText('ar | rtl | reduced');
  await example.getByRole('button',{name:'Change local accent',exact:true}).click();const trigger=example.getByRole('button',{name:'Open review panel',exact:true});await trigger.click();let dialog=page.getByRole('dialog',{name:'Review panel',exact:true});await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(node=>{const root=node.closest('[data-bui-scope]');return {theme:root?.getAttribute('data-ui-theme'),direction:root?.getAttribute('dir'),accent:getComputedStyle(node).getPropertyValue('--bui-accent').trim()};})).toEqual({theme:'light',direction:'ltr',accent:'#B7E4CD'});
  await dialog.getByRole('combobox',{name:'Review status',exact:true}).click();await page.getByRole('option',{name:'Approved',exact:true}).click();await expect(dialog.getByRole('combobox',{name:'Review status',exact:true})).toBeFocused();
  const nested=dialog.getByRole('button',{name:'Open confirmation',exact:true});await nested.click();const confirmation=page.getByRole('dialog',{name:'Confirm review',exact:true});await expect(confirmation).toBeVisible();await confirmation.press('Escape');await expect(confirmation).toBeHidden();await expect(nested).toBeFocused();await dialog.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
  const arabicTrigger=example.getByRole('button',{name:'فتح المراجعة',exact:true});await arabicTrigger.click();dialog=page.getByRole('dialog',{name:'لوحة المراجعة',exact:true});await expect(dialog).toBeVisible();await expect(example.locator('[data-external-scope-portals]')).toContainText('لوحة المراجعة');
  expect(await dialog.evaluate(node=>{const root=node.closest('[data-bui-scope]');return {theme:root?.getAttribute('data-ui-theme'),direction:root?.getAttribute('dir'),locale:root?.getAttribute('lang')};})).toEqual({theme:'dark',direction:'rtl',locale:'ar'});
  await dialog.getByRole('button',{name:'إغلاق الحوار',exact:true}).click();await expect(arabicTrigger).toBeFocused();expect(await page.evaluate(()=>({theme:document.documentElement.getAttribute('data-ui-theme'),style:document.documentElement.style.cssText,className:document.documentElement.className}))).toEqual(before);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(example.locator('[data-scope-workspace=light] [data-scope-readout]')).toHaveText('en-AU | ltr | reduced');
});

test('editable time preserves invalid drafts and submits stable values through its external native form',async({page})=>{
  await page.goto('/components/time-picker/examples/time-entry-form-lifecycle');const example=page.locator('[data-example-id=time-entry-form-lifecycle]'),input=example.getByRole('textbox',{name:'Session time',exact:true}),submit=example.getByRole('button',{name:'Read time values',exact:true});
  expect(await input.evaluate(node=>{const input=node as HTMLInputElement;return !!input.form&&!input.form.contains(input);})).toBe(true);
  for(const value of ['24:00','09:10','12:00','']){await input.fill(value);await submit.click();await expect(input).toBeFocused();await expect(input).toHaveValue(value);await expect(example.locator('[data-time-changes]')).toHaveText('Changes: 0');expect(await input.evaluate(node=>(node as HTMLInputElement).validity.valid)).toBe(false);}
  await input.press('Escape');await expect(input).toHaveValue('09:30');await input.fill('10:15');await input.press('Enter');await expect(example.locator('[data-time-changes]')).toHaveText('Changes: 1');
  await submit.click();await expect(example.getByRole('status')).toHaveText('Time: 10:15 | Owned: 10:00 | Locked: 11:00 | Disabled: false');await expect(example.getByRole('textbox',{name:'Locked time',exact:true})).toHaveAttribute('readonly','');await expect(example.getByRole('textbox',{name:'Unavailable time',exact:true})).toBeDisabled();
});

test('time reset respects cancellation and host-controlled null values',async({page})=>{
  await page.goto('/components/time-picker/examples/time-entry-form-lifecycle');const example=page.locator('[data-example-id=time-entry-form-lifecycle]'),input=example.getByRole('textbox',{name:'Session time',exact:true}),owned=example.getByRole('textbox',{name:'Host-owned time',exact:true}),reset=example.getByRole('button',{name:'Reset times',exact:true});
  await input.fill('10:30');await input.press('Enter');await owned.fill('11:30');await owned.press('Enter');await example.getByRole('checkbox',{name:'Prevent time reset',exact:true}).check();await reset.click();await expect(input).toHaveValue('10:30');await expect(owned).toHaveValue('11:30');
  await example.getByRole('checkbox',{name:'Prevent time reset',exact:true}).uncheck();await reset.click();await expect(input).toHaveValue('09:30');await expect(owned).toHaveValue('11:30');await expect(example.locator('[data-time-changes]')).toHaveText('Changes: 1');
  await example.getByRole('button',{name:'Clear host time',exact:true}).click();await expect(owned).toHaveValue('');await reset.click();await expect(owned).toHaveValue('');
});

test('time confirmation keeps form values committed until Apply and supports slot keyboard focus',async({page})=>{
  await page.goto('/components/time-picker/examples/time-entry-confirmation');const example=page.locator('[data-example-id=time-entry-confirmation]'),input=example.getByRole('textbox',{name:'Confirmed start',exact:true});
  await input.fill('10:00');await expect(example.locator('input[name=confirmed]')).toHaveValue('09:30');await example.getByRole('button',{name:'Cancel',exact:true}).click();await expect(input).toHaveValue('09:30');
  await input.fill('10:15');await example.getByRole('button',{name:'Apply',exact:true}).click();await expect(example.locator('[data-confirmed-time]')).toHaveText('Committed: 10:15 | Changes: 1');
  await input.press('Alt+ArrowDown');const popup=page.getByRole('dialog',{name:'Confirmed start',exact:true});await expect(popup).toBeVisible();const slot=popup.getByRole('option',{name:'10:15',exact:true});await expect(slot).toBeFocused();await slot.press('ArrowDown');await expect(popup.getByRole('option',{name:'10:30',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(example.locator('input[name=confirmed]')).toHaveValue('10:15');await popup.getByRole('button',{name:'Apply',exact:true}).click();await expect(popup).toBeHidden();await expect(input).toHaveValue('10:30');await expect(input).toBeFocused();
  await input.press('Alt+ArrowDown');await popup.getByRole('option',{name:'10:45',exact:true}).click();await popup.press('Escape');await expect(input).toHaveValue('10:30');await expect(example.locator('input[name=confirmed]')).toHaveValue('10:30');
});

test('month and year navigation stays canonical while typed fields reject unavailable dates and interior range days',async({page})=>{
  await page.goto('/components/calendar/examples/calendar-navigation-availability');const example=page.locator('[data-example-id=calendar-navigation-availability]'),calendar=example.locator('.bui-calendar-composite').first();await expect(calendar.locator('.bui-calendar-month')).toHaveCount(2);
  await calendar.getByRole('combobox',{name:'Year',exact:true}).click();await page.getByRole('option',{name:'2027',exact:true}).click();await calendar.getByRole('combobox',{name:'Month',exact:true}).click();await page.getByRole('option',{name:'January',exact:true}).click();await expect(calendar.locator('.bui-calendar-caption').first()).toContainText('January 2027');
  const date=example.getByRole('textbox',{name:'Available review date',exact:true}),submit=example.getByRole('button',{name:'Read available dates',exact:true});await date.fill('2026-11-17');await submit.click();await expect(date).toBeFocused();await expect(example.getByText('Choose an available date.',{exact:true})).toBeVisible();await date.press('Escape');
  const from=example.getByRole('textbox',{name:'Start available period',exact:true}),to=example.getByRole('textbox',{name:'End available period',exact:true});await from.fill('2026-11-16');await to.fill('2026-11-18');await to.press('Enter');const range=example.locator('.bui-date-range-picker');await expect(range.getByRole('alert')).toHaveText('The range includes an unavailable date.');await expect(range.getByRole('button',{name:'Apply range',exact:true})).toBeDisabled();expect(await to.evaluate(node=>(node as HTMLInputElement).validationMessage)).toBe('The range includes an unavailable date.');await expect(example.locator('input[name="period.from"]')).toHaveValue('2026-11-02');await expect(example.locator('input[name="period.to"]')).toHaveValue('2026-11-04');await submit.click();await expect(from).toBeFocused();await expect(example.getByRole('status').filter({hasText:'No available date submitted.'})).toBeVisible();
});

test('Arabic messages and linked errors preserve canonical time and channel IDs',async({page})=>{
  await page.goto('/components/time-picker/examples/localized-arabic-form');const example=page.locator('[data-example-id=localized-arabic-form]'),form=example.getByRole('form',{name:'طلب مراجعة',exact:true}),submit=form.getByRole('button',{name:'إعداد الطلب',exact:true});await submit.click();await expect(form.getByText('راجع الحقول المحددة.',{exact:true})).toBeVisible();await form.getByRole('link',{name:'عنوان الطلب: أدخل عنوان الطلب.',exact:true}).click();const title=form.getByRole('textbox',{name:'عنوان الطلب',exact:true});await expect(title).toBeFocused();await title.fill('مراجعة الواجهة');
  const time=form.getByRole('textbox',{name:'وقت البدء',exact:true});await time.fill('10:15');await form.getByRole('button',{name:'إلغاء',exact:true}).click();await expect(time).toHaveValue('09:30');await time.fill('10:30');await form.getByRole('button',{name:'تطبيق',exact:true}).click();await submit.click();await expect(form.getByRole('status')).toHaveText('channel=email | time=10:30');await expect(form).toHaveJSProperty('dir','');expect(await form.evaluate(node=>getComputedStyle(node).direction)).toBe('rtl');
});


test('unconfigured date calendars retain their established default accessible date labels',async({page})=>{
  await page.goto('/components/date-picker/examples/date-entry-lifecycle');const example=page.locator('[data-example-id=date-entry-lifecycle]');await example.getByRole('button',{name:'Open review date calendar',exact:true}).click();const popup=page.getByRole('dialog',{name:'Review date',exact:true});await expect(popup.getByRole('button',{name:/Thursday, November 12th, 2026/})).toBeVisible();await expect(popup.getByRole('button',{name:'Go to the Next Month',exact:true})).toBeVisible();
});


test.describe('calendar touch navigation',()=>{
  test.use({hasTouch:true});
  for(const width of [320,390])test('month and year stay readable at '+width+'px in LTR and RTL',async({page})=>{
    await page.setViewportSize({width,height:1100});await page.goto('/components/calendar/examples/calendar-navigation-availability');const example=page.locator('[data-example-id=calendar-navigation-availability]'),calendar=example.locator('.bui-calendar-composite').first();
    expect(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)).toBe(true);
    for(const direction of ['ltr','rtl'] as const){
      if(direction==='rtl')await example.getByRole('button',{name:'Use Arabic calendar',exact:true}).click();
      const month=calendar.getByRole('combobox',{name:direction==='ltr'?'Month':'الشهر',exact:true}),year=calendar.getByRole('combobox',{name:direction==='ltr'?'Year':'السنة',exact:true});
      await expect(month).toContainText(direction==='ltr'?'November':'نوفمبر');await expect(year).toContainText(direction==='ltr'?'2026':new Intl.NumberFormat('ar',{useGrouping:false}).format(2026));
      for(const field of [month,year]){const geometry=await field.evaluate(node=>{const value=node.firstElementChild as HTMLElement,box=node.getBoundingClientRect();return {height:box.height,valueWidth:value.clientWidth,contentWidth:value.scrollWidth};});expect(geometry.height).toBeGreaterThanOrEqual(44);expect(geometry.valueWidth).toBeGreaterThan(0);expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.valueWidth);}
      const pair=calendar.locator('.bui-calendar-jump-actions button');await expect(pair).toHaveCount(2);const boxes=await pair.evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect();return {x:box.x,y:box.y,width:box.width,height:box.height};}));expect(Math.abs(boxes[0].y-boxes[1].y)).toBeLessThanOrEqual(.5);for(const box of boxes){expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
      const yearBox=(await year.boundingBox())!;expect(boxes[0].y).toBeGreaterThanOrEqual(yearBox.y+yearBox.height);expect(await calendar.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  });
});


test('blur feedback waits for pointer activation so native invalid submission still runs under normal motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/time-picker/examples/time-entry-form-lifecycle');const example=page.locator('[data-example-id=time-entry-form-lifecycle]'),field=example.getByRole('textbox',{name:'Session time',exact:true}),submit=example.getByRole('button',{name:'Read time values',exact:true});await expect(example.locator('[data-example-ready]')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  await field.evaluate(element=>{element.setAttribute('data-native-invalid-count','0');element.addEventListener('invalid',()=>element.setAttribute('data-native-invalid-count',String(Number(element.getAttribute('data-native-invalid-count'))+1)));});await field.fill('09:10');await submit.scrollIntoViewIfNeeded();const before=(await submit.boundingBox())!;await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();const pressed=(await submit.boundingBox())!;expect(Math.abs(pressed.y-before.y)).toBeLessThanOrEqual(.5);await page.mouse.up();await expect(field).toBeFocused();await expect(field).toHaveAttribute('data-native-invalid-count',/^[1-9][0-9]*$/);await expect(example.locator('.bui-time-picker').first().getByRole('alert')).toHaveText('Choose an available time.');
});


test('reset and Cancel discard pending blur disclosure after a real pointer gesture',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const explicit of [false,true]){
    const id=explicit?'time-entry-confirmation':'time-entry-form-lifecycle';await page.goto('/components/time-picker/examples/'+id);const example=page.locator('[data-example-id='+id+']'),field=example.getByRole('textbox',{name:explicit?'Confirmed start':'Session time',exact:true}),action=example.getByRole('button',{name:explicit?'Cancel':'Reset times',exact:true});await expect(example.locator('[data-example-ready]')).toBeVisible();await page.evaluate(()=>document.fonts.ready);await field.fill('09:10');const pointerTarget=explicit?example.getByRole('button',{name:'Read confirmed time',exact:true}):action;await pointerTarget.scrollIntoViewIfNeeded();const box=(await pointerTarget.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();if(explicit){await page.keyboard.press('Shift+Tab');await expect(action).toBeFocused();await page.keyboard.press('Enter');}await page.mouse.up();await expect(field).toHaveValue('09:30');
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(field).not.toHaveAttribute('aria-invalid','true');await expect(example.locator('.bui-time-picker').first().getByRole('alert')).toHaveCount(0);if(explicit)await expect(example.locator('[data-confirmed-time]')).toHaveText('Committed: 09:30 | Changes: 0');else await expect(example.locator('[data-time-changes]')).toHaveText('Changes: 0');
  }
});
