import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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
      },
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
