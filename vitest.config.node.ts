import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    css: false,
    testTimeout: 3000,
    hookTimeout: 2000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
      },
    },
    reporters: ['default'],
    silent: false,
    coverage: {
      enabled: false,
    },
    isolate: true,
    passWithNoTests: true,
    watch: false,
    teardownTimeout: 2000,
    sequence: {
      shuffle: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [],
    exclude: ['@testing-library/react', '@testing-library/jest-dom'],
  },
  esbuild: {
    target: 'node18',
  },
});
