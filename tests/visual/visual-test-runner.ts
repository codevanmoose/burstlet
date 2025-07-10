#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { VisualReportGenerator } from './visual-report-generator';
import { visualConfig } from './visual-regression.config';

const execAsync = promisify(exec);

interface TestRunOptions {
  updateBaseline?: boolean;
  browsers?: string[];
  tests?: string[];
  generateReport?: boolean;
  cleanupDirs?: boolean;
}

class VisualTestRunner {
  private reportGenerator: VisualReportGenerator;

  constructor() {
    this.reportGenerator = new VisualReportGenerator();
  }

  /**
   * Run visual regression tests
   */
  async run(options: TestRunOptions = {}): Promise<void> {
    console.log(chalk.bold.blue('🎨 Running Visual Regression Tests...\n'));

    try {
      // Clean up directories if requested
      if (options.cleanupDirs) {
        await this.cleanupDirectories();
      }

      // Set environment variables
      if (options.updateBaseline) {
        process.env.UPDATE_BASELINE = 'true';
        console.log(chalk.yellow('⚠️  Baseline update mode enabled\n'));
      }

      // Build test command
      const browsers = options.browsers || visualConfig.browsers;
      const testPattern = options.tests?.join(' ') || '';
      
      for (const browser of browsers) {
        console.log(chalk.cyan(`\n📱 Testing on ${browser}...`));
        
        const command = `npx playwright test ${testPattern} --project=${browser}`;
        
        try {
          const { stdout, stderr } = await execAsync(command);
          
          if (stdout) {
            console.log(stdout);
          }
          
          if (stderr && !stderr.includes('warning')) {
            console.error(chalk.red(stderr));
          }
        } catch (error: any) {
          console.error(chalk.red(`\n❌ Tests failed for ${browser}`));
          console.error(error.message);
          
          // Continue with other browsers
          if (browsers.length > 1) {
            console.log(chalk.yellow('\n⏭️  Continuing with next browser...'));
          }
        }
      }

      // Generate report if requested
      if (options.generateReport !== false) {
        await this.generateReports();
      }

      // Clean up old reports
      await this.reportGenerator.cleanupOldReports(7);

      console.log(chalk.green('\n✨ Visual regression tests completed!\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ Visual test runner failed:'));
      console.error(error);
      process.exit(1);
    }
  }

