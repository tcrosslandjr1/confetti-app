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
      if (id.includes("@tanstack/start"))
        return `\0stub-tanstack-pkg-${id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (id.includes("@tanstack/react-start"))
        return `\0stub-tanstack-pkg-${id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (id.includes("@tanstack/server-fn")) return "\0stub-server-fn";
    },
    load(id) {
      if (id.startsWith("\0stub-")) {
        const noop = "() => {}";
        const noopObj = "() => ({})";
        return `
          const handler = { get: (t, p) => typeof p === "string" ? (() => {}) : undefined };
          const _p = new Proxy({}, handler);
          export default _p;
          export const serverFnFetcher = ${noop};
          export const manifest = {};
          export const scripts = [];
          export const AsyncLocalStorage = class {};
          export const createHash = () => ({update: () => ({digest: () => ""})});
          export const randomBytes = () => "";
          export const createHmac = () => ({update: () => ({digest: () => ""})});
          export const Readable = class { pipe() { return this; } on() { return this; } };
          export const Writable = class { write() {} end() {} on() { return this; } };
          export const Transform = class { pipe() { return this; } on() { return this; } };
          export const Duplex = class { pipe() { return this; } on() { return this; } };
          export const PassThrough = class { pipe() { return this; } on() { return this; } };
          export const pipeline = ${noop};
          export const finished = ${noop};
          export const ReadableStream = class {};
          export const WritableStream = class {};
          export const TransformStream = class {};
          export const getStartContext = ${noopObj};
          export const createIsomorphicFn = () => ({ client: (fn) => fn, server: (fn) => fn });
          export const getStartOptions = ${noopObj};
          export const createServerFn = (...args) => {
            const fn = args[args.length - 1];
            if (typeof fn === "function") return fn;
            return ${noop};
          };
          export const createMiddleware = () => ({ server: () => ({}) });
          export const registerGlobalMiddleware = ${noop};
          export const json = (d) => d;
          export const redirect = ${noop};
          export const notFound = ${noop};
          export const createStartHandler = () => ${noop};
          export const defaultStreamHandler = ${noop};
          export const getRequest = () => new Request("http://localhost");
          export const getResponse = () => new Response();
          export const setResponse = ${noop};
          export const getHeaders = ${noopObj};
          export const parseCookies = ${noopObj};
          export const setCookie = ${noop};
          export const getCookie = () => "";
          export const deleteCookie = ${noop};
          export const useServerFn = (fn) => fn;
          export const getRequestHost = () => "localhost";
          export const getRequestProtocol = () => "https";
          export const getRequestURL = () => new URL("http://localhost");
          export const getRequestPath = () => "/";
          export const getRequestIP = () => "127.0.0.1";
          export const getWebRequest = () => new Request("http://localhost");
          export const getEvent = ${noopObj};
          export const getResponseHeaders = ${noopObj};
          export const setResponseHeader = ${noop};
          export const setResponseStatus = ${noop};
          export const sendRedirect = ${noop};
          export const sendError = ${noop};
          export const sendStream = ${noop};
          export const sendWebResponse = ${noop};
          export const isPrerendering = () => false;
          export const getRouterManifest = ${noopObj};
          export const createRouter = ${noopObj};
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
