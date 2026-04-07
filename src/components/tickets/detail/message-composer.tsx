"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2 } from "lucide-react";

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

  return (
    <div className="space-y-2 border rounded-lg p-3">
      <Tabs value={type} onValueChange={(v) => setType(v as "PUBLIC" | "INTERNAL")}>
        <TabsList className="h-8">
          <TabsTrigger value="PUBLIC" className="text-xs">Reply</TabsTrigger>
          <TabsTrigger value="INTERNAL" className="text-xs">Internal Note</TabsTrigger>
        </TabsList>
      </Tabs>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={type === "PUBLIC" ? "Type a reply..." : "Add an internal note..."}
        rows={3}
        className="resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Ctrl+Enter to send
        </span>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!body.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          {type === "PUBLIC" ? "Send Reply" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}
