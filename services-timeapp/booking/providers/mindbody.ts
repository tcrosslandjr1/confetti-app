/**
 * Mindbody API Integration
 * Docs: https://developers.mindbodyonline.com
 *
 * Handles: spa, salon, fitness, wellness appointment booking
 * Auth: API key + staff/user token
 * Use for: wellness/spa stops in Confetti itineraries
 */

import type {
  BookingRequest,
  BookingConfirmation,
  BookingError,
  AvailabilitySlot,
  VenueSearchResult,
} from "../types";

const MB_BASE = "https://api.mindbodyonline.com/public/v6";

interface MindbodyConfig {
  apiKey: string;
  siteId: string; // default site for search
}

let config: MindbodyConfig | null = null;

export function configure(cfg: MindbodyConfig) {
  config = cfg;
}

function headers(siteId?: string) {
  if (!config) throw new Error("Mindbody not configured.");
  return {
    "Api-Key": config.apiKey,
    SiteId: siteId || config.siteId,
    "Content-Type": "application/json",
  };
}

// ─── Search Services ─────────────────────────────────────────────────
export async function searchServices(
  siteId: string,
  category?: string
): Promise<VenueSearchResult[]> {
  const params = new URLSearchParams();
  if (category) params.set("ProgramIDs", category);
  params.set("Limit", "20");

  const res = await fetch(`${MB_BASE}/appointment/bookableitems?${params}`, {
    headers: headers(siteId),
  });
  if (!res.ok) return [];
  const data = await res.json();

  return (data.Appointments || []).map((s: any) => ({
    provider: "mindbody" as const,
    venueId: `${siteId}:${s.Id}`,
    name: s.Name,
    neighborhood: s.Location?.Name || "",
    bookable: true,
  }));
}

// ─── Availability ────────────────────────────────────────────────────
export async function checkAvailability(
  siteId: string,
  sessionTypeId: string,
  date: string
): Promise<AvailabilitySlot[]> {
  const res = await fetch(
    `${MB_BASE}/appointment/availabledates?sessionTypeId=${sessionTypeId}&startDate=${date}&endDate=${date}`,
    { headers: headers(siteId) }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.AvailableDates || []).map((d: any) => ({
    time: d,
    partySize: 1,
    type: "appointment",
    available: true,
  }));
}

// ─── Book Appointment ────────────────────────────────────────────────
export async function createAppointment(
  req: BookingRequest,
  siteId: string,
  staffId?: string
): Promise<BookingConfirmation | BookingError> {
  const res = await fetch(`${MB_BASE}/appointment/addappointment`, {
    method: "POST",
    headers: headers(siteId),
    body: JSON.stringify({
      SessionTypeId: req.venueId.split(":")[1],
      StartDateTime: `${req.date}T${req.time}:00`,
      StaffId: staffId,
      ClientId: req.userId,
      Notes: req.notes || "Booked via Confetti",
    }),
  });

  if (!res.ok) {
    return {
      provider: "mindbody",
      code: "NO_AVAILABILITY",
      message: "Appointment slot not available",
      retryable: false,
    };
  }

  const data = await res.json();
  const appt = data.Appointment;

  return {
    provider: "mindbody",
    confirmationId: appt.Id.toString(),
    venueName: appt.Location?.Name || "Wellness Appointment",
    date: req.date,
    time: req.time,
    partySize: 1,
    status: "booked",
    deepLink: undefined, // Mindbody doesn't provide deep links
    cancellationPolicy: "Cancel 24h in advance",
    createdAt: new Date().toISOString(),
  };
}

// ─── Cancel ──────────────────────────────────────────────────────────
export async function cancelAppointment(
  siteId: string,
  appointmentId: string
): Promise<boolean> {
  const res = await fetch(`${MB_BASE}/appointment/removeappointment`, {
    method: "POST",
    headers: headers(siteId),
    body: JSON.stringify({ AppointmentId: appointmentId }),
  });
  return res.ok;
}
