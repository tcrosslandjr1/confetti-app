import { Flame, Camera, Sparkles, Star, TrendingUp, Heart, UtensilsCrossed, Image as ImageIcon, Clock } from "lucide-react";

export type ViralTag =
  | "tiktok_viral"
  | "instagrammable"
  | "hidden_gem"
  | "creator_mentioned"
  | "trending_this_week"
  | "date_night"
  | "foodie_hype"
  | "photo_op"
  | "worth_the_wait";

const META: Record<ViralTag, { label: string; icon: typeof Flame; className: string }> = {
  tiktok_viral: { label: "TikTok Viral", icon: Flame, className: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  instagrammable: { label: "Instagrammable", icon: Camera, className: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30" },
  hidden_gem: { label: "Hidden Gem", icon: Sparkles, className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  creator_mentioned: { label: "Creator Pick", icon: Star, className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  trending_this_week: { label: "Trending Now", icon: TrendingUp, className: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  date_night: { label: "Date Night", icon: Heart, className: "bg-pink-500/15 text-pink-600 border-pink-500/30" },
  foodie_hype: { label: "Foodie Hype", icon: UtensilsCrossed, className: "bg-red-500/15 text-red-600 border-red-500/30" },
  photo_op: { label: "Photo Op", icon: ImageIcon, className: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30" },
  worth_the_wait: { label: "Worth the Wait", icon: Clock, className: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

export const ALL_VIRAL_TAGS = Object.keys(META) as ViralTag[];
export function tagLabel(tag: ViralTag) { return META[tag]?.label ?? tag; }

export function ViralTagChip({ tag, size = "sm" }: { tag: ViralTag; size?: "sm" | "md" }) {
  const m = META[tag];
  if (!m) return null;
  const Icon = m.icon;
  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${padding} ${m.className}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}
