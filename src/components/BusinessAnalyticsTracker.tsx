import { useBusinessNavPageviews } from "@/lib/business-analytics";

/** Mount-only component that records business-owner pageviews. */
export function BusinessAnalyticsTracker() {
  useBusinessNavPageviews();
  return null;
}
