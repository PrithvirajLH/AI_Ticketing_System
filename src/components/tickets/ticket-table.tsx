"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { SlaIndicator } from "./sla-indicator";
import { ChevronLeft, ChevronRight, UserPlus, Inbox } from "lucide-react";

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
  selectedIds: Set<string>;
  onPageChange: (page: number) => void;
  onSelectionChange: (ids: Set<string>) => void;
  onQuickAssign: (ticketId: string) => void;
  onTicketClick?: (ticket: TicketRow) => void;
}

function formatDisplayId(id: string | null, number: number): string {
  if (!id) return `#${number}`;
  return id;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

export function TicketTable({
  tickets, isLoading, page, pageSize, total, selectedIds,
  onPageChange, onSelectionChange, onQuickAssign, onTicketClick,
}: TicketTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.has(t.id));

  // Re-render every 60s for time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function toggleAll() {
    onSelectionChange(allSelected ? new Set() : new Set(tickets.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  }

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading tickets...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
        <p className="text-xs text-muted-foreground/60">Try adjusting your filters or create a new request</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[80px]">Priority</TableHead>
            <TableHead className="w-[130px]">Team</TableHead>
            <TableHead className="w-[140px]">Assignee</TableHead>
            <TableHead className="w-[80px]">SLA</TableHead>
            <TableHead className="w-[80px] text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket, index) => {
            const isSelected = selectedIds.has(ticket.id);
            const isUnassigned = !ticket.assignee;

            return (
              <TableRow
                key={ticket.id}
                className={`group cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : index % 2 === 1 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50"}`}
                onClick={() => onTicketClick?.(ticket)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(ticket.id)} />
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-foreground/70 font-medium">
                    {formatDisplayId(ticket.displayId, ticket.number)}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium line-clamp-1 group-hover:underline">{ticket.subject}</span>
                    {ticket.requester ? (
                      <span className="text-xs text-muted-foreground block">{ticket.requester.displayName}</span>
                    ) : null}
                  </div>
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {isUnassigned ? (
                    <div className="relative h-7">
                      <span className="text-sm text-muted-foreground group-hover:invisible">—</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute inset-0 h-7 text-xs invisible group-hover:visible border-dashed border-primary/30 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/50"
                        onClick={() => onQuickAssign(ticket.id)}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Assign me
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(ticket.assignee!.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{ticket.assignee!.displayName}</span>
                    </div>
                  )}
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
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? "default" : "ghost"} size="icon" className="h-8 w-8 text-xs" onClick={() => onPageChange(p)}>
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
