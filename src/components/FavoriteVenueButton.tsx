import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  addFavorite,
  isFavorited,
  removeFavorite,
  type FavoritePayload,
} from "@/lib/venue-favorites";

export function FavoriteVenueButton({
  payload,
  className,
}: {
  payload: FavoritePayload;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setOn(false);
      return;
    }
    let cancelled = false;
    isFavorited(user.id, payload.venue_id)
      .then((v) => !cancelled && setOn(v))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, payload.venue_id]);

  async function toggle() {
    if (!user) {
      toast.info("Sign in to save favorites");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      if (on) {
        await removeFavorite(user.id, payload.venue_id);
        setOn(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(user.id, payload);
        setOn(true);
        toast.success("Saved to favorites");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't update favorites");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? "Remove from favorites" : "Save to favorites"}
      className={
        className ??
        `inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-2 text-xs font-bold shadow-brut transition-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 ${
          on ? "bg-coral text-white" : "bg-white text-ink"
        }`
      }
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Heart className={`h-3.5 w-3.5 ${on ? "fill-current" : ""}`} />
      )}
      {on ? "Saved" : "Save"}
    </button>
  );
}
