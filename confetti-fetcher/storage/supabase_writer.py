"""
Supabase Writer
================
Upserts enriched venue data into the venue_intel table.
Uses the service_role key (not anon) — runs from NAS, never client-side.
"""

import logging
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

log = logging.getLogger(__name__)

# Fields that map directly to venue_intel columns
DIRECT_FIELDS = [
    "place_id", "name", "category", "subcategory", "tags",
    "city", "neighborhood", "address", "latitude", "longitude",
    "phone", "website", "price_range", "hours", "description", "image_url",
    "google_rating", "google_review_count", "google_types",
    "yelp_id", "yelp_rating", "yelp_review_count", "yelp_url",
    "tiktok_mention_count", "tiktok_hashtags", "tiktok_video_urls", "tiktok_last_viral_at",
    "trending_score", "is_trending", "is_featured",
    "data_sources", "web_snippet",
    "manually_added", "curator_notes",
]


def _clean_venue_for_supabase(venue: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strip unknown fields, normalize types for Supabase/Postgres.
    """
    clean = {}
    for field in DIRECT_FIELDS:
        val = venue.get(field)
        if val is None:
            continue

        # Postgres JSONB fields
        if field in ("hours", "tiktok_video_urls"):
            if isinstance(val, (dict, list)):
                clean[field] = val
            elif isinstance(val, str):
                try:
                    clean[field] = json.loads(val)
                except Exception:
                    pass
        # Array fields
        elif field in ("tags", "google_types", "tiktok_hashtags", "data_sources"):
            if isinstance(val, list):
                clean[field] = [str(v) for v in val if v]
            elif isinstance(val, str):
                clean[field] = [v.strip() for v in val.split(",") if v.strip()]
        # Float fields
        elif field in ("latitude", "longitude", "google_rating", "yelp_rating", "trending_score"):
            try:
                clean[field] = float(val) if val is not None else None
            except (TypeError, ValueError):
                pass
        # Integer fields
        elif field in ("google_review_count", "yelp_review_count", "tiktok_mention_count"):
            try:
                clean[field] = int(val) if val is not None else 0
            except (TypeError, ValueError):
                clean[field] = 0
        # Boolean fields
        elif field in ("is_trending", "is_featured", "manually_added"):
            if isinstance(val, bool):
                clean[field] = val
            else:
                clean[field] = str(val).lower() in ("true", "yes", "1")
        else:
            clean[field] = str(val) if not isinstance(val, (str, int, float, bool)) else val

    # Always stamp last_fetched_at
    clean["last_fetched_at"] = datetime.now(timezone.utc).isoformat()

    # Generate place_id if missing
    if not clean.get("place_id") and clean.get("name"):
        import hashlib
        slug = clean["name"].lower().replace(" ", "_")[:30]
        city = (clean.get("city") or "dmv").lower()[:5]
        clean["place_id"] = f"manual_{city}_{slug}_{hashlib.md5(clean['name'].encode()).hexdigest()[:8]}"

    return clean


def upsert_venues_to_supabase(
    venues: List[Dict[str, Any]],
    supabase_url: str,
    service_key: str,
    batch_size: int = 100,
) -> int:
    """
    Upsert venues into Supabase venue_intel table.
    Uses place_id as the conflict key.
    Returns count of upserted records.
    """
    if not service_key or not supabase_url:
        log.error("Supabase credentials missing — skipping upload")
        return 0

    if not REQUESTS_AVAILABLE:
        log.error("requests library not available")
        return 0

    url = f"{supabase_url}/rest/v1/venue_intel"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    cleaned = [_clean_venue_for_supabase(v) for v in venues]
    # Filter out anything without a name
    cleaned = [v for v in cleaned if v.get("name")]

    total_upserted = 0
    for i in range(0, len(cleaned), batch_size):
        batch = cleaned[i : i + batch_size]
        try:
            resp = requests.post(url, headers=headers, json=batch, timeout=30)
            resp.raise_for_status()
            total_upserted += len(batch)
            log.info(f"Supabase upsert: batch {i//batch_size + 1} → {len(batch)} records")
        except Exception as e:
            log.error(f"Supabase upsert error (batch {i//batch_size + 1}): {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                log.error(f"Response: {e.response.text[:500]}")

    log.info(f"Supabase: {total_upserted}/{len(cleaned)} venues upserted")
    return total_upserted


def fetch_existing_supabase_ids(supabase_url: str, service_key: str) -> set:
    """
    Fetch all existing place_ids from Supabase.
    Used to avoid unnecessary re-processing.
    """
    url = f"{supabase_url}/rest/v1/venue_intel?select=place_id"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Range": "0-9999",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return {row["place_id"] for row in resp.json() if row.get("place_id")}
    except Exception as e:
        log.warning(f"Could not fetch existing Supabase IDs: {e}")
        return set()
