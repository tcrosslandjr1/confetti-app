import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

function tanstackStartStub(): Plugin {
  return {
    name: "tanstack-start-stub",
    enforce: "pre",
    resolveId(id) {
      if (id.startsWith("#tanstack")) return `\0stub-hash-${id}`;
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
      if (!id.startsWith("\0stub-")) return;
      const noop = "() => {}";
      const noopObj = "() => ({})";
      return `
export const createServerFn = ${noop};
export const createMiddleware = ${noop};
export const registerGlobalMiddleware = ${noop};
export const json = (v) => v;
export const redirect = ${noop};
export const notFound = ${noop};
export const createStartHandler = ${noop};
export const defaultStreamHandler = ${noop};
export const getStartContext = ${noopObj};
export const createIsomorphicFn = ${noop};
export const getStartOptions = ${noopObj};
export const getRequest = ${noopObj};
export const getResponse = ${noopObj};
export const setResponse = ${noop};
export const getHeaders = ${noopObj};
export const parseCookies = ${noopObj};
export const setCookie = ${noop};
export const getCookie = ${noop};
export const deleteCookie = ${noop};
export const useServerFn = (fn) => fn;
export const getRequestHost = () => "localhost";
export const getRequestProtocol = () => "https";
export const getRequestURL = () => new URL("https://localhost");
export const getRequestPath = () => "/";
export const getRequestIP = () => "127.0.0.1";
export const getWebRequest = ${noopObj};
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
export class AsyncLocalStorage { getStore() { return {}; } run(s, fn) { return fn(); } }
export const createHash = () => ({ update: () => ({ digest: () => "" }) });
export const randomBytes = (n) => new Uint8Array(n);
export const createHmac = () => ({ update: () => ({ digest: () => "" }) });
export class Readable { pipe() { return this; } on() { return this; } }
export class Writable { write() {} end() {} on() { return this; } }
export class Transform extends Readable {}
export class Duplex extends Readable {}
export class PassThrough extends Readable {}
export const pipeline = ${noop};
export const finished = ${noop};
export class ReadableStream { getReader() { return { read: async () => ({ done: true }) }; } }
export class WritableStream { getWriter() { return { write: async () => {}, close: async () => {} }; } }
export class TransformStream { constructor() { this.readable = new ReadableStream(); this.writable = new WritableStream(); } }
export const serverFnFetcher = ${noop};
export const manifest = {};
export const scripts = ${noop};
const handler = { get: () => ${noop} };
export default new Proxy(${noopObj}, handler);
`;
    },
  };
}

export default defineConfig({
  plugins: [tanstackStartStub(), react(), tailwindcss(), tsconfigPaths()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
