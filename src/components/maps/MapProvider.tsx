import { APIProvider } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";

/**
 * App-wide Google Maps loader. Loads the Maps JS API exactly once with the
 * libraries every screen needs (places, geometry, routes/directions, marker).
 * All map components below render <Map> without their own APIProvider.
 */
export function MapProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_MAPS_API_KEY) return <>{children}</>;
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "geometry", "routes", "marker"]}>
      {children}
    </APIProvider>
  );
}
