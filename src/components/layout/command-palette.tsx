"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MessageSquarePlus, Inbox, LayoutDashboard, BarChart3, Settings, Search, Bug,
} from "lucide-react";

interface CommandItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  { label: "New Request", href: "/submit", icon: <MessageSquarePlus className="h-4 w-4" />, keywords: ["new", "submit", "create", "ticket"] },
  { label: "All Tickets", href: "/tickets", icon: <Inbox className="h-4 w-4" />, keywords: ["tickets", "queue", "list"] },
  { label: "Unassigned Tickets", href: "/tickets?scope=unassigned", icon: <Inbox className="h-4 w-4" />, keywords: ["unassigned", "open"] },
  { label: "My Tickets", href: "/tickets?scope=assigned", icon: <Inbox className="h-4 w-4" />, keywords: ["my", "assigned", "mine"] },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, keywords: ["dashboard", "overview", "kpi"] },
  { label: "Reports", href: "/reports", icon: <BarChart3 className="h-4 w-4" />, keywords: ["reports", "analytics", "charts"] },
  { label: "Admin — Teams", href: "/admin/teams", icon: <Settings className="h-4 w-4" />, keywords: ["admin", "teams", "manage"] },
  { label: "Admin — Routing", href: "/admin/routing", icon: <Settings className="h-4 w-4" />, keywords: ["routing", "rules", "keywords"] },
  { label: "Admin — Categories", href: "/admin/categories", icon: <Settings className="h-4 w-4" />, keywords: ["categories", "classify"] },
  { label: "Admin — SLA", href: "/admin/sla", icon: <Settings className="h-4 w-4" />, keywords: ["sla", "policy", "breach"] },
  { label: "Admin — Automation", href: "/admin/automation", icon: <Settings className="h-4 w-4" />, keywords: ["automation", "rules", "trigger"] },
  { label: "Admin — Users", href: "/admin/users", icon: <Settings className="h-4 w-4" />, keywords: ["users", "roles", "permissions"] },
  { label: "Pipeline Debug", href: "/debug", icon: <Bug className="h-4 w-4" />, keywords: ["debug", "pipeline", "ai", "test"] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = query
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : COMMANDS;

  // Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-w-md">
        <div className="flex items-center gap-2 px-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="border-0 shadow-none focus-visible:ring-0 h-11"
            autoFocus
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                  index === selectedIndex ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 px-3 py-2 border-t text-[10px] text-muted-foreground">
          <span><kbd className="bg-muted px-1 py-0.5 rounded font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="bg-muted px-1 py-0.5 rounded font-mono">↵</kbd> select</span>
          <span><kbd className="bg-muted px-1 py-0.5 rounded font-mono">esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
