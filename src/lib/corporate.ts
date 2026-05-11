import { supabase } from "@/integrations/supabase/client";

export type CorporatePurpose = "team-outing" | "offsite" | "client-dinner" | "conference";
export type CorporateStatus = "draft" | "proposed" | "confirmed" | "completed" | "cancelled";
export type RsvpStatus = "invited" | "yes" | "no" | "maybe";

export type CorporateEvent = {
  id: string;
  owner_id: string;
  org_name: string;
  title: string;
  purpose: CorporatePurpose;
  starts_at: string;
  ends_at: string | null;
  headcount: number;
  budget_per_person_cents: number;
  status: CorporateStatus;
  itinerary_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CorporateAttendee = {
  id: string;
  event_id: string;
  email: string;
  name: string | null;
  role: string;
  dietary: string | null;
  rsvp_status: RsvpStatus;
  rsvp_token: string;
  responded_at: string | null;
};

export const PURPOSE_LABELS: Record<CorporatePurpose, string> = {
  "team-outing": "Team night out",
  offsite: "Offsite / retreat",
  "client-dinner": "Client dinner",
  conference: "Conference / summit",
};

export function parseAttendeeList(raw: string): { email: string; name?: string }[] {
  const out: { email: string; name?: string }[] = [];
  const seen = new Set<string>();
  const lines = raw.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // formats: "email", "name <email>", "name,email"
    const m = line.match(/^(?:(.*?)\s*<\s*)?([^\s<>]+@[^\s<>]+\.[^\s<>]+)\s*>?\s*$/);
    if (!m) continue;
    const email = m[2].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: m[1]?.trim() || undefined });
  }
  return out;
}

export async function createCorporateEvent(input: {
  org_name: string;
  title: string;
  purpose: CorporatePurpose;
  starts_at: string;
  ends_at: string | null;
  headcount: number;
  budget_per_person_cents: number;
  notes?: string;
  attendees: { email: string; name?: string }[];
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) throw new Error("Sign in to create a team event");

  const { data: ev, error } = await supabase
    .from("corporate_events")
    .insert({
      owner_id: userId,
      org_name: input.org_name,
      title: input.title,
      purpose: input.purpose,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      headcount: input.headcount,
      budget_per_person_cents: input.budget_per_person_cents,
      notes: input.notes ?? null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error || !ev) throw error ?? new Error("Failed to create event");

  if (input.attendees.length) {
    const rows = input.attendees.map((a) => ({
      event_id: ev.id,
      email: a.email,
      name: a.name ?? null,
      role: "attendee",
    }));
    await supabase.from("corporate_attendees").insert(rows);
  }
  return ev as CorporateEvent;
}

export function dayCount(starts: string, ends: string | null) {
  const s = new Date(starts);
  const e = ends ? new Date(ends) : s;
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}
