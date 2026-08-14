// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { authHeader } from './src/auth-client.js';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['html'], ['allure-playwright'], ['./utils/test-listener.js']],
  use: {
    baseURL: 'https://api.trello.com/1/',
    extraHTTPHeaders: {
      Authorization: authHeader(),
    },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
