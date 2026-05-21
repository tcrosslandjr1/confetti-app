// ============================================================
// Confetti Social Intelligence — Configuration
// ============================================================

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

// Platform API keys (add as you enable each scanner)
export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
export const YELP_API_KEY = process.env.YELP_API_KEY || '';

// Top-priority cities get frequent trend scans (every 4-6h)
export const TIER_1_CITIES = [
  'Washington DC', 'New York', 'Los Angeles', 'Miami', 'Chicago',
  'Atlanta', 'Houston', 'Dallas', 'San Francisco', 'Las Vegas'
];

// All 55 launch cities get daily scans
export const ALL_CITIES = [
  ...TIER_1_CITIES,
  'Seattle', 'Denver', 'Austin', 'Nashville', 'Phoenix',
  'San Diego', 'Orlando', 'Tampa', 'Philadelphia', 'Boston',
  'Minneapolis', 'Portland', 'Charlotte', 'Detroit', 'Raleigh',
  'Salt Lake City', 'Kansas City', 'Columbus', 'Indianapolis', 'Milwaukee',
  'Memphis', 'Louisville', 'Baltimore', 'Richmond', 'Pittsburgh',
  'New Orleans', 'Honolulu', 'Anchorage', 'San Antonio', 'Jacksonville',
  'Cancún', 'Mexico City', 'Toronto', 'Vancouver', 'Montreal',
  'London', 'Paris', 'Barcelona', 'Tokyo', 'Dubai',
  'Amsterdam', 'Berlin', 'Bangkok', 'Lisbon', 'Medellín'
];

// Scan cadence (in hours)
export const SCAN_CADENCE = {
  trend: 6,          // every 6h for tier-1 cities
  new_opening: 24,   // daily for all cities
  deep_audit: 168,   // weekly
  dormant_check: 720 // monthly
};

// Buzz score thresholds
export const BUZZ_THRESHOLDS = {
  auto_approve_score: 90,
  auto_approve_min_platforms: 3,
  viral: 80,
  rising: 50,
  steady: 20
};

// Search queries by category
export const SEARCH_QUERIES = {
  restaurant: ['best new restaurant', 'trending restaurant', 'viral food spot', 'must try restaurant'],
  bar: ['best new bar', 'trending bar', 'viral cocktail bar', 'hidden gem bar'],
  cafe: ['best new cafe', 'trending coffee shop', 'viral cafe'],
  club: ['best new club', 'trending nightclub', 'viral nightlife'],
  experience: ['unique experience', 'viral attraction', 'must-do activity', 'trending things to do']
};

// Venue categories for classification
export const VENUE_CATEGORIES = ['restaurant', 'bar', 'cafe', 'club', 'experience'] as const;
export type VenueCategory = typeof VENUE_CATEGORIES[number];
