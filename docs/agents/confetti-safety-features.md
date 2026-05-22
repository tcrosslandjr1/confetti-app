# Confetti — Safety Features

The 7 guarantees on every social/group surface. Types in
`src/lib/agents/safety-features.ts` (`SafetyFeatures`, `SAFETY_DEFAULTS`).

| # | Feature | Default | Notes |
|---|---|---|---|
| 1 | Verified profiles | on | ID + selfie match required to host or join open groups |
| 2 | Private group invites | on | Link/code-only invites bypass discovery |
| 3 | Women-only / men-only / mixed | mixed | Host picks at group creation; enforced on RSVP |
| 4 | Public meetup locations | on | Residential addresses blocked at venue picker |
| 5 | Friend approval before joining | on | Host approves each request; auto-reject after 48h |
| 6 | Report / block tools | on | One-tap on every profile, group, message, reel |
| 7 | No exact address until accepted | on | Map shows neighborhood pin; full address revealed post-approval |

## Agent rules

- All 7 default to **on**. Hosts can only relax #3 (gender policy) and #5
  (approval) — the other 5 are non-negotiable.
- **Verified-only groups** are filtered into Discovery rail 1–2 first;
  unverified plans are hidden until the user verifies.
- **Public meetup enforcement**: venue picker must reject `place.types`
  containing `premise`, `street_address`, or `subpremise` without a
  business listing.
- **Address reveal trigger**: address + booking confirmation push happens
  on the same event as `friend_approval = accepted`.
- **Report flow**: 3 distinct reports on the same place_id within 30 days
  auto-blocks the venue from future plans in that city (see existing
  `blocked_place_ids_for_city` SQL function — same threshold).
- **Block effect**: blocked users cannot view, join, or be matched into
  any plan or group with the blocker, in any rail.
- Apply `SAFETY_DEFAULTS` to every new group/invite at creation.

## Cross-references

- `confetti-discovery-feed.md` — verified-only filtering on social rails
- `confetti-planner-inputs.md` — `SafetyPreferences` on the planner side
  (wellLit, accessible, women-friendly, etc.)
