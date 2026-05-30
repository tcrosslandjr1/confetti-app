/**
 * NotificationBell — accessible dropdown showing recent notifications.
 * Drop into any header/nav. Requires an authenticated user.
 *
 * Accessibility: aria-expanded, aria-haspopup, role="menu",
 * Escape-to-close, focus-trap within dropdown, keyboard nav.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface Props {
  userId: string | undefined;
}

export function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close]);

  // Escape key closes dropdown
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[10px] font-bold text-cream"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-cream/10 bg-cream/5 shadow-lg z-50"
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-cream/10 px-4 py-3">
            <span className="font-display text-sm font-bold text-cream">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral transition-colors hover:text-coral/80"
                onClick={() => markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-cream/45">No notifications yet</div>
          ) : (
            <ul className="divide-y divide-ink/6" role="list">
              {notifications.slice(0, 20).map((n) => (
                <NotifItem
                  key={n.id}
                  notification={n}
                  onRead={() => markRead(n.id)}
                  onNavigate={(link) => {
                    close();
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
  const handleActivate = () => {
    if (!notification.read) onRead();
    if (notification.link) onNavigate(notification.link);
  };

  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <li
      className={cn(
        "cursor-pointer px-4 py-3 transition-colors hover:bg-cream/5",
        "focus-visible:outline-none focus-visible:bg-cream/5",
        !notification.read && "bg-coral/[0.04]",
      )}
      role="menuitem"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        {!notification.read && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-coral" aria-label="Unread" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-cream">{notification.title}</p>
          {notification.body && (
            <p className="mt-0.5 line-clamp-2 text-xs text-cream/55">{notification.body}</p>
          )}
          <span className="mt-1 block font-mono text-[10px] text-cream/40">{timeAgo}</span>
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
