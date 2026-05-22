/**
 * SuggestionsList — Displays a venue's suggestions with status badges and actions.
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Edit3,
  Archive,
  Send,
  Sparkles,
  Clock,
  Users,
  Eye,
} from "lucide-react";
import type { VenueSuggestion, SuggestionStatus, SuggestionType } from "@/types/venue-suggestion";

const STATUS_BADGE: Record<SuggestionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-stone-100 text-stone-600" },
  pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-700" },
  active: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", className: "bg-red-100 text-red-600" },
  archived: { label: "Archived", className: "bg-stone-100 text-stone-400" },
};

const TYPE_ICON: Record<SuggestionType, typeof Calendar> = {
  event: Calendar,
  experience: Sparkles,
  promo: DollarSign,
};

type Props = {
  suggestions: VenueSuggestion[];
  onEdit: (s: VenueSuggestion) => void;
  onSubmit: (id: string) => void;
  onArchive: (id: string) => void;
};

export function SuggestionsList({ suggestions, onEdit, onSubmit, onArchive }: Props) {
  if (!suggestions.length) {
    return (
      <Card className="p-8 text-center bg-white rounded-2xl border border-stone-100">
        <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-500">No suggestions yet. Create your first one above!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map(s => {
        const Icon = TYPE_ICON[s.type];
        const badge = STATUS_BADGE[s.status];
        return (
          <Card
            key={s.id}
            className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col sm:flex-row gap-4 items-start"
          >
            {/* Image preview */}
            {s.imageUrl && (
              <img
                src={s.imageUrl}
                alt={s.title}
                className="w-full sm:w-28 h-20 rounded-xl object-cover flex-shrink-0"
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Icon className="w-4 h-4 text-stone-400" />
                <h3 className="font-semibold text-stone-800 truncate">{s.title}</h3>
                <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
              </div>
              {s.subtitle && <p className="text-xs text-stone-500 mb-1">{s.subtitle}</p>}
              <p className="text-sm text-stone-600 line-clamp-2">{s.description}</p>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                {s.startsAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(s.startsAt).toLocaleDateString()}
                  </span>
                )}
                {s.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {s.rsvpCount}/{s.capacity}
                  </span>
                )}
                {s.discountPct && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {s.discountPct}% off
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {s.status === "draft" && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(s)}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#E85D4A] hover:bg-[#d14e3d] text-white"
                    onClick={() => onSubmit(s.id)}
                  >
                    <Send className="w-3.5 h-3.5" /> Submit
                  </Button>
                </>
              )}
              {s.status === "active" && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onArchive(s.id)}>
                  <Archive className="w-3.5 h-3.5" /> Archive
                </Button>
              )}
              {s.status === "pending_review" && (
                <Badge className="bg-amber-50 text-amber-600 text-xs">
                  <Eye className="w-3 h-3 mr-1" /> Under review
                </Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
