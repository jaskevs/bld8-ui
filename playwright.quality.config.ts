import {defineConfig} from '@playwright/test';

const port = Number(process.env.BLD8_UI_TEST_PORT || 3123);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('BLD8_UI_TEST_PORT must be an integer between 1024 and 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;
const sizes = {desktop: {width:1440, height:1100}, phone: {width:390, height:844}};
const themes = ['light', 'dark'] as const;
const viewports = ['desktop', 'phone'] as const;

export default defineConfig({
  testDir: './quality-tests',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: !!process.env.CI,
  // Missing or changed images fail. Updating goldens always needs an explicit CLI flag.
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  outputDir: 'test-results/quality',
  reporter: [['list'], ['html', {outputFolder:'playwright-report/quality', open:'never'}]],
  expect: {toHaveScreenshot: {animations:'disabled', caret:'hide', scale:'css', maxDiffPixels:40, threshold:0.15, stylePath:'./quality-tests/screenshot.css'}},
  use: {
    baseURL,
    locale: 'en-AU',
    timezoneId: 'UTC',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...viewports.flatMap(size => themes.map(theme => ({
      name: `visual-${size}-${theme}`,
      testMatch: 'visual.spec.ts',
      use: {browserName:'chromium' as const, viewport:sizes[size], colorScheme:theme, reducedMotion:'reduce' as const},
    }))),
    ...(['chromium','firefox','webkit'] as const).flatMap(browserName=>themes.map(theme=>({
      name: 'touch-'+browserName+'-'+theme,
      testMatch:'touch-mobile.spec.ts',
      use:{browserName,viewport:sizes.phone,hasTouch:true,colorScheme:theme,reducedMotion:'no-preference' as const},
    }))),
    ...(['chromium', 'firefox', 'webkit'] as const).flatMap(browserName => viewports.flatMap(size => themes.map(theme => ({
      name: `smoke-${browserName}-${size}-${theme}`,
      testMatch: 'portable-smoke.spec.ts',
      // A phone-sized viewport is portable to Firefox; this does not emulate a real iPhone.
      use: {browserName, viewport:sizes[size], colorScheme:theme, reducedMotion:'no-preference' as const},
    })))),
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start apps/docs --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
