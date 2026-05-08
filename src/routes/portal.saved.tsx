import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, MapPin, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/saved")({
  component: SavedPage,
});

type Venue = { id: string; name: string; category: string; neighborhood: string | null; price_level: number; image_url: string | null; description: string | null };
type Saved = { id: string; venue_id: string; created_at: string; venues: Venue | null };

function SavedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  const load = () => {
    supabase
      .from("saved_venues")
      .select("id,venue_id,created_at,venues(id,name,category,neighborhood,price_level,image_url,description)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Saved[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase.from("venues").select("id,name,category,neighborhood,price_level,image_url,description").order("name").then(({ data }) => {
      setAllVenues((data as Venue[]) ?? []);
    });
  }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_venues").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  const add = async (vid: string) => {
    if (!user) return;
    const { error } = await supabase.from("saved_venues").insert({ user_id: user.id, venue_id: vid });
    if (error) toast.error(error.message.includes("duplicate") ? "Already saved" : error.message);
    else { toast.success("Saved ✓"); load(); }
  };

  const savedIds = new Set(items.map((i) => i.venue_id));
  const available = allVenues.filter((v) => !savedIds.has(v.id));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold"><Bookmark className="h-8 w-8" /> Saved spots</h1>
          <p className="mt-2 text-muted-foreground">Your wishlist of places worth coming back to.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add venue</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Save a venue</DialogTitle></DialogHeader>
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">You've saved everything we have. Nice.</p>
              ) : available.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <div>
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.category}{v.neighborhood ? ` · ${v.neighborhood}` : ""}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => add(v.id)}>Save</Button>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl font-bold">Nothing saved yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tap "Add venue" to start building your wishlist.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.filter((i) => i.venues).map((i) => (
            <li key={i.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {i.venues!.image_url ? <img src={i.venues!.image_url} alt={i.venues!.name} className="h-36 w-full object-cover" /> : <div className="h-36 bg-muted" />}
              <div className="p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{i.venues!.category}</div>
                <h3 className="mt-1 font-display text-lg font-bold">{i.venues!.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.venues!.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  {i.venues!.neighborhood && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{i.venues!.neighborhood}</span>}
                  <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => remove(i.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
