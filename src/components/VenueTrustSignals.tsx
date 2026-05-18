/**
 * VenueTrustSignals (a.k.a. TrustCard) — compact strip of verification,
 * crowd, pricing, and safety signals shown on a venue card.
 *
 * Designed to sit inside VenueDiscoveryCard between the core info and the
 * social action row, but can be reused anywhere a VenueCard is rendered.
 */

import type { ReactNode } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  Users,
  Clock,
  Wallet,
  Receipt,
  Lightbulb,
  Accessibility,
  Moon,
  GraduationCap,
} from "lucide-react";
import type { TrustSignals } from "@/lib/venue-discovery-types";

/* ------------------------------------------------------------------ */
/*  Atoms                                                              */
/* ------------------------------------------------------------------ */

type Tone = "verified" | "crowd" | "price" | "safety";

const TONE_STYLES: Record<Tone, string> = {
  verified: "border-emerald-300/70 bg-emerald-50 text-emerald-800",
  crowd: "border-violet-300/70 bg-violet-50 text-violet-800",
  price: "border-amber-300/70 bg-amber-50 text-amber-800",
  safety: "border-sky-300/70 bg-sky-50 text-sky-800",
};

function SignalChip({
  tone,
  icon,
  label,
  title,
}: {
  tone: Tone;
  icon: ReactNode;
  label: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? label}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${TONE_STYLES[tone]}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CROWD_LABEL: Record<NonNullable<TrustSignals["crowdLevel"]>, string> = {
  quiet: "Quiet now",
  buzzing: "Buzzing",
  packed: "Packed",
};

const SAFETY_META: Record<
  NonNullable<TrustSignals["safetyBadges"]>[number],
  { label: string; icon: ReactNode }
> = {
  "well-lit": { label: "Well-lit", icon: <Lightbulb className="h-2.5 w-2.5" /> },
  "staff-trained": {
    label: "Trained staff",
    icon: <GraduationCap className="h-2.5 w-2.5" />,
  },
  accessible: { label: "Accessible", icon: <Accessibility className="h-2.5 w-2.5" /> },
  "late-night-safe": { label: "Late-night safe", icon: <Moon className="h-2.5 w-2.5" /> },
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function VenueTrustSignals({
  trust,
  className,
}: {
  trust?: TrustSignals;
  className?: string;
}) {
  if (!trust) return null;

  const chips: ReactNode[] = [];

  // Verification
  if (trust.verified) {
    chips.push(
      <SignalChip
        key="verified"
        tone="verified"
        icon={<BadgeCheck className="h-2.5 w-2.5" />}
        label="Verified"
        title="Confetti-verified venue"
      />,
    );
  }
  if (trust.claimed) {
    chips.push(
      <SignalChip
        key="claimed"
        tone="verified"
        icon={<ShieldCheck className="h-2.5 w-2.5" />}
        label="Owner-claimed"
        title="Owner actively maintains this listing"
      />,
    );
  }

  // Crowd
  if (trust.crowdLevel) {
    chips.push(
      <SignalChip
        key="crowd"
        tone="crowd"
        icon={<Users className="h-2.5 w-2.5" />}
        label={CROWD_LABEL[trust.crowdLevel]}
      />,
    );
  }
  if (trust.waitTime) {
    chips.push(
      <SignalChip
        key="wait"
        tone="crowd"
        icon={<Clock className="h-2.5 w-2.5" />}
        label={trust.waitTime}
        title="Estimated wait time"
      />,
    );
  }

  // Pricing
  if (trust.avgSpend) {
    chips.push(
      <SignalChip
        key="spend"
        tone="price"
        icon={<Wallet className="h-2.5 w-2.5" />}
        label={trust.avgSpend}
        title="Average spend per person"
      />,
    );
  }
  if (trust.transparentPricing) {
    chips.push(
      <SignalChip
        key="transparent"
        tone="price"
        icon={<Receipt className="h-2.5 w-2.5" />}
        label="No surprise fees"
        title="Transparent pricing — no surprise fees"
      />,
    );
  }

  // Safety
  for (const badge of trust.safetyBadges ?? []) {
    const meta = SAFETY_META[badge];
    chips.push(
      <SignalChip key={`safety-${badge}`} tone="safety" icon={meta.icon} label={meta.label} />,
    );
  }

  if (chips.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1 rounded-2xl border border-ink/10 bg-cream/50 p-2 ${className ?? ""}`}
      aria-label="Venue trust signals"
    >
      {chips}
    </div>
  );
}

export default VenueTrustSignals;
