import fs from 'fs-extra';
import path from 'path';
import { visualConfig } from './visual-regression.config';

interface TestResult {
  name: string;
  passed: boolean;
  diffPixels: number;
  diffPercentage: number;
  baselinePath: string;
  actualPath: string;
  diffPath: string;
  browser: string;
  viewport: string;
  timestamp: Date;
}

interface ReportData {
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    duration: number;
    timestamp: Date;
  };
  results: TestResult[];
  config: typeof visualConfig;
}

export class VisualReportGenerator {
  private results: TestResult[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Add test result
   */
  addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(): Promise<string> {
    const reportData = this.getReportData();
    const reportPath = path.join(visualConfig.reportDir, 'visual-regression-report.html');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .summary-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .total { color: #007bff; }
    
    .filters {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .filter-group {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .filter-btn:hover {
      background: #f8f9fa;
    }
    
    .filter-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    .results {
      display: grid;
      gap: 20px;
    }
    
    .result-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .result-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .result-header.passed {
      background: #d4edda;
    }
    
    .result-header.failed {
      background: #f8d7da;
    }
    
    .result-title {
      font-size: 18px;
      font-weight: 500;
    }
    
    .result-meta {
      display: flex;
      gap: 15px;
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .result-images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    
    .image-container {
      text-align: center;
    }
    
    .image-container h4 {
      margin-bottom: 10px;
      color: #666;
    }
    
    .image-container img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .diff-info {
      margin-top: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      cursor: pointer;
    }
    
    .modal img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 90%;
      max-height: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Visual Regression Test Report</h1>
      <p>Generated on ${reportData.summary.timestamp.toLocaleString()}</p>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Total Tests</h3>
          <div class="value total">${reportData.summary.total}</div>
        </div>
        <div class="summary-card">
          <h3>Passed</h3>
          <div class="value passed">${reportData.summary.passed}</div>
        </div>
        <div class="summary-card">
          <h3>Failed</h3>
          <div class="value failed">${reportData.summary.failed}</div>
        </div>
        <div class="summary-card">
          <h3>Pass Rate</h3>
          <div class="value ${reportData.summary.passRate >= 95 ? 'passed' : 'failed'}">
            ${reportData.summary.passRate.toFixed(1)}%
          </div>
        </div>
        <div class="summary-card">
          <h3>Duration</h3>
          <div class="value">${(reportData.summary.duration / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </header>
    
    <div class="filters">
      <h3>Filters</h3>
      <div class="filter-group">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="passed">Passed</button>
        <button class="filter-btn" data-filter="failed">Failed</button>
        ${this.getBrowserFilters(reportData.results)}
        ${this.getViewportFilters(reportData.results)}
      </div>
    </div>
    
    <div class="results">
      ${reportData.results.map(result => this.renderResultCard(result)).join('')}
    </div>
  </div>
  
  <div class="modal" id="imageModal">
    <img id="modalImage" src="" alt="Full size image">
  </div>
  
  <script>
    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        document.querySelectorAll('.result-card').forEach(card => {
          if (filter === 'all' || card.dataset[filter] === 'true') {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
    
    // Image modal
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    document.querySelectorAll('.result-images img').forEach(img => {
      img.addEventListener('click', () => {
        modalImage.src = img.src;
        modal.style.display = 'block';
      });
    });
    
    modal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  </script>
</body>
</html>
    `;

    await fs.ensureDir(visualConfig.reportDir);
    await fs.writeFile(reportPath, html);

    return reportPath;
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(): Promise<string> {
    const reportData = this.getReportData();
    const reportPath = path.join(visualConfig.reportDir, 'visual-regression-report.json');

    await fs.ensureDir(visualConfig.reportDir);
    await fs.writeJson(reportPath, reportData, { spaces: 2 });

    return reportPath;
  }

  /**
   * Get report data
   */
  private getReportData(): ReportData {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    return {
      summary: {
        total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total) * 100 : 0,
        duration: Date.now() - this.startTime,
        timestamp: new Date(),
      },
      results: this.results,
      config: visualConfig,
    };
  }

  /**
   * Render result card HTML
   */
  private renderResultCard(result: TestResult): string {
    const statusClass = result.passed ? 'passed' : 'failed';
    const baselineUrl = this.getImageUrl(result.baselinePath);
    const actualUrl = this.getImageUrl(result.actualPath);
    const diffUrl = result.diffPath ? this.getImageUrl(result.diffPath) : '';

    return `
      <div class="result-card" 
           data-passed="${result.passed}" 
           data-browser="${result.browser}"
           data-viewport="${result.viewport}">
        <div class="result-header ${statusClass}">
          <div>
            <div class="result-title">${result.name}</div>
            <div class="result-meta">
              <span>Browser: ${result.browser}</span>
              <span>Viewport: ${result.viewport}</span>
              <span>Time: ${result.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
          <div class="result-status">
            ${result.passed ? '✓ Passed' : '✗ Failed'}
          </div>
        </div>
        
        <div class="result-images">
          <div class="image-container">
            <h4>Baseline</h4>
            <img data-src="${baselineUrl}" alt="Baseline" loading="lazy">
          </div>
          
          <div class="image-container">
            <h4>Actual</h4>
            <img data-src="${actualUrl}" alt="Actual" loading="lazy">
          </div>
          
          ${!result.passed ? `
            <div class="image-container">
              <h4>Difference</h4>
              <img data-src="${diffUrl}" alt="Difference" loading="lazy">
              <div class="diff-info">
                <strong>${result.diffPixels}</strong> pixels different
                (${result.diffPercentage.toFixed(2)}%)
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get browser filter buttons
   */
  private getBrowserFilters(results: TestResult[]): string {
    const browsers = [...new Set(results.map(r => r.browser))];
    return browsers.map(browser => 
      `<button class="filter-btn" data-filter="browser" data-browser="${browser}">
        ${browser}
      </button>`
    ).join('');
  }

  /**
   * Get viewport filter buttons
   */
  private getViewportFilters(results: TestResult[]): string {
    const viewports = [...new Set(results.map(r => r.viewport))];
    return viewports.map(viewport => 
      `<button class="filter-btn" data-filter="viewport" data-viewport="${viewport}">
        ${viewport}
      </button>`
    ).join('');
  }

  /**
   * Convert file path to URL
   */
  private getImageUrl(filePath: string): string {
    return `file://${path.resolve(filePath)}`;
  }

  /**
   * Clean up old reports
   */
  async cleanupOldReports(daysToKeep: number = 7): Promise<void> {
    const reportDir = visualConfig.reportDir;
    const files = await fs.readdir(reportDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(reportDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
      }
    }
  }
}