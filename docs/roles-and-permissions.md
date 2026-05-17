# Roles & UI Authorization

## `has_role(_user_id uuid, _role app_role) → boolean`

SECURITY DEFINER function in `public`. Returns `true` iff a row exists in
`public.user_roles` matching the user and role. Stable, search_path locked
to `public`. EXECUTE granted to `authenticated` only — `anon`/`PUBLIC` cannot
call it.

Source of truth for every role check, server- and client-side.

### Roles

| Role       | Source                           | Granted by                       |
| ---------- | -------------------------------- | -------------------------------- |
| `admin`    | `user_roles` row, `role='admin'` | Admin via `admins manage roles`. |
| `customer` | Implicit on signup (trigger)     | `handle_new_user_role`.          |
| `visitor`  | No session                       | n/a                              |

The app currently distinguishes only `admin` from non-admin server-side. The
`viewAs` value `business` is a UI preview filter, **not** a server role.

## Server invariants (RLS)

Any policy that authorizes a privileged action MUST use
`public.has_role(auth.uid(), '<role>'::app_role)`. Examples in the schema:

- `bookings`, `venues`, `referral_rewards`, `marquee_sponsorships`,
  `featured_content`, `viral_venues`, `booking_notification_deliveries`,
  `oauth_credential_submissions`, `user_roles` — admin-only writes go through
  `has_role(auth.uid(), 'admin')`.
- Owner-or-admin reads/writes (e.g. `ad_campaigns`, `advertisers`) combine
  `has_role(...)` with an ownership predicate.

Never grant EXECUTE on `has_role` to `anon` or `PUBLIC`. Never re-implement
the role check in application code by querying `user_roles` directly from
client-side mutations — always rely on RLS + this function.

## Client invariants (UX)

The UI MUST NOT render an action the current user cannot authorize on the
server. This prevents 403 round-trips, broken affordances, and information
leaks about admin tooling.

Use the supplied helpers — never inline `supabase.from('user_roles')…`:

```tsx
import { RoleGate, useHasRole } from "@/components/RoleGate";

// Hide a button entirely
<RoleGate role="admin">
  <Button onClick={deleteVenue}>Delete venue</Button>
</RoleGate>;

// Or branch imperatively
const { ok: isAdmin } = useHasRole("admin");
if (!isAdmin) return null;
```

`AuthProvider` (`src/lib/auth-context.tsx`) performs the single canonical
lookup against `user_roles` on session change and exposes `isAdmin`. All gates
read from that context, so role changes propagate consistently.

### Required gates (audit checklist)

When adding a new privileged action, before merging:

1. The mutation/edge function is protected by an RLS policy that calls
   `has_role(auth.uid(), '<role>')`.
2. Every entry point that triggers it (button, menu item, link, route) is
   wrapped in `<RoleGate role="…">` or hidden by `useHasRole`.
3. The route itself, if admin-only, is mounted under a guard equivalent to
   `src/routes/admin.tsx` (redirects non-admins on load).
4. No copy on public marketing pages references admin-only tooling.
