import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Auto-generated Vitest configuration for quality tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/e2e/**/*.spec.{ts,tsx}',
      'src/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    pool: 'threads',
    poolOptions: {
      forks: {
        singleFork: true,
        maxForks: 2,
        minForks: 1,
        isolate: true,
      },
      threads: {
        singleThread: true,
        maxThreads: 2,
        minThreads: 1,
        isolate: true,
      },
    },
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/html/index.html',
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/types/',
        'vite.config.*',
        'vitest.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    retry: 3,
    bail: 0,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
