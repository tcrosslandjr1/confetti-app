/**
 * SuggestionForm — Create / Edit a venue suggestion
 *
 * Handles all three types: event, experience, promo.
 * Cream/coral Confetti design language.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  Image,
  Sparkles,
  Tag,
  Type,
  Users,
  X,
  Send,
  Save,
} from "lucide-react";
import type {
  VenueSuggestionInput,
  SuggestionType,
  VenueSuggestion,
} from "@/types/venue-suggestion";

const TYPE_CONFIG: Record<SuggestionType, { label: string; color: string; icon: typeof Calendar }> = {
  event: { label: "Event / Special", color: "bg-violet-100 text-violet-700", icon: Calendar },
  experience: { label: "Featured Experience", color: "bg-amber-100 text-amber-700", icon: Sparkles },
  promo: { label: "Promotion / Deal", color: "bg-emerald-100 text-emerald-700", icon: DollarSign },
};

const MOOD_OPTIONS = [
  "Romantic", "Adventurous", "Chill", "Celebratory", "Trendy",
  "Upscale", "Casual", "Late Night", "Brunch", "Family-Friendly",
];

const AUDIENCE_OPTIONS = ["Solo", "Couples", "Groups", "Families", "Corporate"];

type Props = {
  venueId: string;
  initial?: VenueSuggestion;
  onSubmit: (input: VenueSuggestionInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function SuggestionForm({ venueId, initial, onSubmit, onCancel, isLoading }: Props) {
  const [type, setType] = useState<SuggestionType>(initial?.type ?? "event");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt?.slice(0, 16) ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt?.slice(0, 16) ?? "");
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [recurrenceRule, setRecurrenceRule] = useState(initial?.recurrenceRule ?? "");
  const [originalPrice, setOriginalPrice] = useState(initial?.originalPrice?.toString() ?? "");
  const [offerPrice, setOfferPrice] = useState(initial?.offerPrice?.toString() ?? "");
  const [discountPct, setDiscountPct] = useState(initial?.discountPct?.toString() ?? "");
  const [promoCode, setPromoCode] = useState(initial?.promoCode ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(initial?.targetMoods ?? []);
  const [selectedAudience, setSelectedAudience] = useState<string[]>(initial?.targetAudience ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      venueId,
      type,
      title,
      subtitle: subtitle || undefined,
      description,
      imageUrl: imageUrl || undefined,
      tags,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      recurring,
      recurrenceRule: recurring ? recurrenceRule : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      discountPct: discountPct ? Number(discountPct) : undefined,
      promoCode: promoCode || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      targetMoods: selectedMoods,
      targetAudience: selectedAudience,
    });
  }

  function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter(a => a !== item) : [...arr, item]);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  const inputCls = "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D4A]/30 transition";
  const labelCls = "text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5 block";

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
        {/* Type selector */}
        <div>
          <span className={labelCls}>Type</span>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TYPE_CONFIG) as SuggestionType[]).map(t => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                    type === t
                      ? "border-[#E85D4A] bg-[#FFF8F0] text-[#E85D4A]"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Rooftop Jazz Night"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Subtitle</label>
            <input
              className={inputCls}
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. Live trio every Friday"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description *</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell users what makes this special..."
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className={labelCls}>Image URL</label>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 w-full max-w-xs rounded-xl object-cover aspect-video"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        {/* Scheduling */}
        <div>
          <span className={labelCls}>Schedule</span>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-400">Starts</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Ends</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => setRecurring(e.target.checked)}
              className="rounded border-stone-300"
            />
            This is a recurring event
          </label>
          {recurring && (
            <input
              className={`${inputCls} mt-2`}
              value={recurrenceRule}
              onChange={e => setRecurrenceRule(e.target.value)}
              placeholder="e.g. FREQ=WEEKLY;BYDAY=FR,SA"
            />
          )}
        </div>

        {/* Pricing / Promo */}
        {(type === "promo" || type === "experience") && (
          <div>
            <span className={labelCls}>Pricing / Deal</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-stone-400">Original $</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-stone-400">Offer $</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-stone-400">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputCls}
                  value={discountPct}
                  onChange={e => setDiscountPct(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-stone-400">Promo code</label>
                <input
                  className={inputCls}
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="SUMMER25"
                />
              </div>
            </div>
          </div>
        )}

        {/* Capacity */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Capacity (optional)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="Max attendees"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={labelCls}>Tags</label>
          <div className="flex gap-2 items-center">
            <input
              className={inputCls}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag and press enter"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              <Tag className="w-3.5 h-3.5" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(t => (
                <Badge key={t} variant="secondary" className="gap-1 text-xs">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Mood Targeting */}
        <div>
          <label className={labelCls}>Target Moods</label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleItem(selectedMoods, m.toLowerCase(), setSelectedMoods)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedMoods.includes(m.toLowerCase())
                    ? "bg-[#E85D4A] text-white border-[#E85D4A]"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Audience Targeting */}
        <div>
          <label className={labelCls}>Target Audience</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleItem(selectedAudience, a.toLowerCase(), setSelectedAudience)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedAudience.includes(a.toLowerCase())
                    ? "bg-[#E85D4A] text-white border-[#E85D4A]"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !title || !description}
            className="bg-[#E85D4A] hover:bg-[#d14e3d] text-white rounded-xl gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Saving…</span>
            ) : initial ? (
              <>
                <Save className="w-4 h-4" /> Update
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Create suggestion
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}
