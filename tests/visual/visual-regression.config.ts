import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

export interface VisualRegressionConfig {
  // Screenshot comparison settings
  threshold: number; // Pixel difference threshold (0-1)
  maxDiffPixels: number; // Maximum allowed different pixels
  animations: 'disabled' | 'allow';
  
  // Baseline management
  baselineDir: string;
  actualDir: string;
  diffDir: string;
  updateBaseline: boolean;
  
  // Test settings
  viewports: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  
  browsers: Array<'chromium' | 'firefox' | 'webkit'>;
  
  // Component testing
  componentTimeout: number;
  fullPageScreenshot: boolean;
  
  // Reporting
  generateReport: boolean;
  reportDir: string;
  failOnDiff: boolean;
}

export const visualConfig: VisualRegressionConfig = {
  // Screenshot comparison
  threshold: 0.2, // 20% difference threshold
  maxDiffPixels: 100,
  animations: 'disabled',
  
  // Directories
  baselineDir: path.join(__dirname, 'baselines'),
  actualDir: path.join(__dirname, 'screenshots'),
  diffDir: path.join(__dirname, 'diffs'),
  updateBaseline: process.env.UPDATE_BASELINE === 'true',
  
  // Viewports for responsive testing
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ],
  
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Component settings
  componentTimeout: 30000,
  fullPageScreenshot: false,
  
  // Reporting
  generateReport: true,
  reportDir: path.join(__dirname, 'reports'),
  failOnDiff: true,
};

// Playwright configuration for visual tests
export const playwrightConfig: PlaywrightTestConfig = {
  testDir: './tests/visual',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...visualConfig, browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { ...visualConfig, browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { ...visualConfig, browserName: 'webkit' },
    },
  ],
  
  reporter: [
    ['html', { outputFolder: visualConfig.reportDir }],
    ['json', { outputFile: 'visual-test-results.json' }],
  ],
};

// Component test configurations
export const componentTestConfig = {
  // Button states
  buttonStates: ['default', 'hover', 'active', 'disabled', 'loading'],
  
  // Form states
  formStates: ['empty', 'filled', 'error', 'success', 'disabled'],
  
  // Theme variations
  themes: ['light', 'dark'],
  
  // Animation states
  animationStates: ['initial', 'active', 'complete'],
  
  // Loading states
  loadingStates: ['idle', 'loading', 'success', 'error'],
};

// Visual test helpers
export const visualTestHelpers = {
  // Wait for animations to complete
  waitForAnimations: async (page: any, timeout = 1000) => {
    await page.waitForTimeout(timeout);
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.getAnimations()).map(animation => animation.finished)
      );
    });
  },
  
  // Hide dynamic content
  hideDynamicContent: async (page: any) => {
    await page.evaluate(() => {
      // Hide timestamps
      document.querySelectorAll('[data-testid*="timestamp"]').forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
      
      // Hide loading spinners
      document.querySelectorAll('.loading-spinner').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // Freeze animations
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).style.animation = 'none';
        (el as HTMLElement).style.transition = 'none';
      });
    });
  },
  
  // Set consistent date/time
  mockDateTime: async (page: any, date = new Date('2024-01-01T12:00:00Z')) => {
    await page.addInitScript(`{
      Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super('${date.toISOString()}');
          } else {
            super(...args);
          }
        }
      };
    }`);
  },
};