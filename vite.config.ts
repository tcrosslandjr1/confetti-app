import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import fs from "node:fs";

// Stub server-only modules (*.server.ts and routes/api/**) in the client build.
// In this SPA setup, createServerFn is shimmed to a noop, so server modules are
// unreachable at runtime — but their static imports were dragging server-only
// deps (Stripe, AI SDK, supabase admin) into the browser bundle.
function stubServerModules() {
  const isApiRouteFile = (id: string) => {
    const clean = id.split("?")[0];
    return /[\\/]src[\\/]routes[\\/]api[\\/.]/.test(clean);
  };
  const isServerFile = (id: string) => {
    const clean = id.split("?")[0];
    if (/\.server\.(ts|tsx|js|jsx|mjs|cjs)$/.test(clean)) return true;
    if (isApiRouteFile(clean)) return true;
    return false;
  };
  return {
    name: "stub-server-modules",
    enforce: "pre" as const,
    load(id: string) {
      if (!isServerFile(id)) return null;
      const file = id.split("?")[0];
      let src = "";
      try {
        src = fs.readFileSync(file, "utf8");
      } catch {
        return "const s = new Proxy(function(){}, { get: () => s, apply: () => s }); export default s;";
      }
      const names = new Set<string>();
      for (const m of src.matchAll(
        /export\s+(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
      )) {
        names.add(m[1]);
      }
      for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
        for (const part of m[1].split(",")) {
          const name = part
            .split(/\s+as\s+/i)
            .pop()!
            .trim()
            .replace(/[;].*$/, "");
          if (name && name !== "default") names.add(name);
        }
      }
      const hasDefault = /export\s+default\b/.test(src);
      if (isApiRouteFile(id)) {
        const routePath =
          src.match(/createFileRoute\(\s*(["'`])([^"'`]+)\1\s*\)/)?.[2] ?? "/api/__stub";
        const extraNames = [...names]
          .filter((n) => n !== "Route")
          .map((n) => `export const ${n} = __stub;`);
        return [
          'import { createFileRoute } from "@tanstack/react-router";',
          "const __stub = new Proxy(function(){}, { get: () => __stub, apply: () => __stub, construct: () => ({}) });",
          `export const Route = createFileRoute(${JSON.stringify(routePath)})({});`,
          ...extraNames,
          hasDefault ? "export default __stub;" : "",
        ].join("\n");
      }
      const lines = [
        "const __stub = new Proxy(function(){}, { get: () => __stub, apply: () => __stub, construct: () => ({}) });",
        ...[...names].map((n) => `export const ${n} = __stub;`),
        hasDefault ? "export default __stub;" : "",
      ];
      return lines.join("\n");
    },
  };
}

export default defineConfig({
  plugins: [
    stubServerModules(),
    tsconfigPaths(),
    // Must run BEFORE viteReact so generated route files get React refresh.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    viteReact(),
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: /^@tanstack\/react-start\/server$/,
        replacement: path.resolve(__dirname, "./src/lib/server-fn-shim.ts"),
      },
      {
        find: /^@tanstack\/react-start$/,
        replacement: path.resolve(__dirname, "./src/lib/server-fn-shim.ts"),
      },
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["@tanstack/react-router"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
          ],
        },
      },
    },
  },
});
