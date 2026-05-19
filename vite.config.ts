import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), viteReact()],
  resolve: {
    alias: [
      {
        find: /^@tanstack\/react-start$/,
        replacement: path.resolve(__dirname, "./src/lib/server-fn-shim.ts"),
      },
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
