import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * High-performance Vitest configuration optimized for speed
 * Target: 50-70% faster test execution
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'], // Use standard setup for compatibility
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',
      '**/*.spec.ts',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
    css: false,

    // Optimized timeouts for faster execution
    testTimeout: 2000, // Reduced from 5000ms
    hookTimeout: 1000, // Reduced from 3000ms
    teardownTimeout: 1000, // Reduced from 5000ms

    // Enable parallel execution with optimized workers
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: Math.min(
          4,
          Math.max(1, Math.floor(require('os').cpus().length / 2))
        ),
        minThreads: 2,
        isolate: false, // Faster execution, less isolation
      },
    },

    // Optimized reporting
    reporters: ['basic'], // Minimal reporting for speed
    silent: true,

    // Disable coverage for performance tests
    coverage: {
      enabled: false,
    },

    // Performance-optimized JSDOM
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: false,
        runScripts: 'outside-only',
        url: 'http://localhost:3000',
        referrer: 'http://localhost:3000',
        contentType: 'text/html',
        includeNodeLocations: false,
        storageQuota: 1000000, // Reduced storage quota
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          SkipExternalResources: true,
        },
      },
    },

    // Performance optimizations
    isolate: false, // Faster execution
    passWithNoTests: true,
    watch: false,

    // Enable concurrent execution
    sequence: {
      shuffle: false,
      concurrent: true, // Enable concurrency for speed
    },

    // Optimized concurrency settings
    maxConcurrency: Math.min(4, Math.max(1, require('os').cpus().length)),
    bail: 1, // Stop on first failure for faster feedback

    // Cache optimizations
    cache: {
      dir: 'node_modules/.vitest',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Optimized dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ],
    exclude: [],
  },

  // Optimized build settings
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: false, // Disable sourcemaps for speed
  },

  esbuild: {
    target: 'node18',
    sourcemap: false,
  },
});
