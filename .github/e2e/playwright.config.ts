import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI; // GitHub sets CI=true for us

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: './test-results',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',    // a "flight recorder" file, kept only when a test fails
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
