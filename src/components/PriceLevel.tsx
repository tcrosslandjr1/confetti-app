/**
 * PriceLevel — displays price range as $ signs (1–4) with optional label.
 * Matches Yelp / Google Maps convention.
 */

export function PriceLevel({
  level,
  showLabel = false,
  size = "md",
}: {
  level: 1 | 2 | 3 | 4;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const labels: Record<number, string> = {
    1: "Budget-friendly",
    2: "Moderate",
    3: "Upscale",
    4: "Fine dining",
  };

  const textSize =
    size === "sm"
      ? "text-[11px]"
      : size === "lg"
        ? "text-base"
        : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${textSize} font-bold`}>
      <span className="text-cream/80">
        {"$".repeat(level)}
      </span>
      <span className="text-cream/25">
        {"$".repeat(4 - level)}
      </span>
      {showLabel && (
        <span className="ml-1 font-normal text-cream/50">{labels[level]}</span>
      )}
    </span>
  );
}
