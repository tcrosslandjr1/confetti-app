# Confetti — Lovable Enhancement Prompts

Copy-paste these prompts into Lovable one at a time. **Start from the top** — the first few fix broken things, the rest add design and interactivity. Wait for each prompt to finish before sending the next.

> **IMPORTANT:** Do NOT clear or delete items from the Lovable queue. Send one prompt, let it build, verify, then send the next.

---

## PHASE 1 — FIX BROKEN ROUTES & MISSING PAGES

### Prompt 1: Fix the Catch-All Route Swallowing Valid Pages

```
In src/routes/$.tsx there is a catch-all route that redirects "/admin" to "/" (home). This means no admin page can ever load — the catch-all intercepts it first.

Fix this:
1. Remove the "/admin": "/" entry from the REDIRECTS map in $.tsx
2. Remove "/partner": "/", "/corporate": "/", "/promoter": "/", "/advertise": "/" — we may build those later
3. Make sure the catch-all only fires for truly unknown routes, not routes that have their own files

Do NOT delete any other redirect entries — only the ones I listed above.
```

### Prompt 2: Build the Admin Dashboard

```
Create a real admin dashboard at /admin with a dedicated route file (admin.index.tsx) and an admin layout.

The admin panel should:
- Be protected — only users with role "admin" in the profiles table can access it
- Have a sidebar navigation with these sections: Dashboard (overview), Users, Venues, Events, Claims, Influencers, Analytics, Settings
- The Dashboard overview page should show:
  - KPI cards at the top: Total Users, Total Venues, Pending Claims, Active Events — pull real counts from Supabase
  - A "Recent Activity" feed showing the last 10 signups, venue claims, and event creations
  - Quick action buttons: Approve Claims, Review Flagged Content, Send Announcement

Design requirements:
- Use our brand design system: bg-ink (#1a1a2e) for the sidebar, cream (#faf9f6) for the main content area
- Coral (#ff6b6b) for primary action buttons, gold (#ffd700) for highlight badges
- font-display for headings, font-mono for stats/numbers
- Add Framer Motion fade-in animations on page load for the KPI cards (stagger 0.1s each)
- Sidebar items should have a hover state with a subtle coral left border
- Mobile responsive: sidebar collapses to a hamburger menu on small screens

Keep the existing admin.login.tsx redirect — it correctly sends unauthenticated users to /auth.
```

### Prompt 3: Build Admin Sub-Pages (Users, Venues, Claims)

```
Add these three admin sub-pages under the admin layout created in the previous prompt:

1. /admin/users (admin.users.tsx):
   - Searchable table of all users from the profiles table
   - Columns: Avatar (initial circle), Name, Email, Role (badge), Joined date, Status
   - Role badges: admin = coral, business = gold, customer = cream with ink border, influencer = purple
   - Click a row to see user detail in a slide-out drawer (Sheet component)
   - Action buttons in drawer: Change Role (dropdown), Suspend, Delete

2. /admin/venues (admin.venues.tsx):
   - Grid of venue cards showing: hero image, name, category, city, claim status badge, boost level
   - Filter bar: category dropdown, city dropdown, claimed/unclaimed toggle
   - Click a card to see full venue detail in a modal with edit capability

3. /admin/claims (admin.claims.tsx):
   - List of pending venue claims from the venue_claims table
   - Each claim card shows: business owner name, venue name, verification method (Instagram/TikTok), submitted date
   - Two action buttons per claim: Approve (coral) and Reject (with reason input)
   - Approved claims should update the venue's claimed_by field

Design: Match the admin dashboard style — ink sidebar, cream content, coral/gold accents, Framer Motion animations, shadow-brut card style.
```

---

## PHASE 2 — ENHANCE BUSINESS PAGES

### Prompt 4: Upgrade Business Landing Page (/business)

