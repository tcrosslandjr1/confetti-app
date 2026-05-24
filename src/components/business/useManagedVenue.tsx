import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyManagedVenues } from "@/lib/business-portal.functions";

const STORAGE_KEY = "confetti.activeVenueId";

export function useManagedVenues() {
  const fetcher = useServerFn(listMyManagedVenues);
  const query = useQuery({
    queryKey: ["my-managed-venues"],
    queryFn: () => fetcher(),
    staleTime: 30_000,
  });
  const venues = query.data?.venues ?? [];

  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!venues.length) return;
    if (!activeId || !venues.find((v: { id: string }) => v.id === activeId)) {
      const first = venues[0].id;
      setActiveIdState(first);
      try {
        window.localStorage.setItem(STORAGE_KEY, first);
      } catch {
        /* ignore */
      }
    }
  }, [venues, activeId]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const activeVenue = useMemo(
    () => venues.find((v: { id: string }) => v.id === activeId) ?? null,
    [venues, activeId],
  );

  return { ...query, venues, activeId, activeVenue, setActiveId };
}

export function VenueSwitcher({
  venues,
  activeId,
  onChange,
}: {
  venues: Array<{ id: string; name: string }>;
  activeId: string | null;
  onChange: (id: string) => void;
}) {
  if (!venues.length) return null;
  if (venues.length === 1) {
    return (
      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
        {venues[0].name}
      </span>
    );
  }
  return (
    <select
      value={activeId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold focus:border-ink focus:outline-none"
    >
      {venues.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}

export function NoVenueClaim() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="text-sm text-muted-foreground">
        You don't manage any approved venues yet. Submit a claim to get started.
      </p>
      <a
        href="/business/claim"
        className="mt-3 inline-flex rounded-full border border-ink bg-ink px-4 py-1.5 text-xs font-semibold text-cream"
      >
        Claim a venue
      </a>
    </div>
  );
}
