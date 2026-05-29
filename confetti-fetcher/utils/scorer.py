"""
Trending Score Calculator
==========================
Computes a 0–100 trending score for each venue based on:
- TikTok mention count (40%)
- Google rating + review velocity (25%)
- Yelp rating + review count (15%)
- Data freshness / recency (20%)
"""

import math
import logging
from typing import Dict, Any

log = logging.getLogger(__name__)


def compute_trending_score(venue: Dict[str, Any], scoring: dict) -> float:
    """
    Returns a float 0–100.
    Higher = more trending / recommended.
    """
    score = 0.0

    # ── TikTok component (0–40) ──────────────────────────────────────────
    tiktok_mentions = venue.get("tiktok_mention_count", 0) or 0
    # Log scale: 1 mention → ~5, 10 → ~23, 50 → ~39, 100+ → ~40
    tiktok_score = min(40.0, scoring["tiktok_mentions_weight"] * 100 * math.log1p(tiktok_mentions) / math.log1p(100))
    score += tiktok_score

    # ── Google component (0–25) ──────────────────────────────────────────
    g_rating = venue.get("google_rating") or 0
    g_count  = venue.get("google_review_count") or 0
    if g_rating > 0:
        # Rating 4.0–5.0 scales 0–15; review volume adds up to 10
        rating_component  = max(0, (g_rating - 2.5) / 2.5) * 15
        volume_component  = min(10.0, math.log1p(g_count) / math.log1p(10000) * 10)
        score += scoring["google_rating_weight"] * (rating_component + volume_component) / 0.25

    # ── Yelp component (0–15) ────────────────────────────────────────────
    y_rating = venue.get("yelp_rating") or 0
    y_count  = venue.get("yelp_review_count") or 0
    if y_rating > 0:
        y_component = max(0, (y_rating - 2.5) / 2.5) * 10 + min(5.0, math.log1p(y_count) / math.log1p(5000) * 5)
        score += scoring["yelp_rating_weight"] * y_component / 0.15

    # ── Recency component (0–20) ─────────────────────────────────────────
    # All fetched data is fresh by definition; give full recency credit
    # unless tiktok_last_viral_at is very old (future enhancement)
    score += scoring["recency_weight"] * 100

    # ── Cap & round ──────────────────────────────────────────────────────
    final = min(100.0, max(0.0, score))
    return round(final, 2)


def enrich_scores(venues: list, scoring: dict) -> list:
    """
    Add trending_score and is_trending to each venue in-place.
    Returns the modified list.
    """
    threshold = scoring.get("trending_threshold", 60.0)
    for v in venues:
        v["trending_score"] = compute_trending_score(v, scoring)
        v["is_trending"]    = v["trending_score"] >= threshold
    return venues
