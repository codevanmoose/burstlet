# Visual Regression Testing Module Specification

## Overview

The Visual Regression Testing module provides automated visual testing capabilities for the Burstlet platform, ensuring UI consistency across browsers, viewports, and component states.

## Module Structure

```
tests/visual/
├── index.ts                        # Module exports
├── spec.md                         # This specification
├── visual-regression.config.ts     # Configuration settings
├── visual-test-utils.ts           # Testing utilities and helpers
├── visual-report-generator.ts     # Report generation
├── visual-test-runner.ts          # CLI test runner
├── components/                    # Component visual tests
│   ├── button.visual.test.ts
│   ├── form.visual.test.ts
│   └── card.visual.test.ts
├── pages/                         # Page visual tests
│   ├── dashboard.visual.test.ts
│   ├── login.visual.test.ts
│   └── settings.visual.test.ts
├── baselines/                     # Baseline screenshots
├── screenshots/                   # Current test screenshots
├── diffs/                        # Difference images
└── reports/                      # Test reports
```

## Key Components

### VisualRegressionConfig
- Screenshot comparison thresholds
- Browser and viewport configurations
- Directory management
- Reporting options

### VisualRegressionTester
- Screenshot capture and comparison
- Multi-state component testing
- Responsive design verification
- Pixelmatch integration

### VisualReportGenerator
- HTML report generation with interactive UI
- JSON report for CI/CD integration
- Screenshot gallery with diff visualization
- Test result filtering and analysis

### VisualTestRunner
- CLI interface for running tests
- Baseline management
- Browser selection
- Report generation

## Testing Capabilities

### Component Testing
- State variations (hover, focus, active, disabled)
- Theme testing (light/dark modes)
- Responsive behavior
- Animation states
- Accessibility features

### Page Testing
- Full page screenshots
- Widget isolation
- Loading states
- Empty states
- Modal overlays
- Navigation states

### Cross-Browser Testing
- Chromium
- Firefox
- WebKit
- Mobile Chrome
- Mobile Safari
- Tablet viewports

## Usage

### Running Tests
```bash
# Run all visual tests
npm run test:visual

# Update baselines
npm run test:visual:update

# Test specific browser
npm run test:visual:chromium

# Test mobile viewports
npm run test:visual:mobile

# Clean test directories
npm run test:visual:clean

# Update failed baselines
npm run test:visual:update-failed
```

### Writing Tests
```typescript
import { test } from '@playwright/test';
import { visualAssertions } from '../visual-test-utils';

test('component appearance', async ({ page }) => {
  await page.goto('/components/button');
  
  await visualAssertions.toMatchBaseline(
    page,
    '[data-testid="button"]',
    'button-default'
  );
});
```

## Configuration

### Environment Variables
- `UPDATE_BASELINE`: Set to 'true' to update baseline images
- `BASE_URL`: Target URL for testing (default: http://localhost:3000)
- `CI`: Adjusts retries and workers for CI environments

### Visual Config Options
```typescript
{
  threshold: 0.2,           // 20% pixel difference threshold
  maxDiffPixels: 100,      // Max allowed different pixels
  animations: 'disabled',   // Disable animations for consistency
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
}
```

## Best Practices

### Test Stability
1. Mock dynamic content (dates, random values)
2. Hide timestamps and live data
3. Disable animations and transitions
4. Wait for network idle state
5. Use consistent viewport sizes

### Screenshot Management
1. Use descriptive names for screenshots
2. Organize by component/page and state
3. Review baselines before committing
4. Clean up outdated baselines
5. Use version control for baselines

### Performance
1. Run tests in parallel when possible
2. Use focused test suites for development
3. Optimize image sizes
4. Clean up old test artifacts
5. Use CI-specific configurations

## Integration

### CI/CD Pipeline
```yaml
- name: Visual Tests
  run: |
    npm run test:visual
    if [ $? -ne 0 ]; then
      npm run test:visual:report
      exit 1
    fi
```

### Pre-commit Hooks
```bash
#!/bin/sh
# Run visual tests for changed components
npm run test:visual -- --changed
```

### Monitoring
- Track test execution time
- Monitor baseline size growth
- Alert on high failure rates
- Archive test reports

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Add explicit waits for elements
   - Increase network idle timeout
   - Mock inconsistent data

2. **Platform Differences**
   - Use platform-specific baselines
   - Adjust thresholds for anti-aliasing
   - Test in Docker for consistency

3. **Performance Issues**
   - Reduce parallel workers
   - Optimize screenshot sizes
   - Use selective test runs

4. **Baseline Drift**
   - Regular baseline reviews
   - Document intentional changes
   - Use semantic versioning

## Future Enhancements

1. **AI-Powered Analysis**
   - Automatic failure classification
   - Smart threshold adjustment
   - Visual change detection

2. **Advanced Reporting**
   - Trend analysis
   - Performance metrics
   - Change history tracking

3. **Integration Features**
   - Slack notifications
   - GitHub PR comments
   - JIRA ticket creation

4. **Testing Capabilities**
   - A/B test verification
   - Accessibility overlays
   - Performance visualization