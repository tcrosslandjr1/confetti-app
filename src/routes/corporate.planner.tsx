import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CorporatePageHeader } from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/planner")({
  component: CorporatePlannerPage,
});

const PURPOSES = [
  { value: "team-outing", label: "Team bonding" },
  { value: "offsite", label: "Offsite / retreat" },
  { value: "client-dinner", label: "Client dinner" },
  { value: "conference", label: "Conference / summit" },
];

function CorporatePlannerPage() {
  const [step, setStep] = useState(1);
  const [team, setTeam] = useState("");
  const [when, setWhen] = useState("");
  const [size, setSize] = useState(8);
  const [purpose, setPurpose] = useState("team-outing");

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="AI planner"
        title="Outing Planner"
        description="Generate compliant, vibe-matched outing options for your team."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <Card className="p-6">
          <ol className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            {[1, 2, 3, 4, 5].map((n) => (
              <li
                key={n}
                className={`grid size-6 place-items-center rounded-full ${
                  n <= step ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {n}
              </li>
            ))}
          </ol>

          {step === 1 && (
            <div className="space-y-3">
              <Label>Select team</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Engineering"
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <Label>Group size</Label>
              <Input
                type="number"
                min={1}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Ready to generate three vetted options for your <strong>{purpose}</strong> with{" "}
                {size} people.
              </p>
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900">
                AI generation is in private beta — your account team will produce options for this
                brief and email them within one business day.
              </div>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 size-4" /> Generation coming soon
              </Button>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            <Button disabled={step === 5} onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Next
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {["A", "B", "C"].map((id) => (
            <Card key={id} className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Option {id}</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">Draft</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Venues, timing, and estimated cost will appear here after generation.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Preview
                </Button>
                <Button size="sm" disabled>
                  Request booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
