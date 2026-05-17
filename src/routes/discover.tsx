import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutList, Map as MapIcon, MapPin, Star, Loader2, Search, X } from "lucide-react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { supabase } from "@/integrations/supabase/client";
import { confettiMapStyle } from "@/components/maps/mapStyles";
import { useGeocodedPoints } from "@/lib/geocode";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useCallback } from "react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Nearby — Confetti" },
      {
        name: "description",
        content:
          "Browse trending Confetti venues near you, in list or map view.",
      },
      { property: "og:title", content: "Discover Nearby — Confetti" },
      { property: "og:description", content: "Browse trending venues near you, in list or map view." },
    ],
  }),
  component: DiscoverPage,
});

type VenueRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  address: string | null;
  photo: string | null;
  rating: number | null;
};

function DiscoverPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [rows, setRows] = useState<VenueRow[] | null>(null);
  const [q, setQ] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const filtered = useMemo(() => {
    if (!rows) return rows;
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.name, r.neighborhood, r.address].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [rows, q]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("viral_venues")
      .select("id,venue_name,neighborhood,address,photo_url,rating")
      .eq("verified", true)
      .order("trend_score", { ascending: false })
      .limit(60);
    setRows(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.venue_name,
        neighborhood: r.neighborhood,
        address: r.address,
        photo: r.photo_url,
        rating: r.rating != null ? Number(r.rating) : null,
      }))
    );
    // Bump nonce so the map view re-mounts its markers and re-fits bounds,
    // even when the underlying rows are byte-identical to the prior fetch.
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <PullToRefresh onRefresh={load}>
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Discover Nearby</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trending spots curated for your city.
        </p>

        <div className="mt-4 inline-flex rounded-full border-2 border-ink bg-cream p-1 shadow-brut">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition ${
              view === "list" ? "bg-ink text-cream" : "text-ink/70"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView("map")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition ${
              view === "map" ? "bg-ink text-cream" : "text-ink/70"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-2 shadow-brut">
          <Search className="h-4 w-4 text-ink/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues, neighborhoods, addresses…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            aria-label="Search venues"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="grid h-6 w-6 place-items-center rounded-full text-ink/60 hover:bg-ink/10"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-2xl px-4">
        {filtered === null ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading venues…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {q ? `No venues match "${q}".` : "No trending venues yet. Check back soon."}
          </div>
        ) : view === "list" ? (
          <ul className="space-y-3">
            {filtered.map((v) => (
              <li
                key={v.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <Link to="/venue/$id" params={{ id: v.id }} className="flex gap-3">
                  {v.photo ? (
                    <img
                      src={v.photo}
                      alt={v.name}
                      className="h-24 w-24 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="grid h-24 w-24 shrink-0 place-items-center bg-muted text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-center pr-3">
                    <div className="font-display text-base font-bold leading-tight">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.neighborhood ?? v.address ?? "Nearby"}
                    </div>
                    {v.rating != null && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-gold text-gold" /> {v.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <DiscoverMap rows={filtered} />
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

function DiscoverMap({ rows }: { rows: VenueRow[] }) {
  const [selected, setSelected] = useState<VenueRow | null>(null);
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="grid h-[60vh] place-items-center rounded-2xl border-2 border-ink bg-cream text-sm text-muted-foreground">
        Map unavailable
      </div>
    );
  }
  return (
    <div className="relative h-[70vh] overflow-hidden rounded-3xl border-2 border-ink bg-cream shadow-brut">
      <Map
        defaultZoom={12}
        defaultCenter={{ lat: 38.9072, lng: -77.0369 }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        styles={confettiMapStyle}
        clickableIcons={false}
        className="h-full w-full"
      >
        <DiscoverMarkers rows={rows} onSelect={setSelected} />
      </Map>
      {selected ? <SelectedCard row={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function DiscoverMarkers({
  rows,
  onSelect,
}: {
  rows: VenueRow[];
  onSelect: (row: VenueRow) => void;
}) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const inputs = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        query: r.address || `${r.name}, ${r.neighborhood ?? "Washington, DC"}`,
      })),
    [rows]
  );
  const points = useGeocodedPoints(inputs);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (points.length === 0) return;

    rows.forEach((row) => {
      const pt = points.find((p) => p.id === row.id);
      if (!pt) return;
      const marker = new google.maps.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#F05537",
          fillOpacity: 1,
          strokeColor: "#1A1410",
          strokeWeight: 2,
        },
        title: row.name,
      });
      marker.addListener("click", () => onSelect(row));
      markersRef.current.push(marker);
    });

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    if (!bounds.isEmpty()) map.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, points, rows, onSelect]);

  return null;
}

function SelectedCard({ row, onClose }: { row: VenueRow; onClose: () => void }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
      <div className="flex items-center gap-3">
        {row.photo ? (
          <img
            src={row.photo}
            alt={row.name}
            className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-ink bg-muted">
            <MapPin className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold leading-tight">{row.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.neighborhood ?? row.address ?? "Nearby"}
          </div>
          {row.rating != null && (
            <div className="mt-0.5 inline-flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-gold text-gold" /> {row.rating.toFixed(1)}
            </div>
          )}
        </div>
        <Link
          to="/venue/$id"
          params={{ id: row.id }}
          className="rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut"
        >
          View
        </Link>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

