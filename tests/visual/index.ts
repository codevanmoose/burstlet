/**
 * @module Visual
 * @description Visual regression testing module for Burstlet
 * 
 * This module provides comprehensive visual testing capabilities including:
 * - Screenshot comparison with pixelmatch
 * - Multi-browser and multi-viewport testing
 * - Component state testing
 * - Responsive design verification
 * - Automated baseline management
 * - HTML and JSON reporting
 * 
 * Following Van Moose visual testing standards
 */

export * from './visual-regression.config';
export * from './visual-test-utils';
export * from './visual-report-generator';
export * from './visual-test-runner';