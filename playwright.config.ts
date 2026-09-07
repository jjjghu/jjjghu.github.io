import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4322', browserName: 'chromium', channel: process.env.CI ? undefined : 'chrome' },
  webServer: {
    command: 'node tests/preview.mjs',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
  },
});
