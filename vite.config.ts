import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Stub out TanStack Start server-only imports for SPA build
function tanstackStartStub(): Plugin {
  return {
    name: "tanstack-start-stub",
    enforce: "pre",
    resolveId(id) {
      // Stub Node.js private (#) imports
      if (id.startsWith("#")) {
        return `\0stub-hash-${id}`;
      }
      // Stub TanStack Start virtual modules
      if (id.startsWith("tanstack-start-manifest")) {
        return `\0stub-manifest`;
      }
      // Stub any tsr: protocol imports
      if (id.startsWith("tsr:")) {
        return `\0stub-tsr-${id}`;
      }
    },
    load(id) {
      if (id.startsWith("\0stub-")) {
        return "export default {}; export const serverFnFetcher = () => {}; export const manifest = {};";
      }
    },
  };
}

export default defineConfig({
  plugins: [tanstackStartStub(), react(), tsconfigPaths(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      external: [],
      onwarn(warning, warn) {
        // Suppress unresolved import warnings for server-only modules
        if (warning.code === "UNRESOLVED_IMPORT" && warning.exporter?.includes("start-server")) {
          return;
        }
        warn(warning);
      },
    },
  },
});
