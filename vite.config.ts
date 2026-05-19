import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Stub out all Node.js private (#) imports for SPA build
function tanstackStartStub(): Plugin {
    return {
          name: "tanstack-start-stub",
          enforce: "pre",
          resolveId(id) {
                  if (id.startsWith("#")) {
                            return `\0stub-${id}`;
                  }
          },
          load(id) {
                  if (id.startsWith("\0stub-#")) {
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
