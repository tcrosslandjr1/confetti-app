// Back-compat shim. The shared ConfettiMap supersedes LoopMap.
// Existing imports of <LoopMap /> continue to work.
import { ConfettiMap, type DirectionsStepLite, type TravelMode } from "@/components/maps/ConfettiMap";
import type { LoopStop } from "@/lib/loop-store";

export type { TravelMode } from "@/components/maps/ConfettiMap";

export type ActiveLegInfo = {
  fromIdx: number;
  toIdx: number;
  steps: DirectionsStepLite[];
  distanceText?: string;
  durationText?: string;
  travelMode: TravelMode;
} | null;

export function LoopMap({
  stops,
  currentIdx,
  fallbackCity = "Washington, DC",
  travelMode = "DRIVING",
  onActiveLegChange,
}: {
  stops: LoopStop[];
  currentIdx: number;
  fallbackCity?: string;
  travelMode?: TravelMode;
  onActiveLegChange?: (info: ActiveLegInfo) => void;
}) {
  return (
    <ConfettiMap
      stops={stops.map((s) => ({ id: s.id, name: s.name, area: s.area, done: s.done }))}
      currentIdx={currentIdx}
      fallbackCity={fallbackCity}
      height="100%"
      showUserLocation
      travelMode={travelMode}
      onActiveStepsChange={onActiveLegChange}
    />
  );
}
