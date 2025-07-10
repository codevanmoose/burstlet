import { test, expect } from '@playwright/test';
import { 
  VisualRegressionTester, 
  visualHelpers, 
  visualAssertions 
} from '../visual-test-utils';
import { visualConfig } from '../visual-regression.config';

test.describe('Dashboard Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('[type="submit"]');
    
    await page.waitForURL('/dashboard');
    
    // Prepare page for visual testing
    await visualHelpers.preparePage(page);
    await visualHelpers.mockDynamicContent(page);
    
    // Hide dynamic content
    await visualHelpers.hideElements(page, [
      '[data-testid="last-updated"]',
      '[data-testid="notification-badge"]',
      '.timestamp',
      '.live-data',
    ]);
    
    await visualHelpers.waitForNetworkIdle(page);
  });

  test('dashboard overview', async ({ page }) => {
    await visualAssertions.toMatchBaseline(
      page,
      page,
      'dashboard-overview',
      {
        fullPage: true,
      }
    );
  });

  test('dashboard widgets', async ({ page }) => {
    const widgets = [
      { selector: '[data-testid="stats-widget"]', name: 'stats' },
      { selector: '[data-testid="chart-widget"]', name: 'chart' },
      { selector: '[data-testid="activity-widget"]', name: 'activity' },
      { selector: '[data-testid="calendar-widget"]', name: 'calendar' },
    ];

    for (const widget of widgets) {
      await visualAssertions.toMatchBaseline(
        page,
        widget.selector,
        `dashboard-widget-${widget.name}`
      );
    }
  });

  test('dashboard responsive layout', async ({ page }) => {
    const tester = new VisualRegressionTester(
      page,
      'dashboard-responsive',
      page.viewportSize() || { width: 1920, height: 1080 }
    );

    const results = await tester.testResponsive(
      page.locator('[data-testid="dashboard-container"]'),
      visualConfig.viewports
    );

    Object.entries(results).forEach(([viewport, result]) => {
      expect(result.passed, 
        `Dashboard layout failed for ${viewport}: ${result.diffPixels} pixels different`
      ).toBe(true);
    });
  });

  test('dashboard themes', async ({ page }) => {
    const themes = ['light', 'dark', 'auto'];

    for (const theme of themes) {
      // Apply theme
      await page.click('[data-testid="theme-toggle"]');
      await page.click(`[data-value="${theme}"]`);
      
      // Wait for theme transition
      await page.waitForTimeout(300);

      await visualAssertions.toMatchBaseline(
        page,
        '[data-testid="dashboard-container"]',
        `dashboard-theme-${theme}`
      );
    }
  });

  test('dashboard empty states', async ({ page }) => {
    // Navigate to empty dashboard
    await page.goto('/dashboard?empty=true');
    
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="empty-state"]',
      'dashboard-empty-state'
    );
  });

  test('dashboard loading states', async ({ page }) => {
    // Trigger loading state
    await page.goto('/dashboard?loading=true');
    
    const loadingElements = [
      { selector: '[data-testid="skeleton-stats"]', name: 'stats-skeleton' },
      { selector: '[data-testid="skeleton-chart"]', name: 'chart-skeleton' },
      { selector: '[data-testid="skeleton-table"]', name: 'table-skeleton' },
    ];

    for (const element of loadingElements) {
      await visualAssertions.toMatchBaseline(
        page,
        element.selector,
        `dashboard-loading-${element.name}`
      );
    }
  });

  test('dashboard navigation states', async ({ page }) => {
    const nav = page.locator('[data-testid="dashboard-nav"]');
    
    // Default state
    await visualAssertions.toMatchBaseline(
      page,
      nav,
      'dashboard-nav-default'
    );
    
    // Hover state
    await page.hover('[data-testid="nav-item-analytics"]');
    await visualAssertions.toMatchBaseline(
      page,
      nav,
      'dashboard-nav-hover'
    );
    
    // Active state
    await page.click('[data-testid="nav-item-analytics"]');
    await page.waitForURL('/dashboard/analytics');
    await visualAssertions.toMatchBaseline(
      page,
      nav,
      'dashboard-nav-active'
    );
  });

  test('dashboard modals', async ({ page }) => {
    // Open create content modal
    await page.click('[data-testid="create-content-btn"]');
    await page.waitForSelector('[data-testid="create-modal"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="create-modal"]',
      'dashboard-create-modal'
    );
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Open settings modal
    await page.click('[data-testid="settings-btn"]');
    await page.waitForSelector('[data-testid="settings-modal"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="settings-modal"]',
      'dashboard-settings-modal'
    );
  });

  test('dashboard data visualization', async ({ page }) => {
    // Wait for charts to render
    await page.waitForSelector('.chart-container canvas');
    
    // Test different chart types
    const charts = [
      { selector: '[data-testid="line-chart"]', name: 'line' },
      { selector: '[data-testid="bar-chart"]', name: 'bar' },
      { selector: '[data-testid="pie-chart"]', name: 'pie' },
      { selector: '[data-testid="area-chart"]', name: 'area' },
    ];

    for (const chart of charts) {
      await visualAssertions.toMatchBaseline(
        page,
        chart.selector,
        `dashboard-chart-${chart.name}`
      );
    }
  });

  test('dashboard mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile menu closed
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="mobile-header"]',
      'dashboard-mobile-menu-closed'
    );
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForSelector('[data-testid="mobile-menu"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="mobile-menu"]',
      'dashboard-mobile-menu-open'
    );
  });

  test('dashboard notifications', async ({ page }) => {
    // Open notifications panel
    await page.click('[data-testid="notifications-btn"]');
    await page.waitForSelector('[data-testid="notifications-panel"]');
    
    await visualAssertions.toMatchBaseline(
      page,
      '[data-testid="notifications-panel"]',
      'dashboard-notifications'
    );
    
    // Test notification states
    const notificationStates = [
      { selector: '[data-notification-type="info"]', name: 'info' },
      { selector: '[data-notification-type="success"]', name: 'success' },
      { selector: '[data-notification-type="warning"]', name: 'warning' },
      { selector: '[data-notification-type="error"]', name: 'error' },
    ];

    for (const notification of notificationStates) {
      if (await page.isVisible(notification.selector)) {
        await visualAssertions.toMatchBaseline(
          page,
          notification.selector,
          `dashboard-notification-${notification.name}`
        );
      }
    }
  });

  test('dashboard tooltips', async ({ page }) => {
    // Hover over elements with tooltips
    const tooltipElements = [
      { selector: '[data-tooltip="views"]', name: 'views' },
      { selector: '[data-tooltip="engagement"]', name: 'engagement' },
      { selector: '[data-tooltip="revenue"]', name: 'revenue' },
    ];

    for (const element of tooltipElements) {
      await page.hover(element.selector);
      await page.waitForSelector('.tooltip', { state: 'visible' });
      
      await visualAssertions.toMatchBaseline(
        page,
        '.tooltip',
        `dashboard-tooltip-${element.name}`
      );
    }
  });
});