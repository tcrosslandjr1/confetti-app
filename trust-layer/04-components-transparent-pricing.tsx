// ============================================================
// CONFETTI TRUST LAYER — Transparent Pricing Components
// React + TypeScript + Tailwind + Framer Motion
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import type {
  VenuePricing,
  SpendEstimate,
  ItineraryPriceEstimate,
  TransparentPricingProps,
  PriceCategory,
} from './01-types';

// --- Category display config ---

const CATEGORY_CONFIG: Record<PriceCategory, { emoji: string; label: string }> = {
  cocktails: { emoji: '🍸', label: 'Cocktails' },
  beer: { emoji: '🍺', label: 'Beer' },
  wine: { emoji: '🍷', label: 'Wine' },
  entrees: { emoji: '🍽️', label: 'Entrees' },
  appetizers: { emoji: '🥗', label: 'Appetizers' },
  bottle_service: { emoji: '🍾', label: 'Bottle Service' },
  cover: { emoji: '🎫', label: 'Cover Charge' },
};

// --- Format helpers ---

const formatPrice = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRange = (low: number, high: number, currency = 'USD'): string => {
  if (low === high) return formatPrice(low, currency);
  return `${formatPrice(low, currency)}–${formatPrice(high, currency)}`;
};

// --- Venue Price Card (on venue detail page) ---

export const VenuePriceCard: React.FC<TransparentPricingProps> = ({
  pricing,
  spendEstimate,
  compact = false,
}) => {
  if (pricing.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-emerald-500" />
        <h4 className="text-sm font-semibold text-gray-800">What to expect</h4>
      </div>

      {/* Price list */}
      <div className="space-y-1.5">
        {pricing.map((item) => {
          const catConfig = CATEGORY_CONFIG[item.category];
          return (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {catConfig.emoji} {catConfig.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {formatRange(item.priceLow, item.priceHigh, item.currency)}
                </span>
                {item.notes && (
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    {item.notes}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Typical night estimate */}
      {spendEstimate && spendEstimate.sampleCount >= 5 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5" />
            <p className="text-sm text-gray-600">
              Typical night out here ({spendEstimate.partySize === 1 ? 'solo' : `${spendEstimate.partySize} people`}):{' '}
              <span className="font-semibold text-gray-800">
                ~{formatPrice(spendEstimate.avgSpendPerPerson)}/person
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Compact Price Tag (for venue cards in lists) ---

export const PriceTag: React.FC<{
  priceLow: number;
  priceHigh: number;
  category?: string;
}> = ({ priceLow, priceHigh, category }) => {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <DollarSign className="h-3 w-3" />
      {formatRange(priceLow, priceHigh)}
      {category && <span className="text-gray-400">({category})</span>}
    </span>
  );
};

// --- Itinerary Price Breakdown (on Boarding Pass) ---

export const ItineraryPriceBreakdown: React.FC<{
  estimate: ItineraryPriceEstimate;
}> = ({ estimate }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Estimated Night</h4>
        <span className="text-sm font-bold text-gray-900">
          {formatRange(estimate.perPersonLow, estimate.perPersonHigh)}/person
        </span>
      </div>

      {/* Stop breakdown */}
      <div className="space-y-2">
        {estimate.stops.map((stop, idx) => (
          <div key={stop.venueId} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Stop {idx + 1} ({stop.venueName})
            </span>
            <span className="text-gray-700 font-medium">
              {formatRange(stop.estimateLow, stop.estimateHigh)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Total ({estimate.partySize} {estimate.partySize === 1 ? 'person' : 'people'})
        </span>
        <span className="text-sm font-bold text-gray-900">
          {formatRange(estimate.totalLow, estimate.totalHigh)}
        </span>
      </div>

      {/* Over budget alert */}
      {estimate.overBudget && estimate.budgetLimit && (
        <OverBudgetAlert
          estimateHigh={estimate.perPersonHigh}
          budgetLimit={estimate.budgetLimit}
        />
      )}
    </div>
  );
};

// --- Over Budget Alert ---

export const OverBudgetAlert: React.FC<{
  estimateHigh: number;
  budgetLimit: number;
  onFindAlternatives?: () => void;
}> = ({ estimateHigh, budgetLimit, onFindAlternatives }) => {
  const overBy = estimateHigh - budgetLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3"
    >
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-amber-800">
          This plan might run ~{formatPrice(overBy)} over your usual budget.
        </p>
        {onFindAlternatives && (
          <button
            onClick={onFindAlternatives}
            className="text-xs font-medium text-amber-700 underline mt-1 hover:text-amber-800"
          >
            Want me to find alternatives?
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Surge Pricing Notice ---

export const SurgePricingNotice: React.FC<{
  surgePercent: number;
  context: string; // e.g., "Saturday night"
}> = ({ surgePercent, context }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
      <TrendingUp className="h-3 w-3" />
      <span>{context} prices are typically {surgePercent}% higher</span>
    </div>
  );
};

// --- Post-Visit Spend Reporter ---

export const SpendReporter: React.FC<{
  venueName: string;
  partySize: number;
  onSubmit: (totalSpend: number) => void;
  onSkip: () => void;
}> = ({ venueName, partySize, onSubmit, onSkip }) => {
  const [amount, setAmount] = React.useState('');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <p className="text-sm text-gray-700">
        How much did your group spend at <span className="font-medium">{venueName}</span>?
      </p>
      <p className="text-xs text-gray-400">
        Optional & anonymous — helps others plan their budget
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Total including tip"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
          />
        </div>
        <button
          onClick={() => amount && onSubmit(parseFloat(amount))}
          disabled={!amount}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      </div>

      <button
        onClick={onSkip}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip
      </button>
    </div>
  );
};
