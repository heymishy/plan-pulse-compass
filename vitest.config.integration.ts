import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Integration test configuration
 * Tests multi-component interactions and data flow
 */
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
    testTimeout: 8000, // Longer timeout for integration tests
    hookTimeout: 3000,
    teardownTimeout: 3000,

    // Moderate parallelization for integration tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2, // Fewer threads to avoid conflicts
        minThreads: 1,
        isolate: true,
      },
    },

    reporters: ['verbose'],
    silent: false,

    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage/integration',
      include: [
        'src/context/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
      ],
      exclude: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    isolate: true,
    passWithNoTests: true,
    watch: false,

    sequence: {
      shuffle: false,
      concurrent: false, // Sequential execution for integration tests
    },

    maxConcurrency: 2,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/user-event',
    ],
  },
});
