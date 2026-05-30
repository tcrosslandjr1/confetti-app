import { cn } from "@/lib/utils";

/**
 * PageHero — brutalist editorial header matching the marketing site.
 * Cream wash, ink border, mono eyebrow, display headline, optional sticker badge.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  right,
  children,
  badge,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  badge?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b-2 border-ink bg-cream px-5 pt-6 pb-6",
        className,
      )}
    >
      {/* ambient accents */}
      <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-coral/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full bg-gold/30 blur-3xl" />

      {badge && (
        <div className="absolute -top-2 left-4 z-10 -rotate-3 rounded-md border-2 border-ink bg-gold px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut">
          {badge}
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cream/60">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-2 font-display text-[30px] leading-[0.95] font-extrabold tracking-[-0.03em] text-cream">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-[34ch] text-sm leading-snug text-cream/70">{subtitle}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>

      {children && <div className="relative mt-5">{children}</div>}
    </section>
  );
}

/**
 * BrandCard — brutalist surface (ink border + brut shadow + cream/white fill).
 * `tone` lets you pick the fill; `interactive` adds the signature pop on hover.
 */
export function BrandCard({
  children,
  className,
  as: As = "div",
  tone = "white",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  tone?: "white" | "cream" | "ink" | "coral" | "gold";
  interactive?: boolean;
}) {
  const fill =
    tone === "ink"
      ? "bg-ink text-cream"
      : tone === "coral"
        ? "bg-coral text-cream"
        : tone === "gold"
          ? "bg-gold text-cream"
          : tone === "cream"
            ? "bg-cream text-cream"
            : "bg-white text-cream";
  return (
    <As
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-ink shadow-brut",
        fill,
        interactive &&
          "transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg",
        className,
      )}
    >
      {children}
    </As>
  );
}

export function SectionTitle({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-5">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-gold text-cream shadow-brut">
            <Icon className="size-3.5" />
          </span>
        )}
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cream">
          {title}
        </h3>
      </div>
      {action && (
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * BrutButton — pop-on-hover pill that matches the marketing CTAs.
 * @deprecated Prefer `<Button variant="ink" />` (or gold/default) from ui/button.
 * This component exists for backward compat and will be removed in a future pass.
 */
type BrutButtonProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "ink" | "coral" | "cream" | "gold";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  as?: React.ElementType;
  [key: string]: unknown;
};

export function BrutButton({
  children,
  className,
  tone = "ink",
  size = "md",
  disabled = false,
  as: As = "button",
  ...rest
}: BrutButtonProps) {
  const fill =
    tone === "coral"
      ? "bg-coral text-cream"
      : tone === "cream"
        ? "bg-cream text-cream"
        : tone === "gold"
          ? "bg-gold text-cream"
          : "bg-ink text-cream";
  const sizes =
    size === "sm"
      ? "h-9 px-4 text-[11px]"
      : size === "lg"
        ? "h-13 px-6 text-sm"
        : "h-11 px-5 text-xs";
  return (
    <As
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink font-mono font-bold uppercase tracking-widest shadow-brut transition-pop",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg",
        "active:translate-x-0 active:translate-y-0 active:shadow-brut",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        fill,
        sizes,
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </As>
  );
}
