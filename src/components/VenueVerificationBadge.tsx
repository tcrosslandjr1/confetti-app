import { useEffect, useState } from "react";
import { BadgeCheck, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "matched" | "unverified";

// Module-level cache to avoid duplicate lookups across mounts.
const cache = new Map<string, Status>();
const inflight = new Map<string, Promise<Status>>();

async function lookupStatus(name: string, hintVerified?: boolean): Promise<Status> {
  const key = name.trim().toLowerCase();
  if (!key) return "unverified";
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async (): Promise<Status> => {
    if (hintVerified) {
      cache.set(key, "matched");
      return "matched";
    }
    const { data } = await supabase
      .from("venue_details_cache")
      .select("place_id")
      .ilike("name", name)
      .not("place_id", "is", null)
      .limit(1)
      .maybeSingle();
    const status: Status = data?.place_id ? "matched" : "unverified";
    cache.set(key, status);
    return status;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

export function VenueVerificationBadge({
  venueName,
  verified,
  size = "sm",
  className = "",
}: {
  venueName: string;
  verified?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const [status, setStatus] = useState<Status>(() =>
    verified ? "matched" : (cache.get(venueName.trim().toLowerCase()) ?? "loading"),
  );

  useEffect(() => {
    let cancelled = false;
    if (status !== "loading") return;
    lookupStatus(venueName, verified).then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [venueName, verified, status]);

  const sizing =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-0.5"
      : size === "md"
        ? "text-xs px-2.5 py-1 gap-1.5"
        : "text-[11px] px-2 py-0.5 gap-1";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  if (status === "loading") {
    return (
      <span
        className={`inline-flex items-center rounded-full border-2 border-ink bg-cream font-mono uppercase tracking-wider text-muted-foreground ${sizing} ${className}`}
        title="Checking Google Places…"
      >
        <Loader2 className={`${iconSize} animate-spin`} /> Checking
      </span>
    );
  }
  if (status === "matched") {
    return (
      <span
        className={`inline-flex items-center rounded-full border-2 border-ink bg-emerald-200 font-mono font-semibold uppercase tracking-wider text-ink ${sizing} ${className}`}
        title="Confirmed on Google Places"
      >
        <BadgeCheck className={iconSize} /> Verified
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-ink bg-amber-100 font-mono font-semibold uppercase tracking-wider text-ink ${sizing} ${className}`}
      title="Not matched on Google Places — shown without confirmation"
    >
      <ShieldAlert className={iconSize} /> Unverified
    </span>
  );
}
