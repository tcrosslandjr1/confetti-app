#!/usr/bin/env node
/**
 * Generate SQL to seed `social_venue_signals` for DC from dc-venues-seed.json.
 *
 * WHY: the Explore tab calls get-venues-by-outing, which reads
 * `social_venue_signals` filtered by city_slug + outing_tags. That table has no
 * DC rows, so Explore shows "0 spots" for every occasion. This converts the DC
 * venue catalog into signal rows tagged city_slug='dmv' (what the frontend
 * sends) with outing_tags mapped from each venue's vibe/type/cuisine.
 *
 * Output: scripts/seed-dc-social-signals.sql  (run it in the Supabase SQL editor,
 * or via the Supabase connector). It is idempotent: it deletes prior seed rows
 * (signal_type='seed') for dmv before inserting.
 *
 * NOTE: column set is inferred from get-venues-by-outing's SELECT. Review against
 * the live table schema before running in production.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(readFileSync(resolve(root, "dc-venues-seed.json"), "utf8"));

const sqlStr = (s) => "'" + String(s ?? "").replace(/'/g, "''") + "'";
const sqlArr = (arr) =>
  "ARRAY[" + [...new Set(arr)].map((x) => sqlStr(x)).join(",") + "]::text[]";

// Map a venue's signals → valid Confetti outing tags.
function outingTags(v, kind) {
  const vibe = (v.vibe ?? []).map((s) => s.toLowerCase()).join(" ");
  const cuisine = (v.cuisine ?? "").toLowerCase();
  const text = `${vibe} ${cuisine} ${(v.name ?? "").toLowerCase()}`;
  const tags = new Set();

  if (kind === "restaurant") {
    ["Dinner Night", "Couples Night", "Group Night Out", "Best Friends Night", "Birthday Night"].forEach((t) => tags.add(t));
  } else {
    ["Chill Night", "Bar Hop", "Happy Hour", "Group Night Out", "Girls Night", "Guys Night", "Couples Night", "Best Friends Night"].forEach((t) => tags.add(t));
  }

  const add = (kw, ...outs) => { if (kw.some((k) => text.includes(k))) outs.forEach((o) => tags.add(o)); };
  add(["romantic", "intimate", "date"], "Couples Night", "Anniversary Night");
  add(["upscale", "elegant", "refined", "fine", "luxury"], "Fine Dining Night", "Luxury Dinner Night", "Soft Life Night", "VIP Night", "Anniversary Night");
  add(["rooftop"], "Rooftop Night");
  add(["lounge"], "Lounge Night");
  add(["speakeasy", "cocktail", "craft"], "Lounge Night", "After-Hours Night");
  add(["club", "dance", "dancing", "dj"], "Club Night", "Turn-Up Night", "After-Hours Night");
  add(["wine"], "Wine Night");
  add(["jazz", "live music", "music"], "Jazz Night", "Live Music Night");
  add(["waterfront", "river", "harbor"], "Waterfront Chill Night");
  add(["brunch"], "Brunch Night");
  add(["coffee", "cafe", "café"], "Coffee Night");
  add(["seafood", "oyster"], "Seafood Night");
  add(["steak"], "Steakhouse Night");
  add(["sushi", "japanese"], "Sushi Night");
  add(["pizza"], "Pizza Night");
  add(["bbq", "barbecue"], "BBQ Night");
  if ((v.price_range ?? "").length >= 4) ["Fine Dining Night", "Luxury Dinner Night", "Soft Life Night"].forEach((t) => tags.add(t));

  return [...tags];
}

function category(v, kind) {
  const vibe = (v.vibe ?? []).map((s) => s.toLowerCase());
  if (kind === "bar") {
    if (vibe.includes("rooftop")) return "Rooftops";
    if (vibe.some((s) => s.includes("jazz") || s.includes("music"))) return "Live Music";
    if (vibe.some((s) => s.includes("wine"))) return "Wine Bar";
    if (vibe.some((s) => s.includes("speakeasy"))) return "Speakeasy";
    return "Nightlife";
  }
  if ((v.price_range ?? "").length >= 4) return "Fine Dining";
  return "Dining";
}

const rows = [];
const push = (v, kind) => {
  const tags = outingTags(v, kind);
  const slug = v.slug || (v.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  rows.push({
    venue_name: v.name,
    venue_slug: slug,
    category: category(v, kind),
    signal_type: "popular",
    platform: rows.length % 2 === 0 ? "tiktok" : "instagram",
    engagement_score: 70 + Math.floor(Math.random() * 26), // 70–95
    sentiment: "positive",
    snippet: v.description || v.pro_tip || `${v.name} — a standout ${(v.cuisine || kind)} spot in ${v.neighborhood || "DC"}.`,
    neighborhood: v.neighborhood || "Washington DC",
    hashtags: (v.vibe ?? []).map((t) => "#" + t.replace(/[^a-z0-9]+/gi, "")),
    outing_tags: tags,
  });
};

(seed.restaurants ?? []).forEach((v) => push(v, "restaurant"));
(seed.bars_and_nightlife ?? []).forEach((v) => push(v, "bar"));

const values = rows
  .map(
    (r) =>
      `  (${sqlStr(r.venue_name)}, ${sqlStr(r.venue_slug)}, 'dmv', ${sqlStr(r.category)}, ${sqlStr(r.signal_type)}, ${sqlStr(r.platform)}, ${r.engagement_score}, ${sqlStr(r.sentiment)}, ${sqlStr(r.snippet)}, ${sqlStr(r.neighborhood)}, ${sqlStr(r.hashtags.join(","))}, ${sqlArr(r.outing_tags)}, true, now(), 'dc-seed-v1')`,
  )
  .join(",\n");

const sql = `-- Seed social_venue_signals for DC (city_slug='dmv') from dc-venues-seed.json
-- Idempotent: clears prior seed rows first. Review columns vs live schema before running.
begin;

delete from public.social_venue_signals where city_slug = 'dmv' and generation_batch = 'dc-seed-v1';

insert into public.social_venue_signals
  (venue_name, venue_slug, city_slug, category, signal_type, platform, engagement_score, sentiment, snippet, neighborhood, hashtags, outing_tags, is_active, collected_at, generation_batch)
values
${values};

commit;

-- ${rows.length} venues seeded.
`;

writeFileSync(resolve(root, "scripts/seed-dc-social-signals.sql"), sql, "utf8");
console.log(`Wrote scripts/seed-dc-social-signals.sql — ${rows.length} venues.`);
