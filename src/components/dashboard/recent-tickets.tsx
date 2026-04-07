"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";

interface RecentTicket {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTeam: { name: string } | null;
  requester: { displayName: string } | null;
}

interface RecentTicketsProps {
  tickets: RecentTicket[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <h3 className="text-sm font-medium">Recent Tickets</h3>
        <Link href="/tickets" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tickets yet
          </p>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="flex items-start justify-between gap-3 p-2.5 -mx-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{ticket.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {ticket.requester?.displayName ?? "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ticket.assignedTeam?.name ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(ticket.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} compact />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
