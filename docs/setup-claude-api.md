# Setting Up Claude API for Confetti Feed

The `ai-recommend` Edge Function uses Claude (Anthropic) to power personalized venue recommendations in the feed.

## Step 1: Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

## Step 2: Add the Secret to Supabase

Run this from your project root (requires Supabase CLI):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Or via the Supabase Dashboard:
1. Go to your project → **Edge Functions** → **Manage Secrets**
2. Add: `ANTHROPIC_API_KEY` = your key

## Step 3: Deploy the Edge Function

```bash
supabase functions deploy ai-recommend
```

## Step 4: Verify It Works

```bash
curl -X POST "https://YOUR-PROJECT.supabase.co/functions/v1/ai-recommend" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "city": "Washington DC",
    "lat": 38.9072,
    "lng": -77.0369,
    "sections": ["trending", "picks"],
    "limit": 3
  }'
```

## Required Secrets Summary

| Secret | Source | Purpose |
|--------|--------|---------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Claude AI recommendations |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console | Venue search candidates |
| `SUPABASE_URL` | Auto-set by Supabase | Internal API calls |
| `SUPABASE_ANON_KEY` | Auto-set by Supabase | Auth validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-set by Supabase | DB access |

## How It Works

```
User opens feed
    → Frontend calls /functions/v1/ai-recommend
        → Edge Function fetches user's taste profile from DB
        → Searches Google Places for venue candidates near user
        → Sends candidates + taste profile to Claude API
        → Claude ranks & selects best matches with personalized reasons
        → Returns structured JSON for each feed section
    → Frontend renders Trending / Picks / Events cards
```

## Cost Estimate

- Claude Sonnet: ~$3/million input tokens, ~$15/million output tokens
- Each feed load ≈ 1,500 input + 500 output tokens ≈ $0.01
- 1,000 daily users × 3 loads/day = ~$90/month at scale

## Frontend Integration

```typescript
import { fetchFeedRecommendations, getUserLocation } from "@/lib/agents/feed-recommendations";

// In your feed component:
const location = await getUserLocation();
const feed = await fetchFeedRecommendations({
  lat: location?.lat,
  lng: location?.lng,
  city: "Washington DC", // fallback
  sections: ["trending", "picks", "events"],
  limit: 4,
});

// feed.trending  → VenueCard[] for "Trending venues"
// feed.picks     → VenueCard[] for "For you"
// feed.events    → EventCard[] for "Starting soon"
// feed.surprise  → VenueCard[] for "Try something new"
```
