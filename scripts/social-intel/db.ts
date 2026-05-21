// ============================================================
// Confetti Social Intelligence — Database Layer
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from './config';
import type { TrendingVenue, SocialMention, ScanRun, ResolvedVenue } from './types';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---- Scan Run Management ----

export async function startScanRun(city: string, scanType: ScanRun['scan_type'], platform?: string) {
  const { data, error } = await supabase
    .from('scan_runs')
    .insert({ city, scan_type: scanType, platform, status: 'running' })
    .select()
    .single();
  if (error) throw new Error(`Failed to start scan run: ${error.message}`);
  return data;
}

export async function completeScanRun(id: string, venuesFound: number, mentionsFound: number, durationMs: number) {
  await supabase
    .from('scan_runs')
    .update({
      status: 'completed',
      venues_found: venuesFound,
      mentions_found: mentionsFound,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs
    })
    .eq('id', id);
}

export async function failScanRun(id: string, errors: string[]) {
  await supabase
    .from('scan_runs')
    .update({
      status: 'failed',
      errors,
      completed_at: new Date().toISOString()
    })
    .eq('id', id);
}

// ---- Venue Deduplication & Upsert ----

export async function findExistingVenue(resolved: ResolvedVenue): Promise<string | null> {
  // Strategy 1: Google Place ID (strongest match)
  if (resolved.google_place_id) {
    const { data } = await supabase
      .from('trending_venues')
      .select('id')
      .eq('google_place_id', resolved.google_place_id)
      .single();
    if (data) return data.id;
  }

  // Strategy 2: Fuzzy name + city match (Postgres similarity)
  const normalizedName = resolved.name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/\s+(restaurant|bar|cafe|club|lounge|grill|kitchen|eatery)$/i, '')
    .trim();

  const { data: candidates } = await supabase
    .from('trending_venues')
    .select('id, name, lat, lng')
    .eq('city', resolved.city);

  if (candidates) {
    for (const c of candidates) {
      const cNorm = c.name
        .toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/\s+(restaurant|bar|cafe|club|lounge|grill|kitchen|eatery)$/i, '')
        .trim();

      // Levenshtein-ish: check if names are very close
      if (cNorm === normalizedName || levenshtein(cNorm, normalizedName) <= 3) {
        return c.id;
      }

      // Strategy 3: Geo proximity (within 50m)
      if (resolved.lat && resolved.lng && c.lat && c.lng) {
        const dist = haversineMeters(resolved.lat, resolved.lng, c.lat, c.lng);
        if (dist < 50) return c.id;
      }
    }
  }

  return null;
}

export async function upsertTrendingVenue(resolved: ResolvedVenue): Promise<string> {
  // Check for existing
  const existingId = await findExistingVenue(resolved);

  if (existingId) {
    // Update last_updated and merge google_place_id if we now have one
    const updates: Record<string, unknown> = { last_updated: new Date().toISOString() };
    if (resolved.google_place_id) updates.google_place_id = resolved.google_place_id;
    if (resolved.image_url) updates.image_url = resolved.image_url;

    await supabase.from('trending_venues').update(updates).eq('id', existingId);
    return existingId;
  }

  // Insert new
  const { data, error } = await supabase
    .from('trending_venues')
    .insert({
      name: resolved.name,
      city: resolved.city,
      country: resolved.country,
      category: resolved.category,
      address: resolved.address,
      lat: resolved.lat,
      lng: resolved.lng,
      google_place_id: resolved.google_place_id,
      image_url: resolved.image_url,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert venue: ${error.message}`);
  return data.id;
}

export async function insertMention(mention: SocialMention): Promise<void> {
  const { error } = await supabase
    .from('social_mentions')
    .upsert(mention, { onConflict: 'platform,post_id', ignoreDuplicates: true });

  if (error && !error.message.includes('duplicate')) {
    console.warn(`Mention insert warning: ${error.message}`);
  }
}

// ---- Buzz Score ----

export async function recalculateBuzzScores(city: string): Promise<void> {
  const { data: venues } = await supabase
    .from('trending_venues')
    .select('id')
    .eq('city', city);

  if (!venues) return;

  for (const v of venues) {
    await supabase.rpc('recalculate_buzz_score', { venue_id: v.id });
  }
}

export async function autoApproveVenues(city?: string): Promise<number> {
  const { data } = await supabase.rpc('auto_approve_venues', { target_city: city || null });
  return data || 0;
}

// ---- Utility Functions ----

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { supabase };
