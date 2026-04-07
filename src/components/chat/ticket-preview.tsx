"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Pencil, RotateCcw } from "lucide-react";

interface TicketPreviewProps {
  ticket: {
    subject: string;
    description: string;
    priority: string;
    channel: string;
    assignedTeamId: string;
    categoryId: string | null;
    displayId: string;
    tags: string[];
  };
  teamName?: string;
  categoryName?: string;
  confidence: number;
  onConfirm: () => void;
  onRetry: () => void;
  isSubmitting: boolean;
}

const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-500/10 text-red-500 border-red-500/20",
  P2: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  P3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  P4: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export function TicketPreview({
  ticket,
  teamName,
  categoryName,
  confidence,
  onConfirm,
  onRetry,
  isSubmitting,
}: TicketPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Ticket Preview</h3>
            <Badge variant="outline">
              {(confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
          <Badge
            variant="outline"
            className={`text-sm ${PRIORITY_STYLES[ticket.priority] ?? ""}`}
          >
            {ticket.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-base font-semibold">{ticket.subject}</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-5">
            {ticket.description}
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Team</span>
            <p className="font-medium">{teamName ?? ticket.assignedTeamId}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Display ID</span>
            <p className="font-medium font-mono">{ticket.displayId}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Channel</span>
            <p className="font-medium">{ticket.channel}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Category</span>
            <p className="font-medium">{categoryName ?? ticket.categoryId ?? "—"}</p>
          </div>
        </div>

        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ticket.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Pencil className="h-4 w-4 animate-pulse" />
              Creating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Submit Ticket
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isSubmitting}
          size="lg"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      </CardFooter>
    </Card>
  );
}
