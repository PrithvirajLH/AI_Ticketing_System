"use client";

import { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export function ChatInput({
  onSubmit,
  isLoading,
  placeholder = "Describe what you need help with...",
  defaultValue,
}: ChatInputProps) {
  const [text, setText] = useState(defaultValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (defaultValue) setText(defaultValue);
  }, [defaultValue]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-foreground/20 transition-all">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={4}
        className="resize-none border-0 bg-transparent text-base leading-relaxed focus-visible:ring-0 pr-24 shadow-none"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          disabled={isLoading}
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-9 w-9"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
