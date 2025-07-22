/**
 * Script to validate and report on color contrast compliance
 */

import {
  generateContrastReport,
  getContrastRatio,
} from '@/utils/color-contrast';
import { colors } from '@/design-tokens';

// Generate full contrast report
const report = generateContrastReport();

console.log('='.repeat(60));
console.log('COLOR CONTRAST COMPLIANCE REPORT');
console.log('='.repeat(60));

console.log('\nSUMMARY:');
console.log(`Total combinations tested: ${report.summary.total}`);
console.log(
  `Passed WCAG AA: ${report.summary.passed} (${report.summary.passRate}%)`
);
console.log(`Failed WCAG AA: ${report.summary.failed}`);

if (report.summary.failed > 0) {
  console.log('\n❌ FAILED COMBINATIONS:');
  console.log('-'.repeat(40));

  const failed = report.details.filter(item => !item.passes);
  failed.forEach(item => {
    console.log(`${item.name}:`);
    console.log(`  Foreground: ${item.foreground}`);
    console.log(`  Background: ${item.background}`);
    console.log(`  Contrast ratio: ${item.ratio}:1 (${item.grade})`);
    console.log(`  Required: 4.5:1 for AA normal text`);
    console.log('');
  });
}

console.log('\n✅ PASSED COMBINATIONS:');
console.log('-'.repeat(40));

const passed = report.details.filter(item => item.passes);
passed.forEach(item => {
  console.log(`${item.name}: ${item.ratio}:1 (${item.grade})`);
});

console.log('\nSPECIFIC COLOR ANALYSIS:');
console.log('-'.repeat(40));

// Check specific problematic colors
const specificChecks = [
  { name: 'Primary Blue (#0ea5e9)', color: colors.primary[500] },
  { name: 'Success Green (#22c55e)', color: colors.semantic.success[500] },
  { name: 'Warning Orange (#f59e0b)', color: colors.semantic.warning[500] },
  { name: 'Error Red (#ef4444)', color: colors.semantic.error[500] },
];

specificChecks.forEach(check => {
  const ratio = getContrastRatio(check.color, colors.neutral[0]);
  const passes = ratio >= 4.5;
  console.log(`${check.name}:`);
  console.log(
    `  On white background: ${ratio.toFixed(2)}:1 ${passes ? '✅' : '❌'}`
  );
});

console.log('\nRECOMMENDATIONS:');
console.log('-'.repeat(40));

if (report.summary.passRate < 100) {
  console.log('1. Consider darkening colors that fail AA standards');
  console.log('2. Use darker variants (600-900) for text on light backgrounds');
  console.log(
    '3. Test all color combinations before finalizing the design system'
  );
  console.log('4. Consider providing high-contrast theme option');
} else {
  console.log('✅ All color combinations meet WCAG AA standards!');
}
