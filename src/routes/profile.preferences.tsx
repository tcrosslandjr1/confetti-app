import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
  resetMyProfile,
  relearnMyProfile,
} from "@/lib/personalization.functions";
import type { PersonalizationProfile } from "@/lib/agents/personalization";

export const Route = createFileRoute("/profile/preferences")({
  component: PrefsPage,
  head: () => ({
    meta: [
      { title: "Your Confetti preferences" },
      { name: "description", content: "Edit how Confetti personalizes your itineraries." },
    ],
  }),
});

function PrefsPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const resetProfile = useServerFn(resetMyProfile);
  const relearn = useServerFn(relearnMyProfile);
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then((r) => setProfile(r.profile));
  }, [fetchProfile]);

  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const save = async (patch: Partial<PersonalizationProfile>) => {
    setSaving(true);
    try {
      await updateProfile({ data: patch as never });
      setProfile({ ...profile, ...patch });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Your preferences</h1>
      <p className="mt-2 text-muted-foreground">
        Confetti learns your taste over time. Edit or reset anything you like.
      </p>

      <section className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6">
        <Field label="Comfort level">
          <Select
            value={profile.comfort_level}
            options={["low", "medium", "high"]}
            onChange={(v) => save({ comfort_level: v as PersonalizationProfile["comfort_level"] })}
          />
        </Field>
        <Field label="Nightlife intensity">
          <Select
            value={profile.nightlife_intensity}
            options={["low", "medium", "high"]}
            onChange={(v) => save({ nightlife_intensity: v as PersonalizationProfile["nightlife_intensity"] })}
          />
        </Field>
        <Field label="Promo sensitivity">
          <Select
            value={profile.promo_sensitivity}
            options={["low", "medium", "high"]}
            onChange={(v) => save({ promo_sensitivity: v as PersonalizationProfile["promo_sensitivity"] })}
          />
        </Field>
        <Field label="Preferred budget tier">
          <Select
            value={String(profile.preferred_price_tier ?? "")}
            options={["", "1", "2", "3", "4"]}
            onChange={(v) =>
              save({ preferred_price_tier: v ? (Number(v) as 1 | 2 | 3 | 4) : null })
            }
          />
        </Field>
        <Field label="Adult-only options">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.adult_opt_in}
              onChange={(e) => save({ adult_opt_in: e.target.checked })}
            />
            Allow 21+ venues (strip, casino, etc.)
          </label>
        </Field>

        <div className="border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">Learned signals</div>
          <div className="mt-1 text-sm">
            <strong>Vibes:</strong> {profile.preferred_vibes.join(", ") || "—"}
          </div>
          <div className="text-sm">
            <strong>Categories:</strong> {profile.preferred_categories.join(", ") || "—"}
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <button
          onClick={async () => {
            const r = await relearn();
            setProfile(r.profile);
          }}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Re-learn from activity
        </button>
        <button
          onClick={async () => {
            if (confirm("Reset all preferences?")) {
              await resetProfile();
              const r = await fetchProfile();
              setProfile(r.profile);
            }
          }}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          Reset
        </button>
        {saving && <span className="self-center text-sm text-muted-foreground">Saving…</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-foreground">{label}</div>
      {children}
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o || "(none)"}
        </option>
      ))}
    </select>
  );
}
