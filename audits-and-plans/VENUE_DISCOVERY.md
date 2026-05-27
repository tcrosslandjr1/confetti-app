# Venue Discovery

This project includes a Google Places-powered collector for finding the top 100 popular venues in a city or region across the full TimeApp fun-sector taxonomy: dining, nightlife, entertainment, culture, immersive experiences, outdoors, recreation, wellness, markets, family, date night, groups, viral eats, luxury, classes, seasonal events, local exploration, and adult after-dark experiences.

## Run it

```bash
GOOGLE_PLACES_API_KEY="your-api-key" npm run find:venues -- --location "Washington, DC"
```

By default, this writes `top-venues.json` in the project root.

## Useful options

```bash
npm run find:venues -- \
  --location "Brooklyn, NY" \
  --limit 100 \
  --min-reviews 50 \
  --pages-per-query 2 \
  --out data/brooklyn-top-venues.json
```

## How ranking works

The script de-duplicates Google Places results and ranks each venue with a popularity score based on:

- rating
- review volume
- how many category searches matched the venue
- whether it has complete profile links such as Google Maps and a website

The output JSON includes the original rating, review count, address, coordinates, Google Maps URL, website URL, place types, matched queries, and popularity score.
