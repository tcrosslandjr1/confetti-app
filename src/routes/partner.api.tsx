import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Play, BookOpen } from "lucide-react";

export const Route = createFileRoute("/partner/api")({
  component: ApiPage,
});

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  desc: string;
  body?: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/public/partner/v1/reservations",
    desc: "Create reservation",
    body: JSON.stringify(
      {
        user_id: "usr_abc123",
        venue_id: "ven_xyz789",
        datetime: "2026-12-31T20:00:00-05:00",
        party_size: 4,
        source: "itinerary",
        deposit: { required: true, amount: 50, currency: "USD" },
      },
      null,
      2,
    ),
  },
  { method: "GET", path: "/api/public/partner/v1/reservations", desc: "List reservations" },
  { method: "GET", path: "/api/public/partner/v1/reservations/{id}", desc: "Get reservation" },
  {
    method: "PATCH",
    path: "/api/public/partner/v1/reservations/{id}",
    desc: "Modify reservation",
    body: JSON.stringify({ party_size: 6, notes: "Adding 2 more" }, null, 2),
  },
  {
    method: "DELETE",
    path: "/api/public/partner/v1/reservations/{id}",
    desc: "Cancel reservation",
    body: JSON.stringify({ reason: "user_cancelled", refund_deposit: true }, null, 2),
  },
  {
    method: "POST",
    path: "/api/public/partner/v1/orders",
    desc: "Create order",
    body: JSON.stringify(
      {
        user_id: "usr_abc123",
        venue_id: "ven_xyz789",
        type: "pickup",
        pickup_time: "2026-12-31T19:45:00-05:00",
        items: [{ menu_item_id: "mi_001", name: "Chicken & Waffles", quantity: 2, price: 18 }],
        subtotal: 36,
        tax: 3.06,
        tip: 5,
        total: 44.06,
      },
      null,
      2,
    ),
  },
  { method: "GET", path: "/api/public/partner/v1/orders/{id}", desc: "Get order" },
  { method: "PATCH", path: "/api/public/partner/v1/orders/{id}", desc: "Modify order before prep" },
  { method: "DELETE", path: "/api/public/partner/v1/orders/{id}", desc: "Cancel order" },
  { method: "GET", path: "/api/public/partner/v1/menu", desc: "Fetch venue menu" },
  { method: "PUT", path: "/api/public/partner/v1/menu", desc: "Push full menu update" },
  {
    method: "GET",
    path: "/api/public/partner/v1/availability?date=2026-12-31&party_size=4",
    desc: "Real-time slots (Tier 3)",
  },
  { method: "POST", path: "/api/public/webhooks/partner", desc: "Inbound webhook (HMAC-signed)" },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  POST: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  PATCH: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  PUT: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  DELETE: "bg-red-500/10 text-red-700 border-red-500/30",
};

function ApiPage() {
  const [selected, setSelected] = useState<Endpoint>(ENDPOINTS[0]);
  const [token, setToken] = useState("demo_token_sundae");
  const [body, setBody] = useState(selected.body ?? "");
  const [path, setPath] = useState(selected.path);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const pick = (e: Endpoint) => {
    setSelected(e);
    setPath(e.path);
    setBody(e.body ?? "");
    setResponse(null);
  };

  const send = async () => {
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: selected.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: ["GET", "DELETE"].includes(selected.method) && !body ? undefined : body || undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }
      setResponse({ status: res.status, body: pretty });
    } catch (err) {
      setResponse({ status: 0, body: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Partner API
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Base URL: <code className="text-xs">/api/public/partner/v1</code> · Bearer auth · 100
            req/min/venue
          </p>
        </div>
        <Badge variant="outline">Tier 2 / 3 only</Badge>
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Demo tokens
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <code className="px-2 py-1 rounded bg-card border">
            demo_token_sundae · Tier 3 · ven_xyz789
          </code>
          <code className="px-2 py-1 rounded bg-card border">
            demo_token_downtown · Tier 2 · ven_dwntn
          </code>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Endpoint list */}
        <Card className="p-2 h-fit lg:sticky lg:top-20">
          <div className="space-y-0.5">
            {ENDPOINTS.map((e) => (
              <button
                key={`${e.method}-${e.path}`}
                onClick={() => pick(e)}
                className={`w-full text-left px-2 py-2 rounded-md text-xs transition-colors ${
                  selected.path === e.path && selected.method === e.method
                    ? "bg-primary/10"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${METHOD_STYLE[e.method]}`}
                  >
                    {e.method}
                  </Badge>
                  <span className="font-mono truncate flex-1">
                    {e.path
                      .replace("/api/public/partner/v1", "")
                      .replace("/api/public/webhooks", "webhooks")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 ml-1">{e.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Playground */}
        <div className="space-y-4 min-w-0">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={METHOD_STYLE[selected.method]}>
                {selected.method}
              </Badge>
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="font-mono text-xs flex-1"
              />
              <Button onClick={send} disabled={loading}>
                <Play className="h-4 w-4 mr-1.5" />
                {loading ? "Sending…" : "Send"}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Bearer token
                </label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono text-xs mt-1"
                />
              </div>
              {!["GET"].includes(selected.method) && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Request body (JSON)
                  </label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="font-mono text-xs mt-1"
                    placeholder="{}"
                  />
                </div>
              )}
            </div>
          </Card>

          {response && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Response
                  </span>
                  <Badge
                    className={
                      response.status >= 200 && response.status < 300
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                        : "bg-red-500/10 text-red-700 border-red-500/30"
                    }
                    variant="outline"
                  >
                    {response.status || "ERR"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(response.body)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
              <pre className="text-xs bg-muted/40 p-3 rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                {response.body}
              </pre>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-2 text-sm">Error format</h3>
            <pre className="text-xs bg-muted/40 p-3 rounded-md overflow-x-auto">{`{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time slot is no longer available.",
    "details": { "next_available": "20:30" }
  }
}`}</pre>
            <div className="mt-4 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {[
                ["SLOT_UNAVAILABLE", "409"],
                ["VENUE_CLOSED", "409"],
                ["PARTY_TOO_LARGE", "422"],
                ["ITEM_UNAVAILABLE", "409"],
                ["ORDER_LOCKED", "409"],
                ["DEPOSIT_FAILED", "402"],
                ["INVALID_TOKEN", "401"],
                ["RATE_LIMITED", "429"],
              ].map(([code, status]) => (
                <div key={code} className="flex justify-between border-b border-border/40 py-1">
                  <code className="text-primary">{code}</code>
                  <span className="text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
