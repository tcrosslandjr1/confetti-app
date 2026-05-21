export interface RouteStopInput {
  name: string;
  time: string;
  area: string;
  address?: string;
  parking?: string;
  pickup?: string;
  valet?: {
    available: boolean;
    detail: string;
  };
}

export type LiveTrafficSeverity = "clear" | "moderate" | "heavy";

export interface LiveTrafficAlert {
  id: string;
  severity: LiveTrafficSeverity;
  route: string;
  fromStop: string;
  toStop: string;
  title: string;
  detail: string;
  currentEta: string;
  normalEta: string;
  currentEtaMinutes: number;
  normalEtaMinutes: number;
  delayMinutes: number;
  leaveBy: string;
  recommendation: string;
  updated: string;
}

export interface LiveVenueDetail {
  stopName: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  parking?: string;
  valet?: {
    available: boolean;
    detail: string;
  };
  entrance?: string;
  businessNotes?: string;
  source?: string;
}

export interface RouteIntelligenceResponse {
  provider: string;
  updatedAt: string;
  sectors?: unknown[];
  agentContext?: {
    sectorCount: number;
    instruction: string;
  };
  alerts: LiveTrafficAlert[];
  venues: LiveVenueDetail[];
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isRouteIntelligenceConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function fetchRouteIntelligence(stops: RouteStopInput[]) {
  if (!isRouteIntelligenceConfigured()) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/route-intelligence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ stops })
  });

  if (!response.ok) {
    throw new Error(`Route intelligence failed: ${response.status}`);
  }

  return response.json() as Promise<RouteIntelligenceResponse>;
}
