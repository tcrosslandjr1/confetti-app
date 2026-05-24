import { supabase } from "@/integrations/supabase/client";
import type { ActiveHangout } from "./hangout-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type ClaimCategory = "menu" | "drinks" | "supplies" | "grocery" | "games";

export interface HangoutClaim {
  item_category: ClaimCategory;
  item_key: string;
  item_label?: string | null;
  claimed_by_name: string;
  claimed_by_token: string;
  note?: string | null;
  claimed_at: string;
}

export interface SharedHangoutFetch {
  hangout: {
    id: string;
    token: string;
    occasion: string | null;
    occasion_key: string | null;
    city: string | null;
    start_time: string | null;
    date: string | null;
    mode: string | null;
    plan: ActiveHangout["plan"];
    host_name: string | null;
    generated_at: string;
    created_at: string;
    expires_at: string | null;
  };
  claims: HangoutClaim[];
}

const FUNCTION = "hangout-collab";

async function invoke<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  const res = await fetch(`${url}/functions/v1/${FUNCTION}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${FUNCTION} ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Stable per-device token so the same browser can unclaim its own items later. */
export function getClaimerToken(): string {
  if (typeof localStorage === "undefined") return "anon";
  let t = localStorage.getItem("confetti.claimer.token");
  if (!t) {
    t = `c-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("confetti.claimer.token", t);
  }
  return t;
}

/** The display name this browser uses when claiming. */
export function getClaimerName(fallback = "Friend"): string {
  if (typeof localStorage === "undefined") return fallback;
  return localStorage.getItem("confetti.claimer.name") || fallback;
}

export function setClaimerName(name: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("confetti.claimer.name", name.trim().slice(0, 40));
}

export async function createSharedHangout(
  hangout: ActiveHangout,
  hostName?: string,
): Promise<{ token: string; id: string }> {
  return invoke("create_shared", {
    hostName,
    hangout: {
      occasion: hangout.occasion,
      occasionKey: hangout.occasionKey,
      city: hangout.city,
      startTime: hangout.startTime,
      date: hangout.date,
      mode: hangout.mode,
      plan: hangout.plan,
      generatedAt: hangout.generatedAt,
    },
  });
}

export async function getSharedHangout(token: string): Promise<SharedHangoutFetch> {
  return invoke("get_by_token", { token });
}

export async function claimItem(opts: {
  token: string;
  category: ClaimCategory;
  itemKey: string;
  itemLabel?: string;
  name: string;
  note?: string;
}): Promise<void> {
  await invoke("claim", {
    token: opts.token,
    item_category: opts.category,
    item_key: opts.itemKey,
    item_label: opts.itemLabel,
    claimed_by_name: opts.name,
    claimed_by_token: getClaimerToken(),
    note: opts.note,
  });
}

export async function unclaimItem(opts: {
  token: string;
  category: ClaimCategory;
  itemKey: string;
}): Promise<void> {
  await invoke("unclaim", {
    token: opts.token,
    item_category: opts.category,
    item_key: opts.itemKey,
    claimed_by_token: getClaimerToken(),
  });
}

/**
 * Subscribe to live claim changes for a hangout. Returns an unsubscribe
 * function. The callback fires whenever a claim is inserted, updated,
 * or deleted on that hangout id.
 */
export function subscribeClaims(
  hangoutId: string,
  cb: () => void,
): () => void {
  const channel = sb
    .channel(`hangout_claims_${hangoutId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "hangout_claims", filter: `hangout_id=eq.${hangoutId}` },
      () => cb(),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
