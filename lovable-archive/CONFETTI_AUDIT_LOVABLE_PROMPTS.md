# CONFETTI APP — FULL AUDIT: LOVABLE-ONLY FIX PROMPTS

> **Date:** 2026-05-24
> **App:** Confetti (confettiplan.lovable.app)
> **Project:** https://lovable.dev/projects/f4bae350-0f3c-459c-a8b3-17702408f503
>
> **HOW TO USE:** Copy-paste each prompt below into the Lovable chat, one at a time. Start from Phase 1 and work down. Each prompt is self-contained. Do NOT skip Phase 1 — everything else depends on it.
>
> **DO NOT** clear/delete items from the Lovable queue.

---

## PHASE 1 — CRITICAL INFRASTRUCTURE (do these FIRST)

These fix the foundation. Without these, 90% of the app is unreachable.

---

### STEP 1-A: Re-publish the deployment (NO code change needed)

```
NOT A LOVABLE PROMPT — this is a manual step.

The published deployment at confettiplan.lovable.app is STALE — it was published
before many routes were added. TanStack Start handles server-side routing
automatically; there is no SPA fallback to configure.

ACTION: In Lovable, click Publish → Update to push the latest build live.

After publishing, verify these URLs load without 404:
- confettiplan.lovable.app/about
- confettiplan.lovable.app/app
- confettiplan.lovable.app/chat
- confettiplan.lovable.app/auth
- confettiplan.lovable.app/events
- confettiplan.lovable.app/business

DO NOT add vercel.json, _redirects, or any SPA fallback files — they are wrong
for this TanStack Start (SSR) stack and Lovable handles routing automatically.
```

---

### PROMPT 1-B: Make the /app shell reachable from the landing page

```
CRITICAL BUG: The main app shell (the view with the bottom navigation bar showing TONIGHT / EXPLORE / PLAN / PASS / REELS) is completely unreachable from the landing page. There is NO working path for a user to get from the landing page into the /app shell.

Current broken paths:
- The "EXPLORE" link in the top nav goes to /about instead of /app/explore
- The "PROFILE" link in the top nav (href="/app/profile") does nothing when clicked — page stays on "/"
- The "Plan my night" CTA opens a wizard modal overlay on the landing page — the URL stays at "/" and the user never enters the /app shell
- The "Chat" footer link (href="/chat") does nothing when clicked
- There is no "TONIGHT" or "APP" link anywhere on the landing page

Fix ALL of these:
1. Change the "EXPLORE" top nav link to navigate to /app/explore (not /about)
2. Fix the "PROFILE" top nav link so clicking it actually navigates to /app/profile
3. Fix the "Chat" footer link so clicking it actually navigates to /chat
4. Add a prominent "Open App" or "TONIGHT" button/link in the top nav that navigates to /app
5. After the plan wizard generates results, navigate the user INTO the /app shell (to /app/plan) instead of showing results in a modal overlay on the landing page

The bottom nav with TONIGHT/EXPLORE/PLAN/PASS/REELS is the core app experience — users MUST be able to reach it.
```

---

### PROMPT 1-C: Fix the catch-all route swallowing valid routes

```
BUG: The catch-all route in src/routes/$.tsx has redirect entries that swallow valid routes and send users to the wrong place. Specifically:

- "/admin" redirects to "/" — this prevents ALL admin routes from working
- "/partner" redirects to "/" — blocks partner features
- "/corporate" redirects to "/" — blocks corporate features
- "/promoter" redirects to "/" — blocks promoter features

Fix: Remove these entries from the REDIRECTS map in $.tsx:
- Remove "/admin": "/"
- Remove "/partner": "/"  
- Remove "/corporate": "/"
- Remove "/promoter": "/"
- Remove "/advertise": "/"

These are real features, not legacy routes. The catch-all should only redirect genuinely deprecated/old routes, not active sections of the app.

Also verify: the catch-all $.tsx should NOT match routes that have their own route files. TanStack Router should prefer specific route files (like chat.tsx, app.tsx) over the catch-all. If the catch-all is intercepting these routes, the route tree registration needs to be fixed.
```

---

### PROMPT 1-D: Fix client-side navigation for /chat and /app/* routes

