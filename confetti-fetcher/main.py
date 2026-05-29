#!/usr/bin/env python3
"""
Confetti DMV Data Fetcher — Main Orchestrator
===============================================
Runs on Synology NAS via Task Scheduler.
Fetches DMV venue/activity data from TikTok, Google Places, Yelp, and web search.
Appends to NAS Excel file + upserts to Supabase venue_intel table.

Usage:
    python3 main.py [--categories nightlife,brunch,date_night] [--dry-run]

Cron (Synology Task Scheduler):
    0 */6 * * *   → every 6 hours
    0 2 * * *     → every day at 2 AM
"""

import argparse
import logging
import sys
import os
import time
from datetime import datetime

# ── Path setup for Synology ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config as cfg
from sources.tiktok_fetcher import fetch_all_tiktok_data, aggregate_tiktok_mentions
from sources.google_fetcher import fetch_all_google_data
from sources.yelp_fetcher import fetch_all_yelp_data
from sources.web_fetcher import fetch_all_web_data
from storage.excel_writer import write_venues_to_excel, read_manual_additions
from storage.supabase_writer import upsert_venues_to_supabase
from utils.dedup import deduplicate_venues
from utils.scorer import enrich_scores


def setup_logging(log_path: str):
    """Configure logging to file (NAS) + console."""
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        handlers=[
            logging.FileHandler(log_path, mode="a", encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def parse_args():
    parser = argparse.ArgumentParser(description="Confetti DMV Data Fetcher")
    parser.add_argument(
        "--categories",
        type=str,
        default=None,
        help="Comma-separated list of categories to fetch. Default: all",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch data but don't write to Excel or Supabase",
    )
    parser.add_argument(
        "--tiktok-only",
        action="store_true",
        help="Only run TikTok fetch (faster for trending refresh)",
    )
    return parser.parse_args()


def run_fetch(selected_categories: dict, dry_run: bool = False, tiktok_only: bool = False) -> dict:
    """
    Main fetch pipeline. Returns summary stats.
    """
    log = logging.getLogger("confetti.main")
    start_time = time.time()
    log.info("=" * 60)
    log.info(f"Confetti fetch started — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"Categories: {list(selected_categories.keys())}")
    log.info(f"Dry run: {dry_run}")
    log.info("=" * 60)

    # ── Step 1: TikTok ───────────────────────────────────────────────────────
    log.info("STEP 1/5 — Fetching TikTok data...")
    tiktok_data = {}
    if cfg.BRIGHTDATA_API_KEY:
        tiktok_data = fetch_all_tiktok_data(
            selected_categories,
            cfg.BRIGHTDATA_API_KEY,
            limit_per_hashtag=cfg.TIKTOK_VIDEOS_PER_HASHTAG,
        )
    else:
        log.warning("BRIGHTDATA_API_KEY not set — skipping TikTok")

    if tiktok_only:
        log.info("--tiktok-only flag set, stopping after TikTok fetch")
        return {"tiktok_videos": sum(len(v) for v in tiktok_data.values())}

    # ── Step 2: Google Places ────────────────────────────────────────────────
    log.info("STEP 2/5 — Fetching Google Places data...")
    google_data = {}
    if cfg.GOOGLE_PLACES_KEY:
        google_data = fetch_all_google_data(
            selected_categories,
            cfg.DMV_LOCATIONS,
            cfg.GOOGLE_PLACES_KEY,
            results_per_query=cfg.GOOGLE_RESULTS_PER_QUERY,
        )
    else:
        log.warning("GOOGLE_PLACES_KEY not set — skipping Google Places")

    # ── Step 3: Yelp ─────────────────────────────────────────────────────────
    log.info("STEP 3/5 — Fetching Yelp data...")
    yelp_data = {}
    if cfg.YELP_API_KEY:
        yelp_data = fetch_all_yelp_data(
            selected_categories,
            cfg.YELP_API_KEY,
            results_per_query=cfg.YELP_RESULTS_PER_QUERY,
        )
    else:
        log.warning("YELP_API_KEY not set — skipping Yelp")

    # ── Step 4: Web Search ───────────────────────────────────────────────────
    log.info("STEP 4/5 — Fetching web search data...")
    web_data = {}
    if cfg.BRIGHTDATA_API_KEY:
        web_data = fetch_all_web_data(
            selected_categories,
            cfg.BRIGHTDATA_API_KEY,
            results_per_query=cfg.WEB_RESULTS_PER_QUERY,
        )
    else:
        log.warning("BRIGHTDATA_API_KEY not set — skipping web search")

    # ── Step 5: Merge, deduplicate, score ────────────────────────────────────
    log.info("STEP 5/5 — Merging, deduplicating, scoring...")
    venues_by_category = {}
    total_raw = 0
    total_deduped = 0

    for category in selected_categories:
        raw_venues = []

        # Collect all venues from all sources for this category
        for v in google_data.get(category, []):
            v["category"] = category
            raw_venues.append(v)

        for v in yelp_data.get(category, []):
            v["category"] = category
            raw_venues.append(v)

        # Add TikTok mention counts to venues that match
        tiktok_cat_data = {category: tiktok_data.get(category, [])}
        for v in raw_venues:
            tiktok_signals = aggregate_tiktok_mentions(tiktok_cat_data, v.get("name", ""))
            v.update(tiktok_signals)

        # Deduplicate
        deduped = deduplicate_venues(raw_venues, threshold=cfg.FUZZY_MATCH_THRESHOLD)

        # Score
        enrich_scores(deduped, cfg.SCORING)

        venues_by_category[category] = deduped
        total_raw    += len(raw_venues)
        total_deduped += len(deduped)

        log.info(f"[{category}]: {len(raw_venues)} raw → {len(deduped)} deduped (top score: {max((v['trending_score'] for v in deduped), default=0):.1f})")

    # Also check for manual additions in existing Excel file
    log.info("Checking for manually-added venues in Excel...")
    manual_additions = read_manual_additions(cfg.EXCEL_PATH)
    for v in manual_additions:
        cat = v.get("category", "trending")
        if cat in venues_by_category:
            venues_by_category[cat].append(v)
        else:
            venues_by_category[cat] = [v]
    log.info(f"Manual additions: {len(manual_additions)} venues")

    # ── Write to Excel (NAS) ─────────────────────────────────────────────────
    excel_new = 0
    if not dry_run:
        log.info(f"Writing to Excel: {cfg.EXCEL_PATH}")
        excel_new = write_venues_to_excel(venues_by_category, cfg.EXCEL_PATH)
    else:
        log.info("[DRY RUN] Skipping Excel write")

    # ── Upsert to Supabase ───────────────────────────────────────────────────
    supabase_new = 0
    if not dry_run and cfg.SUPABASE_SERVICE_KEY:
        all_venues_flat = [v for venues in venues_by_category.values() for v in venues]
        log.info(f"Upserting {len(all_venues_flat)} venues to Supabase...")
        supabase_new = upsert_venues_to_supabase(
            all_venues_flat,
            cfg.SUPABASE_URL,
            cfg.SUPABASE_SERVICE_KEY,
        )
    else:
        if dry_run:
            log.info("[DRY RUN] Skipping Supabase upsert")
        else:
            log.warning("SUPABASE_SERVICE_KEY not set — skipping Supabase upsert")

    elapsed = time.time() - start_time
    summary = {
        "categories_processed": len(selected_categories),
        "total_raw_venues": total_raw,
        "total_deduped_venues": total_deduped,
        "excel_new_rows": excel_new,
        "supabase_upserted": supabase_new,
        "manual_additions": len(manual_additions),
        "elapsed_seconds": round(elapsed, 1),
    }

    log.info("=" * 60)
    log.info("FETCH COMPLETE")
    for k, v in summary.items():
        log.info(f"  {k}: {v}")
    log.info(f"  finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    return summary


def main():
    args = parse_args()
    setup_logging(cfg.LOG_PATH)

    # Filter categories if specified
    if args.categories:
        selected_keys = [c.strip() for c in args.categories.split(",")]
        selected_categories = {k: v for k, v in cfg.CATEGORIES.items() if k in selected_keys}
        if not selected_categories:
            print(f"No valid categories found in: {args.categories}")
            print(f"Valid options: {', '.join(cfg.CATEGORIES.keys())}")
            sys.exit(1)
    else:
        selected_categories = cfg.CATEGORIES

    run_fetch(
        selected_categories=selected_categories,
        dry_run=args.dry_run,
        tiktok_only=args.tiktok_only,
    )


if __name__ == "__main__":
    main()
