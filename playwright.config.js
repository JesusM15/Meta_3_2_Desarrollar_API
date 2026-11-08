// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Cookie HTTP-Only se maneja automáticamente por el navegador
    // Para pruebas de API directas, usamos request context
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // Servidor local: inicia backend antes de las pruebas
  webServer: [{
    command: 'npm run db:migrate && node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: '3000',
      NODE_ENV: 'test',
      DB_DIALECT: 'sqlite',
      DB_STORAGE: './test-db.sqlite',
      JWT_SECRET: 'test_jwt_secret_playwright_2026',
      JWT_EXPIRES_IN: '2h',
      COOKIE_MAX_AGE: '7200000',
      ADMIN_EMAIL: 'admin@esports.com',
      ADMIN_PASSWORD: 'admin123',
      CLIENT_URL: 'http://localhost:5173'
    }
  }, {
    command: 'npm --prefix frontend run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 30000
  }]
});
