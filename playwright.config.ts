import { defineConfig, devices } from '@playwright/test';

const serverPort = Number(process.env.PLAYWRIGHT_PORT ?? 4321);
const productionPreview = process.env.PLAYWRIGHT_PREVIEW === '1';
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${serverPort}/rundecoded/`;

export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: 'tests/e2e/__screenshots__/{arg}{ext}',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: productionPreview
      ? `node scripts/serve-dist.mjs --port ${serverPort}`
      : `./node_modules/.bin/astro dev --host 127.0.0.1 --port ${serverPort}`,
    url: `${baseURL}catalogue/`,
    reuseExistingServer: !process.env.CI && !productionPreview,
    timeout: 120_000,
  },
});
