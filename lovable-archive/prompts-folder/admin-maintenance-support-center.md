# Confetti Admin Center — Maintenance & Support Build

## CONTEXT — What Already Exists

The app already has these tables and patterns in place. **Do NOT recreate them — extend and wire into them:**

### Existing Supabase Tables
- `admin_users` — roles: owner, manager, support, member; statuses: active, review, suspended, disabled; has risk_level, invited_by, last_seen_at
- `admin_activity_log` — actor_user_id, target_user_id, action, entity_type, entity_id, severity (info/success/warning/critical), metadata jsonb, ip_address, user_agent
- `admin_audit_log` — reviewer_id, reviewer_email, action, entity_type, entity_id, entity_label, note, metadata jsonb
- `support_tickets` — user_id, user_email, subject, description, category (general/bug/billing/feature_request/account/venue/booking), priority (low/medium/high/urgent), status (open/in_progress/waiting_on_user/escalated/resolved/closed), ai_response, assigned_to (references admin_users), resolved_at
- `support_ticket_messages` — ticket_id, role (user/agent/system/ai), content
- `feature_flags` — key (unique), name, description, status (enabled/disabled/rollout), environments, rollout_strategy (all/percentage/segment/user_list), rollout_percentage, target_segments, target_user_ids, error_threshold, auto_rollback, rollback_triggered
- `content_items` — type (push/email/in_app/sms/banner/blog), title, body, rich_body jsonb, audience text[], status (draft/scheduled/published/archived), scheduled_at, published_at, metrics jsonb, created_by
- `user_roles` — user_id, role (includes 'admin')
- `profiles` — id, display_name, avatar_url, etc.
- `venues`, `bookings`, `notifications`, `venue_claims`, `venue_reports`, `advertisers`

### Existing Admin Code (src/lib/)
- `admin-roles.functions.ts` — listAdminsFn, assertAdmin helper, uses service role key
- `admin-audit.functions.ts` — logPinUnlockAttempt, writes to admin_audit_log
- `admin-search.functions.ts` — global admin search across users, events, venues
- `admin-users.functions.ts` — user management server functions
- `admin-bootstrap.functions.ts` — initial admin setup
- `admin-nav-counts.ts` — live sidebar badge counts (pendingAdvertisers, pendingClaims, pendingModeration, unreadNotifications, pendingBookings)

### Existing Routes
- `/admin/login` — admin login gate
- `/admin/console` — main admin console with PIN gate (PIN: stored in code, session-based unlock)

### Design System
- Colors: `bg-ink` (dark), `text-cream`, `border-coral`, `bg-coral/10`, accent coral
- Font: `font-display` for headings, `font-mono` for labels/codes
- Cards: `rounded-2xl border-2 border-cream/20 bg-ink shadow-brut`
- Inputs: `rounded-xl border-2 bg-cream/5 text-cream`
- Framework: TanStack Router (file-based), TanStack Query, Supabase, Tailwind CSS, Lucide icons

---

## BUILD INSTRUCTIONS

Build a full **Maintenance & Support** section inside the Admin Center. This replaces the current single-page `admin.console.tsx` with a proper multi-page admin layout using nested routes under `/admin/*`.

### Admin Layout Shell

Create a shared admin layout (`/admin` parent route) with:
- **Left sidebar** (collapsible on mobile) with navigation groups:
  ```
  OVERVIEW
    Dashboard

  OPERATIONS
    System Health
    Integrations
    Maintenance Mode

  USERS & SUPPORT
    Users
    Support Tickets
    Bug Reports

  CONTENT
    Activities & Ideas
    Announcements

  BUSINESS
    Plans & Billing
    Feature Flags

  SECURITY
    Logs & Audit Trail
    Security Controls
    Admin Roles
  ```
- Each nav item shows a **live badge count** where applicable (extend `useAdminNavCounts`)
- **Top bar** with: admin name/avatar, role badge, global search (wire into existing `admin-search.functions.ts`), notification bell
- **PIN gate** persists — reuse the existing PIN gate pattern from `admin.console.tsx`
- **Role-based nav visibility** — hide sections the current admin role cannot access

---

### 1. DASHBOARD (Overview)

Route: `/admin/dashboard`

