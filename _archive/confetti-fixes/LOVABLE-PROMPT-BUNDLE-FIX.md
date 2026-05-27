# Paste This Into Lovable

---

## CRITICAL: Fix loading speed — main bundle is 4.1 MB

The app takes forever to load because the entire app is shipped as ONE giant JavaScript file (`index-rP9Rk-Lm.js` — 4,166 kB minified / 1,128 kB gzipped). Users stare at a blank screen for 5-10 seconds on mobile while this downloads and parses. Here's exactly what needs to happen:

---

### 1. Add lazy route loading (CODE SPLITTING)

Every route in `src/routes/` should be lazily loaded so the browser only downloads the code for the page the user is actually visiting. In TanStack Router, this means using `route.lazy()` or the `lazy` property in `createFileRoute`.

For each route file (e.g. `src/routes/auth.tsx`, `src/routes/create.tsx`, `src/routes/viral.tsx`, etc.):
- Split the route into a **route definition file** (keeps the path/loader/search params) and a **lazy component file** (keeps the actual UI component)
- OR use TanStack Router's built-in `lazyFileRoute` / `.lazy.tsx` convention

The `__root.tsx` layout and the index route can stay eagerly loaded — everything else should be lazy.

**Target: initial page load should only download ~200-400 kB of JS, not 4,100 kB.**

---

### 2. Split vendor libraries into separate chunks

In `vite.config.ts`, add `manualChunks` to break up the massive single bundle:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-router': ['@tanstack/react-router'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-motion': ['framer-motion'],
        'vendor-ui': [
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-tooltip',
          '@radix-ui/react-popover',
          '@radix-ui/react-tabs',
        ],
      },
    },
  },
},
```

This means returning users with cached vendor chunks won't re-download them when app code changes.

---

### 3. Stop bundling .server.ts files into the client

The build log shows these server-only files ending up in the browser bundle:
- `src/integrations/supabase/client.server.ts`
- `src/lib/tiktok-token.server.ts`
- `src/lib/require-auth.server.ts`
- `src/lib/outreach-ranking.server.ts`
- `src/lib/venue-media.server.ts` (listed as `venue-media.server-BjN_R_8I.js` in dist/assets)

These files likely use server-only secrets (Supabase service role key, etc.) and should NEVER be in the browser. Either:
- **Guard them** with a Vite `import.meta.env.SSR` check so they tree-shake out of the client build
- **Move their logic** into Supabase Edge Functions (which already exist) so the client just calls an API endpoint
- **Use Vite's `?server` suffix** or exclude them via the Vite config `optimizeDeps.exclude`

At minimum, make sure `client.server.ts` and `require-auth.server.ts` are not imported by any client-side component or route.

---

### 4. Reduce server-fn-shim.ts imports

`src/lib/server-fn-shim.ts` is imported by 70+ files across routes and components. This shim was a workaround to make server functions compile in an SPA context. But it's pulling server-function boilerplate into every single route.

- Audit which files actually NEED the shim vs. which import it unnecessarily
- For client-only components (BoardingPassV3, ChangeMyNight, ConnectionsPanel, ManageSubscriptionPanel, TasteConfirmPrompt, etc.), they should NOT be importing server-fn-shim at all
- If a component needs data that comes from a server function, it should call a Supabase Edge Function or use react-query to fetch from an API route instead of importing the server function directly

---

### 5. Add a loading skeleton to index.html

While the JS loads, users see a blank white screen. Add a lightweight CSS-only loading indicator inside the `<div id="root">` in `index.html`:

```html
<div id="root">
  <div id="app-loader" style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;">
    <div style="text-align:center;color:#fff;font-family:system-ui;">
      <div style="font-size:2rem;margin-bottom:0.5rem;">🎊</div>
      <div style="font-size:1.1rem;font-weight:600;">Confetti</div>
      <div style="margin-top:1rem;width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin:1rem auto 0;"></div>
    </div>
  </div>
  <style>#app-loader{transition:opacity .3s}@keyframes spin{to{transform:rotate(360deg)}}</style>
</div>
```

React will replace the contents of `#root` when it mounts, so this disappears automatically.

---

### Success criteria

After these changes, the Vite build output should show:
- **No single JS chunk over 500 kB** (currently 4,166 kB)
- **No .server.ts files** appearing in `dist/assets/`
- **Multiple route chunks** (one per lazy route) instead of one giant `index-*.js`
- **Initial page load under 3 seconds** on a 4G mobile connection

---

### DO NOT do these things:
- Do NOT switch frameworks or add TanStack Start SSR — keep this as a client-side SPA
- Do NOT remove the vercel.json rewrites — they're working correctly
- Do NOT add manualChunks that conflict with the lazy route splitting — let Vite handle route chunks automatically, only manually chunk the vendor libraries listed above
