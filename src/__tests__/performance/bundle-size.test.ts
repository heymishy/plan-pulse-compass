import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

describe.skip('Bundle Size Performance Tests', () => {
  const distPath = path.join(process.cwd(), 'dist');

  it('should not exceed main bundle size limits', () => {
    const jsFiles = glob.sync(`${distPath}/assets/*.js`);

    for (const filePath of jsFiles) {
      const stats = statSync(filePath);
      const sizeInKB = Math.round(stats.size / 1024);
      const fileName = path.basename(filePath);

      // Different limits for different bundle types
      if (fileName.includes('vendor')) {
        expect(sizeInKB).toBeLessThan(200); // React core should be < 200KB
      } else if (fileName.includes('ui')) {
        expect(sizeInKB).toBeLessThan(150); // UI components < 150KB
      } else if (fileName.includes('charts')) {
        expect(sizeInKB).toBeLessThan(400); // Charts bundle < 400KB
      } else if (fileName.includes('ocr')) {
        expect(sizeInKB).toBeLessThan(800); // OCR libraries < 800KB
      } else if (fileName.includes('canvas')) {
        expect(sizeInKB).toBeLessThan(300); // Canvas library < 300KB
      } else {
        // Main application bundle should be significantly reduced
        expect(sizeInKB).toBeLessThan(600); // Main bundle < 600KB (down from 2.17MB)
      }

      console.log(`Bundle ${fileName}: ${sizeInKB}KB`);
    }
  });

  it('should have efficient gzipped sizes', () => {
    // This would require gzip analysis in a real environment
    // For now, we'll check that files exist and are reasonable
    const cssFiles = glob.sync(`${distPath}/assets/*.css`);

    expect(cssFiles.length).toBeGreaterThan(0);

    for (const filePath of cssFiles) {
      const stats = statSync(filePath);
      const sizeInKB = Math.round(stats.size / 1024);

      // CSS should be under 150KB
      expect(sizeInKB).toBeLessThan(150);
      console.log(`CSS ${path.basename(filePath)}: ${sizeInKB}KB`);
    }
  });

  it('should have proper chunk splitting', () => {
    const jsFiles = glob.sync(`${distPath}/assets/*.js`);

    // Should have at least 5 different chunks
    expect(jsFiles.length).toBeGreaterThanOrEqual(5);

    // Check for expected chunk names
    const chunkNames = jsFiles.map(f => path.basename(f));
    const hasVendorChunk = chunkNames.some(name => name.includes('vendor'));
    const hasUIChunk = chunkNames.some(name => name.includes('ui'));

    expect(hasVendorChunk).toBe(true);
    expect(hasUIChunk).toBe(true);

    console.log('Chunk files:', chunkNames);
  });

  it('should not have overly large individual files', () => {
    const allFiles = glob.sync(`${distPath}/**/*`, { nodir: true });

    for (const filePath of allFiles) {
      // Skip certain files that are expected to be large
      if (
        filePath.includes('.woff') ||
        filePath.includes('.svg') ||
        filePath.includes('worker')
      ) {
        continue;
      }

      const stats = statSync(filePath);
      const sizeInMB = stats.size / (1024 * 1024);

      // No single file should exceed 1MB
      expect(sizeInMB).toBeLessThan(1);

      if (sizeInMB > 0.5) {
        console.warn(
          `Large file detected: ${path.basename(filePath)} (${sizeInMB.toFixed(2)}MB)`
        );
      }
    }
  });
});
