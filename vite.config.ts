import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) only supports the function form
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return "react";
          if (id.includes("node_modules/framer-motion/")) return "motion";
          if (id.includes("node_modules/lucide-react/")) return "icons";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (id.includes("node_modules/@tanstack/")) return "query";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
