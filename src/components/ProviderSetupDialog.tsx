import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  submitProviderCredentials,
  getMyProviderSubmissions,
} from "@/lib/oauth-submissions.functions";

/**
 * Setup wizard for a custom OAuth provider (TikTok or Instagram).
 *
 * Two responsibilities:
 *  1. Walk the user through the developer-portal steps so they know what
 *     to register and which redirect URI to whitelist.
 *  2. Capture the resulting client_id / client_secret + optional notes and
 *     persist them to oauth_credential_submissions for an admin to review
 *     and roll into Lovable Cloud secrets.
 *
 * We intentionally do not try to write secrets directly from the client.
 */

type ProviderKey = "tiktok" | "instagram";

interface FieldFormat {
  /** Inline hint shown under the input describing the expected format. */
  hint: string;
  /** Returns null when valid, otherwise a human-readable error string. */
  validate: (value: string) => string | null;
}

interface ProviderCopy {
  label: string;
  portalLabel: string;
  portalUrl: string;
  callbackPath: string;
  steps: string[];
  clientIdLabel: string;
  clientSecretLabel: string;
  scopesNote: string;
  clientIdFormat: FieldFormat;
  clientSecretFormat: FieldFormat;
}

/**
 * Build a validator that checks the trimmed value against a regex and
 * length window. We keep validators lenient — providers occasionally
 * change their key shape, so we warn on obvious format problems rather
 * than rejecting anything that doesn't match exactly.
 */
function makeValidator(opts: {
  label: string;
  pattern: RegExp;
  minLen: number;
  maxLen: number;
  example?: string;
}): FieldFormat["validate"] {
  return (raw: string) => {
    const v = raw.trim();
    if (!v) return `${opts.label} is required.`;
    if (v !== raw) {
      return `${opts.label} has leading or trailing whitespace — remove it before submitting.`;
    }
    if (v.length < opts.minLen) {
      return `${opts.label} looks too short (${v.length} chars). Expected at least ${opts.minLen}.`;
    }
    if (v.length > opts.maxLen) {
      return `${opts.label} looks too long (${v.length} chars). Expected at most ${opts.maxLen}.`;
    }
    if (!opts.pattern.test(v)) {
      return `${opts.label} contains unexpected characters.${opts.example ? ` Example shape: ${opts.example}` : ""}`;
    }
    return null;
  };
}

const COPY: Record<ProviderKey, ProviderCopy> = {
  tiktok: {
    label: "TikTok",
    portalLabel: "TikTok for Developers",
    portalUrl: "https://developers.tiktok.com/apps",
    callbackPath: "/api/public/tiktok/callback",
    clientIdLabel: "Client Key",
    clientSecretLabel: "Client Secret",
    scopesNote: "Request scopes: user.info.basic, user.info.profile.",
    steps: [
      "Sign in at developers.tiktok.com and create a new app under My Apps.",
      "Under Add products, enable Login Kit for Web.",
      "In the Login Kit settings, paste the Redirect URI shown below.",
      "Copy the Client Key and Client Secret from the app dashboard.",
      "Submit them in the form below — we'll review and enable TikTok sign-in.",
    ],
    clientIdFormat: {
      hint: "Usually ~18–24 characters, letters and digits only (e.g. aw1abc23defg45hij6).",
      validate: makeValidator({
        label: "Client Key",
        pattern: /^[A-Za-z0-9]+$/,
        minLen: 10,
        maxLen: 64,
        example: "aw1abc23defg45hij6",
      }),
    },
    clientSecretFormat: {
      hint: "Usually ~40 hex characters (0–9, a–f).",
      validate: makeValidator({
        label: "Client Secret",
        pattern: /^[A-Za-z0-9]+$/,
        minLen: 20,
        maxLen: 128,
        example: "a1b2c3d4e5f6...",
      }),
    },
  },
  instagram: {
    label: "Instagram",
    portalLabel: "Meta for Developers",
    portalUrl: "https://developers.facebook.com/apps",
    callbackPath: "/api/public/instagram/callback",
    clientIdLabel: "Instagram App ID",
    clientSecretLabel: "Instagram App Secret",
    scopesNote: "Request scope: instagram_business_basic.",
    steps: [
      "Sign in at developers.facebook.com and create a Business app.",
      "Add the Instagram product, then open the API setup with Instagram Login section.",
      "Under Business login settings, add the Redirect URI shown below.",
      "Copy the Instagram App ID and App Secret from the basic settings.",
      "Submit them in the form below — we'll review and enable Instagram sign-in.",
    ],
    clientIdFormat: {
      hint: "Numeric only — usually 15–17 digits (e.g. 1234567890123456).",
      validate: makeValidator({
        label: "Instagram App ID",
        pattern: /^[0-9]+$/,
        minLen: 10,
        maxLen: 32,
        example: "1234567890123456",
      }),
    },
    clientSecretFormat: {
      hint: "32 hex characters (0–9, a–f).",
      validate: makeValidator({
        label: "Instagram App Secret",
        pattern: /^[a-f0-9]+$/i,
        minLen: 24,
        maxLen: 64,
        example: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      }),
    },
  },
};

