# Live Route Intelligence

TimeApp can now call a Supabase Edge Function for live leave-time planning.

The app sends the current Confetti stops to `route-intelligence`, then the function can:

- calculate traffic-aware drive times with TomTom
- enrich venue details through OpenStreetMap/Nominatim
- return leave-by times that include traffic, parking search, valet, and arrival buffer
- keep provider secrets off the frontend

## Frontend env

Copy `.env.example` to `.env.local` and set:

```bash
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-or-publishable-key"
```

If these are missing, the UI falls back to the built-in demo route plan.

## Supabase secret

Set the TomTom key as an Edge Function secret:

```bash
supabase secrets set TOMTOM_API_KEY="your-tomtom-key" --project-ref your-project-ref
```

Without `TOMTOM_API_KEY`, the function still returns OpenStreetMap venue enrichment and cached/fallback route timing.

## Deploy

```bash
supabase functions deploy route-intelligence --project-ref your-project-ref
```

## Local invoke shape

```json
{
  "stops": [
    {
      "name": "Atelier Sol",
      "time": "6:30 PM",
      "area": "Georgetown",
      "address": "3050 K Street NW, Washington, DC"
    }
  ]
}
```
