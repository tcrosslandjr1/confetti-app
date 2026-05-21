# Confetti App — Loading Fix Instructions

## Root Cause
Your `vercel.json` has **no SPA rewrite rule**. Without it, Vercel returns a 404 for every route except `/`. When someone visits `/home`, `/auth`, `/create-confetti`, etc. directly (or refreshes the page), Vercel doesn't know to serve `index.html` and let React Router handle the route — so the app shows a blank screen or loading spinner forever.

---

## Fix #1 — vercel.json (CRITICAL)

Replace your current `vercel.json` with the one in this folder. The only change is adding this block at the top:

```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

This tells Vercel: "For any URL path, serve index.html and let the client-side router figure it out."

### How to apply in Lovable:
Open `vercel.json` and add the `"rewrites"` block right after the `"$schema"` line, before `"headers"`.

---

## Fix #2 — App.tsx catch-all route (RECOMMENDED)

In `App.tsx`, find the last `<RouterRoute>` line (the `/community/share` one) and add this right before `</Routes>`:

```tsx
<RouterRoute path="*" element={<Navigate to="/home" replace />} />
```

This catches any undefined URL and redirects to `/home` instead of showing a blank screen.

---

## Fix #3 — Stale branding in AuthCallbackPage (MINOR)

In `App.tsx`, the `AuthCallbackPage` component still says "Opening Loop..." — change it to "Opening Confetti..."

---

## After applying:
1. Commit and push to `main`
2. Wait for Vercel to redeploy (usually ~60 seconds)
3. Test by visiting your app URL + `/home` directly — it should load instead of 404ing
4. Test refreshing the page on any route — should stay on that route