A single-screen overview with:
- **Status cards row**: App Status (online/degraded/offline), Active Users (24h), Open Tickets, Unresolved Bugs, Revenue (MTD)
- **Quick actions**: Jump to user search, create announcement, toggle maintenance mode
- **Recent activity feed**: Last 20 entries from `admin_activity_log`, showing actor, action, entity, timestamp
- **Alerts panel**: Failed payments, high-priority tickets, error spikes, expiring feature flags

---

### 2. SYSTEM HEALTH

Route: `/admin/system-health`

Dashboard cards checking real-time status:

| Check | How to check | Status display |
|---|---|---|
| App status | Fetch `/health` endpoint | Green/yellow/red dot + label |
| Supabase connection | `supabase.from('profiles').select('id', { count: 'exact', head: true })` | Connected / Error |
| Auth service | `supabase.auth.getSession()` test | Active / Degraded |
| Storage | `supabase.storage.listBuckets()` | Connected / Error |
| Edge functions | Ping a health-check edge function | Responding / Down |
| Database response time | Time a simple query | ms value, warn if >500ms |
| Error rate | Count recent errors from `admin_activity_log` where severity='critical' in last 1h | Count + trend arrow |

- **Last checked** timestamp with manual refresh button
- **Health history**: Simple sparkline of last 24h checks
- Auto-refresh every 60 seconds

---

### 3. USER SUPPORT

Route: `/admin/users`

- **Search bar** at top: search by name, email, phone, user ID (wire into `admin-search.functions.ts`)
- **User list table** with columns: Avatar, Name, Email, Plan/Tier, Status, Signup Date, Last Login, Actions
- **Filters**: status (active/blocked/deleted/trial/paid), tier, signup date range
- **Click user → User detail slide-over panel**:
  - Profile info (name, email, phone, avatar, city)
  - Account status with change dropdown (active/blocked/suspended) — **confirmation modal required**
  - Current plan/tier with manual override button — **confirmation modal + audit log**
  - Signup date, last login, total sessions
  - Activity timeline: last 20 actions from activity logs
  - Support notes: free-text notes field, saved to a `admin_user_notes` table
  - Related tickets: list of their support tickets
  - **Actions**: Send magic link, force password reset, flag for review — all write to `admin_audit_log`

**New table needed:**
```sql
create table if not exists public.admin_user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.admin_users(user_id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);
```

---

### 4. SUPPORT TICKETS

Route: `/admin/tickets`

Wire into the existing `support_tickets` and `support_ticket_messages` tables.

- **Inbox view** with columns: ID (short), Subject, User, Category, Priority, Status, Assigned To, Created, Updated
- **Filters**: status, priority, category, assigned_to, date range
- **Sort**: newest first (default), oldest, priority, last updated
- **Bulk actions**: Assign to admin, change status, change priority
- **Click ticket → Ticket detail page**:
  - Header: subject, status badge, priority badge, category tag
  - **User card**: linked user profile (click to open user panel)
  - **Conversation thread**: chronological messages from `support_ticket_messages`, styled by role (user=left, agent=right, system=center, ai=highlighted)
  - **Reply box**: rich text input, send as agent
  - **Quick reply templates**: dropdown of canned responses (store in `support_reply_templates` table)
  - **Internal notes**: toggle between "Reply to user" and "Internal note" — internal notes have role='system'
  - **Sidebar**: Status dropdown, Priority dropdown, Category dropdown, Assigned admin dropdown, Link to user account
  - **Resolution**: Mark resolved button → sets resolved_at, status='resolved', logs to audit

**New table needed:**
```sql
create table if not exists public.support_reply_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'general',
  body text not null,
  created_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now()
);
```

---

### 5. BUG REPORTS

Route: `/admin/bugs`

- **Bug list table**: ID, Title, Reporter, Page/URL, Device/Browser, Status, Priority, Created
- **Filters**: status (new/confirmed/in_progress/fixed/wont_fix/needs_info), priority, date range
- **Click bug → Bug detail page**:
  - Title, description, steps to reproduce
  - Screenshot(s) if attached (store URLs in metadata jsonb)
  - Device info: browser, OS, screen size, app version
  - Page URL where bug occurred
  - Error logs: any attached console errors (metadata jsonb)
  - Status workflow: new → confirmed → in_progress → fixed / wont_fix / needs_info
  - Priority selector
  - Internal notes
  - Link to related support ticket if any
  - **Actions**: Mark as fixed, mark won't fix, request more info (creates a ticket message to user)

