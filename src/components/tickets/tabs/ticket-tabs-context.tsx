"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface TicketTab {
  id: string;
  displayId: string;
  subject: string;
}

interface TicketTabsContextType {
  tabs: TicketTab[];
  activeTabId: string | null;
  openTab: (tab: TicketTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  isQueueView: boolean;
  showQueue: () => void;
}

const TicketTabsContext = createContext<TicketTabsContextType | null>(null);

export function useTicketTabs() {
  const ctx = useContext(TicketTabsContext);
  if (!ctx) throw new Error("useTicketTabs must be used inside TicketTabsProvider");
  return ctx;
}

export function TicketTabsProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<TicketTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((tab: TicketTab) => {
    setTabs((prev) => {
      if (prev.some((t) => t.id === tab.id)) return prev;
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      return next;
    });
    setActiveTabId((current) => {
      if (current !== id) return current;
      // Switch to previous tab or queue
      const remaining = tabs.filter((t) => t.id !== id);
      return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
    });
  }, [tabs]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const showQueue = useCallback(() => {
    setActiveTabId(null);
  }, []);

  const isQueueView = activeTabId === null;

  return (
    <TicketTabsContext.Provider
      value={{ tabs, activeTabId, openTab, closeTab, setActiveTab, isQueueView, showQueue }}
    >
      {children}
    </TicketTabsContext.Provider>
  );
}
