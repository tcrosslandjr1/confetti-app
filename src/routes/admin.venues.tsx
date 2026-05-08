import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  Edit3,
  MapPin,
  Search,
  Store,
  XCircle,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/venues")({
  component: AdminVenuesPage,
});

type Status = "pending" | "approved" | "rejected";
type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  city: string;
  priceLevel: 1 | 2 | 3 | 4;
  description: string;
  status: Status;
  submittedBy: string;
  submittedAt: string;
};

const SEED: Venue[] = [
  { id: "VN-301", name: "Lutèce", category: "Wine bar", neighborhood: "Georgetown", city: "Washington DC", priceLevel: 3, description: "Intimate Parisian-style wine bar with natural pours and a tight seasonal menu.", status: "pending", submittedBy: "Owner: M. Dupont", submittedAt: "2h ago" },
  { id: "VN-300", name: "Maydan", category: "Restaurant", neighborhood: "14th St", city: "Washington DC", priceLevel: 3, description: "Live-fire Middle Eastern cooking around an open hearth.", status: "approved", submittedBy: "Internal", submittedAt: "3d ago" },
  { id: "VN-299", name: "Service Bar", category: "Cocktail bar", neighborhood: "U Street", city: "Washington DC", priceLevel: 2, description: "Award-winning cocktails and the city's most loved fried chicken sandwich.", status: "approved", submittedBy: "Internal", submittedAt: "5d ago" },
  { id: "VN-298", name: "The Daily Grind", category: "Cafe", neighborhood: "Clarendon", city: "Arlington VA", priceLevel: 1, description: "Generic-looking coffee shop, low-quality submission with stock photos.", status: "rejected", submittedBy: "user_8821", submittedAt: "1w ago" },
  { id: "VN-297", name: "Albi", category: "Restaurant", neighborhood: "Navy Yard", city: "Washington DC", priceLevel: 4, description: "Michelin-starred Levantine tasting menu by Chef Michael Rafidi.", status: "approved", submittedBy: "Internal", submittedAt: "2w ago" },
  { id: "VN-296", name: "Sushi Nakazawa", category: "Restaurant", neighborhood: "Penn Quarter", city: "Washington DC", priceLevel: 4, description: "Edomae omakase counter with seasonal nigiri flown in from Toyosu.", status: "pending", submittedBy: "Owner: K. Nakazawa", submittedAt: "6h ago" },
];

const STATUS_TABS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "approved")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
  return <Badge className="bg-gold/20 text-foreground hover:bg-gold/30"><Eye className="mr-1 h-3 w-3" />Pending</Badge>;
}

function PriceLevel({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center text-xs font-mono">
      {Array.from({ length: 4 }).map((_, i) => (
        <DollarSign
          key={i}
          className={`h-3 w-3 ${i < level ? "text-foreground" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function AdminVenuesPage() {
  const { user } = useAuth();
  const adminEmail = user?.email ?? "admin";
  const [venues, setVenues] = useState<Venue[]>(SEED);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Venue | null>(null);

  const counts = useMemo(
    () => ({
      all: venues.length,
      pending: venues.filter((v) => v.status === "pending").length,
      approved: venues.filter((v) => v.status === "approved").length,
      rejected: venues.filter((v) => v.status === "rejected").length,
    }),
    [venues],
  );

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      if (tab !== "all" && v.status !== tab) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !v.name.toLowerCase().includes(q) &&
          !v.neighborhood.toLowerCase().includes(q) &&
          !v.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [venues, tab, query]);

  const setStatus = (id: string, status: Status) => {
    const v = venues.find((x) => x.id === id);
    setVenues((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(
      status === "approved" ? `Approved ${id}` : status === "rejected" ? `Rejected ${id}` : `Updated ${id}`,
    );
    logAudit({
      admin: adminEmail,
      action: status === "approved" ? "approve" : status === "rejected" ? "reject" : "status",
      entity: "venue",
      targetId: id,
      summary: `${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated"}${v ? ` venue "${v.name}"` : ""}`,
    });
  };

  const saveEdit = (next: Venue) => {
    setVenues((prev) => prev.map((v) => (v.id === next.id ? next : v)));
    setEditing(null);
    toast.success(`Saved changes to ${next.name}`);
    logAudit({
      admin: adminEmail,
      action: "edit",
      entity: "venue",
      targetId: next.id,
      summary: `Edited venue "${next.name}"`,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Catalog</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Store className="h-7 w-7" /> Venues
          </h1>
          <p className="text-sm text-muted-foreground">Review submissions, approve listings, and edit venue details.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}>
                {counts[t.key]}
              </span>
            </button>
          );
        })}
        <div className="relative ml-auto min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, neighborhood, category…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No venues match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <article key={v.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-muted-foreground">{v.id}</div>
                  <h3 className="truncate font-display text-lg font-bold">{v.name}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{v.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {v.neighborhood} · {v.city}
                    </span>
                    <PriceLevel level={v.priceLevel} />
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>

              <p className="line-clamp-3 text-sm text-foreground/85">{v.description}</p>

              <div className="text-xs text-muted-foreground">
                Submitted by <span className="font-semibold text-foreground">{v.submittedBy}</span> · {v.submittedAt}
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={v.status === "approved"}
                  onClick={() => setStatus(v.id, "approved")}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={v.status === "rejected"}
                  onClick={() => setStatus(v.id, "rejected")}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(v)}>
                  <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <EditDialog venue={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
    </div>
  );
}

function EditDialog({
  venue,
  onClose,
  onSave,
}: {
  venue: Venue | null;
  onClose: () => void;
  onSave: (v: Venue) => void;
}) {
  return (
    <Dialog open={!!venue} onOpenChange={(o) => !o && onClose()}>
      {venue && <EditDialogBody key={venue.id} venue={venue} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function EditDialogBody({
  venue,
  onClose,
  onSave,
}: {
  venue: Venue;
  onClose: () => void;
  onSave: (v: Venue) => void;
}) {
  const [draft, setDraft] = useState<Venue>(venue);
  const update = <K extends keyof Venue>(key: K, value: Venue[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit venue</DialogTitle>
        <DialogDescription>Update venue details. Changes save instantly.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={draft.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={draft.category} onChange={(e) => update("category", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price">Price level</Label>
            <select
              id="price"
              value={draft.priceLevel}
              onChange={(e) => update("priceLevel", Number(e.target.value) as Venue["priceLevel"])}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value={1}>$</option>
              <option value={2}>$$</option>
              <option value={3}>$$$</option>
              <option value={4}>$$$$</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="hood">Neighborhood</Label>
            <Input id="hood" value={draft.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={draft.city} onChange={(e) => update("city", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(draft)}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}
