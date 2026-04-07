"use client";

import { StatusBadge } from "../status-badge";
import { PriorityBadge } from "../priority-badge";
import { User, Users, Clock, ChevronRight, MessageSquareText } from "lucide-react";
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

const PRIORITY_ACCENT: Record<string, string> = {
  P1: "border-l-red-500",
  P2: "border-l-orange-400",
  P3: "border-l-blue-400",
  P4: "border-l-gray-300",
};

export function TicketHeader({ ticket, rawText }: TicketHeaderProps) {
  const accent = PRIORITY_ACCENT[ticket.priority] ?? "border-l-gray-300";

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/tickets" className="hover:text-foreground transition-colors">
          Tickets
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-mono text-foreground font-medium">
          {ticket.displayId ?? `#${ticket.number}`}
        </span>
      </nav>

      {/* Title card with priority accent */}
      <div className={`border-l-4 ${accent} pl-4 space-y-2`}>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-muted-foreground">via {ticket.channel}</span>
        </div>
        <h1>{ticket.subject}</h1>
      </div>

      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm bg-muted/30 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">Requester</span>
          <span className="font-medium">{ticket.requester?.displayName ?? "Unknown"}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground">Team</span>
          <span className="font-medium">{ticket.assignedTeam?.name ?? "—"}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4 text-green-500" />
          <span>
            {(() => {
              const raw = ticket.createdAt;
              const date = new Date(raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z");
              return `${date.toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })} at ${date.toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit", timeZoneName: "short",
              })}`;
            })()}
          </span>
        </div>
      </div>

      {/* Original Request */}
      {rawText ? (
        <Card className="border-blue-200/50 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquareText className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-xs font-medium text-blue-600">Original Request</p>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{rawText.trim()}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
