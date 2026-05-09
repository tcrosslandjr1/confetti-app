import { useEffect, useState } from "react";
import { listLiveCampaignsByPlacement, trackAdEvent, type Campaign, type Placement } from "@/lib/ads";
import { useAuth } from "@/lib/auth-context";
import { withUtm } from "@/lib/utm";
import { Megaphone, Sparkles, ArrowRight } from "lucide-react";

function ctaHref(c: Campaign, surface: string): string {
  return withUtm(c.cta_url ?? null, {
    surface,
    brand: (c as unknown as { advertiser_name?: string; brand?: string }).advertiser_name
      ?? (c as unknown as { brand?: string }).brand
      ?? c.headline
      ?? "promoted",
    occasion: c.headline,
  });
}

type Props = {
  placement: Placement;
  surface: string;
  variant?: "spotlight" | "rail" | "boost";
  title?: string;
  className?: string;
};

/**
 * Renders approved, currently-running ad campaigns for a placement and tracks
 * impressions/clicks. Visually distinct ("Promoted" badge) — never disguised
 * as organic content.
 */
export function PromotedSlot({ placement, surface, variant = "rail", title, className }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Campaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    listLiveCampaignsByPlacement(placement, variant === "spotlight" || variant === "boost" ? 1 : 4).then((cs) => {
      if (cancelled) return;
      setItems(cs);
      cs.forEach((c) => trackAdEvent(c.id, "impression", surface, user?.id ?? null));
    });
    return () => { cancelled = true; };
  }, [placement, surface, variant, user?.id]);

  if (items.length === 0) return null;

  const onClick = (c: Campaign) => {
    void trackAdEvent(c.id, "click", surface, user?.id ?? null);
  };

  if (variant === "spotlight") {
    const c = items[0];
    return (
      <a
        href={c.cta_url ?? "#"}
        target={c.cta_url ? "_blank" : undefined}
        rel="noreferrer"
        onClick={() => onClick(c)}
        className={`group relative block overflow-hidden rounded-3xl border-2 border-foreground/10 bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-pop transition hover:border-primary/40 ${className ?? ""}`}
      >
        <PromotedBadge />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Tonight's spotlight
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold leading-tight">{c.headline}</h3>
            {c.blurb && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.blurb}</p>}
          </div>
          {c.cta_url && (
            <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background">
              {c.cta_label || "Visit"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </a>
    );
  }

  if (variant === "boost") {
    const c = items[0];
    return (
      <a
        href={c.cta_url ?? "#"}
        target={c.cta_url ? "_blank" : undefined}
        rel="noreferrer"
        onClick={() => onClick(c)}
        className={`group relative flex items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 text-sm hover:border-primary ${className ?? ""}`}
      >
        <Megaphone className="h-4 w-4 flex-shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Promoted add-on</div>
          <div className="font-semibold">{c.headline}</div>
          {c.blurb && <div className="truncate text-xs text-muted-foreground">{c.blurb}</div>}
        </div>
        {c.cta_url && <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />}
      </a>
    );
  }

  // rail
  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="font-display text-xl font-bold">{title ?? "Promoted picks"}</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sponsored</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((c) => (
          <a
            key={c.id}
            href={c.cta_url ?? "#"}
            target={c.cta_url ? "_blank" : undefined}
            rel="noreferrer"
            onClick={() => onClick(c)}
            className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            <PromotedBadge />
            <h4 className="mt-1 font-display text-base font-bold leading-tight">{c.headline}</h4>
            {c.blurb && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.blurb}</p>}
            {c.city && <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{c.city}</p>}
          </a>
        ))}
      </div>
    </section>
  );
}

function PromotedBadge() {
  return (
    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-foreground/80">
      <Megaphone className="h-2.5 w-2.5" /> Promoted
    </span>
  );
}
