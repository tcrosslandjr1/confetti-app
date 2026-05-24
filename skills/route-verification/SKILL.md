---
name: route-verification
description: >
  Ensures every page, route, link, button, and flow is fully wired and functional
  in the Confetti TanStack Router app. Use this skill whenever creating a new page,
  adding a new route, linking navigation, building UI with buttons or CTAs, or any
  time the user says "add a page", "create a route", "link this", "wire up", "make
  sure it works", "audit routes", "check links", "verify flow", or "fix broken pages".
  Also trigger proactively after ANY feature addition or page creation — never ship a
  page without running through this checklist.
---

# Route Verification Skill — Confetti (TanStack Router)

This skill is the definitive checklist for ensuring every page ships complete and
connected. It covers route registration, navigation links, page content, button
functionality, and end-to-end flow verification.

## When to use

Run this checklist:

- After creating any new route file
- After adding navigation links or buttons that go to other pages
- After modifying the route structure
- When the user asks to "audit", "check", or "verify" routes/links/pages
- Proactively before telling the user any feature is "done"

## Architecture context

- **Router**: TanStack Router with file-based routing
- **Route files**: `src/routes/*.tsx` — auto-registered in `src/routeTree.gen.ts`
- **Hosting**: Lovable (SPA with service worker fallback for direct URL access)
- **Service worker**: `public/sw.js` intercepts 404 navigation responses and serves cached `index.html`
- **SPA redirect**: `public/404.html` + `index.html` recovery script for first-visit deep links
- **Link component**: Always use `<Link>` from `@tanstack/react-router`, never raw `<a href>` for internal routes

## Checklist

### 1. Route file exists and exports correctly

For every page that should exist:

```
src/routes/{name}.tsx          — standard route
src/routes/{name}.lazy.tsx     — lazy-loaded route (optional, for code splitting)
src/routes/{parent}.{child}.tsx — nested route (dot = slash in URL)
src/routes/{name}.$param.tsx   — dynamic parameter route
src/routes/$.tsx               — splat/catch-all route
```

Each route file MUST export a `Route` using `createFileRoute`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-page")({
  component: MyPageComponent,
});
```

### 2. Route is registered in routeTree

After creating/modifying a route file, verify `src/routeTree.gen.ts` includes the
new route. If running the dev server, TanStack Router auto-generates this. If not,
run `npx vite dev` briefly or check the file manually.

### 3. Navigation uses Link component (never raw anchors)

Every internal navigation MUST use:

```tsx
import { Link } from "@tanstack/react-router";

// Static route
<Link to="/about">About</Link>

// Dynamic route — ALWAYS include params
<Link to="/venue/$id" params={{ id: venueId }}>View Venue</Link>

// With search params
<Link to="/events" search={{ category: "music" }}>Music Events</Link>
```

NEVER use `<a href="/internal-path">` for internal routes. This causes full page
reloads and breaks the SPA experience. The ONLY acceptable use of `<a>` is for:
- External URLs (`https://...`)
- `mailto:` links
- `tel:` links
- Download links

To find violations, grep: `href="/[a-z]` in `src/**/*.tsx`

### 4. Dynamic routes have params prop

Every `<Link>` to a route containing `$param` MUST include the `params` prop:

```tsx
// CORRECT
<Link to="/venue/$id" params={{ id: venue.id }}>

// BROKEN — navigates to literal "/venue/$id"
<Link to="/venue/$id">
```

### 5. Page component has real content

Every route component must render meaningful content — never an empty div or
placeholder text. At minimum:

- A visible heading or title
- Content that explains the page purpose
- Proper navigation back (breadcrumb, back button, or nav bar)
- Loading and error states where data is fetched

### 6. Buttons and CTAs are functional

Every button, CTA, or interactive element must have:

- An `onClick` handler OR a wrapping `<Link>` — never a dead button
- Visual feedback (hover state, active state)
- Appropriate loading states during async operations
- Error handling with user-visible feedback (toast, inline error)

To find dead buttons: grep for `onClick={.*undefined}` or buttons without handlers.

### 7. Service worker handles new routes

The service worker (`public/sw.js`) automatically handles all routes by serving
cached `index.html` for any 404 navigation response. No per-route changes needed.

If modifying the SW, ensure:
- Navigation requests that return non-200 serve cached `/` (index.html)
- Cache name is bumped when changing SW logic
- `skipWaiting()` is called in the install handler

### 8. End-to-end verification (CRITICAL)

This is the most important step. Do NOT skip it. Do NOT just check that DOM
elements exist — actually NAVIGATE to each destination.

For every link on the page:

1. Click the link / navigate to the URL
2. Verify the destination page RENDERS (not a blank screen, not a 404)
3. Verify the URL in the address bar matches the expected route
4. Verify the page content is correct and complete
5. Verify the back button returns to the previous page
6. Test direct URL access (typing the URL) — not just clicking links

For buttons:
1. Click the button
2. Verify the expected action occurs (navigation, modal, toast, API call)
3. Check console for errors after clicking

### 9. Footer and global navigation consistency

Ensure all site-wide navigation (header, footer, sidebar, bottom tabs) links
are present and working on every page. Check:

- Main nav tabs link to correct routes
- Footer links use `<Link>` not `<a>`
- Logo links back to `/` or `/app`

## Common mistakes to catch

1. **Missing params on dynamic routes** — causes literal `$id` in URL
2. **Raw `<a href>` for internal links** — causes full reload, breaks on hosting
3. **Empty page components** — route exists but renders nothing useful
4. **Dead buttons** — onClick handler is undefined or missing
5. **Inconsistent back navigation** — no way to return to previous page
6. **Missing loading/error states** — blank screen while data loads
7. **Route file exists but not in routeTree** — dev server wasn't running during creation

## Verification command (grep-based quick scan)

Run these to find common issues:

```bash
# Find raw anchor tags to internal routes
grep -rn 'href="/[a-z]' src/ --include="*.tsx" | grep -v node_modules

# Find Link components missing params for dynamic routes
grep -rn 'to="/.*\$' src/ --include="*.tsx" | grep -v 'params'

# Find buttons without onClick
grep -rn '<button' src/ --include="*.tsx" | grep -v 'onClick\|type="submit"'
```