```
Enhance the business landing page at src/routes/business.index.tsx. It currently has a basic hero and 3 feature cards. Make it a premium, conversion-focused landing page:

1. Hero section:
   - Add a subtle animated gradient background that slowly shifts between ink, deep purple, and dark coral
   - Add floating venue card mockups (3 cards at slight angles with parallax on scroll) showing example analytics, reviews, and boost badges
   - The headline "List your venue. Own the night." should have a gradient text effect (cream to gold)
   - Add a trust strip below the CTAs: "Join 500+ venues in 40+ cities" with a row of small city icons

2. Features section — expand from 3 to 6 cards in a 2x3 grid:
   - Claim & Verify (existing)
   - Control Your Story (existing)
   - Boost Your Reach (existing)
   - NEW: "AI-Powered Insights" — real-time analytics on foot traffic, booking trends, and customer demographics
   - NEW: "Pre-Order Revenue" — let customers place food/drink orders before arriving
   - NEW: "Event Management" — create and promote events directly from your dashboard
   - Each card should have a Lucide icon, title, description, and a subtle hover animation (scale 1.02 with shadow increase)
   - Cards should stagger-animate in on scroll using Framer Motion

3. Social proof section (new):
   - Horizontal scrolling row of testimonial cards with venue owner quotes
   - Use placeholder data: venue name, owner name, quote, star rating
   - Cards should have the cream background with ink text, shadow-brut border style

4. Final CTA section:
   - Full-width coral gradient background
   - "Ready to own the night?" headline
   - Two buttons: "Get Started Free" (white) and "Schedule a Demo" (outline white)

5. Add SiteHeader and SiteFooter for consistent navigation.
```

### Prompt 5: Upgrade Business Dashboard

```
Enhance the business dashboard at src/routes/business.dashboard.tsx. The foundation is solid but needs more interactivity and polish:

1. KPI Cards Enhancement:
   - Add mini sparkline charts inside each KPI card showing the last 7 days trend
   - Add percentage change badges (green up arrow or red down arrow with "+12%" style text)
   - Cards should have a subtle glassmorphism effect: backdrop-blur, semi-transparent white background, thin white border
   - On hover, cards should glow with a faint coral shadow

2. Analytics Section — replace the basic bar charts:
   - Add a proper interactive line chart for "Views Over Time" (last 30 days) using a simple SVG-based chart or Recharts
   - Add a donut chart for "Traffic Sources" (Direct, Confetti Search, Social, Referral)
   - Add a horizontal bar chart for "Top Performing Content"
   - Use brand colors: coral for primary data, gold for secondary, cream for backgrounds

3. Events Section Enhancement:
   - Replace hardcoded events with real data from Supabase events table filtered by venue
   - Add a "Create Event" button that opens a modal with: Event name, date/time pickers, description textarea, cover image upload, capacity input
   - Event cards should show: cover image, title, date, RSVP count badge, status indicator (upcoming/live/past)

4. Quick Actions — make them functional:
   - Remove the disabled state on all buttons
   - "Add Event" → opens the create event modal
   - "Upload Photos" → opens a file picker that uploads to Supabase storage
   - "Edit Venue" → navigates to a venue edit form
   - "Analytics" → scrolls to the analytics section
   - "Promote" → opens the promotion panel

5. Add a notification bell in the top bar that shows pending booking requests and new reviews.

6. Animations:
   - Page load: KPI cards slide up with staggered delay (Framer Motion)
   - Section transitions: fade in as user scrolls
   - Button interactions: scale-95 on press, scale-100 on release with spring animation
```

### Prompt 6: Build Business Venue Edit Page

