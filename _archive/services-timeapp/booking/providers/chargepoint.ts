/**
 * ChargePoint API Integration
 * Docs: https://developer.chargepoint.com
 *
 * Handles: station search, availability, session start/status
 * Auth: API key (developer program)
 */

import type { ChargingStation, ChargingSession } from "../types";

const CP_BASE = "https://api.chargepoint.com/v1";

interface ChargePointConfig {
  apiKey: string;
}

let config: ChargePointConfig | null = null;

export function configure(cfg: ChargePointConfig) {
  config = cfg;
}

function headers() {
  if (!config) throw new Error("ChargePoint not configured.");
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
}

// ─── Search Stations ─────────────────────────────────────────────────
export async function searchStations(
  location: { lat: number; lng: number },
  radiusMeters: number = 2000,
  connectorType?: string
): Promise<ChargingStation[]> {
  const params = new URLSearchParams({
    lat: location.lat.toString(),
    lng: location.lng.toString(),
    radius: radiusMeters.toString(),
    status: "available",
  });
  if (connectorType) params.set("connector_type", connectorType);

  const res = await fetch(`${CP_BASE}/stations?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();

  return data.stations.map((s: any) => ({
    stationId: s.station_id,
    name: s.station_name,
    address: s.address.street,
    connectorTypes: s.connectors.map((c: any) => c.type),
    available: s.available_ports > 0,
    pricing: s.pricing_description || "See app for pricing",
    network: "chargepoint" as const,
  }));
}

// ─── Station Detail ──────────────────────────────────────────────────
export async function getStation(stationId: string): Promise<ChargingStation | null> {
  const res = await fetch(`${CP_BASE}/stations/${stationId}`, { headers: headers() });
  if (!res.ok) return null;
  const s = await res.json();

  return {
    stationId: s.station_id,
    name: s.station_name,
    address: s.address.street,
    connectorTypes: s.connectors.map((c: any) => c.type),
    available: s.available_ports > 0,
    pricing: s.pricing_description,
    network: "chargepoint",
  };
}

// ─── Start Charging Session ──────────────────────────────────────────
export async function startSession(
  stationId: string,
  portNumber: number = 1
): Promise<ChargingSession | null> {
  const res = await fetch(`${CP_BASE}/sessions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      station_id: stationId,
      port_number: portNumber,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  return {
    sessionId: data.session_id,
    stationId,
    status: "charging",
    startTime: new Date().toISOString(),
    estimatedEndTime: data.estimated_completion,
  };
}

// ─── Check Session Status ────────────────────────────────────────────
export async function getSessionStatus(sessionId: string): Promise<ChargingSession | null> {
  const res = await fetch(`${CP_BASE}/sessions/${sessionId}`, { headers: headers() });
  if (!res.ok) return null;
  const data = await res.json();

  return {
    sessionId: data.session_id,
    stationId: data.station_id,
    status: data.status === "COMPLETE" ? "complete" : "charging",
    kwhDelivered: data.kwh_delivered,
    cost: data.total_cost,
    startTime: data.start_time,
    estimatedEndTime: data.estimated_completion,
  };
}

// ─── Stop Session ────────────────────────────────────────────────────
export async function stopSession(sessionId: string): Promise<boolean> {
  const res = await fetch(`${CP_BASE}/sessions/${sessionId}/stop`, {
    method: "POST",
    headers: headers(),
  });
  return res.ok;
}
