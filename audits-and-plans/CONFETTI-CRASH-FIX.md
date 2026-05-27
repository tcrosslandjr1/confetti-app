# confettiplan.lovable.app — Crash Diagnosis & Fix

## Error
`TypeError: Cannot read properties of undefined (reading 'inputValidator')`
at `index-DuFeD9tc.js:236:471`

## Files Causing the Crash
All `src/lib/*.functions.ts` files:
- `src/lib/name-generator.functions.ts`
- `src/lib/trip.functions.ts`
- `src/lib/checkout.functions.ts`
- `src/lib/promoter.functions.ts`
- `src/lib/seed-demo.functions.ts`
- `src/lib/stop-menu.functions.ts`
- `src/lib/translate.functions.ts`

## Root Cause
The app was scaffolded from a TanStack Start template but runs as a plain Vite+React SPA. The TanStack Start Vite plugin (which transforms `.functions.ts` files at build time) was never included. A custom `tanstackStartStub()` in `vite.config.ts` tries to fake the API with a Proxy mock, but the Proxy chain breaks in Rollup's production bundle — `.middleware()` returns `undefined` instead of a chainable object, so `.inputValidator` is called on `undefined`.

The chain expressions execute at module evaluation time (before any React renders), so one crash kills the entire page.

## Fix — 3 Steps

### Step 1: Convert each .functions.ts to plain async functions

Replace the `createServerFn().middleware().inputValidator().handler()` chain with plain async functions that call the `.server.ts` logic directly. Example:

```typescript
// BEFORE (name-generator.functions.ts):
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateOutingNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateNamesInput.parse(d))
  .handler(async ({ data }) => generateNamesInternal(data));

// AFTER:
import { GenerateNamesInput, generateNamesInternal } from "./name-generator.server";
export { GenerateNamesInput };

export async function generateOutingNames(input: unknown) {
  const data = GenerateNamesInput.parse(input);
  return generateNamesInternal(data);
}
```

Repeat for all 7 .functions.ts files.

### Step 2: Clean up vite.config.ts

Remove the entire `tanstackStartStub()` function (~90 lines). Final config:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    outDir: "dist",
    rollupOptions: { input: "index.html" },
  },
  resolve: { alias: { "@": "/src" } },
});
```

### Step 3: Remove TanStack Start from package.json

Remove `@tanstack/react-start`, `@tanstack/start`, and `@tanstack/server-fn` from dependencies if listed. Keep `@tanstack/react-query` (that's unrelated and works fine).

## Authentication Note
The `.middleware([requireSupabaseAuth])` calls provided server-side auth via TanStack Start's middleware system. Since the app now runs client-side, auth should be handled through Supabase's client-side auth (`supabase.auth.getSession()`) in the components that call these functions.