```
Create a venue editing page at /business/edit (business.edit.tsx) that business owners reach from the dashboard "Edit Venue" button.

The page should have a tabbed form layout with these tabs:

1. "Details" tab:
   - Venue name input, category dropdown (bar, club, lounge, restaurant, rooftop, live-music), description textarea (max 500 chars with counter)
   - Address fields: street, city, state, zip
   - Operating hours: 7 rows (Mon-Sun) with open/close time pickers and a "Closed" toggle per day
   - Price level selector: $ / $$ / $$$ / $$$$ as clickable chips

2. "Media" tab:
   - Hero image uploader with preview (drag-and-drop zone with dashed border, camera icon, "Drop your best shot here" text)
   - Gallery grid: up to 8 additional photos, drag to reorder, click X to remove
   - Upload to Supabase storage bucket "venue-media"

3. "Vibe & Tags" tab:
   - Vibe selector: grid of vibe pills (Intimate, High Energy, Rooftop, Live Music, Chill, Upscale, Dive, Speakeasy, etc.)
   - Multiple selection allowed, selected pills get coral background
   - Custom tags input with autocomplete

4. "Social" tab:
   - Instagram handle input with @ prefix
   - TikTok handle input with @ prefix
   - Website URL input
   - "Connect" buttons that verify handles exist

Design: Use the brand design system throughout. Each tab should animate content in with a slide-left transition. Form inputs should use the shadcn Input/Textarea/Select components styled with border-2 border-ink rounded-xl. Save button should be sticky at the bottom with a shine-sweep animation.

Pull existing venue data from Supabase on load and save changes with a useMutation hook.
```

---

## PHASE 3 — ENHANCE CUSTOMER-FACING PAGES

### Prompt 7: Upgrade the Explore Page

```
Enhance the Explore page at src/routes/app.explore.tsx. Currently it has a search bar, category pills, and a basic venue list. Make it premium:

1. Search bar upgrade:
   - Add a glassmorphism effect to the search input: backdrop-blur-lg, bg-white/70, border border-white/30
   - Add search-as-you-type with 300ms debounce (already has this, just verify)
   - Add a "Popular searches" dropdown that appears when the input is focused but empty, showing trending venue names

2. Category pills upgrade:
   - Add small icons to each category pill (Lucide: Sunset for Rooftops, Wine for Lounges, Beer for Bars, Music for Clubs, UtensilsCrossed for Dining, Mic2 for Live Music)
   - Active pill should have coral background with white text and a subtle bounce animation on selection
   - Inactive pills should have a cream background with ink text and ink border

3. Venue cards upgrade:
   - Make cards larger with a 16:9 hero image ratio
   - Add a gradient overlay on the image (transparent to ink at bottom)
   - Overlay the venue name, category badge, and neighborhood on the image
   - Add a "Vibe" row: small colored dots or tags showing the venue's vibe (pull from Supabase vibe_tags column if available)
   - Add a heart/save icon button in the top-right corner of each card (toggle with animation: scale pop + fill transition)
   - Add a distance badge in the top-left if user's location is available
   - Cards should have rounded-2xl corners, shadow-brut-lg border style
   - On press, cards should scale to 0.97 then back to 1 (spring animation)

4. Map view (currently shows placeholder):
   - Replace "coming online" placeholder with an actual map using a static map image or embedded map
   - Or, if a real map is too complex, make the placeholder more polished: add a dashed-border animation, a pulsing map pin icon, and text "Interactive map launching soon — stay tuned"

5. Empty state:
   - If no venues match the search/filter, show a fun illustration state: sparkles icon, "Nothing here... yet" heading, "Try a different vibe or explore a new city" subtext

6. Add pull-to-refresh on mobile.
```

### Prompt 8: Upgrade the Reels Page

```
Enhance the Reels page at src/routes/app.reels.tsx. Currently it's a basic TikTok-style vertical scroll but needs more life:

1. Video playback:
   - If a reel has a video_url, auto-play the video when it's in the viewport (use IntersectionObserver)
   - Pause video when scrolled away
   - Tap to pause/play toggle
   - If no video_url, show the thumbnail with a subtle Ken Burns zoom animation (slow scale from 1 to 1.1 over 8 seconds)

2. Action buttons (right side):
   - Heart: animate on tap — scale up to 1.3, turn coral, pulse once, then settle at 1.0. Show like count below
   - Bookmark: toggle between outline and filled, gold color when active
   - Share: open native share sheet (navigator.share) or copy link with toast confirmation
   - Comment: show comment count, tap to open a bottom sheet with comments (placeholder for now)
   - Add a "Sound" button (volume icon) to toggle audio

3. Bottom overlay:
   - Venue pill should have a glassmorphism effect and navigate to /venue/$id on tap
   - Add creator handle (@username) with a small avatar circle
   - Caption should truncate at 2 lines with "...more" tap to expand

4. Empty state:
   - If no reels exist, show a camera icon with "No reels yet — check back soon" in white text on the black background
   - Add a subtle floating confetti animation in the background of the empty state

5. Swipe indicator:
   - On the first reel, show a subtle "Swipe up" text with an animated chevron that fades out after 3 seconds

6. Double-tap to like:
   - Double-tapping anywhere on the reel should trigger a large heart animation in the center (like Instagram) that scales up, pauses, then fades out
```

