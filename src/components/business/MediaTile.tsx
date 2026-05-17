import { useState } from "react";
import { Eye, EyeOff, Star, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaSource = "official" | "google" | "tiktok" | "instagram";

export type MediaItem = {
  url: string;
  source: MediaSource;
  hidden?: boolean;
  isHero?: boolean;
};

const SOURCE_LABEL: Record<MediaSource, string> = {
  official: "Official",
  google: "Google",
  tiktok: "TikTok",
  instagram: "Instagram",
};

export function MediaTile({
  item,
  busy,
  onSetHero,
  onToggleHidden,
  onDelete,
  onOpen,
}: {
  item: MediaItem;
  busy?: boolean;
  onSetHero: (url: string) => void;
  onToggleHidden: (url: string) => void;
  onDelete?: (url: string) => void;
  onOpen?: (url: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border bg-muted transition-all",
        item.hidden && "opacity-50",
        hover && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute left-2 top-2 flex gap-1">
        <Badge variant="secondary" className="text-[10px]">
          {SOURCE_LABEL[item.source]}
        </Badge>
        {item.isHero && (
          <Badge className="bg-primary text-primary-foreground text-[10px]">
            <Star className="mr-1 h-3 w-3" /> Hero
          </Badge>
        )}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-end gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity",
          hover && "pointer-events-auto opacity-100",
        )}
      >
        {!item.isHero && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            disabled={busy}
            onClick={() => onSetHero(item.url)}
          >
            <Star className="mr-1 h-3 w-3" /> Hero
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          disabled={busy}
          onClick={() => onToggleHidden(item.url)}
        >
          {item.hidden ? (
            <>
              <Eye className="mr-1 h-3 w-3" /> Show
            </>
          ) : (
            <>
              <EyeOff className="mr-1 h-3 w-3" /> Hide
            </>
          )}
        </Button>
        {onOpen && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-white hover:bg-white/20"
            onClick={() => onOpen(item.url)}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
        {item.source === "official" && onDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            disabled={busy}
            onClick={() => onDelete(item.url)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