**New table needed:**
```sql
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null default '',
  steps_to_reproduce text,
  page_url text,
  device_info jsonb not null default '{}',
  screenshots text[] not null default '{}',
  error_logs jsonb,
  status text not null default 'new'
    check (status in ('new','confirmed','in_progress','fixed','wont_fix','needs_info')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','critical')),
  related_ticket_id uuid references public.support_tickets(id) on delete set null,
  assigned_to uuid references public.admin_users(user_id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bug_reports_status on public.bug_reports(status);
create index idx_bug_reports_priority on public.bug_reports(priority);
```

---

### 6. APP CONTENT MAINTENANCE

Route: `/admin/content`

Manage the activity/idea catalog that powers "Surprise Me" and category browsing:

- **Activity list** with columns: Name, Category, Type (premium/free), Status (active/hidden/seasonal), Featured, Created
- **Filters**: category, type, status, featured
- **Click → Edit panel**:
  - Name, description, category (dropdown), subcategory
  - Tags / labels
  - Premium vs free toggle
  - Active / Hidden / Seasonal status
  - Featured toggle (shows on homepage)
  - Image URL
  - City/region scope
  - **Venue/activity approval queue**: items submitted by users or scraped, pending admin review
- **Bulk actions**: Hide selected, feature selected, mark as seasonal
- **Seasonal scheduler**: Set start/end dates for seasonal content visibility

Also surface:
- **Venue moderation queue**: Wire into existing `venue_reports` table, show reported venues needing review
- **FAQ / label management**: Simple CRUD for app-wide labels and FAQ items

---

### 7. PLAN & TIER MANAGEMENT

Route: `/admin/plans`

- **Plan overview cards**: Free tier vs Premium tier — show user counts for each
- **User breakdown table**: Name, Email, Current Plan, Plan Start, Billing Status, Actions
- **Filters**: free/premium, billing status (active/past_due/cancelled/trialing)
- **Actions per user**:
  - Upgrade/downgrade tier manually — **confirmation modal + audit log**
  - Grant free premium access (with expiry date) — **confirmation modal**
  - Cancel subscription — **confirmation modal**
- **Promo codes section**:
  - Create promo code: code string, discount %, duration, max uses, expiry
  - List active codes with usage counts
  - Deactivate codes

**New table needed:**
```sql
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  duration_months integer not null default 1,
  max_uses integer,
  current_uses integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now()
);
```

- **Failed payments panel**: List users with failed/past_due billing (query from profiles or a billing_events table if Stripe webhook populates one)
- **Refund/credit notes**: Text field to log manual refunds with amount, reason, date — stored in `admin_activity_log` with entity_type='billing'

---

### 8. ANNOUNCEMENTS

Route: `/admin/announcements`

Wire into existing `content_items` table (type='in_app' or 'banner' or 'push').

- **Announcement list**: Title, Type, Audience, Status, Scheduled, Published
- **Create announcement form**:
  - Title, body (rich text)
  - Type: in-app banner, push notification, maintenance notice, promo
  - Audience targeting: all users, free only, premium only, specific city, inactive users (no login in 30d), admin only
  - Schedule: publish now or schedule for later
  - Priority: normal, important (sticky banner)
  - Expiry date (auto-hide after)
- **Maintenance notice shortcut**: One-click "Schedule Maintenance" that creates a banner with countdown
- **Push to all**: Requires **double confirmation modal** ("You are about to notify X users. Are you sure?")
- Status management: draft → scheduled → published → archived

---

### 9. FEATURE FLAGS

Route: `/admin/feature-flags`

Wire into existing `feature_flags` table.

- **Flag list**: Name, Key, Status (enabled/disabled/rollout), Rollout %, Environments, Last Toggled
- **Quick toggle**: Inline switch to enable/disable — **confirmation modal** — logs to `admin_audit_log`
- **Click flag → Detail panel**:
  - Name, key (read-only after creation), description
  - Status: enabled / disabled / rollout
  - Rollout strategy: all, percentage (slider 0-100), segment, user_list
  - Target segments checkboxes
  - Target user IDs (search and add users)
  - Environments: production, staging, development
  - Auto-rollback toggle + error threshold %
  - History: show audit log entries for this flag (filter entity_type='feature_flag', entity_id=flag.id)
- **Create new flag form**: name, key (auto-slug from name), description, initial status
- **Emergency kill switch**: Big red button to disable a flag immediately, bypassing the normal modal

