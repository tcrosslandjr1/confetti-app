import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: "approve" | "reject" | null;
  targetLabel: string;
  pending: boolean;
  onConfirm: (note: string) => void;
};

export function ModerationDecideDialog({
  open,
  onOpenChange,
  decision,
  targetLabel,
  pending,
  onConfirm,
}: Props) {
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const isReject = decision === "reject";
  const noteRequired = isReject;
  const valid = !noteRequired || note.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReject ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )}
            {isReject ? "Reject" : "Approve"} {targetLabel}
          </DialogTitle>
          <DialogDescription>
            {isReject
              ? "Provide a reason for rejection. This decision is logged."
              : "Confirm approval. A note is optional but recommended for audit."}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder={
            isReject ? "Reason (required)…" : "Internal note (optional)…"
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "destructive" : "default"}
            disabled={!valid || pending}
            onClick={() => onConfirm(note.trim())}
          >
            {pending ? "Saving…" : isReject ? "Reject" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
