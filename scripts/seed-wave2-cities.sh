#!/usr/bin/env bash
# Wave 2: Additional cities for Confetti venue seeding
# Usage: GOOGLE_PLACES_API_KEY=... bash scripts/seed-wave2-cities.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/data/venues"
mkdir -p "$OUTPUT_DIR"

CITIES=(
  # --- US Additions ---
  "Honolulu, HI"
  "San Juan, Puerto Rico"
  "Savannah, GA"
  "Charleston, SC"
  "St. Louis, MO"
  "Baltimore, MD"
  "Pittsburgh, PA"
  "Scottsdale, AZ"
  "Milwaukee, WI"
  "Raleigh, NC"
  # --- International Additions ---
  "Lisbon, Portugal"
  "Seoul, South Korea"
  "Bangkok, Thailand"
  "Cancún, Mexico"
  "Ibiza, Spain"
  "Singapore"
  "Milan, Italy"
  "Rio de Janeiro, Brazil"
  "Cape Town, South Africa"
  "Bali, Indonesia"
)

TOTAL=${#CITIES[@]}
COUNT=0
FAILED=()

echo "============================================"
echo "  Confetti Venue Seeder — Wave 2 — $TOTAL Cities"
echo "============================================"
echo ""

for CITY in "${CITIES[@]}"; do
  COUNT=$((COUNT + 1))
  SLUG=$(echo "$CITY" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
  OUTFILE="$OUTPUT_DIR/${SLUG}.json"

  echo "[$COUNT/$TOTAL] Seeding: $CITY → $OUTFILE"

  if node "$SCRIPT_DIR/find-top-venues.mjs" \
      --location "$CITY" \
      --limit 100 \
      --pages-per-query 1 \
      --out "$OUTFILE" 2>&1; then
    echo "  ✓ Done"
  else
    echo "  ✗ FAILED"
    FAILED+=("$CITY")
  fi

  sleep 2
  echo ""
done

echo "============================================"
echo "  Wave 2 Complete: $((TOTAL - ${#FAILED[@]}))/$TOTAL succeeded"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "  Failed: ${FAILED[*]}"
fi
echo "  Output dir: $OUTPUT_DIR"
echo "============================================"
