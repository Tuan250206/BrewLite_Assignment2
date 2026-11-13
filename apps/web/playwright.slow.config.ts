import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    launchOptions: {
      slowMo: 800,
    },
  },
  workers: 1,
});
