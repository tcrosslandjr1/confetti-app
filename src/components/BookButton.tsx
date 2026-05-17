import { useState } from "react";
import { Calendar, ExternalLink, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  buildBookingLink,
  buildAllBookingLinks,
  type BookingContext,
  type BookProvider,
} from "@/lib/booking-deeplinks";
import { recordPickSignal } from "@/lib/pick-signals.functions";
import { useServerFn } from "@tanstack/react-start";

type Variant = "primary" | "secondary" | "compact";

export function BookButton({
  ctx,
  variant = "primary",
  className,
}: {
  ctx: BookingContext;
  variant?: Variant;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const recordSignal = useServerFn(recordPickSignal);

  const primary = buildBookingLink(ctx);
  const others = buildAllBookingLinks(ctx).filter((l) => l.provider !== primary.provider);

  function track(provider: BookProvider, isSearch: boolean) {
    // Fire-and-forget — booking attribution feeds the AI taste profile too.
    recordSignal({
      data: {
        kind: "booking_click",
        value: provider,
        context: {
          venue: ctx.venueName,
          city: ctx.city ?? null,
          partySize: ctx.partySize ?? null,
          isSearch,
        },
      },
    }).catch(() => undefined);
  }

  function open(url: string, provider: BookProvider, isSearch: boolean) {
    track(provider, isSearch);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    if (isSearch) {
      toast(`Opening ${primary.label} search`, {
        description: "We pre-filled your party + date — pick a slot to confirm.",
      });
    }
    setMenuOpen(false);
  }

  const baseBtn =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
      : variant === "secondary"
        ? "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5"
        : "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5";

  return (
    <div className={`relative inline-flex ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => open(primary.url, primary.provider, primary.isSearch)}
        className={`${baseBtn} rounded-r-none border-r-0`}
      >
        <Calendar className="h-4 w-4" />
        Book on {primary.label}
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </button>
      <button
        type="button"
        aria-label="Choose booking provider"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className={`${baseBtn} rounded-l-none px-2`}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border-2 border-ink bg-cream p-2 shadow-brut text-ink"
        >
          <div className="px-2 pt-1 pb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
            Try another site
          </div>
          {others.map((l) => (
            <button
              key={l.provider}
              type="button"
              onClick={() => open(l.url, l.provider, l.isSearch)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-bold hover:bg-gold/40"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> {l.label}
              </span>
              {l.isSearch ? (
                <span className="text-[9px] font-mono uppercase text-ink/50">search</span>
              ) : (
                <Check className="h-3.5 w-3.5 text-coral" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
