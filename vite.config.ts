import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  resolve: {
    alias: {
      "@tanstack/react-start": path.resolve(__dirname, "./src/lib/server-fn-shim.ts"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
