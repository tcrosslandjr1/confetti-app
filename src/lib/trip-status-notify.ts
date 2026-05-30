/**
 * trip-status-notify.ts
 * Bridge between the local trip-status system and DB-backed group notifications.
 * When a host sets late/reschedule/cancel, this inserts a trip_status_events row
 * which triggers the DB fan-out to all group members via the notification trigger.
 */

import { supabase } from "@/integrations/supabase/client";

type TripStatusKind = "late" | "reschedule" | "cancel" | "update";

interface TripStatusPayload {
  minutes_late?: number;
  new_time?: string;
  note?: string;
  venue?: string;
}

/**
 * Publish a trip status change to the group.
 * This creates a trip_status_events row; the DB trigger handles fan-out.
 */
export async function publishTripStatusToGroup(opts: {
  planId: string;
  groupId: string;
  kind: TripStatusKind;
  payload?: TripStatusPayload;
}): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("trip_status_events").insert({
    plan_id: opts.planId,
    group_id: opts.groupId,
    actor_id: user.id,
    kind: opts.kind,
    payload: (opts.payload ?? {}) as Record<string, unknown> as never,
  });

  if (error) {
    console.error("Failed to publish trip status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Subscribe to trip status events for a specific group plan via Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeTripStatusEvents(
  groupId: string,
  callback: (event: {
    kind: TripStatusKind;
    payload: TripStatusPayload;
    actorId: string;
    createdAt: string;
  }) => void,
): () => void {
  const channel = supabase
    .channel(`trip-status:${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "trip_status_events",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const row = payload.new as {
          kind: TripStatusKind;
          payload: TripStatusPayload;
          actor_id: string;
          created_at: string;
        };
        callback({
          kind: row.kind,
          payload: row.payload,
          actorId: row.actor_id,
          createdAt: row.created_at,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
