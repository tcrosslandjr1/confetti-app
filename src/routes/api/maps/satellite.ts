import { createFileRoute } from "@tanstack/react-router";

// Proxies a satellite still image (Google Maps Static API) for a given query.
// Uses a server-only Google key. Falls back to a transparent 1x1 if unavailable.
export const Route = createFileRoute("/api/maps/satellite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.slice(0, 256) ?? "";
        const zoom = Math.max(1, Math.min(20, Number(url.searchParams.get("zoom") ?? 16)));
        const w = Math.max(64, Math.min(1280, Number(url.searchParams.get("w") ?? 640)));
        const h = Math.max(64, Math.min(1280, Number(url.searchParams.get("h") ?? 360)));

        const key =
          process.env.GOOGLE_MAPS_API_KEY ||
          process.env.GOOGLE_PLACES_API_KEY ||
          process.env.VITE_GOOGLE_MAPS_API_KEY ||
          "";

        if (!q || !key) {
          return new Response("Missing q or key", { status: 400 });
        }

        const params = new URLSearchParams({
          center: q,
          zoom: String(zoom),
          size: `${w}x${h}`,
          scale: "2",
          maptype: "satellite",
          key,
        });
        // Marker at the same address so the destination is obvious.
        params.append("markers", `color:red|${q}`);

        const upstream = await fetch(
          `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`,
        );
        if (!upstream.ok) {
          return new Response(`Upstream ${upstream.status}`, { status: 502 });
        }
        const buf = await upstream.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
