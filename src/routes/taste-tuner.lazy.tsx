import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Heart, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTasteProfile, type TasteProfile } from "@/lib/taste";
import { awardXP } from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";

export const Route = createLazyFileRoute("/taste-tuner")({
  component: TasteTuner,
});

type Card = {
    name: string;
    image: string;
    tags: string[];
};

const CARDS: Card[] = [
    {
        name: "Rooftop Sunset Dinner",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop",
        tags: ["Rooftop", "Fine Dining", "Sunset Views"],
    },
    {
        name: "Late-Night Speakeasy",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop",
        tags: ["Speakeasy", "Cocktails", "Hidden Gem"],
    },
    {
        name: "Sunday Farmers Market",
        image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop",
        tags: ["Outdoor", "Local", "Casual"],
    },
    {
        name: "Live Jazz Lounge",
        image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&auto=format&fit=crop",
        tags: ["Live Music", "Jazz", "Intimate"],
    },
    {
        name: "Beachside Brunch",
        image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&auto=format&fit=crop",
        tags: ["Brunch", "Beach", "Mimosas"],
    },
    {
        name: "Underground Dance Club",
        image: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800&auto=format&fit=crop",
        tags: ["Nightlife", "Dance", "High Energy"],
    },
    {
        name: "Ramen Crawl",
        image: "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&auto=format&fit=crop",
        tags: ["Foodie", "Asian", "Casual"],
    },
    {
        name: "Art Gallery Opening",
        image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&auto=format&fit=crop",
        tags: ["Culture", "Art", "Wine"],
    },
];

