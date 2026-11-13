import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {parseDateValue,formatDateValue} from '../packages/ui/src/date-fields-state';

async function example(page:import('@playwright/test').Page,route:string,id:string){
  await page.goto('/components/'+route);
  const section=page.locator('[data-example-id="'+id+'"]');
  const run=section.getByRole('button',{name:/Run example/i});
  if(await run.count()&&await run.isVisible())await run.click();
  return section;
}
test('date-only parsing rejects rollover and retains low years and DST calendar dates',()=>{
  for(const text of ['2026-02-29','2026-02-31','2026-04-31','2026-13-01','2026-00-20','2026-01-00','0000-01-01','2026-2-01','2026-01-01T00:00:00Z','not-a-date'])expect(parseDateValue(text)).toBeNull();
  for(const text of ['2024-02-29','0001-01-02','0099-12-31','2026-04-05','2026-10-04']){
    const date=parseDateValue(text);expect(date).not.toBeNull();expect(formatDateValue(date)).toBe(text);expect(date?.getHours()).toBe(12);
  }
  expect(formatDateValue(new Date('invalid'))).toBe('');expect(formatDateValue(null)).toBe('');
});
test('editable date submits canonical native values to its external form and keeps refs and reset semantics',async({page})=>{
  const section=await example(page,'date-picker','date-entry-lifecycle'),field=section.getByRole('textbox',{name:'Review date',exact:true});
  await expect(field).toHaveValue('2026-11-12');
  expect(await field.evaluate(node=>{const input=node as HTMLInputElement;return !!input.form&&!input.form.contains(input)&&!!input.form.querySelector('button[type="submit"]')?.textContent?.includes('Read review date');})).toBe(true);
  await section.getByRole('button',{name:'Focus review date',exact:true}).click();await expect(field).toBeFocused();
  await field.fill('2026-11-18');await field.press('Enter');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');
  await section.getByRole('button',{name:'Read review date',exact:true}).click();await expect(section.getByRole('status')).toHaveText('Review date: 2026-11-18; locked: 2026-11-18; unavailable: excluded');
  await expect(section.getByRole('textbox',{name:'Locked review date',exact:true})).toHaveAttribute('readonly','');
  await expect(section.getByRole('textbox',{name:'Unavailable date',exact:true})).toBeDisabled();
  await section.getByRole('checkbox',{name:'Keep date on reset',exact:true}).check();await section.getByRole('button',{name:'Reset review date',exact:true}).click();
  await expect(field).toHaveValue('2026-11-18');await expect(section.getByRole('status')).toHaveText('Reset prevented.');
  await section.getByRole('checkbox',{name:'Keep date on reset',exact:true}).uncheck();await section.getByRole('button',{name:'Reset review date',exact:true}).click();
  await expect(field).toHaveValue('2026-11-12');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');
});
test('invalid date text and bounds block native submit without committing a replacement',async({page})=>{
  const section=await example(page,'date-picker','date-entry-lifecycle'),field=section.getByRole('textbox',{name:'Review date',exact:true}),submit=section.getByRole('button',{name:'Read review date',exact:true});
  for(const value of ['2026-02-30','2026-10-31','2027-01-01','']){
    await field.fill(value);await submit.click();await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');
    expect(await field.evaluate(node=>(node as HTMLInputElement).validity.valid)).toBe(false);await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');
    await expect(section.getByRole('status')).toHaveText('No date submitted.');
  }
  await field.fill('2026-11-19');await field.press('Escape');await expect(field).toHaveValue('2026-11-12');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await field.fill('2026-11-19');await field.press('Tab');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await submit.click();await expect(section.getByRole('status')).toContainText('Review date: 2026-11-19');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');
});
test('controlled date updates and null remain host owned through native reset',async({page})=>{
  const section=await example(page,'date-picker','date-controlled-entry'),field=section.getByRole('textbox',{name:'Controlled review date',exact:true});
  await section.getByRole('button',{name:'Set controlled date',exact:true}).click();await expect(field).toHaveValue('2026-11-24');
  await field.fill('2026-11-26');await field.evaluate(node=>(node as HTMLInputElement).form!.reset());await expect(field).toHaveValue('2026-11-24');
  await section.getByRole('button',{name:'Reset controlled date form',exact:true}).click();await expect(field).toHaveValue('2026-11-24');
  await section.getByRole('button',{name:'Clear controlled date',exact:true}).click();await expect(field).toHaveValue('');
  await section.getByRole('button',{name:'Read controlled date',exact:true}).click();await expect(section.getByRole('status')).toHaveText('Controlled submitted: ');
});
test('range presets stay draft until Apply and Cancel Escape and outside dismissal discard them',async({page})=>{
  const section=await example(page,'date-range','date-range-presets'),open=section.getByRole('button',{name:'Open reporting period calendar',exact:true});
  await open.click();let popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await expect(popup).toBeVisible();
  await expect(popup.getByRole('button',{name:'Unavailable week',exact:true})).toBeDisabled();
  await popup.getByRole('button',{name:'Second week',exact:true}).click();
  expect(await section.locator('input[name="period.from"]').inputValue()).toBe('2026-11-02');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await popup.getByRole('button',{name:'Cancel',exact:true}).click();await expect(popup).toBeHidden();await expect(section.getByRole('textbox',{name:'Start reporting period',exact:true})).toHaveValue('2026-11-02');
  await open.click();popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await popup.getByRole('button',{name:'Second week',exact:true}).click();await popup.press('Escape');await expect(popup).toBeHidden();
  await expect(section.getByRole('textbox',{name:'Start reporting period',exact:true})).toHaveValue('2026-11-02');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await open.click();popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await popup.getByRole('button',{name:'Second week',exact:true}).click();
  await section.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(popup).toBeHidden();await expect(section.getByRole('status')).toHaveText('Reporting period: 2026-11-02 to 2026-11-06');
  await open.click();popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await popup.getByRole('button',{name:'Second week',exact:true}).click();await popup.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect(section.getByRole('textbox',{name:'Start reporting period',exact:true})).toHaveValue('2026-11-09');await expect(section.getByRole('textbox',{name:'End reporting period',exact:true})).toHaveValue('2026-11-13');
  await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');await section.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(section.getByRole('status')).toHaveText('Reporting period: 2026-11-09 to 2026-11-13');
});
test('typed range validation preserves committed values and reset emits no change',async({page})=>{
  const section=await example(page,'date-range','date-range-presets'),start=section.getByRole('textbox',{name:'Start reporting period',exact:true}),end=section.getByRole('textbox',{name:'End reporting period',exact:true});
  await start.fill('2026-11-20');await end.fill('2026-11-10');await expect(section.getByRole('button',{name:'Apply range',exact:true})).toBeDisabled();
  expect(await section.locator('input[name="period.from"]').inputValue()).toBe('2026-11-02');
  await section.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(start).toBeFocused();await expect(start).toHaveAttribute('aria-invalid','true');
  await end.fill('2026-11-24');await section.getByRole('button',{name:'Apply range',exact:true}).click();await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');
  await section.getByRole('button',{name:'Reset reporting period',exact:true}).click();await expect(start).toHaveValue('2026-11-02');await expect(end).toHaveValue('2026-11-06');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 1');
  await section.getByRole('checkbox',{name:'Require reporting period',exact:true}).uncheck();await section.getByRole('button',{name:'Clear reporting period',exact:true}).click();await section.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect(start).toHaveValue('');await expect(end).toHaveValue('');await section.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(section.getByRole('status')).toHaveText('Reporting period:  to ');
});
for(const route of ['date-picker','date-range'])test(route+' editable fields stay contained with accessible native text at phone width',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/components/'+route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const issues=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(issues.violations.map(issue=>({id:issue.id,targets:issue.nodes.map(node=>node.target)}))).toEqual([]);
});

