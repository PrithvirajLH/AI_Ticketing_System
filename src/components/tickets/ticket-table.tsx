"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { SlaIndicator } from "./sla-indicator";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

interface TicketTableProps {
  tickets: TicketRow[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function formatDisplayId(id: string | null, number: number): string {
  if (!id) return `#${number}`;
  // Shorten long IDs: "MEDICAID-PENDING-0004" → "MP-0004"
  const parts = id.split("-");
  if (parts.length > 2) {
    const initials = parts.slice(0, -1).map((p) => p[0]).join("");
    return `${initials}-${parts[parts.length - 1]}`;
  }
  return id;
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

export function TicketTable({ tickets, isLoading, page, pageSize, total, onPageChange }: TicketTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Loading tickets...
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No tickets found
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[80px]">Priority</TableHead>
            <TableHead className="w-[140px]">Team</TableHead>
            <TableHead className="w-[130px]">Assignee</TableHead>
            <TableHead className="w-[90px]">SLA</TableHead>
            <TableHead className="w-[80px] text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="group cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link href={`/tickets/${ticket.id}`} className="font-mono text-xs text-muted-foreground hover:text-foreground">
                  {formatDisplayId(ticket.displayId, ticket.number)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/tickets/${ticket.id}`} className="block group-hover:underline">
                  <span className="font-medium line-clamp-1">{ticket.subject}</span>
                  {ticket.requester ? (
                    <span className="text-xs text-muted-foreground">{ticket.requester.displayName}</span>
                  ) : null}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={ticket.priority} compact />
              </TableCell>
              <TableCell className="text-sm">
                {ticket.assignedTeam?.name ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-sm">
                {ticket.assignee?.displayName ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <SlaIndicator
                  dueAt={ticket.dueAt}
                  firstResponseDueAt={ticket.firstResponseDueAt}
                  firstResponseAt={ticket.firstResponseAt}
                  status={ticket.status}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground text-right">
                {timeAgo(ticket.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
