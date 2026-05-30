#!/usr/bin/env node
/**
 * Generate a static public/sitemap.xml.
 *
 * The app deploys as a client-side SPA on Vercel, so the TanStack Start
 * server route at src/routes/sitemap[.]xml.ts never runs in production and
 * the URL 404s. This script emits a static sitemap at build time instead,
 * pulling city + occasion slugs straight from the source of truth so the
 * sitemap never drifts from the actual routes.
 *
 * Wired into `prebuild` in package.json — runs automatically before `vite build`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const BASE_URL = process.env.SITE_URL ?? "https://ai-lifestyle-concierge.vercel.app";

/** Pull every `slug: "..."` literal out of a source file. */
function slugsFrom(relPath) {
  try {
    const src = readFileSync(resolve(root, relPath), "utf8");
    return [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

const cities = slugsFrom("src/lib/cities.ts");
const occasions = slugsFrom("src/lib/occasions.ts");

/** Curated public, indexable routes (no auth/admin/business/internal surfaces). */
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/new/explore", changefreq: "daily", priority: "0.8" },
  { path: "/cities", changefreq: "weekly", priority: "0.9" },
  { path: "/events", changefreq: "daily", priority: "0.8" },
  { path: "/for-business", changefreq: "monthly", priority: "0.7" },
  { path: "/influencer", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
];

const entries = [
  ...STATIC_ROUTES,
  ...occasions.map((slug) => ({ path: `/ideas/${slug}`, changefreq: "weekly", priority: "0.6" })),
  ...cities.map((slug) => ({ path: `/cities/${slug}`, changefreq: "weekly", priority: "0.8" })),
];

const lastmod = new Date().toISOString().slice(0, 10);

const urls = entries
  .map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n"),
  )
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  "</urlset>",
  "",
].join("\n");

writeFileSync(resolve(root, "public/sitemap.xml"), xml, "utf8");
console.log(`sitemap.xml written: ${entries.length} urls (${cities.length} cities, ${occasions.length} occasions)`);
