// Back-compat shim. The shared ConfettiMap supersedes LoopMap.
// Existing imports of <LoopMap /> continue to work.
import { ConfettiMap, type DirectionsStepLite } from "@/components/maps/ConfettiMap";
import type { LoopStop } from "@/lib/loop-store";

export type ActiveLegInfo = {
  fromIdx: number;
  toIdx: number;
  steps: DirectionsStepLite[];
  distanceText?: string;
  durationText?: string;
} | null;

export function LoopMap({
  stops,
  currentIdx,
  fallbackCity = "Washington, DC",
  onActiveLegChange,
}: {
  stops: LoopStop[];
  currentIdx: number;
  fallbackCity?: string;
  onActiveLegChange?: (info: ActiveLegInfo) => void;
}) {
  return (
    <ConfettiMap
      stops={stops.map((s) => ({ id: s.id, name: s.name, area: s.area, done: s.done }))}
      currentIdx={currentIdx}
      fallbackCity={fallbackCity}
      height="100%"
      showUserLocation
      onActiveStepsChange={onActiveLegChange}
    />
  );
}
