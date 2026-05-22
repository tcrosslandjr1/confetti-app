/**
 * Tonight Feed — User-facing page showing curated suggestions for the evening.
 * Filterable by type, mood, and audience. Cream/coral Confetti design.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, DollarSign, Filter, X } from "lucide-react";
import { TonightCard } from "@/components/venue-suggestions/TonightCard";
import { useTonightFeed } from "@/hooks/use-venue-suggestions";
import type { SuggestionType } from "@/types/venue-suggestion";

export const Route = createFileRoute("/tonight")({
  component: TonightPage,
});

const TYPE_FILTERS: { value: SuggestionType; label: string; icon: typeof Calendar }[] = [
  { value: "event", label: "Events", icon: Calendar },
  { value: "experience", label: "Experiences", icon: Sparkles },
  { value: "promo", label: "Deals", icon: DollarSign },
];

const MOOD_PILLS = [
  "romantic", "adventurous", "chill", "celebratory", "trendy",
  "upscale", "casual", "late night", "brunch", "family-friendly",
];

const AUDIENCE_PILLS = ["solo", "couples", "groups", "families", "corporate"];

function TonightPage() {
  const [selectedType, setSelectedType] = useState<SuggestionType | undefined>();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: suggestions = [], isLoading } = useTonightFeed({
    type: selectedType,
    moods: selectedMoods.length ? selectedMoods : undefined,
    audience: selectedAudience.length ? selectedAudience : undefined,
  });

  function toggleMood(m: string) {
    setSelectedMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function toggleAudience(a: string) {
    setSelectedAudience(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function clearFilters() {
    setSelectedType(undefined);
    setSelectedMoods([]);
    setSelectedAudience([]);
  }

  const hasFilters = selectedType || selectedMoods.length > 0 || selectedAudience.length > 0;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif italic text-stone-800">Tonight</h1>
          <p className="text-stone-500 mt-1">
            Curated events, experiences &amp; deals happening near you
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Type pills */}
          {TYPE_FILTERS.map(tf => {
            const Icon = tf.icon;
            const active = selectedType === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setSelectedType(active ? undefined : tf.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition ${
                  active
                    ? "bg-[#E85D4A] text-white border-[#E85D4A]"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tf.label}
              </button>
            );
          })}

          {/* More filters toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-1.5 rounded-full ${showFilters ? "border-[#E85D4A] text-[#E85D4A]" : ""}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </Button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6 space-y-4">
            {/* Moods */}
            <div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Mood</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {MOOD_PILLS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMood(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                      selectedMoods.includes(m)
                        ? "bg-[#E85D4A] text-white border-[#E85D4A]"
                        : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Who's going</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {AUDIENCE_PILLS.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAudience(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                      selectedAudience.includes(a)
                        ? "bg-[#E85D4A] text-white border-[#E85D4A]"
                        : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Sparkles className="w-6 h-6 animate-pulse text-[#E85D4A]" />
            <span className="ml-2 text-stone-400">Finding tonight's best…</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No suggestions match your filters right now.</p>
            {hasFilters && (
              <Button variant="ghost" className="mt-3 text-[#E85D4A]" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(s => (
              <TonightCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
