import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import { getManagedVenue, updateVenueSettings } from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/settings")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Venue Settings — Confetti for Business" }] }),
  component: BusinessSettingsPage,
});

type Form = {
  name: string;
  description: string;
  city: string;
  neighborhood: string;
  website: string;
  price_band: string;
  category: string;
  staff_email: string;
};

function emptyForm(): Form {
  return {
    name: "",
    description: "",
    city: "",
    neighborhood: "",
    website: "",
    price_band: "",
    category: "",
    staff_email: "",
  };
}

function BusinessSettingsPage() {
  const { venues, activeId, setActiveId, isLoading } = useManagedVenues();
  const fetchVenue = useServerFn(getManagedVenue);
  const update = useServerFn(updateVenueSettings);
  const qc = useQueryClient();

  const venueQuery = useQuery({
    queryKey: ["managed-venue", activeId],
    queryFn: () => fetchVenue({ data: { venueId: activeId! } }),
    enabled: Boolean(activeId),
  });

  const [form, setForm] = useState<Form>(emptyForm());

  useEffect(() => {
    const v = venueQuery.data;
    if (!v) return;
    setForm({
      name: v.name ?? "",
      description: v.description ?? "",
      city: v.city ?? "",
      neighborhood: v.neighborhood ?? "",
      website: v.website ?? "",
      price_band: v.price_band ?? "",
      category: v.category ?? "",
      staff_email: v.staff_email ?? "",
    });
  }, [venueQuery.data]);

  const save = useMutation({
    mutationFn: () => update({ data: { venueId: activeId!, ...form } }),
    onSuccess: () => {
      toast.success("Venue settings saved");
      qc.invalidateQueries({ queryKey: ["managed-venue", activeId] });
      qc.invalidateQueries({ queryKey: ["my-managed-venues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <BusinessPageShell
      eyebrow="Venue Settings"
      title="Edit venue details"
      description="Everything that appears on your Confetti listing."
      actions={
        <div className="flex items-center gap-2">
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
          <Button onClick={() => save.mutate()} disabled={!activeId || save.isPending}>
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save changes
          </Button>
        </div>
      }
    >
      {isLoading || venueQuery.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !venues.length ? (
        <NoVenueClaim />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <SectionTitle>Identity</SectionTitle>
            <Field label="Venue name" value={form.name} onChange={set("name")} />
            <Field label="Category" value={form.category} onChange={set("category")} />
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field
              label="Neighborhood"
              value={form.neighborhood}
              onChange={set("neighborhood")}
            />
          </Card>

          <Card className="p-5">
            <SectionTitle>Vibe</SectionTitle>
            <Field
              label="Description"
              value={form.description}
              onChange={set("description")}
              textarea
            />
            <Field
              label="Price band"
              value={form.price_band}
              onChange={set("price_band")}
              placeholder="$, $$, $$$"
            />
          </Card>

          <Card className="p-5 md:col-span-2">
            <SectionTitle>Contact</SectionTitle>
            <Field
              label="Website"
              value={form.website}
              onChange={set("website")}
              placeholder="https://"
            />
            <Field
              label="Staff email (booking notifications)"
              value={form.staff_email}
              onChange={set("staff_email")}
              placeholder="bookings@yourvenue.com"
            />
          </Card>
        </div>
      )}
    </BusinessPageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 font-display text-lg font-bold">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-ink"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-ink"
        />
      )}
    </label>
  );
}