### Prompt 9: Upgrade the Profile Page Styling

```
The profile page at src/routes/app.profile.tsx is already feature-rich but needs visual polish. Enhance the styling:

1. Hero card:
   - Add a subtle parallax scroll effect — the coral/gold glow orbs should move at 0.5x scroll speed
   - Avatar should have a pulsing ring animation in gold when the user levels up
   - XP progress bar should have an animated fill with a shimmer sweep effect (like a loading bar that sparkles)
   - Level badge should have a subtle float animation (gentle up-down)

2. Stat cards:
   - Add micro-interactions: numbers should count up from 0 to their value when the cards enter the viewport (use a number counter animation over 1 second)
   - Cards should have a glassmorphism effect matching the brand

3. Tab navigation:
   - Active tab should have a coral underline that slides smoothly to the selected tab (animated indicator)
   - Add subtle haptic feedback visual cue on tab change (0.97 scale press then spring back)

4. Bookings tab:
   - Status badges should be color-coded: confirmed = green, pending = gold, cancelled = red/muted
   - Add a timeline-style layout for bookings: vertical line on the left with dot markers, date headers

5. Passport tab:
   - Achievements should look like real badge collectibles — circular icons with a metallic gold/silver/bronze ring
   - Locked achievements should be grayed out with a lock icon overlay
   - Unlocked achievements should have a brief sparkle animation when first viewed

6. Wallet tab:
   - Referral code should be in a prominent card with a "Copy" button that has a satisfying checkmark animation on copy
   - Stats grid should have the count-up number animation

7. Settings tab:
   - Use cleaner spacing and group items with subtle dividers
   - Sign out button should be at the very bottom, red text, with a confirmation dialog before signing out

Apply Framer Motion for all section transitions (fade + slide up on tab change).
```

### Prompt 10: Upgrade the Events Browse Page

```
Enhance the events page at src/routes/events.index.tsx. Currently it uses generic Tailwind instead of the brand design system. Fix that and add interactivity:

1. Apply brand design system:
   - Switch from generic shadcn styling to the Confetti brand tokens: bg-cream, text-ink, font-display for headings, font-mono for dates/numbers
   - Event cards should use shadow-brut, border-2 border-ink, rounded-2xl
   - Category filter pills should match the Explore page style (coral active, cream inactive, with icons)

2. Hero section:
   - Add a subtle gradient background (cream to warm peach)
   - Headline "What's happening tonight" with gradient text (ink to coral)
   - Add animated text that rotates through cities: "in DC", "in Miami", "in New York" with a typewriter or fade transition

3. Event cards upgrade:
   - Larger cards with full-width cover image at top (16:9 ratio)
   - Gradient overlay on image
   - Event title, date/time, venue name (linked to /venue/$id), and category badge on the card
   - "RSVP" or "Get Tickets" CTA button on each card (coral, rounded-full)
   - Distance badge if user location is available
   - Add a "Happening Now" red pulse dot badge for events currently in progress

4. Connect to real Supabase data:
   - Replace the static EVENTS/CITIES/CATEGORIES imports from @/lib/events with real Supabase queries on the events table
   - Add pagination: "Load more" button or infinite scroll

5. Add a "Featured Events" carousel at the top (horizontal scroll, larger cards) for promoted/highlighted events.

6. Empty state: sparkles icon + "No events in your area yet — want us to notify you?" with an email signup input.
```

### Prompt 11: Upgrade the Trips Page

