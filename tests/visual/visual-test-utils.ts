import { Page, Locator, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs-extra';
import path from 'path';
import { visualConfig } from './visual-regression.config';

export interface ScreenshotOptions {
  name: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: Locator[];
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
}

export interface ComparisonResult {
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  baselinePath: string;
  actualPath: string;
  diffPath: string;
}

export class VisualRegressionTester {
  private page: Page;
  private testName: string;
  private viewport: { width: number; height: number };

  constructor(page: Page, testName: string, viewport: { width: number; height: number }) {
    this.page = page;
    this.testName = testName;
    this.viewport = viewport;
  }

  /**
   * Capture and compare screenshot
   */
  async captureAndCompare(
    elementOrSelector: string | Locator,
    options: ScreenshotOptions
  ): Promise<ComparisonResult> {
    // Prepare element
    const element = typeof elementOrSelector === 'string' 
      ? this.page.locator(elementOrSelector)
      : elementOrSelector;

    // Wait for element to be visible
    await element.waitFor({ state: 'visible' });

    // Prepare screenshot options
    const screenshotOptions = {
      fullPage: options.fullPage || false,
      clip: options.clip,
      mask: options.mask,
      animations: options.animations || visualConfig.animations,
      caret: options.caret || 'hide',
      scale: options.scale || 'css',
    };

    // Generate file paths
    const baselinePath = this.getBaselinePath(options.name);
    const actualPath = this.getActualPath(options.name);
    const diffPath = this.getDiffPath(options.name);

    // Ensure directories exist
    await fs.ensureDir(path.dirname(baselinePath));
    await fs.ensureDir(path.dirname(actualPath));
    await fs.ensureDir(path.dirname(diffPath));

    // Take screenshot
    const screenshot = await element.screenshot(screenshotOptions);
    await fs.writeFile(actualPath, screenshot);

    // Check if baseline exists
    if (!await fs.pathExists(baselinePath)) {
      if (visualConfig.updateBaseline || !visualConfig.failOnDiff) {
        // Create baseline
        await fs.copy(actualPath, baselinePath);
        console.log(`Created baseline: ${baselinePath}`);
        return {
          passed: true,
          diffPixels: 0,
          diffPercentage: 0,
          baselinePath,
          actualPath,
          diffPath,
        };
      } else {
        throw new Error(`Baseline not found: ${baselinePath}`);
      }
    }

    // Compare with baseline
    const result = await this.compareImages(baselinePath, actualPath, diffPath);

    // Update baseline if requested
    if (visualConfig.updateBaseline && !result.passed) {
      await fs.copy(actualPath, baselinePath);
      console.log(`Updated baseline: ${baselinePath}`);
      result.passed = true;
    }

    return result;
  }

  /**
   * Compare component across different states
   */
  async compareComponentStates(
    component: string | Locator,
    states: string[],
    stateActions: Record<string, () => Promise<void>>
  ): Promise<Record<string, ComparisonResult>> {
    const results: Record<string, ComparisonResult> = {};

    for (const state of states) {
      // Apply state
      if (stateActions[state]) {
        await stateActions[state]();
      }

      // Capture and compare
      results[state] = await this.captureAndCompare(component, {
        name: `${this.testName}-${state}`,
      });
    }

    return results;
  }

  /**
   * Test responsive design
   */
  async testResponsive(
    elementOrSelector: string | Locator,
    viewports: Array<{ name: string; width: number; height: number }>
  ): Promise<Record<string, ComparisonResult>> {
    const results: Record<string, ComparisonResult> = {};

    for (const viewport of viewports) {
      // Set viewport
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Wait for layout to stabilize
      await this.page.waitForTimeout(500);

      // Capture and compare
      results[viewport.name] = await this.captureAndCompare(elementOrSelector, {
        name: `${this.testName}-${viewport.name}`,
      });
    }

    return results;
  }

  /**
   * Compare images using pixelmatch
   */
  private async compareImages(
    baselinePath: string,
    actualPath: string,
    diffPath: string
  ): Promise<ComparisonResult> {
    const baselineBuffer = await fs.readFile(baselinePath);
    const actualBuffer = await fs.readFile(actualPath);

    const baseline = PNG.sync.read(baselineBuffer);
    const actual = PNG.sync.read(actualBuffer);

    // Check dimensions
    if (baseline.width !== actual.width || baseline.height !== actual.height) {
      throw new Error(
        `Image dimensions don't match. Baseline: ${baseline.width}x${baseline.height}, ` +
        `Actual: ${actual.width}x${actual.height}`
      );
    }

    // Create diff image
    const diff = new PNG({ width: baseline.width, height: baseline.height });

    // Compare pixels
    const diffPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      baseline.width,
      baseline.height,
      { threshold: visualConfig.threshold }
    );

    // Save diff image if there are differences
    if (diffPixels > 0) {
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }

    const totalPixels = baseline.width * baseline.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    return {
      passed: diffPixels <= visualConfig.maxDiffPixels,
      diffPixels,
      diffPercentage,
      baselinePath,
      actualPath,
      diffPath,
    };
  }

  /**
   * Generate file paths
   */
  private getBaselinePath(name: string): string {
    return path.join(
      visualConfig.baselineDir,
      this.getBrowserName(),
      `${name}-${this.viewport.width}x${this.viewport.height}.png`
    );
  }

  private getActualPath(name: string): string {
    return path.join(
      visualConfig.actualDir,
      this.getBrowserName(),
      `${name}-${this.viewport.width}x${this.viewport.height}.png`
    );
  }

  private getDiffPath(name: string): string {
    return path.join(
      visualConfig.diffDir,
      this.getBrowserName(),
      `${name}-${this.viewport.width}x${this.viewport.height}-diff.png`
    );
  }

  private getBrowserName(): string {
    return this.page.context().browser()?.browserType().name() || 'unknown';
  }
}

