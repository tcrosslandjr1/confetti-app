import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Crown, Mail, Phone, FileUp, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useManagedVenues, VenueSwitcher, NoVenueClaim } from "@/components/business/useManagedVenue";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/business/verify")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify your venue — Confetti for Business" },
      { name: "description", content: "Get verified to unlock direct bookings, points redemption and AI plan placement." },
    ],
  }),
});

type VenueRow = {
  id: string;
  name: string;
  verified: boolean | null;
  verification_tier: "none" | "verified" | "premium_verified" | null;
  verification_method: string | null;
  verified_at: string | null;
};

function VerifyPage() {
  const { venues, activeId, setActiveId, isLoading } = useManagedVenues();
  const qc = useQueryClient();

  const venue = useQuery({
    queryKey: ["verify-venue", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("venues")
        .select("id, name, verified, verification_tier, verification_method, verified_at")
        .eq("id", activeId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as VenueRow | null;
    },
  });

  if (isLoading) return <Shell>Loading…</Shell>;
  if (!venues.length) return <Shell><NoVenueClaim /></Shell>;

  const v = venue.data;
  const tier = v?.verification_tier ?? "none";

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Verify your venue</h1>
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Verification unlocks direct bookings, Confetti points redemption and priority placement in AI plans.
      </p>

      {/* Current status */}
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Current status</div>
            <div className="mt-1 flex items-center gap-2">
              <TierBadge tier={tier} />
              {v?.verified_at && (
                <span className="text-xs text-muted-foreground">
                  since {new Date(v.verified_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {tier === "premium_verified" && <Crown className="h-8 w-8 text-amber-500" />}
          {tier === "verified" && <ShieldCheck className="h-8 w-8 text-emerald-500" />}
        </div>
      </Card>

      {/* Tier 1: self-serve */}
      <Card className="mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">Verified — self-serve</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm by email or phone tied to the business listing. Instant.
            </p>
          </div>
          {(tier === "verified" || tier === "premium_verified") && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Completed</Badge>
          )}
        </div>
        <SelfServeForm venueId={activeId!} disabled={tier === "premium_verified"} onDone={() => { venue.refetch(); qc.invalidateQueries({ queryKey: ["my-managed-venues"] }); }} />
      </Card>

      {/* Tier 2: documents */}
      <Card className="mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Premium Verified — document review</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a business license or utility bill. Reviewed within 24h.
              Includes priority placement in AI plans and 2× points on every redemption.
            </p>
          </div>
          {tier === "premium_verified" && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Completed</Badge>
          )}
        </div>
        <DocUploadForm venueId={activeId!} onDone={() => { venue.refetch(); qc.invalidateQueries({ queryKey: ["my-managed-venues"] }); }} />
      </Card>
    </Shell>
  );
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === "premium_verified") return <Badge className="bg-amber-500 text-white">Premium Verified</Badge>;
  if (tier === "verified") return <Badge className="bg-emerald-500 text-white">Verified</Badge>;
  return <Badge variant="outline">Not verified</Badge>;
}

/* ──────────── Self-serve email/phone ──────────── */

function SelfServeForm({ venueId, disabled, onDone }: { venueId: string; disabled: boolean; onDone: () => void }) {
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [destination, setDestination] = useState("");
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const sendCode = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in first");
      if (!destination.trim()) throw new Error(`Enter your business ${channel}`);
      const generated = String(Math.floor(100000 + Math.random() * 900000));
      const { error } = await (supabase as any)
        .from("verification_codes")
        .insert({ user_id: u.user.id, venue_id: venueId, channel, destination: destination.trim(), code: generated });
      if (error) throw new Error(error.message);
      return generated;
    },
    onSuccess: (generated) => {
      setCodeSent(generated);
      toast.success(
        `Code sent to ${destination}. For this preview the code is ${generated}`,
        { duration: 10000 },
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in first");
      const { data: rows, error } = await (supabase as any)
        .from("verification_codes")
        .select("id, code, expires_at, consumed_at")
        .eq("user_id", u.user.id)
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);
      const row = rows?.[0];
      if (!row) throw new Error("No code on record. Request a new one.");
      if (row.consumed_at) throw new Error("Code already used. Request a new one.");
      if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Code expired. Request a new one.");
      if (row.code !== code.trim()) throw new Error("Wrong code.");
      const { error: ce } = await (supabase as any).from("verification_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
      if (ce) throw new Error(ce.message);
      const { error: ve } = await (supabase as any)
        .from("venues")
        .update({
          verified: true,
          verification_tier: "verified",
          verification_method: channel === "email" ? "email_code" : "phone_code",
          verified_at: new Date().toISOString(),
        })
        .eq("id", venueId);
      if (ve) throw new Error(ve.message);
    },
    onSuccess: () => {
      toast.success("Venue verified");
      setCode("");
      setCodeSent(null);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (disabled) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Button
          variant={channel === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setChannel("email")}
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
        </Button>
        <Button
          variant={channel === "phone" ? "default" : "outline"}
          size="sm"
          onClick={() => setChannel("phone")}
        >
          <Phone className="mr-1.5 h-3.5 w-3.5" /> Phone
        </Button>
      </div>
      <div>
        <Label htmlFor="dest" className="text-xs">
          Business {channel} on file
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="dest"
            placeholder={channel === "email" ? "manager@yourvenue.com" : "+1 555 0123"}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <Button onClick={() => sendCode.mutate()} disabled={sendCode.isPending || !destination.trim()}>
            {codeSent ? "Resend" : "Send code"}
          </Button>
        </div>
      </div>
      {codeSent && (
        <div>
          <Label htmlFor="code" className="text-xs">6-digit code</Label>
          <div className="mt-1 flex gap-2">
            <Input id="code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
            <Button onClick={() => confirm.mutate()} disabled={confirm.isPending || code.length !== 6}>
              <Check className="mr-1.5 h-4 w-4" /> Verify
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────── Document upload ──────────── */

function DocUploadForm({ venueId, onDone }: { venueId: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in first");
      if (!file) throw new Error("Choose a document to upload");

      const path = `${u.user.id}/${venueId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("venue-guides").upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("venue-guides").getPublicUrl(path);

      // Record/update an admin-review claim. Try update first; fall back to insert.
      const { data: existing } = await (supabase as any)
        .from("venue_claims")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("venue_id", venueId)
        .maybeSingle();

      const payload = {
        user_id: u.user.id,
        venue_id: venueId,
        verification_tier: "admin_review",
        status: "pending",
        proof_url: pub.publicUrl,
        evidence_url: pub.publicUrl,
        notes,
      };

      if (existing?.id) {
        const { error } = await (supabase as any).from("venue_claims").update(payload).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await (supabase as any).from("venue_claims").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Document submitted. We'll email you within 24h.");
      setFile(null);
      setNotes("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 space-y-3">
      <div>
        <Label htmlFor="doc" className="text-xs">Business license or utility bill (PDF / image)</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            id="doc"
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>}
        </div>
      </div>
      <div>
        <Label htmlFor="notes" className="text-xs">Notes for the reviewer (optional)</Label>
        <Input id="notes" placeholder="DBA name, ownership context…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button onClick={() => submit.mutate()} disabled={submit.isPending || !file}>
        <FileUp className="mr-1.5 h-4 w-4" />
        {submit.isPending ? "Uploading…" : "Submit for review"}
      </Button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>;
}
