# Admin Center — Accounting & IT Support (Follow-Up Build)

## CONTEXT — What Already Exists

This is a **follow-up** to the Maintenance & Support Admin Center build. The admin layout, sidebar, PIN gate, and role system from that build are already in progress. These two new sections slot into the existing sidebar nav.

### Existing Tables to Wire Into (DO NOT recreate)

**Finance / Billing:**
- `transactions` — user_id, business_id, type (subscription/boost_purchase/coupon_redemption/refund/payout/tip/booking_fee), amount, currency, status (pending/completed/failed/refunded/disputed), stripe_payment_id, metadata
- `refund_requests` — transaction_id, user_id, amount, reason, description, status (pending/approved/denied/processed), reviewed_by, review_notes
- `payout_records` — business_id, business_name, amount, status (pending/approved/processing/completed/failed), period, transaction_count, approved_by
- `fraud_signals` — user_id, signal, severity (low/medium/high/critical), metadata
- `pricing_plans` — name, type (user/business/enterprise), model (free/flat/usage/tiered), price, billing_cycle (monthly/annual/one_time), features jsonb, limits jsonb, subscriber_count, mrr
- `pricing_experiments` — control_plan_id, variant_plan_id, with revenue tracking
- `user_subscriptions` — user_id, tier (free/black), confetti_balance, total_confetti_earned, plan_limit, outing_credit_balance, renews_at
- `advertiser_subscriptions` — advertiser_id, plan, status, stripe_customer_id, stripe_subscription_id
- `promo_codes` — (being created in the base build) code, discount_percent, max_uses, current_uses, expires_at
- `documents` — category (invoice/proposal/receipt/report/legal/marketing/other), file_path, file_name
- `contracts` — partner/business contracts with contract_value, payment_terms, status

**Operations / Incidents:**
- `incident_log` — title, severity (sev1/sev2/sev3/sev4), status (investigating/identified/monitoring/resolved/postmortem), timeline jsonb, started_at, resolved_at, root_cause, postmortem_url
- `system_alerts` — severity (info/warning/error/critical), title, description, service, metric, value, threshold, acknowledged, acknowledged_by
- `maintenance_windows` — title, scheduled_start, scheduled_end, actual_start, actual_end, status, affected_services
- `kill_switches` — service-level kill switches
- `circuit_breakers` — status, failure_threshold, cooldown
- `emergency_bans` — user_id, reason, banned_by, expires_at, is_permanent, appeal_status
- `admin_activity_log` — all admin actions with severity and metadata
- `admin_audit_log` — audit trail for sensitive operations

### Existing Code Patterns
- Server functions: `createServerFn` + `requireSupabaseAuth` + `assertAdmin` / `assertRole`
- Service role client: `adminClient()` with `SUPABASE_SERVICE_ROLE_KEY`
- Design system: `bg-ink`, `text-cream`, `border-coral`, `shadow-brut`, `rounded-2xl`, `font-display`, `font-mono`

---

## BUILD INSTRUCTIONS

Add these two sections to the Admin Center sidebar. Update the sidebar nav groups:

```
BUSINESS
  Plans & Billing
  Accounting          ← NEW
  Feature Flags

OPERATIONS
  System Health
  IT Support           ← NEW
  Integrations
  Maintenance Mode
```

---

### 16. ACCOUNTING

Route: `/admin/accounting`

This is a **one-person business command center** — Tyrone needs to see everything financial in one place without jumping between Stripe, Supabase, and spreadsheets.

#### 16A. Revenue Dashboard (default tab)

Top-level KPI cards:
| Metric | Source | Display |
|---|---|---|
| MRR (Monthly Recurring Revenue) | Sum `pricing_plans.mrr` where is_active=true | Dollar amount + trend arrow |
| Total Revenue (MTD) | Sum `transactions.amount` where status='completed' and created_at in current month | Dollar amount |
| Total Revenue (Last Month) | Same query, previous month | Dollar amount + % change |
| Active Subscribers | Count `user_subscriptions` where tier='black' | Count |
| Business Subscribers | Count `advertiser_subscriptions` where status='active' | Count |
| Outstanding Refunds | Count `refund_requests` where status='pending' | Count (red badge if >0) |
| Failed Payments (MTD) | Count `transactions` where status='failed' and current month | Count (red badge if >0) |
| Pending Payouts | Sum `payout_records` where status in ('pending','approved') | Dollar amount |

