# Confetti App — Page Consolidation Migration Plan

## Summary

**Before:** ~150 route files across consumer, business, admin, partner, corporate, advertiser, and promoter sections.

**After:** ~25 MVP pages — a proper mobile app.

---

## Phase 1 — DELETE (remove these files entirely)

These sections are deferred. They should be separate apps or added later.

### Admin Panel (27 files) — build as separate admin app
```
src/routes/admin.index.tsx
src/routes/admin.ad-analytics.tsx
src/routes/admin.ad-analytics.lazy.tsx
src/routes/admin.advertisers.tsx
src/routes/admin.advertisers.lazy.tsx
src/routes/admin.agents.tsx
src/routes/admin.agents.lazy.tsx
src/routes/admin.analytics.tsx
src/routes/admin.analytics.lazy.tsx
src/routes/admin.audit.tsx
src/routes/admin.audit.lazy.tsx
src/routes/admin.bookings.tsx
src/routes/admin.bootstrap.tsx
src/routes/admin.bootstrap.lazy.tsx
src/routes/admin.business-claims.tsx
src/routes/admin.business-claims.lazy.tsx
src/routes/admin.diagnostics.tsx
src/routes/admin.diagnostics.lazy.tsx
src/routes/admin.event-analytics.tsx
src/routes/admin.event-analytics.lazy.tsx
src/routes/admin.health.tsx
src/routes/admin.health.lazy.tsx
src/routes/admin.integrations.tsx
src/routes/admin.integrations.lazy.tsx
src/routes/admin.launch.tsx
src/routes/admin.launch.lazy.tsx
src/routes/admin.login.tsx
src/routes/admin.logs.tsx
src/routes/admin.logs.lazy.tsx
src/routes/admin.marquee.tsx
src/routes/admin.marquee.lazy.tsx
src/routes/admin.moderation.tsx
src/routes/admin.moderation.lazy.tsx
src/routes/admin.notifications.tsx
src/routes/admin.notifications.lazy.tsx
src/routes/admin.outreach.tsx
src/routes/admin.outreach.lazy.tsx
src/routes/admin.pick-analytics.tsx
src/routes/admin.pick-analytics.lazy.tsx
src/routes/admin.promoters.tsx
src/routes/admin.promoters.lazy.tsx
src/routes/admin.roles.tsx
src/routes/admin.roles.lazy.tsx
src/routes/admin.routes-map.tsx
src/routes/admin.routes-map.lazy.tsx
src/routes/admin.settings.tsx
src/routes/admin.settings.lazy.tsx
src/routes/admin.testimonials.tsx
src/routes/admin.testimonials.lazy.tsx
src/routes/admin.users.tsx
src/routes/admin.venues.tsx
src/routes/admin.venues.lazy.tsx
src/routes/admin.wallet-debug.tsx
src/routes/admin.wallet-debug.lazy.tsx
```

### Partner Portal (14 files) — merge into business dashboard later
```
src/routes/partner.index.tsx
src/routes/partner.analytics.tsx
src/routes/partner.api.tsx
src/routes/partner.billing.tsx
src/routes/partner.booking-settings.tsx
src/routes/partner.calendar.tsx
src/routes/partner.menu.tsx
src/routes/partner.order-settings.tsx
src/routes/partner.orders.tsx
src/routes/partner.profile.tsx
src/routes/partner.promotions.tsx
src/routes/partner.reservations.tsx
src/routes/partner.suggestions.tsx
src/routes/partner.support.tsx
```

### Corporate Portal (9 files) — phase 2
```
src/routes/corporate.index.tsx
src/routes/corporate.approvals.tsx
src/routes/corporate.bookings.tsx
src/routes/corporate.login.tsx
src/routes/corporate.planner.tsx
src/routes/corporate.policies.tsx
src/routes/corporate.reporting.tsx
src/routes/corporate.settings.tsx
src/routes/corporate.teams.tsx
```

### Advertiser Portal (4 files) — phase 2
```
src/routes/advertise.index.tsx
src/routes/advertise.portal.tsx
src/routes/advertise.reports.tsx
src/routes/advertise.stories.$slug.tsx
src/routes/advertise.tsx
```

### Promoter (2 files) — phase 2
```
src/routes/promoter.index.tsx
src/routes/promoter.jobs.tsx
```

### QA / Dev-only (2 files) — remove
```
src/routes/qa.tsx
src/routes/qa.test-plan.tsx
```

### Teams (3 files) — phase 2
```
src/routes/teams.index.tsx
src/routes/teams.new.tsx
src/routes/teams.$id.tsx
```

### Concierge layout (replaced by simpler chat.tsx)
```
src/routes/concierge.tsx
src/routes/concierge.index.tsx
src/routes/concierge.chat.index.tsx
src/routes/concierge.chat.$threadId.tsx
src/routes/concierge.passport.tsx
src/routes/concierge.profile.tsx
```

### Portal (absorbed into app.profile tab)
```
src/routes/portal.index.tsx
src/routes/portal.achievements.tsx
src/routes/portal.activity.tsx
src/routes/portal.bookings.tsx
src/routes/portal.brief.tsx
src/routes/portal.passport.tsx
src/routes/portal.profile.tsx
src/routes/portal.refer.tsx
src/routes/portal.saved.tsx
src/routes/portal.viral.tsx
src/routes/portal.wallet.tsx
```

