/**
 * Group ride sync — ephemeral Supabase Realtime broadcast.
 * No DB writes; peers receive each other's ride status while subscribed.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RidePing = {
  service: "uber" | "lyft" | "ev" | "walk";
  link: string;
  eta: string;
  destination: string;
  sender: string;
  ts?: number;
};

export function useRideSync(tripId?: string) {
  const [peers, setPeers] = useState<RidePing[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!tripId) return;
    const ch = supabase.channel(`ride-sync:${tripId}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "ride" }, ({ payload }) => {
      const ping = payload as RidePing;
      setPeers((prev) => {
        // dedupe by sender, keep latest
        const filtered = prev.filter((p) => p.sender !== ping.sender);
        return [{ ...ping, ts: Date.now() }, ...filtered].slice(0, 10);
      });
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [tripId]);

  const send = async (ping: RidePing) => {
    const ch = channelRef.current;
    if (!ch) return;
    await ch.send({
      type: "broadcast",
      event: "ride",
      payload: { ...ping, ts: Date.now() },
    });
  };

  return { peers, send };
}
