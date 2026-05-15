import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, KeyRound, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan check-in QR — Confetti" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ScanPage,
});

// Minimal type for the experimental BarcodeDetector API.
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (
    source: HTMLVideoElement,
  ) => Promise<{ rawValue: string; format: string }[]>;
};

function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "error" | "unsupported">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [manual, setManual] = useState("");

  // Route to /check-in given a scanned URL or raw "loop=...&stop=..." string.
  function handleScannedValue(raw: string) {
    try {
      const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "https://x");
      const loop = url.searchParams.get("loop");
      const stop = url.searchParams.get("stop");
      if (loop && stop) {
        teardown();
        navigate({ to: "/check-in", search: { loop, stop } });
        return true;
      }
    } catch {
      /* fall through to query-string parse */
    }
    const params = new URLSearchParams(raw.replace(/^\?/, ""));
    const loop = params.get("loop");
    const stop = params.get("stop");
    if (loop && stop) {
      teardown();
      navigate({ to: "/check-in", search: { loop, stop } });
      return true;
    }
    return false;
  }

  function teardown() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startScan() {
    setErrorMsg("");
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
      .BarcodeDetector;
    if (!Detector) {
      setStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      const detector = new Detector({ formats: ["qr_code"] });
      setStatus("scanning");

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const matched = handleScannedValue(codes[0].rawValue);
            if (matched) return;
          }
        } catch {
          /* keep polling */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Camera unavailable");
    }
  }

  useEffect(() => () => teardown(), []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!handleScannedValue(manual.trim())) {
      setErrorMsg("That code doesn't include a plan and stop. Paste a check-in URL.");
    }
  }

  return (
    <main className="min-h-screen bg-cream text-ink p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
            / venue staff
          </span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
            Scan a <span className="font-serif italic font-normal text-coral">check-in.</span>
          </h1>
          <p className="mt-1 text-sm text-ink/70">
            Point the camera at the guest's boarding-pass QR. The stop is marked done and Confetti
            is awarded automatically.
          </p>
        </header>

        <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-ink bg-ink">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {status !== "scanning" && (
              <div className="absolute inset-0 grid place-items-center bg-ink/80 text-cream">
                {status === "unsupported" ? (
                  <div className="px-4 text-center text-xs">
                    <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                    Your browser doesn't support camera QR scanning. Use the manual code box
                    below.
                  </div>
                ) : status === "error" ? (
                  <div className="px-4 text-center text-xs">
                    <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                    {errorMsg || "Couldn't open the camera."}
                  </div>
                ) : (
                  <Camera className="h-10 w-10" />
                )}
              </div>
            )}
            {status === "scanning" && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-2/3 w-2/3 rounded-2xl border-4 border-coral animate-pulse" />
                <ScanLine className="absolute h-10 w-10 text-coral" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={startScan}
            disabled={status === "scanning"}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Camera className="h-4 w-4" />
            {status === "scanning" ? "Scanning…" : "Start camera"}
          </button>
        </div>

        <form
          onSubmit={submitManual}
          className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut"
        >
          <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
            Manual entry
          </label>
          <p className="mt-1 text-xs text-ink/70">
            Paste a check-in URL or query string from the guest's pass.
          </p>
          <input
            type="text"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="https://confetti.app/check-in?loop=…&stop=…"
            className="mt-2 w-full rounded-xl border-2 border-ink bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral"
          />
          <button
            type="submit"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-2.5 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
          >
            <KeyRound className="h-4 w-4" /> Check in
          </button>
          {errorMsg && status !== "error" && status !== "unsupported" && (
            <p className="mt-2 text-xs text-coral">{errorMsg}</p>
          )}
        </form>
      </div>
    </main>
  );
}
