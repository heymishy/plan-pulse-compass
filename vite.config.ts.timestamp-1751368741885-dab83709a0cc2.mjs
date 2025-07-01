// vite.config.ts
import { defineConfig } from "file:///workspaces/plan-pulse-compass/node_modules/vite/dist/node/index.js";
import react from "file:///workspaces/plan-pulse-compass/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///workspaces/plan-pulse-compass/node_modules/lovable-tagger/dist/index.js";
import { visualizer } from "file:///workspaces/plan-pulse-compass/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/workspaces/plan-pulse-compass";
var versionPlugin = () => {
  return {
    name: "version-inject",
    transformIndexHtml(html) {
      const versionInfo = {
        version: process.env.VITE_APP_VERSION || process.env.npm_package_version || "0.0.0",
        buildNumber: process.env.VITE_APP_BUILD_NUMBER || "dev",
        commitHash: process.env.VITE_APP_COMMIT_HASH || "dev",
        commitHashShort: process.env.VITE_APP_COMMIT_HASH_SHORT || "dev",
        buildDate: process.env.VITE_APP_BUILD_DATE || (/* @__PURE__ */ new Date()).toISOString(),
        branch: process.env.VITE_APP_BRANCH || "dev",
        environment: process.env.VITE_APP_ENVIRONMENT || process.env.NODE_ENV || "development"
      };
      const versionScript = `
        <script>
          window.__VERSION_INFO__ = ${JSON.stringify(versionInfo, null, 2)};
        </script>
      `;
      return html.replace("</head>", `${versionScript}</head>`);
    }
  };
};
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "analyze" && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    versionPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select"
          ],
          utils: ["date-fns", "clsx", "tailwind-merge"]
        }
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    testTimeout: 3e4,
    hookTimeout: 3e4,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/tests/e2e/**",
      "**/playwright/**",
      "**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/tests/e2e/**",
        "**/playwright/**"
      ],
      enabled: false
    },
    environmentOptions: {
      jsdom: {
        resources: "usable",
        pretendToBeVisual: false,
        runScripts: "outside-only"
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9wbGFuLXB1bHNlLWNvbXBhc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL3BsYW4tcHVsc2UtY29tcGFzcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9wbGFuLXB1bHNlLWNvbXBhc3Mvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tICdsb3ZhYmxlLXRhZ2dlcic7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcblxuLy8gUGx1Z2luIHRvIGluamVjdCB2ZXJzaW9uIGluZm9ybWF0aW9uXG5jb25zdCB2ZXJzaW9uUGx1Z2luID0gKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2ZXJzaW9uLWluamVjdCcsXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWw6IHN0cmluZykge1xuICAgICAgLy8gR2V0IHZlcnNpb24gaW5mbyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBvciBmYWxsYmFja1xuICAgICAgY29uc3QgdmVyc2lvbkluZm8gPSB7XG4gICAgICAgIHZlcnNpb246XG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BUFBfVkVSU0lPTiB8fFxuICAgICAgICAgIHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24gfHxcbiAgICAgICAgICAnMC4wLjAnLFxuICAgICAgICBidWlsZE51bWJlcjogcHJvY2Vzcy5lbnYuVklURV9BUFBfQlVJTERfTlVNQkVSIHx8ICdkZXYnLFxuICAgICAgICBjb21taXRIYXNoOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9DT01NSVRfSEFTSCB8fCAnZGV2JyxcbiAgICAgICAgY29tbWl0SGFzaFNob3J0OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9DT01NSVRfSEFTSF9TSE9SVCB8fCAnZGV2JyxcbiAgICAgICAgYnVpbGREYXRlOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9CVUlMRF9EQVRFIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgYnJhbmNoOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9CUkFOQ0ggfHwgJ2RldicsXG4gICAgICAgIGVudmlyb25tZW50OlxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX0VOVklST05NRU5UIHx8XG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHxcbiAgICAgICAgICAnZGV2ZWxvcG1lbnQnLFxuICAgICAgfTtcblxuICAgICAgLy8gSW5qZWN0IHZlcnNpb24gaW5mbyBhcyBhIHNjcmlwdCB0YWdcbiAgICAgIGNvbnN0IHZlcnNpb25TY3JpcHQgPSBgXG4gICAgICAgIDxzY3JpcHQ+XG4gICAgICAgICAgd2luZG93Ll9fVkVSU0lPTl9JTkZPX18gPSAke0pTT04uc3RyaW5naWZ5KHZlcnNpb25JbmZvLCBudWxsLCAyKX07XG4gICAgICAgIDwvc2NyaXB0PlxuICAgICAgYDtcblxuICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZSgnPC9oZWFkPicsIGAke3ZlcnNpb25TY3JpcHR9PC9oZWFkPmApO1xuICAgIH0sXG4gIH07XG59O1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDgwODAsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgbW9kZSA9PT0gJ2FuYWx5emUnICYmXG4gICAgICB2aXN1YWxpemVyKHtcbiAgICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgICBvcGVuOiBmYWxzZSxcbiAgICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICAgIGJyb3RsaVNpemU6IHRydWUsXG4gICAgICB9KSxcbiAgICB2ZXJzaW9uUGx1Z2luKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgcm91dGVyOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICB1aTogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHV0aWxzOiBbJ2RhdGUtZm5zJywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3NldHVwLnRzJ10sXG4gICAgY3NzOiB0cnVlLFxuICAgIHRlc3RUaW1lb3V0OiAzMDAwMCxcbiAgICBob29rVGltZW91dDogMzAwMDAsXG4gICAgZXhjbHVkZTogW1xuICAgICAgJyoqL25vZGVfbW9kdWxlcy8qKicsXG4gICAgICAnKiovZGlzdC8qKicsXG4gICAgICAnKiovY3lwcmVzcy8qKicsXG4gICAgICAnKiovLntpZGVhLGdpdCxjYWNoZSxvdXRwdXQsdGVtcH0vKionLFxuICAgICAgJyoqL3trYXJtYSxyb2xsdXAsd2VicGFjayx2aXRlLHZpdGVzdCxqZXN0LGF2YSxiYWJlbCxueWMsY3lwcmVzcyx0c3VwLGJ1aWxkfS5jb25maWcuKicsXG4gICAgICAnKiovdGVzdHMvZTJlLyoqJyxcbiAgICAgICcqKi9wbGF5d3JpZ2h0LyoqJyxcbiAgICAgICcqKi8qLmUyZS57dGVzdCxzcGVjfS57anMsbWpzLGNqcyx0cyxtdHMsY3RzLGpzeCx0c3h9JyxcbiAgICBdLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcbiAgICAgICAgJ3NyYy90ZXN0LycsXG4gICAgICAgICcqKi8qLmQudHMnLFxuICAgICAgICAnKiovKi5jb25maWcuKicsXG4gICAgICAgICcqKi9jb3ZlcmFnZS8qKicsXG4gICAgICAgICcqKi90ZXN0cy9lMmUvKionLFxuICAgICAgICAnKiovcGxheXdyaWdodC8qKicsXG4gICAgICBdLFxuICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgfSxcbiAgICBlbnZpcm9ubWVudE9wdGlvbnM6IHtcbiAgICAgIGpzZG9tOiB7XG4gICAgICAgIHJlc291cmNlczogJ3VzYWJsZScsXG4gICAgICAgIHByZXRlbmRUb0JlVmlzdWFsOiBmYWxzZSxcbiAgICAgICAgcnVuU2NyaXB0czogJ291dHNpZGUtb25seScsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRRLFNBQVMsb0JBQW9CO0FBQ3pTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFKM0IsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTSxnQkFBZ0IsTUFBTTtBQUMxQixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixtQkFBbUIsTUFBYztBQUUvQixZQUFNLGNBQWM7QUFBQSxRQUNsQixTQUNFLFFBQVEsSUFBSSxvQkFDWixRQUFRLElBQUksdUJBQ1o7QUFBQSxRQUNGLGFBQWEsUUFBUSxJQUFJLHlCQUF5QjtBQUFBLFFBQ2xELFlBQVksUUFBUSxJQUFJLHdCQUF3QjtBQUFBLFFBQ2hELGlCQUFpQixRQUFRLElBQUksOEJBQThCO0FBQUEsUUFDM0QsV0FBVyxRQUFRLElBQUksd0JBQXVCLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsUUFDckUsUUFBUSxRQUFRLElBQUksbUJBQW1CO0FBQUEsUUFDdkMsYUFDRSxRQUFRLElBQUksd0JBQ1osUUFBUSxJQUFJLFlBQ1o7QUFBQSxNQUNKO0FBR0EsWUFBTSxnQkFBZ0I7QUFBQTtBQUFBLHNDQUVVLEtBQUssVUFBVSxhQUFhLE1BQU0sQ0FBQyxDQUFDO0FBQUE7QUFBQTtBQUlwRSxhQUFPLEtBQUssUUFBUSxXQUFXLEdBQUcsYUFBYSxTQUFTO0FBQUEsSUFDMUQ7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUMxQyxTQUFTLGFBQ1AsV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLElBQ0gsY0FBYztBQUFBLEVBQ2hCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQSxVQUMzQixJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsT0FBTyxDQUFDLFlBQVksUUFBUSxnQkFBZ0I7QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLEtBQUs7QUFBQSxJQUNMLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLG9CQUFvQjtBQUFBLE1BQ2xCLE9BQU87QUFBQSxRQUNMLFdBQVc7QUFBQSxRQUNYLG1CQUFtQjtBQUFBLFFBQ25CLFlBQVk7QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