Charts (use recharts):
- **Revenue trend**: Line chart, daily totals for last 90 days from `transactions` where status='completed'
- **Revenue by type**: Stacked bar chart, grouped by `transactions.type` (subscription, boost_purchase, booking_fee, etc.) — last 12 weeks
- **Subscriber growth**: Line chart, cumulative `user_subscriptions` where tier='black', last 90 days
- **Churn tracker**: Users who had tier='black' and downgraded to 'free' per week

#### 16B. Transactions Tab

Route: `/admin/accounting/transactions`

- **Transaction table**: Date, User/Business, Type, Amount, Currency, Status, Stripe ID (last 8 chars masked), Actions
- **Filters**: type, status, date range, amount range (min/max), user search
- **Sort**: newest first (default), amount high/low
- **Click row → Transaction detail slide-over**:
  - Full transaction details
  - User/business card (linked to user management)
  - Stripe payment ID (full, copyable)
  - Metadata jsonb viewer
  - Related refund requests if any
  - **Actions**: Initiate refund (creates `refund_requests` row), add internal note (logs to `admin_activity_log` with entity_type='transaction')
- **Export**: Download filtered transactions as CSV
- **Totals bar**: Show sum of filtered results (total amount, count)

#### 16C. Refunds & Disputes Tab

Route: `/admin/accounting/refunds`

- **Refund queue table**: Date, User, Transaction, Amount, Reason, Status, Reviewer, Actions
- **Filters**: status (pending/approved/denied/processed), date range
- **Click row → Refund detail slide-over**:
  - Original transaction details
  - Refund amount and reason
  - User profile card
  - Review section: approve/deny with notes — **confirmation modal**
  - Processing status tracker: pending → approved → processed
  - All actions log to `admin_audit_log`
- **Dispute tracker**: Show `transactions` where status='disputed' — with timeline and resolution notes

#### 16D. Payouts Tab

Route: `/admin/accounting/payouts`

- **Payout table**: Business Name, Amount, Period, Transaction Count, Status, Requested, Approved By, Actions
- **Filters**: status, date range, business search
- **Click row → Payout detail slide-over**:
  - Business account card
  - Itemized transactions in this payout period
  - Approval workflow: pending → approved → processing → completed/failed
  - Approve/reject buttons — **confirmation modal + audit log**
  - Processing notes field

#### 16E. Fraud & Risk Tab

Route: `/admin/accounting/fraud`

- **Fraud signals table**: Date, User, Signal, Severity, Details
- **Filters**: severity, date range, signal type
- **Severity color coding**: low=neutral, medium=yellow, high=orange, critical=red
- **Click row → User profile** (opens user management slide-over)
- **Actions**: Block user, flag for review, dismiss signal — all log to `admin_audit_log`
- **High-risk summary**: Top card showing count of critical+high signals in last 7 days

#### 16F. Plans & Pricing Tab

Route: `/admin/accounting/plans`

Wire into `pricing_plans` table:
- **Plan cards**: Show each active plan — name, type, model, price, billing_cycle, subscriber_count, MRR
- **Edit plan**: Modify price, features, limits — **confirmation modal** ("This will affect X subscribers")
- **Create new plan**: Form with all fields
- **Deactivate plan**: Sets is_active=false — **confirmation modal + audit log**
- **Pricing experiments**: Show active `pricing_experiments` with control vs variant metrics

#### 16G. Invoices & Documents Tab

Route: `/admin/accounting/documents`

Wire into `documents` table (category='invoice' or 'receipt' or 'report'):
- **Document list**: Title, Category, Business/Partner, Date, Size, Actions
- **Filters**: category, date range, business
- **Upload document**: File upload to Supabase Storage + create `documents` row
- **Download**: Direct download link
- **Quick generate**: Button to generate a simple invoice PDF from transaction data (use a template)

#### 16H. Financial Reports Tab

Route: `/admin/accounting/reports`

Pre-built report generators — each produces a filterable table + optional CSV export:

| Report | Data Source | Filters |
|---|---|---|
| P&L Summary | `transactions` grouped by type, income vs expense | Date range |
| Revenue by Customer | `transactions` grouped by user_id/business_id | Date range, top N |
| Subscription Report | `user_subscriptions` + `advertiser_subscriptions` | Status, tier |
| Refund Report | `refund_requests` with outcomes | Date range, status |
| Payout Report | `payout_records` by business | Date range, status |
| Promo Code Usage | `promo_codes` with `coupon_redemptions` | Active/inactive |
| Tax Summary | `transactions` where status='completed', grouped by month | Year, quarter |

