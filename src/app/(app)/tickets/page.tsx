"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TicketTable } from "@/components/tickets/ticket-table";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { BulkActionsBar } from "@/components/tickets/bulk-actions-bar";
import { TicketStats } from "@/components/tickets/ticket-stats";
import { TicketTabsProvider, useTicketTabs } from "@/components/tickets/tabs/ticket-tabs-context";
import { TicketTabBar } from "@/components/tickets/tabs/ticket-tab-bar";
import { TicketTabContent } from "@/components/tickets/tabs/ticket-tab-content";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

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

function TicketsContent() {
  const { tabs, activeTabId, isQueueView, openTab } = useTicketTabs();
  const searchParams = useSearchParams();
  const initialScope = searchParams.get("scope") ?? "all";

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [scope, setScope] = useState(initialScope);

  // Sync scope when URL changes (e.g. clicking sidebar Unassigned link)
  useEffect(() => {
    const urlScope = searchParams.get("scope") ?? "all";
    setScope(urlScope);
  }, [searchParams]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
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
      } catch { /* ignore */ }
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

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [scope, filters.status, filters.priority, filters.teamId]);
  useEffect(() => { setSelectedIds(new Set()); }, [tickets]);

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

  function handleTicketClick(ticket: TicketRow) {
    openTab({
      id: ticket.id,
      displayId: ticket.displayId ?? `#${ticket.number}`,
      subject: ticket.subject,
    });
  }

  async function handleQuickAssign(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: CURRENT_USER_ID, userId: CURRENT_USER_ID }),
    });
    fetchTickets();
  }

  async function handleBulkAssign() {
    setIsProcessing(true);
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/tickets/${id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId: CURRENT_USER_ID, userId: CURRENT_USER_ID }),
        })
      )
    );
    setSelectedIds(new Set());
    setIsProcessing(false);
    fetchTickets();
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <TicketTabBar />

      {/* Content — either queue or ticket detail */}
      {isQueueView ? (
        <div className="flex-1 overflow-y-auto">
          <div className="py-6 px-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1>Tickets</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and track all support requests
                </p>
              </div>
            </div>

            <TicketStats />

            <TicketFilters
              filters={filters}
              teams={teams}
              onFilterChange={handleFilterChange}
            />

            <BulkActionsBar
              selectedCount={selectedIds.size}
              onAssignToMe={handleBulkAssign}
              onClear={() => setSelectedIds(new Set())}
              isProcessing={isProcessing}
            />

            <div className="border rounded-lg bg-card">
              <TicketTable
                tickets={tickets}
                isLoading={isLoading}
                page={page}
                pageSize={20}
                total={total}
                selectedIds={selectedIds}
                onPageChange={setPage}
                onSelectionChange={setSelectedIds}
                onQuickAssign={handleQuickAssign}
                onTicketClick={handleTicketClick}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {activeTabId ? <TicketTabContent ticketId={activeTabId} /> : null}
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <TooltipProvider>
      <TicketTabsProvider>
        <Suspense>
          <TicketsContent />
        </Suspense>
      </TicketTabsProvider>
    </TooltipProvider>
  );
}