```
BUG: Several client-side navigation links on the landing page do nothing when clicked — the page stays on "/" with no navigation occurring:

1. The "Chat" link in the footer (href="/chat") — clicking does nothing
2. The "PROFILE" link in the top nav (href="/app/profile") — clicking does nothing

The route files exist (src/routes/chat.tsx has a full AI concierge UI, src/routes/app.profile.tsx exists), but clicking their links from the landing page fails silently.

Likely cause: These routes may not be properly registered in the TanStack Router route tree, OR the catch-all $.tsx route is intercepting them before the specific route files are matched.

Fix:
1. Ensure chat.tsx is properly registered in the route tree (routeTree.gen.ts)
2. Ensure all app.*.tsx routes are properly registered as children of app.tsx
3. Verify that Link components with to="/chat" and to="/app/profile" trigger actual navigation
4. If using <a> tags instead of TanStack <Link> components anywhere, switch to <Link> for client-side nav
5. Test: clicking "Chat" from the landing page should navigate to /chat and show the AI concierge
6. Test: clicking "PROFILE" from the landing page should navigate to /app/profile and show the profile page
```

---

## PHASE 2 — NAVIGATION & ROUTING FIXES

After Phase 1, navigation works. These prompts fix remaining routing issues.

---

### PROMPT 2-A: Fix EVENTS nav link routing

```
BUG: The "EVENTS" link in the top navigation bar routes to /app/explore instead of the actual events page.

Fix: Change the EVENTS nav link to navigate to /events (which loads src/routes/events.index.tsx). The events page exists and works — it shows event cards across categories (Music, Tech, Food, Arts, Wellness, Sports). It's just linked to the wrong destination.

Test: Click EVENTS in the top nav → should load the events page with event category cards, NOT the explore/discover page.
```

---

### PROMPT 2-B: Add top navigation bar to /business pages

```
BUG: The /business page has NO top navigation bar. Once a user navigates to /business, they are trapped — there's no way to get back to the main site except using the browser back button.

Fix: Add the standard top navigation bar (with the Confetti logo, ABOUT, EXPLORE, EVENTS, FOR BUSINESS, PROFILE links) to the /business page and all /business/* child pages (business/claim, business/login, business/dashboard).

The nav bar should be consistent with the one on the landing page and other pages. Include the Confetti logo linking back to "/" on the left.
```

---

### PROMPT 2-C: Add top navigation bar to Profile page

```
BUG: The /app/profile page has NO top navigation bar — it only has the bottom tab nav. This is inconsistent with pages like /about and the landing page which have the top nav.

Fix: When a user is on /app/profile (or any /app/* route), include either:
- The standard top nav bar, OR  
- At minimum, a header with the Confetti logo linking to "/" and a back arrow

This ensures users can always navigate to the main site sections (About, Events, For Business) even when inside the app shell.
```

---

### PROMPT 2-D: Fix browser tab title not updating on navigation

```
BUG: The browser tab title (document.title) doesn't update when navigating between pages. After signing in, the title stays "Sign in — Confetti" even when navigating to /app/plan, /app, /app/profile, etc.

Fix: Each route should set its own page title using TanStack Router's head() function or a useEffect. Correct titles:
- / → "Confetti — Your AI Nightlife Concierge"
- /app → "Tonight — Confetti"
- /app/explore → "Explore — Confetti"
- /app/plan → "Plan — Confetti"
- /app/profile → "Profile — Confetti"
- /app/reels → "Reels — Confetti"
- /chat → "Confetti AI Chat — Confetti"
- /about → "About — Confetti"
- /events → "Events — Confetti"
- /business → "For Business — Confetti"
- /auth → "Sign In — Confetti"

Test: Navigate between 3+ pages and verify the browser tab title changes each time.
```

---

## PHASE 3 — CONTENT & DATA FIXES

These fix misleading, placeholder, or broken content.

---

### PROMPT 3-A: Remove test credentials from the public auth page

```
SECURITY ISSUE: The sign-in page at /auth shows pre-filled test credentials visible to ANY visitor:
- Email field shows: "test-customer@confetti.test"  
- Password field shows: filled dots (pre-filled password)

Fix: Remove ALL pre-filled test credentials from the auth page. The email and password fields should be completely empty when a user visits /auth. Test accounts should never be exposed in the production UI.

If there's a development/debug mode that pre-fills these, ensure it's disabled in production builds.
```

---

### PROMPT 3-B: Fix the reviews section contradiction on venue pages

