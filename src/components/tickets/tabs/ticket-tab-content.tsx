"use client";

import { useCallback, useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketHeader } from "@/components/tickets/detail/ticket-header";
import { MessageList } from "@/components/tickets/detail/message-list";
import { MessageComposer } from "@/components/tickets/detail/message-composer";
import { ActivityTimeline } from "@/components/tickets/detail/activity-timeline";
import { TicketActions } from "@/components/tickets/detail/ticket-actions";
import { AiSummary } from "@/components/tickets/detail/ai-summary";
import { useMemo } from "react";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface TicketTabContentProps {
  ticketId: string;
}

export function TicketTabContent({ ticketId }: TicketTabContentProps) {
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
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
    setIsLoading(true);
    refreshAll().then(() => setIsLoading(false));
  }, [refreshAll]);

  const { aiAnalysis, rawText, tags } = useMemo(() => {
    const createdEvent = events.find((e) => e.type === "TICKET_CREATED");
    const payload = createdEvent?.payload as {
      aiAnalysis?: Record<string, unknown>;
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  const t = ticket as {
    id: string;
    number: number;
    displayId: string | null;
    subject: string;
    description: string;
    status: string;
    priority: string;
    channel: string;
    createdAt: string;
    assigneeId: string | null;
    assignedTeamId: string | null;
    requester: { displayName: string; email: string; department: string | null } | null;
    assignee: { displayName: string } | null;
    assignedTeam: { name: string } | null;
    category: { name: string } | null;
  };

  return (
    <TooltipProvider>
      <div className="h-full overflow-y-auto">
        <div className="py-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TicketHeader ticket={t} rawText={rawText} />
              <Separator />
              <div className="rounded-xl border bg-muted/20 overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-card">
                  <h2 className="text-sm font-medium">Conversation</h2>
                </div>
                <div className="px-4 min-h-[200px]">
                  <MessageList messages={messages as never[]} />
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
            <div className="space-y-4">
              <AiSummary
                analysis={aiAnalysis as never}
                tags={tags}
              />
              <TicketActions
                ticketId={ticketId}
                currentStatus={t.status}
                assigneeId={t.assigneeId}
                assigneeName={t.assignee?.displayName ?? null}
                teamId={t.assignedTeamId}
                teamName={t.assignedTeam?.name ?? null}
                onChanged={refreshAll}
              />
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-medium">Activity</h3>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline events={events as never[]} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
