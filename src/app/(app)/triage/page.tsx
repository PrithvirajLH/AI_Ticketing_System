"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";

interface TicketCard {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  status: string;
  priority: string;
  requester: { displayName: string } | null;
  assignee: { displayName: string } | null;
  assignedTeam: { name: string } | null;
}

const COLUMNS = [
  { status: "NEW", label: "New", color: "border-t-blue-500" },
  { status: "TRIAGED", label: "Triaged", color: "border-t-purple-500" },
  { status: "ASSIGNED", label: "Assigned", color: "border-t-indigo-500" },
  { status: "IN_PROGRESS", label: "In Progress", color: "border-t-yellow-500" },
  { status: "WAITING_ON_REQUESTER", label: "Waiting (Requester)", color: "border-t-orange-400" },
  { status: "WAITING_ON_VENDOR", label: "Waiting (Vendor)", color: "border-t-orange-400" },
  { status: "REOPENED", label: "Reopened", color: "border-t-red-500" },
  { status: "RESOLVED", label: "Resolved", color: "border-t-green-500" },
];

export default function TriagePage() {
  const [tickets, setTickets] = useState<TicketCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets?pageSize=100")
      .then((r) => r.json())
      .then((data) => { setTickets(data.tickets ?? []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  async function handleDrop(ticketId: string, newStatus: string) {
    await fetch(`/api/tickets/${ticketId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, userId: "a89f9497-b330-47ad-9136-65a5e4e5abd8" }),
    });

    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading triage board...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="py-6 px-6">
        <h1>Triage Board</h1>
        <p className="text-muted-foreground mt-1">Drag tickets between columns to change status</p>
      </div>

      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <div className="flex gap-4 min-w-max h-full">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`w-72 flex flex-col rounded-lg border border-t-4 ${col.color} bg-muted/20`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const ticketId = e.dataTransfer.getData("ticketId");
                  if (ticketId) handleDrop(ticketId, col.status);
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="text-xs">{colTickets.length}</Badge>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("ticketId", ticket.id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                    >
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ticket.displayId ?? `#${ticket.number}`}
                          </span>
                          <PriorityBadge priority={ticket.priority} compact />
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{ticket.subject}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{ticket.requester?.displayName ?? "Unknown"}</span>
                          <span>{ticket.assignee?.displayName ?? "Unassigned"}</span>
                        </div>
                        {/* Hover actions */}
                        {!ticket.assignee ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetch(`/api/tickets/${ticket.id}/assign`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ assigneeId: "a89f9497-b330-47ad-9136-65a5e4e5abd8", userId: "a89f9497-b330-47ad-9136-65a5e4e5abd8" }),
                              }).then(() => setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, assignee: { displayName: "Me" } } : t)));
                            }}
                            className="w-full text-[10px] text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-center pt-1"
                          >
                            Assign to me
                          </button>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}

                  {colTickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No tickets</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
