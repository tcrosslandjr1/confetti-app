// Curated Unsplash fallback photos used when a venue has no real image
// (no `image_url`, no Google Places photo). Indexed by category so a "bar"
// gets a bar photo, etc. Keep these as direct images.unsplash.com URLs so
// they work without any API key.

const RESTAURANT = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70",
];

const BAR = [
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=70",
];

const LOUNGE = [
  "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?auto=format&fit=crop&w=1200&q=70",
];

const CLUB = [
  "https://images.unsplash.com/photo-1571266028243-d220c6a76d6c?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?auto=format&fit=crop&w=1200&q=70",
];

const CAFE = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=70",
];

const EVENT = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=70",
];

const GENERIC = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70",
];

function bucketFor(category?: string | null): string[] {
  const c = (category ?? "").toLowerCase();
  if (/club|nightclub|dance/.test(c)) return CLUB;
  if (/lounge|speakeasy/.test(c)) return LOUNGE;
  if (/bar|pub|cocktail|wine|brewery|tap/.test(c)) return BAR;
  if (/cafe|coffee|bakery|brunch/.test(c)) return CAFE;
  if (/event|concert|show|venue/.test(c)) return EVENT;
  if (/restaurant|food|dining|kitchen|eatery|bistro|grill/.test(c)) return RESTAURANT;
  return GENERIC;
}

// Stable hash so the same venue always maps to the same fallback image.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function unsplashFor(category?: string | null, name?: string | null): string {
  const list = bucketFor(category);
  const seed = hash(`${category ?? ""}::${name ?? ""}`);
  return list[seed % list.length];
}
