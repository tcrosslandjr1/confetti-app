import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return "react";
          if (id.includes("node_modules/@tanstack/")) return "tanstack";
          if (id.includes("node_modules/framer-motion/")) return "motion";
          if (id.includes("node_modules/lucide-react/")) return "icons";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (id.includes("node_modules/@ai-sdk/") || id.includes("node_modules/ai/"))
            return "ai-sdk";
          if (id.includes("node_modules/zod/") || id.includes("node_modules/@hookform/"))
            return "forms";
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-"))
            return "charts";
          if (id.includes("node_modules/date-fns/") || id.includes("node_modules/dayjs/"))
            return "date";
          if (id.includes("node_modules/@radix-ui/")) return "radix";
        },
      },
    },
  },
});
