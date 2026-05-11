import { useEffect, useState } from "react";
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

const STORAGE_KEY = "cookie-consent";
const PREFS_KEY = "cookie-consent-prefs";

export type CookiePrefs = {
  necessary: true;
  analytics: boolean;
};

const DEFAULT_PREFS: CookiePrefs = { necessary: true, analytics: false };

function readPrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { necessary: true, analytics: !!parsed.analytics };
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  localStorage.setItem(STORAGE_KEY, prefs.analytics ? "accepted" : "declined");
  window.dispatchEvent(new CustomEvent("cookie-prefs-changed", { detail: prefs }));
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("open-cookie-settings"));
}

export function CookieConsent() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = readPrefs();
    if (existing) {
      setPrefs(existing);
    } else if (!localStorage.getItem(STORAGE_KEY)) {
      setBannerVisible(true);
    }
    const onOpen = () => {
      setPrefs(readPrefs() ?? DEFAULT_PREFS);
      setSettingsOpen(true);
    };
    window.addEventListener("open-cookie-settings", onOpen);
    return () => window.removeEventListener("open-cookie-settings", onOpen);
  }, []);

  const acceptAll = () => {
    const next: CookiePrefs = { necessary: true, analytics: true };
    savePrefs(next);
    setPrefs(next);
    setBannerVisible(false);
    setSettingsOpen(false);
  };

  const declineAll = () => {
    const next: CookiePrefs = { necessary: true, analytics: false };
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
      {bannerVisible && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+5rem)] z-[80] mx-auto max-w-2xl rounded-xl border-2 border-ink bg-cream p-4 text-ink shadow-lg sm:left-auto sm:right-4 sm:top-20 sm:mx-0 sm:max-w-md sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              We use cookies to improve your experience and analyze site usage. See our{" "}
              <a href="/privacy" className="underline underline-offset-2">
                privacy policy
              </a>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                Cookie settings
              </Button>
              <Button variant="outline" size="sm" onClick={declineAll}>
                Decline
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              Choose which cookies we can use. You can change this any time from the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border-2 border-ink/10 p-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold">Necessary</h3>
                <p className="text-sm text-muted-foreground">
                  Required for the site to work — sign-in, security, and remembering your
                  preferences. These can't be turned off.
                </p>
              </div>
              <Switch checked disabled aria-label="Necessary cookies (always on)" />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border-2 border-ink/10 p-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Help us understand which pages and features people use, so we can make Confetti
                  better. Anonymous, aggregated only.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: !!v }))}
                aria-label="Toggle analytics cookies"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={declineAll}>
              Decline all
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
