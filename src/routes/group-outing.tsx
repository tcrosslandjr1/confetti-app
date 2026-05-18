import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, Copy, Sparkles, Users, Shield } from "lucide-react";

import {
  AUDIENCE_TYPES,
  AUDIENCE_LABELS,
  generateGroupOutingPlan,
  type GroupOutingPlan,
  type AudienceType,
} from "@/lib/group-outing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/group-outing")({
  component: GroupOutingPage,
  head: () => ({
    meta: [
      { title: "Group & Organization Outings | Confetti" },
      {
        name: "description",
        content:
          "Generate ready-to-run group outing plans for fraternities, sororities, AKA, line sisters, church friends, corporate teams, and more.",
      },
    ],
  }),
});

function fmtMoney(n: number) {
  return `$${Math.round(n)}`;
}

function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error("Copy failed"),
  );
}

function downloadPlan(plan: GroupOutingPlan) {
  const lines: string[] = [];
  lines.push(`# ${plan.event_name}`);
  lines.push(`_${plan.one_line_summary}_`);
  lines.push("");
  lines.push(
    `Audience: ${AUDIENCE_LABELS[plan.audience_type]}  •  Group: ${plan.ideal_group_size_min}–${plan.ideal_group_size_max}  •  Budget: ${fmtMoney(plan.estimated_cost_min)}–${fmtMoney(plan.estimated_cost_max)}/person`,
  );
  lines.push(`RSVP by: ${plan.rsvp_deadline}`);
  lines.push("");
  lines.push("## Itinerary");
  for (const s of plan.itinerary_steps) {
    lines.push(`- **${s.time} — ${s.title}** (${s.location_type})`);
    lines.push(`  ${s.description}`);
    if (s.required_supplies.length) lines.push(`  Supplies: ${s.required_supplies.join(", ")}`);
    if (s.safety_notes) lines.push(`  Safety: ${s.safety_notes}`);
  }
  lines.push("");
  lines.push("## Budget");
  for (const b of plan.budget_breakdown)
    lines.push(`- ${b.label}: ${fmtMoney(b.amount_min)}–${fmtMoney(b.amount_max)}`);
  lines.push("");
  lines.push("## Checklist");
  plan.checklist.forEach((c) => lines.push(`- [ ] ${c}`));
  lines.push("");
  lines.push("## Safety");
  plan.safety_notes.forEach((c) => lines.push(`- ${c}`));
  lines.push("");
  lines.push("## Roles");
  plan.role_assignments.forEach((r) => lines.push(`- **${r.role_name}**: ${r.responsibilities}`));
  lines.push("");
  lines.push("## Signup Fields");
  plan.signup_fields.forEach((f) =>
    lines.push(`- ${f.field_name} (${f.field_type}${f.required ? ", required" : ""})`),
  );
  lines.push("");
  lines.push("## Promo");
  lines.push(plan.promo_blurb);
  lines.push("");
  lines.push("## Flyer");
  lines.push(plan.flyer_copy);
  lines.push("");
  lines.push("## Chat Announcement");
  lines.push(plan.chat_announcement);
  lines.push("");
  lines.push(`Cancellation: ${plan.cancellation_policy}`);
  lines.push(`Accessibility: ${plan.accessibility_notes}`);

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.event_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-plan.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function GroupOutingPage() {
  const generate = useServerFn(generateGroupOutingPlan);
  const [audience, setAudience] = useState<AudienceType>("fraternity");
  const [city, setCity] = useState("");
  const [groupSize, setGroupSize] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GroupOutingPlan | null>(null);

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await generate({
        data: {
          audience,
          city: city.trim() || undefined,
          groupSize: groupSize ? Number(groupSize) : undefined,
          budgetPerPerson: budget ? Number(budget) : undefined,
          occasion: occasion.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      setPlan(res as GroupOutingPlan);
      toast.success("Plan ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Group & Organization Outings
            </h1>
            <p className="text-muted-foreground">
              Ready-to-run plans for Greek orgs, churches, corporate teams, alumni, and more.
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Build your outing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as AudienceType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AUDIENCE_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City (optional)</Label>
              <Input
                className="mt-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Atlanta"
              />
            </div>
            <div>
              <Label>Group size</Label>
              <Input
                className="mt-1"
                type="number"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
            <div>
              <Label>Target budget / person</Label>
              <Input
                className="mt-1"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div>
              <Label>Occasion (optional)</Label>
              <Input
                className="mt-1"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Founders Day, retreat, kickoff"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes (optional)</Label>
              <Textarea
                className="mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything specific — accessibility needs, theme, must-haves…"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={onGenerate} disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {plan && <PlanView plan={plan} />}
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: GroupOutingPlan }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{plan.event_name}</CardTitle>
            <p className="mt-1 text-muted-foreground">{plan.one_line_summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{AUDIENCE_LABELS[plan.audience_type]}</Badge>
              <Badge variant="outline">
                {plan.ideal_group_size_min}–{plan.ideal_group_size_max} people
              </Badge>
              <Badge variant="outline">
                {fmtMoney(plan.estimated_cost_min)}–{fmtMoney(plan.estimated_cost_max)}/person
              </Badge>
              <Badge variant="outline">RSVP by {plan.rsvp_deadline}</Badge>
              {plan.payment_required && <Badge>Payment required</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadPlan(plan)}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="signup">Signup</TabsTrigger>
            <TabsTrigger value="promo">Promo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <section>
              <h3 className="mb-2 font-semibold">Checklist</h3>
              <ul className="grid gap-1 md:grid-cols-2">
                {plan.checklist.map((c, i) => (
                  <li key={i} className="text-sm">☐ {c}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="mb-1 font-semibold">Accessibility</h3>
              <p className="text-sm text-muted-foreground">{plan.accessibility_notes}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold">Cancellation policy</h3>
              <p className="text-sm text-muted-foreground">{plan.cancellation_policy}</p>
            </section>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-3 pt-4">
            {plan.itinerary_steps.map((s, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {s.time} — {s.title}
                  </div>
                  <Badge variant="outline">{s.location_type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Cost: {fmtMoney(s.estimated_cost_min)}–{fmtMoney(s.estimated_cost_max)}
                </div>
                {s.required_supplies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.required_supplies.map((sp) => (
                      <Badge key={sp} variant="secondary" className="text-xs">
                        {sp}
                      </Badge>
                    ))}
                  </div>
                )}
                {s.safety_notes && (
                  <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
                    <Shield className="mt-0.5 h-3 w-3" /> {s.safety_notes}
                  </p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="budget" className="pt-4">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Line item</th>
                  <th className="py-2 text-right">Min</th>
                  <th className="py-2 text-right">Max</th>
                </tr>
              </thead>
              <tbody>
                {plan.budget_breakdown.map((b, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{b.label}</td>
                    <td className="py-2 text-right">{fmtMoney(b.amount_min)}</td>
                    <td className="py-2 text-right">{fmtMoney(b.amount_max)}</td>
                  </tr>
                ))}
                <tr className="border-t font-semibold">
                  <td className="py-2">Per person total</td>
                  <td className="py-2 text-right">{fmtMoney(plan.estimated_cost_min)}</td>
                  <td className="py-2 text-right">{fmtMoney(plan.estimated_cost_max)}</td>
                </tr>
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="safety" className="pt-4">
            <ul className="space-y-2">
              {plan.safety_notes.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Shield className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="roles" className="space-y-2 pt-4">
            {plan.role_assignments.map((r, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="font-semibold">{r.role_name}</div>
                <p className="text-sm text-muted-foreground">{r.responsibilities}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="signup" className="pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Reusable signup fields for your RSVP form:
            </p>
            <ul className="space-y-1">
              {plan.signup_fields.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{f.field_name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{f.field_type}</Badge>
                    {f.required && <Badge>required</Badge>}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() =>
                copy(
                  plan.signup_fields
                    .map((f) => `${f.field_name}${f.required ? " *" : ""} (${f.field_type})`)
                    .join("\n"),
                  "Signup sheet copied",
                )
              }
            >
              <Copy className="mr-2 h-4 w-4" /> Copy signup sheet
            </Button>
          </TabsContent>

          <TabsContent value="promo" className="space-y-4 pt-4">
            <PromoBlock title="Promo blurb" text={plan.promo_blurb} />
            <PromoBlock title="Chat announcement" text={plan.chat_announcement} />
            <PromoBlock title="Flyer copy" text={plan.flyer_copy} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PromoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <Button variant="ghost" size="sm" onClick={() => copy(text, `${title} copied`)}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
