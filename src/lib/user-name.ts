import type { User } from "@supabase/supabase-js";

/**
 * Resolve a user's first name for greetings.
 * Priority: profile.display_name → user_metadata.full_name → user_metadata.name → email local-part.
 * Returns "friend" only if nothing usable is found.
 */
export function firstNameOrFriend(
  user: User | null | undefined,
  profile?: { display_name?: string | null } | null,
): string {
  const candidates: Array<string | null | undefined> = [
    profile?.display_name,
    (user?.user_metadata as any)?.full_name,
    (user?.user_metadata as any)?.name,
    (user?.user_metadata as any)?.display_name,
    user?.email ? user.email.split("@")[0] : null,
  ];
  for (const c of candidates) {
    const first = c?.trim().split(/\s+/)[0];
    if (first) return first;
  }
  return "friend";
}
