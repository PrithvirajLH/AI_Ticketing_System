"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Lock, Zap } from "lucide-react";
import { MentionAutocomplete } from "./mention-autocomplete";
import { RichTextEditor } from "./rich-text-editor";

interface MessageComposerProps {
  ticketId: string;
  authorId: string;
  onMessageSent: () => void;
}

export function MessageComposer({ ticketId, authorId, onMessageSent }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [type, setType] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [isSending, setIsSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cannedOpen, setCannedOpen] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<{ id: string; name: string; content: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load canned responses once
  useEffect(() => {
    fetch("/api/canned-responses")
      .then((r) => r.json())
      .then((d) => setCannedResponses(d.responses ?? []))
      .catch(() => {});
  }, []);

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

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);

    // Check for @mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionQuery(null);
    }
  }

  const handleMentionSelect = useCallback((user: { displayName: string }) => {
    const cursorPos = textareaRef.current?.selectionStart ?? body.length;
    const textBeforeCursor = body.slice(0, cursorPos);
    const textAfterCursor = body.slice(cursorPos);
    const beforeMention = textBeforeCursor.replace(/@\w*$/, "");
    const newBody = `${beforeMention}@${user.displayName} ${textAfterCursor}`;
    setBody(newBody);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }, [body]);

  const isInternal = type === "INTERNAL";

  return (
    <div className={`relative rounded-xl border p-2 ${isInternal ? "border-yellow-300 bg-yellow-50/50" : "border-border bg-card"}`}>
      {/* Type toggle + canned responses */}
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

        {cannedResponses.length > 0 ? (
          <div className="relative ml-auto">
            <button
              onClick={() => setCannedOpen(!cannedOpen)}
              className="text-xs px-2.5 py-1 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Quick Reply
            </button>
            {cannedOpen ? (
              <div className="absolute bottom-full right-0 mb-1 w-64 bg-popover border rounded-lg shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
                {cannedResponses.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setBody(r.content);
                      setCannedOpen(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{r.name}</p>
                    <p className="text-muted-foreground line-clamp-1 mt-0.5">{r.content}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Rich text input + Send */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <RichTextEditor
            content={body}
            onChange={(html) => setBody(html)}
            placeholder={isInternal ? "Write an internal note..." : "Type a message..."}
            onSubmit={handleSend}
          />
        </div>
        <Button
          size="icon"
          className={`h-9 w-9 shrink-0 rounded-full ${isInternal ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
          onClick={handleSend}
          disabled={!body.trim() || isSending}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* @Mention autocomplete */}
      {mentionQuery !== null ? (
        <MentionAutocomplete
          query={mentionQuery}
          position={{ top: 50, left: 8 }}
          onSelect={handleMentionSelect}
          onClose={() => setMentionQuery(null)}
        />
      ) : null}
    </div>
  );
}