---

### 10. LOGS & AUDIT TRAIL

Route: `/admin/logs`

Query from both `admin_activity_log` and `admin_audit_log` tables, merged into a unified feed.

- **Log feed table**: Timestamp, Actor (admin name), Action, Entity Type, Entity, Severity, IP
- **Filters**: severity (info/success/warning/critical), entity_type, actor, date range, action keyword search
- **Color coding**: info=neutral, success=green, warning=yellow, critical=red
- **Click row → Detail slide-over**: Full metadata jsonb display, user agent, IP, related entity link
- **Export**: Download filtered logs as CSV
- **Log categories tabs**: All, Security, User Changes, Content, Billing, System

Specific events to track:
- Admin login/logout
- PIN unlock attempts (already tracked)
- User status changes (block/unblock/tier change)
- Feature flag toggles
- Content publish/unpublish
- Ticket assignment/resolution
- Maintenance mode toggle
- Failed login attempts
- Bulk actions

---

### 11. INTEGRATIONS STATUS

Route: `/admin/integrations`

Status dashboard for all external services:

| Integration | Check | Display |
|---|---|---|
| Supabase | DB query test | Connected / Error + latency |
| Supabase Auth | Auth health | Active / Degraded |
| Supabase Storage | List buckets | Connected / Error |
| Stripe/Payments | Config check (key exists, not expired) | Configured / Not Set |
| Google Maps/Places | Config check | Configured / Not Set |
| Email provider | Config check | Configured / Not Set |
| SMS provider | Config check | Configured / Not Set |
| Analytics | Config check | Configured / Not Set |
| Vercel/Hosting | Deployment status if available | Deployed / Unknown |

- **Each card**: Service name, status dot, last checked, latency (where applicable)
- **Never expose API keys or secrets** — only show "Configured" or "Not Set" or last 4 chars masked
- **Manual "Test Connection" button** for each service
- Auto-refresh every 5 minutes

---

### 12. ADMIN ROLES & PERMISSIONS

Route: `/admin/roles`

Wire into existing `admin_users` table.

**Role definitions:**
| Role | Users | Tickets | Bugs | Content | Billing | Feature Flags | Logs | Security | Settings |
|---|---|---|---|---|---|---|---|---|---|
| Owner | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Admin | Full | Full | Full | Full | View | Full | View | View | None |
| Support | View | Full | Full | None | None | None | Own | None | None |
| Content Manager | None | None | None | Full | None | None | Own | None | None |
| Read-Only Viewer | View | View | View | View | View | View | View | None | None |

- **Admin list table**: Name, Email, Role, Status, Last Seen, Invited By, Actions
- **Invite new admin**: Email input + role selector → sends invite, creates `admin_users` row with status='review'
- **Change role**: Dropdown per row — **only Owner can change roles** — **confirmation modal + audit log**
- **Remove admin**: Sets status='disabled' — **confirmation modal + audit log** — does NOT delete the row
- **Self-protection**: Owner cannot demote themselves; last Owner cannot be removed

---

### 13. SECURITY CONTROLS

Route: `/admin/security`

- **Active sessions**: List all currently authenticated admin sessions (from Supabase auth)
- **Force sign out user**: Search user → force sign out — **confirmation modal + audit log**
- **Block/unblock account**: Search user → toggle block status — **confirmation modal + audit log**
- **Force password reset**: Search user → trigger password reset email — **confirmation modal**
- **Suspicious activity panel**: Show users with:
  - 5+ failed login attempts in last 1h
  - Login from new device/location (if tracked)
  - Rapid successive actions
- **Admin PIN management**:
  - View PIN status (set / not set) — never display the actual PIN
  - Reset PIN — **Owner only, confirmation modal**
- **2FA status board**: Show which admins have 2FA enabled (if Supabase auth supports it)
- **Rate limit warnings**: Show any users or IPs hitting rate limits

---

### 14. ANALYTICS

Route: `/admin/analytics`

Dashboard with chart cards (use recharts or a simple charting lib):

- **DAU / WAU / MAU**: Line chart, last 30 days
- **New signups**: Bar chart, daily for last 30 days
- **Conversion funnel**: Visitor → Signup → Free → Premium (horizontal funnel)
- **Most used categories**: Horizontal bar chart of activity category usage
- **"Surprise Me" usage**: Count of AI-generated ideas per day
- **Drop-off points**: Which pages have highest bounce (if page_views tracked)
- **Error trends**: Line chart of critical errors per day from `admin_activity_log`
- **Support ticket trends**: New tickets per day, resolution time average
- **Top searched terms**: If search queries are logged

