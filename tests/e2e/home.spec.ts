import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Welcome to Burstlet');
    
    // Check for description
    await expect(page.locator('p')).toContainText('AI-Powered Content Creation & Distribution Platform');
    
    // Check for buttons
    await expect(page.locator('button', { hasText: 'Get Started' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Learn More' })).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Burstlet/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /content creation/);
    
    // Check robots meta tag (should be noindex for private beta)
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });
});