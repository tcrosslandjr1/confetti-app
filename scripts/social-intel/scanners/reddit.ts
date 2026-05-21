// ============================================================
// Scanner: Reddit — City Subs & Foodie Communities
// ============================================================
// Reddit is gold for early venue buzz. People post about new spots
// in city subreddits (r/washingtondc, r/FoodNYC) before they
// hit mainstream review sites.
//
// Uses Reddit's public JSON API (no auth needed for read-only)
// ============================================================

import type { PlatformResult } from '../types';

// City → subreddit mapping (top subs for food/nightlife)
const CITY_SUBS: Record<string, string[]> = {
  'Washington DC': ['washingtondc', 'dcfood', 'nova'],
  'New York': ['nyc', 'FoodNYC', 'AskNYC'],
  'Los Angeles': ['LosAngeles', 'FoodLosAngeles', 'LAFood'],
  'Miami': ['Miami', 'MiamiFood'],
  'Chicago': ['chicago', 'chicagofood'],
  'Atlanta': ['Atlanta', 'atlantaeats'],
  'Houston': ['houston', 'HoustonFood'],
  'Dallas': ['Dallas', 'dallasfood'],
  'San Francisco': ['sanfrancisco', 'SFFood'],
  'Las Vegas': ['vegas', 'vegasfood'],
  'Seattle': ['Seattle', 'seattlefood'],
  'Denver': ['Denver', 'denverfood'],
  'Austin': ['Austin', 'austinfood'],
  'Nashville': ['nashville', 'nashvillefood'],
  'Phoenix': ['phoenix', 'phoenixfood'],
  'Portland': ['Portland', 'portlandfood'],
  'New Orleans': ['NewOrleans'],
  'Boston': ['boston', 'bostonfood'],
  'Toronto': ['toronto', 'torontofood'],
  'London': ['london', 'londonfood'],
  'Paris': ['paris'],
  'Tokyo': ['tokyo', 'JapanTravel'],
  'Barcelona': ['Barcelona'],
  'Dubai': ['dubai'],
};

/**
 * Scan Reddit for venue mentions in city subreddits
 */
export async function scanReddit(city: string): Promise<PlatformResult[]> {
  const subs = CITY_SUBS[city] || [];
  if (subs.length === 0) {
    // Fallback: search all of Reddit with city name
    return searchReddit(`best new restaurant bar ${city}`);
  }

  const results: PlatformResult[] = [];

  for (const sub of subs) {
    try {
      // Search within subreddit for venue-related posts
      const queries = [
        'new restaurant',
        'new bar',
        'just opened',
        'hidden gem',
        'must try',
        'best new spot',
        'underrated'
      ];

      for (const query of queries) {
        const posts = await searchSubreddit(sub, query);
        for (const post of posts) {
          // Extract venue names from titles (heuristic: look for quoted names or "at X")
          const venueNames = extractVenueNames(post.title + ' ' + (post.selftext || ''));

          for (const venueName of venueNames) {
            results.push({
              venue_name: venueName,
              city,
              platform: 'reddit',
              post_url: `https://reddit.com${post.permalink}`,
              post_id: post.id,
              creator_handle: post.author,
              engagement_likes: post.ups || 0,
              engagement_comments: post.num_comments || 0,
              engagement_shares: 0,
              sentiment: post.upvote_ratio ? (post.upvote_ratio * 2 - 1) : undefined,
              snippet: post.title.slice(0, 200)
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Reddit scan failed for r/${sub}:`, err);
    }

    // Rate limiting: Reddit asks for 1 req/sec
    await sleep(1200);
  }

  return deduplicateResults(results);
}

// ---- Internal helpers ----

interface RedditPost {
  id: string;
  title: string;
  selftext?: string;
  permalink: string;
  author: string;
  ups: number;
  num_comments: number;
  upvote_ratio: number;
  created_utc: number;
}

async function searchSubreddit(sub: string, query: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&t=week&limit=25`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ConfettiBot/1.0 (social-intel)' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data?.data?.children || [])
    .map((c: any) => c.data as RedditPost)
    .filter((p: RedditPost) => {
      // Only posts from last 7 days with some engagement
      const age = (Date.now() / 1000) - p.created_utc;
      return age < 7 * 86400 && (p.ups >= 5 || p.num_comments >= 3);
    });
}

async function searchReddit(query: string): Promise<PlatformResult[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=25`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ConfettiBot/1.0 (social-intel)' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data?.data?.children || [])
    .map((c: any) => c.data)
    .filter((p: any) => p.ups >= 5)
    .flatMap((post: any) => {
      const names = extractVenueNames(post.title);
      return names.map(name => ({
        venue_name: name,
        city: '', // Will need resolution
        platform: 'reddit' as const,
        post_url: `https://reddit.com${post.permalink}`,
        post_id: post.id,
        creator_handle: post.author,
        engagement_likes: post.ups || 0,
        engagement_comments: post.num_comments || 0,
        engagement_shares: 0,
        sentiment: post.upvote_ratio ? (post.upvote_ratio * 2 - 1) : undefined,
        snippet: post.title.slice(0, 200)
      }));
    });
}

/**
 * Extract venue names from Reddit post text.
 * Looks for patterns like:
 * - "Venue Name" (quoted)
 * - at Venue Name
 * - tried Venue Name
 * - check out Venue Name
 * - Venue Name just opened
 */
function extractVenueNames(text: string): string[] {
  const names: string[] = [];

  // Pattern 1: Quoted names
  const quoted = text.match(/"([^"]{3,40})"/g);
  if (quoted) {
    names.push(...quoted.map(q => q.replace(/"/g, '')));
  }

  // Pattern 2: "at X" or "tried X" or "check out X"
  const atPattern = /(?:at|tried|visited|check out|went to|been to|discovered)\s+([A-Z][A-Za-z'\-&\s]{2,30}?)(?:\s*[-—,!?.)]|\s+(?:and|on|in|for|last|this|yesterday|today|is|was|the other))/gi;
  let match;
  while ((match = atPattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length >= 3 && name.length <= 40 && !isCommonWord(name)) {
      names.push(name);
    }
  }

  return [...new Set(names)];
}

function isCommonWord(s: string): boolean {
  const common = new Set([
    'the', 'this', 'that', 'there', 'here', 'where', 'when', 'what',
    'place', 'spot', 'restaurant', 'bar', 'food', 'dinner', 'lunch',
    'someone', 'anyone', 'everyone', 'something', 'downtown', 'uptown'
  ]);
  return common.has(s.toLowerCase());
}

function deduplicateResults(results: PlatformResult[]): PlatformResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.post_id}:${r.venue_name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
