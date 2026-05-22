import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/partner/order-settings")({
  component: OrderSettings,
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

function OrderSettings() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Order-ahead settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Pickup, pre-order, and menu sync.</p>
        </div>
        <Button onClick={() => navigate({ to: "/partner/order-settings" })}>Save changes</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-2">Order ahead</h2>
          <Row label="Accept order-ahead">
            <Switch defaultChecked />
          </Row>
          <Row label="Order mode">
            <Select defaultValue="inapp">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inapp">In-app (Tier 2/3)</SelectItem>
                <SelectItem value="external">External link only (Tier 1)</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Dine-in pre-order" hint="Linked to reservation">
            <Switch defaultChecked />
          </Row>
          <Row label="Pickup">
            <Switch defaultChecked />
          </Row>
          <Row label="Lead time">
            <Input defaultValue="20 min" className="w-32" />
          </Row>
          <Row label="Max order value">
            <Input defaultValue="$500" className="w-32" />
          </Row>
          <Row label="Kitchen cutoff">
            <Input defaultValue="30 min before close" className="w-48" />
          </Row>
          <Row label="Auto-confirm orders" hint="Tier 3 only">
            <Switch defaultChecked />
          </Row>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Menu sync</h2>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </Badge>
          </div>
          <Row label="Sync method">
            <Select defaultValue="toast">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual CSV / JSON</SelectItem>
                <SelectItem value="api">API push</SelectItem>
                <SelectItem value="toast">POS: Toast</SelectItem>
                <SelectItem value="square">POS: Square</SelectItem>
                <SelectItem value="clover">POS: Clover</SelectItem>
                <SelectItem value="photo">Photo menu (OCR)</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Last updated">
            <span className="text-sm text-muted-foreground">2h ago</span>
          </Row>
          <Row label="Per-item availability (86)" hint="Manage in Menu Editor">
            <Button asChild variant="outline" size="sm">
              <Link to="/partner/menu">Open</Link>
            </Button>
          </Row>
          <Row label="Confetti price override">
            <Switch />
          </Row>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              3 items have price mismatches between Toast and Confetti.{" "}
              <button className="underline" onClick={() => navigate({ to: "/partner/menu" })}>Review</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
