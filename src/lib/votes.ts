// Lightweight local vote store for the collaborative "build the night together" flow.
// Mirrors the pattern used by src/lib/invites.ts: localStorage + storage/custom events
// so the host's Ready page tallies stay in sync with guest votes from /collab.

export type VoteValue = "in" | "maybe" | "out";

export type StopVote = {
  voterId: string;
  voterName?: string;
  value: VoteValue;
  at: string; // ISO timestamp
};

// tripId -> stopIndex -> voterId -> StopVote
type TripVotes = Record<string, Record<string, StopVote>>;

const STORAGE_PREFIX = "confetti.votes.";
const VOTER_KEY = "confetti.voter";
const STORAGE_EVENT = "confetti.votes.changed";

function key(tripId: string) {
  return STORAGE_PREFIX + tripId;
}

export function getVoterId(): string {
  if (typeof window === "undefined") return "anon";
  let id = window.localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    window.localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

export function getVoterName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(VOTER_KEY + ".name") ?? "";
}

export function setVoterName(name: string) {
  if (typeof window === "undefined") return;
  if (name.trim()) window.localStorage.setItem(VOTER_KEY + ".name", name.trim());
  else window.localStorage.removeItem(VOTER_KEY + ".name");
}

export function loadVotes(tripId: string): TripVotes[string] {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key(tripId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function castVote(tripId: string, stopIndex: number, value: VoteValue) {
  if (typeof window === "undefined") return;
  const all = loadVotes(tripId);
  const stopKey = String(stopIndex);
  const voterId = getVoterId();
  const voterName = getVoterName() || undefined;
  const stop = { ...(all[stopKey] ?? {}) };
  stop[voterId] = { voterId, voterName, value, at: new Date().toISOString() };
  all[stopKey] = stop;
  try {
    window.localStorage.setItem(key(tripId), JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { tripId } }));
  } catch {
    // ignore quota / private mode
  }
}

export function clearVote(tripId: string, stopIndex: number) {
  if (typeof window === "undefined") return;
  const all = loadVotes(tripId);
  const stopKey = String(stopIndex);
  if (!all[stopKey]) return;
  delete all[stopKey][getVoterId()];
  try {
    window.localStorage.setItem(key(tripId), JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { tripId } }));
  } catch {
    // ignore
  }
}

export function tallyStop(votes: TripVotes[string], stopIndex: number) {
  const stop = votes[String(stopIndex)] ?? {};
  const list = Object.values(stop);
  return {
    in: list.filter((v) => v.value === "in").length,
    maybe: list.filter((v) => v.value === "maybe").length,
    out: list.filter((v) => v.value === "out").length,
    voters: list,
  };
}

export function subscribeVotes(tripId: string, onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === key(tripId)) onChange();
  };
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ tripId?: string }>).detail;
    if (!detail?.tripId || detail.tripId === tripId) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(STORAGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORAGE_EVENT, onCustom);
  };
}
