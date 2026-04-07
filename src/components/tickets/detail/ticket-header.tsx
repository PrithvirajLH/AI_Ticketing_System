"use client";

import { StatusBadge } from "../status-badge";
import { PriorityBadge } from "../priority-badge";
import { User, Users, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TicketHeaderProps {
  ticket: {
    number: number;
    displayId: string | null;
    subject: string;
    status: string;
    priority: string;
    channel: string;
    createdAt: string;
    requester: { displayName: string; email: string; department: string | null } | null;
    assignedTeam: { name: string } | null;
  };
  rawText: string | null;
}

export function TicketHeader({ ticket, rawText }: TicketHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/tickets" className="hover:text-foreground transition-colors">
          Tickets
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-mono text-foreground">
          {ticket.displayId ?? `#${ticket.number}`}
        </span>
      </nav>

      {/* Title + Badges */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1>{ticket.subject}</h1>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Requester</span>
          <span className="font-medium">
            {ticket.requester?.displayName ?? "Unknown"}
          </span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Team</span>
          <span className="font-medium">{ticket.assignedTeam?.name ?? "—"}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {new Date(ticket.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {new Date(ticket.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span>via {ticket.channel}</span>
        </div>
      </div>

      {/* Original Request */}
      {rawText ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Original Request</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {rawText.trim()}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
