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
// Chainable builder for createServerFn / createMiddleware
const _chain = new Proxy(function(){}, {
  get(t, p) {
    if (typeof p === "symbol") return undefined;
    return () => _chain;
  },
  apply() { return undefined; }
});
export const createServerFn = () => _chain;
export const createMiddleware = () => _chain;
export const createIsomorphicFn = () => _chain;
export const getStartContext = ${noopObj};
export const getRequest = ${noopObj};
export const getRequestHost = ${noop};
export const getRequestHeaders = ${noopObj};
export const getRequestUrl = ${noop};
export const getResponseHeaders = ${noopObj};
export const setResponseHeaders = ${noop};
export const setResponseStatus = ${noop};
export const json = (v) => v;
export const redirect = ${noop};
export const createRouter = ${noopObj};
export const createFileRoute = () => () => ({});
export const createRootRouteWithContext = () => () => ({});
export const createRootRoute = ${noopObj};
export const lazyRouteComponent = (fn) => fn;
export const useServerFn = (fn) => fn;
export const mergeHeaders = ${noopObj};
export const StartClient = () => null;
export const DehydrateRouter = () => null;
export const serverOnly = ${noop};
export const clientOnly = (fn) => fn;
// node:crypto stubs
export const createHash = (a) => ({ update: () => ({ digest: () => "" }), digest: () => "" });
export const randomBytes = (n) => new Uint8Array(n);
export const createHmac = (a,b) => ({ update: () => ({ digest: () => "" }), digest: () => "" });
export const timingSafeEqual = () => false;
export const createCipheriv = ${noopObj};
export const createDecipheriv = ${noopObj};
export const pbkdf2 = ${noop};
export const pbkdf2Sync = () => new Uint8Array(32);
export const scrypt = ${noop};
export const scryptSync = () => new Uint8Array(32);
export const sign = ${noop};
export const verify = ${noop};
export const generateKeyPairSync = ${noopObj};
export const createSign = () => ({ update:()=>({sign:()=>""}),sign:()=>"" });
export const createVerify = () => ({ update:()=>({verify:()=>false}),verify:()=>false });
export const webcrypto = { subtle: { digest: async()=>new ArrayBuffer(0), encrypt: async()=>new ArrayBuffer(0), decrypt: async()=>new ArrayBuffer(0), sign: async()=>new ArrayBuffer(0), verify: async()=>false, generateKey: async()=>({}), importKey: async()=>({}), exportKey: async()=>new ArrayBuffer(0), deriveBits: async()=>new ArrayBuffer(0), deriveKey: async()=>({}) }, getRandomValues: (a)=>a };
// node:async_hooks
export class AsyncLocalStorage { getStore(){return undefined} run(s,fn,...a){return fn(...a)} enterWith(){} disable(){} }
export class AsyncResource { constructor(){} runInAsyncScope(fn,...a){return fn(...a)} }
// node:stream stubs
export class Writable { write(){return true} end(){} on(){return this} pipe(){return this} }
export class Readable { read(){return null} on(){return this} pipe(){return this} }
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
