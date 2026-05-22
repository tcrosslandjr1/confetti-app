import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "cookie-consent";
const PREFS_KEY = "cookie-consent-prefs";
const TERMS_KEY = "terms-accepted-at";
const TERMS_VERSION = "2026-05-16";

export type CookiePrefs = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
};

const DEFAULT_PREFS: CookiePrefs = { necessary: true, analytics: false, functional: false };

function readPrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      functional: !!parsed.functional,
    };
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  localStorage.setItem(STORAGE_KEY, prefs.analytics ? "accepted" : "declined");
  localStorage.setItem(
    TERMS_KEY,
    JSON.stringify({ version: TERMS_VERSION, at: new Date().toISOString() }),
  );
  window.dispatchEvent(new CustomEvent("cookie-prefs-changed", { detail: prefs }));
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("open-cookie-settings"));
}

/**
 * Silently accept-all cookies + terms. Called from the signup form so the
 * floating banner never bothers an authenticated user.
 */
export function acceptAllCookiesSilently() {
  if (typeof window === "undefined") return;
  savePrefs({ necessary: true, analytics: true, functional: true });
}

export function CookieConsent() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = readPrefs();
    const termsRaw = localStorage.getItem(TERMS_KEY);
    let termsCurrent = false;
    try {
      termsCurrent = !!termsRaw && JSON.parse(termsRaw).version === TERMS_VERSION;
    } catch {
      termsCurrent = false;
    }
    if (existing) setPrefs(existing);
    // Show banner if no prior consent OR if terms version changed.
    if (!localStorage.getItem(STORAGE_KEY) || !termsCurrent) {
      setBannerVisible(true);
    }
    const onOpen = () => {
      setPrefs(readPrefs() ?? DEFAULT_PREFS);
      setSettingsOpen(true);
    };
    window.addEventListener("open-cookie-settings", onOpen);

    const check = () =>
      setOverlayOpen(!!document.querySelector("[data-radix-dialog-overlay], [data-vaul-overlay]"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("open-cookie-settings", onOpen);
      mo.disconnect();
    };
  }, []);

  const acceptAll = () => {
    const next: CookiePrefs = { necessary: true, analytics: true, functional: true };
    savePrefs(next);
    setPrefs(next);
    setBannerVisible(false);
    setSettingsOpen(false);
  };

  const declineAll = () => {
    const next: CookiePrefs = { necessary: true, analytics: false, functional: false };
    savePrefs(next);
    setPrefs(next);
    setBannerVisible(false);
    setSettingsOpen(false);
  };

  const saveCurrent = () => {
    savePrefs(prefs);
    setBannerVisible(false);
    setSettingsOpen(false);
  };

  return (
    <>
      {bannerVisible && !overlayOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie and terms consent"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] z-[80] mx-auto max-w-2xl rounded-2xl border-2 border-ink bg-cream p-4 text-ink shadow-brut-lg sm:bottom-6 sm:right-auto sm:left-4 sm:mx-0 sm:max-w-sm sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-coral text-cream">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <p className="font-display text-sm font-extrabold leading-tight">
                  A quick housekeeping note
                </p>
                <p className="text-xs leading-relaxed text-ink/75">
                  Confetti uses cookies to keep you signed in, remember your taste, and learn what
                  picks land. By tapping <strong>Accept</strong> you also agree to our{" "}
                  <Link to="/terms" className="font-bold underline underline-offset-2">
                    Terms
                  </Link>
                  ,{" "}
                  <Link to="/privacy" className="font-bold underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link to="/cookies" className="font-bold underline underline-offset-2">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="rounded-full border-2 border-ink bg-coral text-cream shadow-brut hover:-translate-y-0.5"
                >
                  Accept all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={declineAll}
                  className="rounded-full border-2 border-ink bg-cream"
                >
                  Only essential
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-full text-xs font-bold underline-offset-2 hover:underline"
                >
                  Customize
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Your privacy choices</DialogTitle>
            <DialogDescription>
              Pick what Confetti can use. You can change this anytime from{" "}
              <strong>Cookie settings</strong> in the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-ink/10 p-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold">Strictly necessary</h3>
                <p className="text-sm text-muted-foreground">
                  Sign-in, security, fraud prevention, and remembering your choices. Required for
                  Confetti to work.
                </p>
              </div>
              <Switch checked disabled aria-label="Necessary cookies (always on)" />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-ink/10 p-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold">Functional</h3>
                <p className="text-sm text-muted-foreground">
                  Remember your city, vibe, and recently viewed venues so the home feed actually
                  feels like yours.
                </p>
              </div>
              <Switch
                checked={prefs.functional}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, functional: !!v }))}
                aria-label="Toggle functional cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-ink/10 p-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Anonymous, aggregated stats so we can tell which picks land and what to build
                  next. Never sold.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: !!v }))}
                aria-label="Toggle analytics cookies"
              />
            </div>

            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Saving any choice below also confirms you've read and accepted our{" "}
              <Link to="/terms" className="font-semibold underline underline-offset-2">
                Terms
              </Link>
              ,{" "}
              <Link to="/privacy" className="font-semibold underline underline-offset-2">
                Privacy Policy
              </Link>
              , and{" "}
              <Link to="/cookies" className="font-semibold underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={declineAll}>
              Only essential
            </Button>
            <Button variant="outline" onClick={saveCurrent}>
              Save choices
            </Button>
            <Button onClick={acceptAll}>Accept all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
