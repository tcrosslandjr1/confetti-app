/**
 * NotificationBell — dropdown showing recent notifications with unread badge.
 * Drop into any header/nav. Requires an authenticated user.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface Props {
  userId: string | undefined;
}

export function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-card shadow-brut z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.slice(0, 20).map((n) => (
                <NotifItem
                  key={n.id}
                  notification={n}
                  onRead={() => markRead(n.id)}
                  onNavigate={(link) => {
                    setOpen(false);
                    navigate({ to: link });
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({
  notification,
  onRead,
  onNavigate,
}: {
  notification: AppNotification;
  onRead: () => void;
  onNavigate: (link: string) => void;
}) {
  const handleClick = () => {
    if (!notification.read) onRead();
    if (notification.link) onNavigate(notification.link);
  };

  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <li
      className={cn(
        "px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50",
        !notification.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        {!notification.read && (
          <span className="mt-1.5 h-2 w-2 rounded-full bg-coral shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          {notification.body && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {notification.body}
            </p>
          )}
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {timeAgo}
          </span>
        </div>
      </div>
    </li>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
