import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './browser', testMatch: '**/*.pw.js', workers: 1, timeout: 120000,
  use: { browserName: 'chromium', channel: 'chromium', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'node browser/serve.mjs', url: 'http://localhost:5100/api/health', timeout: 120000, reuseExistingServer: false },
})
