// ============================================================
// Scanner: Yelp — New Listings & Review Surges
// ============================================================
// Yelp Fusion API catches newly listed businesses and venues
// experiencing sudden review volume spikes. Good complementary
// signal — not as early as TikTok/Reddit but more reliable.
//
// Rate limit: 5,000 API calls/day on free tier
// ============================================================

import { YELP_API_KEY } from '../config';
import type { PlatformResult } from '../types';

const YELP_BASE = 'https://api.yelp.com/v3';

interface YelpBusiness {
  id: string;
  name: string;
  url: string;
  rating: number;
  review_count: number;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: Array<{ alias: string; title: string }>;
  image_url?: string;
  is_closed: boolean;
}

/**
 * Scan Yelp for hot new venues in a city
 */
export async function scanYelp(city: string): Promise<PlatformResult[]> {
  if (!YELP_API_KEY) {
    console.warn('Yelp API key not configured — skipping');
    return [];
  }

  const results: PlatformResult[] = [];

  // Strategy 1: "Hot and New" sort (Yelp's own trending signal)
  const categories = ['restaurants', 'bars', 'nightlife', 'cafes'];

  for (const cat of categories) {
    try {
      const businesses = await searchYelp(city, cat, 'hot_and_new');

      for (const biz of businesses) {
        if (biz.is_closed) continue;

        results.push({
          venue_name: biz.name,
          venue_address: [biz.location.address1, biz.location.city, biz.location.state].filter(Boolean).join(', '),
          city,
          category: classifyYelpCategories(biz.categories),
          platform: 'yelp',
          post_url: biz.url,
          post_id: biz.id,
          engagement_likes: biz.review_count,
          engagement_comments: 0,
          engagement_shares: 0,
          sentiment: biz.rating ? (biz.rating - 3) / 2 : undefined,
          snippet: `${biz.name} — ${biz.rating}★ (${biz.review_count} reviews) on Yelp`
        });
      }
    } catch (err) {
      console.warn(`Yelp scan failed for ${cat} in ${city}:`, err);
    }

    // Respect rate limits
    await sleep(300);
  }

  // Deduplicate by Yelp business ID
  const seen = new Set<string>();
  return results.filter(r => {
    if (!r.post_id || seen.has(r.post_id)) return false;
    seen.add(r.post_id);
    return true;
  });
}

// ---- Internal helpers ----

async function searchYelp(city: string, category: string, sortBy: string = 'rating'): Promise<YelpBusiness[]> {
  const params = new URLSearchParams({
    location: city,
    categories: category,
    sort_by: sortBy,
    limit: '20'
  });

  // "hot_and_new" is an attribute filter, not a sort
  if (sortBy === 'hot_and_new') {
    params.set('sort_by', 'rating');
    params.set('attributes', 'hot_and_new');
  }

  const res = await fetch(`${YELP_BASE}/businesses/search?${params}`, {
    headers: { 'Authorization': `Bearer ${YELP_API_KEY}` }
  });

  if (!res.ok) {
    throw new Error(`Yelp API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.businesses || [];
}

function classifyYelpCategories(cats: Array<{ alias: string; title: string }>): string {
  const aliases = cats.map(c => c.alias);
  if (aliases.some(a => a.includes('bar') || a.includes('pub') || a.includes('cocktail') || a.includes('wine_bar'))) return 'bar';
  if (aliases.some(a => a.includes('nightlife') || a.includes('danceclubs'))) return 'club';
  if (aliases.some(a => a.includes('coffee') || a.includes('cafe') || a.includes('tea'))) return 'cafe';
  if (aliases.some(a => a.includes('arts') || a.includes('active') || a.includes('amusement'))) return 'experience';
  return 'restaurant';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