Each report shows:
- Summary KPI cards at top
- Sortable/filterable data table
- Export to CSV button
- Date range selector (default: current month)

---

### 17. IT SUPPORT

Route: `/admin/it-support`

Internal technical operations center — for tracking infrastructure problems, self-service IT needs, and incident management. This is separate from user-facing support tickets.

#### 17A. Dashboard (default view)

Top-level status cards:
| Card | Source | Display |
|---|---|---|
| Open Incidents | Count `incident_log` where status not in ('resolved','postmortem') | Count (red if sev1/sev2 open) |
| Active Alerts | Count `system_alerts` where acknowledged=false | Count (red if critical) |
| Open IT Tickets | Count `it_tickets` where status in ('open','in_progress') | Count |
| System Status | Aggregate from alerts + incidents | Green/Yellow/Red dot |
| Active Kill Switches | Count `kill_switches` where is_active=true | Count (red if >0) |
| Tripped Circuit Breakers | Count `circuit_breakers` where status='open' | Count (red if >0) |

**Recent activity feed**: Last 15 entries from `admin_activity_log` where entity_type in ('incident','alert','it_ticket','kill_switch','circuit_breaker')

#### 17B. Incidents Tab

Route: `/admin/it-support/incidents`

Wire into existing `incident_log` table:

- **Incident list**: ID, Title, Severity (sev1-4), Status, Started, Duration, Root Cause, Actions
- **Severity badges**: sev1=red pulsing, sev2=orange, sev3=yellow, sev4=neutral
- **Filters**: severity, status, date range
- **Create new incident button** → Form:
  - Title (required)
  - Severity selector (sev1-4) with impact descriptions:
    - sev1: "Complete outage — all users affected"
    - sev2: "Major feature broken — many users affected"
    - sev3: "Minor feature degraded — some users affected"
    - sev4: "Cosmetic/low-impact — minimal user effect"
  - Affected services checkboxes
  - Initial timeline entry (auto-timestamped)
- **Click incident → Incident detail page**:
  - Header: title, severity badge, status badge, duration counter (live if active)
  - **Timeline**: Chronological entries from `timeline` jsonb — each with timestamp, description, who added it
  - **Add timeline entry**: Text input + submit → appends to timeline jsonb array
  - **Status workflow buttons**: investigating → identified → monitoring → resolved → postmortem
  - **Root cause**: Text field, editable until postmortem status
  - **Postmortem URL**: Link field for external postmortem doc
  - **Impact summary**: Affected services, estimated users impacted, duration
  - **Related alerts**: Show `system_alerts` created during the incident window
  - All status changes log to `admin_audit_log`

#### 17C. System Alerts Tab

Route: `/admin/it-support/alerts`

Wire into existing `system_alerts` table:

- **Alert list**: Timestamp, Severity, Title, Service, Metric, Value vs Threshold, Acknowledged, Actions
- **Severity color coding**: info=blue, warning=yellow, error=orange, critical=red
- **Filters**: severity, service, acknowledged/unacknowledged, date range
- **Quick actions**:
  - Acknowledge alert → sets acknowledged=true, acknowledged_by=current admin
  - Resolve alert → sets resolved_at=now()
  - Create incident from alert → pre-fills new incident form with alert details
- **Click alert → Detail slide-over**:
  - Full alert details
  - Service and metric context
  - Value vs threshold visualization (simple bar or gauge)
  - Related incidents if any
  - Resolution notes

#### 17D. IT Helpdesk Tab

Route: `/admin/it-support/helpdesk`

Internal ticket system for the Confetti team (just Tyrone for now, but built to scale). This is for self-tracking IT tasks — password resets, tooling changes, access requests, config changes, tech debt items.

**New table needed:**
```sql
create table if not exists public.it_tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'general'
    check (category in ('access','tooling','infrastructure','config','tech_debt','security','other')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','critical')),
  status text not null default 'open'
    check (status in ('open','in_progress','blocked','resolved','closed')),
  created_by uuid not null references public.admin_users(user_id) on delete cascade,
  assigned_to uuid references public.admin_users(user_id) on delete set null,
  resolution text,
  resolved_at timestamptz,
  due_date date,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_it_tickets_status on public.it_tickets(status);
create index idx_it_tickets_priority on public.it_tickets(priority);
create index idx_it_tickets_category on public.it_tickets(category);
create index idx_it_tickets_assigned on public.it_tickets(assigned_to);
```

