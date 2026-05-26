import { useEffect, useRef } from "react";

/**
 * While `open` is true, push a history entry so the browser/system Back button
 * (or Android hardware back / mobile swipe-back) closes the modal instead of
 * navigating away from the page. Cleans up its history entry when the modal
 * is closed via UI so the user's back stack isn't polluted.
 *
 * NOTE: We intentionally depend ONLY on `open` (not `onClose`). Callers often
 * pass an inline arrow as `onClose`, which would otherwise re-run this effect
 * on every parent render — the cleanup calls `history.back()` which fires
 * `popstate` and immediately closes the modal. Storing `onClose` in a ref
 * keeps it current without retriggering the effect.
 */
export function useHistoryDismiss(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    let poppedByBrowser = false;
    const marker = { __confettiModal: true, t: Date.now() };
    window.history.pushState(marker, "");

    const onPop = () => {
      poppedByBrowser = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      // If the modal was closed via UI (not the Back button), pop the entry
      // we added so the back stack stays clean.
      if (!poppedByBrowser) {
        window.history.back();
      }
    };
  }, [open]);
}
