import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Plugin to inject version information
const versionPlugin = () => {
  return {
    name: 'version-inject',
    transformIndexHtml(html: string) {
      // Get version info from environment variables or fallback
      const versionInfo = {
        version:
          process.env.VITE_APP_VERSION ||
          process.env.npm_package_version ||
          '0.0.0',
        buildNumber: process.env.VITE_APP_BUILD_NUMBER || 'dev',
        commitHash: process.env.VITE_APP_COMMIT_HASH || 'dev',
        commitHashShort: process.env.VITE_APP_COMMIT_HASH_SHORT || 'dev',
        buildDate: process.env.VITE_APP_BUILD_DATE || new Date().toISOString(),
        branch: process.env.VITE_APP_BRANCH || 'dev',
        environment:
          process.env.VITE_APP_ENVIRONMENT ||
          process.env.NODE_ENV ||
          'development',
      };

      // Inject version info as a script tag
      const versionScript = `
        <script>
          window.__VERSION_INFO__ = ${JSON.stringify(versionInfo, null, 2)};
        </script>
      `;

      return html.replace('</head>', `${versionScript}</head>`);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // Better visualization
      }),
    versionPlugin(),
  ].filter(Boolean),
  // Add polyfills for Node.js modules in browser
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600, // Increase limit for main chunk
    target: 'esnext', // Modern build target for better optimization
    rollupOptions: {
      // Define which modules should be treated as external
      external: id => {
        // Externalize Node.js modules that should not be bundled for browser
        const nodeModules = [
          'fs',
          'path',
          'os',
          'events',
          'stream',
          'buffer',
          'assert',
          'timers',
          'crypto',
          'util',
        ];
        return nodeModules.includes(id);
      },
      output: {
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],

          // UI framework chunks
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-toast',
          ],

          // Heavy feature chunks
          charts: ['recharts'],
          canvas: ['@xyflow/react'],
          ocr: ['tesseract.js', 'pptx2json', 'mammoth'],
          pdf: ['pdfjs-dist'],

          // Utility chunks
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      enabled: false,
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: false,
        runScripts: 'outside-only',
      },
    },
  },
}));
