/**
 * TicketTierSelector — multi-tier ticket selection for events.
 * Shows tier cards with price, description, availability, and quantity picker.
 */

import { useState } from "react";
import { Ticket, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";

export type TicketTier = {
  id: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  sold: number;
};

export function TicketTierSelector({
  tiers,
  onPurchase,
}: {
  tiers: TicketTier[];
  onPurchase?: (selections: { tierId: string; quantity: number }[]) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = tiers.reduce(
    (sum, t) => sum + (quantities[t.id] || 0) * t.price,
    0,
  );

  function setQty(tierId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [tierId]: Math.max(0, qty) }));
  }

  function handlePurchase() {
    const selections = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([tierId, quantity]) => ({ tierId, quantity }));
    if (selections.length === 0) {
      toast.error("Select at least one ticket");
      return;
    }
    onPurchase?.(selections);
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <Ticket className="h-5 w-5" /> Tickets
      </h3>

      {tiers.map((tier) => {
        const remaining = tier.capacity - tier.sold;
        const soldOut = remaining <= 0;
        const qty = quantities[tier.id] || 0;
        const almostGone = remaining > 0 && remaining <= 10;

        return (
          <div
            key={tier.id}
            className={`flex flex-col gap-2 rounded-xl border p-4 transition ${
              qty > 0
                ? "border-coral bg-coral/5"
                : soldOut
                  ? "border-ink/10 bg-ink/5 opacity-60"
                  : "border-ink/10 bg-white/60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-display text-sm font-bold text-ink">
                  {tier.name}
                </span>
                {almostGone && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-amber-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    {remaining} left
                  </span>
                )}
              </div>
              <span className="font-mono text-sm font-bold text-ink">
                {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)}`}
              </span>
            </div>

            {tier.description && (
              <p className="text-[12px] leading-relaxed text-ink/60">
                {tier.description}
              </p>
            )}

            {soldOut ? (
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-500">
                Sold out
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(tier.id, qty - 1)}
                  disabled={qty === 0}
                  className="grid h-7 w-7 place-items-center rounded-full border border-ink/20 text-ink/60 transition hover:bg-ink/5 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center font-mono text-sm font-bold text-ink">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQty(tier.id, Math.min(qty + 1, remaining, 10))
                  }
                  disabled={qty >= remaining || qty >= 10}
                  className="grid h-7 w-7 place-items-center rounded-full border border-ink/20 text-ink/60 transition hover:bg-ink/5 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Purchase bar */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-ink bg-cream p-3 shadow-brut">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
              {totalItems} ticket{totalItems !== 1 ? "s" : ""}
            </span>
            <span className="ml-2 font-display text-lg font-bold text-ink">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={handlePurchase}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Get tickets
          </button>
        </div>
      )}
    </div>
  );
}
