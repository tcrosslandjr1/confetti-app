import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/partner/support")({
  component: SupportPage,
});

const CHECKLIST = [
  { label: "Complete venue profile", done: true },
  { label: "Upload photos & vibe video", done: true },
  { label: "Set booking preferences", done: true },
  { label: "Upload or sync menu", done: true },
  { label: "Connect bank account", done: true },
  { label: "Set deposit policy", done: false },
  { label: "Go live", done: false },
];

const REQUESTS = [
  { title: "Bulk-edit menu items", votes: 142 },
  { title: "Integrate with 7shifts staff scheduling", votes: 98 },
  { title: "Custom no-show fee per party size", votes: 67 },
  { title: "Apple Wallet pass for venue boarding", votes: 54 },
];

function SupportPage() {
  const done = CHECKLIST.filter((c) => c.done).length;
  const pct = Math.round((done / CHECKLIST.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Support & onboarding</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Get help, learn the platform, shape the roadmap.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Onboarding</h2>
            <Badge variant="outline">
              {done} of {CHECKLIST.length} complete
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-400"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2">
            {CHECKLIST.map((c) => (
              <li key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Checkbox checked={c.done} />
                <span
                  className={`text-sm flex-1 ${c.done ? "text-muted-foreground line-through" : "font-medium"}`}
                >
                  {c.label}
                </span>
                {c.done && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-orange-400 grid place-items-center text-primary-foreground font-semibold">
              JR
            </div>
            <div>
              <div className="font-semibold">Jamie Rivera</div>
              <div className="text-xs text-muted-foreground">Your Partner Success Manager</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Book a 15-min sync to review your week's analytics and unblock anything.
          </p>
          <Button className="w-full mt-3">Book a call</Button>
          <Button variant="outline" className="w-full mt-2">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Live chat
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Help center</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              "Getting started guide",
              "Reservation flow walkthrough",
              "Setting up POS sync",
              "Promotions playbook",
              "API reference",
            ].map((l) => (
              <li key={l}>
                <a className="text-primary hover:underline" href="#">
                  {l} →
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Feature requests</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Vote on what we should build next.</p>
          <div className="space-y-2">
            {REQUESTS.map((r) => (
              <div
                key={r.title}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-1.5 px-3 leading-tight"
                >
                  <span className="text-[10px] text-muted-foreground">▲</span>
                  <span className="font-semibold text-sm">{r.votes}</span>
                </Button>
                <div className="flex-1 text-sm font-medium">{r.title}</div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Submit a request
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
