/**
 * FIX: RSVP route ambiguity
 *
 * Problem: Two routes exist at the same path level:
 *   /rsvp/$tripId  (trip RSVP)
 *   /rsvp/$token   (corporate RSVP)
 *
 * TanStack Router can't tell which $param to match. The fix is to give
 * the corporate RSVP a distinct prefix.
 *
 * STEPS:
 * 1. RENAME src/routes/rsvp.$token.tsx → src/routes/rsvp_.invite.$token.tsx
 *    (In Lovable: create the new file, copy the code, delete the old one)
 *
 * 2. Inside the new file, change the route definition from:
 *
 *      export const Route = createFileRoute("/rsvp/$token")({
 *
 *    To:
 *
 *      export const Route = createFileRoute("/rsvp/invite/$token")({
 *
 * 3. Update any links that point to /rsvp/$token. Search your code for
 *    `/rsvp/${token}` or `to: "/rsvp/$token"` and change them to
 *    `/rsvp/invite/${token}` or `to: "/rsvp/invite/$token"`.
 *
 *    Files that likely need updating:
 *    - src/routes/plan.ready.tsx (generates RSVP links)
 *    - src/routes/group-outing.tsx
 *    - Any edge function that generates RSVP invite URLs
 *
 * Result: /rsvp/$tripId handles trip RSVPs, /rsvp/invite/$token handles
 * corporate invite RSVPs. No more ambiguity.
 */
