#!/usr/bin/env bash
# Seed top venues for all major cities
# Usage: GOOGLE_PLACES_API_KEY=... bash scripts/seed-all-cities.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/data/venues"
mkdir -p "$OUTPUT_DIR"

CITIES=(
  # --- US Major Cities ---
  "Washington, DC"
  "New York City, NY"
  "Los Angeles, CA"
  "Chicago, IL"
  "Miami, FL"
  "Houston, TX"
  "Atlanta, GA"
  "San Francisco, CA"
  "Las Vegas, NV"
  "Dallas, TX"
  "Philadelphia, PA"
  "Boston, MA"
  "Seattle, WA"
  "Denver, CO"
  "Nashville, TN"
  "Austin, TX"
  "New Orleans, LA"
  "San Diego, CA"
  "Portland, OR"
  "Minneapolis, MN"
  "Detroit, MI"
  "Charlotte, NC"
  "Phoenix, AZ"
  "Tampa, FL"
  "Orlando, FL"
  # --- International ---
  "London, England"
  "Paris, France"
  "Tokyo, Japan"
  "Dubai, UAE"
  "Toronto, Canada"
  "Mexico City, Mexico"
  "Barcelona, Spain"
  "Berlin, Germany"
  "Amsterdam, Netherlands"
  "Sydney, Australia"
)

TOTAL=${#CITIES[@]}
COUNT=0
FAILED=()

echo "============================================"
echo "  Confetti Venue Seeder — $TOTAL Cities"
echo "============================================"
echo ""

for CITY in "${CITIES[@]}"; do
  COUNT=$((COUNT + 1))
  # Create a filename-safe slug
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

  # Brief pause to stay friendly with rate limits
  sleep 2
  echo ""
done

echo "============================================"
echo "  Complete: $((TOTAL - ${#FAILED[@]}))/$TOTAL succeeded"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "  Failed: ${FAILED[*]}"
fi
echo "  Output dir: $OUTPUT_DIR"
echo "============================================"
