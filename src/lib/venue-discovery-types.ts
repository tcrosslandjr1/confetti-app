// Type contract for the enhanced VenueDiscoveryCard component.

export type SocialReel = {
  /** Stable id for keying / analytics. */
  id: string;
  platform: "tiktok" | "instagram";
  /** Thumbnail image url (square works best). */
  thumbnailUrl: string;
  /** Deep link to the reel/post. */
  url: string;
  /** Optional pre-formatted view count, e.g. "1.2M". */
  viewCount?: string;
  /** Promoted/paid placement flag. */
  isPromoted?: boolean;
};

export type SponsoredCta = {
  /** Short pitch shown next to the venue name in the sponsored strip. */
  headline: string;
  /** Button label, e.g. "Claim offer". */
  label: string;
  /** Where the CTA sends the user. */
  url: string;
};

export type VenueCard = {
  id: string;
  name: string;
  neighborhood: string;
  description?: string;
  tags: string[];
  /** Hero image url. */
  heroImageUrl: string;
  /** 0–5 star rating. */
  rating?: number;
  /** Pre-formatted price band, e.g. "$$". */
  priceBand?: string;
  /** AI editorial pick badge. */
  aiPick?: boolean;
  /** Paid placement flag — drives badge + sponsored strip. */
  isSponsored?: boolean;
  /** Optional explicit social / web urls. Fall back to search links if absent. */
  googleMapsUrl?: string;
  websiteUrl?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  /** Sponsored CTA payload (only used when isSponsored is true). */
  sponsoredCta?: SponsoredCta;
  /** Community reels grid (TikTok + Instagram). */
  communityReels?: SocialReel[];
  /** Trust & safety signals shown on the card. */
  trust?: TrustSignals;
};

export type TrustSignals = {
  /** Confetti-verified venue (manual review passed). */
  verified?: boolean;
  /** Owner has claimed & maintains the listing. */
  claimed?: boolean;
  /** Live crowd level right now. */
  crowdLevel?: "quiet" | "buzzing" | "packed";
  /** Optional wait estimate, e.g. "~15 min". */
  waitTime?: string;
  /** Avg price per person, e.g. "€28/person". */
  avgSpend?: string;
  /** Whether the venue honors Confetti pricing/no surprise fees. */
  transparentPricing?: boolean;
  /** Safety signals (e.g. well-lit, staff-trained, accessible). */
  safetyBadges?: Array<"well-lit" | "staff-trained" | "accessible" | "late-night-safe">;
};
