import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, MapPin, Trash2, Plus, Heart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GooglePhotos } from "@/components/GooglePhotos";
import { VenueVerificationBadge } from "@/components/VenueVerificationBadge";
import { toast } from "sonner";
import { useRefreshable } from "@/hooks/use-refresh-bus";

export const Route = createFileRoute("/portal/saved")({
  component: SavedPage,
});

type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  price_level: number;
  image_url: string | null;
  description: string | null;
};
type Saved = { id: string; venue_id: string; created_at: string; venues: Venue | null };

const MOCK_SAVED = [
  {
    id: "mock-1",
    name: "Oyster Oyster",
    neighborhood: "Shaw, DC",
    cuisine: "Vegetable-forward",
    rating: 4.8,
    description: "Innovative plant-based tasting menus",
    savedAgo: "Saved 3 days ago",
  },
  {
    id: "mock-2",
    name: "Tail Up Goat",
    neighborhood: "Adams Morgan, DC",
    cuisine: "Mediterranean",
    rating: 4.7,
    description: "Wood-fired dishes & natural wines",
    savedAgo: "Saved 1 week ago",
  },
  {
    id: "mock-3",
    name: "Cranes",
    neighborhood: "Penn Quarter, DC",
    cuisine: "Spanish-Japanese",
    rating: 4.6,
    description: "Omakase meets tapas",
    savedAgo: "Saved 2 weeks ago",
  },
  {
    id: "mock-4",
    name: "Bad Saint",
    neighborhood: "Columbia Heights, DC",
    cuisine: "Filipino",
    rating: 4.9,
    description: "No-reservations Filipino street food",
    savedAgo: "Saved 5 days ago",
  },
];

function SavedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  const load = () => {
    supabase
      .from("saved_venues")
      .select(
        "id,venue_id,created_at,venues(id,name,category,neighborhood,price_level,image_url,description)",
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Saved[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase
      .from("venues")
      .select("id,name,category,neighborhood,price_level,image_url,description")
      .order("name")
      .then(({ data }) => {
        setAllVenues((data as Venue[]) ?? []);
      });
  }, []);

  useRefreshable(load);

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_venues").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      load();
    }
  };

  const add = async (vid: string) => {
    if (!user) {
      toast.error("Sign in to save venues.");
      return;
    }
    const { error } = await supabase
      .from("saved_venues")
      .insert({ user_id: user.id, venue_id: vid });
    if (error) toast.error(error.message.includes("duplicate") ? "Already saved" : error.message);
    else {
      toast.success("Saved ✓");
      load();
    }
  };

  const savedIds = new Set(items.map((i) => i.venue_id));
  const available = allVenues.filter((v) => !savedIds.has(v.id));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            My Portal
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold">
            <Bookmark className="h-8 w-8" /> Saved spots
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your wishlist of places worth coming back to.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Save a venue</DialogTitle>
            </DialogHeader>
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You've saved everything we have. Nice.
                </p>
              ) : (
                available.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border-2 border-ink p-2"
                  >
                    <div>
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.category}
                        {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => add(v.id)}>
                      Save
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 &&
            MOCK_SAVED.map((m) => (
              <li
                key={m.id}
                className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
              >
                <GooglePhotos venue={m.name} neighborhood={m.neighborhood} variant="hero" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {m.cuisine}
                    </div>
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold">{m.name}</h3>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {m.rating.toFixed(1)}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                    {m.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {m.neighborhood}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {m.savedAgo}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          {items
            .filter((i) => i.venues)
            .map((i) => (
              <li
                key={i.id}
                className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
              >
                {i.venues!.image_url ? (
                  <img
                    src={i.venues!.image_url}
                    alt={i.venues!.name}
                    className="h-36 w-full object-cover"
                   loading="lazy" decoding="async"/>
                ) : (
                  <GooglePhotos
                    venue={i.venues!.name}
                    neighborhood={i.venues!.neighborhood}
                    category={i.venues!.category}
                    variant="hero"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {i.venues!.category}
                    </div>
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold">{i.venues!.name}</h3>
                  <div className="mt-1.5">
                    <VenueVerificationBadge venueName={i.venues!.name} size="xs" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {i.venues!.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    {i.venues!.neighborhood && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {i.venues!.neighborhood}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => remove(i.id)}
                    >
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
