import { test, expect } from '@playwright/test';
import { 
  VisualRegressionTester, 
  visualHelpers, 
  visualAssertions 
} from '../visual-test-utils';
import { visualConfig, componentTestConfig } from '../visual-regression.config';

test.describe('Button Component Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to button component page
    await page.goto('/components/button');
    
    // Prepare page for visual testing
    await visualHelpers.preparePage(page);
    await visualHelpers.mockDynamicContent(page);
    await visualHelpers.waitForNetworkIdle(page);
  });

  test('default button appearance', async ({ page }) => {
    const button = page.locator('[data-testid="default-button"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-default'
    );
  });

  test('button states', async ({ page }) => {
    const button = page.locator('[data-testid="interactive-button"]');
    
    const stateActions = {
      default: async () => {
        // Reset to default state
        await page.click('body');
      },
      hover: async () => {
        await button.hover();
      },
      active: async () => {
        await button.hover();
        await page.mouse.down();
      },
      focus: async () => {
        await button.focus();
      },
      disabled: async () => {
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="interactive-button"]');
          btn?.setAttribute('disabled', 'true');
        });
      },
    };

    await visualAssertions.toHaveConsistentStates(
      page,
      button,
      componentTestConfig.buttonStates.filter(s => s !== 'loading'),
      stateActions
    );
  });

  test('button variants', async ({ page }) => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'link'];
    
    for (const variant of variants) {
      const button = page.locator(`[data-testid="button-${variant}"]`);
      
      await visualAssertions.toMatchBaseline(
        page,
        button,
        `button-variant-${variant}`
      );
    }
  });

  test('button sizes', async ({ page }) => {
    const sizes = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      const button = page.locator(`[data-testid="button-size-${size}"]`);
      
      await visualAssertions.toMatchBaseline(
        page,
        button,
        `button-size-${size}`
      );
    }
  });

  test('button with icons', async ({ page }) => {
    const iconButtons = [
      { testId: 'button-icon-left', name: 'icon-left' },
      { testId: 'button-icon-right', name: 'icon-right' },
      { testId: 'button-icon-only', name: 'icon-only' },
    ];
    
    for (const { testId, name } of iconButtons) {
      const button = page.locator(`[data-testid="${testId}"]`);
      
      await visualAssertions.toMatchBaseline(
        page,
        button,
        `button-${name}`
      );
    }
  });

  test('loading button animation', async ({ page }) => {
    const button = page.locator('[data-testid="loading-button"]');
    
    // Trigger loading state
    await button.click();
    
    // Wait for loading animation to start
    await page.waitForTimeout(100);
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-loading',
      {
        animations: 'disabled', // Freeze animation for consistent screenshot
      }
    );
  });

  test('button group', async ({ page }) => {
    const buttonGroup = page.locator('[data-testid="button-group"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      buttonGroup,
      'button-group'
    );
  });

  test('responsive button layout', async ({ page }) => {
    const buttonContainer = page.locator('[data-testid="button-container"]');
    
    const tester = new VisualRegressionTester(
      page,
      'button-responsive',
      page.viewportSize() || { width: 1920, height: 1080 }
    );
    
    const results = await tester.testResponsive(
      buttonContainer,
      visualConfig.viewports
    );
    
    // Assert all viewports pass
    Object.entries(results).forEach(([viewport, result]) => {
      expect(result.passed, 
        `Button layout failed for ${viewport}: ${result.diffPixels} pixels different`
      ).toBe(true);
    });
  });

  test('button themes', async ({ page }) => {
    for (const theme of componentTestConfig.themes) {
      // Apply theme
      await page.evaluate((theme) => {
        document.documentElement.setAttribute('data-theme', theme);
      }, theme);
      
      // Wait for theme to apply
      await page.waitForTimeout(100);
      
      const button = page.locator('[data-testid="themed-button"]');
      
      await visualAssertions.toMatchBaseline(
        page,
        button,
        `button-theme-${theme}`
      );
    }
  });

  test('button focus styles', async ({ page }) => {
    const button = page.locator('[data-testid="focus-button"]');
    
    // Test keyboard focus
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to our button
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-keyboard-focus'
    );
    
    // Test click focus
    await button.click();
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-click-focus'
    );
  });

  test('button ripple effect', async ({ page }) => {
    const button = page.locator('[data-testid="ripple-button"]');
    
    // Click button to trigger ripple
    await button.click();
    
    // Capture at different stages of ripple animation
    const rippleStages = [0, 150, 300]; // milliseconds
    
    for (const delay of rippleStages) {
      await page.waitForTimeout(delay);
      
      await visualAssertions.toMatchBaseline(
        page,
        button,
        `button-ripple-${delay}ms`,
        {
          animations: 'disabled',
        }
      );
    }
  });

  test('button accessibility states', async ({ page }) => {
    const button = page.locator('[data-testid="a11y-button"]');
    
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-high-contrast'
    );
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await button.click();
    
    await visualAssertions.toMatchBaseline(
      page,
      button,
      'button-reduced-motion'
    );
  });
});