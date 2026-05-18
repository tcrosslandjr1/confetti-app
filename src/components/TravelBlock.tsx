import { useMemo, useState } from "react";
import { Car, Footprints, Zap, Users, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  buildUberLink,
  buildLyftLink,
  buildEvRouteLink,
  estimateEtas,
  showUber,
  showLyft,
  type LatLng,
  type RidePlace,
  type RideService,
  type UberVehicle,
  type LyftVehicle,
} from "@/lib/ride-links";
import { useRideSync } from "@/hooks/useRideSync";

export type TravelBlockProps = {
  from: LatLng;
  to: RidePlace;
  /** User profile prefs. */
  preferredRide?: RideService;
  preferredVehicle?: UberVehicle | LyftVehicle | null;
  evOwner?: boolean;
  /** Optional trip id — enables group sync broadcast. */
  tripId?: string;
  userName?: string;
};

export function TravelBlock({
  from,
  to,
  preferredRide = "both",
  preferredVehicle,
  evOwner = false,
  tripId,
  userName,
}: TravelBlockProps) {
  const etas = useMemo(() => estimateEtas(from, to), [from, to]);
  const [shared, setShared] = useState(false);
  const sync = useRideSync(tripId);

  const uberLink = useMemo(
    () =>
      buildUberLink(to, {
        pickup: { ...from },
        vehicle: (preferredVehicle as UberVehicle) ?? "uberx",
      }),
    [from, to, preferredVehicle],
  );
  const lyftLink = useMemo(
    () =>
      buildLyftLink(to, {
        pickup: { ...from },
        vehicle: (preferredVehicle as LyftVehicle) ?? "lyft",
      }),
    [from, to, preferredVehicle],
  );
  const evLink = useMemo(() => buildEvRouteLink(to, { ...from }), [from, to]);

  const broadcast = async (service: "uber" | "lyft" | "ev" | "walk", link: string) => {
    if (!tripId) return;
    await sync.send({
      service,
      link,
      eta:
        service === "uber"
          ? etas.uberEta
          : service === "lyft"
            ? etas.lyftEta
            : service === "ev"
              ? etas.evEta
              : etas.walk,
      destination: to.name ?? to.address ?? "destination",
      sender: userName ?? "Someone",
    });
    setShared(true);
    toast.success("Sent to group");
  };

  const open = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="p-4 space-y-3 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Travel to {to.name ?? "next stop"}
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {etas.distanceKm < 1
            ? `${Math.round(etas.distanceKm * 1000)} m`
            : `${etas.distanceKm.toFixed(1)} km`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Walk */}
        <RideRow
          icon={<Footprints className="size-4" />}
          label="Walk"
          eta={etas.walk}
          onOpen={() => open(buildEvRouteLink(to, { ...from }))}
          onShare={tripId ? () => broadcast("walk", evLink) : undefined}
        />

        {showUber(preferredRide) && (
          <RideRow
            icon={<Car className="size-4" />}
            label="Uber"
            eta={etas.uberEta}
            primary
            onOpen={() => open(uberLink)}
            onShare={tripId ? () => broadcast("uber", uberLink) : undefined}
          />
        )}

        {showLyft(preferredRide) && (
          <RideRow
            icon={<Car className="size-4" />}
            label="Lyft"
            eta={etas.lyftEta}
            onOpen={() => open(lyftLink)}
            onShare={tripId ? () => broadcast("lyft", lyftLink) : undefined}
          />
        )}

        {evOwner && (
          <RideRow
            icon={<Zap className="size-4" />}
            label="EV"
            eta={etas.evEta}
            onOpen={() => open(evLink)}
            onShare={tripId ? () => broadcast("ev", evLink) : undefined}
          />
        )}
      </div>

      {tripId && sync.peers.length > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs flex items-center gap-2">
          <Users className="size-3.5 text-primary" />
          <span className="font-medium">
            {sync.peers.length} {sync.peers.length === 1 ? "person" : "people"} en route
          </span>
          <span className="text-muted-foreground">
            · ETA {sync.peers[0]?.eta}
          </span>
        </div>
      )}

      {shared && tripId && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Share2 className="size-3" /> Group notified
        </p>
      )}
    </Card>
  );
}

function RideRow({
  icon,
  label,
  eta,
  primary,
  onOpen,
  onShare,
}: {
  icon: React.ReactNode;
  label: string;
  eta: string;
  primary?: boolean;
  onOpen: () => void;
  onShare?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
        primary ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-foreground/80">{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{label}</div>
          <div className="text-xs text-muted-foreground">{eta}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onShare && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={onShare}
            aria-label={`Send ${label} to group`}
          >
            <Share2 className="size-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          variant={primary ? "default" : "outline"}
          className="h-7 px-2 text-xs"
          onClick={onOpen}
        >
          Open <ExternalLink className="ml-1 size-3" />
        </Button>
      </div>
    </div>
  );
}
