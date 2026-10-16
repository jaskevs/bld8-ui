import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.BLD8_UI_TEST_PORT || 3121);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('BLD8_UI_TEST_PORT must be an integer between 1024 and 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests', fullyParallel: true, workers: 3, forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', {open:'never'}]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure', reducedMotion: 'reduce' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } }],
  webServer: { command: `node node_modules/next/dist/bin/next start apps/docs --hostname 127.0.0.1 --port ${port}`, url: baseURL, reuseExistingServer: false, timeout: 60000 },
});