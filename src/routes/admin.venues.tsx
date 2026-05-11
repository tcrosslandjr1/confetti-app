import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Edit3,
  Loader2,
  MailCheck,
  MapPin,
  Plus,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import { resolveVenueNotificationEmail } from "@/lib/booking-notifications.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/venues")({
  component: AdminVenuesPage,
});

type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  city: string | null;
  price_level: number;
  description: string | null;
  image_url: string | null;
  staff_email: string | null;
  advertiser_id: string | null;
  created_at: string;
};

type AdvertiserOption = {
  id: string;
  business_name: string;
  contact_email: string;
};

const EMPTY_DRAFT: Omit<Venue, "id" | "created_at"> = {
  name: "",
  category: "",
  neighborhood: "",
  city: "",
  price_level: 2,
  description: "",
  image_url: "",
  staff_email: "",
  advertiser_id: null,
};

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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Venue | null>(null);
  const [adding, setAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const resolveEmail = useServerFn(resolveVenueNotificationEmail);

  const onTestNotification = async (v: Venue) => {
    setTestingId(v.id);
    try {
      const result = await resolveEmail({ data: { venueId: v.id } });
      if (!result?.email) {
        toast.error("No recipient resolved", {
          description: "Set a staff email, link an advertiser, or configure the ops inbox.",
        });
        return;
      }
      const sourceLabel = {
        venue_staff_email: "venue staff email",
        linked_advertiser: "linked advertiser",
        ops_fallback: "ops inbox fallback",
      }[result.source];
      toast.success(`Test would deliver to ${result.email}`, {
        description: `Routed via ${sourceLabel}.`,
      });
      logAudit({
        admin: adminEmail,
        action: "edit",
        entity: "venue",
        targetId: v.id,
        summary: `Tested notification routing for "${v.name}" → ${result.email} (${result.source})`,
      });
    } catch (e) {
      toast.error("Test failed", { description: (e as Error).message });
    } finally {
      setTestingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load venues", { description: error.message });
    else setVenues((data as Venue[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return venues;
    const q = query.toLowerCase();
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.neighborhood ?? "").toLowerCase().includes(q) ||
        (v.category ?? "").toLowerCase().includes(q) ||
        (v.city ?? "").toLowerCase().includes(q),
    );
  }, [venues, query]);

  const onCreate = async (draft: typeof EMPTY_DRAFT) => {
    const { data, error } = await supabase.from("venues").insert(draft).select().single();
    if (error) {
      toast.error("Couldn't add venue", { description: error.message });
      return false;
    }
    setVenues((prev) => [data as Venue, ...prev]);
    toast.success(`Added ${draft.name}`);
    logAudit({ admin: adminEmail, action: "edit", entity: "venue", targetId: (data as Venue).id, summary: `Added venue "${draft.name}"` });
    return true;
  };

  const onSave = async (next: Venue) => {
    const { id, created_at: _c, ...patch } = next;
    void _c;
    const { error } = await supabase.from("venues").update(patch).eq("id", id);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return false;
    }
    setVenues((prev) => prev.map((v) => (v.id === id ? next : v)));
    toast.success(`Saved ${next.name}`);
    logAudit({ admin: adminEmail, action: "edit", entity: "venue", targetId: id, summary: `Edited venue "${next.name}"` });
    return true;
  };

  const onDelete = async (v: Venue) => {
    if (!confirm(`Delete "${v.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("venues").delete().eq("id", v.id);
    if (error) {
      toast.error("Couldn't delete", { description: error.message });
      return;
    }
    setVenues((prev) => prev.filter((x) => x.id !== v.id));
    toast.success(`Deleted ${v.name}`);
    logAudit({ admin: adminEmail, action: "remove", entity: "venue", targetId: v.id, summary: `Deleted venue "${v.name}"` });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Catalog</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Store className="h-7 w-7" /> Venues
          </h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, and delete venues that appear in the customer experience.
          </p>
        </div>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Add venue
            </Button>
          </DialogTrigger>
          <VenueDialog
            title="Add venue"
            description="Create a new venue. Customers will see it in search and the wizard."
            initial={EMPTY_DRAFT}
            submitLabel="Add venue"
            onSubmit={async (draft) => {
              const ok = await onCreate(draft);
              if (ok) setAdding(false);
            }}
          />
        </Dialog>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative ml-auto min-w-[260px] flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, neighborhood, city, category…"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-sm text-muted-foreground">
          <Loader2 className="mb-2 h-5 w-5 animate-spin" />
          Loading venues…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {venues.length === 0 ? "No venues yet — click Add venue to create the first one." : "No venues match your search."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <article key={v.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">{v.name}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{v.category || "—"}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {v.neighborhood || "—"}
                      {v.city ? ` · ${v.city}` : ""}
                    </span>
                    <PriceLevel level={v.price_level} />
                  </div>
                </div>
              </div>

              {v.description && (
                <p className="line-clamp-3 text-sm text-foreground/85">{v.description}</p>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(v)}>
                  <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => void onDelete(v)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <VenueDialog
            key={editing.id}
            title="Edit venue"
            description="Update venue details. Changes save instantly."
            initial={editing}
            submitLabel="Save changes"
            onSubmit={async (draft) => {
              const ok = await onSave({ ...editing, ...draft });
              if (ok) setEditing(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function VenueDialog({
  title,
  description,
  initial,
  submitLabel,
  onSubmit,
}: {
  title: string;
  description: string;
  initial: typeof EMPTY_DRAFT | Venue;
  submitLabel: string;
  onSubmit: (draft: typeof EMPTY_DRAFT) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<typeof EMPTY_DRAFT>({
    name: initial.name ?? "",
    category: initial.category ?? "",
    neighborhood: initial.neighborhood ?? "",
    city: initial.city ?? "",
    price_level: initial.price_level ?? 2,
    description: initial.description ?? "",
    image_url: initial.image_url ?? "",
    staff_email: initial.staff_email ?? "",
    advertiser_id: initial.advertiser_id ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [advertisers, setAdvertisers] = useState<AdvertiserOption[]>([]);
  const update = <K extends keyof typeof EMPTY_DRAFT>(key: K, value: (typeof EMPTY_DRAFT)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("advertisers")
        .select("id, business_name, contact_email")
        .eq("status", "approved")
        .order("business_name");
      setAdvertisers((data as AdvertiserOption[]) ?? []);
    })();
  }, []);

  const linkedAdvertiser = advertisers.find((a) => a.id === draft.advertiser_id) ?? null;
  const effectiveStaffEmail =
    (draft.staff_email && draft.staff_email.trim()) || linkedAdvertiser?.contact_email || "";

  return (
    <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-4 overflow-hidden p-0 sm:w-full">
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 overflow-y-auto px-6">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={draft.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="Restaurant, Bar…" value={draft.category} onChange={(e) => update("category", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price">Price level</Label>
            <select
              id="price"
              value={draft.price_level}
              onChange={(e) => update("price_level", Number(e.target.value))}
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
            <Input id="hood" value={draft.neighborhood ?? ""} onChange={(e) => update("neighborhood", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={draft.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="image">Image URL</Label>
          <Input id="image" placeholder="https://…" value={draft.image_url ?? ""} onChange={(e) => update("image_url", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={draft.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="advertiser">Linked advertiser</Label>
          <select
            id="advertiser"
            value={draft.advertiser_id ?? ""}
            onChange={(e) => update("advertiser_id", e.target.value || null)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">— None —</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.business_name} ({a.contact_email})
              </option>
            ))}
          </select>
          {linkedAdvertiser && !draft.staff_email?.trim() && (
            <p className="text-xs text-muted-foreground">
              Notifications will auto-route to <span className="font-mono">{linkedAdvertiser.contact_email}</span> from the linked advertiser.
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="staff_email">Staff notification email (override)</Label>
          <Input
            id="staff_email"
            type="email"
            placeholder={linkedAdvertiser?.contact_email || "ops@venue.com"}
            value={draft.staff_email ?? ""}
            onChange={(e) => update("staff_email", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {effectiveStaffEmail
              ? <>Booking notifications go to <span className="font-mono">{effectiveStaffEmail}</span>.</>
              : "Leave blank to fall back to the global ops inbox."}
          </p>
        </div>
      </div>
      <DialogFooter className="border-t border-border bg-background px-6 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <Button
          disabled={busy || !draft.name || !draft.category}
          onClick={async () => {
            setBusy(true);
            try {
              await onSubmit(draft);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
