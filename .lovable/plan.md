## Root cause

Vercel's build fails with:

```
[vite]: Rollup failed to resolve import "@radix-ui/react-alert-dialog"
from "/src/components/ui/alert-dialog.tsx"
```

This is a Rollup module-resolution error, not actually a TanStack Start import-protection error (worth correcting in any error-report follow-up). The real cause is a **lockfile/package.json drift**:

- Commit `1e69d93` ("fix: add missing @radix-ui/react-alert-dialog dependency") added the dep to `package.json` only — neither `bun.lock` nor `package-lock.json` was updated.
- Vercel installs with a frozen lockfile, so the package is never written to `node_modules`.
- `src/components/ui/alert-dialog.tsx` then fails to resolve its import, and three routes that depend on it (`admin.roles.tsx`, `admin.users.tsx`, `passport.tsx`) cascade into `TS7006` implicit-any errors.

Reproduced locally: build failed with the same Rollup error; after `bun add @radix-ui/react-alert-dialog@^1.1.6` both lockfiles updated and `vite build` completed cleanly (client + server bundles).

## Plan

1. **Sync lockfiles to match package.json.** Run `bun install` (and `npm install --package-lock-only` if needed) to regenerate `bun.lock` and `package-lock.json` so they pin `@radix-ui/react-alert-dialog@^1.1.6`. No source files change.
2. **Verify locally.** `bunx vite build` must finish without the Rollup resolution error.
3. **Commit the updated lockfiles.** The next Vercel deploy will then install the dep and build successfully.

## Out of scope (separate follow-ups, not blocking the deploy fix)

- `package.json` `build` script still references `vinxi build`, but `vinxi` is not in dependencies. Vercel currently bypasses this via its TanStack Start preset; we should align scripts to `vite build` / `vite preview` to avoid future surprises.
- Pre-existing `TS7006` implicit-any warnings in `admin.roles.tsx`, `admin.users.tsx`, `passport.tsx` are surfaced by the failing import but are independent typing issues to clean up later.
