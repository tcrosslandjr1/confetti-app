import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generatePlan } from "./generate-plan.functions";
import { generateAndRankNames } from "./name-generator.functions";
import { planTripDays, type EnergyCurve, type TripInput } from "./agents/trip-engine";

const TripRequestSchema = z.object({
  destinationCity: z.string().min(1).max(80),
  tripLengthDays: z.number().int().min(1).max(14),
  groupSize: z.number().int().min(1).max(50).default(2),
  groupType: z.string().max(40).optional(),
  budgetTotal: z.number().min(0).max(100000).optional(),
  energyCurve: z
    .enum([
      "chill-turnup-chill",
      "steady-chill",
      "steady-turnup",
      "soft-life",
      "family-safe",
      "bachelor",
      "bachelorette",
      "adventure-heavy",
      "food-and-culture",
    ])
    .default("steady-chill"),
  mustDoCategories: z.array(z.string().max(40)).max(10).optional(),
  avoidCategories: z.array(z.string().max(40)).max(10).optional(),
  homeBaseArea: z.string().max(60).optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
});

export const generateTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TripRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const input: TripInput = {
      destinationCity: data.destinationCity,
      tripLengthDays: data.tripLengthDays,
      groupSize: data.groupSize,
      groupType: data.groupType,
      budgetTotal: data.budgetTotal,
      budgetPerDay: data.budgetTotal ? data.budgetTotal / data.tripLengthDays : undefined,
      energyCurve: data.energyCurve as EnergyCurve,
      mustDoCategories: data.mustDoCategories,
      avoidCategories: data.avoidCategories,
      homeBaseArea: data.homeBaseArea,
      arrivalTime: data.arrivalTime,
      departureTime: data.departureTime,
    };

    const seeds = planTripDays(input);

    // Generate a plan per day, dedup across days.
    const usedVenues = new Set<string>();
    const days: Array<{
      day_index: number;
      day_theme: string;
      day_name: string;
      itinerary: Record<string, unknown>;
      estimated_cost: number | null;
    }> = [];

    for (const seed of seeds) {
      const plan = await generatePlan({
        data: {
          city: input.destinationCity,
          occasionId: seed.occasionId,
          vibeLabel: seed.vibe,
          groupSize: input.groupSize,
          timeOfDay: seed.timeOfDay as never,
          duration: "4 hr",
        },
      });
      // Filter venues already used.
      plan.stops = plan.stops.filter((s) => !s.venueId || !usedVenues.has(s.venueId));
      plan.stops.forEach((s) => s.venueId && usedVenues.add(s.venueId));
      days.push({
        day_index: seed.dayIndex,
        day_theme: seed.dayTheme,
        day_name: plan.experienceName,
        itinerary: plan as unknown as Record<string, unknown>,
        estimated_cost: null,
      });
    }

    // Trip-level name.
    let tripName = `${input.destinationCity} ${input.tripLengthDays}-Day`;
    let nameOptions: { name: string; score: number }[] = [];
    try {
      const { ranked } = await generateAndRankNames({
        city: input.destinationCity,
        category: "trip",
        vibe: input.energyCurve,
        audience: input.groupType ?? "group",
        count: 8,
      });
      nameOptions = ranked.slice(0, 5);
      if (nameOptions[0]) tripName = nameOptions[0].name;
    } catch {
      /* fall back */
    }

    // Persist
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        destination_city: input.destinationCity,
        trip_name: tripName,
        trip_name_options: nameOptions,
        trip_length_days: input.tripLengthDays,
        group_size: input.groupSize,
        group_type: input.groupType,
        energy_curve: input.energyCurve,
        budget_total: input.budgetTotal,
        budget_per_day: input.budgetPerDay,
        arrival_time: input.arrivalTime,
        departure_time: input.departureTime,
        home_base_area: input.homeBaseArea,
        must_do_categories: input.mustDoCategories ?? [],
        avoid_categories: input.avoidCategories ?? [],
        status: "ready",
      })
      .select("id")
      .single();
    if (error || !trip) throw new Error(error?.message ?? "Failed to save trip");

    await supabase.from("trip_days").insert(days.map((d) => ({ trip_id: trip.id, ...d })) as never);

    return { tripId: trip.id, tripName, nameOptions, dayCount: days.length };
  });

export const listMyTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("trips")
      .select("id, trip_name, destination_city, trip_length_days, energy_curve, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { trips: data ?? [] };
  });

export const getTrip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ tripId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!trip) return { trip: null, days: [] };
    const { data: days } = await supabase
      .from("trip_days")
      .select("*")
      .eq("trip_id", data.tripId)
      .order("day_index", { ascending: true });
    return { trip, days: days ?? [] };
  });

export const renameTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ tripId: z.string().uuid(), name: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("trips")
      .update({ trip_name: data.name })
      .eq("id", data.tripId)
      .eq("user_id", userId);
    return { ok: true };
  });
