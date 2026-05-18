import { createFileRoute, redirect } from "@tanstack/react-router";
import { Image as ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/media")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Media Manager — Confetti for Business" }] }),
  component: BusinessMediaPage,
});

const MEDIA = [
  { src: "from-primary/40 to-orange-200", kind: "Hero", source: "Official" },
  { src: "from-pink-200 to-orange-200", kind: "Photo", source: "Official" },
  { src: "from-amber-200 to-rose-200", kind: "Photo", source: "Google" },
  { src: "from-orange-300 to-red-200", kind: "Photo", source: "Google" },
  { src: "from-rose-200 to-pink-300", kind: "TikTok", source: "TikTok" },
  { src: "from-yellow-200 to-orange-300", kind: "Reel", source: "Instagram" },
];

function BusinessMediaPage() {
  return (
    <BusinessPageShell
      eyebrow="Media Manager"
      title="Photos & videos"
      description="Curate your hero image, official uploads, and the social content we pull in."
      actions={
        <div className="flex gap-2">
          <Button variant="outline">
            <Star className="mr-1.5 h-4 w-4" /> Replace hero
          </Button>
          <Button>
            <Upload className="mr-1.5 h-4 w-4" /> Upload photo
          </Button>
        </div>
      }
    >
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {MEDIA.map((m, i) => (
            <div
              key={i}
              className={`group relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${m.src}`}
            >
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                <span className="rounded-full bg-black/55 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                  {m.kind}
                </span>
                {m.kind === "Hero" && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-white">
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
                  {m.source}
                </span>
                <button className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-destructive hover:bg-white">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <button className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-ink hover:text-ink">
            <div className="flex flex-col items-center gap-1 text-xs">
              <ImageIcon className="h-5 w-5" />
              Upload
            </div>
          </button>
        </div>
      </Card>
    </BusinessPageShell>
  );
}