  /**
   * Clean up test directories
   */
  private async cleanupDirectories(): Promise<void> {
    console.log(chalk.yellow('🧹 Cleaning up test directories...\n'));

    const dirs = [
      visualConfig.actualDir,
      visualConfig.diffDir,
    ];

    for (const dir of dirs) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
        console.log(chalk.gray(`  Removed: ${dir}`));
      }
    }
  }

  /**
   * Generate test reports
   */
  private async generateReports(): Promise<void> {
    console.log(chalk.cyan('\n📊 Generating test reports...'));

    try {
      // Parse test results
      await this.parseTestResults();

      // Generate HTML report
      const htmlReport = await this.reportGenerator.generateHTMLReport();
      console.log(chalk.green(`  ✅ HTML report: ${htmlReport}`));

      // Generate JSON report
      const jsonReport = await this.reportGenerator.generateJSONReport();
      console.log(chalk.green(`  ✅ JSON report: ${jsonReport}`));

      // Open HTML report in browser
      if (process.platform === 'darwin') {
        await execAsync(`open "${htmlReport}"`);
      } else if (process.platform === 'win32') {
        await execAsync(`start "${htmlReport}"`);
      } else {
        await execAsync(`xdg-open "${htmlReport}"`);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Report generation failed:'));
      console.error(error);
    }
  }

  /**
   * Parse test results from Playwright output
   */
  private async parseTestResults(): Promise<void> {
    const resultsFile = path.join(process.cwd(), 'visual-test-results.json');
    
    if (!await fs.pathExists(resultsFile)) {
      console.warn(chalk.yellow('⚠️  No test results file found'));
      return;
    }

    const results = await fs.readJson(resultsFile);
    
    // Process each test result
    for (const suite of results.suites || []) {
      for (const test of suite.tests || []) {
        if (test.results && test.results[0]) {
          const result = test.results[0];
          
          // Extract visual test data from attachments
          const attachments = result.attachments || [];
          const baselineAttachment = attachments.find((a: any) => a.name.includes('baseline'));
          const actualAttachment = attachments.find((a: any) => a.name.includes('actual'));
          const diffAttachment = attachments.find((a: any) => a.name.includes('diff'));
          
          if (actualAttachment) {
            this.reportGenerator.addResult({
              name: test.title,
              passed: result.status === 'passed',
              diffPixels: result.diffPixels || 0,
              diffPercentage: result.diffPercentage || 0,
              baselinePath: baselineAttachment?.path || '',
              actualPath: actualAttachment.path,
              diffPath: diffAttachment?.path || '',
              browser: suite.project?.name || 'unknown',
              viewport: this.extractViewport(test.title),
              timestamp: new Date(result.startTime),
            });
          }
        }
      }
    }
  }

  /**
   * Extract viewport from test name
   */
  private extractViewport(testName: string): string {
    if (testName.includes('mobile')) return 'mobile';
    if (testName.includes('tablet')) return 'tablet';
    if (testName.includes('desktop')) return 'desktop';
    return 'default';
  }

  /**
   * Update baselines for failed tests
   */
  async updateFailedBaselines(): Promise<void> {
    console.log(chalk.yellow('\n🔄 Updating baselines for failed tests...\n'));

    const resultsFile = path.join(process.cwd(), 'visual-test-results.json');
    
    if (!await fs.pathExists(resultsFile)) {
      console.error(chalk.red('❌ No test results file found'));
      return;
    }

    const results = await fs.readJson(resultsFile);
    let updatedCount = 0;

    for (const suite of results.suites || []) {
      for (const test of suite.tests || []) {
        if (test.results && test.results[0]?.status === 'failed') {
          const attachments = test.results[0].attachments || [];
          const actualAttachment = attachments.find((a: any) => a.name.includes('actual'));
          const baselineAttachment = attachments.find((a: any) => a.name.includes('baseline'));
          
          if (actualAttachment && baselineAttachment) {
            await fs.copy(actualAttachment.path, baselineAttachment.path);
            console.log(chalk.green(`  ✅ Updated: ${test.title}`));
            updatedCount++;
          }
        }
      }
    }

    console.log(chalk.green(`\n✨ Updated ${updatedCount} baselines`));
  }

  /**
   * Compare two visual test runs
   */
  async compareRuns(run1Dir: string, run2Dir: string): Promise<void> {
    console.log(chalk.bold.blue('\n🔍 Comparing visual test runs...\n'));

    // Implementation for comparing two test runs
    // This would analyze differences between two sets of screenshots
    console.log(chalk.yellow('⚠️  Compare runs feature not yet implemented'));
  }
}

// CLI interface
if (require.main === module) {
  const argv = process.argv.slice(2);
  const runner = new VisualTestRunner();

  const options: TestRunOptions = {
    updateBaseline: argv.includes('--update-baseline'),
    generateReport: !argv.includes('--no-report'),
    cleanupDirs: argv.includes('--clean'),
  };

  // Parse browser filter
  const browserIndex = argv.indexOf('--browser');
  if (browserIndex !== -1 && argv[browserIndex + 1]) {
    options.browsers = argv[browserIndex + 1].split(',');
  }

  // Parse test filter
  const testIndex = argv.indexOf('--test');
  if (testIndex !== -1 && argv[testIndex + 1]) {
    options.tests = [argv[testIndex + 1]];
  }

  // Handle special commands
  if (argv.includes('--update-failed')) {
    runner.updateFailedBaselines();
  } else if (argv.includes('--compare')) {
    const compareIndex = argv.indexOf('--compare');
    if (argv[compareIndex + 1] && argv[compareIndex + 2]) {
      runner.compareRuns(argv[compareIndex + 1], argv[compareIndex + 2]);
    } else {
      console.error(chalk.red('❌ Compare requires two directory paths'));
      process.exit(1);
    }
  } else {
    // Run tests
    runner.run(options);
  }
}

export { VisualTestRunner };