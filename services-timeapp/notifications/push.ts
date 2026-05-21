/**
 * Push Notification Service — Firebase Cloud Messaging (FCM)
 * Docs: https://firebase.google.com/docs/cloud-messaging
 *
 * Handles: Real-time alerts for bookings, group activity, boost reminders,
 * "your table is ready", and itinerary updates.
 *
 * Auth: Firebase Service Account key (server-side)
 * Cost: Free — unlimited notifications
 *
 * Setup: Create Firebase project → Download service account JSON
 *        Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to .env
 *
 * DEV MODE: Logs notifications to console instead of sending.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type NotificationPriority = "high" | "normal";
export type NotificationChannel =
  | "booking"       // reservation confirmations, reminders
  | "social"        // group invites, friend activity
  | "promo"         // boost deals, featured venues
  | "itinerary"     // "next stop in 15 min", live updates
  | "system";       // account, security, app updates

export interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  data?: Record<string, string>;  // deep link params, IDs, etc.
  badge?: number;
  sound?: string;
}

export interface SendToUserRequest {
  userId: string;
  notification: PushNotification;
}

export interface SendToTopicRequest {
  topic: string;             // "city-dc", "boost-deals", "new-venues"
  notification: PushNotification;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  createdAt: string;
}

// ─── Configuration ──────────────────────────────────────────────────

interface FCMConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let config: FCMConfig | null = null;

// In-memory token store (replaced by Supabase in production)
const tokenStore = new Map<string, DeviceToken[]>();

export function configure(cfg: FCMConfig) {
  config = cfg;
}

function isConfigured(): boolean {
  return !!(config?.projectId && config?.clientEmail && config?.privateKey);
}

// ─── Token Management ───────────────────────────────────────────────

/**
 * Register a device token for a user.
 * Call this on app launch and when token refreshes.
 */
export function registerToken(userId: string, token: string, platform: DeviceToken["platform"]) {
  const existing = tokenStore.get(userId) || [];
  // Avoid duplicates
  if (!existing.some((t) => t.token === token)) {
    existing.push({ userId, token, platform, createdAt: new Date().toISOString() });
    tokenStore.set(userId, existing);
  }
  console.log(`[Push] Registered ${platform} token for user ${userId}`);
}

/**
 * Remove a token (on logout or token invalidation).
 */
export function removeToken(userId: string, token: string) {
  const existing = tokenStore.get(userId) || [];
  tokenStore.set(userId, existing.filter((t) => t.token !== token));
}

/**
 * Get all tokens for a user.
 */
export function getTokens(userId: string): DeviceToken[] {
  return tokenStore.get(userId) || [];
}

// ─── Send Notifications ─────────────────────────────────────────────

/**
 * Send a push notification to a specific user (all their devices).
 */
export async function sendToUser(req: SendToUserRequest): Promise<SendResult[]> {
  const tokens = getTokens(req.userId);

  if (tokens.length === 0) {
    console.log(`[Push] No tokens for user ${req.userId} — notification dropped`);
    return [{ success: false, error: "no_tokens" }];
  }

  const results: SendResult[] = [];
  for (const device of tokens) {
    const result = await sendToDevice(device.token, req.notification);
    results.push(result);
  }
  return results;
}

/**
 * Send a push notification to a topic (e.g., all users in a city).
 */
export async function sendToTopic(req: SendToTopicRequest): Promise<SendResult> {
  if (!isConfigured()) {
    console.log(`[Push Mock] → Topic "${req.topic}": ${req.notification.title} — ${req.notification.body}`);
    return { success: true, messageId: `msg_mock_topic_${Date.now()}` };
  }

  const payload = buildFCMPayload(req.notification, { topic: `/topics/${req.topic}` });
  return await sendFCM(payload);
}

/**
 * Send to a single device token.
 */
async function sendToDevice(token: string, notification: PushNotification): Promise<SendResult> {
  if (!isConfigured()) {
    console.log(`[Push Mock] → ${token.slice(0, 12)}...: ${notification.title} — ${notification.body}`);
    return { success: true, messageId: `msg_mock_${Date.now()}` };
  }

  const payload = buildFCMPayload(notification, { token });
  return await sendFCM(payload);
}

// ─── Convenience Senders ────────────────────────────────────────────

export async function notifyBookingConfirmed(userId: string, venueName: string, time: string) {
  return sendToUser({
    userId,
    notification: {
      title: "Booking Confirmed! 🎉",
      body: `${venueName} at ${time} — you're all set.`,
      channel: "booking",
      priority: "high",
      data: { type: "booking_confirmed", venue: venueName },
    },
  });
}

export async function notifyGroupInvite(userId: string, inviterName: string, planName: string) {
  return sendToUser({
    userId,
    notification: {
      title: `${inviterName} invited you!`,
      body: `Join "${planName}" — tap to see the itinerary.`,
      channel: "social",
      priority: "high",
      data: { type: "group_invite", plan: planName },
    },
  });
}

export async function notifyNextStop(userId: string, venueName: string, minutesAway: number) {
  return sendToUser({
    userId,
    notification: {
      title: "Next stop coming up",
      body: `${venueName} is ${minutesAway} min away. Ready to roll?`,
      channel: "itinerary",
      priority: "normal",
      data: { type: "next_stop", venue: venueName },
    },
  });
}

export async function notifyBoostDeal(topic: string, venueName: string, deal: string) {
  return sendToTopic({
    topic,
    notification: {
      title: `🔥 Boost Deal: ${venueName}`,
      body: deal,
      channel: "promo",
      priority: "normal",
      data: { type: "boost_deal", venue: venueName },
    },
  });
}

// ─── FCM HTTP v1 API ────────────────────────────────────────────────

function buildFCMPayload(
  notification: PushNotification,
  target: { token?: string; topic?: string }
) {
  const message: any = {
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { image: notification.imageUrl }),
    },
    data: notification.data || {},
    ...(target.token && { token: target.token }),
    ...(target.topic && { topic: target.topic }),
  };

  // Android-specific
  message.android = {
    priority: notification.priority || "normal",
    notification: {
      channel_id: notification.channel,
      sound: notification.sound || "default",
      click_action: "OPEN_CONFETTI",
    },
  };

  // iOS-specific (APNs)
  message.apns = {
    payload: {
      aps: {
        alert: { title: notification.title, body: notification.body },
        badge: notification.badge,
        sound: notification.sound || "default",
        "mutable-content": 1,
        "thread-id": notification.channel,
      },
    },
  };

  return { message };
}

async function sendFCM(payload: any): Promise<SendResult> {
  try {
    // Get OAuth2 access token from service account
    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${config!.projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || `FCM ${res.status}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.name };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get OAuth2 access token from service account credentials.
 * In production, use google-auth-library. This is a simplified version.
 */
async function getAccessToken(): Promise<string> {
  // Placeholder — in production, implement JWT signing with the private key
  // or use: import { GoogleAuth } from 'google-auth-library';
  // const auth = new GoogleAuth({ credentials: { client_email, private_key }, scopes: [...] });
  // const client = await auth.getClient();
  // const token = await client.getAccessToken();
  throw new Error(
    "FCM access token generation requires google-auth-library. " +
    "Install it with: npm install google-auth-library"
  );
}
