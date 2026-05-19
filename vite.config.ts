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
                  if (id === "#tanstack-router-entry") {
                            return "\0tanstack-router-entry-stub";
                  }
          },
          load(id) {
                  if (id === "\0tanstack-router-entry-stub") {
                            return "export default {}";
                  }
          },
    };
}

export default defineConfig({
    plugins: [tanstackStartStub(), react(), tsconfigPaths(), tailwindcss()],
    build: {
          outDir: "dist",
    },
});
