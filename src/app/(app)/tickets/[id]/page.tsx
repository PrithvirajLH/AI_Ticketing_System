"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketHeader } from "@/components/tickets/detail/ticket-header";
import { MessageList } from "@/components/tickets/detail/message-list";
import { MessageComposer } from "@/components/tickets/detail/message-composer";
import { ActivityTimeline } from "@/components/tickets/detail/activity-timeline";
import { TicketActions } from "@/components/tickets/detail/ticket-actions";
import { AiSummary } from "@/components/tickets/detail/ai-summary";
import { SlaCard } from "@/components/tickets/detail/sla-card";
import { CsatWidget } from "@/components/tickets/detail/csat-widget";
import { FollowersButton } from "@/components/tickets/detail/followers-button";
import { AttachmentsCard } from "@/components/tickets/detail/attachments-card";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface TicketData {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  channel: string;
  createdAt: string;
  requesterId: string;
  assigneeId: string | null;
  assignedTeamId: string | null;
  requester: { displayName: string; email: string; department: string | null } | null;
  assignee: { displayName: string } | null;
  assignedTeam: { name: string } | null;
  category: { name: string } | null;
}

interface Message {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string; role: string } | null;
}

interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  createdBy: { displayName: string } | null;
}

interface AiAnalysis {
  what: string;
  who: string;
  context: string;
  urgency: string;
  intent: string;
  requestType: string;
  department: string;
  departmentConfidence: number;
  category: string | null;
  reasoning: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    if (data.ticket) setTicket(data.ticket);
  }, [ticketId]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [ticketId]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/events`);
    const data = await res.json();
    setEvents(data.events ?? []);
  }, [ticketId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTicket(), fetchMessages(), fetchEvents()]);
  }, [fetchTicket, fetchMessages, fetchEvents]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await refreshAll();
      setIsLoading(false);
    }
    load();
  }, [refreshAll]);

  // Extract AI analysis and raw text from the TICKET_CREATED event
  const { aiAnalysis, rawText, tags } = useMemo(() => {
    const createdEvent = events.find((e) => e.type === "TICKET_CREATED");
    const payload = createdEvent?.payload as {
      aiAnalysis?: AiAnalysis;
      rawText?: string;
      tags?: string[];
    } | null;

    return {
      aiAnalysis: payload?.aiAnalysis ?? null,
      rawText: payload?.rawText ?? null,
      tags: payload?.tags ?? [],
    };
  }, [events]);

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full overflow-y-auto">
        <div className="py-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content — 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <TicketHeader ticket={ticket} rawText={rawText} />
                </div>
                <FollowersButton ticketId={ticketId} />
              </div>

              <Separator />

              <div className="rounded-xl border bg-muted/20 overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-card">
                  <h2 className="text-sm font-medium">Conversation</h2>
                </div>
                <div className="px-4 min-h-[200px]">
                  <MessageList messages={messages} />
                </div>
                <div className="px-3 pb-3 pt-1">
                  <MessageComposer
                    ticketId={ticketId}
                    authorId={CURRENT_USER_ID}
                    onMessageSent={refreshAll}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-4">
              {/* AI Summary */}
              <AiSummary analysis={aiAnalysis} tags={tags} />

              {/* SLA */}
              <SlaCard ticketId={ticketId} status={ticket.status} />

              {/* Attachments */}
              <AttachmentsCard ticketId={ticketId} />

              {/* Actions */}
              <TicketActions
                ticketId={ticketId}
                currentStatus={ticket.status}
                currentPriority={ticket.priority}
                assigneeId={ticket.assigneeId}
                assigneeName={ticket.assignee?.displayName ?? null}
                teamId={ticket.assignedTeamId}
                teamName={ticket.assignedTeam?.name ?? null}
                onChanged={refreshAll}
              />

              {/* CSAT */}
              <CsatWidget ticketId={ticketId} status={ticket.status} requesterId={ticket.requesterId ?? ""} />

              {/* Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium">Activity</h3>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline events={events} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