Data source: query from existing tables (`profiles` for signups, `admin_activity_log` for errors, `support_tickets` for trends, `bookings` for activity). Use date-based aggregation queries.

---

### 15. MAINTENANCE MODE

Route: `/admin/maintenance`

- **Big toggle switch**: Maintenance mode ON / OFF — **double confirmation modal**
- **Custom message**: Text field for user-facing maintenance message (default: "We're performing scheduled maintenance. We'll be back shortly.")
- **Admin bypass**: When maintenance mode is on, admins can still access the app (check `admin_users` role)
- **Schedule maintenance window**: Start time + estimated duration → auto-enables/disables maintenance mode
- **Countdown banner**: Before scheduled maintenance, show a warning banner to all users (e.g., "Maintenance in 2 hours")
- **Status page URL**: Optional link to external status page

**New table needed:**
```sql
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by uuid references public.admin_users(user_id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed maintenance mode setting
insert into public.app_settings (key, value)
values ('maintenance_mode', '{"enabled": false, "message": "We are performing scheduled maintenance. We will be back shortly.", "scheduled_start": null, "scheduled_duration_minutes": null, "bypass_admin": true}')
on conflict (key) do nothing;
```

---

## DATABASE MIGRATION SUMMARY

Create a single new migration file. Tables to create (that don't already exist):

1. `admin_user_notes` — admin notes on user accounts
2. `bug_reports` — user-reported bugs with device info and screenshots
3. `support_reply_templates` — canned responses for ticket replies
4. `promo_codes` — promotional discount codes
5. `app_settings` — key-value app configuration (maintenance mode, etc.)

All tables must:
- Enable RLS
- Grant appropriate permissions to `authenticated`
- Create RLS policies scoped to admin roles (reference `admin_users` table)
- Include indexes on status/priority/foreign key columns

---

## ROLE-BASED ACCESS ENFORCEMENT

Every admin page must:
1. Check that the user has a row in `admin_users` with status='active'
2. Check that the user's role permits access to that page (see role matrix above)
3. If insufficient permissions, show a "You don't have permission to view this page" message — do NOT redirect away
4. All write actions must log to `admin_audit_log` or `admin_activity_log`
5. All destructive actions (delete, block, disable, toggle) require a confirmation modal
6. All confirmation modals must display what will happen and cannot be dismissed by clicking outside

---

## UI / UX REQUIREMENTS

- Use the existing design system: `bg-ink`, `text-cream`, `border-coral`, `shadow-brut`, `rounded-2xl`
- All tables must be **sortable**, **filterable**, and **paginated** (25 rows default)
- All tables must be **responsive** — collapse to card view on mobile
- Empty states: Show helpful messages with suggested actions, not blank screens
- Loading states: Skeleton loaders, not spinners
- Error states: Inline error messages with retry buttons
- Toast notifications for successful actions (e.g., "User tier updated", "Ticket resolved")
- Use Lucide icons consistently
- Sidebar should highlight the current active page
- Breadcrumb navigation on all detail/sub pages
- Global keyboard shortcut: `Cmd+K` / `Ctrl+K` to open admin search

---

## SERVER FUNCTIONS PATTERN

Follow the existing pattern from `admin-roles.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Use service role for admin operations
function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Always verify admin role before any operation
async function assertAdmin(userId: string) { ... }
async function assertRole(userId: string, roles: string[]) { ... }
```

Every server function must:
1. Use `requireSupabaseAuth` middleware
2. Call `assertAdmin` or `assertRole` before any data access
3. Use the service-role Supabase client for admin operations
4. Log sensitive actions to `admin_audit_log`

---

## WHAT NOT TO DO

- Do NOT expose API keys, secrets, or full connection strings anywhere in the UI
- Do NOT allow permanent deletion of any data without soft-delete first
- Do NOT allow destructive actions without confirmation modals
- Do NOT allow role changes without audit logging
- Do NOT create separate auth systems — use existing Supabase auth + `admin_users` table
- Do NOT break existing routes or features — this is additive
- Do NOT recreate tables that already exist (`support_tickets`, `feature_flags`, `content_items`, `admin_users`, `admin_activity_log`)
