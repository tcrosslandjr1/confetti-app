import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createVenueClaim,
  listMyClaims,
  type PackageTier,
  type VenueClaim,
  verificationTierForSub,
} from "@/lib/ads";
import { Building2, Loader2, ShieldCheck, Search, Plus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  advertiserId: string;
  subscriptionTier: PackageTier;
  contactEmail: string;
};

type VenueOption = { id: string; name: string; city: string | null };

export function ClaimVenuePanel({ advertiserId, subscriptionTier, contactEmail }: Props) {
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VenueOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listMyClaims(advertiserId).then((c) => {
      setClaims(c);
      setLoading(false);
    });
  }, [advertiserId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("venues" as never)
        .select("id, name, city")
        .ilike("name", `%${q}%`)
        .limit(8);
      setResults((data as unknown as VenueOption[]) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const tier = verificationTierForSub(subscriptionTier);

  async function claim(venue: VenueOption) {
    setBusyId(venue.id);
    try {
      const c = await createVenueClaim({
        advertiser_id: advertiserId,
        venue_id: venue.id,
        verification_tier: tier,
        contact_email: contactEmail,
      });
      setClaims((prev) => [c, ...prev]);
      setShowSearch(false);
      setQuery("");
      setResults([]);
      toast.success(
        c.status === "approved"
          ? `Claimed ${venue.name} — verified instantly`
          : `Claim submitted — ${tier === "email_match" ? "we'll verify via your email" : "admin review pending"}`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-primary">
            <Building2 className="h-3 w-3" /> Claimed venues
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">Verified business listings</h2>
          <p className="text-xs text-muted-foreground">
            Verification tier on your plan:{" "}
            <span className="font-bold text-foreground">{tierLabel(tier)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowSearch((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> Claim a venue
        </button>
      </div>

      {showSearch && (
        <div className="mt-4 rounded-2xl border-2 border-primary/30 bg-background p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venues by name…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
            {searching && (
              <div className="px-2 py-1 text-xs text-muted-foreground">Searching…</div>
            )}
            {!searching && query.length >= 2 && results.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">No matches.</div>
            )}
            {results.map((v) => (
              <button
                key={v.id}
                onClick={() => claim(v)}
                disabled={busyId === v.id}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-60"
              >
                <span>
                  <span className="font-semibold">{v.name}</span>
                  {v.city && (
                    <span className="ml-2 text-xs text-muted-foreground">{v.city}</span>
                  )}
                </span>
                {busyId === v.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
                    Claim
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="text-xs text-muted-foreground">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Loading claims…
          </div>
        ) : claims.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No venues claimed yet.
          </div>
        ) : (
          claims.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`h-3.5 w-3.5 ${
                      c.status === "approved" ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-mono text-xs">{c.venue_id.slice(0, 8)}…</span>
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tierLabel(c.verification_tier)}
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  c.status === "approved"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : c.status === "rejected"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-700"
                }`}
              >
                {c.status}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function tierLabel(t: string) {
  return t === "self_attest"
    ? "Self-attest (instant)"
    : t === "email_match"
      ? "Email match"
      : "Admin review";
}
