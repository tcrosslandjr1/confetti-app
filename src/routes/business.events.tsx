import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarPlus, Pencil, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/events")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Events Manager — Confetti for Business" }] }),
  component: BusinessEventsPage,
});

type Status = "upcoming" | "past" | "drafts";

const EVENTS: Array<{
  id: string;
  title: string;
  date: string;
  status: Status;
  flyer: string;
  published: boolean;
}> = [
  {
    id: "e1",
    title: "Afrobeats Friday",
    date: "Fri · 10:00 PM",
    status: "upcoming",
    flyer: "from-orange-300 to-pink-300",
    published: true,
  },
  {
    id: "e2",
    title: "Rooftop Sessions",
    date: "Sat · 9:00 PM",
    status: "upcoming",
    flyer: "from-primary/50 to-orange-200",
    published: true,
  },
  {
    id: "e3",
    title: "Sunday Brunch DJ",
    date: "Sun · 12:00 PM",
    status: "drafts",
    flyer: "from-amber-200 to-yellow-200",
    published: false,
  },
  {
    id: "e4",
    title: "New Year's Eve Gala",
    date: "Dec 31 · 10:00 PM",
    status: "past",
    flyer: "from-purple/50 to-pink-200",
    published: true,
  },
];

function BusinessEventsPage() {
  const [tab, setTab] = useState<Status>("upcoming");
  const filtered = EVENTS.filter((e) => e.status === tab);

  return (
    <BusinessPageShell
      eyebrow="Events Manager"
      title="Your events"
      description="Schedule, publish, and review your nightlife calendar."
      actions={
        <Button>
          <CalendarPlus className="mr-1.5 h-4 w-4" /> Add event
        </Button>
      }
    >
      <div className="mb-4 flex gap-2">
        {(["upcoming", "past", "drafts"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              tab === s ? "border-ink bg-ink text-cream" : "border-border bg-card hover:border-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <Card key={e.id} className="overflow-hidden transition hover:shadow-md">
            <div className={`h-32 bg-gradient-to-br ${e.flyer}`} />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-semibold">{e.title}</div>
                <Badge variant={e.published ? "default" : "secondary"} className="text-[10px]">
                  {e.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{e.date}</div>
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1">
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-16 text-sm text-muted-foreground">
            No {tab} events yet.
          </div>
        )}
      </div>
    </BusinessPageShell>
  );
}
