import { randomUUID } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

const port = 3101;
const runId = randomUUID();

export default defineConfig({
  testDir: './e2e',
  testMatch: 'checkout-real.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: `playwright-report-real/${runId}`, open: 'never' }],
  ],
  outputDir: `test-results-real/${runId}`,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      BREWLITE_E2E: 'real',
      NEXT_PUBLIC_BREWLITE_ORDER_MOCK: 'false',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
  },
});
