import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  /** Visual size — default chip. */
  variant?: "chip" | "inline" | "icon";
  /** Optional tooltip-like label override. */
  title?: string;
  className?: string;
}

/**
 * "Verified" indicator. Shown only when we've confirmed the venue's
 * website or Instagram resolved live. The user-facing promise: this
 * isn't a hallucination — the business has a confirmed web presence.
 */
export function VerifiedBadge({
  variant = "chip",
  title = "Live web presence confirmed",
  className,
}: VerifiedBadgeProps) {
  if (variant === "icon") {
    return (
      <BadgeCheck
        aria-label={title}
        className={cn("inline-block size-3.5 text-emerald-600", className)}
      />
    );
  }
  if (variant === "inline") {
    return (
      <span
        title={title}
        className={cn(
          "inline-flex items-center gap-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-700",
          className,
        )}
      >
        <BadgeCheck className="size-2.5" /> Verified
      </span>
    );
  }
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-700",
        className,
      )}
    >
      <BadgeCheck className="size-2.5" /> Verified
    </span>
  );
}
