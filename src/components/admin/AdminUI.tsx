// Shared admin UI primitives. Used across all 30 admin pages so headers,
// KPIs, filter bars, empty/error/loading states stay consistent.
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ChevronRight, Download, Inbox, Loader2, RefreshCw, Search, X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* -------------------------- Page header -------------------------- */
type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  meta,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {Icon && (
            <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
              <Icon className="h-4 w-4 text-coral" />
            </span>
          )}
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* -------------------------- KPI card -------------------------- */
type Tone = "coral" | "purple" | "amber" | "emerald" | "pink" | "teal" | "gold" | "destructive";

const TONE_BG: Record<Tone, string> = {
  coral: "from-coral/30 to-coral/5",
  purple: "from-purple/30 to-purple/5",
  amber: "from-amber-400/30 to-amber-100/5",
  emerald: "from-emerald-400/25 to-emerald-100/5",
  pink: "from-pink/25 to-pink/5",
  teal: "from-teal/25 to-teal/5",
  gold: "from-gold/30 to-gold/5",
  destructive: "from-destructive/30 to-destructive/5",
};

type AdminKpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  to?: string;
  loading?: boolean;
  delta?: { value: number; label?: string };
  index?: number;
};

export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "coral",
  to,
  loading,
  delta,
  index,
}: AdminKpiCardProps) {
  const inner = (
    <>
      <span
        className="pointer-events-none absolute -right-2 -top-2 h-8 w-8 rotate-12 rounded-md bg-cream/40"
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
            <Icon className="h-4 w-4 text-ink" />
          </div>
        )}
        {to && (
          <ChevronRight className="h-4 w-4 text-ink opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
        )}
      </div>
      <div className="relative mt-3 font-display text-3xl font-bold leading-none tabular-nums text-ink">
        {loading ? "—" : typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="relative mt-2 text-[11px] font-bold uppercase tracking-wider text-ink/85">
        {label}
      </div>
      {(hint || delta) && (
        <div className="relative mt-0.5 flex items-center gap-1.5 text-[10px] text-ink/60">
          {delta && (
            <span
              className={cn(
                "rounded px-1 py-0.5 font-bold tabular-nums",
                delta.value >= 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/15 text-destructive",
              )}
            >
              {delta.value >= 0 ? "+" : ""}
              {delta.value}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
      {typeof index === "number" && (
        <span className="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] font-bold text-ink/30">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
    </>
  );

  const baseClass = cn(
    "group relative overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br p-4 shadow-brut transition",
    TONE_BG[tone],
    to && "hover:-translate-y-1 hover:-rotate-1 hover:shadow-[6px_6px_0_0_hsl(var(--ink))]",
  );

  if (to) {
    return (
      <Link to={to as never} className={baseClass}>
        {inner}
      </Link>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}

/* -------------------------- Filter bar -------------------------- */
type AdminFilterBarProps = {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
  refreshing?: boolean;
  className?: string;
};

export function AdminFilterBar({
  query,
  onQueryChange,
  placeholder = "Search…",
  children,
  onRefresh,
  onExport,
  refreshing,
  className,
}: AdminFilterBarProps) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card",
        className,
      )}
    >
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      )}
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="gap-1.5">
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      )}
    </div>
  );
}

/* -------------------------- States -------------------------- */
export function AdminLoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function AdminEmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 py-14 px-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink bg-cream shadow-brut">
        <Icon className="h-5 w-5 text-ink/60" />
      </div>
      <p className="mt-3 font-display text-base font-bold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border-2 border-destructive/30 bg-destructive/5 py-14 px-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-destructive bg-cream shadow-brut">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <p className="mt-3 font-display text-base font-bold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="mt-4 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

/* -------------------------- Section card -------------------------- */
export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          {title && (
            <div>
              <h2 className="font-display text-lg font-bold">{title}</h2>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* -------------------------- KPI grid wrapper -------------------------- */
export function AdminKpiGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 | 6 | 7 }) {
  const map: Record<number, string> = {
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    7: "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7",
  };
  return <section className={cn("grid gap-4", map[cols])}>{children}</section>;
}

/* -------------------------- CSV helper -------------------------- */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set()),
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
