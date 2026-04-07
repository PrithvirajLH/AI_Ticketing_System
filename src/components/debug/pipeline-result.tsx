"use client";

import { Card, CardContent } from "@/components/ui/card";

interface PipelineResultProps {
  finalStatus: "created" | "needs_clarification" | "error";
  totalLatencyMs: number;
  ticket?: Record<string, unknown>;
  clarifyingQuestion?: string;
  errorMessage?: string;
}

export function PipelineResult({
  finalStatus,
  totalLatencyMs,
  ticket,
  clarifyingQuestion,
  errorMessage,
}: PipelineResultProps) {
  const statusStyles = {
    created: "border-green-500/30 bg-green-500/5",
    needs_clarification: "border-yellow-500/30 bg-yellow-500/5",
    error: "border-red-500/30 bg-red-500/5",
  };

  const statusLabels = {
    created: "TICKET CREATED",
    needs_clarification: "NEEDS CLARIFICATION",
    error: "PIPELINE ERROR",
  };

  const statusTextColors = {
    created: "text-green-700",
    needs_clarification: "text-yellow-700",
    error: "text-red-700",
  };

  return (
    <Card className={statusStyles[finalStatus]}>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`font-semibold text-sm ${statusTextColors[finalStatus]}`}>
            {statusLabels[finalStatus]}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Total: {(totalLatencyMs / 1000).toFixed(1)}s
          </span>
        </div>

        {finalStatus === "created" && ticket ? (
          <div className="text-sm space-y-1 mt-2">
            <div><span className="text-muted-foreground">Subject:</span> {ticket.subject as string}</div>
            <div><span className="text-muted-foreground">Priority:</span> {ticket.priority as string}</div>
            <div><span className="text-muted-foreground">Team:</span> {ticket.assignedTeamId as string}</div>
            <div><span className="text-muted-foreground">Display ID:</span> {ticket.displayId as string}</div>
          </div>
        ) : null}

        {finalStatus === "needs_clarification" && clarifyingQuestion ? (
          <p className="text-sm mt-2">&ldquo;{clarifyingQuestion}&rdquo;</p>
        ) : null}

        {finalStatus === "error" && errorMessage ? (
          <p className="text-xs font-mono mt-2">{errorMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