/**
 * Visual regression test helpers
 */
export const visualHelpers = {
  /**
   * Prepare page for visual testing
   */
  async preparePage(page: Page) {
    // Disable animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Hide scrollbars
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `,
    });
  },

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(page: Page, timeout = 3000) {
    await page.waitForLoadState('networkidle', { timeout });
  },

  /**
   * Mock dynamic content
   */
  async mockDynamicContent(page: Page) {
    // Mock date/time
    await page.addInitScript(() => {
      const constantDate = new Date('2024-01-01T12:00:00Z');
      Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(constantDate);
          } else {
            // @ts-ignore
            super(...args);
          }
        }
        static now() {
          return constantDate.getTime();
        }
      } as any;
    });

    // Mock Math.random
    await page.addInitScript(() => {
      Math.random = () => 0.5;
    });

    // Mock crypto.randomUUID
    await page.addInitScript(() => {
      if (globalThis.crypto) {
        globalThis.crypto.randomUUID = () => '00000000-0000-0000-0000-000000000000';
      }
    });
  },

  /**
   * Hide elements by selector
   */
  async hideElements(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      await page.addStyleTag({
        content: `${selector} { visibility: hidden !important; }`,
      });
    }
  },

  /**
   * Force element state
   */
  async forceElementState(element: Locator, state: 'hover' | 'focus' | 'active') {
    switch (state) {
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'active':
        await element.click({ force: true, trial: true });
        break;
    }
  },
};

/**
 * Visual assertion helpers
 */
export const visualAssertions = {
  /**
   * Assert screenshot matches baseline
   */
  async toMatchBaseline(
    page: Page,
    elementOrSelector: string | Locator,
    name: string,
    options?: Partial<ScreenshotOptions>
  ) {
    const tester = new VisualRegressionTester(
      page,
      name,
      page.viewportSize() || { width: 1920, height: 1080 }
    );

    const result = await tester.captureAndCompare(elementOrSelector, {
      name,
      ...options,
    });

    expect(result.passed, 
      `Visual regression failed: ${result.diffPixels} pixels different ` +
      `(${result.diffPercentage.toFixed(2)}%). See diff at: ${result.diffPath}`
    ).toBe(true);

    return result;
  },

  /**
   * Assert no visual changes across states
   */
  async toHaveConsistentStates(
    page: Page,
    component: string | Locator,
    states: string[],
    stateActions: Record<string, () => Promise<void>>
  ) {
    const tester = new VisualRegressionTester(
      page,
      'state-test',
      page.viewportSize() || { width: 1920, height: 1080 }
    );

    const results = await tester.compareComponentStates(
      component,
      states,
      stateActions
    );

    const failures = Object.entries(results)
      .filter(([_, result]) => !result.passed)
      .map(([state, result]) => 
        `${state}: ${result.diffPixels} pixels different`
      );

    expect(failures.length, 
      `Visual regression failed for states: ${failures.join(', ')}`
    ).toBe(0);

    return results;
  },
};