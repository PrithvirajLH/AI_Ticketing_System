"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Lock } from "lucide-react";

// Hardcoded — replace with auth
const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${date.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground/60">Start the conversation below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1 py-3">
      {messages.map((msg, index) => {
        const isMe = msg.author?.id === CURRENT_USER_ID;
        const isInternal = msg.type === "INTERNAL";
        const showAvatar = index === 0 || messages[index - 1]?.author?.id !== msg.author?.id;
        const showName = showAvatar;

        return (
          <div
            key={msg.id}
            className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}
          >
            {/* Avatar — only show on first message in a group */}
            <div className="w-8 shrink-0">
              {showAvatar ? (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`text-xs ${isMe ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {msg.author ? getInitials(msg.author.displayName) : "?"}
                  </AvatarFallback>
                </Avatar>
              ) : null}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
              {showName ? (
                <div className={`flex items-center gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.author?.displayName ?? "Unknown"}
                  </span>
                  {isInternal ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Lock className="h-2.5 w-2.5 mr-0.5" />
                      Internal
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <div
                className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  isInternal
                    ? "bg-yellow-50 border border-yellow-200/50 text-yellow-900"
                    : isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                } prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1`}
                dangerouslySetInnerHTML={{ __html: msg.body }}
              />

              <p className={`text-[10px] text-muted-foreground/50 mt-1 ${isMe ? "text-right" : ""}`}>
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
