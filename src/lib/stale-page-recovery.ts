const STALE_RELOAD_KEY = "__lovable_stale_module_reload__";

export function isStaleModuleError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? `${error.name} ${error.message} ${error.stack ?? ""}`
      : String(error ?? "");

  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Failed to load module script") ||
    msg.includes("dynamically imported module") ||
    msg.includes("vite/preload-helper")
  );
}

export function clearStalePageRecovery() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STALE_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

export function recoverStalePage(error: unknown): boolean {
  if (typeof window === "undefined" || !isStaleModuleError(error)) return false;

  let alreadyTried = false;
  try {
    alreadyTried = window.sessionStorage.getItem(STALE_RELOAD_KEY) === "1";
    if (!alreadyTried) window.sessionStorage.setItem(STALE_RELOAD_KEY, "1");
  } catch {
    /* sessionStorage may be unavailable */
  }
  if (alreadyTried) return false;

  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString(36));
  window.location.replace(url.toString());
  return true;
}