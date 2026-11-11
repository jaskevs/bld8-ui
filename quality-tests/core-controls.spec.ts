import type {Page} from '@playwright/test';
import {test,expect,openQualityPage,expectContained} from './fixtures';

const example=(page:Page,id:string)=>page.locator('[data-example-id="'+id+'"]');

test('core menus retain submenu focus and checked preferences under live motion changes',async({page},info)=>{
  await openQualityPage(page,'/components/dropdown',info);
  const actions=example(page,'dropdown-actions'),trigger=actions.getByRole('button',{name:'Record actions',exact:true});
  await expectContained(page);
  await trigger.focus();await trigger.press('ArrowDown');
  await expect(page.getByRole('menuitem',{name:'Mark reviewed',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowDown');const move=page.getByRole('menuitem',{name:'Move to',exact:true});
  await expect(move).toBeFocused();
  expect(await move.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').some(value=>parseFloat(value)>0))).toBe(true);
  await page.keyboard.press('ArrowRight');const submenu=page.getByRole('menu',{name:'Move to',exact:true});
  await expect(submenu).toBeVisible();await expect(submenu.getByRole('menuitem',{name:'Restricted area',exact:true})).toHaveAttribute('aria-disabled','true');
  await expect(submenu.getByRole('menuitem',{name:'Inbox',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');
  await expect(submenu.getByRole('menuitem',{name:'Review queue',exact:true})).toBeFocused();await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();await expect(actions.getByRole('status')).toContainText('Location: Review queue');
  await expectContained(page);

  const preferences=example(page,'dropdown-preferences'),preferencesTrigger=preferences.getByRole('button',{name:'View preferences',exact:true});
  await preferencesTrigger.click();const labels=page.getByRole('menuitemcheckbox',{name:'Show labels',exact:true});
  await labels.focus();await labels.press('Space');await expect(labels).toHaveAttribute('aria-checked','false');await expect(labels).toBeFocused();
  const compact=page.getByRole('menuitemradio',{name:'Compact spacing',exact:true});await compact.focus();await compact.press('Space');
  await expect(compact).toHaveAttribute('aria-checked','true');await expect(compact).toBeFocused();
  await expect(page.getByRole('menuitemradio',{name:'Automatic spacing',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>compact.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await expectContained(page);await page.keyboard.press('Escape');await expect(preferencesTrigger).toBeFocused();
  await expect(preferences.getByRole('status')).toContainText('Labels hidden · Compact spacing');
  await preferencesTrigger.press('Enter');await expect(labels).toHaveAttribute('aria-checked','false');await expect(compact).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Escape');await expect(preferencesTrigger).toBeFocused();
});

test('core toggle and tag forms preserve keyboard choices, rejected drafts and native reset',async({page},info)=>{
  await openQualityPage(page,'/components/toggle-group',info);const formatting=example(page,'toggle-formatting');
  const alignment=formatting.getByRole('group',{name:/Text alignment/}),left=alignment.getByRole('button',{name:'Align left',exact:true}),center=alignment.getByRole('button',{name:'Align center',exact:true});
  await left.focus();await left.press('ArrowRight');await expect(center).toBeFocused();await center.press('Space');await expect(center).toHaveAttribute('aria-pressed','true');
  await formatting.getByRole('button',{name:'Italic text',exact:true}).click();await expect(formatting.getByRole('button',{name:'Underline text',exact:true})).toBeDisabled();
  await formatting.getByRole('button',{name:'Apply formatting',exact:true}).click();
  await expect(formatting.getByLabel('Formatting form values')).toHaveText(JSON.stringify({alignment:['center'],format:['bold','italic']}));
  await center.click();await formatting.getByRole('button',{name:'Apply formatting',exact:true}).click();
  await expect(formatting.getByRole('alert')).toContainText('Choose at least one option.');await expect(left).toBeFocused();
  await formatting.getByRole('button',{name:'Reset formatting',exact:true}).click();await expect(left).toHaveAttribute('aria-pressed','true');
  await expect(formatting.getByRole('button',{name:'Italic text',exact:true})).toHaveAttribute('aria-pressed','false');await expect(formatting.getByRole('alert')).toHaveCount(0);await expectContained(page);

  await openQualityPage(page,'/components/tag-input',info);const topics=example(page,'tag-input-validation'),input=topics.getByRole('textbox',{name:'Topics',exact:true}),output=topics.getByLabel('Tag form values');
  await input.fill('TypeScript');await input.press('Enter');await expect(topics.getByRole('list',{name:'Topics tags',exact:true}).getByRole('listitem')).toHaveCount(2);
  await expect(output).toContainText('Submit to inspect');await input.fill('react');await input.press('Enter');
  await expect(topics.getByRole('alert')).toContainText('Already added: react');await expect(input).toHaveValue('react');
  await input.fill('');await input.press('Backspace');await expect(topics.getByRole('button',{name:'Remove TypeScript',exact:true})).toBeFocused();
  await page.keyboard.press('Backspace');await expect(topics.getByRole('list',{name:'Topics tags',exact:true}).getByRole('listitem')).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(input).toBeFocused();await input.fill('UI');await input.press(',');
  await topics.getByRole('button',{name:'Save topics',exact:true}).click();
  await expect(output).toHaveText(JSON.stringify({topics:['React','UI'],reviewers:['Documentation']}));
  await topics.getByRole('button',{name:'Reset topics',exact:true}).click();await expect(topics.getByRole('list',{name:'Topics tags',exact:true}).getByRole('listitem')).toHaveCount(1);
  await expect(topics.getByRole('button',{name:'Remove React',exact:true})).toBeVisible();await expect(input).toHaveValue('');await expect(topics.getByRole('alert')).toHaveCount(0);await expectContained(page);
});

test('core rich choices retain canonical IDs, searchable aliases and popup containment',async({page},info)=>{
  await openQualityPage(page,'/components/select',info);const deployment=example(page,'select-rich-options'),target=deployment.getByRole('combobox',{name:'Deployment target',exact:true});
  await deployment.getByRole('button',{name:'Open target list',exact:true}).click();
  await expect(page.getByRole('group',{name:'Delivery',exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'Archive cluster',exact:true})).toHaveAttribute('aria-disabled','true');
  await expectContained(page);await page.getByRole('option',{name:'Primary cluster',exact:true}).click();await expect(target).toBeFocused();
  await deployment.getByRole('button',{name:'Read deployment value',exact:true}).click();await expect(deployment.getByLabel('Deployment form value')).toHaveText('cluster-primary');
  await deployment.getByRole('button',{name:'Clear deployment target',exact:true}).click();await expect(target).toBeFocused();
  await deployment.getByRole('button',{name:'Read deployment value',exact:true}).click();await expect(deployment.getByLabel('Deployment form value')).toHaveText('');await expectContained(page);

  await openQualityPage(page,'/components/combobox',info);const office=example(page,'combobox-canonical-options'),search=office.getByRole('combobox',{name:'Office location',exact:true});
  await search.fill('aotearoa');await expect(page.getByRole('option',{name:'Wellington studio',exact:true})).toHaveAccessibleDescription('Waterfront workspace.');
  await expectContained(page);await search.press('ArrowDown');await search.press('Enter');await expect(search).toHaveValue('Wellington studio');
  await office.getByRole('button',{name:'Read office ID',exact:true}).click();await expect(office.getByLabel('Office form value')).toHaveText('wlg-studio');
  await search.fill('no matching studio');await expect(page.getByText('No matching options.',{exact:true})).toBeVisible();await search.press('Escape');
  await office.getByRole('button',{name:'Read office ID',exact:true}).click();await expect(office.getByLabel('Office form value')).toHaveText('wlg-studio');await expectContained(page);

  await openQualityPage(page,'/components/multi-select',info);const reviewers=example(page,'multi-select-grouped-reviewers'),panel=reviewers.getByRole('combobox',{name:'Review panel',exact:true});
  await reviewers.getByRole('button',{name:'Open reviewer list',exact:true}).click();await expect(page.getByRole('option',{name:'Noor Sethi',exact:true})).toHaveAttribute('aria-disabled','true');
  await expectContained(page);await page.getByRole('option',{name:'Jules Park',exact:true}).click();await page.keyboard.press('Escape');
  await reviewers.getByRole('button',{name:'Read reviewer IDs',exact:true}).click();await expect(reviewers.getByLabel('Reviewer form values')).toHaveText('avery, jules');
  await reviewers.getByRole('button',{name:'Clear review panel',exact:true}).click();await expect(panel).toBeFocused();
  await reviewers.getByRole('button',{name:'Read reviewer IDs',exact:true}).click();await expect(reviewers.getByLabel('Reviewer form values')).toHaveText('');await expectContained(page);
});

test('core ranges and one-time code fields preserve native keyboard editing and reset',async({page},info)=>{
  await openQualityPage(page,'/components/range-slider',info);const budget=example(page,'range-budget'),lower=budget.getByRole('slider',{name:'Minimum budget',exact:true}),upper=budget.getByRole('slider',{name:'Maximum budget',exact:true});
  await lower.focus();await lower.press('End');await expect(lower).toHaveValue('70');await upper.focus();await upper.press('Home');await expect(upper).toHaveValue('80');
  await expect(budget.getByRole('status')).toContainText('Committed');
  const retention=example(page,'range-uncontrolled'),earliest=retention.getByRole('slider',{name:'Earliest retention',exact:true});
  await earliest.focus();await earliest.press('ArrowRight');await retention.getByRole('button',{name:'Read retention values',exact:true}).click();await expect(retention.getByRole('status')).toHaveText('Retention values: 20, 45');
  await retention.getByRole('button',{name:'Reset retention example',exact:true}).click();await expect(earliest).toHaveValue('15');await expect(retention.getByRole('slider',{name:'Latest retention',exact:true})).toHaveValue('45');await expectContained(page);

  await openQualityPage(page,'/components/otp-input',info);const verification=example(page,'otp-code'),code=verification.getByRole('textbox',{name:'Example verification code',exact:true});
  await verification.getByRole('button',{name:'Check example code',exact:true}).click();await expect(code).toBeFocused();await expect(code).toHaveAttribute('aria-invalid','true');
  await expect(code).toHaveAttribute('autocomplete','one-time-code');await expect(code).toHaveAttribute('inputmode','numeric');
  await code.fill('123456');await code.evaluate(input=>(input as HTMLInputElement).setSelectionRange(2,4));await code.press('Backspace');await expect(code).toHaveValue('1256');
  await code.fill('654321');await verification.getByRole('button',{name:'Check example code',exact:true}).click();
  await expect(verification.getByRole('status')).toHaveText('Code format is ready. This example does not verify a code.');
  expect(await code.evaluate(input=>new FormData((input as HTMLInputElement).form!).get('verificationCode'))).toBe('654321');
  const backup=example(page,'otp-uncontrolled'),backupCode=backup.getByRole('textbox',{name:'Backup example code',exact:true});
  await backupCode.fill('1234');await backup.getByRole('button',{name:'Read backup example',exact:true}).click();await expect(backup.getByRole('status')).toHaveText('Entered code: 1234');
  await backup.getByRole('button',{name:'Reset backup example',exact:true}).click();await expect(backupCode).toHaveValue('12');await expect(backup.getByRole('textbox',{name:'Locked example code',exact:true})).toBeDisabled();await expectContained(page);
});