interface ProviderSetupDialogProps {
  provider: ProviderKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderSetupDialog({
  provider,
  open,
  onOpenChange,
}: ProviderSetupDialogProps) {
  const qc = useQueryClient();
  const submitFn = useServerFn(submitProviderCredentials);
  const listFn = useServerFn(getMyProviderSubmissions);

  const callbackUrl = useMemo(() => {
    if (!provider) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://confettiplan.lovable.app";
    return `${origin}${COPY[provider].callbackPath}`;
  }, [provider]);

  const { data: subs } = useQuery({
    queryKey: ["oauth-submissions"],
    queryFn: () => listFn({}),
    enabled: open,
  });
  const latest = useMemo(() => {
    if (!provider) return null;
    return (
      subs?.submissions.find((s) => s.provider === provider) ?? null
    );
  }, [subs, provider]);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Track whether each field has been "touched" so we don't yell at the
  // user before they've had a chance to type.
  const [touched, setTouched] = useState<{ id: boolean; secret: boolean }>({
    id: false,
    secret: false,
  });

  const clientIdError = useMemo(
    () => (provider ? COPY[provider].clientIdFormat.validate(clientId) : null),
    [provider, clientId],
  );
  const clientSecretError = useMemo(
    () =>
      provider ? COPY[provider].clientSecretFormat.validate(clientSecret) : null,
    [provider, clientSecret],
  );
  const formValid = !clientIdError && !clientSecretError;

  // Reset form when dialog reopens for a new provider.
  useEffect(() => {
    if (!open) return;
    setClientId("");
    setClientSecret("");
    setNotes("");
    setError(null);
    setCopied(false);
  }, [open, provider]);

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error("No provider selected");
      await submitFn({
        data: { provider, clientId, clientSecret, notes },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oauth-submissions"] });
      setClientId("");
      setClientSecret("");
      setNotes("");
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!provider) return null;
  const c = COPY[provider];

  function copyCallback() {
    navigator.clipboard.writeText(callbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set up {c.label} sign-in</DialogTitle>
          <DialogDescription>
            Register a {c.label} developer app, then submit its credentials
            for review.
          </DialogDescription>
        </DialogHeader>

        {latest && <SubmissionStatusBanner sub={latest} />}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">1. Developer setup</h3>
            <a
              href={c.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Open {c.portalLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            {c.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-foreground">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] italic text-muted-foreground">
            {c.scopesNote}
          </p>
        </section>

        <section className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <Label className="text-xs font-semibold">Redirect URI</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-[11px]">
              {callbackUrl}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copyCallback}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Paste this exactly into the {c.label} app's allowed redirect URIs.
          </p>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            submitMut.mutate();
          }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold">2. Submit credentials</h3>
          <div className="space-y-1.5">
            <Label htmlFor="clientId" className="text-xs">
              {c.clientIdLabel}
            </Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              maxLength={512}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientSecret" className="text-xs">
              {c.clientSecretLabel}
            </Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required
              maxLength={512}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Anything reviewers should know (app review status, scopes, etc.)"
            />
          </div>

          {error && (
            <p className="inline-flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button type="submit" disabled={submitMut.isPending}>
              {submitMut.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Submit for review
            </Button>
          </DialogFooter>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Credentials are stored encrypted at rest with row-level security
            and only visible to you and reviewers. They aren't activated until
            an admin approves them.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionStatusBanner({
  sub,
}: {
  sub: {
    status: "pending" | "approved" | "rejected";
    created_at: string;
    review_notes: string | null;
  };
}) {
  const map = {
    pending: {
      Icon: Clock,
      tone: "bg-amber-100 text-amber-900 border-amber-200",
      label: "Pending review",
      text: "We received your previous submission and it's awaiting review.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-900 border-emerald-200",
      label: "Approved",
      text: "Your credentials are live. You can connect this provider now.",
    },
    rejected: {
      Icon: XCircle,
      tone: "bg-rose-100 text-rose-900 border-rose-200",
      label: "Rejected",
      text:
        sub.review_notes ??
        "Your previous submission was rejected. Resubmit below with corrections.",
    },
  } as const;
  const s = map[sub.status];
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${s.tone}`}
    >
      <s.Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 font-semibold">
          <span>{s.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {new Date(sub.created_at).toLocaleDateString()}
          </Badge>
        </div>
        <p className="opacity-90">{s.text}</p>
      </div>
    </div>
  );
}
