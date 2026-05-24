import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerPickBadgeProps {
  /**
   * Full label override. Defaults to "Partner Pick · Matches your vibe" —
   * deliberately specific so users see WHY it's there, not just an ad.
   */
  label?: string;
  /** Visual variant. */
  variant?: "chip" | "corner" | "inline";
  className?: string;
}

/**
 * Small, visually consistent "Partner Pick" marker. Renders only when the
 * caller decides the card is sponsored. Per Confetti's product principle:
 * every promoted placement must be clearly labeled — never disguised as
 * organic content.
 */
export function PartnerPickBadge({
  label = "Partner Pick · Matches your vibe",
  variant = "chip",
  className,
}: PartnerPickBadgeProps) {
  if (variant === "corner") {
    return (
      <span
        className={cn(
          "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-purple/30 bg-purple/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cream shadow-card",
          className,
        )}
      >
        <Sparkles className="h-2.5 w-2.5" /> Partner Pick
      </span>
    );
  }
  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-purple",
          className,
        )}
      >
        <Sparkles className="h-2.5 w-2.5" /> {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-purple/30 bg-purple/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-purple",
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" /> {label}
    </span>
  );
}