```
BUG: Venue detail pages show contradictory review data. The header says "4.8 ★ (842 reviews)" but the review body below shows all zeros and "No reviews yet."

Fix: Make the reviews section consistent:
- Option A (preferred): If you have real review data, display it in both the header AND the body
- Option B: If no real reviews exist yet, change the header to show "No reviews yet" instead of fake "4.8 (842 reviews)" numbers

Do NOT show fake inflated numbers in the header while the actual review list is empty. This destroys user trust.
```

---

### PROMPT 3-C: Remove placeholder team members from About page

```
BUG: The About page (/about) shows fake placeholder team members: "Mara Lin", "Devin Ortiz", "Priya Shah", "Theo Walker". These are not real people.

Fix: Either:
- Option A: Remove the team section entirely until real team info is ready
- Option B: Replace with a single founder card for Tyrone (the actual founder) with a real bio
- Option C: Replace the team section with a "We're hiring" or "Join the team" CTA

Do NOT show fake team members on a live public page.
```

---

### PROMPT 3-D: Fix check-in targeting wrong stop

```
BUG: On the boarding pass / active plan view, clicking "Check In" checks the user into Stop 3 instead of Stop 1 (the first/current stop in the itinerary).

Fix: The check-in action should always target the FIRST unchecked stop in the itinerary. If Stop 1 hasn't been checked in yet, tapping "Check In" should mark Stop 1 as checked in (with a timestamp), not Skip ahead to Stop 3.

Logic: Find the first stop where checked_in === false, and check THAT one in.
```

---

### PROMPT 3-E: Fix empty/skeleton states on Explore and Tonight pages

```
BUG: Two pages load with empty or near-empty content:

1. /app (Tonight) — On FIRST load, the feed is completely empty with no venues. Content only appears after navigating away and back.

2. /app/explore — Shows only 1 faint/skeleton venue card (Le Diplomate) with barely visible text. The rest of the page is empty.

Fix:
1. Tonight feed (/app): Ensure venue data loads immediately on first render. Add a loading skeleton/shimmer while data fetches, then show the full venue feed. Never show a blank page.

2. Explore page (/app/explore): Load and display the full grid of discoverable venues. Show at least 6-8 venue cards with full opacity and complete data (name, photo, vibe tags, rating). Add a loading skeleton while data is being fetched.

Both pages should feel like opening Instagram or Yelp — instant content, never a blank screen.
```

---

## PHASE 4 — UX / APP-LIKE FEEL

These make Confetti feel like a native app instead of a website.

---

### PROMPT 4-A: Fix REELS tab black screen

```
BUG: The REELS tab (/app/reels) shows a jarring solid black background with white "No reels yet" text. This clashes completely with Confetti's cream/coral/ink brand.

Fix: Replace the black screen with a branded empty state that matches Confetti's design system:
- Background: bg-cream (#faf9f6)
- Use the Confetti design tokens: border-2 border-ink, shadow-brut, font-display, font-mono
- Show a playful empty state illustration or icon (e.g., a film reel or camera icon in coral)
- Text: "Reels coming soon" in font-display
- Subtext: "Short clips of the best nightlife moments" in font-mono text-ink/60
- Optional: Add a "Get notified" CTA button

The REELS tab should feel like part of Confetti, not a different app.
```

---

### PROMPT 4-B: Fix counter animation text truncation

```
BUG: The "2,847 PLANS BUILT TODAY" counter animation on the landing page truncates the text during the count-up animation. During rendering, you can see "2,847 PLA" cut off before the full text appears.

Fix: Ensure the counter container has enough width to display the full text at all times. Options:
1. Set a min-width on the counter container based on the final text length
2. Use white-space: nowrap on the counter text
3. Pre-render the full text invisibly to reserve the correct width, then animate the number only

The full text "2,847 PLANS BUILT TODAY" should never be truncated or clipped at any point during the animation.
```

---

### PROMPT 4-C: Add page transition animations for app-like feel

```
ENHANCEMENT: The app currently feels like a website because page transitions are instant/jarring with no animation. Native apps have smooth transitions between views.

Add subtle page transition animations throughout the app:
1. When navigating between bottom nav tabs (TONIGHT → EXPLORE → PLAN → PASS → REELS), add a crossfade or slide transition (200-300ms)
2. When opening a venue detail page, slide it up from the bottom (like a modal sheet)
3. When navigating forward (e.g., landing → /app), slide the new page in from the right
4. When navigating back, slide the old page out to the right

Use CSS transitions or Framer Motion. Keep animations snappy (200-350ms max) — they should feel responsive, not slow.

Brand tokens to use: cubic-bezier(0.22, 1, 0.36, 1) for the easing curve (matches the existing reveal-up animation).
```

