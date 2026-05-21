// ============================================================
// CONFETTI TRUST LAYER — Verified Venue Components
// React + TypeScript + Tailwind + Framer Motion
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, ShieldAlert } from 'lucide-react';
import type { VerificationTier, VerificationBadgeProps, VenueVerification } from './01-types';

// --- Badge Configuration ---

const BADGE_CONFIG: Record<VerificationTier, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  unverified: {
    icon: ShieldAlert,
    label: 'Not Verified',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Info not confirmed',
  },
  verified: {
    icon: Check,
    label: 'Verified',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Confirmed accurate by Confetti',
  },
  confetti_pick: {
    icon: Star,
    label: 'Confetti Pick',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Highly rated by the community',
  },
  confetti_elite: {
    icon: Crown,
    label: 'Confetti Elite',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Exclusive partner venue',
  },
};

// --- VerificationBadge ---

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = true,
}) => {
  const config = BADGE_CONFIG[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (tier === 'unverified') {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400">
        <Icon className={sizeClasses[size]} />
        {showLabel && (
          <span className={`${textSizes[size]} italic`}>Info not confirmed</span>
        )}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bgColor} border ${config.borderColor}`}
    >
      <Icon className={`${sizeClasses[size]} ${config.color}`} />
      {showLabel && (
        <span className={`${textSizes[size]} font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </motion.span>
  );
};

// --- Verification Trust Card (expanded view on venue detail) ---

export const VerificationTrustCard: React.FC<{
  verification: VenueVerification;
}> = ({ verification }) => {
  const config = BADGE_CONFIG[verification.tier];

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <VerificationBadge tier={verification.tier} size="lg" />
        {verification.checkinCount > 0 && (
          <span className="text-sm text-gray-500">
            {verification.checkinCount} check-ins
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">{config.description}</p>

      {/* Trust signals */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {verification.avgRating > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>{verification.avgRating.toFixed(1)} rating</span>
          </div>
        )}
        {verification.photosVerified && (
          <div className="flex items-center gap-1.5">
            <span>📸</span>
            <span>{verification.realPhotoCount} real photos</span>
          </div>
        )}
        {verification.isDirectPartner && (
          <div className="flex items-center gap-1.5">
            <span>🤝</span>
            <span>Direct partner</span>
          </div>
        )}
        {verification.hasExclusiveExperiences && (
          <div className="flex items-center gap-1.5">
            <span>✨</span>
            <span>Exclusives available</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Compact Badge for Venue Cards (inline) ---

export const VenueCardBadge: React.FC<{
  tier: VerificationTier;
  checkinCount: number;
}> = ({ tier, checkinCount }) => {
  if (tier === 'unverified') return null;

  const config = BADGE_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{config.label}</span>
      </span>
      {checkinCount > 0 && (
        <span className="text-xs text-gray-400">
          · {checkinCount} check-ins
        </span>
      )}
    </div>
  );
};

// --- Verification Filter Toggle ---

export const VerifiedOnlyFilter: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        enabled
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      <Check className="h-3.5 w-3.5" />
      Verified only
    </button>
  );
};
