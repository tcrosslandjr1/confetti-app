import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

function tanstackStartStub(): Plugin {
  return {
    name: "tanstack-start-stub",
    enforce: "pre",
    resolveId(id) {
      if (id.startsWith("#")) return `\0stub-hash-${id}`;
      if (id.startsWith("tanstack-start-")) return `\0stub-ts-${id}`;
      if (id.startsWith("tsr:")) return `\0stub-tsr-${id}`;
      if (id.startsWith("node:")) return `\0stub-node-${id}`;
      if (id.includes("@tanstack/start-"))
        return `\0stub-tanstack-pkg-${id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (id.includes("@tanstack/server-fn")) return "\0stub-server-fn";
    },
    load(id) {
      if (id.startsWith("\0stub-")) {
        return `
          export default {};
          export const serverFnFetcher = () => {};
          export const manifest = {};
          export const scripts = [];
          export const AsyncLocalStorage = class {};
          export const createHash = () => ({update: () => ({digest: () => ''})});
          export const randomBytes = () => '';
          export const createHmac = () => ({update: () => ({digest: () => ''})});
          export const Readable = class { pipe() { return this; } on() { return this; } };
          export const Writable = class { write() {} end() {} on() { return this; } };
          export const Transform = class { pipe() { return this; } on() { return this; } };
          export const Duplex = class { pipe() { return this; } on() { return this; } };
          export const PassThrough = class { pipe() { return this; } on() { return this; } };
          export const pipeline = () => {};
          export const finished = () => {};
          export const ReadableStream = class {};
          export const WritableStream = class {};
          export const TransformStream = class {};
          export const getStartContext = () => ({});
          export const createIsomorphicFn = () => ({ client: (fn) => fn, server: (fn) => fn });
          export const getStartOptions = () => ({});
          export const createServerFn = (...args) => {
            const fn = args[args.length - 1];
            if (typeof fn === 'function') return fn;
            return () => {};
          };
          export const createMiddleware = () => ({ server: () => ({}) });
          export const registerGlobalMiddleware = () => {};
          export const json = (d) => d;
          export const redirect = () => {};
          export const notFound = () => {};
          export const createStartHandler = () => () => {};
          export const defaultStreamHandler = () => {};
        `;
      }
    },
  };
}

export default defineConfig({
  plugins: [tanstackStartStub(), react(), tsconfigPaths(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "UNRESOLVED_IMPORT" && warning.exporter?.includes("start-server"))
          return;
        warn(warning);
      },
    },
  },
});
