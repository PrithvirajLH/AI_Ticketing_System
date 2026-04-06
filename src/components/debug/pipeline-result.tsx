"use client";

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
    created: "bg-green-950 border-green-700 text-green-300",
    needs_clarification: "bg-yellow-950 border-yellow-700 text-yellow-300",
    error: "bg-red-950 border-red-700 text-red-300",
  };

  const statusLabels = {
    created: "TICKET CREATED",
    needs_clarification: "NEEDS CLARIFICATION",
    error: "PIPELINE ERROR",
  };

  return (
    <div className={`border rounded p-4 space-y-2 ${statusStyles[finalStatus]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{statusLabels[finalStatus]}</span>
        <span className="text-xs font-mono opacity-75">
          Total: {(totalLatencyMs / 1000).toFixed(1)}s
        </span>
      </div>

      {finalStatus === "created" && ticket && (
        <div className="text-xs space-y-1 mt-2">
          <div><span className="opacity-60">Subject:</span> {ticket.subject as string}</div>
          <div><span className="opacity-60">Priority:</span> {ticket.priority as string}</div>
          <div><span className="opacity-60">Team:</span> {ticket.assignedTeamId as string}</div>
          <div><span className="opacity-60">Display ID:</span> {ticket.displayId as string}</div>
        </div>
      )}

      {finalStatus === "needs_clarification" && clarifyingQuestion && (
        <div className="text-sm mt-2">
          &ldquo;{clarifyingQuestion}&rdquo;
        </div>
      )}

      {finalStatus === "error" && errorMessage && (
        <div className="text-xs font-mono mt-2">{errorMessage}</div>
      )}
    </div>
  );
}
