import { createFileRoute, redirect } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
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

function BusinessSettingsPage() {
  const [saving, setSaving] = useState(false);

  return (
    <BusinessPageShell
      eyebrow="Venue Settings"
      title="Edit venue details"
      description="Everything that appears on your Confetti listing."
      actions={
        <Button
          onClick={() => {
            setSaving(true);
            setTimeout(() => {
              setSaving(false);
              toast.success("Venue settings saved");
            }, 600);
          }}
          disabled={saving}
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>Identity</SectionTitle>
          <Field label="Venue name" defaultValue="Rooftop DC" />
          <Field label="Address" defaultValue="1234 14th St NW, Washington, DC 20005" />
          <Field label="Hours" defaultValue="Wed–Sun · 6 PM – 2 AM" />
        </Card>

        <Card className="p-5">
          <SectionTitle>Vibe</SectionTitle>
          <Field
            label="Description"
            textarea
            defaultValue="Open-air rooftop with cocktails, small plates, and weekly Afrobeats nights."
          />
          <Field label="Music types" defaultValue="Afrobeats, Amapiano, House" />
          <Field label="Dress code" defaultValue="Stylish casual" />
        </Card>

        <Card className="p-5">
          <SectionTitle>Pricing & amenities</SectionTitle>
          <Field label="Price band" defaultValue="$$$" />
          <Field
            label="Amenities"
            textarea
            defaultValue="Rooftop · Reservations · Full bar · Outdoor heaters · Bottle service"
          />
        </Card>

        <Card className="p-5">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Public phone" defaultValue="(202) 555-0144" />
          <Field label="Reservations email" defaultValue="hello@rooftopdc.com" />
          <Field label="Booking link" defaultValue="https://resy.com/rooftopdc" />
        </Card>
      </div>
    </BusinessPageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 font-display text-lg font-bold">{children}</div>;
}

function Field({
  label,
  defaultValue,
  textarea,
}: {
  label: string;
  defaultValue?: string;
  textarea?: boolean;
}) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {textarea ? (
        <textarea
          defaultValue={defaultValue}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-ink"
        />
      ) : (
        <input
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-ink"
        />
      )}
    </label>
  );
}
