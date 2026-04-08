"use client";

import { useState, useEffect, useCallback } from "react";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";
const TYPING_TIMEOUT = 3000;

interface TypingIndicatorProps {
  ticketId: string;
  isTyping: boolean;
}

/**
 * Shows "User is typing..." indicator.
 * Uses polling — checks every 2s. Replace with WebSocket later.
 */
export function TypingIndicator({ ticketId, isTyping }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Broadcast typing state
  useEffect(() => {
    if (!isTyping) return;

    fetch(`/api/tickets/${ticketId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CURRENT_USER_ID }),
    }).catch(() => {});
  }, [isTyping, ticketId]);

  // Poll for other users typing
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/typing`);
        const data = await res.json();
        setTypingUsers((data.typingUsers ?? []).filter((u: string) => u !== CURRENT_USER_ID));
      } catch { /* ignore */ }
    }, 2000);

    return () => clearInterval(interval);
  }, [ticketId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground">
        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}
