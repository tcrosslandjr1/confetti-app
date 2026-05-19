import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page loading skeleton matching the admin shell layout (sidebar + header
 * + main content grid). Rendered while the /admin route is fetching or while
 * the auth gate is resolving so the page never appears blank.
 */
export function AdminSkeleton() {
  return (
    <div
      className="flex min-h-screen w-full bg-gradient-to-br from-cream/60 via-background to-background"
      aria-busy="true"
      aria-label="Loading admin console"
      role="status"
    >
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r-2 border-ink/10 bg-cream/30 p-3 md:block">
        {/* Brand chip */}
        <Skeleton className="mb-4 h-14 w-full rounded-2xl" />

        {/* Nav sections */}
        {Array.from({ length: 5 }).map((_, sectionIdx) => (
          <div key={sectionIdx} className="mb-5 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            {Array.from({ length: 3 }).map((_, itemIdx) => (
              <div key={itemIdx} className="flex items-center gap-2.5 px-2 py-1.5">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-3 flex-1 rounded" />
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <Skeleton className="h-7 w-7 rounded md:hidden" />
          <Skeleton className="h-4 w-32 rounded" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="hidden h-3 w-40 rounded sm:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-6 px-3 pb-6 pt-4 sm:p-6">
          {/* Page heading */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>

          {/* Wide content panel */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
            <Skeleton className="h-5 w-40 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/3 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <span className="sr-only">Loading admin console…</span>
    </div>
  );
}
