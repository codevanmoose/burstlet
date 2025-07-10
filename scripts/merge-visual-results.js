#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

/**
 * Merge visual test results from multiple browser runs
 */
async function mergeVisualResults() {
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  const outputFile = path.join(process.cwd(), 'visual-test-results.json');
  
  const mergedResults = {
    suites: [],
    stats: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }
  };

  try {
    // Find all test result files
    const resultFiles = [];
    
    async function findResultFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await findResultFiles(fullPath);
        } else if (entry.name === 'visual-test-results.json') {
          resultFiles.push(fullPath);
        }
      }
    }
    
    await findResultFiles(artifactsDir);
    
    console.log(`Found ${resultFiles.length} result files to merge`);
    
    // Merge all results
    for (const file of resultFiles) {
      const data = await fs.readJson(file);
      
      if (data.suites) {
        mergedResults.suites.push(...data.suites);
      }
      
      if (data.stats) {
        mergedResults.stats.total += data.stats.total || 0;
        mergedResults.stats.passed += data.stats.passed || 0;
        mergedResults.stats.failed += data.stats.failed || 0;
        mergedResults.stats.skipped += data.stats.skipped || 0;
        mergedResults.stats.duration += data.stats.duration || 0;
      }
    }
    
    // Write merged results
    await fs.writeJson(outputFile, mergedResults, { spaces: 2 });
    
    console.log('Merge complete!');
    console.log(`Total tests: ${mergedResults.stats.total}`);
    console.log(`Passed: ${mergedResults.stats.passed}`);
    console.log(`Failed: ${mergedResults.stats.failed}`);
    console.log(`Pass rate: ${((mergedResults.stats.passed / mergedResults.stats.total) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error merging results:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  mergeVisualResults();
}

module.exports = { mergeVisualResults };