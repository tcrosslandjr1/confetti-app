# Confetti — Discovery Feed

The 5 canonical rails on the home/discovery surface. Types in
`src/lib/agents/discovery-feed.ts` (`DISCOVERY_RAILS`).

| # | Rail | Match logic |
|---|---|---|
| 1 | People planning similar nights | Same occasion + vibe + city |
| 2 | Groups open to more people | Public plans with open invite seats |
| 3 | Date-night ideas nearby | Occasion = date-night, within ~10km |
| 4 | Trending plans in your city | Top saves/remixes in last 7 days, same city |
| 5 | Restaurants & events that match the vibe | Vibe-tag match; boosted venues first |

## Agent rules

- Always show all 5 rails when data is available; collapse empty rails.
- **Boosted venues prioritized** in rail 5 (Core memory: AI plans prioritize boosted venues).
- **Privacy**: rails 1–2 only surface plans where `visibility = public`. Never expose private plans, even anonymized.
- **Geo**: "nearby" = 10km default; user can widen via filter.
- **Freshness**: trending = rolling 7-day window; recompute hourly.
- **Cold start**: if user has no city/occasion yet, fall back to rail 4 (trending in detected city) only.
- **Cap**: max 8 cards per rail on first load; "see all" for full list.
- **Notification tie-in**: opening a card from rail 2 (open groups) can trigger an RSVP request — counts toward the 2/day cap.
