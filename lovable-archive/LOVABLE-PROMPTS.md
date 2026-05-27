# Confetti — Lovable Consolidation Prompts

Paste these prompts into Lovable **in order**. Each one is a self-contained instruction.

---

## PROMPT 1 — Delete deferred sections (admin, partner, corporate, advertiser, promoter, qa)

```
Delete ALL of the following route files. These are deferred sections that will be separate apps later. Do NOT delete any components they import — only the route files themselves.

Delete all files matching these patterns in src/routes/:
- admin.* (every file starting with "admin.")
- partner.* (every file starting with "partner.")
- corporate.* (every file starting with "corporate.")
- advertise.* (every file starting with "advertise.") INCLUDING advertise.tsx
- promoter.* (every file starting with "promoter.")
- qa.* (every file starting with "qa.")
- teams.* (every file starting with "teams.")

Also delete these concierge layout files (chat.tsx replaces them):
- concierge.tsx
- concierge.index.tsx
- concierge.chat.index.tsx
- concierge.chat.$threadId.tsx
- concierge.passport.tsx
- concierge.profile.tsx

Also delete these portal files (app.profile will replace them):
- portal.index.tsx
- portal.achievements.tsx
- portal.activity.tsx
- portal.bookings.tsx
- portal.brief.tsx
- portal.passport.tsx
- portal.profile.tsx
- portal.refer.tsx
- portal.saved.tsx
- portal.viral.tsx
- portal.wallet.tsx

After deleting, the route tree will auto-regenerate. Do NOT touch any shared components, hooks, or lib files.
```

---

## PROMPT 2 — Delete duplicate standalone pages

```
Delete these duplicate/redundant standalone route files from src/routes/. They are absorbed into the remaining pages or deferred:

- active-confetti.tsx and active-confetti.lazy.tsx
- active-loop.tsx
- ask.tsx
- boarding-pass.tsx
- boarding-pass-planner.tsx (if exists)
- city-guides.tsx
- collab.$tripId.tsx
- confirmation.tsx
- contact.tsx (merge the content into about.tsx if needed)
- cookies.tsx (absorbed into privacy.tsx)
- create.tsx
- data-terms.tsx (absorbed into privacy.tsx)
- discover.tsx (absorbed into app.explore)
- event-pack.tsx
- favorites.tsx (absorbed into app.profile)
- features.tsx
- group-outing.tsx
- guides.tsx
- how-it-works.tsx
- ideas.$slug.tsx
- investors.tsx
- login.tsx (absorbed into auth.tsx)
- me.tsx (absorbed into app.profile)
- night-planner.tsx (absorbed into app.plan)
- onboarding.tsx (absorbed into auth.tsx)
- passport.tsx (absorbed into app.profile)
- pricing.tsx
- profile.preferences.tsx (absorbed into app.profile)
- quick-generate.tsx (absorbed into app.plan)
- recap.$itineraryId.tsx (absorbed into trips.$id)
- referral.tsx
- reservations.tsx (absorbed into app.profile)
- reset-password.tsx (absorbed into auth.tsx)
- rsvp.$tripId.tsx
- rsvp.$token.tsx
- scan.tsx (absorbed into check-in.tsx)
- signup.tsx (absorbed into auth.tsx)
- taste-tuner.tsx (absorbed into app.profile)
- team-events.tsx
- testimonials.tsx
- tonight.tsx (duplicate of app index)
- translate.tsx
- vibe-picker.tsx (absorbed into app.plan)
- vibe-plans.tsx (absorbed into app.plan)
- viral.tsx (absorbed into app.explore)
- weather.tsx

Also delete the related .lazy.tsx files for any of the above if they exist (e.g., about.lazy.tsx, accessibility.lazy.tsx should stay; but active-confetti.lazy.tsx should go).

Do NOT delete: index.tsx, about.tsx, about.lazy.tsx, accessibility.tsx, accessibility.lazy.tsx, auth.tsx, auth.lazy.tsx, app.tsx, app.*.tsx, business.*.tsx, chat.tsx, check-in.tsx, checkout.return.tsx, events.index.tsx, events.$eventId.tsx (if exists), for-business.tsx, health.tsx, influencer.tsx, p.$code.tsx, privacy.tsx, terms.tsx, trips.*.tsx, venue.$id.tsx
```

---

## PROMPT 3 — Consolidate app.profile.tsx to absorb portal pages

```
Rewrite src/routes/app.profile.tsx to be the unified user profile page with tab sections. This replaces all the old portal.* pages.

Keep the existing TanStack Router pattern: createFileRoute("/app/profile").

The page should have these tab sections using the Tabs component from @/components/ui/tabs:

1. **Overview** — user avatar, display name, email, XP level, membership tier, quick stats (trips taken, venues visited, reviews written)
2. **Bookings** — list of upcoming and past bookings. Import the booking list logic from the old portal.bookings.tsx (use supabase query for user_bookings, show venue name, date, party size, status badge). Include the "Add to Calendar" button.
3. **Saved** — saved venues list. Import from old portal.saved.tsx (supabase query for saved_venues joined with venues, show venue card with unsave button).
4. **Passport** — the Confetti Passport / boarding pass collection. Show visited venues as stamps, XP earned, achievements unlocked.
5. **Wallet** — referral stats, earned credits, promo codes. Show referral code with share button, referral link using buildReferralLink().
6. **Settings** — display name edit, email, location preferences, taste preferences link, sign out button, delete account.

Use the existing imports:
- useAuth from @/lib/auth-context
- supabase from @/integrations/supabase/client
- getMyReferralStats, buildReferralLink from @/lib/referrals
- Tabs, TabsList, TabsTrigger, TabsContent from @/components/ui/tabs
- lucide-react icons

Use the MobileHeader component from @/components/AppShell for the page header.
Keep the Confetti cream/ink design language. Mobile-first max-w-md layout.
```

