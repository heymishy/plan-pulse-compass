import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Auto-generated Vitest configuration for comprehensive tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 5000,
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/__tests__/integration/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**/*',
      'src/__tests__/performance/**/*',
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
        isolate: true,
      },
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
        isolate: true,
      },
    },
    reporters: ['default'],
    coverage: {
      enabled: false,
    },
    retry: 2,
    bail: 0,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
