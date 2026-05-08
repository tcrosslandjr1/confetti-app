import { supabase } from "@/integrations/supabase/client";

export type TasteProfile = {
  age_range?: string;
  life_stage?: string;
  energy?: "chill" | "balanced" | "high_energy";
  music_taste?: string[];
  scene_keywords?: string[];
  loves?: string[];
  avoid?: string[];
  cities?: string[];
};

export type SocialHandles = {
  instagram?: string;
  tiktok?: string;
  pinterest?: string;
  youtube?: string;
  spotify?: string;
  x?: string;
};

export type Prefs = {
  taste_profile: TasteProfile;
  about_me: string;
  cuisines: string[];
  activities: string[];
  budget_min: number;
  budget_max: number;
  social_handles: SocialHandles;
  social_signals: string;
};

export async function loadPrefs(): Promise<Prefs> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return empty();
  const { data } = await supabase
    .from("user_preferences")
    .select("taste_profile, about_me, cuisines, activities, budget_min, budget_max, social_handles, social_signals")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (!data) return empty();
  return {
    taste_profile: (data.taste_profile as TasteProfile) ?? {},
    about_me: data.about_me ?? "",
    cuisines: data.cuisines ?? [],
    activities: data.activities ?? [],
    budget_min: data.budget_min ?? 0,
    budget_max: data.budget_max ?? 100,
    social_handles: ((data as { social_handles?: SocialHandles }).social_handles) ?? {},
    social_signals: (data as { social_signals?: string }).social_signals ?? "",
  };
}

function empty(): Prefs {
  return { taste_profile: {}, about_me: "", cuisines: [], activities: [], budget_min: 0, budget_max: 100, social_handles: {}, social_signals: "" };
}

export async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: u.user.id, taste_profile: profile }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function saveAboutMe(about_me: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: u.user.id, about_me }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function saveSocialHandles(handles: SocialHandles): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: u.user.id, social_handles: handles }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

export async function saveSocialSignals(social_signals: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: u.user.id, social_signals }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

/** Compact one-paragraph profile to inject into AI prompts. */
export function tasteSummary(p: Prefs): string {
  const t = p.taste_profile ?? {};
  const parts: string[] = [];
  if (t.age_range) parts.push(`age ${t.age_range}`);
  if (t.life_stage) parts.push(t.life_stage);
  if (t.energy) parts.push(`${t.energy.replace("_", " ")} energy`);
  if (t.cities?.length) parts.push(`cities: ${t.cities.join(", ")}`);
  if (t.music_taste?.length) parts.push(`music: ${t.music_taste.join(", ")}`);
  if (t.scene_keywords?.length) parts.push(`scenes: ${t.scene_keywords.join(", ")}`);
  if (t.loves?.length) parts.push(`loves: ${t.loves.join(", ")}`);
  if (t.avoid?.length) parts.push(`avoid: ${t.avoid.join(", ")}`);
  if (p.cuisines.length) parts.push(`cuisines: ${p.cuisines.join(", ")}`);
  if (p.activities.length) parts.push(`favorite activities: ${p.activities.join(", ")}`);
  if (p.budget_min || p.budget_max) parts.push(`budget $${p.budget_min}-${p.budget_max}`);
  if (p.about_me) parts.push(`about: "${p.about_me.slice(0, 280)}"`);
  const handles = Object.entries(p.social_handles ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}:@${v}`);
  if (handles.length) parts.push(`socials: ${handles.join(", ")}`);
  if (p.social_signals) parts.push(`social signals: "${p.social_signals.slice(0, 280)}"`);
  return parts.length ? parts.join(" · ") : "";
}
