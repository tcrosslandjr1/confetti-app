// ============================================================
// Confetti Social Intelligence — Shared Types
// ============================================================

export interface TrendingVenue {
  id?: string;
  name: string;
  city: string;
  country: string;
  category: string;
  address?: string;
  lat?: number;
  lng?: number;
  google_place_id?: string;
  buzz_score: number;
  mention_count: number;
  platforms: string[];
  trend: 'viral' | 'rising' | 'steady' | 'declining';
  vibe_tags: string[];
  snippet?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
}

export interface SocialMention {
  trending_venue_id?: string;
  platform: string;
  post_url?: string;
  post_id?: string;
  creator_handle?: string;
  creator_followers?: number;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  sentiment?: number;
  snippet?: string;
}

export interface ScanRun {
  id?: string;
  city: string;
  scan_type: 'trend' | 'new_opening' | 'deep_audit' | 'dormant_check';
  platform?: string;
  status: 'running' | 'completed' | 'failed';
  venues_found: number;
  mentions_found: number;
  errors: string[];
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface PlatformResult {
  venue_name: string;
  venue_address?: string;
  city: string;
  category?: string;
  platform: string;
  post_url?: string;
  post_id?: string;
  creator_handle?: string;
  creator_followers?: number;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  sentiment?: number;
  snippet?: string;
}

export interface ResolvedVenue {
  name: string;
  city: string;
  country: string;
  category: string;
  address?: string;
  lat?: number;
  lng?: number;
  google_place_id?: string;
  image_url?: string;
  existing_id?: string;  // if matched to existing trending_venue
}