---

## PROMPT 4 — Consolidate business.dashboard.tsx to absorb all business sub-pages

```
Rewrite src/routes/business.dashboard.tsx to be the unified business dashboard with tab sections. This replaces business.bookings, business.events, business.media, business.menu, business.settings, business.billing, business.payouts, business.notifications, business.social, business.preorders, business.promoters, business.ai-refresh, and business.corporate.

Keep the existing beforeLoad guard (requireBusinessAccess) and createFileRoute("/business/dashboard") pattern.

The page should have a sidebar or tab navigation with these sections:

1. **Overview** — the existing dashboard stats (views, clicks, bookings, revenue) using getVenueAnalytics(). Keep the existing analytics cards.
2. **Bookings** — incoming reservation list with accept/decline actions
3. **Events** — create and manage events at the venue
4. **Media** — photo/video gallery management
5. **Menu** — menu items management
6. **Settings** — venue profile, hours, description, contact info, billing, payouts

Use a responsive layout: on mobile show a horizontal scrollable tab bar at the top, on desktop show a sidebar.

Keep all existing imports from the current business.dashboard.tsx. Use the Tabs component for the sections.

After this rewrite, delete these now-redundant files:
- business.bookings.tsx
- business.events.tsx
- business.media.tsx
- business.menu.tsx
- business.settings.tsx
- business.billing.tsx
- business.payouts.tsx
- business.notifications.tsx
- business.social.tsx
- business.preorders.tsx
- business.promoters.tsx
- business.ai-refresh.tsx
- business.corporate.tsx
- business.pricing.tsx
- business.register.tsx and business.register.lazy.tsx
- business.signup.tsx
```

---

## PROMPT 5 — Consolidate privacy.tsx to absorb legal pages

```
Update src/routes/privacy.tsx to include tabbed sections for:
1. Privacy Policy (existing content)
2. Terms of Service (content from terms.tsx)
3. Cookie Policy (content from cookies.tsx)
4. Data Terms (content from data-terms.tsx)

Use Tabs from @/components/ui/tabs. Add search params to control which tab is active: /privacy?tab=terms, /privacy?tab=cookies, /privacy?tab=data.

After this, delete: terms.tsx, cookies.tsx, data-terms.tsx
```

---

## PROMPT 6 — Add redirects for old URLs

```
Create a new file src/routes/_redirects.tsx that sets up catch-all redirects so old bookmarked URLs don't break:

Add these redirects using TanStack Router:
- /portal/* → /app/profile
- /concierge/* → /chat
- /discover → /app/explore
- /night-planner → /app/plan
- /vibe-picker → /app/plan
- /passport → /app/profile
- /favorites → /app/profile
- /me → /app/profile
- /login → /auth
- /signup → /auth?mode=signup
- /reset-password → /auth
- /tonight → /app
- /scan → /check-in
- /boarding-pass → /trips

Each redirect should use createFileRoute with a beforeLoad that calls redirect().

Example pattern:
export const Route = createFileRoute("/portal")({
  beforeLoad: () => { throw redirect({ to: "/app/profile" }) }
})
```

---

## PROMPT 7 — Update all internal links

```
Search the entire codebase for Link components and useNavigate calls that reference deleted routes. Update them:

- Links to /portal → /app/profile
- Links to /portal/bookings → /app/profile (bookings tab)
- Links to /portal/saved → /app/profile (saved tab)
- Links to /portal/profile → /app/profile
- Links to /portal/refer → /app/profile (wallet tab)
- Links to /portal/wallet → /app/profile (wallet tab)
- Links to /portal/achievements → /app/profile (passport tab)
- Links to /portal/passport → /app/profile (passport tab)
- Links to /concierge → /chat
- Links to /concierge/chat → /chat
- Links to /discover → /app/explore
- Links to /night-planner → /app/plan
- Links to /tonight → /app
- Links to /login → /auth
- Links to /signup → /auth?mode=signup
- Links to /favorites → /app/profile
- Links to /passport → /app/profile
- Links to /me → /app/profile
- Links to /admin → remove or hide (admin is a separate app now)
- Links to /partner/* → remove
- Links to /corporate/* → remove
- Links to /advertise/* → remove
- Links to /scan → /check-in

Also update the navigation items in:
- src/components/AppShell.tsx
- src/components/SiteHeader.tsx
- src/components/SiteFooter.tsx
- Any sidebar or drawer navigation components
```

---

## PROMPT 8 — Clean up unused components

```
After all the route consolidation is done, scan for orphaned components that were only used by deleted routes. Look in src/components/ for components that are no longer imported anywhere. List them but do NOT delete yet — I want to review the list first.

Specifically check:
- src/components/admin/ folder
- src/components/partner/ folder
- src/components/corporate/ folder
- Any component with "Admin", "Partner", "Corporate", "Advertise" in the name
```

---

## Execution Order

1. **Prompt 1** — Delete deferred sections (biggest cleanup)
2. **Prompt 2** — Delete duplicate standalone pages
3. **Prompt 3** — Consolidate app.profile
4. **Prompt 4** — Consolidate business.dashboard
5. **Prompt 5** — Consolidate privacy/legal
6. **Prompt 6** — Add redirects
7. **Prompt 7** — Update internal links
8. **Prompt 8** — Audit unused components

After each prompt, verify the app still builds before moving to the next.
