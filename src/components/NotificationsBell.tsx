/**
 * NotificationsBell — thin compatibility wrapper around NotificationBell.
 * Reads userId from useAuth so callers need no props.
 * @deprecated Prefer importing NotificationBell directly and passing userId.
 */
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/NotificationBell";

export function NotificationsBell() {
  const { user } = useAuth();
  if (!user) return null;
  return <NotificationBell userId={user.id} />;
}
