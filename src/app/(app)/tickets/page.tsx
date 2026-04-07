"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFilters } from "@/components/tickets/ticket-filters";

interface TicketRow {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  dueAt: string | null;
  firstResponseDueAt: string | null;
  firstResponseAt: string | null;
  requester: { displayName: string } | null;
  assignee: { displayName: string } | null;
  assignedTeam: { name: string } | null;
  category: { name: string } | null;
}

interface TeamOption {
  id: string;
  name: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [scope, setScope] = useState("all");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    teamId: "",
    search: "",
  });

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        setTeams(data.teams ?? []);
      } catch {
        // silently fail
      }
    }
    loadTeams();
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("scope", scope);
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
      if (filters.teamId && filters.teamId !== "all") params.set("teamId", filters.teamId);
      if (filters.search) params.set("q", filters.search);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [scope, page, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [scope, filters.status, filters.priority, filters.teamId]);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  function handleFilterChange(key: string, value: string) {
    if (key === "search") {
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
      }, 400);
      setSearchTimeout(timeout);
      setFilters((prev) => ({ ...prev, [key]: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <TooltipProvider>
      <div className="h-full overflow-y-auto">
        <div className="py-6 px-6 space-y-5">
          <div>
            <h1>Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all support requests
            </p>
          </div>

          <Tabs value={scope} onValueChange={setScope}>
            <TabsList>
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            </TabsList>
          </Tabs>

          <TicketFilters
            filters={filters}
            teams={teams}
            onFilterChange={handleFilterChange}
          />

          <div className="border rounded-lg bg-card">
            <TicketTable
              tickets={tickets}
              isLoading={isLoading}
              page={page}
              pageSize={20}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
