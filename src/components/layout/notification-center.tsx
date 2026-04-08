"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  ticketId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { displayName: string } | null;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch(`/api/notifications?userId=${CURRENT_USER_ID}`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications?action=read&id=${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch(`/api/notifications?action=readAll&userId=${CURRENT_USER_ID}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.ticketId) {
      setOpen(false);
      router.push(`/tickets/${n.ticketId}`);
    }
  }

  function formatTime(dateStr: string): string {
    const raw = dateStr;
    const date = new Date(raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z");
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 ? (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-2 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                    {n.body ? (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead ? (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0 mt-1"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
