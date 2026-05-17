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
  href: string;
};

export type VenueCard = {
  id: string;
  name: string;
  neighborhood: string;
  description?: string;
  tags: string[];
  /** Hero image url. */
  imageUrl: string;
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
  reels?: SocialReel[];
};