function TasteTuner() {
    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState<("like" | "pass")[]>([]);
    const [drag, setDrag] = useState({ x: 0, dragging: false });
    const startX = useRef(0);
    const swipe = (dir: "like" | "pass") => {
        setResults((r) => [...r, dir]);
        setIdx((i) => i + 1);
        setDrag({ x: 0, dragging: false });
    };
    const onPointerDown = (e: React.PointerEvent) => {
        startX.current = e.clientX;
        setDrag({ x: 0, dragging: true });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!drag.dragging)
            return;
        setDrag({ x: e.clientX - startX.current, dragging: true });
    };
    const onPointerUp = () => {
        if (Math.abs(drag.x) > 100)
            swipe(drag.x > 0 ? "like" : "pass");
        else
            setDrag({ x: 0, dragging: false });
    };
    const done = idx >= CARDS.length;
    const likes = results.filter((r) => r === "like").length;
    const passes = results.filter((r) => r === "pass").length;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!done || saved || saving) return;
        const persist = async () => {
            setSaving(true);
            try {
                const likedCards = CARDS.filter((_, i) => results[i] === "like");
                const allTags = likedCards.flatMap((c) => c.tags.map((t) => t.toLowerCase()));
                const uniqueTags = [...new Set(allTags)];

                // Derive energy level from liked cards
                const highEnergyTags = ["nightlife", "dance", "high energy"];
                const chillTags = ["casual", "intimate", "brunch", "outdoor"];
                const hasHigh = uniqueTags.some((t) => highEnergyTags.includes(t));
                const hasChill = uniqueTags.some((t) => chillTags.includes(t));
                const energy: TasteProfile["energy"] = hasHigh && !hasChill
                    ? "high_energy"
                    : hasChill && !hasHigh
                        ? "chill"
                        : "balanced";

                // Extract music taste
                const musicTags = ["jazz", "live music", "dance"];
                const music_taste = uniqueTags.filter((t) => musicTags.includes(t));

                // Food/drink loves
                const loveTags = ["fine dining", "cocktails", "brunch", "mimosas", "foodie", "asian", "ramen", "wine"];
                const loves = uniqueTags.filter((t) => loveTags.includes(t));

                const profile: TasteProfile = {
                    energy,
                    scene_keywords: uniqueTags,
                    music_taste: music_taste.length ? music_taste : undefined,
                    loves: loves.length ? loves : undefined,
                };

                await saveTasteProfile(profile);
                // Award XP for completing taste tuner
                const { data: u } = await supabase.auth.getUser();
                if (u.user) {
                  awardXP(u.user.id, "taste_tuner_complete");
                }
                setSaved(true);
            } catch (err) {
                console.error("Failed to save taste profile:", err);
                setSaved(true); // Still show completion so user isn't stuck
            } finally {
                setSaving(false);
            }
        };
        void persist();
    }, [done, saved, saving, results]);

    if (done) {
        return (<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-vibe text-primary-foreground">
          {saving ? <Loader2 className="h-12 w-12 animate-spin"/> : <Sparkles className="h-12 w-12"/>}
        </div>
        <h1 className="font-display text-3xl font-bold">
          {saving ? "Saving your vibe..." : "Taste profile updated!"}
        </h1>
        <p className="text-muted-foreground">
          {likes} liked · {passes} passed
        </p>
        <Link to="/quick-generate" className="w-full">
          <Button disabled={saving} className="h-14 w-full gap-2 rounded-2xl bg-gradient-vibe text-base font-bold shadow-pop">
            <Sparkles className="h-5 w-5"/> Generate a plan
          </Button>
        </Link>
      </div>);
    }
    const card = CARDS[idx];
    const next = CARDS[idx + 1];
    const rot = drag.x / 20;
    const likeOpacity = Math.max(0, Math.min(1, drag.x / 100));
    const passOpacity = Math.max(0, Math.min(1, -drag.x / 100));
    return (<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col p-4">
      <header className="mb-4 text-center">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Taste Tuner
        </p>
        <h1 className="font-display text-2xl font-bold">Swipe to teach us your vibe</h1>
      </header>

      <div className="relative mx-auto h-[440px] w-full max-w-sm flex-1">
        {next && (<div className="absolute inset-0 scale-95 rounded-3xl border border-border bg-card opacity-60 shadow-card"/>)}
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{
            transform: `translateX(${drag.x}px) rotate(${rot}deg)`,
            transition: drag.dragging ? "none" : "transform 0.3s",
        }} className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded-3xl border border-border bg-card shadow-pop active:cursor-grabbing">
          <img src={card.image} alt={card.name} className="h-2/3 w-full object-cover" draggable={false} loading="lazy" decoding="async"/>
          <div className="space-y-2 p-4">
            <h2 className="font-display text-xl font-bold">{card.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t) => (<span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                  {t}
                </span>))}
            </div>
          </div>
          <div style={{ opacity: likeOpacity }} className="absolute left-6 top-6 rotate-[-12deg] rounded-xl border-4 border-green-500 px-3 py-1 text-2xl font-black text-green-500">
            LIKE
          </div>
          <div style={{ opacity: passOpacity }} className="absolute right-6 top-6 rotate-[12deg] rounded-xl border-4 border-red-500 px-3 py-1 text-2xl font-black text-red-500">
            PASS
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-6">
        <button onClick={() => swipe("pass")} className="grid h-16 w-16 place-items-center rounded-full border-2 border-red-500 bg-background text-red-500 shadow-card hover:scale-105 transition-transform">
          <X className="h-7 w-7"/>
        </button>
        <button onClick={() => swipe("like")} className="grid h-16 w-16 place-items-center rounded-full border-2 border-green-500 bg-background text-green-500 shadow-card hover:scale-105 transition-transform">
          <Heart className="h-7 w-7"/>
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {CARDS.map((_, i) => {
            const r = results[i];
            const cls = r === "like"
                ? "bg-green-500"
                : r === "pass"
                    ? "bg-red-500"
                    : i === idx
                        ? "bg-foreground"
                        : "bg-muted";
            return <span key={i} className={`h-2 w-2 rounded-full ${cls}`}/>;
        })}
      </div>
    </div>);
}
