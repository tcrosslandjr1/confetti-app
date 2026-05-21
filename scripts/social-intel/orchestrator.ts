// ============================================================
// Confetti Social Intelligence — Scan Orchestrator
// ============================================================
// Coordinates all platform scanners, resolves venues via
// Google Places, upserts to Supabase, and recalculates scores.
//
// Usage:
//   npx tsx scripts/social-intel/orchestrator.ts --type trend --cities "Washington DC,New York"
//   npx tsx scripts/social-intel/orchestrator.ts --type new_opening --all
//   npx tsx scripts/social-intel/orchestrator.ts --type deep_audit --tier1
// ============================================================

import { TIER_1_CITIES, ALL_CITIES, SCAN_CADENCE } from './config';
import {
  startScanRun, completeScanRun, failScanRun,
  upsertTrendingVenue, insertMention, recalculateBuzzScores, autoApproveVenues
} from './db';
import { resolveToGooglePlace, scanNewOpenings } from './scanners/google-places';
import { scanReddit } from './scanners/reddit';
import { scanYelp } from './scanners/yelp';
import { scanYouTube } from './scanners/youtube';
import type { PlatformResult, ScanRun } from './types';

type ScanType = ScanRun['scan_type'];

// ---- Main entry point ----

async function main() {
  const args = parseArgs();
  const cities = resolveCities(args);
  const scanType = args.type as ScanType;

  console.log(`\n🎊 Confetti Social Intelligence Scanner`);
  console.log(`   Type: ${scanType}`);
  console.log(`   Cities: ${cities.length} (${cities.slice(0, 5).join(', ')}${cities.length > 5 ? '...' : ''})`);
  console.log(`   Started: ${new Date().toISOString()}\n`);

  let totalVenues = 0;
  let totalMentions = 0;

  for (const city of cities) {
    try {
      const result = await scanCity(city, scanType);
      totalVenues += result.venues;
      totalMentions += result.mentions;
      console.log(`   ✓ ${city}: ${result.venues} venues, ${result.mentions} mentions`);
    } catch (err) {
      console.error(`   ✗ ${city}: ${err}`);
    }

    // Breathing room between cities
    await sleep(2000);
  }

  console.log(`\n   Done! ${totalVenues} venues, ${totalMentions} mentions across ${cities.length} cities\n`);
}

// ---- City-level scan ----

async function scanCity(city: string, scanType: ScanType): Promise<{ venues: number; mentions: number }> {
  const startTime = Date.now();
  const scanRun = await startScanRun(city, scanType);

  try {
    let allResults: PlatformResult[] = [];

    // Choose scanners based on scan type
    switch (scanType) {
      case 'trend':
        // Hit social platforms for trending content
        const [redditResults, youtubeResults] = await Promise.allSettled([
          scanReddit(city),
          scanYouTube(city)
        ]);
        if (redditResults.status === 'fulfilled') allResults.push(...redditResults.value);
        if (youtubeResults.status === 'fulfilled') allResults.push(...youtubeResults.value);
        break;

      case 'new_opening':
        // Google Places + Yelp for newly listed venues
        const [placesResults, yelpResults] = await Promise.allSettled([
          scanNewOpenings(city),
          scanYelp(city)
        ]);
        if (placesResults.status === 'fulfilled') allResults.push(...placesResults.value);
        if (yelpResults.status === 'fulfilled') allResults.push(...yelpResults.value);
        break;

      case 'deep_audit':
        // All scanners
        const [r, yt, gp, yp] = await Promise.allSettled([
          scanReddit(city),
          scanYouTube(city),
          scanNewOpenings(city),
          scanYelp(city)
        ]);
        if (r.status === 'fulfilled') allResults.push(...r.value);
        if (yt.status === 'fulfilled') allResults.push(...yt.value);
        if (gp.status === 'fulfilled') allResults.push(...gp.value);
        if (yp.status === 'fulfilled') allResults.push(...yp.value);
        break;

      case 'dormant_check':
        // TODO: Check existing trending venues that haven't had new mentions in 30 days
        console.log(`   Dormant check not yet implemented for ${city}`);
        break;
    }

    // Process results: resolve each to a venue and store mentions
    const venueIds = new Set<string>();

    for (const result of allResults) {
      try {
        // Resolve to Google Place for structured data
        const resolved = result.platform === 'google_places'
          ? {
              name: result.venue_name,
              city,
              country: 'US',
              category: result.category || 'restaurant',
              address: result.venue_address,
              google_place_id: result.post_id
            }
          : await resolveToGooglePlace(result.venue_name, city) || {
              name: result.venue_name,
              city,
              country: 'US',
              category: result.category || 'restaurant',
              address: result.venue_address
            };

        // Upsert venue (dedup built in)
        const venueId = await upsertTrendingVenue(resolved);
        venueIds.add(venueId);

        // Store the mention
        await insertMention({
          trending_venue_id: venueId,
          platform: result.platform,
          post_url: result.post_url,
          post_id: result.post_id,
          creator_handle: result.creator_handle,
          creator_followers: result.creator_followers,
          engagement_likes: result.engagement_likes,
          engagement_comments: result.engagement_comments,
          engagement_shares: result.engagement_shares,
          sentiment: result.sentiment,
          snippet: result.snippet
        });
      } catch (err) {
        // Don't let one bad result kill the whole scan
        console.warn(`   Skipping result "${result.venue_name}": ${err}`);
      }
    }

    // Recalculate buzz scores for all affected venues
    await recalculateBuzzScores(city);

    // Auto-approve qualifying venues
    const autoApproved = await autoApproveVenues(city);
    if (autoApproved > 0) {
      console.log(`   🎉 Auto-approved ${autoApproved} venues in ${city}`);
    }

    // Complete the scan run
    await completeScanRun(scanRun.id, venueIds.size, allResults.length, Date.now() - startTime);

    return { venues: venueIds.size, mentions: allResults.length };

  } catch (err: any) {
    await failScanRun(scanRun.id, [err.message]);
    throw err;
  }
}

// ---- CLI argument parsing ----

function parseArgs(): { type: string; cities?: string; all?: boolean; tier1?: boolean } {
  const args: Record<string, string | boolean> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--type' && argv[i + 1]) {
      args.type = argv[++i];
    } else if (argv[i] === '--cities' && argv[i + 1]) {
      args.cities = argv[++i];
    } else if (argv[i] === '--all') {
      args.all = true;
    } else if (argv[i] === '--tier1') {
      args.tier1 = true;
    }
  }

  if (!args.type) {
    console.error('Usage: npx tsx orchestrator.ts --type <trend|new_opening|deep_audit|dormant_check> [--cities "City1,City2" | --all | --tier1]');
    process.exit(1);
  }

  return args as any;
}

function resolveCities(args: { cities?: string; all?: boolean; tier1?: boolean }): string[] {
  if (args.cities) return args.cities.split(',').map(c => c.trim());
  if (args.tier1) return TIER_1_CITIES;
  if (args.all) return ALL_CITIES;
  // Default to tier 1
  return TIER_1_CITIES;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
