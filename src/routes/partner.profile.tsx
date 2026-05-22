import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon, Video, X } from "lucide-react";

export const Route = createFileRoute("/partner/profile")({
  component: ProfilePage,
});

const VIBES = [
  "Lit & Loud",
  "Chill & Classy",
  "Date Night",
  "Group Friendly",
  "Hidden Gem",
  "Rooftop Vibes",
  "Late Night",
];
const SELECTED = ["Rooftop Vibes", "Date Night", "Chill & Classy"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Venue profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            How your venue appears across Confetti.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/partner" })}>Cancel</Button>
          <Button onClick={() => navigate({ to: "/partner/profile" })}>Save changes</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Basics">
          <Field label="Venue name">
            <Input defaultValue="Sundae Rooftop" />
          </Field>
          <Field label="Address">
            <Input defaultValue="245 Bleecker St, New York, NY 10014" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input defaultValue="(212) 555-0149" />
            </Field>
            <Field label="Website">
              <Input defaultValue="sundaerooftop.com" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Venue type">
              <Select defaultValue="rooftop">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["restaurant", "bar", "lounge", "club", "cafe", "rooftop"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price range">
              <Select defaultValue="$$$">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["$", "$$", "$$$", "$$$$"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Cuisine types">
            <Input defaultValue="American, Mediterranean, Cocktails" />
          </Field>
          <Field label="Vibe tags">
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const on = SELECTED.includes(v);
                return (
                  <Badge
                    key={v}
                    variant={on ? "default" : "outline"}
                    className={`cursor-pointer ${on ? "" : "hover:bg-accent"}`}
                  >
                    {v}
                    {on && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          </Field>
          <Field label="Short description (280 char)">
            <Textarea
              maxLength={280}
              defaultValue="Sunset cocktails, golden hour skyline, and seasonal small plates on Manhattan's most-photographed rooftop."
            />
          </Field>
          <Field label="Long description">
            <Textarea
              rows={4}
              defaultValue="Sundae Rooftop is a 5-story open-air lounge in the West Village..."
            />
          </Field>
        </Section>

        <Section title="Hours of operation">
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium">{d}</div>
                <Input className="flex-1" defaultValue="5:00 PM – 1:00 AM" />
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/partner/profile" })}>
                  + Split
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Media">
          <Field label="Cover photo (1200×600 min)">
            <div className="aspect-[2/1] rounded-lg border-2 border-dashed border-border/60 grid place-items-center bg-muted/30">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">Drop image or click to upload</div>
              </div>
            </div>
          </Field>
          <Field label="Gallery (up to 10)">
            <div className="grid grid-cols-4 gap-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-gradient-to-br from-orange-200 to-pink-200"
                />
              ))}
              <button className="aspect-square rounded-md border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:bg-accent/30" onClick={() => navigate({ to: "/partner/profile" })}>
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </Field>
          <Field label="Vibe video (15–30s loop)">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate({ to: "/partner/profile" })}>
              <Video className="h-4 w-4 mr-2" />
              Upload vibe video
            </Button>
          </Field>
        </Section>

        <Section title="Location & access">
          <Field label="Neighborhood">
            <Input defaultValue="West Village" />
          </Field>
          <Field label="Cross streets">
            <Input defaultValue="Bleecker & Cornelia" />
          </Field>
          <Field label="Parking notes">
            <Textarea rows={2} defaultValue="Street parking; nearest garage on 6th Ave." />
          </Field>
          <Field label="Transit notes">
            <Textarea rows={2} defaultValue="2 min walk from West 4th St (A/C/E/B/D/F/M)." />
          </Field>
          <Field label="Accessibility">
            <Textarea rows={2} defaultValue="Elevator to rooftop; ADA-compliant restrooms." />
          </Field>
        </Section>
      </div>
    </div>
  );
}