---

### PROMPT 4-D: Add loading skeletons to all data-dependent pages

```
ENHANCEMENT: Pages that load data (Tonight feed, Explore grid, Events list, Venue details, Profile) show either blank screens or partially rendered content while data loads. This makes the app feel broken and slow.

Add branded loading skeleton/shimmer states to:
1. /app (Tonight) — Show 3-4 skeleton venue cards with shimmer effect while the feed loads
2. /app/explore — Show a grid of 6-8 skeleton cards while venues load
3. /events — Show skeleton event category cards while events load
4. /venue/:id — Show a skeleton layout (hero image placeholder, title bar, info sections) while venue data loads
5. /app/profile — Show skeleton tabs and content areas while profile data loads

Skeleton design:
- Use bg-ink/5 for skeleton shapes with a shimmer gradient animation
- Match the exact layout of the real content (same card sizes, spacing, border-radius)
- Border: border-2 border-ink/10
- Shimmer: a subtle left-to-right gradient sweep animation (1.5s loop)

This makes every page feel instant — users see structure immediately, then content fills in.
```

---

### PROMPT 4-E: Make the plan wizard navigate into the app shell

```
UX ISSUE: When a user clicks "Plan my night — 60 sec" on the landing page, the wizard runs as a modal overlay ON the landing page. After generating plans, the results appear in the same overlay. The URL stays at "/" the entire time. The user never enters the /app shell and never sees the bottom nav tabs.

Fix: After the plan wizard generates results:
1. Navigate the user to /app/plan
2. Display the generated plans inside the /app/plan route (within the app shell, with bottom nav visible)
3. The user should now be INSIDE the app shell and can tap other tabs (TONIGHT, EXPLORE, PASS, REELS)

The wizard modal can still run on the landing page for steps 1-6 (vibe, group size, budget, when), but once plans are generated, transition the user INTO the app. This is the key moment where a visitor becomes an app user.
```

---

## PHASE 4-F — BOARDING PASS FIXES

---

### PROMPT 4-F: Fix "Add to Apple Wallet" and "Add to Google Wallet" buttons

```
BUG: The "Add to Apple Wallet" and "Add to Google Wallet" buttons on the boarding pass page do nothing when tapped. They need to either work or be handled gracefully.

Fix — pick the approach that fits:

OPTION A (full implementation):
1. Apple Wallet: Generate a .pkpass file using the PassKit format. The pass should include:
   - Pass type: eventTicket or boardingPass
   - Header: "Confetti" with the Confetti logo
   - Primary fields: Plan name, date, time
   - Secondary fields: Number of stops, group size
   - Barcode: the same QR code shown on the boarding pass
   - Background color: #1a1a2e (ink)
   - Foreground color: #faf9f6 (cream)
   Trigger download of the .pkpass file on tap.

2. Google Wallet: Use the Google Wallet API (JWT-based) to create a save link. Include the same fields as above. Open the Google Wallet save URL on tap.

OPTION B (if wallet integration isn't ready yet):
1. Replace the buttons with a single "Share boarding pass" button that uses the Web Share API (navigator.share) to share a link to the boarding pass
2. If wallet integration is planned for later, show a toast: "Wallet passes coming soon! Share your pass instead." and offer the share option
3. Do NOT show dead buttons that do nothing — that breaks user trust

Either way, the buttons must DO something when tapped.
```

---

### PROMPT 4-G: Make the boarding pass shareable

```
FEATURE: The boarding pass currently has no way to share it with friends or group members. Users need to be able to send their plan to others.

Add sharing functionality to the boarding pass:

1. Add a "Share" button (if one doesn't already exist or isn't working) that uses the Web Share API:
   - navigator.share({ title: "Confetti Plan: [Plan Name]", text: "Join my night out!", url: shareable_link })
   - Fallback for desktop: copy the shareable link to clipboard with a "Link copied!" toast

2. The shareable link should be a unique URL like /boarding-pass/[plan-id] or /p/[short-code] that:
   - Shows the full boarding pass (plan name, stops, times, map)
   - Works for anyone who opens it (no login required to VIEW)
   - Shows a "Join this plan" or "Save to my passes" CTA for logged-in users
   - Shows a "Sign up to join" CTA for non-logged-in visitors

3. Add a QR code that others can scan to open the same boarding pass link (this may already exist — make sure it encodes the shareable URL, not just random data)

4. Design: Use the existing BrandCard style with a share icon (Lucide: Share2 or ExternalLink). Place it next to the existing action buttons on the boarding pass.
```

