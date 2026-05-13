import { useEffect, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const REASONS = [
  { value: "closed", label: "Permanently closed" },
  { value: "wrong_location", label: "Wrong address / location" },
  { value: "doesnt_exist", label: "Doesn't exist / can't find it" },
  { value: "duplicate", label: "Duplicate of another venue" },
  { value: "other", label: "Something else" },
];

type Props = {
  venueName: string;
  city?: string | null;
  placeId?: string | null;
  className?: string;
};

export function ReportVenueButton({ venueName, city, placeId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("closed");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvedPlaceId, setResolvedPlaceId] = useState<string | null>(placeId ?? null);

  useEffect(() => {
    if (placeId || !open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("venue_details_cache")
        .select("place_id")
        .ilike("name", venueName)
        .not("place_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.place_id) setResolvedPlaceId(data.place_id);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, placeId, venueName]);

  async function submit() {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to report a venue");
        return;
      }
      const { error } = await supabase.from("venue_reports").insert({
        user_id: user.id,
        venue_name: venueName,
        city: city ?? null,
        place_id: resolvedPlaceId,
        reason,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Thanks — we won't suggest this place to you again");
      setOpen(false);
      setNotes("");
      setReason("closed");
    } catch (e) {
      toast.error((e as Error).message || "Couldn't submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut transition-pop hover:-translate-y-0.5"
        }
      >
        <Flag className="h-3 w-3" /> Report wrong / closed
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-2 border-ink bg-cream">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">
              Report this venue
            </DialogTitle>
            <DialogDescription>
              Help us keep recommendations accurate. We'll stop showing{" "}
              <span className="font-semibold text-ink">{venueName}</span> in your plans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                Reason
              </label>
              <div className="grid gap-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm transition-pop ${
                      reason === r.value
                        ? "border-ink bg-coral/20 shadow-brut"
                        : "border-ink/30 bg-card hover:border-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="venue-report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-coral"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything else we should know?"
                className="w-full resize-none rounded-xl border-2 border-ink bg-card p-3 text-sm focus:outline-none"
              />
            </div>
            {!resolvedPlaceId && (
              <p className="text-xs text-ink/60">
                Heads up: we couldn't find a Google Places ID for this venue, so this report
                will only block it for your account.
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border-2 border-ink bg-cream px-4 py-2 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-coral px-4 py-2 text-sm font-bold text-cream shadow-brut disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
