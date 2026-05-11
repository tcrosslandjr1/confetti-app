// Back-compat shim. The shared ConfettiMap supersedes LoopMap.
// Existing imports of <LoopMap /> continue to work.
import { ConfettiMap } from "@/components/maps/ConfettiMap";
import type { LoopStop } from "@/lib/loop-store";

export function LoopMap({
  stops,
  currentIdx,
  fallbackCity = "Washington, DC",
}: {
  stops: LoopStop[];
  currentIdx: number;
  fallbackCity?: string;
}) {
  return (
    <ConfettiMap
      stops={stops.map((s) => ({ id: s.id, name: s.name, area: s.area, done: s.done }))}
      currentIdx={currentIdx}
      fallbackCity={fallbackCity}
      height="100%"
      showUserLocation
    />
  );
}
