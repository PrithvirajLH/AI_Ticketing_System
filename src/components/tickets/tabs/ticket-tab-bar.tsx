"use client";

import { useTicketTabs, type TicketTab } from "./ticket-tabs-context";
import { X, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function TicketTabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, isQueueView, showQueue } = useTicketTabs();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center border-b bg-muted/30 overflow-x-auto">
      {/* Queue tab — always first */}
      <button
        onClick={showQueue}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-r border-border shrink-0 transition-colors",
          isQueueView
            ? "bg-background text-foreground border-b-2 border-b-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Inbox className="h-3.5 w-3.5" />
        Queue
      </button>

      {/* Open ticket tabs */}
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1 pl-3 pr-1 py-2 text-sm border-r border-border shrink-0 transition-colors max-w-[220px]",
              isActive
                ? "bg-background text-foreground border-b-2 border-b-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <button
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 min-w-0 flex-1"
            >
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {tab.displayId}
              </span>
              <span className="truncate text-xs">
                {tab.subject}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
