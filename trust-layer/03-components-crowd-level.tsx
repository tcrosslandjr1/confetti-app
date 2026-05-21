// ============================================================
// CONFETTI TRUST LAYER — Crowd Level Components
// React + TypeScript + Tailwind + Framer Motion
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { CrowdLevel, CrowdIndicatorProps, CrowdPattern } from './01-types';

// --- Crowd Level Configuration ---

const CROWD_CONFIG: Record<CrowdLevel, {
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  barColor: string;
  fillPercent: number;
}> = {
  quiet: {
    emoji: '🟢',
    label: 'Quiet',
    description: 'Walk right in',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    barColor: 'bg-emerald-400',
    fillPercent: 20,
  },
  moderate: {
    emoji: '🟡',
    label: 'Moderate',
    description: 'Some wait possible',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    barColor: 'bg-yellow-400',
    fillPercent: 50,
  },
  busy: {
    emoji: '🔴',
    label: 'Busy',
    description: 'Expect 15–30 min wait',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    barColor: 'bg-red-400',
    fillPercent: 80,
  },
  at_capacity: {
    emoji: '⚫',
    label: 'At Capacity',
    description: 'Reservation recommended',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    barColor: 'bg-gray-800',
    fillPercent: 100,
  },
};

// --- Crowd Indicator (Compact — for venue cards) ---

export const CrowdIndicatorCompact: React.FC<CrowdIndicatorProps> = ({
  level,
  energyScore,
  estimatedWait,
}) => {
  const config = CROWD_CONFIG[level];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{config.emoji}</span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      {estimatedWait && estimatedWait > 0 && (
        <span className="text-xs text-gray-400">
          · ~{estimatedWait} min wait
        </span>
      )}
    </div>
  );
};

// --- Crowd Indicator (Full — for venue detail page) ---

export const CrowdIndicatorFull: React.FC<CrowdIndicatorProps> = ({
  level,
  energyScore,
  estimatedWait,
}) => {
  const config = CROWD_CONFIG[level];

  return (
    <div className={`rounded-lg ${config.bgColor} p-3 space-y-2`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className={`h-4 w-4 ${config.color}`} />
          <span className={`text-sm font-semibold ${config.color}`}>
            {config.emoji} {config.label}
          </span>
        </div>
        <span className="text-xs text-gray-500">Live</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${config.fillPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${config.barColor}`}
        />
      </div>

      {/* Description + wait time */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{config.description}</span>
        {estimatedWait && estimatedWait > 0 && (
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            ~{estimatedWait} min
          </span>
        )}
      </div>
    </div>
  );
};

// --- Crowd Spike Alert (for itinerary stops) ---

export const CrowdSpikeAlert: React.FC<{
  venueName: string;
  previousLevel: CrowdLevel;
  currentLevel: CrowdLevel;
  onSuggestAlternative: () => void;
  onKeep: () => void;
}> = ({ venueName, previousLevel, currentLevel, onSuggestAlternative, onKeep }) => {
  const config = CROWD_CONFIG[currentLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3"
    >
      <div className="flex items-start gap-2">
        <TrendingUp className="h-5 w-5 text-orange-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-800">
            Heads up — {venueName} is filling up fast
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Changed from {CROWD_CONFIG[previousLevel].label} to {config.label}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSuggestAlternative}
          className="flex-1 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
        >
          Suggest alternative
        </button>
        <button
          onClick={onKeep}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Keep it
        </button>
      </div>
    </motion.div>
  );
};

// --- Crowd Pattern Chart (weekly heatmap for venue detail) ---

export const CrowdPatternChart: React.FC<{
  patterns: CrowdPattern[];
}> = ({ patterns }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 12); // 12pm - 11pm

  const getPattern = (day: number, hour: number): CrowdPattern | undefined =>
    patterns.find((p) => p.dayOfWeek === day && p.hour === hour);

  const getHeatColor = (score: number): string => {
    if (score >= 85) return 'bg-gray-800';
    if (score >= 60) return 'bg-red-400';
    if (score >= 30) return 'bg-yellow-300';
    return 'bg-emerald-200';
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Typical crowd levels</h4>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(${hours.length}, 1fr)` }}>
          {/* Hour headers */}
          <div /> {/* empty corner */}
          {hours.map((h) => (
            <div key={h} className="text-[10px] text-gray-400 text-center w-6">
              {h > 12 ? `${h - 12}p` : `${h}p`}
            </div>
          ))}

          {/* Day rows */}
          {days.map((day, dayIdx) => (
            <React.Fragment key={day}>
              <div className="text-[10px] text-gray-500 pr-1 flex items-center">
                {day}
              </div>
              {hours.map((hour) => {
                const pattern = getPattern(dayIdx, hour);
                const score = pattern?.avgEnergyScore ?? 0;
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className={`w-6 h-4 rounded-sm ${getHeatColor(score)}`}
                    title={pattern ? `${day} ${hour}:00 — ${pattern.typicalLevel}` : 'No data'}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200" /> Quiet</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-300" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400" /> Busy</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-800" /> Packed</span>
      </div>
    </div>
  );
};
