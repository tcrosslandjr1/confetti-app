import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RideService } from "@/lib/ride-links";

type Prefs = {
  preferred_ride: RideService;
  preferred_vehicle: string | null;
  ev_owner: boolean;
};

export function RidePreferencesPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["ride-prefs"],
    queryFn: async (): Promise<Prefs | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("preferred_ride, preferred_vehicle, ev_owner")
        .eq("id", u.user.id)
        .maybeSingle();
      return (p as Prefs) ?? null;
    },
  });

  const [local, setLocal] = useState<Prefs>({
    preferred_ride: "both",
    preferred_vehicle: null,
    ev_owner: false,
  });

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (next: Prefs) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update(next)
        .eq("id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ride preferences saved");
      qc.invalidateQueries({ queryKey: ["ride-prefs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Preferred Ride Service</h3>
        <p className="text-sm text-muted-foreground">
          Confetti uses this to one-tap your travel between stops.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Service</Label>
          <Select
            value={local.preferred_ride}
            onValueChange={(v) =>
              setLocal((s) => ({ ...s, preferred_ride: v as RideService }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uber">Uber</SelectItem>
              <SelectItem value="lyft">Lyft</SelectItem>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vehicle</Label>
          <Select
            value={local.preferred_vehicle ?? "default"}
            onValueChange={(v) =>
              setLocal((s) => ({
                ...s,
                preferred_vehicle: v === "default" ? null : v,
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="uberx">UberX</SelectItem>
              <SelectItem value="uberxl">UberXL</SelectItem>
              <SelectItem value="uberblack">Uber Black</SelectItem>
              <SelectItem value="lyft">Lyft Standard</SelectItem>
              <SelectItem value="lyft_plus">Lyft XL</SelectItem>
              <SelectItem value="lyft_lux">Lyft Lux</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label className="text-sm">EV owner</Label>
          <p className="text-xs text-muted-foreground">
            Get EV-aware routing via Apple Maps.
          </p>
        </div>
        <Switch
          checked={local.ev_owner}
          onCheckedChange={(v) => setLocal((s) => ({ ...s, ev_owner: v }))}
        />
      </div>

      <Button
        onClick={() => save.mutate(local)}
        disabled={save.isPending}
        className="w-full sm:w-auto"
      >
        {save.isPending ? "Saving…" : "Save preferences"}
      </Button>
    </Card>
  );
}
