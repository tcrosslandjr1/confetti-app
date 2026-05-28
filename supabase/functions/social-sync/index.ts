// ============================================================
// social-sync — Automated multi-platform social media ingestion
//
// Pulls saved/liked content from TikTok, Instagram, and Facebook,
// extracts venue mentions + taste signals, then feeds into:
//   → social-learn  (taste profile enrichment)
//   → venue-ingest  (new venue discovery)
//
// POST {
//   user_id: string
//   platforms: { tiktok?: string, instagram?: string, facebook?: string }
//   raw_posts?: SocialPost[]   // for direct injection (e.g. from browser scrape)
//   mode?: "saved" | "liked" | "trending" | "all"
// }
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";

// ── Types ─────────────────────────────────────────────────────

export interface SocialPost {
  platform: "tiktok" | "instagram" | "facebook";
  post_id: string;
  url: string;
  creator_handle: string;
  caption: string;
  hashtags: string[];
  location_tag?: string;
  location_address?: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  posted_at?: string;
  source: "saved" | "liked" | "trending" | "following";
}

export interface ExtractedVenue {
  name: string;
  address?: string;
  city: string;
  state?: string;
  lat?: number;
  lng?: number;
  vibes: string[];
  price_range?: "$" | "$$" | "$$$" | "$$$$";
  experience_type: string[];
  tiktok_signal_score: number; // 0-100, based on saves/likes ratio + engagement
  source_posts: string[];      // post_ids that mentioned this venue
  source_platform: string[];
}

export interface TasteSignals {
  loves: string[];
  scene_keywords: string[];
  music_taste: string[];
  cities: string[];
  energy: "chill" | "balanced" | "high_energy";
  avoid: string[];
}

// ── Signal Score Calculator ────────────────────────────────────

function calculateSignalScore(post: SocialPost): number {
  // Save-to-like ratio is the strongest intent signal
  // (saves = "I want to do this", likes = "I enjoyed seeing this")
  const saveLikeRatio = post.likes > 0 ? post.saves / post.likes : 0;
  const totalEngagement = post.likes + post.saves + post.shares;

  let score = 0;

  // Save ratio (max 50 pts) — highest intent signal
  score += Math.min(saveLikeRatio * 50, 50);

  // Total engagement scale (max 30 pts)
  if (totalEngagement > 10000) score += 30;
  else if (totalEngagement > 5000) score += 20;
  else if (totalEngagement > 1000) score += 15;
  else if (totalEngagement > 500) score += 10;
  else score += 5;

  // Source bonus (max 20 pts)
  if (post.source === "saved") score += 20;       // user explicitly saved it
  else if (post.source === "liked") score += 12;  // user liked it
  else if (post.source === "trending") score += 8; // trending in their area

  return Math.min(Math.round(score), 100);
}

// ── Venue + Taste Extractor (Claude-powered) ─────────────────

