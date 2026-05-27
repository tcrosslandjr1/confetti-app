/**
 * FIX: Remove hardcoded admin PIN
 * REPLACE the file at: src/components/AdminPinLock.tsx
 *
 * Problem: The admin PIN "236166" is hardcoded in plain text at line 10.
 * Anyone who reads the source code (it's a client-side JS bundle) can
 * see the PIN and bypass the admin lock screen.
 *
 * The app ALREADY has server-side PIN verification via Supabase RPCs
 * (verify_admin_pin, set_admin_pin, admin_pin_status) — those are used
 * in admin.login.lazy.tsx. The hardcoded PIN is redundant.
 *
 * HOW TO APPLY: Open src/components/AdminPinLock.tsx in Lovable.
 * Change line 10 from:
 *
 *   const ADMIN_PIN = "236166";
 *
 * To:
 *
 *   // PIN is verified server-side via Supabase RPC.
 *   // No client-side PIN comparison — the verify function calls the server.
 *   const PIN_LENGTH = 6;
 *
 * Then find the place where the code compares the entered PIN against
 * ADMIN_PIN (likely something like `if (pin === ADMIN_PIN)`) and replace
 * it with a call to the Supabase RPC:
 *
 *   const { data, error } = await supabase.rpc("verify_admin_pin", { _pin: pin });
 *   if (error || !data) {
 *     // wrong PIN
 *   } else {
 *     // correct — unlock
 *   }
 *
 * The key change: DELETE the line `const ADMIN_PIN = "236166";`
 * and use the server RPC instead of client-side string comparison.
 *
 * If you want the simplest possible fix, just change the hardcoded PIN
 * to be read from an environment variable:
 */

// SIMPLEST FIX — replace line 10 in AdminPinLock.tsx:
// OLD:
//   const ADMIN_PIN = "236166";
// NEW:
//   const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? "";

// Then set VITE_ADMIN_PIN in your Lovable environment variables.
// This keeps the PIN out of source code.
