import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
      '**/*.spec.ts',
      '**/playwright-report/**',
      '**/test-results/**',
      // Exclude memory-intensive O365 and OCR tests from coverage to prevent memory conflicts
      '**/services/__tests__/o365*',
      '**/utils/__tests__/ocr*',
      '**/components/ocr/__tests__/**',
      '**/__tests__/accessibility/**',
      '**/__tests__/performance/**',
      '**/__tests__/e2e/**',
    ],
    css: false,
    // Memory-optimized timeouts
    testTimeout: 10000,
    hookTimeout: 5000,
    teardownTimeout: 10000,
    // Single fork for coverage to prevent memory conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for coverage to reduce memory usage
        maxForks: 1,
        minForks: 1,
        isolate: true,
      },
    },
    reporters: ['default', 'json'],
    silent: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/e2e/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        // Exclude O365 and OCR services from coverage due to external dependencies
        '**/services/o365*',
        '**/services/ocr*',
        '**/utils/ocr*',
        // Exclude test utilities
        '**/src/test/**',
        // Exclude development-only files
        '**/*.stories.*',
        '**/vite.config.*',
        '**/vitest.config.*',
        '**/playwright.config.*',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 75,
          statements: 75,
        },
      },
      skipFull: false,
      all: true,
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: false,
        runScripts: 'outside-only',
        url: 'http://localhost:3000',
        referrer: 'http://localhost:3000',
        contentType: 'text/html',
        includeNodeLocations: false,
        storageQuota: 5000000, // Reduced storage quota for memory efficiency
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          SkipExternalResources: true,
        },
      },
    },
    // Enhanced isolation settings for coverage
    isolate: true,
    passWithNoTests: true,
    watch: false,
    sequence: {
      shuffle: false,
      concurrent: false, // Disable concurrency for coverage to reduce memory usage
    },
    restartOnConfigChange: true,
    bail: 0,
    maxConcurrency: 1, // Single concurrency for coverage
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@testing-library/react', '@testing-library/jest-dom'],
  },
  build: {
    target: 'esnext',
    minify: false,
  },
  esbuild: {
    target: 'node18',
  },
});
