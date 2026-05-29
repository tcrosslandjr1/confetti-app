"""
Yelp Fusion API Fetcher
========================
Fetches business data from Yelp for DMV categories.
Get a free API key: https://fusion.yelp.com
"""

import requests
import logging
import time
from typing import List, Dict, Any

log = logging.getLogger(__name__)

YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search"

PRICE_MAP = {
    "1": "$",
    "2": "$$",
    "3": "$$$",
    "4": "$$$$",
}

DMV_YELP_LOCATIONS = [
    {"city": "DC",       "location": "Washington, DC"},
    {"city": "Maryland", "location": "Bethesda, MD"},
    {"city": "Maryland", "location": "Silver Spring, MD"},
    {"city": "Maryland", "location": "College Park, MD"},
    {"city": "Maryland", "location": "Annapolis, MD"},
    {"city": "Virginia", "location": "Arlington, VA"},
    {"city": "Virginia", "location": "Alexandria, VA"},
    {"city": "Virginia", "location": "Tysons, VA"},
    {"city": "Virginia", "location": "Reston, VA"},
]


def fetch_yelp_businesses(
    term: str,
    location: str,
    api_key: str,
    limit: int = 20,
    sort_by: str = "rating",  # rating | review_count | distance | best_match
) -> List[Dict[str, Any]]:
    """Search Yelp for businesses."""
    if not api_key:
        log.warning("No Yelp API key — skipping")
        return []

    params = {
        "term": term,
        "location": location,
        "limit": min(limit, 50),
        "sort_by": sort_by,
    }

    try:
        resp = requests.get(
            YELP_SEARCH_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        log.error(f"Yelp error ({term} in {location}): {e}")
        return []

    businesses = [_normalize_business(b) for b in data.get("businesses", [])]
    log.info(f"Yelp [{term} / {location}]: {len(businesses)} results")
    return businesses


def _normalize_business(b: dict) -> Dict[str, Any]:
    """Normalize Yelp business to our internal format."""
    loc = b.get("location", {})
    coords = b.get("coordinates", {})
    categories = b.get("categories", [])
    tags = [c.get("alias", "") for c in categories]
    hours_raw = b.get("hours", [])
    hours = {}
    if hours_raw:
        day_map = {0:"monday",1:"tuesday",2:"wednesday",3:"thursday",4:"friday",5:"saturday",6:"sunday"}
        for period in hours_raw[0].get("open", []):
            day = day_map.get(period.get("day", -1), "")
            if day:
                start = period.get("start", "")
                end   = period.get("end", "")
                if start and end:
                    def fmt(t):
                        h, m = int(t[:2]), int(t[2:])
                        suffix = "AM" if h < 12 else "PM"
                        h = h if h <= 12 else h - 12
                        h = h if h != 0 else 12
                        return f"{h}:{m:02d} {suffix}"
                    hours[day] = f"{fmt(start)} – {fmt(end)}"

    address_parts = [
        loc.get("address1", ""),
        loc.get("city", ""),
        loc.get("state", ""),
        loc.get("zip_code", ""),
    ]
    address = ", ".join(p for p in address_parts if p)

    return {
        "yelp_id": b.get("id", ""),
        "name": b.get("name", ""),
        "address": address,
        "latitude": coords.get("latitude"),
        "longitude": coords.get("longitude"),
        "yelp_rating": b.get("rating"),
        "yelp_review_count": b.get("review_count", 0),
        "yelp_url": b.get("url", ""),
        "price_range": PRICE_MAP.get(str(b.get("price", "")), None),
        "phone": b.get("display_phone", ""),
        "website": b.get("url", ""),
        "image_url": b.get("image_url", ""),
        "tags": tags,
        "hours": hours,
        "data_sources": ["yelp"],
    }


def fetch_all_yelp_data(
    categories: dict,
    api_key: str,
    results_per_query: int = 20,
    sleep_between: float = 0.3,
) -> Dict[str, List[Dict]]:
    """
    Fetch Yelp data for all categories × all DMV locations.
    Returns: {category_name: [business_dicts]}
    """
    results = {}
    for category, cfg in categories.items():
        cat_businesses = []
        seen_ids = set()

        for term in cfg.get("yelp_terms", [])[:2]:  # limit API calls
            for loc in DMV_YELP_LOCATIONS:
                businesses = fetch_yelp_businesses(
                    term, loc["location"], api_key,
                    results_per_query, sort_by="review_count"
                )
                for b in businesses:
                    bid = b.get("yelp_id", "")
                    if bid and bid not in seen_ids:
                        b["city"] = loc["city"]
                        cat_businesses.append(b)
                        seen_ids.add(bid)
                time.sleep(sleep_between)

        results[category] = cat_businesses
        log.info(f"Yelp [{category}]: {len(cat_businesses)} unique businesses")

    return results
