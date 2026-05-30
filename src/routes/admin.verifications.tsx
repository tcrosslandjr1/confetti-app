import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, ShieldCheck, Check, X, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/verifications")({
  component: AdminVerifications,
  head: () => ({
    meta: [
      { title: "Verification queue — Confetti Admin" },
      {
        name: "description",
        content: "Review premium-verified document submissions from venue managers.",
      },
    ],
  }),
});

type Claim = {
  id: string;
  user_id: string | null;
  venue_id: string | null;
  status: "pending" | "approved" | "rejected";
  verification_tier: string;
  proof_url: string | null;
  evidence_url: string | null;
  notes: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  venue?: { name: string | null; city: string | null } | null;
};

type Tab = "pending" | "approved" | "rejected";

function AdminVerifications() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await (supabase as any).rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    })();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("venue_claims")
        .select(
          "id, user_id, venue_id, status, verification_tier, proof_url, evidence_url, notes, admin_note, created_at, reviewed_at, venue:venues(name, city)",
        )
        .eq("verification_tier", "admin_review")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      setRows((data ?? []) as Claim[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) refresh(); /* eslint-disable-next-line */
  }, [tab, isAdmin]);

  async function decide(claim: Claim, decision: "approved" | "rejected") {
    try {
      const { data: u } = await supabase.auth.getUser();
      const adminNote = notes[claim.id] ?? null;
      const { error: claimErr } = await (supabase as any)
        .from("venue_claims")
        .update({
          status: decision,
          admin_note: adminNote,
          reviewed_by: u.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claim.id);
      if (claimErr) throw new Error(claimErr.message);

      if (decision === "approved" && claim.venue_id) {
        const { error: vErr } = await (supabase as any)
          .from("venues")
          .update({
            verified: true,
            verification_tier: "premium_verified",
            verification_method: "document",
            verified_at: new Date().toISOString(),
          })
          .eq("id", claim.venue_id);
        if (vErr) throw new Error(vErr.message);
      }
      toast.success(
        decision === "approved" ? "Approved — venue is now Premium Verified" : "Rejected",
      );
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isAdmin === null) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </Shell>
    );
  }
  if (!isAdmin) {
    return (
      <Shell>
        <Card className="p-6 text-center">
          <p className="text-sm">Admin access required.</p>
          <Link to="/admin/console" className="mt-3 inline-block text-xs text-primary underline">
            Sign in to admin
          </Link>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <Link to="/admin/console" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Verification queue</h1>
        <Crown className="h-5 w-5 text-amber-500" />
        <Button variant="ghost" size="sm" className="ml-auto" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Review Premium Verified document submissions. Approving sets the venue to{" "}
        <strong>premium_verified</strong>.
      </p>

      <div className="mt-4 flex gap-2">
        {(["pending", "approved", "rejected"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {!rows.length && !loading && (
          <Card className="p-6 text-sm text-muted-foreground">Nothing to review.</Card>
        )}
        {rows.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold truncate">{r.venue?.name ?? "(unknown venue)"}</h3>
                  {r.venue?.city && <Badge variant="outline">{r.venue.city}</Badge>}
                  <Badge variant={r.status === "pending" ? "default" : "outline"}>{r.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(r.created_at).toLocaleString()}
                  {r.reviewed_at && <> · Reviewed {new Date(r.reviewed_at).toLocaleString()}</>}
                </div>
                {r.notes && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Manager note:</span> {r.notes}
                  </p>
                )}
                {r.admin_note && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Admin note:</span> {r.admin_note}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.proof_url || r.evidence_url) && (
                    <a
                      href={(r.proof_url || r.evidence_url) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View document
                    </a>
                  )}
                </div>
              </div>
            </div>

            {r.status === "pending" && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <Textarea
                  placeholder="Reason / note (shown internally)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide(r, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Approve — Premium Verified
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(r, "rejected")}>
                    <X className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>;
}
