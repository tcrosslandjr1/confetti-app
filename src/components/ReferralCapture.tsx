import { useEffect } from "react";
import { rememberReferralCode } from "@/lib/referrals";

/**
 * Captures ?ref=CODE from any URL into localStorage so it can be linked
 * to the new account after signup. No UI.
 */
export function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (code) rememberReferralCode(code);
  }, []);
  return null;
}