```
Enhance the trips page at src/routes/trips.index.tsx. Currently it's a basic list with standard Tailwind. Make it premium:

1. Apply brand design system:
   - bg-cream background, font-display for headings, shadow-brut card style
   - Replace the plain 2-column grid with a stacked card layout (single column, full-width cards on mobile)

2. Trip cards redesign:
   - Each card should look like a mini boarding pass (matching the Confetti brand identity):
     - Top section: trip title in font-display, city with MapPin icon, date
     - Middle: dotted line divider with a small airplane or party popper icon
     - Bottom: cost badge, number of stops, "View Pass" button
   - Cards should have a slight rotation (alternating 1deg/-1deg) for a playful scattered look
   - On hover/tap, card straightens to 0deg and lifts with increased shadow

3. "Plan a new night" CTA:
   - Make it a prominent card at the top with a gradient background (ink to coral)
   - Sparkles icon, "Plan your next night out" text, arrow button
   - Subtle pulse animation on the button

4. Empty state upgrade:
   - Fun illustration: party popper icon with confetti particles (CSS-only animation)
   - "Your story starts here" heading
   - "Plan your first night and we'll save it as a keepsake" subtext
   - Big coral "Plan a Night" CTA button with shine-sweep animation

5. Pull-to-refresh animation: show the Confetti logo spinning during refresh.

6. Add Framer Motion stagger animations on the trip cards (slide up with 0.1s delay between each).
```

---

## PHASE 4 — ENHANCE INFLUENCER & AUTH PAGES

### Prompt 12: Upgrade the Influencer Page

```
Enhance the influencer page at src/routes/influencer.lazy.tsx. It's clean but static. Add movement and personality:

1. Hero section:
   - Add an animated gradient background that shifts between ink, deep purple, and dark coral
   - "Now accepting applications" pill should have a subtle pulse animation (glow effect)
   - Headline should have gradient text (cream to gold)
   - Add floating social media icons (TikTok, Instagram) that gently bob up and down with staggered timing
   - Below the CTA, add a row of small creator avatars (circular placeholder images) with "+200 creators" text — social proof

2. "How it works" steps:
   - Replace the basic grid with a connected timeline layout: horizontal on desktop, vertical on mobile
   - Each step should have a numbered circle (1, 2, 3) connected by an animated dashed line that draws itself on scroll
   - Icons should be in coral circles with a white icon
   - Steps should animate in from the left with Framer Motion as user scrolls to them

3. Compensation tiers:
   - Redesign as premium tier cards with distinct visual hierarchy:
     - Explorer: cream card with ink border
     - Tastemaker: ink card with gold border and a "Popular" badge
     - Icon: gradient card (ink to deep purple) with gold border and sparkle effects
   - Each tier card should have: tier name, follower range, perks list with checkmark icons, "Apply" button
   - Cards should have a hover state: slight lift + glow in their accent color
   - The middle card (Tastemaker) should be slightly larger to indicate it's the recommended tier

4. Add a FAQ section at the bottom with an accordion (3-4 questions about the program).

5. Add a "Featured Creators" section with a horizontal scroll of creator cards (placeholder data: avatar, name, follower count, city).

6. Footer CTA: full-width gradient section with "Ready to create?" headline and prominent apply button.
```

### Prompt 13: Polish the Auth Page Mobile Experience

```
The auth page (src/routes/auth.lazy.tsx) is already very polished on desktop but check and improve the mobile experience:

1. Mobile hero strip:
   - Make sure the condensed hero on mobile shows the key social proof elements (stats strip, star rating)
   - Add a subtle gradient animation on the mobile hero background

2. Form improvements:
   - On mobile, make the form inputs slightly taller (h-12) for better touch targets
   - Add smooth auto-scroll to the active input when the keyboard opens (prevent the input from being hidden behind the keyboard)
   - The Google/Apple OAuth buttons should be full-width on mobile with clear separation: "or continue with email" divider text

3. Password strength meter:
   - Animate the strength bars filling up as the user types (transition-all duration-300)
   - Color code: 1 bar = red, 2 = orange, 3 = gold, 4 = green

4. Loading state:
   - When the form is submitting, replace the button text with a spinning loader and "Signing in..." text
   - Disable all form inputs during submission to prevent double-submit

5. Success state:
   - After successful sign-up, show a brief celebration animation: confetti burst (CSS particles) before redirecting

6. Error states:
   - Error messages should slide in from below the input with a subtle shake animation
   - Use coral color for error text and a coral left border on the errored input
```

