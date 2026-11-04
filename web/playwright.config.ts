import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    // Use Edge on local Windows; use standard Chromium in CI (Linux)
    channel: process.env.CI ? undefined : 'msedge',
  },

  projects: [
    {
      name: 'dev',
      use: {
        baseURL: 'https://dev1-fe.ezit.club',
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'msedge',
      },
    },

    {
      name: 'prod',
      use: {
        baseURL: 'https://app.ezit.club',
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'msedge',
      },
    },
  ],
});
