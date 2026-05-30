import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "./button";

/* ── Shared state components ──────────────────────────────────────────
   Consistent empty, error, and loading states across every page.
   Uses the app's cream/ink token system with brutalist accents.
   ──────────────────────────────────────────────────────────────────── */

interface StateShellProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  children?: React.ReactNode;
}

function StateShell({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  className,
  children,
}: StateShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-14 place-items-center rounded-2xl border-2 border-cream/10 bg-cream/5",
          iconClassName,
        )}
      >
        <Icon className="size-6 text-cream/40" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight text-cream">{title}</h3>
      {description && (
        <p className="max-w-[260px] text-sm leading-relaxed text-cream/55">{description}</p>
      )}
      {action && (
        <Button variant="ink" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <StateShell
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    >
      {children}
    </StateShell>
  );
}

/* ── ErrorState ──────────────────────────────────────────────────── */

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We hit a snag. Give it another shot.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <StateShell
      icon={AlertCircle}
      iconClassName="border-destructive/20 bg-destructive/8"
      title={title}
      description={description}
      action={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
      className={className}
    />
  );
}

/* ── LoadingState ────────────────────────────────────────────────── */

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16", className)}
      role="status"
      aria-label={message}
    >
      <Loader2 className="size-8 animate-spin text-coral" strokeWidth={2} />
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-cream/45">
        {message}
      </p>
    </div>
  );
}

/* ── PageSkeleton — full-page shimmer placeholder ───────────────── */

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 px-5 pt-6", className)} role="status" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded-full bg-cream/[0.06]" />
        <div className="h-7 w-48 rounded-full bg-cream/[0.06]" />
      </div>
      {/* Card skeletons */}
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative isolate overflow-hidden rounded-2xl border border-cream/10 bg-cream/5 p-5"
          >
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded-full bg-cream/[0.06]" />
              <div className="h-3 w-1/2 rounded-full bg-cream/[0.06]" />
            </div>
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[skeleton-shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-ink/[0.04] to-transparent bg-[length:200%_100%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
