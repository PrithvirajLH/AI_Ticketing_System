"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, BookmarkPlus, Bookmark } from "lucide-react";

interface TicketFiltersProps {
  filters: {
    status: string;
    priority: string;
    teamId: string;
    search: string;
  };
  teams: { id: string; name: string }[];
  onFilterChange: (key: string, value: string) => void;
}

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_ON_REQUESTER", label: "Waiting on Requester" },
  { value: "WAITING_ON_VENDOR", label: "Waiting on Vendor" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "P1", label: "P1 Urgent" },
  { value: "P2", label: "P2 High" },
  { value: "P3", label: "P3 Normal" },
  { value: "P4", label: "P4 Low" },
];

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string>;
}

export function TicketFilters({ filters, teams, onFilterChange }: TicketFiltersProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/saved-views?userId=${CURRENT_USER_ID}`)
      .then((r) => r.json())
      .then((d) => setSavedViews(d.views ?? []))
      .catch(() => {});
  }, []);

  async function saveCurrentView() {
    if (!viewName.trim()) return;
    setIsSaving(true);
    await fetch("/api/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: viewName.trim(), filters, userId: CURRENT_USER_ID }),
    });
    const res = await fetch(`/api/saved-views?userId=${CURRENT_USER_ID}`);
    const data = await res.json();
    setSavedViews(data.views ?? []);
    setViewName("");
    setSaveDialogOpen(false);
    setIsSaving(false);
  }

  function loadView(view: SavedView) {
    const f = view.filters;
    if (f.status) onFilterChange("status", f.status);
    if (f.priority) onFilterChange("priority", f.priority);
    if (f.teamId) onFilterChange("teamId", f.teamId);
    if (f.search) onFilterChange("search", f.search);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) => onFilterChange("status", v ?? "")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value || "all"}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => onFilterChange("priority", v ?? "")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value || "all"}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.teamId}
        onValueChange={(v) => onFilterChange("teamId", v ?? "")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Saved Views */}
      {savedViews.length > 0 ? (
        <select
          onChange={(e) => {
            const view = savedViews.find((v) => v.id === e.target.value);
            if (view) loadView(view);
            e.target.value = "";
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>Saved Views</option>
          {savedViews.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      ) : null}

      <Button variant="ghost" size="sm" className="h-9" onClick={() => setSaveDialogOpen(true)} title="Save current filters as view">
        <BookmarkPlus className="h-4 w-4" />
      </Button>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label htmlFor="view-name" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              View name
            </label>
            <Input
              id="view-name"
              ref={nameInputRef}
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="e.g. My urgent tickets"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") saveCurrentView(); }}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Saves your current filters (status, priority, team) for quick access.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setSaveDialogOpen(false); setViewName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveCurrentView} disabled={!viewName.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save View"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
