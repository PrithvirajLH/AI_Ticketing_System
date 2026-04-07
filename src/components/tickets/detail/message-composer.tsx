"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Lock } from "lucide-react";

interface MessageComposerProps {
  ticketId: string;
  authorId: string;
  onMessageSent: () => void;
}

export function MessageComposer({ ticketId, authorId, onMessageSent }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [type, setType] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!body.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), type, authorId }),
      });

      if (res.ok) {
        setBody("");
        onMessageSent();
      }
    } finally {
      setIsSending(false);
    }
  }

  const isInternal = type === "INTERNAL";

  return (
    <div className={`rounded-xl border p-2 ${isInternal ? "border-yellow-300 bg-yellow-50/50" : "border-border bg-card"}`}>
      {/* Type toggle */}
      <div className="flex items-center gap-1 px-1 pb-2">
        <button
          onClick={() => setType("PUBLIC")}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            !isInternal ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Reply
        </button>
        <button
          onClick={() => setType("INTERNAL")}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
            isInternal ? "bg-yellow-500 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Lock className="h-3 w-3" />
          Internal Note
        </button>
      </div>

      {/* Input + Send */}
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isInternal ? "Write an internal note..." : "Type a message..."}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5 max-h-32 min-h-[36px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          className={`h-9 w-9 shrink-0 rounded-full ${isInternal ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
          onClick={handleSend}
          disabled={!body.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