---

## PHASE 5 — GLOBAL POLISH

### Prompt 14: Add Global Page Transitions & Loading States

```
Add smooth page transitions and consistent loading states across the entire app:

1. Page transitions:
   - When navigating between pages, add a fade-out (200ms) → fade-in (300ms) transition
   - Use Framer Motion AnimatePresence in the root layout (__root.tsx)
   - Each page should animate in with opacity 0→1 and y: 10→0

2. Loading skeleton screens:
   - Create a reusable SkeletonCard component that shows a pulsing placeholder matching card layouts
   - Use it in: Explore (venue cards), Tonight (trending venues), Events (event cards), Trips (trip cards)
   - Skeleton should pulse with a shimmer animation (gradient sweep from left to right)
   - Match the card dimensions exactly so there's no layout shift when real content loads

3. Pull-to-refresh:
   - Add PullToRefresh to all data-driven pages: Tonight, Explore, Events, Trips, Business Dashboard
   - Use the existing PullToRefresh component
   - Show the Confetti logo (or sparkles icon) during the refresh animation

4. Error states:
   - Create a reusable ErrorState component with: red/coral icon, "Something went wrong" heading, error message, "Try again" button
   - Use it as the error boundary for all data-fetching pages

5. Navigation transitions:
   - Bottom tab bar (in the app layout): active tab icon should have a subtle bounce animation when selected
   - Tab indicator (the active state) should slide smoothly between tabs, not jump
```

### Prompt 15: Add Micro-Interactions & Haptic Feel

```
Add micro-interactions across the app that make it feel alive and responsive:

1. Button press feedback:
   - All primary buttons (coral background): scale to 0.95 on press, spring back to 1.0 on release
   - Add active:scale-95 transition-transform to the BrandButton or equivalent component
   - Secondary/outline buttons: background darkens slightly on press

2. Card interactions:
   - All clickable cards: scale to 0.98 on press with slightly reduced shadow
   - Hover (desktop): scale 1.02 with increased shadow
   - Use transition-all duration-200

3. Toggle/Switch animations:
   - Any toggle or switch should have a smooth slide animation with a slight bounce at the end
   - Filter pills (categories, vibes): selected state transitions with background color fade (200ms)

4. Toast notifications:
   - Toasts should slide in from the top with a spring animation
   - Success toasts: green left border, checkmark icon with a draw-in animation
   - Error toasts: coral left border with a subtle shake

5. Number animations:
   - Any counter or stat number that appears on screen should count up from 0
   - Use a 1-second duration with easing
   - Apply to: KPI cards (admin, business dashboard), profile stats, wallet stats

6. Scroll-triggered reveals:
   - Use the existing Reveal component more broadly
   - Apply to: feature cards, testimonial sections, tier cards, any grid of items
   - Stagger delay: 0.08s between items

7. Heart/Like animation:
   - Anywhere there's a like/heart action: scale up to 1.3, fill with coral, small particle burst, settle to 1.0
   - Apply to: venue cards, reels, event cards
```

---

## RECOMMENDED ORDER

Send these prompts in this exact order, one at a time:

1. **Prompt 1** — Fix catch-all route (unblocks everything)
2. **Prompt 2** — Build admin dashboard
3. **Prompt 3** — Admin sub-pages
4. **Prompt 4** — Business landing page
5. **Prompt 5** — Business dashboard upgrade
6. **Prompt 6** — Business venue edit page
7. **Prompt 7** — Explore page
8. **Prompt 8** — Reels page
9. **Prompt 9** — Profile page styling
10. **Prompt 10** — Events page
11. **Prompt 11** — Trips page
12. **Prompt 12** — Influencer page
13. **Prompt 13** — Auth mobile polish
14. **Prompt 14** — Global transitions
15. **Prompt 15** — Micro-interactions

After each prompt, verify the changes look right in the preview before sending the next one. If something breaks, tell Lovable to fix it before moving on.
