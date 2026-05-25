/**
 * useRealtimeTable
 * Generic Supabase Realtime subscription that fires `onChange` on INSERT/UPDATE/DELETE.
 * RLS still applies: the client only receives rows it is allowed to SELECT.
 *
 * Usage:
 *   useRealtimeTable({
 *     table: "bookings",
 *     filter: `user_id=eq.${userId}`,
 *     onChange: () => refetch(),
 *   });
 */
import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Options {
  table: string;
  filter?: string;
  event?: ChangeEvent;
  enabled?: boolean;
  schema?: string;
  channelKey?: string;
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

export function useRealtimeTable({
  table,
  filter,
  event = "*",
  enabled = true,
  schema = "public",
  channelKey,
  onChange,
}: Options) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    const key = channelKey ?? `${table}:${filter ?? "all"}:${event}`;
    const channel = supabase
      .channel(key)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event, schema, table, ...(filter ? { filter } : {}) },
        (payload) => cbRef.current(payload),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, enabled, schema, channelKey]);
}
