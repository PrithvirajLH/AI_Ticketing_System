"use client";

import { ArrowRight, UserPlus, UserMinus, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";

interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  createdBy: { displayName: string } | null;
}

interface ActivityTimelineProps {
  events: Event[];
}

function getEventIcon(type: string) {
  switch (type) {
    case "STATUS_CHANGED": return <ArrowRight className="h-3.5 w-3.5" />;
    case "TICKET_ASSIGNED": return <UserPlus className="h-3.5 w-3.5" />;
    case "TICKET_UNASSIGNED": return <UserMinus className="h-3.5 w-3.5" />;
    case "SLA_BREACHED": return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    case "TICKET_CREATED": return <RefreshCw className="h-3.5 w-3.5" />;
    case "MESSAGE_ADDED": return <MessageSquare className="h-3.5 w-3.5" />;
    default: return <ArrowRight className="h-3.5 w-3.5" />;
  }
}

function describeEvent(event: Event): string {
  const actor = event.createdBy?.displayName ?? "System";
  const p = event.payload ?? {};

  switch (event.type) {
    case "STATUS_CHANGED":
      return `${actor} changed status from ${p.from} to ${p.to}`;
    case "TICKET_ASSIGNED":
      return `${actor} assigned the ticket`;
    case "TICKET_UNASSIGNED":
      return `${actor} unassigned the ticket`;
    case "TICKET_CREATED":
      return `${actor} created the ticket`;
    case "MESSAGE_ADDED":
      return `${actor} added a ${p.messageType === "INTERNAL" ? "note" : "reply"}`;
    case "SLA_BREACHED":
      return "SLA breached";
    default:
      return `${actor}: ${event.type}`;
  }
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

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <span className="mt-0.5 shrink-0">{getEventIcon(event.type)}</span>
          <span className="flex-1">{describeEvent(event)}</span>
          <span className="shrink-0">{timeAgo(event.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
