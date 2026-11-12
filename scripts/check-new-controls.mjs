import {expect} from '@playwright/test';

/** Real example registry entries installed by both clean configured-alias consumers. */
export const installedCompositionExampleIds=[
  'autocomplete-form','autocomplete-async','toolbar-editor-actions',
  'alert-dialog-delete','navigation-product','preview-person',
  'workflow-dependent-reviewer','workflow-upload-acknowledgement','workflow-kanban-recovery'
];

/** Run actual example modules. getExample may navigate asynchronously or return an installed-section locator. */
export async function checkInstalledCompositionExamples(page,getExample){
  const form=await getExample('autocomplete-form'),team=form.getByRole('combobox',{name:'Team name',exact:true}),controlled=form.getByRole('combobox',{name:'Controlled team',exact:true});
  await team.fill('Installed source team');await controlled.fill('Installed platform');await controlled.press('Escape');
  await form.getByRole('button',{name:'Read autocomplete values',exact:true}).click();await expect(form.getByRole('status',{name:'Autocomplete form values',exact:true})).toHaveText('Values: Installed source team | Installed platform | Operations | disabled 0');
  await form.getByRole('checkbox',{name:'Prevent autocomplete reset',exact:true}).check();await form.getByRole('button',{name:'Reset autocomplete values',exact:true}).click();await expect(team).toHaveValue('Installed source team');
  await form.getByRole('checkbox',{name:'Prevent autocomplete reset',exact:true}).uncheck();await form.getByRole('button',{name:'Reset autocomplete values',exact:true}).click();await expect(team).toHaveValue('Design');await expect(controlled).toHaveValue('Research');
  await team.fill('xy');await team.press('Escape');await form.getByRole('button',{name:'Read autocomplete values',exact:true}).click();await expect(team).toBeFocused();await expect(team).toHaveAttribute('aria-invalid','true');await team.fill('Recovered team');await team.press('Escape');

  const async=await getExample('autocomplete-async'),query=async.getByRole('combobox',{name:'Search help articles',exact:true});
  await query.fill('design');await expect(async.getByRole('status',{name:'Suggestion request status',exact:true})).toHaveText('1 suggestions ready.');await query.press('Escape');
  await async.getByRole('button',{name:'Fail next suggestion request',exact:true}).click();await expect(async.getByRole('alert',{name:'Suggestion request status',exact:true})).toHaveText('Suggestions could not be loaded.');
  await async.getByRole('button',{name:'Retry suggestions',exact:true}).click();await expect(async.getByRole('status',{name:'Suggestion request status',exact:true})).toHaveText('1 suggestions ready.');await query.focus();await query.press('ArrowDown');await expect(query).toHaveAttribute('aria-expanded','true');await query.press('ArrowDown');await query.press('Enter');await expect(query).toHaveValue('Design tokens');await query.press('Escape');

  const editor=await getExample('toolbar-editor-actions'),toolbar=editor.getByRole('toolbar',{name:'Note actions',exact:true}),save=toolbar.getByRole('button',{name:'Save note',exact:true}),bold=toolbar.getByRole('button',{name:'Bold',exact:true});
  await editor.getByRole('textbox',{name:'Release note',exact:true}).fill('Installed editor note');await save.focus();await save.press('ArrowRight');await expect(bold).toBeFocused();await bold.press('Space');await expect(bold).toHaveAttribute('aria-pressed','true');await save.click();await expect(editor.getByRole('status')).toContainText('Saved');

  const deletion=await getExample('alert-dialog-delete'),remove=deletion.getByRole('button',{name:'Delete draft',exact:true});await remove.click();const confirmation=page.getByRole('alertdialog',{name:'Delete this draft?',exact:true}),cancel=confirmation.getByRole('button',{name:'Cancel',exact:true});
  await expect(cancel).toBeFocused();await cancel.press('Escape');await expect(confirmation).toBeHidden();await expect(remove).toBeFocused();await remove.click();await confirmation.getByRole('button',{name:'Delete draft',exact:true}).click();await expect(confirmation).toBeHidden();await expect(deletion).toContainText('Draft deleted locally');await expect(deletion.getByRole('button',{name:'Create another draft',exact:true})).toBeFocused();

  const navigation=await getExample('navigation-product'),nav=navigation.getByRole('navigation',{name:'Product navigation',exact:true}),product=nav.getByRole('button',{name:'Product',exact:true});await product.click();const destinations=page.getByRole('navigation',{name:'Product destinations',exact:true});await expect(destinations).toBeVisible();await destinations.getByRole('link',{name:/^Projects\b/}).click();await expect(destinations).toBeHidden();expect(new URL(page.url()).hash).toBe('#nav-product-projects');

  const preview=await getExample('preview-person'),person=preview.getByRole('link',{name:'Maya Chen',exact:true});await person.hover();const card=page.locator('.person-preview');await expect(card).toBeVisible();await expect(card).toHaveAttribute('aria-hidden','true');await person.focus();await page.keyboard.press('Escape');await expect(card).toBeHidden();await expect(person).toHaveAttribute('href','#preview-person-details');

  const dependent=await getExample('workflow-dependent-reviewer'),reviewer=dependent.getByRole('combobox',{name:'Reviewer',exact:true});
  await dependent.getByRole('combobox',{name:'Team',exact:true}).click();await page.getByRole('option',{name:'Research studio',exact:true}).click();await reviewer.fill('Eli');await page.getByRole('option').filter({hasText:'Eli Morgan'}).click();
  await dependent.getByRole('button',{name:'Assign reviewer',exact:true}).click();await expect(dependent.getByLabel('Reviewer assignment result',{exact:true})).toHaveText('research / eli');
  await dependent.getByRole('checkbox',{name:'Fail next reviewer lookup',exact:true}).check();await reviewer.fill('Eli');const retryReviewer=page.getByRole('button',{name:'Retry reviewer search',exact:true});await expect(retryReviewer).toBeVisible();await retryReviewer.click();await page.getByRole('option').filter({hasText:'Eli Morgan'}).click();
  await dependent.getByRole('combobox',{name:'Team',exact:true}).click();await page.getByRole('option',{name:'Design studio',exact:true}).click();await expect(reviewer).toHaveValue('');await expect(dependent.getByRole('button',{name:'Assign reviewer',exact:true})).toBeDisabled();

  const upload=await getExample('workflow-upload-acknowledgement'),uploadRecords=upload.getByLabel('Upload attempt records',{exact:true});
  await upload.getByLabel('Acknowledged local processing files',{exact:true}).setInputFiles({name:'installed-note.txt',mimeType:'text/plain',buffer:Buffer.from('Independent registry workflow bytes')});await upload.getByRole('button',{name:'Start queued',exact:true}).click();
  await expect(upload.locator('[data-upload-status="processing"]')).toHaveCount(1);await expect(upload.locator('[data-upload-status="complete"]')).toHaveCount(0);await expect(upload.getByRole('button',{name:'Reject processed files',exact:true})).toBeEnabled();
  const firstAttempt=JSON.parse(await uploadRecords.textContent())[0];await upload.getByRole('button',{name:'Reject processed files',exact:true}).click();await expect(upload.locator('[data-upload-status="error"]')).toHaveCount(1);
  await upload.getByRole('button',{name:'Retry installed-note.txt',exact:true}).click();await expect(upload.getByRole('button',{name:'Acknowledge processed files',exact:true})).toBeEnabled();const retried=JSON.parse(await uploadRecords.textContent())[0];expect(retried.requestId).toBe(firstAttempt.requestId);expect(retried.attempt).toBe(firstAttempt.attempt+1);
  await upload.getByRole('button',{name:'Acknowledge processed files',exact:true}).click();await expect(upload.locator('[data-upload-status="complete"]')).toHaveCount(1);await expect(upload.locator('.bui-upload-queue-hash')).toHaveAttribute('title',/^[a-f0-9]{64}$/);

  const kanban=await getExample('workflow-kanban-recovery'),boardOrder=kanban.getByRole('status',{name:'Board order',exact:true});
  await kanban.getByRole('button',{name:'Move Review field labels',exact:true}).click();const move=page.getByRole('dialog',{name:'Move item',exact:true});await move.getByRole('combobox',{name:'Destination column',exact:true}).click();await page.getByRole('option',{name:'Done',exact:true}).click();await move.getByRole('button',{name:'Move item',exact:true}).click();
  await expect(boardOrder).toContainText('labels:done');await expect(kanban.getByRole('button',{name:'Move Check focus return',exact:true})).toBeDisabled();await kanban.getByRole('button',{name:'Reject pending move',exact:true}).click();await expect(boardOrder).toHaveText('labels:planned | focus:planned | spacing:review');
  await kanban.getByRole('button',{name:'Retry intended move',exact:true}).click();await expect(boardOrder).toContainText('labels:done');await kanban.getByRole('button',{name:'Accept pending move',exact:true}).click();await expect(kanban.getByText('Move saved by the local adapter.',{exact:true})).toBeVisible();await expect(boardOrder).toContainText('labels:done');

}
