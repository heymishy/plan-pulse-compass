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
    ],
    css: false,
    // Standardized timeouts to prevent timing issues
    testTimeout: 5000, // Increased for better stability
    hookTimeout: 3000, // Increased for cleanup operations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
        // Enhanced isolation settings
        isolate: true,
        useAtomics: true,
      },
    },
    reporters: ['default'],
    silent: false,
    coverage: {
      enabled: false,
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
        storageQuota: 10000000,
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          SkipExternalResources: true,
        },
        // Enhanced cleanup options - removed beforeParse due to serialization issues
      },
    },
    // Enhanced isolation settings
    isolate: true,
    passWithNoTests: true,
    watch: false,
    teardownTimeout: 5000, // Increased for proper cleanup
    sequence: {
      shuffle: false, // Keep deterministic order to debug timing issues
      concurrent: false, // Disable concurrency to prevent interference
    },
    // Force fresh environment for each test file
    restartOnConfigChange: true,
    // Improved error handling
    bail: 0, // Don't stop on first failure
    maxConcurrency: 1, // Ensure single-threaded execution
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
