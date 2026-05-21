/**
 * Confetti Services — Master Barrel Export
 *
 * All backend services in one import:
 *   import { weather, rideshare, navigation, analytics, ... } from "@/services";
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Service        │ Signup?  │ Free Tier            │ Dev Fallback │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Weather        │ No       │ Unlimited (Open-Meteo) │ —          │
 * │ Navigation     │ No       │ Deep links (free)      │ —          │
 * │ Rideshare      │ No       │ Deep links (free)      │ —          │
 * │ Analytics      │ No*      │ Uses your Supabase     │ Console    │
 * │ Payments       │ Yes      │ Free until charges     │ Mock mode  │
 * │ Nightlife      │ Yes      │ 5K calls/day           │ Mock mode  │
 * │ Events         │ Yes      │ 5K calls/day           │ Mock mode  │
 * │ Push Notif.    │ Yes      │ Unlimited (Firebase)   │ Console    │
 * │ SMS            │ Yes      │ Pay-per-use            │ Console    │
 * │ Email          │ Yes      │ 100/day (SendGrid)     │ Console    │
 * │ Wallet Passes  │ Yes      │ Free (both platforms)  │ JSON only  │
 * └─────────────────────────────────────────────────────────────────┘
 *   * Analytics reuses your existing Supabase project — no new signup.
 */

export * as weather from "./weather";
export * as rideshare from "./rideshare";
export * as navigation from "./navigation";
export * as analytics from "./analytics";
export * as payments from "./payments";
export * as nightlife from "./nightlife";
export * as events from "./events";
export * as notifications from "./notifications";
export * as wallet from "./wallet";
