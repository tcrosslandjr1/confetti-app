/**
 * FIX: Dead buttons → "Coming Soon" toast
 * CREATE this file at: src/lib/coming-soon.ts
 *
 * Problem: ~65 buttons across partner portal, business dashboard,
 * corporate module, and app reels do nothing when clicked.
 * Users click and nothing happens — bad experience.
 *
 * This gives you a one-liner to drop into any dead button:
 *
 *   import { comingSoon } from "@/lib/coming-soon";
 *
 *   <Button onClick={() => comingSoon("Analytics")}>View Analytics</Button>
 *
 * The user sees a friendly toast: "Analytics is coming soon!"
 *
 * HOW TO APPLY:
 * 1. Create this file
 * 2. Find dead buttons (onClick={() => {}} or onClick={handleX} where
 *    handleX does nothing meaningful)
 * 3. Replace with onClick={() => comingSoon("Feature Name")}
 *
 * Priority files to fix (most dead buttons):
 *   - src/routes/partner.* (entire portal)
 *   - src/routes/business.dashboard*
 *   - src/routes/corporate.*
 *   - src/components/reels/*
 */
import { toast } from "sonner";

/**
 * Show a friendly "coming soon" toast for features not yet built.
 * @param feature - Human-readable feature name (e.g. "Analytics", "Export")
 */
export function comingSoon(feature?: string) {
  const label = feature ? `${feature} is` : "This feature is";
  toast(`${label} coming soon!`, {
    description: "We're working on it. Check back later.",
    duration: 3000,
  });
}

/**
 * Returns a click handler for use in JSX.
 * Usage: <Button onClick={comingSoonHandler("Payouts")}>Payouts</Button>
 */
export function comingSoonHandler(feature?: string) {
  return (e?: React.MouseEvent) => {
    e?.preventDefault();
    comingSoon(feature);
  };
}
