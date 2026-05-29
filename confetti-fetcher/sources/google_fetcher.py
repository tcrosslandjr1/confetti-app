"""
Google Places Fetcher
======================
Fetches venue data from Google Places API (New) for each DMV location + category.
Requires a Google Places API key with Places API enabled.
Get one: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
"""

import requests
import logging
import time
from typing import List, Dict, Any

log = logging.getLogger(__name__)

PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"
PLACES_TEXT_URL   = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,places.location,"
    "places.rating,places.userRatingCount,places.priceLevel,places.primaryType,"
    "places.types,places.nationalPhoneNumber,places.websiteUri,"
    "places.currentOpeningHours,places.editorialSummary,places.photos"
)

PRICE_MAP = {
    "PRICE_LEVEL_FREE": "$",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}


def fetch_nearby_places(
    lat: float,
    lng: float,
    radius_m: int,
    place_types: List[str],
    query: str,
    api_key: str,
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """Fetch places near a lat/lng for given types."""
    if not api_key:
        log.warning("No Google Places API key — skipping")
        return []

    payload = {
        "includedTypes": place_types[:5],  # API limit: 50, but keep focused
        "maxResultCount": min(max_results, 20),
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius_m),
            }
        },
    }

    try:
        resp = requests.post(
            PLACES_NEARBY_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        log.error(f"Google Places nearby error: {e}")
        return []

    return [_normalize_place(p) for p in data.get("places", [])]


def fetch_text_search(
    query: str,
    location_label: str,
    lat: float,
    lng: float,
    api_key: str,
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """Text search: 'best brunch spots in Washington DC'."""
    if not api_key:
        return []

    full_query = f"{query} in {location_label}"
    payload = {
        "textQuery": full_query,
        "maxResultCount": min(max_results, 20),
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 20000.0,
            }
        },
    }

    try:
        resp = requests.post(
            PLACES_TEXT_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        log.error(f"Google Places text search error ({full_query}): {e}")
        return []

    places = [_normalize_place(p) for p in data.get("places", [])]
    log.info(f"Google [{full_query}]: {len(places)} results")
    return places


def _normalize_place(p: dict) -> Dict[str, Any]:
    """Normalize Google Places API v1 response to our internal format."""
    loc = p.get("location", {})
    hours_raw = p.get("currentOpeningHours", {})
    hours = {}
    if "weekdayDescriptions" in hours_raw:
        days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
        for i, desc in enumerate(hours_raw["weekdayDescriptions"]):
            if i < len(days):
                # "Monday: 11:00 AM – 10:00 PM" → "11:00 AM – 10:00 PM"
                hours[days[i]] = desc.split(": ", 1)[-1] if ": " in desc else desc

    photo_url = ""
    photos = p.get("photos", [])
    if photos:
        name = photos[0].get("name", "")
        if name:
            photo_url = f"https://places.googleapis.com/v1/{name}/media?maxWidthPx=800"

    summary = p.get("editorialSummary", {})
    description = summary.get("text", "") if isinstance(summary, dict) else ""

    return {
        "place_id": p.get("id", ""),
        "name": p.get("displayName", {}).get("text", ""),
        "address": p.get("formattedAddress", ""),
        "latitude": loc.get("latitude"),
        "longitude": loc.get("longitude"),
        "google_rating": p.get("rating"),
        "google_review_count": p.get("userRatingCount", 0),
        "price_range": PRICE_MAP.get(p.get("priceLevel", ""), None),
        "google_types": p.get("types", []),
        "phone": p.get("nationalPhoneNumber", ""),
        "website": p.get("websiteUri", ""),
        "hours": hours,
        "description": description,
        "image_url": photo_url,
        "data_sources": ["google"],
    }


def fetch_all_google_data(
    categories: dict,
    locations: list,
    api_key: str,
    results_per_query: int = 20,
    sleep_between: float = 0.5,
) -> Dict[str, List[Dict]]:
    """
    Fetch Google Places data for all categories × all locations.
    Returns: {category_name: [place_dicts]}
    """
    results = {}
    for category, cfg in categories.items():
        cat_places = []
        seen_ids = set()

        for loc in locations:
            # Text search queries
            for query in cfg.get("google_queries", [])[:3]:  # limit API calls
                places = fetch_text_search(
                    query, loc["label"], loc["lat"], loc["lng"],
                    api_key, results_per_query
                )
                for p in places:
                    pid = p.get("place_id", "")
                    if pid and pid not in seen_ids:
                        p["city"] = loc["city"]
                        cat_places.append(p)
                        seen_ids.add(pid)
                time.sleep(sleep_between)

        results[category] = cat_places
        log.info(f"Google [{category}]: {len(cat_places)} unique places")

    return results