### Duplicate / redundant standalone pages
```
src/routes/active-confetti.tsx (and .lazy)
src/routes/active-loop.tsx
src/routes/ask.tsx
src/routes/boarding-pass.tsx
src/routes/boarding-pass-planner.tsx
src/routes/city-guides.tsx
src/routes/collab.$tripId.tsx
src/routes/confirmation.tsx
src/routes/create.tsx
src/routes/discover.tsx (absorbed into app.explore)
src/routes/event-pack.tsx
src/routes/favorites.tsx (absorbed into app.profile saved tab)
src/routes/features.tsx
src/routes/group-outing.tsx
src/routes/guides.tsx
src/routes/how-it-works.tsx
src/routes/ideas.$slug.tsx
src/routes/investors.tsx
src/routes/me.tsx
src/routes/night-planner.tsx
src/routes/onboarding.tsx (absorbed into auth)
src/routes/passport.tsx (absorbed into app.profile)
src/routes/pricing.tsx
src/routes/profile.preferences.tsx
src/routes/quick-generate.tsx
src/routes/recap.$itineraryId.tsx (absorbed into trips.$id)
src/routes/referral.tsx
src/routes/reservations.tsx (absorbed into app.profile bookings)
src/routes/reset-password.tsx (absorbed into auth)
src/routes/rsvp.$tripId.tsx
src/routes/rsvp.$token.tsx
src/routes/signup.tsx (absorbed into auth)
src/routes/login.tsx (absorbed into auth)
src/routes/taste-tuner.tsx (absorbed into app.profile)
src/routes/team-events.tsx
src/routes/testimonials.tsx
src/routes/tonight.tsx (duplicate of app.index)
src/routes/translate.tsx
src/routes/vibe-picker.tsx (absorbed into app.plan)
src/routes/vibe-plans.tsx (absorbed into app.plan)
src/routes/viral.tsx (absorbed into app.explore)
src/routes/weather.tsx
```

---

## Phase 2 — KEEP (the 25 MVP files)

### App Shell + 5 tabs (the core mobile experience)
| # | File | Route | What it does |
|---|------|-------|-------------|
| 1 | `app.tsx` | `/app` | AppShell layout with bottom tab bar |
| 2 | `app.index.tsx` | `/app` | **Tonight** — hero, trending, quick-plan |
| 3 | `app.explore.tsx` | `/app/explore` | **Explore** — venue list/map (absorbs discover.tsx) |
| 4 | `app.reels.tsx` | `/app/reels` | **Reels** — short-form video feed |
| 5 | `app.plan.tsx` | `/app/plan` | **Plan** — AI planner (absorbs night-planner, vibe-picker, quick-generate) |
| 6 | `app.profile.tsx` | `/app/profile` | **Profile** — with sub-tabs: overview, bookings, saved, passport, wallet, activity, settings (absorbs all portal.* pages) |

### Consumer detail pages
| # | File | Route | What it does |
|---|------|-------|-------------|
| 7 | `venue.$id.tsx` | `/venue/:id` | Venue detail + booking |
| 8 | `events.$eventId.tsx` | `/events/:eventId` | Event detail |
| 9 | `chat.tsx` | `/chat` | AI concierge chat (absorbs concierge.chat.*) |
| 10 | `trips.index.tsx` | `/trips` | Trip list |
| 11 | `trips.$id.tsx` | `/trips/:id` | Trip detail / boarding pass (absorbs boarding-pass, recap) |
| 12 | `checkout.return.tsx` | `/checkout/return` | Payment return |
| 13 | `check-in.tsx` | `/check-in` | QR scan & check-in (absorbs scan.tsx) |
| 14 | `p.$code.tsx` | `/p/:code` | Referral deep link |

### Auth
| # | File | Route | What it does |
|---|------|-------|-------------|
| 15 | `auth.tsx` | `/auth` | Route definition |
| 16 | `auth.lazy.tsx` | `/auth` | Sign in / sign up / reset password (absorbs login, signup, reset-password, onboarding) |

### Business (simplified)
| # | File | Route | What it does |
|---|------|-------|-------------|
| 17 | `business.index.tsx` | `/business` | Business landing / marketing |
| 18 | `business.login.tsx` | `/business/login` | Business auth (absorbs register, signup) |
| 19 | `business.dashboard.tsx` | `/business/dashboard` | Dashboard with tab sections for bookings, events, media, menu, settings, billing (absorbs 15+ business.* files) |
| 20 | `business.claim.tsx` | `/business/claim` | Venue claim flow (absorbs claim.pending, pending) |

### Static / Legal
| # | File | Route | What it does |
|---|------|-------|-------------|
| 21 | `index.tsx` | `/` | Homepage / landing |
| 22 | `about.tsx` | `/about` | About Confetti |
| 23 | `privacy.tsx` | `/privacy` | Privacy + terms + cookies (absorbs terms, cookies, data-terms) |
| 24 | `for-business.tsx` | `/for-business` | Business marketing page |
| 25 | `influencer.tsx` | `/influencer` | Influencer landing page |

---

## Phase 3 — REWRITE (files that need consolidation code)

The following files need to be rewritten to absorb their merged pages. See the Lovable prompts below.
