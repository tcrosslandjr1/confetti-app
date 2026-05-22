import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/business/claim")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/business/signup" });
    }
  },
  component: ClaimPage,
  head: () => ({
    meta: [
      { title: "Find your venue — Confetti for Business" },
      { name: "description", content: "Search Confetti and claim your venue." },
    ],
  }),
});

type SearchHit = {
  id: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  hero_image_url: string | null;
  image_url: string | null;
  claim_status: string | null;
  claimed_by: string | null;
  website: string | null;
};

function ClaimPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const claims = useQuery({
    queryKey: ["my-business-claims"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { claims: [] as Array<{ id: string; proposed_name: string | null; venue_id: string | null; status: string }> };
      const { data, error } = await supabase
        .from("venue_claims")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return { claims: data ?? [] };
    },
  });

  const results = useQuery({
    queryKey: ["venue-claim-search", submittedQuery],
    queryFn: async () => {
      const q = submittedQuery.replace(/[%,]/g, " ").trim();
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, city, neighborhood, hero_image_url, image_url, claim_status, claimed_by, website")
        .or(`name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%`)
        .order("name")
        .limit(20);
      if (error) throw new Error(error.message);
      return { venues: (data ?? []) as SearchHit[] };
    },
    enabled: submittedQuery.length > 0,
  });

  if (selected || addingNew) {
    return (
      <VerifyForm
        selected={selected}
        proposedName={addingNew ? query : undefined}
        onCancel={() => {
          setSelected(null);
          setAddingNew(false);
        }}
        onSubmitted={() => {
          claims.refetch();
          navigate({ to: "/business/claim/pending" });
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/business" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Find your venue</h1>
      <p className="mt-2 text-muted-foreground">
        Search by venue name or address. If we don't have it yet, you can add it.
      </p>

      {(claims.data?.claims ?? []).length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">Your existing claims</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {claims.data!.claims.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.proposed_name ?? (c.venue_id ? "Existing venue" : "Untitled claim")}</span>
                <Badge variant="secondary">{c.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
        className="mt-8 flex gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. The Roof at St Ives"
          autoFocus
        />
        <Button type="submit" disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {results.isFetching && <p className="mt-6 text-sm text-muted-foreground">Searching…</p>}

      {results.data && (
        <div className="mt-6 space-y-3">
          {results.data.venues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No venues match "{submittedQuery}".</p>
              <Button className="mt-4" onClick={() => setAddingNew(true)}>
                Add "{submittedQuery}" as a new venue
              </Button>
            </div>
          ) : (
            <>
              {results.data.venues.map((v: SearchHit) => {
                const taken = !!v.claimed_by;
                return (
                  <button
                    key={v.id}
                    onClick={() => !taken && setSelected(v)}
                    disabled={taken}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{v.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[v.neighborhood, v.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    {taken ? (
                      <Badge variant="outline">Already claimed</Badge>
                    ) : (
                      <Badge>Claim</Badge>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setAddingNew(true)}
                className="w-full rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                None of these — add a new venue
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function VerifyForm({
  selected,
  proposedName,
  onCancel,
  onSubmitted,
}: {
  selected: SearchHit | null;
  proposedName?: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const submit = useServerFn(submitVenueClaim);
  const [method, setMethod] = useState<"social_tiktok" | "social_instagram">("social_instagram");
  const [handle, setHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [proposedCity, setProposedCity] = useState("");
  const [proposedWebsite, setProposedWebsite] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          venueId: selected?.id,
          proposedName: selected ? undefined : proposedName,
          proposedCity: selected ? undefined : proposedCity || undefined,
          proposedWebsite: selected ? undefined : proposedWebsite || undefined,
          method,
          evidenceHandle: handle.replace(/^@/, ""),
          notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Claim submitted — we'll review within 24–48 hours.");
      onSubmitted();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to submit"),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
        ← Choose a different venue
      </button>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Claiming</p>
        <p className="mt-1 text-xl font-semibold">{selected?.name ?? proposedName}</p>
        {selected && (
          <p className="text-sm text-muted-foreground">
            {[selected.neighborhood, selected.city].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <h2 className="mt-8 text-2xl font-bold">Verify ownership</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect or provide the venue's official social account. If the handle matches, we can
        auto‑verify.
      </p>

      {!selected && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City (optional)</Label>
            <Input
              id="city"
              value={proposedCity}
              onChange={(e) => setProposedCity(e.target.value)}
              placeholder="Washington, DC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              type="url"
              value={proposedWebsite}
              onChange={(e) => setProposedWebsite(e.target.value)}
              placeholder="https://yourvenue.com"
            />
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <RadioGroup value={method} onValueChange={(v) => setMethod(v as typeof method)}>
          <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:border-primary">
            <RadioGroupItem value="social_instagram" className="mt-1" />
            <div>
              <p className="font-medium">Instagram official account</p>
              <p className="text-sm text-muted-foreground">
                e.g. @yourvenue — we'll match handle against the venue name.
              </p>
            </div>
          </Label>
          <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:border-primary">
            <RadioGroupItem value="social_tiktok" className="mt-1" />
            <div>
              <p className="font-medium">TikTok official account</p>
              <p className="text-sm text-muted-foreground">e.g. @yourvenue on TikTok.</p>
            </div>
          </Label>
        </RadioGroup>

        <div className="space-y-2">
          <Label htmlFor="handle">
            {method === "social_instagram" ? "Instagram handle" : "TikTok handle"}
          </Label>
          <Input
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourvenue"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Anything else? (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Your role, additional context, etc."
            rows={3}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I confirm I am the owner or authorized manager of this venue and the information above
            is accurate.
          </span>
        </label>

        <Button
          className="w-full"
          size="lg"
          disabled={!handle.trim() || !confirmed || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Submitting…" : "Submit claim for review"}
        </Button>
      </div>
    </div>
  );
}
