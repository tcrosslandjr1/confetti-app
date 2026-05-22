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
