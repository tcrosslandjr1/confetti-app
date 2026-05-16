import { useEffect } from "react";

/**
 * While `open` is true, push a history entry so the browser/system Back button
 * (or Android hardware back / mobile swipe-back) closes the modal instead of
 * navigating away from the page. Cleans up its history entry when the modal
 * is closed via UI so the user's back stack isn't polluted.
 */
export function useHistoryDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    let poppedByBrowser = false;
    const marker = { __lovableModal: true, t: Date.now() };
    window.history.pushState(marker, "");

    const onPop = () => {
      poppedByBrowser = true;
      onClose();
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
  }, [open, onClose]);
}
