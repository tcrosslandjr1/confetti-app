# Full System Audit — Confetti App

## What This Skill Does
Performs a complete, end-to-end audit of the Confetti app codebase. Finds every broken thing before touching a single line of code. Returns a prioritized issue report with root causes, file paths, and line numbers. No partial findings. No assumptions. No skipped steps.

## When To Use
- Before any major fix session
- After a new feature is added
- When the user reports something "feels broken"
- After any auth/routing/data architecture change
- Periodically as a health check

---

## Audit Checklist

### 1. ROUTING / NAVIGATION
- Read `src/routeTree.gen.ts` — enumerate every valid route
- Search every `navigate({ to: ... })` and `<Link to="...">` across all `.tsx` files
- Cross-reference: does every navigation target exist as a real route?
- Flag: routes that exist but nothing navigates to them (orphaned)
- Flag: navigation targets that have no matching route file (dead links)

### 2. BUTTON / HANDLER AUDIT
- Find every `<button>`, `<span onClick>`, `<div onClick>` in all route files
- For each one: does `onClick` exist? Does it call a real function or `() => {}`?
- Flag: buttons with no `onClick` at all
- Flag: buttons with `onClick={() => {}}` or stub handlers
- Flag: buttons labelled with an action but no implementation behind them

### 3. AUTH FLOW
- Read `src/hooks/useNewAuth.ts` — how does it detect auth state?
- Read `src/routes/new.signup.tsx` and `new.signin.tsx` — is `emailRedirectTo` dynamic (`window.location.origin`) or hardcoded?
- Read `src/integrations/supabase/auth-middleware.ts` — does it use `getUser(token)` correctly or a non-standard API?
- Check Supabase Site URL and redirect allow list (should be production URL, not localhost)
- After magic link: does session get picked up? Does it navigate to the correct post-auth route?

### 4. DATA — HARDCODED VS REAL
- For every screen, identify: is the displayed data from a live source (Supabase, edge function, store) or a hardcoded static array?
- Check `getActiveLoop()` usage — screens that SHOULD read the active plan but don't
- Check `useAuth()` / `useNewAuth()` — screens that have user data available but display placeholder names
- Flag every `const DATA = [{ ... }]` static array that should be dynamic

### 5. API / SERVER ROUTES
- List every `fetch("/api/...")` call in the codebase
- Check `vite.config.ts` — are server routes stubbed out in the SPA build?
- Check `vercel.json` — is this an SPA (all routes → index.html) or SSR?
- If SPA: every `fetch("/api/...")` will get `index.html` back — critical bug
- Check each `src/routes/api/*.ts` file — are these TanStack Start server handlers? Are they reaching production?

### 6. ENVIRONMENT VARIABLES
- Read `.env`, `.env.local`, `.env.production`
- Find every `import.meta.env.VITE_*` and `process.env.*` used in the codebase
- Cross-reference: is every used var present in at least one env file?
- Flag: any var that throws or has no fallback if missing
- Flag: `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, or other secrets that must be in Vercel dashboard

### 7. STORE / STATE PIPELINE
- Trace the full plan pipeline: `generateAiPlan()` → `setActiveLoop()` → `getActiveLoop()` → display
- Does `new.pass.tsx` actually read from `getActiveLoop()`?
- Does `new.finished.tsx` actually read from `getActiveLoop()`?
- Does `new.night.tsx` read the active loop or show hardcoded data?
- Does the hub "tonight" ticket conditionally render based on `getActiveLoop() !== null`?

### 8. ERROR STATES
- Every `try/catch` block — does the catch set visible error state, or silently swallow?
- Every `fetch()` — is a non-2xx response handled or ignored?
- Every loading state — can it get stuck? Is there a timeout or error fallback?

### 9. FORM FLOWS
- Every `<form>` or "submit" button — is there an actual API call behind it?
- `new.forgot-pw.tsx` — does it call `resetPasswordForEmail()`?
- `new.email-verify.tsx` — does it actually verify OTP before proceeding?
- `new.signup.tsx` — does it call `signInWithOtp()` with the right redirect?

### 10. DYNAMIC VALUES THAT SHOULD NOT BE HARDCODED
- User name: should come from `user.user_metadata.display_name` or email
- Day of week: should come from `new Date().toLocaleDateString(…, { weekday: 'long' })`
- Pass codes: should be generated or stored, not `"#A7K2"`
- Stop counts, prices, dates: must come from the active loop
- Avatar initials: must come from authenticated user

---

## Output Format

For each issue found:
```
FILE: src/routes/new.xxx.tsx
LINE: [approximate line number]
SEVERITY: critical | high | medium | low
ISSUE: [one sentence description of what is broken]
ROOT CAUSE: [why it's broken — what was missing, wrong, or never implemented]
```

Severity definitions:
- **critical** — app crashes, auth broken, AI/API never works, data pipeline broken end-to-end
- **high** — visible screen with dead buttons, hardcoded data shown as real, missing navigation
- **medium** — wrong behavior in edge case, misleading UX, fragile implementation
- **low** — cosmetic, placeholder text, minor UX confusion

---

## Rules
1. Read every file — do not guess from file names alone
2. Do not mark something as fine without checking the actual code
3. Do not mark something as broken without reading the actual code
4. Report ALL issues, not just the first one found
5. If a fix is needed that affects multiple files, list all affected files
6. Do not say "likely" — verify

---

## Known System Architecture (Confetti)
- React SPA deployed on Vercel at `ai-lifestyle-concierge.vercel.app`
- TanStack Router with file-based routing in `src/routes/`
- Supabase project: `zfeckvxkulreyapadanf` at `https://zfeckvxkulreyapadanf.supabase.co`
- Auth: magic link via `signInWithOtp()` — `emailRedirectTo` must use `window.location.origin`
- AI chat: `/api/chat` edge route (TanStack Start server handler)
- Plan generation: `src/lib/generate-plan-client.ts` → Supabase edge function
- Active plan state: `src/lib/loop-store.ts` → `setActiveLoop()` / `getActiveLoop()`
- Confetti points: `src/lib/loop-store.ts` → `getConfetti()` / `addConfetti()`
- Design system: `src/components/new-confetti/shell.tsx` → `TOKENS`, `contrastText()`
