"""
TikTok Fetcher — Bright Data API
=================================
Searches TikTok hashtags for DMV venue/activity content.
Uses Bright Data's Web Unlocker to scrape TikTok hashtag pages.
"""

import requests
import json
import logging
import re
import time
from typing import List, Dict, Any

log = logging.getLogger(__name__)


def fetch_tiktok_hashtag(hashtag: str, api_key: str, limit: int = 30) -> List[Dict[str, Any]]:
    """
    Fetch TikTok videos for a given hashtag using Bright Data Web Unlocker.
    Returns list of dicts: {url, views, likes, caption, creator, venue_hints}
    """
    if not api_key:
        log.warning("No Bright Data API key — skipping TikTok fetch")
        return []

    tag = hashtag.lstrip("#")
    url = f"https://www.tiktok.com/tag/{tag}"

    try:
        resp = requests.get(
            "https://api.brightdata.com/request",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "zone": "datacenter",
                "url": url,
                "format": "raw",
                "country": "us",
            },
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        log.error(f"TikTok fetch failed for #{tag}: {e}")
        return []

    html = resp.text
    videos = _parse_tiktok_html(html, tag)
    log.info(f"#{tag}: found {len(videos)} videos")
    return videos[:limit]


def _parse_tiktok_html(html: str, hashtag: str) -> List[Dict[str, Any]]:
    """Extract video metadata from TikTok hashtag page HTML."""
    videos = []

    # TikTok embeds data in a __UNIVERSAL_DATA__ script tag
    pattern = r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        return videos

    try:
        data = json.loads(match.group(1))
        items = (
            data.get("__DEFAULT_SCOPE__", {})
                .get("webapp.challenge-detail", {})
                .get("itemList", [])
        )
        for item in items:
            try:
                desc = item.get("desc", "")
                stats = item.get("stats", {})
                author = item.get("author", {})
                video = item.get("video", {})

                videos.append({
                    "tiktok_url": f"https://www.tiktok.com/@{author.get('uniqueId','')}/video/{item.get('id','')}",
                    "views": stats.get("playCount", 0),
                    "likes": stats.get("diggCount", 0),
                    "shares": stats.get("shareCount", 0),
                    "caption": desc,
                    "creator": author.get("uniqueId", ""),
                    "hashtag": hashtag,
                    "venue_hints": _extract_venue_hints(desc),
                })
            except Exception:
                continue
    except (json.JSONDecodeError, AttributeError):
        pass

    return videos


def _extract_venue_hints(caption: str) -> List[str]:
    """
    Try to extract venue names from TikTok captions.
    Looks for patterns like "at [Place]", "@[handle]", "📍[Place]"
    """
    hints = []
    patterns = [
        r"(?:at|@|📍|🍽️|🍸|🎉)\s*([A-Z][a-zA-Z\s&']{2,30})",
        r"([A-Z][a-zA-Z\s&']{2,25})(?:\s+(?:DC|MD|VA|Maryland|Virginia|Washington))",
    ]
    for p in patterns:
        matches = re.findall(p, caption)
        hints.extend([m.strip() for m in matches if len(m.strip()) > 2])
    return list(set(hints))[:5]


def fetch_all_tiktok_data(
    categories: dict,
    api_key: str,
    limit_per_hashtag: int = 30,
    sleep_between: float = 2.0,
) -> Dict[str, List[Dict]]:
    """
    Fetch TikTok data for all categories.
    Returns: {category_name: [video_dicts]}
    """
    results = {}
    for category, cfg in categories.items():
        cat_videos = []
        for hashtag in cfg.get("tiktok_hashtags", []):
            videos = fetch_tiktok_hashtag(hashtag, api_key, limit_per_hashtag)
            cat_videos.extend(videos)
            time.sleep(sleep_between)  # be polite
        results[category] = cat_videos
        log.info(f"TikTok [{category}]: {len(cat_videos)} total videos")
    return results


def aggregate_tiktok_mentions(
    tiktok_results: Dict[str, List[Dict]], venue_name: str
) -> Dict[str, Any]:
    """
    Count how many TikTok videos mention a venue by name.
    Returns: {mention_count, hashtags_seen, video_urls, last_viral_at}
    """
    name_lower = venue_name.lower()
    mention_count = 0
    hashtags_seen = set()
    video_urls = []

    for category, videos in tiktok_results.items():
        for v in videos:
            caption = v.get("caption", "").lower()
            hints = [h.lower() for h in v.get("venue_hints", [])]
            if name_lower in caption or any(name_lower in h for h in hints):
                mention_count += 1
                hashtags_seen.add(v.get("hashtag", ""))
                video_urls.append({
                    "url": v.get("tiktok_url", ""),
                    "views": v.get("views", 0),
                    "likes": v.get("likes", 0),
                    "caption": v.get("caption", "")[:200],
                })

    video_urls.sort(key=lambda x: x.get("views", 0), reverse=True)

    return {
        "tiktok_mention_count": mention_count,
        "tiktok_hashtags": list(hashtags_seen),
        "tiktok_video_urls": video_urls[:5],  # top 5 by views
    }
