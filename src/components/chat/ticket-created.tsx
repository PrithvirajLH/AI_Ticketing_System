"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Plus, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface TicketCreatedProps {
  ticket: {
    id: string;
    number: number;
    displayId: string | null;
    subject: string;
    description?: string;
    priority: string;
    tags?: string[];
  };
  classification?: {
    department: string;
    departmentConfidence: number;
    category: string | null;
    intent: string;
    requestType: string;
    reasoning: string;
    urgency: string;
    routingMethod: string;
  };
  onNewTicket: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-500/10 text-red-600 border-red-500/20",
  P2: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  P3: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  P4: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function TicketCreated({ ticket, classification, onNewTicket }: TicketCreatedProps) {
  return (
    <div className="space-y-4">
      {/* Success header */}
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
        <h2 className="text-lg font-semibold">Ticket Created</h2>
        <p className="text-sm text-muted-foreground">
          Your request has been submitted and routed to the right team.
        </p>
      </div>

      {/* Ticket detail card */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket.displayId ?? `#${ticket.number}`}
            </span>
            <Badge variant="outline" className={PRIORITY_STYLES[ticket.priority] ?? ""}>
              {ticket.priority}
            </Badge>
          </div>

          {/* Subject */}
          <h3 className="font-semibold text-base">{ticket.subject}</h3>

          {/* Description */}
          {ticket.description ? (
            <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
              {ticket.description}
            </p>
          ) : null}

          <Separator />

          {/* Classification details */}
          {classification ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">AI Classification</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {(classification.departmentConfidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">{classification.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Request Type</p>
                  <p className="font-medium">{classification.requestType}</p>
                </div>
                {classification.category ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{classification.category}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-muted-foreground">Urgency</p>
                  <p className={`font-medium ${classification.urgency !== "None" ? "text-orange-600" : ""}`}>
                    {classification.urgency}
                  </p>
                </div>
              </div>

              {classification.reasoning ? (
                <p className="text-xs text-muted-foreground italic">
                  {classification.reasoning}
                </p>
              ) : null}

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                Routed via {classification.routingMethod.replace("_", " ")}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onNewTicket} variant="outline" className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Submit Another Request
        </Button>
        <Link href={`/tickets/${ticket.id}`}>
          <Button>
            View Ticket
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
