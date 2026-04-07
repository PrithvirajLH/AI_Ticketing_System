"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus } from "lucide-react";

interface TicketCreatedProps {
  ticket: {
    number: number;
    displayId: string | null;
    subject: string;
    priority: string;
  };
  onNewTicket: () => void;
}

export function TicketCreated({ ticket, onNewTicket }: TicketCreatedProps) {
  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="pt-6 text-center space-y-4">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />

        <div>
          <h3 className="text-lg font-medium">Ticket Created</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your request has been submitted and routed to the right team.
          </p>
        </div>

        <div className="bg-background rounded-lg p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-medium">
              {ticket.displayId ?? `#${ticket.number}`}
            </span>
            <Badge variant="outline">{ticket.priority}</Badge>
          </div>
          <p className="text-sm">{ticket.subject}</p>
        </div>

        <Button onClick={onNewTicket} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Submit Another Request
        </Button>
      </CardContent>
    </Card>
  );
}
