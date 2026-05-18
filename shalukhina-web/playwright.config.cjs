const { defineConfig } = require('@playwright/test');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://shalukhina.danbel.ru';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
});

