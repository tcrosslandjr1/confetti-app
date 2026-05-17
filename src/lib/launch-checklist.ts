// Pre-launch checklist with localStorage persistence + a hook that
// auto-marks the Google Wallet secrets task complete the moment the
// /api/public/wallet/google endpoint returns a signed saveUrl.

import { useEffect, useState, useSyncExternalStore } from "react";

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  // optional auto-checker; if it resolves true the item is marked complete
  autoCheck?: () => Promise<boolean>;
};

export const CHECKLIST: ChecklistItem[] = [
  {
    id: "google-wallet-secrets",
    title: "Google Wallet secrets",
    description:
      "Issuer ID, Class ID, service account email, and PKCS8 private key configured so the wallet endpoint can return a signed saveUrl.",
    autoCheck: async () => {
      try {
        const res = await fetch("/api/public/wallet/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loopId: "CHECKLIST_PROBE",
            passenger: "Probe",
            from: "Home",
            to: "Night Out",
            date: "Sat",
            stops: [{ id: "p1", name: "Probe Stop" }],
          }),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as { saveUrl?: string };
        return (
          typeof json.saveUrl === "string" && json.saveUrl.startsWith("https://pay.google.com/")
        );
      } catch {
        return false;
      }
    },
  },
  {
    id: "apple-wallet-pass",
    title: "Apple Wallet pass",
    description:
      "Pass type ID, team ID, signing cert, and WWDR cert in place to issue .pkpass downloads.",
  },
];

const STORAGE_KEY = "confetti:launch-checklist:v1";

type State = Record<string, { done: boolean; at: string | null }>;

function load(): State {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as State;
  } catch {
    return {};
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export function setChecklistItem(id: string, done: boolean) {
  state = { ...state, [id]: { done, at: done ? new Date().toISOString() : null } };
  persist();
}

export function getChecklistState(): State {
  return state;
}

const EMPTY: State = {};
export function useChecklist(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => EMPTY,
  );
}

/** Runs all autoCheck functions; flips items to done when they pass. */
export function useAutoChecker() {
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    try {
      await Promise.all(
        CHECKLIST.filter((i) => i.autoCheck).map(async (i) => {
          const ok = await i.autoCheck!();
          if (ok && !state[i.id]?.done) setChecklistItem(i.id, true);
        }),
      );
    } finally {
      setRunning(false);
    }
  };
  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { running, run };
}
