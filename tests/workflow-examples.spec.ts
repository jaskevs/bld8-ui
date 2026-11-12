import { test, expect, type Page } from '@playwright/test';

async function example(page: Page, component: string, id: string) {
  await page.goto('/components/' + component + '/examples/' + id);
  const region = page.locator('[data-example-id="' + id + '"]');
  const run = region.getByRole('button', { name: 'Run example', exact: true });
  if (await run.isVisible()) await run.click();
  await expect(region.locator('[data-example-ready]')).toBeVisible();
  return region;
}

test('dependent reviewer lookup clears parent-scoped values and recovers from one rejected search', async ({ page }) => {
  const region = await example(page, 'async-combobox', 'workflow-dependent-reviewer');
  const reviewer = region.getByRole('combobox', { name: 'Reviewer', exact: true });
  await reviewer.fill('Maya'); await page.getByRole('option', { name: 'Maya Chen', exact: false }).click();
  await region.getByRole('button', { name: 'Assign reviewer', exact: true }).click();
  await expect(region.getByLabel('Reviewer assignment result')).toHaveText('design / maya');
  await region.getByLabel('Team', { exact: true }).click(); await page.getByRole('option', { name: 'Research studio', exact: true }).click();
  await expect(reviewer).toHaveValue(''); await expect(region.getByRole('button', { name: 'Assign reviewer', exact: true })).toBeDisabled();
  await region.getByRole('checkbox', { name: 'Fail next reviewer lookup', exact: true }).check();
  await reviewer.fill('Eli');
  await expect(page.locator('.bui-async-popup').getByRole('alert')).toContainText('Options could not be loaded');
  await page.getByRole('button', { name: 'Retry reviewer search', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Eli Morgan', exact: false })).toBeVisible();
  await expect(reviewer).toBeFocused(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await region.getByRole('button', { name: 'Assign reviewer', exact: true }).click();
  await expect(region.getByLabel('Reviewer assignment result')).toHaveText('research / eli');
});

test('changing the team aborts a held directory response and excludes previous-team results', async ({ page }) => {
  const region = await example(page, 'async-combobox', 'workflow-dependent-reviewer');
  await region.getByRole('checkbox', { name: 'Hold directory responses', exact: true }).check();
  const reviewer = region.getByRole('combobox', { name: 'Reviewer', exact: true });
  await reviewer.fill('Maya'); await expect(region).toContainText('Held lookups: 1');
  await region.getByLabel('Team', { exact: true }).click(); await page.getByRole('option', { name: 'Research studio', exact: true }).click();
  await expect(region).toContainText(/Cancelled lookups: [1-9]/);
  await region.getByLabel('Hold directory responses', { exact: true }).uncheck();
  await reviewer.fill('Sam'); await expect(page.getByRole('option', { name: 'Sam Ortiz', exact: false })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Maya Chen', exact: false })).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Sam Rivera', exact: false })).toHaveCount(0);
});

test('file processing waits for acknowledgement and keeps one request identity through cancel and retry', async ({ page }) => {
  const region = await example(page, 'upload-queue', 'workflow-upload-acknowledgement');
  await region.getByLabel('Acknowledged local processing files', { exact: true }).setInputFiles({ name: 'review.txt', mimeType: 'text/plain', buffer: Buffer.from('Review focus and recovery.') });
  await region.getByRole('button', { name: 'Start queued', exact: true }).click();
  const row = region.locator('[data-upload-id]').filter({ hasText: 'review.txt' });
  await expect(row).toHaveAttribute('data-upload-status', 'processing');
  await expect(row).toContainText('awaiting acknowledgement');
  const readAttempts = async () => JSON.parse(await region.getByLabel('Upload attempt records').innerText()) as { requestId: string; attempt: number; status: string }[];
  const first = (await readAttempts())[0]; expect(first.attempt).toBe(1);
  await region.getByRole('button', { name: 'Cancel review.txt', exact: true }).click();
  await expect(row).toHaveAttribute('data-upload-status', 'cancelled');
  await expect(region.getByRole('button', { name: 'Acknowledge processed files', exact: true })).toBeDisabled();
  await region.getByRole('button', { name: 'Retry review.txt', exact: true }).click();
  await expect(row).toHaveAttribute('data-upload-status', 'processing');
  await region.getByRole('button', { name: 'Reject processed files', exact: true }).click();
  await expect(row).toHaveAttribute('data-upload-status', 'error');
  await region.getByRole('button', { name: 'Retry review.txt', exact: true }).click();
  await expect(row).toHaveAttribute('data-upload-status', 'processing');
  await region.getByRole('button', { name: 'Acknowledge processed files', exact: true }).click();
  await expect(row).toHaveAttribute('data-upload-status', 'complete'); await expect(row).toContainText('SHA-256');
  await expect.poll(async () => (await readAttempts())[0]).toEqual({ requestId: first.requestId, attempt: 3, status: 'complete' });
});

async function moveCard(page: Page, title: string, destination: string) {
  await page.getByRole('button', { name: 'Move ' + title, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Move item', exact: true });
  await dialog.getByRole('combobox', { name: 'Destination column', exact: true }).click();
  await page.getByRole('option', { name: destination, exact: true }).click();
  await dialog.getByRole('button', { name: 'Move item', exact: true }).click();
}

test('Kanban rejection restores the original order and retry applies exactly the intended move', async ({ page }) => {
  const region = await example(page, 'kanban', 'workflow-kanban-recovery');
  const board = region.getByRole('region', { name: 'Recoverable review board', exact: true });
  const planned = board.locator('[data-column-id="planned"]'), done = board.locator('[data-column-id="done"]');
  const order = async () => planned.locator('[data-item-id]').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.itemId));
  await moveCard(page, 'Review field labels', 'Done');
  await expect(done.locator('[data-item-id="labels"]')).toBeVisible();
  await expect(region.getByRole('button', { name: 'Move Check focus return', exact: true })).toBeDisabled();
  await region.getByRole('button', { name: 'Reject pending move', exact: true }).click();
  await expect(region.getByRole('alert')).toContainText('Original order restored'); await expect.poll(order).toEqual(['labels', 'focus']);
  await region.getByRole('button', { name: 'Retry intended move', exact: true }).click();
  await expect(done.locator('[data-item-id="labels"]')).toBeVisible();
  await region.getByRole('button', { name: 'Accept pending move', exact: true }).click();
  await expect(region.getByText('Move saved by the local adapter.', { exact: true })).toBeVisible();
  await expect.poll(order).toEqual(['focus']); await expect(done.locator('[data-item-id="labels"]')).toHaveCount(1);
  await expect(region.getByRole('button', { name: 'Retry intended move', exact: true })).toHaveCount(0);
});

test('cancelling a pending board save restores the original order and unlocks move actions', async ({ page }) => {
  const region = await example(page, 'kanban', 'workflow-kanban-recovery');
  await moveCard(page, 'Check focus return', 'Done');
  await region.getByRole('button', { name: 'Cancel pending move', exact: true }).click();
  await expect(region.getByText('Save cancelled. Original order restored.', { exact: true })).toBeVisible();
  await expect(region.locator('[data-column-id="planned"] [data-item-id="focus"]')).toBeVisible();
  await expect(region.locator('[data-column-id="done"] [data-item-id]')).toHaveCount(0);
  await expect(region.getByRole('button', { name: 'Move Check focus return', exact: true })).toBeEnabled();
  await expect(region.getByRole('button', { name: 'Retry intended move', exact: true })).toHaveCount(0);
});
