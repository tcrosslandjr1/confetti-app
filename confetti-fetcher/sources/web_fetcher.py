"""
Web Search Fetcher — Bright Data SERP API
==========================================
Searches Google/Bing for DMV venue articles, lists, blogs.
Extracts venue name hints from search snippets and titles.
"""

import requests
import logging
import re
import time
from typing import List, Dict, Any

log = logging.getLogger(__name__)

BRIGHTDATA_SERP_URL = "https://api.brightdata.com/serp/google/search"


def fetch_web_search(
    query: str,
    api_key: str,
    num_results: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search Google via Bright Data SERP API.
    Returns list of {title, url, snippet, venue_hints}
    """
    if not api_key:
        log.warning("No Bright Data API key — skipping web search")
        return []

    try:
        resp = requests.get(
            BRIGHTDATA_SERP_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            params={
                "q": query,
                "num": num_results,
                "gl": "us",
                "hl": "en",
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        log.error(f"Web search error ({query}): {e}")
        return []

    results = []
    for item in data.get("organic_results", []):
        title   = item.get("title", "")
        snippet = item.get("snippet", "")
        url     = item.get("link", "")
        results.append({
            "title": title,
            "url": url,
            "snippet": snippet,
            "venue_hints": _extract_venue_names(title + " " + snippet),
        })

    log.info(f"Web [{query}]: {len(results)} results")
    return results


def _extract_venue_names(text: str) -> List[str]:
    """
    Extract likely venue names from search result text.
    Uses heuristics: numbered lists, quotation marks, proper nouns before city names.
    """
    hints = []

    # Numbered list items: "1. The Hamilton" or "1) Founding Farmers"
    numbered = re.findall(r'\d+[\.\)]\s+([A-Z][a-zA-Z\s&\'\-\.]{2,40})', text)
    hints.extend(numbered)

    # Quoted names: "The Dabney" or 'Iron Gate'
    quoted = re.findall(r'["\']([A-Z][a-zA-Z\s&\'\-\.]{2,40})["\']', text)
    hints.extend(quoted)

    # Bold-style "**Name**" in snippets
    bold = re.findall(r'\*\*([A-Z][a-zA-Z\s&\'\-\.]{2,40})\*\*', text)
    hints.extend(bold)

    # Proper nouns followed by DC/MD/VA
    near_city = re.findall(
        r'([A-Z][a-zA-Z\s&\'\-\.]{2,30})\s+(?:in\s+)?(?:DC|Maryland|Virginia|Washington)',
        text
    )
    hints.extend(near_city)

    # Deduplicate and clean
    cleaned = []
    seen = set()
    for h in hints:
        h = h.strip().rstrip(".,;:")
        if len(h) > 3 and h.lower() not in seen:
            seen.add(h.lower())
            cleaned.append(h)

    return cleaned[:10]


def fetch_all_web_data(
    categories: dict,
    api_key: str,
    results_per_query: int = 10,
    sleep_between: float = 1.0,
) -> Dict[str, List[str]]:
    """
    Run web searches for all categories.
    Returns: {category_name: [venue_name_hints]}
    All hints are collected to supplement Google/Yelp data.
    """
    results = {}
    for category, cfg in categories.items():
        cat_hints = []
        snippets = []

        for query in cfg.get("web_queries", []):
            items = fetch_web_search(query, api_key, results_per_query)
            for item in items:
                cat_hints.extend(item.get("venue_hints", []))
                snippets.append({
                    "query": query,
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "url": item.get("url", ""),
                })
            time.sleep(sleep_between)

        # Deduplicate hints
        seen = set()
        unique_hints = []
        for h in cat_hints:
            if h.lower() not in seen:
                seen.add(h.lower())
                unique_hints.append(h)

        results[category] = {
            "venue_hints": unique_hints,
            "snippets": snippets,
        }
        log.info(f"Web [{category}]: {len(unique_hints)} venue hints from {len(snippets)} snippets")

    return results
