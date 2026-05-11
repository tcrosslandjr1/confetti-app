# Multi-day planning + Corporate events

Two related expansions to the planner. Both reuse the existing itinerary engine, the Concierge wizard, and Lovable Cloud auth/RLS.

## 1. Multi-day planning

Today every itinerary is a single date with stops keyed off `start_time`. We extend it so one itinerary can span 1–7 days.

**Schema (migration)**
- `itineraries`: add `end_date date`, `day_count int default 1`, `trip_type text default 'night'` (values: `night`, `weekend`, `trip`, `corporate`).
- `itinerary_stops`: add `day_index int not null default 1` (1 = first day) and `stop_date date` (denormalized for sort/display).
- Backfill existing rows: `end_date = date`, `day_count = 1`, `day_index = 1`, `stop_date = date`.

**Planner changes**
- Wizard (`BuildMyNightWizard.tsx`): add a "How many days?" step (1 / 2 / 3 / Custom 4–7) right after the date picker. When > 1, show a per-day vibe selector and per-day stop count.
- Generator (`buildAndSaveItinerary`): produce stops grouped by day, write `day_index` + `stop_date`.
- Itinerary detail page (`/trips/$id`): render a Day 1 / Day 2 / … tabbed view; each tab shows that day's timeline. Single-day trips render unchanged (no tabs).
- Print/share view shows day headers.

**Where it shows up**
- `/portal` "Upcoming bookings" lists multi-day trips as one row with a "3-day trip · starts Fri" label.
- New "Steal a weekend" rail on the home `QuickPicks` with 3 curated multi-day templates.

## 2. Corporate planning events

A new lightweight events product on top of itineraries — for offsites, client dinners, team outings.

**Schema (same migration)**
New tables:
- `corporate_events`: `id`, `owner_id`, `org_name text`, `title`, `purpose text` (offsite/client/team-outing/conference), `starts_at timestamptz`, `ends_at timestamptz`, `headcount int`, `budget_per_person_cents int`, `status text` (draft/proposed/confirmed/completed/cancelled), `itinerary_id uuid` (nullable link to the generated multi-day itinerary), `notes`, timestamps.
- `corporate_attendees`: `id`, `event_id`, `email`, `name`, `role text` (organizer/attendee/vip), `dietary text`, `rsvp_status text` (invited/yes/no/maybe), `rsvp_token text unique`, `responded_at`.
- `corporate_event_costs` (optional MVP cut: skip — derive from itinerary).

RLS:
- `corporate_events`: owner-only read/write; admins read all.
- `corporate_attendees`: visible to event owner; the public RSVP page reads via the unguessable `rsvp_token` only (security definer function `get_attendee_by_token(token)` returning the row + minimal event info, used by `/rsvp/$token`).

**UI**
- New section in main nav (visitor + signed-in): **For Teams**.
- New routes:
  - `/teams` — marketing page (hero, three use-cases: offsite, client dinner, team night, pricing tiers, "Plan an event" CTA).
  - `/teams/new` — multi-step builder: org details → date(s) (uses the new multi-day flow) → vibe + dietary needs → headcount + per-person budget → upload attendee CSV or paste emails → review → "Generate plan". On submit, creates `corporate_events` + auto-generates the linked multi-day itinerary.
  - `/teams/$id` — event dashboard: itinerary tab, attendees tab (RSVP statuses, resend invite, dietary roll-up), budget tab (estimated total vs cap), share tab (public read-only itinerary link).
  - `/rsvp/$token` — public page: shows event title/date/venues, captures yes/no/maybe + dietary.
- Portal (`/portal`): if the user owns any corporate events, show a "Your team events" card with the next event and quick links.

**Edge functions**
- `corporate-invite-send`: invoked from `/teams/$id` "Send invites"; iterates attendees, generates `rsvp_token`, sends emails via Resend (reuse existing email infra). Subject: "You're invited: {event.title}".
- `corporate-rsvp-record`: called by `/rsvp/$token` form to update attendee status (uses service role + token lookup, never trusts user_id).

**Concierge tie-in**
- Add a Concierge intent: "plan a team offsite" routes to `/teams/new` with prefilled context.

## Tech notes

- Use `react-day-picker` shadcn DatePicker for the date range (multi-day selects a `from`/`to`).
- CSV parsing: a tiny client-side parser (no extra dep) — split on newline/comma, validate emails with regex.
- Email sending uses the existing Resend integration pattern in the project; if not present yet, the function will return a clear "configure Resend" error and we'll wire it on first use.
- All new tables get `updated_at` triggers using the existing `touch_*_updated_at` pattern.
- Index `corporate_events(owner_id, starts_at)` and `corporate_attendees(event_id)`.

## Out of scope (call-outs)

- Stripe billing for "team plans" — placeholder pricing only.
- Calendar (.ics) export — planned for v2.
- Per-attendee dietary substitution at the venue — surfaced as notes on the booking only.

## Build order

1. Migration (multi-day fields + corporate tables + RLS + triggers).
2. Multi-day in wizard + itinerary detail tabs.
3. `/teams` marketing + `/teams/new` builder (creates event + multi-day itinerary).
4. `/teams/$id` dashboard (itinerary, attendees, budget tabs).
5. RSVP flow (`/rsvp/$token` + invite send function + record function).
6. Portal "Your team events" card + nav entry + Concierge intent.