test('date popups own one initial enabled day focus and preserve keyboard navigation without committing',async({page})=>{
  for(const item of [{route:'date-picker',id:'date-entry-lifecycle',label:'Review date',field:'Review date',opener:'Open review date calendar',value:'2026-11-12'},{route:'date-range',id:'date-range-presets',label:'Reporting period',field:'Start reporting period',opener:'Open reporting period calendar',value:'2026-11-02'}]){
    const section=await example(page,item.route,item.id),field=section.getByRole('textbox',{name:item.field,exact:true}),opener=section.getByRole('button',{name:item.opener,exact:true});await opener.focus();await opener.press('Enter');const popup=page.getByRole('dialog',{name:item.label,exact:true}),day=popup.locator('.bui-calendar-day-button[tabindex="0"]:not(:disabled):not([aria-disabled="true"])');await expect(day).toBeFocused();const label=await day.getAttribute('aria-label');await day.press('ArrowRight');const next=popup.locator('.bui-calendar-day-button:focus');await expect(next).toHaveCount(1);await expect(next).not.toHaveAttribute('aria-label',label!);await expect(field).toHaveValue(item.value);await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(field).toBeFocused();await expect(field).toHaveValue(item.value);
  }
});
test('constrained range popup keeps a real held Cancel press stable through a frame and returns native focus',async({page})=>{
  await page.setViewportSize({width:390,height:600});const section=await example(page,'date-range','date-range-presets'),start=section.getByRole('textbox',{name:'Start reporting period',exact:true}),opener=section.getByRole('button',{name:'Open reporting period calendar',exact:true});
  for(const reducedMotion of ['no-preference','reduce'] as const){await page.emulateMedia({reducedMotion});await opener.click();const popup=page.getByRole('dialog',{name:'Reporting period',exact:true});await popup.getByRole('button',{name:'Second week',exact:true}).click();await expect(section.locator('input[name="period.from"]')).toHaveValue('2026-11-02');const cancel=popup.getByRole('button',{name:'Cancel',exact:true});await cancel.focus();await cancel.hover();const before=await cancel.boundingBox();expect(before).not.toBeNull();await page.mouse.down();try{await expect(cancel).toBeFocused();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));await expect(cancel).toBeFocused();const held=await cancel.boundingBox();expect(held).not.toBeNull();expect(Math.abs(held!.x-before!.x)).toBeLessThanOrEqual(2);expect(Math.abs(held!.y-before!.y)).toBeLessThanOrEqual(2);}finally{await page.mouse.up();}await expect(popup).toBeHidden();await expect(start).toBeFocused();await expect(start).toHaveValue('2026-11-02');await expect(section.getByRole('textbox',{name:'End reporting period',exact:true})).toHaveValue('2026-11-06');await expect(section.locator('[data-date-changes]')).toHaveText('Changes: 0');}
});
