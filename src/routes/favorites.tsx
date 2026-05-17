import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  listMyFavorites,
  removeFavorite,
  type VenueFavorite,
} from "@/lib/venue-favorites";

const SITE_ORIGIN = "https://confettiplan.lovable.app";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Your favorites — Confetti" },
      {
        name: "description",
        content: "All the venues you've saved on Confetti, in one place.",
      },
      { property: "og:title", content: "Your favorites — Confetti" },
      {
        property: "og:description",
        content: "All the venues you've saved on Confetti, in one place.",
      },
      { property: "og:url", content: `${SITE_ORIGIN}/favorites` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/favorites` }],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<VenueFavorite[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    let cancelled = false;
    listMyFavorites()
      .then((rows) => !cancelled && setItems(rows))
      .catch((e) => {
        if (cancelled) return;
        toast.error(e.message ?? "Couldn't load favorites");
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  async function handleRemove(fav: VenueFavorite) {
    if (!user) return;
    setRemoving(fav.id);
    try {
      await removeFavorite(user.id, fav.venue_id);
      setItems((prev) => (prev ?? []).filter((i) => i.id !== fav.id));
      toast.success("Removed");
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't remove");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">
              Saved
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Your <span className="text-coral">favorites</span>
            </h1>
            <p className="mt-2 text-sm text-ink/70">
              The places you've heart-tapped while exploring Confetti.
            </p>
          </div>
          <Link
            to="/discover"
            className="hidden shrink-0 rounded-full border-2 border-ink bg-white px-4 py-2 text-xs font-bold text-ink shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:inline-flex"
          >
            Discover more
          </Link>
        </header>

        <div className="mt-8">
          {items === null ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-coral" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((fav) => (
                <li
                  key={fav.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-brut"
                >
                  <Link
                    to="/venue/$id"
                    params={{ id: fav.venue_id }}
                    className="block"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-rose-300 via-fuchsia-400 to-indigo-500">
                      {fav.image_url && (
                        <img
                          src={fav.image_url}
                          alt={fav.venue_name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-90">
                          {fav.category && <span>{fav.category}</span>}
                          {fav.category && (fav.neighborhood || fav.city) && (
                            <span className="opacity-50">·</span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {fav.neighborhood || fav.city}
                          </span>
                        </div>
                        <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">
                          {fav.venue_name}
                        </h2>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(fav)}
                    disabled={removing === fav.id}
                    aria-label="Remove from favorites"
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                  >
                    {removing === fav.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/30 bg-white p-10 text-center shadow-brut">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-coral text-white shadow-brut">
        <Heart className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-extrabold">No favorites yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink/70">
        Tap the heart on any venue and we'll keep it here for next time.
      </p>
      <Link
        to="/discover"
        className="mt-5 inline-flex rounded-full border-2 border-ink bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        Discover venues
      </Link>
    </div>
  );
}
