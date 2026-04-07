"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string; role: string } | null;
}

interface MessageListProps {
  messages: Message[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No messages yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isInternal = msg.type === "INTERNAL";
        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isInternal ? "bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3" : ""}`}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                {msg.author ? getInitials(msg.author.displayName) : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {msg.author?.displayName ?? "Unknown"}
                </span>
                {isInternal ? (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Internal Note
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {timeAgo(msg.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
