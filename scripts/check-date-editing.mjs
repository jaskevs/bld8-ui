import {expect} from '@playwright/test';
/** Check actual complete date-entry examples without navigating, including installed-source consumers. */
export async function checkDateEntryExamples(page,getExample){
  const entry=getExample('date-entry-lifecycle'),field=entry.getByRole('textbox',{name:'Review date',exact:true});
  await expect(field).toHaveValue('2026-11-12');
  expect(await field.evaluate(input=>!!input.form&&!input.form.contains(input)&&!!input.form.querySelector('button[type="submit"]')?.textContent?.includes('Read review date'))).toBe(true);
  await entry.getByRole('button',{name:'Focus review date',exact:true}).click();await expect(field).toBeFocused();
  for(const text of ['2026-02-30','2026-10-31','']){
    await field.fill(text);await entry.getByRole('button',{name:'Read review date',exact:true}).click();
    await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');
    expect(await field.evaluate(element=>element.validity.valid)).toBe(false);
    await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 0');
    await expect(entry.getByRole('status')).toHaveText('No date submitted.');
  }
  await field.fill('2026-11-18');await field.press('Enter');
  await entry.getByRole('button',{name:'Read review date',exact:true}).click();
  await expect(entry.getByRole('status')).toHaveText('Review date: 2026-11-18; locked: 2026-11-18; unavailable: excluded');
  await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 1');
  await expect(entry.getByRole('textbox',{name:'Locked review date',exact:true})).toHaveAttribute('readonly','');
  await expect(entry.getByRole('textbox',{name:'Unavailable date',exact:true})).toBeDisabled();
  await entry.getByRole('checkbox',{name:'Keep date on reset',exact:true}).check();
  await entry.getByRole('button',{name:'Reset review date',exact:true}).click();await expect(field).toHaveValue('2026-11-18');
  await expect(entry.getByRole('status')).toHaveText('Reset prevented.');
  await entry.getByRole('checkbox',{name:'Keep date on reset',exact:true}).uncheck();
  await entry.getByRole('button',{name:'Reset review date',exact:true}).click();await expect(field).toHaveValue('2026-11-12');
  await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 1');
  const controlled=getExample('date-controlled-entry'),controlledField=controlled.getByRole('textbox',{name:'Controlled review date',exact:true});
  await controlled.getByRole('button',{name:'Set controlled date',exact:true}).click();await expect(controlledField).toHaveValue('2026-11-24');
  await controlledField.fill('2026-11-26');await controlledField.evaluate(element=>element.form.reset());await expect(controlledField).toHaveValue('2026-11-24');
  await controlled.getByRole('button',{name:'Clear controlled date',exact:true}).click();await expect(controlledField).toHaveValue('');
  await controlled.getByRole('button',{name:'Reset controlled date form',exact:true}).click();await expect(controlledField).toHaveValue('');
  await controlled.getByRole('button',{name:'Read controlled date',exact:true}).click();await expect(controlled.getByRole('status')).toHaveText('Controlled submitted:');
}
export async function checkDateRangeExample(page,getExample){
  const entry=getExample('date-range-presets'),opener=entry.getByRole('button',{name:'Open reporting period calendar',exact:true}),
    start=entry.getByRole('textbox',{name:'Start reporting period',exact:true}),end=entry.getByRole('textbox',{name:'End reporting period',exact:true});
  const popup=page.getByRole('dialog',{name:'Reporting period',exact:true});
  await opener.click();await expect(popup.getByRole('button',{name:'Unavailable week',exact:true})).toBeDisabled();
  await popup.getByRole('button',{name:'Second week',exact:true}).click();
  await expect(entry.locator('input[name="period.from"]')).toHaveValue('2026-11-02');await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await popup.getByRole('button',{name:'Cancel',exact:true}).click();await expect(popup).toBeHidden();await expect(start).toHaveValue('2026-11-02');await expect(start).toBeFocused();
  await opener.click();await popup.getByRole('button',{name:'Second week',exact:true}).click();await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();await expect(start).toHaveValue('2026-11-02');await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 0');
  await opener.click();await popup.getByRole('button',{name:'Second week',exact:true}).click();
  // On narrow layouts the open calendar can cover the outside submit button.
  // Dismiss through a real viewport gutter only when its center is covered.
  const outsideSubmit=entry.getByRole('button',{name:'Read reporting period',exact:true});
  await outsideSubmit.scrollIntoViewIfNeeded();
  const buttonBox=await outsideSubmit.boundingBox(),popupBox=await popup.boundingBox();
  const center=buttonBox?{x:buttonBox.x+buttonBox.width/2,y:buttonBox.y+buttonBox.height/2}:null;
  const covered=!!(center&&popupBox&&center.x>=popupBox.x&&center.x<=popupBox.x+popupBox.width&&center.y>=popupBox.y&&center.y<=popupBox.y+popupBox.height);
  if(covered&&popupBox){const width=page.viewportSize()?.width??await page.evaluate(()=>innerWidth);await page.mouse.click(popupBox.x>1?1:width-1,1);await expect(popup).toBeHidden();}
  await outsideSubmit.click();await expect(popup).toBeHidden();
  await expect(entry.getByRole('status')).toHaveText('Reporting period: 2026-11-02 to 2026-11-06');
  await opener.click();await popup.getByRole('button',{name:'Second week',exact:true}).click();await popup.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect(start).toHaveValue('2026-11-09');await expect(end).toHaveValue('2026-11-13');await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 1');
  await start.fill('2026-11-20');await end.fill('2026-11-10');await expect(entry.getByRole('button',{name:'Apply range',exact:true})).toBeDisabled();
  await expect(entry.locator('input[name="period.from"]')).toHaveValue('2026-11-09');
  await entry.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(start).toBeFocused();await expect(start).toHaveAttribute('aria-invalid','true');
  await end.fill('2026-11-24');await entry.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 2');
  await entry.getByRole('button',{name:'Reset reporting period',exact:true}).click();await expect(start).toHaveValue('2026-11-02');await expect(end).toHaveValue('2026-11-06');
  await expect(entry.locator('[data-date-changes]')).toHaveText('Changes: 2');
  await entry.getByRole('checkbox',{name:'Require reporting period',exact:true}).uncheck();
  await entry.getByRole('button',{name:'Clear reporting period',exact:true}).click();await entry.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect(start).toHaveValue('');await expect(end).toHaveValue('');
  await entry.getByRole('button',{name:'Read reporting period',exact:true}).click();await expect(entry.getByRole('status')).toHaveText('Reporting period:  to');
}