async function extractVenuesAndTaste(
  posts: SocialPost[],
  apiKey: string
): Promise<{ venues: ExtractedVenue[]; taste: TasteSignals }> {

  const postsText = posts.map((p, i) =>
    `POST ${i + 1} [${p.platform}] @${p.creator_handle}
Location: ${p.location_tag ?? "unknown"} ${p.location_address ? `(${p.location_address})` : ""}
Caption: ${p.caption}
Hashtags: ${p.hashtags.join(" ")}
Engagement: ${p.likes} likes / ${p.saves} saves / ${p.shares} shares
Signal Score: ${calculateSignalScore(p)}/100`
  ).join("\n\n---\n\n");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-5-sonnet",
      tools: [{
        type: "function",
        function: {
          name: "return_extraction",
          description: "Return extracted venues and taste signals from social posts",
          parameters: {
            type: "object",
            required: ["venues", "taste"],
            properties: {
              venues: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "city", "vibes", "experience_type", "tiktok_signal_score", "source_posts", "source_platform"],
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    vibes: { type: "array", items: { type: "string" } },
                    price_range: { type: "string", enum: ["$", "$$", "$$$", "$$$$"] },
                    experience_type: { type: "array", items: { type: "string" } },
                    tiktok_signal_score: { type: "number" },
                    source_posts: { type: "array", items: { type: "string" } },
                    source_platform: { type: "array", items: { type: "string" } },
                  },
                },
              },
              taste: {
                type: "object",
                required: ["loves", "scene_keywords", "music_taste", "cities", "energy"],
                properties: {
                  loves: { type: "array", items: { type: "string" } },
                  scene_keywords: { type: "array", items: { type: "string" } },
                  music_taste: { type: "array", items: { type: "string" } },
                  cities: { type: "array", items: { type: "string" } },
                  energy: { type: "string", enum: ["chill", "balanced", "high_energy"] },
                  avoid: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_extraction" } },
      messages: [
        {
          role: "system",
          content: `You are a venue intelligence engine for Confetti, an AI lifestyle concierge app.

Analyze social media posts and extract:
1. VENUES — specific places mentioned (restaurants, bars, rooftops, experiences, parks, etc.)
   - Only extract clearly identifiable venues with a name
   - Assign experience_type from: ["restaurant", "bar", "rooftop", "speakeasy", "brunch", "nightclub", "outdoor", "experience", "cafe", "live-music", "day-trip"]
   - Vibes should be specific (e.g. "golden-hour-views", "date-night", "hidden-gem", "bucket-list-dc") not generic
   - tiktok_signal_score = copy from the post's Signal Score (already calculated)
   - source_posts = list the POST number(s) that mentioned this venue

2. TASTE SIGNALS — what this content reveals about the user's preferences
   - loves: specific things they're drawn to (e.g. "rooftop-cocktails", "speakeasy-vibes", "sunset-views", "hidden-gems")
   - scene_keywords: aesthetic/lifestyle tags
   - cities: cities they care about
   - energy: overall vibe of the content

Be specific and actionable. Do NOT invent venues not mentioned. If a post mentions multiple venues (like a list), extract each one.`,
        },
        {
          role: "user",
          content: `Extract venues and taste signals from these ${posts.length} social media posts:\n\n${postsText}`,
        },
      ],
    }),
  });

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call returned from Claude");

  return JSON.parse(toolCall.function.arguments);
}

// ── Platform OAuth Fetchers ──────────────────────────────────

async function fetchTikTokContent(
  accessToken: string,
  mode: string
): Promise<SocialPost[]> {
  // TikTok Research API / Login Kit
  // Endpoint: https://open.tiktokapis.com/v2/video/list/
  const fields = "id,create_time,caption,cover_image_url,like_count,comment_count,share_count,view_count";

  const url = mode === "saved"
    ? `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`
    : `https://open.tiktokapis.com/v2/video/query/?fields=${fields}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`TikTok API error: ${res.status}`);
  const data = await res.json();

  return (data.data?.videos ?? []).map((v: Record<string, unknown>) => ({
    platform: "tiktok" as const,
    post_id: String(v.id),
    url: `https://www.tiktok.com/video/${v.id}`,
    creator_handle: "me",
    caption: String(v.caption ?? ""),
    hashtags: extractHashtags(String(v.caption ?? "")),
    likes: Number(v.like_count ?? 0),
    comments: Number(v.comment_count ?? 0),
    saves: 0, // TikTok API doesn't expose saves on others' content
    shares: Number(v.share_count ?? 0),
    posted_at: String(v.create_time ?? ""),
    source: mode as "saved" | "liked" | "trending",
  }));
}

