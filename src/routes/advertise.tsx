import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise on Loop — reach planners ready to book" },
      {
        name: "description",
        content:
          "Promote your venue on Loop. Get featured in nearby rails, AI-generated itineraries, and the home spotlight banner.",
      },
      { property: "og:title", content: "Advertise on Loop" },
      {
        property: "og:description",
        content: "Reach diners, daters, and night-out planners the moment they're ready to book.",
      },
    ],
  }),
  component: AdvertiseLayout,
});

function AdvertiseLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
