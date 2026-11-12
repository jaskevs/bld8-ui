import {test,expect} from '@playwright/test';

test('native fieldsets group required fields and exclude a disabled collection',async({page})=>{
  await page.goto('/components/fieldset/examples/fieldset-contact-groups');const form=page.getByRole('form',{name:'Grouped contact example'}),name=form.getByRole('textbox',{name:'Contact name',exact:true});
  await expect(form.getByRole('group',{name:'Contact details',exact:true})).toHaveAccessibleDescription('These fields describe who will receive the review.');
  await form.getByRole('button',{name:'Read grouped contact',exact:true}).click();await form.getByRole('link',{name:'Contact name: Enter a contact name.',exact:true}).click();await expect(name).toBeFocused();
  await name.fill('Avery');await form.getByRole('button',{name:'Read grouped contact',exact:true}).click();await expect(form.getByRole('status')).toHaveText('Avery | Interface team | disabled: false');
  await expect(form.getByRole('textbox',{name:'Retired contact',exact:true})).toBeDisabled();
});

test('external checkbox group form values preserve readonly choices and omit disabled groups',async({page})=>{
  await page.goto('/components/checkbox-group/examples/checkbox-group-native-form');const delivery=page.getByRole('group',{name:'Delivery channels (required)',exact:true}),locked=page.getByRole('group',{name:'Read-only channels',exact:true});
  await delivery.getByRole('checkbox',{name:'In-app',exact:true}).check();await locked.getByRole('checkbox',{name:'Email',exact:true}).click();await expect(locked.getByRole('checkbox',{name:'Email',exact:true})).toBeChecked();
  await locked.getByRole('checkbox',{name:'Email',exact:true}).press('Space');await expect(locked.getByRole('checkbox',{name:'Email',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Read delivery values',exact:true}).click();await expect(page.locator('[data-example-id=checkbox-group-native-form]').getByRole('status')).toHaveText('Delivery: email, in-app | Host: in-app | Locked: email | Disabled: false');
});

test('group minimum focuses the first enabled checkbox and reset respects native cancellation',async({page})=>{
  await page.goto('/components/checkbox-group/examples/checkbox-group-native-form');const delivery=page.getByRole('group',{name:'Delivery channels (required)',exact:true}),email=delivery.getByRole('checkbox',{name:'Email',exact:true}),app=delivery.getByRole('checkbox',{name:'In-app',exact:true});
  await email.uncheck();await page.getByRole('button',{name:'Read delivery values',exact:true}).click();await expect(email).toBeFocused();expect(await email.evaluate(node=>(node as HTMLInputElement).validationMessage)).toBe('Choose at least 1 option.');
  await app.check();await page.getByRole('checkbox',{name:'Prevent channel reset',exact:true}).check();await page.getByRole('button',{name:'Reset delivery choices',exact:true}).click();await expect(email).not.toBeChecked();await expect(app).toBeChecked();
  await page.getByRole('checkbox',{name:'Prevent channel reset',exact:true}).uncheck();await page.getByRole('button',{name:'Reset delivery choices',exact:true}).click();await expect(email).toBeChecked();await expect(app).not.toBeChecked();
});

test('linked form errors focus fields and repeatable reviewer rows retain conditional drafts',async({page})=>{
  await page.goto('/components/react-hook-form/examples/form-review-request');const example=page.locator('[data-example-id=form-review-request]'),form=example.getByRole('form',{name:'Review request form'}),title=form.getByRole('textbox',{name:'Request title',exact:true});
  await form.getByRole('button',{name:'Prepare review request',exact:true}).click();await expect(title).toBeFocused();const error=form.getByRole('link',{name:'Request title: Enter a request title.',exact:true});await error.click();await expect(title).toBeFocused();
  await title.fill('Interface review');await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).check();await form.getByRole('textbox',{name:'Reviewer 1 email',exact:true}).fill('first@example.com');await form.getByRole('button',{name:'Add reviewer',exact:true}).click();const second=form.getByRole('textbox',{name:'Reviewer 2 email',exact:true});await expect(second).toBeFocused();await second.fill('second@example.com');
  await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).uncheck();await expect(second).not.toBeVisible();await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).check();await expect(second).toHaveValue('second@example.com');
  await form.getByRole('button',{name:'Remove reviewer 2',exact:true}).click();await expect(form.getByRole('textbox',{name:'Reviewer 1 email',exact:true})).toBeFocused();await expect(second).toHaveCount(0);
});

test('rejected form saves preserve entered values and expose recoverable linked errors',async({page})=>{
  await page.goto('/components/react-hook-form/examples/form-review-request');const example=page.locator('[data-example-id=form-review-request]'),form=example.getByRole('form',{name:'Review request form'}),title=form.getByRole('textbox',{name:'Request title',exact:true});
  await title.fill('Interface review');await example.getByRole('checkbox',{name:'Reject next local save',exact:true}).check();await form.getByRole('button',{name:'Prepare review request',exact:true}).click();
  await expect(form.getByRole('link',{name:'Request title: This local request title is already used.',exact:true})).toBeVisible();await expect(title).toHaveValue('Interface review');await expect(title).toBeFocused();await expect(form.getByRole('checkbox',{name:'Email',exact:true})).toBeChecked();
  await title.fill('Updated interface review');await form.getByRole('button',{name:'Prepare review request',exact:true}).click();await expect(example.getByRole('status')).toHaveText('Request prepared locally with 0 reviewers. No message was sent.');
  await form.getByRole('button',{name:'Reset review form',exact:true}).click();await expect(title).toHaveValue('');await expect(form.getByRole('checkbox',{name:'Email',exact:true})).toBeChecked();
});

test('changing the first enabled checkbox clears its old validation anchor',async({page})=>{
  await page.goto('/components/checkbox-group/examples/checkbox-group-native-form');const delivery=page.getByRole('group',{name:'Delivery channels (required)',exact:true}),email=delivery.getByRole('checkbox',{name:'Email',exact:true}),app=delivery.getByRole('checkbox',{name:'In-app',exact:true});
  await email.uncheck();await expect.poll(()=>email.evaluate(node=>(node as HTMLInputElement).validationMessage)).toBe('Choose at least 1 option.');await page.getByRole('button',{name:'Reverse delivery choice order',exact:true}).click();
  await expect.poll(()=>email.evaluate(node=>(node as HTMLInputElement).validationMessage)).toBe('');await expect.poll(()=>app.evaluate(node=>(node as HTMLInputElement).validationMessage)).toBe('Choose at least 1 option.');await app.check();await page.getByRole('button',{name:'Read delivery values',exact:true}).click();await expect(page.locator('[data-example-id=checkbox-group-native-form]').getByRole('status')).toHaveText('Delivery: in-app | Host: in-app | Locked: email | Disabled: false');
});