---

### PROMPT 4-H: Add group planning / plan with others

```
FEATURE: The boarding pass and planning flow don't support group coordination. Users can't invite friends to join their plan or collaborate on building a night out together.

Add group planning to the boarding pass flow:

1. On the boarding pass, add an "Invite Friends" button that:
   - Opens a share sheet (Web Share API) or copy-link modal
   - Generates an invite link like /p/[code]?invite=true
   - When someone opens the invite link and is logged in, they are added to the plan's group
   - Show group member avatars/initials on the boarding pass (e.g., "T + 3 others")

2. On the boarding pass, show the group roster:
   - Display each member's name/avatar in a horizontal row
   - Show their check-in status per stop (checked in ✓ / not yet)
   - The plan creator is marked as "Host"

3. In the plan wizard (when building a new plan), add an optional step:
   - "Planning solo or with friends?"
   - If "with friends": let the user enter names or send invite links before generating the plan
   - Group size from this step should feed into the plan generation (already captured as group size, just connect it)

4. Notifications (if push isn't set up, use in-app):
   - When someone joins your plan: "[Name] joined your Confetti plan!"
   - When the host checks in at a stop: "[Host] checked in at [Venue]"

Design: Use Confetti brand tokens — border-2 border-ink, shadow-brut, font-display for names, coral accent for the invite CTA.
```

---

### PROMPT 4-I: Generate a boarding pass after every reservation

```
BUG: After a user completes a reservation (the "You're in!" confirmation modal with confirmation code), clicking "DONE" just closes the modal. There is no boarding pass generated for the booking.

Fix: When the user taps "DONE" on the reservation confirmation:

1. Automatically generate a boarding pass for this reservation and save it to the user's PASS tab (/app/pass). The boarding pass should include:
   - Venue name (e.g., "Service Bar")
   - Date and time (e.g., "Tue 26 May at 9:00 PM")
   - Confirmation code (e.g., "CF-9HQCQK")
   - Party size (e.g., "Party of 2")
   - QR code encoding the confirmation code
   - Venue address with a "Get Directions" button
   - Check-in button that activates when the user arrives

2. After tapping "DONE", navigate the user to the PASS tab showing their new boarding pass — don't just close the modal and leave them stranded.

3. Show a toast or bottom sheet: "Your boarding pass is ready!" with a "View Pass" button as a fallback if navigation doesn't happen immediately.

4. The boarding pass should also appear in:
   - The PASS tab in the bottom nav (persistent, accessible anytime)
   - The BOOKINGS tab in the user's profile (/app/profile)

The boarding pass is Confetti's signature feature — every reservation MUST produce one. The flow should be: Book → Confirmation → Boarding Pass ready in PASS tab.
```

---

## PHASE 5 — POLISH & PERFORMANCE

Final optimizations after everything above is fixed.

---

### PROMPT 5-A: Optimize initial page load speed

```
PERFORMANCE: The app feels slow on initial load. Optimize for speed:

1. Add a branded splash/loading screen that shows the Confetti logo with a subtle animation while the app JS bundle loads. This should appear within 200ms of the page request (use inline CSS in index.html, not JS).

2. Lazy-load route components that aren't needed on first paint:
   - The landing page (index.tsx) should load immediately
   - /app/*, /chat, /about, /events, /business, /auth should be lazy-loaded with React.lazy()
   - Some routes already have .lazy.tsx files (about.lazy.tsx, auth.lazy.tsx) — ensure ALL non-landing routes use this pattern

3. Optimize images:
   - Use WebP format for all venue/event images
   - Add width/height attributes to prevent layout shift
   - Lazy-load images below the fold with loading="lazy"

4. Minimize bundle size:
   - Check if all Lucide icons are tree-shaken (import only used icons, not the whole library)
   - Ensure no duplicate dependencies

Target: First Contentful Paint under 1.5 seconds on a 4G connection.
```

