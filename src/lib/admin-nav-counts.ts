// Live counts for the admin sidebar badges. One query, refreshed every 30s.
// Used by admin.lazy.tsx to decorate nav items with pending counts.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminNavCounts = {
  pendingAdvertisers: number;
  pendingClaims: number;
  pendingModeration: number;
  unreadNotifications: number;
  pendingBookings: number;
};

async function safeCount(table: string, build?: (q: any) => any): Promise<number> {
  try {
    let q = supabase.from(table as any).select("id", { count: "exact", head: true });
    if (build) q = build(q);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export function useAdminNavCounts() {
  return useQuery<AdminNavCounts>({
    queryKey: ["admin", "nav-counts"],
    queryFn: async () => {
      const [
        pendingAdvertisers,
        pendingClaims,
        pendingModeration,
        unreadNotifications,
        pendingBookings,
      ] = await Promise.all([
        safeCount("advertisers", (q) => q.eq("status", "pending_review")),
        safeCount("venue_claims", (q) => q.eq("status", "pending")),
        safeCount("venue_reports", (q) => q.eq("status", "open")),
        safeCount("notifications", (q) => q.is("read_at", null)),
        safeCount("bookings", (q) => q.eq("status", "pending")),
      ]);
      return {
        pendingAdvertisers,
        pendingClaims,
        pendingModeration,
        unreadNotifications,
        pendingBookings,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// Mapping from nav route -> which count to display.
export const ROUTE_TO_COUNT_KEY: Record<string, keyof AdminNavCounts> = {
  "/admin/advertisers": "pendingAdvertisers",
  "/admin/business-claims": "pendingClaims",
  "/admin/moderation": "pendingModeration",
  "/admin/notifications": "unreadNotifications",
  "/admin/bookings": "pendingBookings",
};
