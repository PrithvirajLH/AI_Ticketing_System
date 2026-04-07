"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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

export function TicketFilters({ filters, teams, onFilterChange }: TicketFiltersProps) {
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
    </div>
  );
}