---

### PROMPT 5-B: Add pull-to-refresh on mobile for app-like feel

```
ENHANCEMENT: Native apps support pull-to-refresh. Add this to key pages:

1. /app (Tonight feed) — Pull down to refresh the venue feed
2. /app/explore — Pull down to refresh explore venues
3. /events — Pull down to refresh events

Implementation:
- Detect touchstart/touchmove/touchend events
- Show a Confetti-branded refresh indicator (the Sparkles icon spinning, or a confetti burst animation)
- When released past the threshold, reload the page data (not a full page refresh — just refetch the data)
- Use the cream/coral brand colors for the refresh indicator

This small touch makes a huge difference in making the app feel native vs. web.
```

---

### PROMPT 5-C: Add haptic-style micro-interactions

```
ENHANCEMENT: Make taps feel responsive with micro-interactions:

1. All BrandCard components: On tap, scale down slightly (transform: scale(0.97)) for 100ms, then bounce back. This is already partially implemented with the shadow-brut hover states, but needs a tap/active state for mobile.

2. Bottom nav tab icons: When tapping a tab, the icon should do a subtle bounce animation (scale up to 1.1 then back to 1.0 over 200ms).

3. The "Check In" button on boarding pass: When tapped, burst a small confetti particle animation from the button before showing the check-in confirmation.

4. The Send button in chat: On tap, the arrow icon should animate (translate right 4px then back) to give a "sent" feeling.

Use CSS transitions for performance. These should be 100-200ms max — snappy, not sluggish.
```

---

## QUICK REFERENCE: ALL FINDINGS

| # | Finding | Severity | Phase |
|---|---------|----------|-------|
| C | Stale deployment — hit Publish → Update (no code fix) | 🔴 CRITICAL | 1-A |
| 1 | /app shell unreachable from landing page | 🔴 CRITICAL | 1-B |
| 2 | Catch-all $.tsx swallows valid routes (/admin, etc.) | 🔴 HIGH | 1-C |
| 3 | /chat link does nothing (route exists, nav broken) | 🔴 HIGH | 1-D |
| 4 | /app/profile link does nothing from landing page | 🔴 HIGH | 1-D |
| 5 | EXPLORE nav goes to /about instead of /app/explore | 🟡 MEDIUM | 2-A |
| 6 | EVENTS nav goes to /app/explore instead of /events | 🟡 MEDIUM | 2-A |
| 7 | /business has no top nav bar (user is trapped) | 🟡 MEDIUM | 2-B |
| 8 | /app/profile has no top nav bar | 🟡 MEDIUM | 2-C |
| 9 | Browser tab title doesn't update on navigation | 🟡 MEDIUM | 2-D |
| 10 | Test credentials visible on public auth page | 🔴 SECURITY | 3-A |
| 11 | Reviews header vs body contradiction | 🟡 MEDIUM | 3-B |
| 12 | Fake team members on About page | 🟡 MEDIUM | 3-C |
| 13 | Check-in targets wrong stop (Stop 3 not Stop 1) | 🟡 MEDIUM | 3-D |
| 14 | Tonight feed empty on first load | 🟡 MEDIUM | 3-E |
| 15 | Explore page shows 1 skeleton card only | 🟡 MEDIUM | 3-E |
| 16 | REELS tab: jarring black screen | 🟢 LOW | 4-A |
| 17 | Counter text "2,847 PLA" truncation | 🟢 LOW | 4-B |
| 18 | No page transition animations | 🟢 LOW | 4-C |
| 19 | No loading skeletons on data pages | 🟡 MEDIUM | 4-D |
| 20 | Plan wizard stays in modal, never enters /app | 🟡 MEDIUM | 4-E |
| 21 | Apple/Google Wallet buttons do nothing | 🔴 HIGH | 4-F |
| 22 | Boarding pass not shareable | 🟡 MEDIUM | 4-G |
| 23 | No group planning / can't plan with others | 🟡 MEDIUM | 4-H |
| 24 | No boarding pass generated after reservation | 🔴 HIGH | 4-I |

---

*Generated by Confetti deep-dive audit — 2026-05-24*
*Total findings: 23 bugs + 1 critical infrastructure issue*
*Estimated Lovable prompts: 19 (some findings grouped into single prompts)*
