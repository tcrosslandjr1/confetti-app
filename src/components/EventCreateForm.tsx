/**
 * EventCreateForm — create / publish events with multi-tier ticketing.
 * Full event creation flow: details → tiers → publish.
 */

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Image,
  Plus,
  Trash2,
  Send,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Dining",
  "Nightlife",
  "Music",
  "Arts",
  "Sports",
  "Comedy",
  "Social",
  "Wellness",
  "Other",
];

type TierDraft = {
  name: string;
  description: string;
  price: number;
  capacity: number;
};

export function EventCreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit?: (event: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    startsAt: string;
    endsAt: string;
    city: string;
    address: string;
    tiers: TierDraft[];
  }) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Dining");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [tiers, setTiers] = useState<TierDraft[]>([
    { name: "General Admission", description: "", price: 0, capacity: 100 },
  ]);

  function addTier() {
    setTiers([...tiers, { name: "", description: "", price: 0, capacity: 50 }]);
  }

  function updateTier(i: number, updates: Partial<TierDraft>) {
    setTiers(tiers.map((t, j) => (j === i ? { ...t, ...updates } : t)));
  }

  function removeTier(i: number) {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, j) => j !== i));
  }

  function handleSubmit() {
    if (!title.trim()) return toast.error("Event title is required");
    if (!startsAt) return toast.error("Start date/time is required");
    if (tiers.some((t) => !t.name.trim()))
      return toast.error("All ticket tiers need a name");

    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      category,
      imageUrl,
      startsAt,
      endsAt,
      city: city.trim(),
      address: address.trim(),
      tiers,
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border-2 border-ink bg-white p-5 shadow-brut">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">
          {step === 1 ? "Create Event" : "Ticket Tiers"}
        </h2>
        <div className="flex items-center gap-1 font-mono text-[10px] text-ink/40">
          <span className={step === 1 ? "font-bold text-ink" : ""}>Details</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 2 ? "font-bold text-ink" : ""}>Tickets</span>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Event title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer Rooftop Mixer"
              className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
                    category === cat
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-ink/15 text-ink/60 hover:border-ink/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date/time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Starts *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Ends
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Washington, DC"
                className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell people what to expect…"
              className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="inline-flex items-center justify-center gap-1.5 self-end rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
          >
            Next: Tickets <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-ink/10 bg-cream/30 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
                  Tier {i + 1}
                </span>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  placeholder="Tier name"
                  className="flex-1 rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none"
                />
                <input
                  type="number"
                  value={tier.price}
                  onChange={(e) =>
                    updateTier(i, { price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Price"
                  className="w-20 rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink focus:border-coral focus:outline-none"
                  min={0}
                  step={0.01}
                />
                <input
                  type="number"
                  value={tier.capacity}
                  onChange={(e) =>
                    updateTier(i, { capacity: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Cap"
                  className="w-16 rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink focus:border-coral focus:outline-none"
                  min={1}
                />
              </div>
              <input
                type="text"
                value={tier.description}
                onChange={(e) => updateTier(i, { description: e.target.value })}
                placeholder="Description (optional)"
                className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-ink/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50 hover:border-ink/50"
          >
            <Plus className="h-3.5 w-3.5" /> Add tier
          </button>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50 hover:bg-ink/5"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
            >
              <Send className="h-3.5 w-3.5" /> Publish event
            </button>
          </div>
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="self-start font-mono text-[10px] text-ink/40 hover:text-ink/60"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
