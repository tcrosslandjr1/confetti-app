import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Share2, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { EventItem } from "@/lib/events";

type Saved = { save: boolean; rsvp: boolean };

export function EventSaveActions({ event }: { event: EventItem }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<Saved>({ save: false, rsvp: false });
  const [loading, setLoading] = useState<"save" | "rsvp" | null>(null);
  const isFree = event.price === 0;
  const ticketHref =
    event.ticketUrl ??
    `https://www.google.com/search?q=${encodeURIComponent(`${event.title} ${event.venue} tickets`)}`;

  useEffect(() => {
    if (!user) {
      setSaved({ save: false, rsvp: false });
      return;
    }
    let cancelled = false;
    supabase
      .from("saved_events")
      .select("kind")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSaved({
          save: data.some((r) => r.kind === "save"),
          rsvp: data.some((r) => r.kind === "rsvp"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user, event.id]);

  async function toggle(kind: "save" | "rsvp") {
    if (!user) {
      toast.info("Sign in to save events");
      navigate({ to: "/auth" });
      return;
    }
    setLoading(kind);
    const isOn = saved[kind];
    if (isOn) {
      const { error } = await supabase
        .from("saved_events")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .eq("kind", kind);
      if (error) toast.error(error.message);
      else {
        setSaved((s) => ({ ...s, [kind]: false }));
        toast.success(kind === "rsvp" ? "RSVP cancelled" : "Removed from saved");
      }
    } else {
      const { error } = await supabase
        .from("saved_events")
        .insert({ user_id: user.id, event_id: event.id, kind });
      if (error) toast.error(error.message);
      else {
        setSaved((s) => ({ ...s, [kind]: true }));
        toast.success(kind === "rsvp" ? "You're going! 🎉" : "Saved to your list");
      }
    }
    setLoading(null);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.blurb, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <>
      {isFree ? (
        <button
          onClick={() => toggle("rsvp")}
          disabled={loading === "rsvp"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-vibe px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] disabled:opacity-60"
        >
          {loading === "rsvp" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ticket className="h-4 w-4" />
          )}
          {saved.rsvp ? "Cancel RSVP" : "RSVP — Reserve a spot"}
        </button>
      ) : (
        <a
          href={ticketHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-vibe px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02]"
        >
          <Ticket className="h-4 w-4" />
          Get tickets
        </a>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => toggle("save")}
          disabled={loading === "save"}
          className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            saved.save
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          {loading === "save" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Heart className={`h-3.5 w-3.5 ${saved.save ? "fill-current" : ""}`} />
          )}
          {saved.save ? "Saved" : "Save"}
        </button>
        <button
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-muted"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>
    </>
  );
}
