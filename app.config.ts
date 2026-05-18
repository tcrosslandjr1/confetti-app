import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    server: {
          preset: "vercel",
    },
    vite: {
          plugins: [tailwindcss(), tsconfigPaths()],
    },
});
