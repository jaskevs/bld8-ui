import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../../tests', testMatch: 'mcp-discovery.spec.ts',
  fullyParallel: true, workers: 2, forbidOnly: !!process.env.CI, reporter: 'list',
  outputDir: '../../test-results/mcp',
});
