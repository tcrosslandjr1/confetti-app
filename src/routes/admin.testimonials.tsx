import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTestimonialsPage,
});

type Testimonial = {
  id: string;
  name: string;
  username: string;
  body: string;
  image_url: string | null;
  country: string | null;
  position: number;
  active: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

type FormState = Omit<Testimonial, "id" | "created_at" | "updated_at">;

const EMPTY: FormState = {
  name: "",
  username: "",
  body: "",
  image_url: "",
  country: "",
  position: 0,
  active: true,
  rating: 5,
};

function AdminTestimonialsPage() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Testimonial[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditing(null);
    setForm(EMPTY);
  }

  function startEdit(row: Testimonial) {
    setEditing(row);
    setForm({
      name: row.name,
      username: row.username,
      body: row.body,
      image_url: row.image_url ?? "",
      country: row.country ?? "",
      position: row.position,
      active: row.active,
      rating: row.rating ?? null,
    });
  }

  async function save() {
    if (!form.name.trim() || !form.username.trim() || !form.body.trim()) {
      toast.error("Name, username, and body are required.");
      return;
    }
    if (form.body.length > 500) {
      toast.error("Body must be under 500 characters.");
      return;
    }
    if (form.rating !== null && (form.rating < 1 || form.rating > 5)) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      body: form.body.trim(),
      image_url: form.image_url?.trim() || null,
      country: form.country?.trim() || null,
      position: form.position,
      active: form.active,
      rating: form.rating,
    };
    const op = editing
      ? supabase.from("testimonials").update(payload).eq("id", editing.id)
      : supabase.from("testimonials").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Testimonial updated" : "Testimonial created");
    startNew();
    void load();
  }

  async function remove(row: Testimonial) {
    if (!confirm(`Delete testimonial from ${row.name}?`)) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    if (editing?.id === row.id) startNew();
    void load();
  }

  async function toggleActive(row: Testimonial) {
    const { error } = await supabase
      .from("testimonials")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    void load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Manage the customer quotes shown on the public /testimonials page. Lower position
            numbers appear first.
          </p>
        </div>
        <Button onClick={startNew} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> New testimonial
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            All testimonials
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Person</th>
                  <th className="px-3 py-2 text-left">Quote</th>
                  <th className="px-3 py-2 text-left">Rating</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-left">Pos</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No testimonials yet. Create one to get started.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold">
                            {r.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{r.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-md">
                      <div className="line-clamp-3 text-xs text-muted-foreground">{r.body}</div>
                    </td>
                    <td className="px-3 py-2">
                      {r.rating ? (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < (r.rating ?? 0) ? "fill-current" : "opacity-30"}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{r.country ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.position}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.active ? "Live" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(r)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(r)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">
            {editing ? "Edit testimonial" : "New testimonial"}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-name">Name</Label>
            <Input
              id="t-name"
              value={form.name}
              maxLength={100}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ava Green"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-username">Username / handle</Label>
            <Input
              id="t-username"
              value={form.username}
              maxLength={60}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="@ava"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-body">Body</Label>
            <Textarea
              id="t-body"
              value={form.body}
              maxLength={500}
              rows={4}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What they said about the product…"
            />
            <div className="text-right text-[10px] text-muted-foreground">
              {form.body.length}/500
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-image">Image URL</Label>
            <Input
              id="t-image"
              value={form.image_url ?? ""}
              maxLength={500}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…/avatar.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-country">Country</Label>
              <Input
                id="t-country"
                value={form.country ?? ""}
                maxLength={60}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="🇦🇺 Sydney"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-position">Position</Label>
              <Input
                id="t-position"
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="t-active" className="text-sm">
              Live
            </Label>
            <Switch
              id="t-active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={startNew}>
                Cancel
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
