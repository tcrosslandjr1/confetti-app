import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagedVenues,
  VenueSwitcher,
  NoVenueClaim,
} from "@/components/business/useManagedVenue";
import { getManagedVenue, updateVenueSettings } from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/settings")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessSettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Confetti for Business" },
      { name: "description", content: "Edit your venue details and preferences." },
    ],
  }),
});

function BusinessSettingsPage() {
  useAuth();
  const qc = useQueryClient();
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  const { data: venue, isLoading } = useQuery({
    queryKey: ["managed-venue-detail", activeId],
    queryFn: () => getManagedVenue(activeId!),
    enabled: !!activeId,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    neighborhood: "",
    website: "",
    price_band: "",
    category: "",
    staff_email: "",
  });

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name ?? "",
        description: venue.description ?? "",
        city: venue.city ?? "",
        neighborhood: venue.neighborhood ?? "",
        website: venue.website ?? "",
        price_band: venue.price_band ?? "",
        category: venue.category ?? "",
        staff_email: venue.staff_email ?? "",
      });
    }
  }, [venue]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateVenueSettings({
        venueId: activeId!,
        ...form,
      }),
    onSuccess: () => {
      toast.success("Settings saved!");
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
      qc.invalidateQueries({ queryKey: ["my-managed-venues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (venuesLoading) return <PageShell>Loading venues...</PageShell>;
  if (!venues.length)
    return (
      <PageShell>
        <NoVenueClaim />
      </PageShell>
    );

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading settings...</p>
      ) : (
        <Card className="mt-6 space-y-5 p-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-5 w-5 text-primary" /> Venue Details
          </div>

          <Field label="Venue Name *" value={form.name} onChange={(v) => update("name", v)} />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => update("description", v)}
            multiline
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={form.city} onChange={(v) => update("city", v)} />
            <Field
              label="Neighborhood"
              value={form.neighborhood}
              onChange={(v) => update("neighborhood", v)}
            />
          </div>
          <Field
            label="Website"
            value={form.website}
            onChange={(v) => update("website", v)}
            placeholder="https://..."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                <option value="nightclub">Nightclub</option>
                <option value="lounge">Lounge</option>
                <option value="bar">Bar</option>
                <option value="restaurant">Restaurant</option>
                <option value="rooftop">Rooftop</option>
                <option value="dayclub">Day Club</option>
                <option value="speakeasy">Speakeasy</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Price Band
              </label>
              <select
                value={form.price_band}
                onChange={(e) => update("price_band", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                <option value="$">$ — Budget</option>
                <option value="$$">$$ — Moderate</option>
                <option value="$$$">$$$ — Upscale</option>
                <option value="$$$$">$$$$ — Premium</option>
              </select>
            </div>
          </div>
          <Field
            label="Staff Email"
            value={form.staff_email}
            onChange={(v) => update("staff_email", v)}
            placeholder="bookings@yourvenue.com"
          />

          <div className="flex justify-end pt-2">
            <Button onClick={() => saveMut.mutate()} disabled={!form.name || saveMut.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMut.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
