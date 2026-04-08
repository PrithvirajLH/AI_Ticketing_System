"use client";

import { NotificationCenter } from "./notification-center";
import { ThemeToggle } from "./theme-toggle";

export function TopHeader() {
  return (
    <div className="h-12 border-b flex items-center justify-end gap-2 px-4 shrink-0">
      <kbd className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono hidden sm:block">
        Ctrl+K
      </kbd>
      <ThemeToggle />
      <NotificationCenter />
    </div>
  );
}
