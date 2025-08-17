import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Auto-generated Vitest configuration for lightning tests
// Do not edit manually - regenerate using npm run generate:ci

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 5000,
    hookTimeout: 2500,
    include: [
      'src/utils/**/*.test.ts',
      'src/hooks/**/*.test.ts',
      'src/components/ui/**/*.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.integration.test.*',
      '**/*.e2e.spec.*',
      'tests/e2e/**/*',
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
    retry: 1,
    bail: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
