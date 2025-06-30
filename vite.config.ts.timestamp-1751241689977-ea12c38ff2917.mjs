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
    host: "::",
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
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlcy9wbGFuLXB1bHNlLWNvbXBhc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2VzL3BsYW4tcHVsc2UtY29tcGFzcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlcy9wbGFuLXB1bHNlLWNvbXBhc3Mvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tICdsb3ZhYmxlLXRhZ2dlcic7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcblxuLy8gUGx1Z2luIHRvIGluamVjdCB2ZXJzaW9uIGluZm9ybWF0aW9uXG5jb25zdCB2ZXJzaW9uUGx1Z2luID0gKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2ZXJzaW9uLWluamVjdCcsXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWw6IHN0cmluZykge1xuICAgICAgLy8gR2V0IHZlcnNpb24gaW5mbyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBvciBmYWxsYmFja1xuICAgICAgY29uc3QgdmVyc2lvbkluZm8gPSB7XG4gICAgICAgIHZlcnNpb246XG4gICAgICAgICAgcHJvY2Vzcy5lbnYuVklURV9BUFBfVkVSU0lPTiB8fFxuICAgICAgICAgIHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24gfHxcbiAgICAgICAgICAnMC4wLjAnLFxuICAgICAgICBidWlsZE51bWJlcjogcHJvY2Vzcy5lbnYuVklURV9BUFBfQlVJTERfTlVNQkVSIHx8ICdkZXYnLFxuICAgICAgICBjb21taXRIYXNoOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9DT01NSVRfSEFTSCB8fCAnZGV2JyxcbiAgICAgICAgY29tbWl0SGFzaFNob3J0OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9DT01NSVRfSEFTSF9TSE9SVCB8fCAnZGV2JyxcbiAgICAgICAgYnVpbGREYXRlOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9CVUlMRF9EQVRFIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgYnJhbmNoOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9CUkFOQ0ggfHwgJ2RldicsXG4gICAgICAgIGVudmlyb25tZW50OlxuICAgICAgICAgIHByb2Nlc3MuZW52LlZJVEVfQVBQX0VOVklST05NRU5UIHx8XG4gICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHxcbiAgICAgICAgICAnZGV2ZWxvcG1lbnQnLFxuICAgICAgfTtcblxuICAgICAgLy8gSW5qZWN0IHZlcnNpb24gaW5mbyBhcyBhIHNjcmlwdCB0YWdcbiAgICAgIGNvbnN0IHZlcnNpb25TY3JpcHQgPSBgXG4gICAgICAgIDxzY3JpcHQ+XG4gICAgICAgICAgd2luZG93Ll9fVkVSU0lPTl9JTkZPX18gPSAke0pTT04uc3RyaW5naWZ5KHZlcnNpb25JbmZvLCBudWxsLCAyKX07XG4gICAgICAgIDwvc2NyaXB0PlxuICAgICAgYDtcblxuICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZSgnPC9oZWFkPicsIGAke3ZlcnNpb25TY3JpcHR9PC9oZWFkPmApO1xuICAgIH0sXG4gIH07XG59O1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzo6JyxcbiAgICBwb3J0OiA4MDgwLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIG1vZGUgPT09ICdhbmFseXplJyAmJlxuICAgICAgdmlzdWFsaXplcih7XG4gICAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcbiAgICAgICAgb3BlbjogZmFsc2UsXG4gICAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgICAgfSksXG4gICAgdmVyc2lvblBsdWdpbigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgICB1dGlsczogWydkYXRlLWZucycsICdjbHN4JywgJ3RhaWx3aW5kLW1lcmdlJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvdGVzdC9zZXR1cC50cyddLFxuICAgIGNzczogdHJ1ZSxcbiAgICB0ZXN0VGltZW91dDogMzAwMDAsXG4gICAgaG9va1RpbWVvdXQ6IDMwMDAwLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcbiAgICAgICAgJ3NyYy90ZXN0LycsXG4gICAgICAgICcqKi8qLmQudHMnLFxuICAgICAgICAnKiovKi5jb25maWcuKicsXG4gICAgICAgICcqKi9jb3ZlcmFnZS8qKicsXG4gICAgICBdLFxuICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgfSxcbiAgICBlbnZpcm9ubWVudE9wdGlvbnM6IHtcbiAgICAgIGpzZG9tOiB7XG4gICAgICAgIHJlc291cmNlczogJ3VzYWJsZScsXG4gICAgICAgIHByZXRlbmRUb0JlVmlzdWFsOiBmYWxzZSxcbiAgICAgICAgcnVuU2NyaXB0czogJ291dHNpZGUtb25seScsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRRLFNBQVMsb0JBQW9CO0FBQ3pTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFKM0IsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTSxnQkFBZ0IsTUFBTTtBQUMxQixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixtQkFBbUIsTUFBYztBQUUvQixZQUFNLGNBQWM7QUFBQSxRQUNsQixTQUNFLFFBQVEsSUFBSSxvQkFDWixRQUFRLElBQUksdUJBQ1o7QUFBQSxRQUNGLGFBQWEsUUFBUSxJQUFJLHlCQUF5QjtBQUFBLFFBQ2xELFlBQVksUUFBUSxJQUFJLHdCQUF3QjtBQUFBLFFBQ2hELGlCQUFpQixRQUFRLElBQUksOEJBQThCO0FBQUEsUUFDM0QsV0FBVyxRQUFRLElBQUksd0JBQXVCLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsUUFDckUsUUFBUSxRQUFRLElBQUksbUJBQW1CO0FBQUEsUUFDdkMsYUFDRSxRQUFRLElBQUksd0JBQ1osUUFBUSxJQUFJLFlBQ1o7QUFBQSxNQUNKO0FBR0EsWUFBTSxnQkFBZ0I7QUFBQTtBQUFBLHNDQUVVLEtBQUssVUFBVSxhQUFhLE1BQU0sQ0FBQyxDQUFDO0FBQUE7QUFBQTtBQUlwRSxhQUFPLEtBQUssUUFBUSxXQUFXLEdBQUcsYUFBYSxTQUFTO0FBQUEsSUFDMUQ7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUMxQyxTQUFTLGFBQ1AsV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLElBQ0gsY0FBYztBQUFBLEVBQ2hCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQSxVQUMzQixJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsT0FBTyxDQUFDLFlBQVksUUFBUSxnQkFBZ0I7QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLEtBQUs7QUFBQSxJQUNMLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxvQkFBb0I7QUFBQSxNQUNsQixPQUFPO0FBQUEsUUFDTCxXQUFXO0FBQUEsUUFDWCxtQkFBbUI7QUFBQSxRQUNuQixZQUFZO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
