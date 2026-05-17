import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { uploadOfficialPhoto } from "@/lib/business-portal.functions";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function UploadPhotoModal({
  open,
  onOpenChange,
  venueId,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  venueId: string;
  onUploaded: () => void;
}) {
  const upload = useServerFn(uploadOfficialPhoto);
  const [file, setFile] = useState<File | null>(null);
  const [setAsHero, setSetAsHero] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setSetAsHero(false);
    setBusy(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Image too large (max 6 MB)");
      return;
    }
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      await upload({
        data: {
          venueId,
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64,
          setAsHero,
        },
      });
      toast.success("Photo uploaded");
      reset();
      onOpenChange(false);
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload photo</DialogTitle>
          <DialogDescription>
            JPG or PNG, max 6 MB. Owner-uploaded photos always show before AI-pulled ones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="hero-toggle" className="text-sm">
              Set as hero image
            </Label>
            <Switch id="hero-toggle" checked={setAsHero} onCheckedChange={setSetAsHero} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
