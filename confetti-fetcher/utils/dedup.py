"""
Venue Deduplication
====================
Fuzzy-matches venue names across sources (Google, Yelp, TikTok hints)
so the same venue doesn't get multiple rows.
"""

import re
from typing import List, Dict, Any, Optional

try:
    from rapidfuzz import fuzz
    FUZZY_AVAILABLE = True
except ImportError:
    FUZZY_AVAILABLE = False


def normalize_name(name: str) -> str:
    """Lowercase, strip common suffixes and punctuation for comparison."""
    name = name.lower().strip()
    # Remove common suffixes: DC, MD, VA, restaurant, bar, lounge, etc.
    remove = [
        r"\s+dc$", r"\s+md$", r"\s+va$", r"\s+washington$",
        r"\s+restaurant$", r"\s+bar$", r"\s+lounge$", r"\s+grill$",
        r"\s+kitchen$", r"\s+cafe$", r"\s+coffee$", r"\s+&\s+bar$",
        r"[^\w\s]",  # punctuation
    ]
    for pattern in remove:
        name = re.sub(pattern, "", name)
    return re.sub(r"\s+", " ", name).strip()


def fuzzy_match(name_a: str, name_b: str, threshold: int = 85) -> bool:
    """Return True if two venue names are likely the same place."""
    a = normalize_name(name_a)
    b = normalize_name(name_b)

    if a == b:
        return True

    if not FUZZY_AVAILABLE:
        # Fallback: simple substring check
        return a in b or b in a

    ratio = fuzz.ratio(a, b)
    partial = fuzz.partial_ratio(a, b)
    token_sort = fuzz.token_sort_ratio(a, b)

    return max(ratio, partial, token_sort) >= threshold


def merge_venue_data(base: Dict[str, Any], supplement: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge supplement data into base venue record.
    Base fields win for non-null values; supplement fills in missing fields.
    """
    merged = dict(base)

    for key, val in supplement.items():
        if val is None or val == "" or val == [] or val == {}:
            continue
        if key not in merged or merged[key] is None or merged[key] == "" or merged[key] == [] or merged[key] == {}:
            merged[key] = val
        elif key == "data_sources":
            merged[key] = list(set(merged.get(key, []) + (val or [])))
        elif key == "tags":
            merged[key] = list(set(merged.get(key, []) + (val or [])))
        elif key == "tiktok_hashtags":
            merged[key] = list(set(merged.get(key, []) + (val or [])))
        elif key == "tiktok_video_urls":
            existing = merged.get(key, [])
            new_urls = {v.get("url") for v in existing}
            for v in (val or []):
                if v.get("url") not in new_urls:
                    existing.append(v)
            merged[key] = existing
        elif key in ("google_rating", "yelp_rating") and merged.get(key) is None:
            merged[key] = val
        elif key in ("google_review_count", "yelp_review_count"):
            merged[key] = max(merged.get(key, 0) or 0, val or 0)
        elif key == "tiktok_mention_count":
            merged[key] = (merged.get(key) or 0) + (val or 0)
        elif key == "hours" and not merged.get("hours"):
            merged[key] = val
        elif key == "description" and not merged.get("description"):
            merged[key] = val

    return merged


def deduplicate_venues(venues: List[Dict[str, Any]], threshold: int = 85) -> List[Dict[str, Any]]:
    """
    Given a flat list of venue dicts (from all sources), merge duplicates.
    Uses place_id first (exact match), then fuzzy name matching.
    """
    deduped: List[Dict[str, Any]] = []

    for venue in venues:
        pid = venue.get("place_id", "")
        name = venue.get("name", "")
        lat  = venue.get("latitude")
        lng  = venue.get("longitude")
        merged = False

        for existing in deduped:
            # Exact place_id match
            if pid and existing.get("place_id") == pid:
                idx = deduped.index(existing)
                deduped[idx] = merge_venue_data(existing, venue)
                merged = True
                break

            # Fuzzy name match + proximity check (within ~200m)
            if name and fuzzy_match(name, existing.get("name", ""), threshold):
                # Check proximity if coords available
                if lat and lng and existing.get("latitude") and existing.get("longitude"):
                    dist = _approx_distance_m(lat, lng, existing["latitude"], existing["longitude"])
                    if dist > 500:  # same name but far apart = different venues
                        continue

                idx = deduped.index(existing)
                deduped[idx] = merge_venue_data(existing, venue)
                merged = True
                break

        if not merged:
            deduped.append(dict(venue))

    return deduped


def _approx_distance_m(lat1, lng1, lat2, lng2) -> float:
    """Approximate distance in meters between two lat/lng points (good enough for dedup)."""
    import math
    dlat = (lat2 - lat1) * 111_000
    dlng = (lng2 - lng1) * 111_000 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.sqrt(dlat**2 + dlng**2)
