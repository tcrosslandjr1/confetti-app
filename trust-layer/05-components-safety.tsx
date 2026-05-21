// ============================================================
// CONFETTI TRUST LAYER — Safety Features Components
// React + TypeScript + Tailwind + Framer Motion
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Car,
  UserCheck,
  AlertCircle,
  Phone,
  MapPin,
  Wine,
  Home,
  ChevronRight,
  X,
  Minus,
  Plus,
  Heart,
} from 'lucide-react';
import type {
  SafetyFlag,
  SafetyFlagType,
  SafeRouteHomeProps,
  DrinkTrackerProps,
  EmergencyContact,
} from './01-types';

// --- Safety Flag Config ---

const FLAG_CONFIG: Record<SafetyFlagType, {
  emoji: string;
  label: string;
  positive: boolean;
}> = {
  well_lit: { emoji: '💡', label: 'Well-lit area', positive: true },
  easy_pickup: { emoji: '🚗', label: 'Easy rideshare pickup', positive: true },
  doorman: { emoji: '🚪', label: 'Doorman present', positive: true },
  limited_cell: { emoji: '📵', label: 'Limited cell service', positive: false },
  cash_only: { emoji: '💵', label: 'Cash only', positive: false },
  outdoor_waiting: { emoji: '🌧️', label: 'Outdoor waiting area', positive: false },
};

// --- Safety Flags Display (on venue detail) ---

export const VenueSafetyFlags: React.FC<{
  flags: SafetyFlag[];
}> = ({ flags }) => {
  if (flags.length === 0) return null;

  const positiveFlags = flags.filter((f) => FLAG_CONFIG[f.flagType].positive);
  const cautionFlags = flags.filter((f) => !FLAG_CONFIG[f.flagType].positive);

  return (
    <div className="space-y-2">
      {positiveFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {positiveFlags.map((flag) => {
            const config = FLAG_CONFIG[flag.flagType];
            return (
              <span
                key={flag.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100"
              >
                {config.emoji} {config.label}
                {flag.reportCount > 5 && (
                  <span className="text-emerald-400">· {flag.reportCount}×</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {cautionFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cautionFlags.map((flag) => {
            const config = FLAG_CONFIG[flag.flagType];
            return (
              <span
                key={flag.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-100"
              >
                {config.emoji} {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Safe Route Home Card ---

export const SafeRouteHome: React.FC<SafeRouteHomeProps & {
  onUber: () => void;
  onLyft: () => void;
  onShareLocation: () => void;
  onImHomeSafe: () => void;
}> = ({
  lastVenue,
  hasHomeAddress,
  buddyName,
  onUber,
  onLyft,
  onShareLocation,
  onImHomeSafe,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Car className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Getting home? 🚗</h3>
          <p className="text-xs text-gray-500">Confetti looks out for you</p>
        </div>
      </div>

      {/* Ride buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onUber}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <span>Uber</span>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onLyft}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF00BF] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span>Lyft</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Share location option */}
      <button
        onClick={onShareLocation}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          Share live location until home
        </span>
        {buddyName && (
          <span className="text-xs text-gray-400">→ {buddyName}</span>
        )}
      </button>

      {/* I'm home safe button */}
      <button
        onClick={onImHomeSafe}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Home className="h-4 w-4" />
        I'm home safe
      </button>
    </motion.div>
  );
};

// --- Drink Tracker (opt-in, gentle) ---

export const DrinkTracker: React.FC<DrinkTrackerProps> = ({
  limit,
  current,
  onIncrement,
  onDecrement,
}) => {
  const progress = (current / limit) * 100;
  const isNearLimit = current >= limit - 1;
  const isAtLimit = current >= limit;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center gap-1.5">
          <Wine className="h-4 w-4 text-purple-400" />
          Tonight's pace
        </span>
        <span className={`text-sm font-medium ${isAtLimit ? 'text-amber-600' : 'text-gray-800'}`}>
          {current} of {limit}
        </span>
      </div>

      {/* Visual tracker */}
      <div className="flex items-center gap-1">
        {Array.from({ length: limit }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-3 rounded-full transition-all ${
              i < current
                ? isNearLimit
                  ? 'bg-amber-400'
                  : 'bg-purple-400'
                : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onDecrement}
          disabled={current <= 0}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-2xl">
          {Array.from({ length: Math.min(current, 5) }, () => '🍸').join('')}
          {current > 5 && ` +${current - 5}`}
        </span>
        <button
          onClick={onIncrement}
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Gentle check-in message */}
      {isAtLimit && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-2 px-3"
        >
          You hit your goal — nice self-awareness 💪 Water round?
        </motion.p>
      )}
    </motion.div>
  );
};

// --- Emergency Resources Panel ---

export const EmergencyPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  emergencyContacts: EmergencyContact[];
  localEmergencyNumber: string;
  nearestHospital: { name: string; distance: string } | null;
  onShareLocation: () => void;
}> = ({
  isOpen,
  onClose,
  emergencyContacts,
  localEmergencyNumber,
  nearestHospital,
  onShareLocation,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Emergency Resources
                </h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Emergency number */}
            <a
              href={`tel:${localEmergencyNumber}`}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <Phone className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Call {localEmergencyNumber}
                </p>
                <p className="text-xs text-red-600">Local emergency services</p>
              </div>
            </a>

            {/* Nearest hospital */}
            {nearestHospital && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Heart className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {nearestHospital.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    Nearest hospital · {nearestHospital.distance}
                  </p>
                </div>
              </div>
            )}

            {/* Share location */}
            <button
              onClick={onShareLocation}
              className="w-full flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl"
            >
              <MapPin className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-purple-800">
                  Share my location
                </p>
                <p className="text-xs text-purple-600">
                  Send to emergency contacts
                </p>
              </div>
            </button>

            {/* Emergency contacts */}
            {emergencyContacts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your emergency contacts
                </h4>
                {emergencyContacts.map((contact, idx) => (
                  <a
                    key={idx}
                    href={`tel:${contact.phone}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contact.relationship}
                      </p>
                    </div>
                    <Phone className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Emergency Button (persistent in itinerary header) ---

export const EmergencyButton: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  return (
    <button
      onClick={onPress}
      className="h-8 w-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors group"
      aria-label="Emergency resources"
    >
      <span className="text-sm group-hover:scale-110 transition-transform">🆘</span>
    </button>
  );
};

// --- Buddy System Toggle ---

export const BuddySystemToggle: React.FC<{
  enabled: boolean;
  buddyName: string | null;
  onToggle: () => void;
  onSelectBuddy: () => void;
}> = ({ enabled, buddyName, onToggle, onSelectBuddy }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-3">
        <UserCheck className={`h-5 w-5 ${enabled ? 'text-purple-500' : 'text-gray-400'}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">Buddy System</p>
          <p className="text-xs text-gray-500">
            {enabled && buddyName
              ? `${buddyName} is your buddy tonight`
              : 'Get alerts if you leave alone'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {enabled && !buddyName && (
          <button
            onClick={onSelectBuddy}
            className="text-xs text-purple-600 font-medium hover:underline"
          >
            Pick buddy
          </button>
        )}
        <button
          onClick={onToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-purple-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
