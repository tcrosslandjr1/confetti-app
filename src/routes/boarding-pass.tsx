import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowLeft, Share2, Check, Play, Mail, ImageDown, Loader2, Sparkles } from "lucide-react";
import { trackShareEvent } from "@/lib/share-analytics";
import { toast } from "sonner";
import { BoardingPassV3 } from "@/components/BoardingPassV3";
import {
  getActiveLoop,
  subscribeActiveLoop,
  type ActiveLoop,
} from "@/lib/loop-store";
import {
  getItinerary,
  listItineraries,
  ITINERARY_CHANGED_EVENT,
} from "@/lib/itineraries";
import { itineraryToActiveLoop } from "@/lib/itinerary-to-loop";
import { useAuth } from "@/lib/auth-context";

const searchSchema = z.object({
  trip: z.string().uuid().optional(),
});

export const Route = createFileRoute("/boarding-pass")({
  head: () => ({ meta: [{ title: "Boarding Pass — Confetti" }] }),
  validateSearch: zodValidator(searchSchema),
  component: BoardingPassPage,
});

function BoardingPassPage() {
  const { trip } = Route.useSearch();
  const { user } = useAuth();
  const passengerName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  const [localLoop, setLocalLoop] = useState<ActiveLoop | null>(null);
  const [shared, setShared] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setLocalLoop(getActiveLoop());
    sync();
    return subscribeActiveLoop(sync);
  }, []);

  // Invalidate Supabase-sourced loops when any itinerary stop changes
  const queryClient = useQueryClient();
  useEffect(() => {
    const onChange = () => {
      queryClient.invalidateQueries({ queryKey: ["boarding-pass", "trip"] });
      queryClient.invalidateQueries({ queryKey: ["boarding-pass", "recent"] });
    };
    if (typeof window === "undefined") return;
    window.addEventListener(ITINERARY_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ITINERARY_CHANGED_EVENT, onChange);
  }, [queryClient]);

  // 1. Explicit ?trip=<uuid>
  const tripQuery = useQuery({
    queryKey: ["boarding-pass", "trip", trip],
    queryFn: () => getItinerary(trip as string),
    enabled: !!trip,
    staleTime: 60_000,
  });

  // 3. Fallback — most recent itinerary for signed-in user
  const fallbackEnabled = !trip && !localLoop && !!user;
  const recentQuery = useQuery({
    queryKey: ["boarding-pass", "recent", user?.id],
    queryFn: async () => {
      const list = await listItineraries();
      const latest = list[0];
      if (!latest) return null;
      return getItinerary(latest.id);
    },
    enabled: fallbackEnabled,
    staleTime: 60_000,
  });

  const loop: ActiveLoop | null = useMemo(() => {
    if (tripQuery.data) {
      return itineraryToActiveLoop(
        tripQuery.data.itinerary,
        tripQuery.data.stops,
        passengerName,
      );
    }
    if (localLoop) return localLoop;
    if (recentQuery.data) {
      return itineraryToActiveLoop(
        recentQuery.data.itinerary,
        recentQuery.data.stops,
        passengerName,
      );
    }
    return null;
  }, [tripQuery.data, recentQuery.data, localLoop, passengerName]);

  const loading =
    (trip && tripQuery.isLoading) || (fallbackEnabled && recentQuery.isLoading);

  // Resolve the canonical itinerary id for a shareable deep link
  const shareTripId: string | null = useMemo(() => {
    if (trip) return trip;
    if (tripQuery.data?.itinerary?.id) return tripQuery.data.itinerary.id;
    if (recentQuery.data?.itinerary?.id) return recentQuery.data.itinerary.id;
    return null;
  }, [trip, tripQuery.data, recentQuery.data]);

  const buildShareContent = (lp: ActiveLoop) => {
    let url = "";
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      url = shareTripId
        ? `${origin}/boarding-pass?trip=${shareTripId}`
        : window.location.href;
    }
    const occasion = lp.occasion ?? "Confetti night";
    const subject = `${lp.occasionEmoji ?? "✨"} ${occasion} — Confetti itinerary`;
    const stopsText = lp.stops
      .map((s, i) => `${i + 1}. ${s.time ? s.time + " — " : ""}${s.name}${s.area ? ` · ${s.area}` : ""}`)
      .join("\n");
    const body =
      `${subject}\n${lp.date ?? ""}\n\nItinerary:\n${stopsText}\n\n` +
      (url ? `View the full boarding pass:\n${url}\n\n` : "") +
      `Built with Confetti — confettiplan.lovable.app`;
    return { subject, body, url };
  };

  const handleShare = async () => {
    if (!loop) return;
    const { subject, body, url } = buildShareContent(loop);
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title: subject, text: body, url });
        setShared(true);
        toast.success("Shared!", { position: "bottom-center", duration: 3000 });
        setTimeout(() => setShared(false), 2200);
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(body);
        setShared(true);
        toast.success("Copied to clipboard", { position: "bottom-center", duration: 3000 });
        setTimeout(() => setShared(false), 2200);
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error("Couldn't share — try again", { position: "bottom-center" });
    }
  };

  const handleEmailShare = () => {
    if (!loop) return;
    const { subject, body } = buildShareContent(loop);
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleShareImage = async () => {
    if (!passRef.current || !loop) return;
    setImageBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(passRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#FBF5E5",
      });
      const fileName = `confetti-${loop.id.toLowerCase()}.png`;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      trackShareEvent("share_save_image", { loopId: loop.id });
      toast.success("Image saved", { position: "bottom-center", duration: 3000 });
    } catch {
      toast.error("Couldn't generate image — try again", { position: "bottom-center" });
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "#FBF5E5" }}>
      <div className="mx-auto flex max-w-[400px] items-center justify-between gap-3 px-4 pt-4">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        {loop && (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink"
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {shared ? "Copied" : "Share"}
          </button>
        )}
      </div>

      {loading && (
        <div className="mx-auto flex max-w-[400px] flex-col items-center gap-3 px-4 pt-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
            Loading your boarding pass…
          </p>
        </div>
      )}

      {!loading && !loop && (
        <div className="mx-auto mt-16 max-w-[400px] px-4 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-white">
            <Sparkles className="h-6 w-6 text-coral" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">No plan yet</h1>
          <p className="mt-2 text-sm text-ink/70">
            Build a night with Confetti and your boarding pass will appear here.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-coral px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-white"
          >
            Plan a night
          </Link>
          {user && (
            <Link
              to="/trips"
              className="mt-3 block font-mono text-[10px] uppercase tracking-widest text-ink/60 hover:text-ink"
            >
              View all trips →
            </Link>
          )}
        </div>
      )}

      {!loading && loop && (
        <>
          <div className="mt-2">
            <BoardingPassV3 loop={loop} containerRef={passRef} />
          </div>

          {/* Sticky wallet footer */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 backdrop-blur"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-auto flex max-w-[400px] items-stretch gap-2 px-4 py-3">
              <Link
                to="/active-loop"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-gradient-to-br from-coral to-pink-500 px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white"
              >
                <Play className="h-3.5 w-3.5" /> Start
              </Link>
              <button
                type="button"
                onClick={handleEmailShare}
                aria-label="Email"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-white"
              >
                <Mail className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleShareImage}
                disabled={imageBusy}
                aria-label="Save image"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-white disabled:opacity-50"
              >
                {imageBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-ink bg-white px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink"
              >
                {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {shared ? "Copied" : "Share"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
