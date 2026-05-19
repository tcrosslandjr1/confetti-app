import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createLazyFileRoute("/admin/marquee")({
  component: AdminMarqueePage,
});

type Sponsorship = {
    id: string;
    brand: string;
    occasion: string;
    cta_label: string;
    cta_url: string;
    surface: "top" | "bottom" | "both";
    position: number;
    active: boolean;
    runs_from: string | null;
    runs_until: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

type FormState = Omit<Sponsorship, "id" | "created_at" | "updated_at">;

const EMPTY: FormState = {
    brand: "",
    occasion: "",
    cta_label: "Book now",
    cta_url: "/wizard",
    surface: "both",
    position: 0,
    active: true,
    runs_from: null,
    runs_until: null,
    notes: null,
};

function toLocalInput(value: string | null) {
    if (!value)
        return "";
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
    return value ? new Date(value).toISOString() : null;
}

function AdminMarqueePage() {
    const [rows, setRows] = useState<Sponsorship[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Sponsorship | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [saving, setSaving] = useState(false);
    async function load() {
        setLoading(true);
        const { data, error } = await supabase
            .from("marquee_sponsorships")
            .select("*")
            .order("position", { ascending: true })
            .order("created_at", { ascending: false });
        if (error)
            toast.error(error.message);
        else
            setRows((data ?? []) as Sponsorship[]);
        setLoading(false);
    }
    useEffect(() => {
        void load();
    }, []);
    function startNew() {
        setEditing(null);
        setForm(EMPTY);
    }
    function startEdit(row: Sponsorship) {
        setEditing(row);
        setForm({
            brand: row.brand,
            occasion: row.occasion,
            cta_label: row.cta_label,
            cta_url: row.cta_url,
            surface: row.surface,
            position: row.position,
            active: row.active,
            runs_from: row.runs_from,
            runs_until: row.runs_until,
            notes: row.notes,
        });
    }
    async function save() {
        if (!form.brand.trim() || !form.occasion.trim() || !form.cta_url.trim()) {
            toast.error("Brand, occasion, and target URL are required.");
            return;
        }
        setSaving(true);
        const payload = { ...form };
        const op = editing
            ? supabase.from("marquee_sponsorships").update(payload).eq("id", editing.id)
            : supabase.from("marquee_sponsorships").insert(payload);
        const { error } = await op;
        setSaving(false);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success(editing ? "Sponsorship updated" : "Sponsorship created");
        startNew();
        void load();
    }
    async function remove(row: Sponsorship) {
        if (!confirm(`Delete ${row.brand} · ${row.occasion}?`))
            return;
        const { error } = await supabase.from("marquee_sponsorships").delete().eq("id", row.id);
        if (error)
            return toast.error(error.message);
        toast.success("Deleted");
        if (editing?.id === row.id)
            startNew();
        void load();
    }
    async function toggleActive(row: Sponsorship) {
        const { error } = await supabase
            .from("marquee_sponsorships")
            .update({ active: !row.active })
            .eq("id", row.id);
        if (error)
            return toast.error(error.message);
        void load();
    }
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Sponsored marquee</h1>
          <p className="text-sm text-muted-foreground">
            Manage which occasions appear as paid placements in the homepage marquee. Schedule
            windows, target URLs, and CTA copy per brand.
          </p>
        </div>
        <Button onClick={startNew} variant="outline">
          <Plus className="mr-2 h-4 w-4"/> New sponsorship
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            All placements
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Brand</th>
                  <th className="px-3 py-2 text-left">Occasion</th>
                  <th className="px-3 py-2 text-left">CTA</th>
                  <th className="px-3 py-2 text-left">Surface</th>
                  <th className="px-3 py-2 text-left">Window</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (<tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>)}
                {!loading && rows.length === 0 && (<tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No sponsorships yet. Create one to get started.
                    </td>
                  </tr>)}
                {rows.map((r) => (<tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">{r.brand}</td>
                    <td className="px-3 py-2">{r.occasion}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.cta_label}</div>
                      <div className="truncate text-xs text-muted-foreground" title={r.cta_url}>
                        {r.cta_url}
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{r.surface}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.runs_from ? new Date(r.runs_from).toLocaleDateString() : "—"} →{" "}
                      {r.runs_until ? new Date(r.runs_until).toLocaleDateString() : "open"}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => toggleActive(r)} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-muted text-muted-foreground"}`}>
                        {r.active ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(r)} aria-label="Edit">
                          <Pencil className="h-4 w-4"/>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form */}
        <aside className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">
            {editing ? "Edit sponsorship" : "New sponsorship"}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Aperol"/>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="occasion">Occasion text</Label>
            <Input id="occasion" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="rooftop o'clock → sunset + spritz"/>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="cta_label">CTA label</Label>
              <Input id="cta_label" value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <Input id="position" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })}/>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cta_url">Target URL</Label>
            <Input id="cta_url" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="/wizard?occasion=rooftop"/>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="surface">Surface</Label>
            <select id="surface" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value as FormState["surface"] })} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
              <option value="both">Both marquees</option>
              <option value="top">Top (hero) only</option>
              <option value="bottom">Bottom ticker only</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="runs_from">Runs from</Label>
              <Input id="runs_from" type="datetime-local" value={toLocalInput(form.runs_from)} onChange={(e) => setForm({ ...form, runs_from: fromLocalInput(e.target.value) })}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="runs_until">Runs until</Label>
              <Input id="runs_until" type="datetime-local" value={toLocalInput(form.runs_until)} onChange={(e) => setForm({ ...form, runs_until: fromLocalInput(e.target.value) })}/>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} rows={2}/>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="active" className="text-sm">
              Active
            </Label>
            <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })}/>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
            {editing && (<Button variant="outline" onClick={startNew}>
                Cancel
              </Button>)}
          </div>
        </aside>
      </div>
    </div>);
}
