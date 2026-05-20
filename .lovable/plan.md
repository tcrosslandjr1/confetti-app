# Full Admin Overhaul Plan

30 admin pages exist. Doing this in one turn would produce sloppy, inconsistent work. Splitting into 5 focused phases — each phase ships independently, builds cleanly, and you can review before the next one.

## Phase 1 — Shared admin shell (this turn)

The biggest visual win for the least risk. Every page inherits these:

- **`AdminPageHeader`** component: title, subtitle slot, breadcrumbs from route, right-side action slot (export, refresh, primary CTA).
- **`AdminKpiCard`** component: label, value, delta, trend sparkline, icon, semantic color states. Used everywhere.
- **`AdminEmptyState` / `AdminErrorState` / `AdminLoadingState`** — consistent loading/empty/error UX.
- **`AdminFilterBar`** — search input + filter chips + date range, used by every table page.
- **`AdminDataTable`** wrapper — sortable headers, sticky header, row click → detail, CSV export, pagination.
- Sidebar polish: section badges show live counts (pending claims, unread notifs, open moderation), collapsed mini-state, command-K palette already exists — wire it to all routes.
- Top bar: global search, environment badge (dev/preview/prod), "live" pulse indicator when realtime subscriptions are active.

## Phase 2 — People + Marketplace (Users, Roles, Venues, Claims)

Each gets: KPI header, filter bar, sortable table, detail drawer, ops actions, CSV export, realtime where it matters (new claims, new users).

## Phase 3 — Growth (Advertisers, Marquee, Outreach, Notifications, Testimonials, Promoters)

Campaign-style dashboards: spend/impressions/CTR cards, status pipelines, bulk actions, scheduling UI.

## Phase 4 — Analytics suite (Analytics, Event/Pick/Ad analytics, Dashboard)

Recharts dashboards with date pickers, segment filters, comparison vs previous period, top-N tables, export.

## Phase 5 — System (Integrations, Settings, Audit, Logs, Wallet debug, Launch, Routes map, Agents, Diagnostics, Health, Bootstrap, Ask, Login)

Ops-focused: health status, log tailing, integration connection states, audit timeline, role-gated dangerous actions with confirm dialogs.

## Conventions (locked across all phases)

- Light theme only — warm coral on cream (per project memory).
- All colors via semantic tokens in `src/styles.css`. No hex in components.
- Sonner for toasts. shadcn primitives only.
- TanStack Query for all data; `useServerFn` for mutations; invalidate keys on success.
- Realtime via Supabase channels, gated behind a per-page "Live" toggle so it can be paused.
- Every page: KPI header → filter/search → main view → detail drawer.

## What I'll do this turn

Phase 1 only — build the shared shell + components and apply them to `admin.index` (Dashboard) and `admin.users` as reference implementations. After you confirm the shell feels right, I'll roll Phase 2–5 page-by-page in subsequent turns.
