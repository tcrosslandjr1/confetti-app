/**
 * VenueMenu — displays menu sections with items, prices,
 * dietary tags, and popular badges.
 */

import { useState } from "react";
import { Flame, Leaf, Fish, Wheat, Star } from "lucide-react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  dietaryTags: string[];
  isPopular: boolean;
  isAvailable: boolean;
};

export type MenuSection = {
  id: string;
  sectionName: string;
  items: MenuItem[];
};

const DIET_ICONS: Record<string, { icon: typeof Leaf; color: string }> = {
  vegetarian: { icon: Leaf, color: "text-emerald-600" },
  vegan: { icon: Leaf, color: "text-green-700" },
  "gluten-free": { icon: Wheat, color: "text-amber-600" },
  seafood: { icon: Fish, color: "text-blue-600" },
  spicy: { icon: Flame, color: "text-red-500" },
};

export function VenueMenu({ sections }: { sections: MenuSection[] }) {
  const [activeSection, setActiveSection] = useState(0);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold text-cream">Menu</h2>

      {/* Section tabs */}
      {sections.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {sections.map((sec, i) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(i)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
                activeSection === i
                  ? "bg-ink text-cream"
                  : "border border-cream/15 text-cream/50 hover:border-ink/30"
              }`}
            >
              {sec.sectionName}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-2">
        {sections[activeSection].items.map((item) => (
          <div
            key={item.id}
            className={`flex gap-3 rounded-xl border border-cream/10 bg-white/60 p-3 backdrop-blur ${
              !item.isAvailable ? "opacity-50" : ""
            }`}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-lg border border-cream/10 object-cover"
                loading="lazy"
              />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold text-cream">
                    {item.name}
                  </span>
                  {item.isPopular && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-amber-700">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      Popular
                    </span>
                  )}
                </div>
                {item.price != null && (
                  <span className="shrink-0 font-mono text-sm font-bold text-cream">
                    ${item.price.toFixed(2)}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-[12px] leading-relaxed text-cream/60">
                  {item.description}
                </p>
              )}

              {item.dietaryTags.length > 0 && (
                <div className="flex gap-1">
                  {item.dietaryTags.map((tag) => {
                    const cfg = DIET_ICONS[tag.toLowerCase()];
                    const Icon = cfg?.icon;
                    return (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-0.5 rounded-full bg-cream/5 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${
                          cfg?.color || "text-cream/50"
                        }`}
                      >
                        {Icon && <Icon className="h-2.5 w-2.5" />}
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {!item.isAvailable && (
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-500">
                  Currently unavailable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
