import { test, expect } from '@playwright/test';
import { 
  VisualRegressionTester, 
  visualHelpers, 
  visualAssertions 
} from '../visual-test-utils';
import { visualConfig, componentTestConfig } from '../visual-regression.config';

test.describe('Form Component Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to form component page
    await page.goto('/components/form');
    
    // Prepare page for visual testing
    await visualHelpers.preparePage(page);
    await visualHelpers.mockDynamicContent(page);
    await visualHelpers.waitForNetworkIdle(page);
  });

  test('form empty state', async ({ page }) => {
    const form = page.locator('[data-testid="contact-form"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      form,
      'form-empty'
    );
  });

  test('form field states', async ({ page }) => {
    const fieldStates = [
      { name: 'default', action: async () => {} },
      { name: 'focused', action: async () => {
        await page.focus('[data-testid="input-email"]');
      }},
      { name: 'filled', action: async () => {
        await page.fill('[data-testid="input-email"]', 'test@example.com');
        await page.fill('[data-testid="input-name"]', 'John Doe');
      }},
      { name: 'error', action: async () => {
        await page.fill('[data-testid="input-email"]', 'invalid-email');
        await page.click('[data-testid="submit-button"]');
        await page.waitForSelector('.error-message');
      }},
      { name: 'disabled', action: async () => {
        await page.evaluate(() => {
          document.querySelectorAll('input, textarea, select').forEach(el => {
            el.setAttribute('disabled', 'true');
          });
        });
      }},
    ];

    for (const state of fieldStates) {
      await state.action();
      
      await visualAssertions.toMatchBaseline(
        page,
        '[data-testid="contact-form"]',
        `form-state-${state.name}`
      );
      
      // Reset form
      await page.reload();
    }
  });

  test('form input types', async ({ page }) => {
    const inputTypes = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'date',
      'time',
      'file',
      'color',
      'range',
    ];

    for (const type of inputTypes) {
      const input = page.locator(`[data-testid="input-${type}"]`);
      
      if (await input.isVisible()) {
        await visualAssertions.toMatchBaseline(
          page,
          input,
          `form-input-${type}`
        );
      }
    }
  });

  test('form validation states', async ({ page }) => {
    const form = page.locator('[data-testid="validation-form"]');
    
    // Test validation messages
    const validationScenarios = [
      {
        name: 'required-fields',
        action: async () => {
          await page.click('[data-testid="submit-button"]');
          await page.waitForSelector('.required-error');
        }
      },
      {
        name: 'format-errors',
        action: async () => {
          await page.fill('[data-testid="input-email"]', 'not-an-email');
          await page.fill('[data-testid="input-phone"]', '123');
          await page.click('[data-testid="submit-button"]');
          await page.waitForSelector('.format-error');
        }
      },
      {
        name: 'success-state',
        action: async () => {
          await page.fill('[data-testid="input-email"]', 'valid@email.com');
          await page.fill('[data-testid="input-phone"]', '+1234567890');
          await page.fill('[data-testid="input-name"]', 'Valid Name');
          await page.click('[data-testid="submit-button"]');
          await page.waitForSelector('.success-message');
        }
      },
    ];

    for (const scenario of validationScenarios) {
      await scenario.action();
      
      await visualAssertions.toMatchBaseline(
        page,
        form,
        `form-validation-${scenario.name}`
      );
      
      // Reset form
      await page.reload();
    }
  });

  test('form select and dropdown', async ({ page }) => {
    const select = page.locator('[data-testid="country-select"]');
    
    // Closed state
    await visualAssertions.toMatchBaseline(
      page,
      select,
      'form-select-closed'
    );
    
    // Open state
    await select.click();
    await page.waitForSelector('.select-options');
    
    await visualAssertions.toMatchBaseline(
      page,
      select,
      'form-select-open'
    );
    
    // Selected state
    await page.click('[data-value="us"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      select,
      'form-select-selected'
    );
  });

  test('form checkbox and radio', async ({ page }) => {
    const checkboxGroup = page.locator('[data-testid="checkbox-group"]');
    const radioGroup = page.locator('[data-testid="radio-group"]');
    
    // Default state
    await visualAssertions.toMatchBaseline(
      page,
      checkboxGroup,
      'form-checkbox-default'
    );
    
    await visualAssertions.toMatchBaseline(
      page,
      radioGroup,
      'form-radio-default'
    );
    
    // Selected states
    await page.check('[data-testid="checkbox-1"]');
    await page.check('[data-testid="checkbox-3"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      checkboxGroup,
      'form-checkbox-selected'
    );
    
    await page.check('[data-testid="radio-2"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      radioGroup,
      'form-radio-selected'
    );
  });

  test('form textarea', async ({ page }) => {
    const textarea = page.locator('[data-testid="message-textarea"]');
    
    // Empty state
    await visualAssertions.toMatchBaseline(
      page,
      textarea,
      'form-textarea-empty'
    );
    
    // Filled state
    await textarea.fill('This is a multi-line\nmessage with some\ncontent to test\nthe textarea appearance.');
    
    await visualAssertions.toMatchBaseline(
      page,
      textarea,
      'form-textarea-filled'
    );
    
    // Auto-resize behavior
    await textarea.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8');
    
    await visualAssertions.toMatchBaseline(
      page,
      textarea,
      'form-textarea-expanded'
    );
  });

  test('form progress indicators', async ({ page }) => {
    const multiStepForm = page.locator('[data-testid="multi-step-form"]');
    
    // Step 1
    await visualAssertions.toMatchBaseline(
      page,
      multiStepForm,
      'form-progress-step1'
    );
    
    // Step 2
    await page.click('[data-testid="next-button"]');
    await page.waitForSelector('[data-step="2"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      multiStepForm,
      'form-progress-step2'
    );
    
    // Step 3 (final)
    await page.click('[data-testid="next-button"]');
    await page.waitForSelector('[data-step="3"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      multiStepForm,
      'form-progress-step3'
    );
  });

  test('form loading state', async ({ page }) => {
    const form = page.locator('[data-testid="async-form"]');
    
    // Fill form
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    
    // Submit and capture loading state
    await page.click('[data-testid="submit-button"]');
    
    // Wait for loading indicator
    await page.waitForSelector('.form-loading');
    
    await visualAssertions.toMatchBaseline(
      page,
      form,
      'form-loading-state'
    );
  });

  test('form responsive layout', async ({ page }) => {
    const form = page.locator('[data-testid="responsive-form"]');
    
    const tester = new VisualRegressionTester(
      page,
      'form-responsive',
      page.viewportSize() || { width: 1920, height: 1080 }
    );
    
    const results = await tester.testResponsive(
      form,
      visualConfig.viewports
    );
    
    // Assert all viewports pass
    Object.entries(results).forEach(([viewport, result]) => {
      expect(result.passed, 
        `Form layout failed for ${viewport}: ${result.diffPixels} pixels different`
      ).toBe(true);
    });
  });

  test('form themes', async ({ page }) => {
    const form = page.locator('[data-testid="themed-form"]');
    
    for (const theme of componentTestConfig.themes) {
      // Apply theme
      await page.evaluate((theme) => {
        document.documentElement.setAttribute('data-theme', theme);
      }, theme);
      
      // Wait for theme to apply
      await page.waitForTimeout(100);
      
      await visualAssertions.toMatchBaseline(
        page,
        form,
        `form-theme-${theme}`
      );
    }
  });

  test('form accessibility features', async ({ page }) => {
    const form = page.locator('[data-testid="accessible-form"]');
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    await visualAssertions.toMatchBaseline(
      page,
      form,
      'form-focus-indicators'
    );
    
    // Test error announcements
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[role="alert"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      form,
      'form-error-announcements'
    );
    
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    await visualAssertions.toMatchBaseline(
      page,
      form,
      'form-high-contrast'
    );
  });

  test('form field help text and tooltips', async ({ page }) => {
    const formField = page.locator('[data-testid=\"field-with-help\"]');
    
    // Default state with help text
    await visualAssertions.toMatchBaseline(
      page,
      formField,
      'form-field-help-text'
    );
    
    // Hover over info icon
    await page.hover('[data-testid="help-icon"]');
    await page.waitForSelector('.tooltip');
    
    await visualAssertions.toMatchBaseline(
      page,
      '.tooltip',
      'form-field-tooltip'
    );
  });
});