async function fetchInstagramContent(
  accessToken: string,
  mode: string
): Promise<SocialPost[]> {
  // Instagram Basic Display API / Graph API
  const fields = "id,caption,media_type,timestamp,like_count,comments_count,location";

  const endpoint = mode === "saved"
    ? `https://graph.instagram.com/me/saved?fields=${fields}&access_token=${accessToken}`
    : `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Instagram API error: ${res.status}`);
  const data = await res.json();

  return (data.data ?? []).map((p: Record<string, unknown>) => ({
    platform: "instagram" as const,
    post_id: String(p.id),
    url: `https://www.instagram.com/p/${p.id}`,
    creator_handle: "me",
    caption: String(p.caption ?? ""),
    hashtags: extractHashtags(String(p.caption ?? "")),
    location_tag: (p.location as Record<string, unknown>)?.name as string | undefined,
    likes: Number(p.like_count ?? 0),
    comments: Number(p.comments_count ?? 0),
    saves: 0,
    shares: 0,
    posted_at: String(p.timestamp ?? ""),
    source: mode as "saved" | "liked",
  }));
}

async function fetchFacebookContent(
  accessToken: string,
  mode: string
): Promise<SocialPost[]> {
  // Facebook Graph API — saved posts + check-ins + liked places
  const fields = "id,message,created_time,place,likes.summary(true),comments.summary(true)";

  const endpoint = mode === "saved"
    ? `https://graph.facebook.com/me/saved?fields=${fields}&access_token=${accessToken}`
    : `https://graph.facebook.com/me/posts?fields=${fields}&access_token=${accessToken}`;

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Facebook API error: ${res.status}`);
  const data = await res.json();

  return (data.data ?? []).map((p: Record<string, unknown>) => {
    const place = p.place as Record<string, unknown> | undefined;
    const location = place?.location as Record<string, unknown> | undefined;

    return {
      platform: "facebook" as const,
      post_id: String(p.id),
      url: `https://www.facebook.com/${p.id}`,
      creator_handle: "me",
      caption: String(p.message ?? ""),
      hashtags: extractHashtags(String(p.message ?? "")),
      location_tag: place?.name as string | undefined,
      location_address: location
        ? `${location.street ?? ""} ${location.city ?? ""} ${location.state ?? ""}`.trim()
        : undefined,
      likes: (p.likes as Record<string, unknown>)?.summary?.total_count as number ?? 0,
      comments: (p.comments as Record<string, unknown>)?.summary?.total_count as number ?? 0,
      saves: 0,
      shares: 0,
      posted_at: String(p.created_time ?? ""),
      source: mode as "saved" | "liked",
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────

function extractHashtags(text: string): string[] {
  return (text.match(/#[\w]+/g) ?? []).map(h => h.toLowerCase());
}

// ── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { user_id, platforms = {}, raw_posts, mode = "saved" } = body;

    if (!user_id) return errorResponse("user_id required", 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return errorResponse("missing OPENROUTER_API_KEY", 500);

    // ── 1. Collect posts from all platforms ──────────────────

    let allPosts: SocialPost[] = raw_posts ?? [];

    if (platforms.tiktok && !raw_posts) {
      try {
        const posts = await fetchTikTokContent(platforms.tiktok, mode);
        allPosts = [...allPosts, ...posts];
      } catch (e) {
        console.error("TikTok fetch error:", e);
      }
    }

    if (platforms.instagram && !raw_posts) {
      try {
        const posts = await fetchInstagramContent(platforms.instagram, mode);
        allPosts = [...allPosts, ...posts];
      } catch (e) {
        console.error("Instagram fetch error:", e);
      }
    }

    if (platforms.facebook && !raw_posts) {
      try {
        const posts = await fetchFacebookContent(platforms.facebook, mode);
        allPosts = [...allPosts, ...posts];
      } catch (e) {
        console.error("Facebook fetch error:", e);
      }
    }

    if (allPosts.length === 0) {
      return errorResponse("No posts found across connected platforms", 400);
    }

    // ── 2. Extract venues + taste signals via Claude ─────────

    const { venues, taste } = await extractVenuesAndTaste(allPosts, apiKey);

    // ── 3. Store venues to social_venue_signals table ────────
    // Maps to the existing schema: city_slug, venue_slug, platform, signal_type, etc.

    if (venues.length > 0) {
      const toSlug = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const signalType = (score: number): string => {
        if (score >= 80) return "trending";
        if (score >= 60) return "popular";
        if (score >= 40) return "new";
        return "lowkey";
      };

      await supabaseAdmin.from("social_venue_signals").upsert(
        venues.map(v => ({
          city_slug: toSlug(v.city),
          venue_name: v.name,
          venue_slug: toSlug(v.name),
          signal_type: signalType(v.tiktok_signal_score),
          platform: v.source_platform.length > 1 ? "multi" : (v.source_platform[0] ?? "multi"),
          post_count: v.source_posts.length,
          engagement_score: Math.round(v.tiktok_signal_score) / 100,
          sentiment: "positive",
          hashtags: [],
          snippet: v.vibes.slice(0, 3).join(" · "),
          category: v.experience_type[0] ?? "Experience",
          generation_batch: `social-sync-${new Date().toISOString().slice(0, 10)}`,
          is_active: true,
          collected_at: new Date().toISOString(),
        })),
        { onConflict: "city_slug,venue_slug,platform" }
      );
    }

    // ── 4. Store raw posts for audit / reprocessing ──────────

    if (allPosts.length > 0) {
      await supabaseAdmin.from("social_posts_raw").insert(
        allPosts.map(p => ({
          user_id,
          platform: p.platform,
          post_id: p.post_id,
          url: p.url,
          creator_handle: p.creator_handle,
          caption: p.caption,
          hashtags: p.hashtags,
          location_tag: p.location_tag,
          likes: p.likes,
          saves: p.saves,
          shares: p.shares,
          signal_score: calculateSignalScore(p),
          source: p.source,
          ingested_at: new Date().toISOString(),
        }))
      );
    }

    // ── 5. Feed taste signals into social-learn ──────────────

    const pastedContent = allPosts.map(p =>
      `@${p.creator_handle} [${p.platform}]: ${p.caption} ${p.hashtags.join(" ")}`
    ).join("\n");

    const { data: profile } = await supabaseAdmin
      .from("taste_profiles")
      .select("taste_data")
      .eq("user_id", user_id)
      .single();

    const learnRes = await supabaseAdmin.functions.invoke("social-learn", {
      body: {
        current: profile?.taste_data ?? {},
        pasted: pastedContent,
        handles: {
          tiktok: platforms.tiktok ? "connected" : undefined,
          instagram: platforms.instagram ? "connected" : undefined,
          facebook: platforms.facebook ? "connected" : undefined,
        },
      },
    });

    // ── 6. Update user taste profile ─────────────────────────

    if (learnRes.data?.profile) {
      await supabaseAdmin.from("taste_profiles").upsert({
        user_id,
        taste_data: learnRes.data.profile,
        social_signals: taste,
        last_synced_at: new Date().toISOString(),
        platforms_connected: Object.keys(platforms),
      }, { onConflict: "user_id" });
    }

    // ── 7. Trigger venue-ingest for high-signal venues ───────

    const highSignalVenues = venues.filter(v => v.tiktok_signal_score >= 60);
    for (const venue of highSignalVenues) {
      // Fire-and-forget — don't block response
      supabaseAdmin.functions.invoke("venue-intel", {
        body: { name: venue.name, address: venue.address, city: venue.city },
      }).catch(console.error);
    }

    return jsonResponse({
      success: true,
      posts_processed: allPosts.length,
      venues_discovered: venues.length,
      high_signal_venues: highSignalVenues.length,
      taste_signals_updated: !!learnRes.data?.profile,
      venues,
      taste_summary: learnRes.data?.summary,
    });

  } catch (err) {
    console.error("social-sync error:", err);
    return errorResponse(String(err), 500);
  }
});
