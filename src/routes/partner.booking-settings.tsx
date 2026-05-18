import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/partner/booking-settings")({
  component: BookingSettings,
});

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0 gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div>{children}</div>
    </Card>
  );
}

function BookingSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Booking settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Reservations, deposits, capacity.</p>
        </div>
        <Button>Save changes</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Reservations">
          <Row label="Accept reservations">
            <Switch defaultChecked />
          </Row>
          <Row label="Reservation mode" hint="How bookings flow through your system">
            <Select defaultValue="instant">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant confirm (Tier 3)</SelectItem>
                <SelectItem value="manual">Manual confirm (Tier 2)</SelectItem>
                <SelectItem value="external">External link only (Tier 1)</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Min party size">
            <Input type="number" defaultValue={1} className="w-24" />
          </Row>
          <Row label="Max party size">
            <Input type="number" defaultValue={12} className="w-24" />
          </Row>
          <Row label="Advance booking window">
            <Input defaultValue="30 days" className="w-32" />
          </Row>
          <Row label="Same-day cutoff">
            <Input defaultValue="2 hours" className="w-32" />
          </Row>
          <Row label="Time slot duration">
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Buffer between seatings">
            <Input defaultValue="10 min" className="w-32" />
          </Row>
          <Row label="Average table turn">
            <Input defaultValue="90 min" className="w-32" />
          </Row>
          <Row label="Special notes field" hint="Allow guests to add a note">
            <Switch defaultChecked />
          </Row>
        </Section>

        <Section title="Deposits">
          <Row label="Require deposit">
            <Switch defaultChecked />
          </Row>
          <Row label="Deposit type">
            <RadioGroup defaultValue="per" className="flex gap-3">
              <Label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="per" /> Per person
              </Label>
              <Label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="flat" /> Flat
              </Label>
            </RadioGroup>
          </Row>
          <Row label="Deposit amount">
            <Input defaultValue="$25" className="w-24" />
          </Row>
          <Row label="Applied to bill">
            <Switch defaultChecked />
          </Row>
          <Row label="Free cancellation window">
            <Input defaultValue="24 hours" className="w-32" />
          </Row>
          <Row label="Late cancel fee">
            <Input defaultValue="$25" className="w-24" />
          </Row>
          <Row label="No-show fee">
            <Input defaultValue="$50" className="w-24" />
          </Row>
        </Section>

        <Section title="Capacity">
          <Row label="Total seats">
            <Input type="number" defaultValue={120} className="w-24" />
          </Row>
          <Row label="Indoor">
            <Input type="number" defaultValue={60} className="w-24" />
          </Row>
          <Row label="Outdoor / patio">
            <Input type="number" defaultValue={40} className="w-24" />
          </Row>
          <Row label="Bar">
            <Input type="number" defaultValue={20} className="w-24" />
          </Row>
          <Row label="Private dining">
            <Input type="number" defaultValue={16} className="w-24" />
          </Row>
          <Row label="Auto-block when full">
            <Switch defaultChecked />
          </Row>
        </Section>

        <Section title="Table configurations">
          {[
            ["2-top", 12],
            ["4-top", 10],
            ["6-top", 4],
            ["8+", 2],
            ["Communal", 1],
          ].map(([label, n]) => (
            <Row key={label as string} label={label as string}>
              <Input type="number" defaultValue={n as number} className="w-24" />
            </Row>
          ))}
        </Section>
      </div>
    </div>
  );
}
