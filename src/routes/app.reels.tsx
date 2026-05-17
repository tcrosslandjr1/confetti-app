import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2, Bookmark, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/reels")({
  component: ReelsPage,
});

function ReelsPage() {
  const { data: reels } = useQuery({
    queryKey: ["app", "reels", "feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reels")
        .select("id,title,caption,video_url,thumbnail_url,city,venue_id,like_count,view_count")
        .eq("status", "published")
        .order("trending_score", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="-mt-px h-[calc(100vh-80px)] snap-y snap-mandatory overflow-y-scroll bg-black text-white">
      {(reels ?? []).map((r) => (
        <article
          key={r.id}
          className="relative flex h-[calc(100vh-80px)] w-full snap-start items-end"
        >
          {r.video_url ? (
            <video
              src={r.video_url}
              poster={r.thumbnail_url ?? undefined}
              className="absolute inset-0 size-full object-cover"
              muted
              playsInline
              loop
              autoPlay={false}
            />
          ) : r.thumbnail_url ? (
            <img
              src={r.thumbnail_url}
              alt={r.title ?? "Reel"}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

          <aside className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
            <ReelAction icon={Heart} label={String(r.like_count ?? 0)} />
            <ReelAction icon={Bookmark} label="Save" />
            <ReelAction icon={Share2} label="Share" />
          </aside>

          <div className="relative z-10 w-full p-5 pb-8">
            {r.venue_id && (
              <Link
                to="/venue/$id"
                params={{ id: r.venue_id }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md"
              >
                <MapPin className="size-3" /> View venue
              </Link>
            )}
            <h2 className="mt-3 text-lg font-bold leading-tight">{r.title ?? "Untitled"}</h2>
            {r.caption && <p className="mt-1 line-clamp-2 text-sm text-white/80">{r.caption}</p>}
          </div>
        </article>
      ))}
      {!reels?.length && (
        <div className="grid h-full place-items-center text-sm text-white/70">No reels yet</div>
      )}
    </div>
  );
}

function ReelAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center gap-1 text-white">
      <span className="grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur">
        <Icon className="size-5" />
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
