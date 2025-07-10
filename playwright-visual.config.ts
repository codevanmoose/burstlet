import { defineConfig, devices } from '@playwright/test';
import { visualConfig } from './tests/visual/visual-regression.config';

export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.visual.test.ts',
  
  // Test execution settings
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  
  // Global test settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // Visual testing specific
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],
  
  // Test output
  outputDir: './test-results/visual',
  
  // Reporting
  reporter: [
    ['html', { outputFolder: visualConfig.reportDir, open: 'never' }],
    ['json', { outputFile: 'visual-test-results.json' }],
    ['list'],
  ],
  
  // Web server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});