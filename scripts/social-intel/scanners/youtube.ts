// ============================================================
// Scanner: YouTube — Food Vlogger Reviews & City Guides
// ============================================================
// YouTube food vloggers (Mark Wiens, Strictly Dumpling, etc.)
// drive huge traffic to venues. A video hitting 100K+ views
// is a strong trending signal.
//
// Uses YouTube Data API v3 (10,000 quota units/day free)
// Search costs 100 units, so budget ~100 searches/day
// ============================================================

import { YOUTUBE_API_KEY } from '../config';
import type { PlatformResult } from '../types';

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const YT_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

/**
 * Scan YouTube for venue mentions in food/nightlife videos
 */
export async function scanYouTube(city: string): Promise<PlatformResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured — skipping');
    return [];
  }

  const results: PlatformResult[] = [];
  const queries = [
    `best restaurants ${city} 2026`,
    `new restaurant ${city}`,
    `food tour ${city}`,
    `best bars ${city}`,
    `where to eat ${city}`,
    `hidden gems ${city} food`
  ];

  for (const query of queries) {
    try {
      const videos = await searchVideos(query);

      for (const video of videos) {
        // Extract venue names from video title
        const venueNames = extractVenueNamesFromTitle(video.title, city);

        // Get video stats
        const stats = await getVideoStats(video.videoId);
        const channelInfo = await getChannelInfo(video.channelId);

        for (const venueName of venueNames) {
          results.push({
            venue_name: venueName,
            city,
            platform: 'youtube',
            post_url: `https://youtube.com/watch?v=${video.videoId}`,
            post_id: video.videoId,
            creator_handle: video.channelTitle,
            creator_followers: channelInfo?.subscriberCount || 0,
            engagement_likes: stats?.likeCount || 0,
            engagement_comments: stats?.commentCount || 0,
            engagement_shares: 0,
            snippet: video.title.slice(0, 200)
          });
        }
      }
    } catch (err) {
      console.warn(`YouTube scan failed for "${query}":`, err);
    }

    // Conserve quota
    await sleep(500);
  }

  return deduplicateResults(results);
}

// ---- Internal helpers ----

interface YouTubeSearchResult {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  publishedAt: string;
}

async function searchVideos(query: string): Promise<YouTubeSearchResult[]> {
  // Only get videos from last 30 days
  const publishedAfter = new Date(Date.now() - 30 * 86400000).toISOString();

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '10',
    order: 'viewCount',
    publishedAfter,
    relevanceLanguage: 'en',
    key: YOUTUBE_API_KEY
  });

  const res = await fetch(`${YT_SEARCH_URL}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt
  }));
}

async function getVideoStats(videoId: string): Promise<{ viewCount: number; likeCount: number; commentCount: number } | null> {
  const params = new URLSearchParams({
    part: 'statistics',
    id: videoId,
    key: YOUTUBE_API_KEY
  });

  const res = await fetch(`${YT_VIDEOS_URL}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const stats = data.items?.[0]?.statistics;
  if (!stats) return null;

  return {
    viewCount: parseInt(stats.viewCount || '0'),
    likeCount: parseInt(stats.likeCount || '0'),
    commentCount: parseInt(stats.commentCount || '0')
  };
}

async function getChannelInfo(channelId: string): Promise<{ subscriberCount: number } | null> {
  const params = new URLSearchParams({
    part: 'statistics',
    id: channelId,
    key: YOUTUBE_API_KEY
  });

  const res = await fetch(`${YT_CHANNELS_URL}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const stats = data.items?.[0]?.statistics;
  return stats ? { subscriberCount: parseInt(stats.subscriberCount || '0') } : null;
}

function extractVenueNamesFromTitle(title: string, city: string): string[] {
  const names: string[] = [];

  // Pattern: "VenueName - Best Restaurant in City"
  const dashSplit = title.split(/\s*[-|—]\s*/);
  if (dashSplit.length >= 2) {
    const candidate = dashSplit[0].trim();
    if (candidate.length >= 3 && candidate.length <= 40 && !isGenericTitle(candidate)) {
      names.push(candidate);
    }
  }

  // Pattern: "Top 5 Restaurants" — skip these, they're listicles
  if (/top\s+\d+/i.test(title)) return names;

  // Pattern: "at VenueName" or "trying VenueName"
  const atMatch = title.match(/(?:at|trying|visiting|reviewing)\s+([A-Z][A-Za-z'\-&\s]{2,30})/i);
  if (atMatch) {
    const name = atMatch[1].trim();
    if (!isGenericTitle(name)) names.push(name);
  }

  return [...new Set(names)];
}

function isGenericTitle(s: string): boolean {
  const generic = /^(the best|top \d|my favorite|best|worst|trying|eating|food|review|tour|guide|vlog)/i;
  return generic.test(s);
}

function deduplicateResults(results: PlatformResult[]): PlatformResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.post_id}:${r.venue_name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
