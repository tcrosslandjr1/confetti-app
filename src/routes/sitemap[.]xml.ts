import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { OCCASIONS } from "@/lib/occasions";
import { CITIES } from "@/lib/cities";

const BASE_URL = process.env.SITE_URL ?? "https://confettiplan.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/new/explore", changefreq: "daily", priority: "0.8" },
  { path: "/cities", changefreq: "weekly", priority: "0.9" },
  { path: "/events", changefreq: "daily", priority: "0.8" },
  { path: "/for-business", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          ...STATIC_ROUTES,
          ...OCCASIONS.map((o) => ({
            path: `/ideas/${o.slug}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
          ...CITIES.map((c) => ({
            path: `/cities/${c.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
