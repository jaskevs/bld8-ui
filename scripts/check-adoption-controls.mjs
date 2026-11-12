import {expect} from '@playwright/test';
import {checkGridBulk} from './check-grid-bulk.mjs';

/** Exact portable modules installed by both clean Next.js and Vite consumers. */
export const installedAdoptionExampleIds=['facets-people','checkbox-group-native-form','form-review-request','async-form-lifecycle','grid-bulk-operations'];

/** Exercise native forms, keyboard group selection and atomic batches in the actual installed modules. */
export async function checkInstalledAdoptionExamples(page,getExample){
  const people=await getExample('facets-people'),picker=people.getByRole('button',{name:'Reviewers',exact:true});
  await picker.click();const tree=page.getByRole('tree',{name:'Reviewers choices',exact:true}),design=tree.getByRole('treeitem',{name:'Design',exact:true});
  await expect(design).toHaveAttribute('aria-checked','mixed');await page.getByRole('searchbox',{name:'Search reviewers choices',exact:true}).fill('Maya');await design.focus();await design.press('Space');await expect(design).toHaveAttribute('aria-checked','true');await design.press('Escape');await expect(picker).toBeFocused();
  await people.getByRole('button',{name:'Use reviewers',exact:true}).click();await expect(people.getByRole('status')).toHaveText('maya, sam');await people.getByRole('button',{name:'Reset reviewers',exact:true}).click();await people.getByRole('button',{name:'Use reviewers',exact:true}).click();await expect(people.getByRole('status')).toHaveText('maya');

  const native=await getExample('checkbox-group-native-form'),delivery=native.getByRole('group',{name:'Delivery channels (required)',exact:true}),email=delivery.getByRole('checkbox',{name:'Email',exact:true}),app=delivery.getByRole('checkbox',{name:'In-app',exact:true});
  await email.uncheck();await native.getByRole('button',{name:'Read delivery values',exact:true}).click();await expect(email).toBeFocused();await app.check();
  await native.getByRole('checkbox',{name:'Prevent channel reset',exact:true}).check();await native.getByRole('button',{name:'Reset delivery choices',exact:true}).click();await expect(email).not.toBeChecked();await expect(app).toBeChecked();
  await native.getByRole('checkbox',{name:'Prevent channel reset',exact:true}).uncheck();await native.getByRole('button',{name:'Reset delivery choices',exact:true}).click();await expect(email).toBeChecked();await expect(app).not.toBeChecked();
  const locked=native.getByRole('group',{name:'Read-only channels',exact:true}).getByRole('checkbox',{name:'Email',exact:true});await locked.press('Space');await expect(locked).toBeChecked();await native.getByRole('button',{name:'Read delivery values',exact:true}).click();await expect(native.getByRole('status')).toHaveText('Delivery: email | Host: in-app | Locked: email | Disabled: false');

  const request=await getExample('form-review-request'),form=request.getByRole('form',{name:'Review request form'}),title=form.getByRole('textbox',{name:'Request title',exact:true});
  await form.getByRole('button',{name:'Prepare review request',exact:true}).click();await form.getByRole('link',{name:'Request title: Enter a request title.',exact:true}).click();await expect(title).toBeFocused();await title.fill('Installed form review');
  await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).check();await form.getByRole('textbox',{name:'Reviewer 1 email',exact:true}).fill('first@example.com');await form.getByRole('button',{name:'Add reviewer',exact:true}).click();const second=form.getByRole('textbox',{name:'Reviewer 2 email',exact:true});await expect(second).toBeFocused();await second.fill('second@example.com');
  await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).uncheck();await expect(second).not.toBeVisible();await form.getByRole('checkbox',{name:'Include reviewers',exact:true}).check();await expect(second).toHaveValue('second@example.com');
  await request.getByRole('checkbox',{name:'Reject next local save',exact:true}).check();await form.getByRole('button',{name:'Prepare review request',exact:true}).click();await expect(form.getByRole('link',{name:'Request title: This local request title is already used.',exact:true})).toBeVisible();await expect(title).toHaveValue('Installed form review');await expect(second).toHaveValue('second@example.com');await expect(title).toBeFocused();
  await title.fill('Corrected installed review');await form.getByRole('button',{name:'Prepare review request',exact:true}).click();await expect(request.getByRole('status')).toHaveText('Request prepared locally with 2 reviewers. No message was sent.');await form.getByRole('button',{name:'Reset review form',exact:true}).click();await expect(title).toHaveValue('');await expect(second).toHaveCount(0);

  const remote=await getExample('async-form-lifecycle'),owner=remote.getByRole('combobox',{name:'Assignee',exact:true}),result=remote.getByRole('status',{name:'Directory form result',exact:true});
  await owner.fill('Oliver');await page.getByRole('option',{name:'Oliver Reed',exact:true}).click();await owner.press('Escape');await expect(owner).toHaveValue('Oliver Reed');
  await remote.getByRole('checkbox',{name:'Keep values on reset',exact:true}).check();await remote.getByRole('button',{name:'Reset directory values',exact:true}).click();await expect(owner).toHaveValue('Oliver Reed');await remote.getByRole('checkbox',{name:'Keep values on reset',exact:true}).uncheck();await remote.getByRole('button',{name:'Reset directory values',exact:true}).click();await expect(owner).toHaveValue('Maya Chen');
  await remote.getByRole('checkbox',{name:'Lock directory fields',exact:true}).check();await owner.focus();await owner.press('ArrowDown');await owner.press('Backspace');await expect(owner).toHaveValue('Maya Chen');await expect(page.getByRole('listbox')).toHaveCount(0);await remote.getByRole('button',{name:'Read directory values',exact:true}).click();await expect(result).toContainText('["owner","maya"]');await expect(result).toContainText('["reviewers","sam"]');await expect(result).toContainText('["approvedBy","maya"]');await expect(result).not.toContainText('unavailable');

  const bulk=await getExample('grid-bulk-operations');await checkGridBulk(page,()=>bulk);
}