- **Ticket list**: ID, Title, Category, Priority, Status, Due Date, Created, Actions
- **Filters**: category, priority, status, date range
- **Quick-add ticket**: Inline form at top — title, category, priority, description → creates ticket instantly
- **Click ticket → Ticket detail page**:
  - Title, description (editable)
  - Category, priority, status dropdowns (inline editable)
  - Due date picker
  - Tags (add/remove)
  - Resolution notes field (shown when resolving)
  - Activity log: changes to this ticket from `admin_activity_log`
  - **Status workflow**: open → in_progress → resolved / blocked → resolved → closed
  - All changes log to `admin_activity_log` with entity_type='it_ticket'
- **Kanban view toggle**: Switch between table view and kanban board (columns: Open, In Progress, Blocked, Resolved)
- **Bulk actions**: Change status, change priority

#### 17E. Emergency Controls Tab

Route: `/admin/it-support/emergency`

Wire into existing `kill_switches` and `circuit_breakers` tables:

- **Kill Switches section**:
  - List all kill switches: Name, Service, Status (active/inactive), Last Toggled
  - Big red toggle to activate — **double confirmation modal** ("This will disable [service] for all users. Are you sure?")
  - Green toggle to deactivate — **confirmation modal**
  - All toggles log to `admin_audit_log` with severity='critical'

- **Circuit Breakers section**:
  - List all circuit breakers: Name, Status (closed/open/half_open), Failure Count, Threshold, Last Failure, Cooldown
  - Status badges: closed=green, half_open=yellow, open=red
  - Manual reset button for open breakers — **confirmation modal**
  - Auto-refresh every 30 seconds

- **Emergency Bans section**:
  - Wire into `emergency_bans` table
  - Active bans list: User, Reason, Banned By, Date, Permanent?, Appeal Status
  - Create emergency ban: Search user → reason → permanent/temporary (with expiry) — **confirmation modal**
  - Lift ban button — **confirmation modal + audit log**

---

## DATABASE MIGRATION SUMMARY

Create one new table (add to the migration from the base build or create a new migration):

1. `it_tickets` — internal IT helpdesk tickets

RLS policy:
```sql
alter table public.it_tickets enable row level security;
create policy "Admins manage IT tickets" on public.it_tickets for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid() and status = 'active'));
```

All other tables already exist — this build only wires admin UI into them.

---

## SIDEBAR NAV UPDATE

Add these items to the admin sidebar navigation built in the base prompt:

```
BUSINESS
  Plans & Billing
  Accounting           ← badge: pending refund count
  Feature Flags

OPERATIONS
  System Health
  IT Support            ← badge: open incidents + unacknowledged alerts
  Integrations
  Maintenance Mode
```

Update `useAdminNavCounts` to include:
- `pendingRefunds`: count from `refund_requests` where status='pending'
- `openIncidents`: count from `incident_log` where status not in ('resolved','postmortem')
- `unacknowledgedAlerts`: count from `system_alerts` where acknowledged=false
- `openItTickets`: count from `it_tickets` where status in ('open','in_progress')

---

## ROLE-BASED ACCESS

| Section | Owner | Admin | Support | Content Manager | Read-Only |
|---|---|---|---|---|---|
| Accounting — all tabs | Full | View | None | None | View |
| Accounting — refund approval | Full | None | None | None | None |
| Accounting — payout approval | Full | None | None | None | None |
| IT Support — all tabs | Full | Full | View | None | View |
| IT Support — kill switches | Full | Full | None | None | None |
| IT Support — emergency bans | Full | Full | None | None | None |
| IT Support — create incident | Full | Full | View | None | None |

Only **Owner** can approve refunds and payouts. This is a one-person business — keep it locked down.

---

## WHAT NOT TO DO

- Do NOT recreate `transactions`, `refund_requests`, `payout_records`, `fraud_signals`, `pricing_plans`, `incident_log`, `system_alerts`, `kill_switches`, `circuit_breakers`, `emergency_bans`, or `documents` — they all exist
- Do NOT expose full Stripe payment IDs in tables — show last 8 chars, full in detail view only
- Do NOT allow refund/payout approvals without double confirmation
- Do NOT auto-delete anything — all deletions must be soft (status changes)
- Do NOT break the existing admin layout from the base build — these are additive sections
