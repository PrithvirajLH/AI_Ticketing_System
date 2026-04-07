"use client";

import { useState } from "react";

interface StepData {
  step: number;
  name: string;
  agentName: string;
  input: string;
  rawOutput: string;
  parsed: unknown;
  toolsCalled: string[];
  latencyMs: number;
  status: "success" | "error";
  error?: string;
}

interface StepCardProps {
  data: StepData;
}

const STEP_COLORS: Record<number, string> = {
  1: "border-purple-500",
  2: "border-blue-500",
  3: "border-yellow-500",
  4: "border-green-500",
  5: "border-cyan-500",
};

const STEP_LABELS: Record<number, string> = {
  1: "Intent Extraction",
  2: "Dept Classification",
  3: "Confidence Gate",
  4: "Ticket Generation",
  5: "Save to Database",
};

export function StepCard({ data }: StepCardProps) {
  const [expandedInput, setExpandedInput] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState(false);

  const borderColor = STEP_COLORS[data.step] ?? "border-gray-500";
  const isError = data.status === "error";
  const hasTools = data.toolsCalled.length > 0;
  const hasParsed = data.parsed !== null && data.parsed !== undefined;

  return (
    <div className={`border-l-4 ${isError ? "border-red-500" : borderColor} bg-card rounded-r p-4 space-y-3 border border-l-4 border-border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-muted text-muted-foreground text-xs font-mono px-2 py-1 rounded">
            Step {data.step}
          </span>
          <h3 className="font-medium text-sm">
            {STEP_LABELS[data.step] ?? data.name}
          </h3>
          <span className="text-muted-foreground text-xs font-mono">
            {data.agentName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasTools ? (
            <span className="bg-blue-500/10 text-blue-600 text-xs px-2 py-0.5 rounded">
              {data.toolsCalled.length} tool{data.toolsCalled.length > 1 ? "s" : ""}
            </span>
          ) : null}
          <span className={`text-xs font-mono ${data.latencyMs > 5000 ? "text-yellow-400" : "text-muted-foreground"}`}>
            {(data.latencyMs / 1000).toFixed(1)}s
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${isError ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
            {isError ? "FAIL" : "OK"}
          </span>
        </div>
      </div>

      {isError && data.error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-600 text-xs font-mono">
          {data.error}
        </div>
      ) : null}

      {hasTools ? (
        <div className="flex gap-1 flex-wrap">
          {data.toolsCalled.map((tool, i) => (
            <span key={i} className="bg-blue-500/10 text-blue-600 text-xs font-mono px-2 py-0.5 rounded">
              {tool}()
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <button
          onClick={() => setExpandedInput(!expandedInput)}
          className="text-xs text-muted-foreground hover:text-gray-200 flex items-center gap-1"
        >
          <span>{expandedInput ? "▼" : "▶"}</span>
          <span>Input to Agent</span>
        </button>
        {expandedInput ? (
          <pre className="mt-1 bg-muted rounded p-2 text-xs text-muted-foreground overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
            {data.input}
          </pre>
        ) : null}
      </div>

      {hasParsed ? (
        <div>
          <button
            onClick={() => setExpandedOutput(!expandedOutput)}
            className="text-xs text-muted-foreground hover:text-gray-200 flex items-center gap-1"
          >
            <span>{expandedOutput ? "▼" : "▶"}</span>
            <span>Agent Response (parsed)</span>
          </button>
          {expandedOutput ? (
            <pre className="mt-1 bg-muted rounded p-2 text-xs text-green-700 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
              {JSON.stringify(data.parsed, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}

      {!isError && hasParsed ? <StepSummary step={data.step} parsed={data.parsed} /> : null}
    </div>
  );
}

function StepSummary({ step, parsed }: { step: number; parsed: unknown }) {
  const d = parsed as Record<string, unknown>;

  if (step === 1) {
    const urgency = d.urgencySignals as string[] | undefined;
    return (
      <div className="text-xs space-y-1">
        <div><span className="text-muted-foreground">Intent:</span> {d.intent as string}</div>
        <div><span className="text-muted-foreground">Type:</span> <span className="text-purple-400">{d.requestType as string}</span></div>
        {urgency && urgency.length > 0 ? (
          <div><span className="text-muted-foreground">Urgency:</span> <span className="text-yellow-400">{urgency.join(", ")}</span></div>
        ) : null}
        {d.affectedSystem ? (
          <div><span className="text-muted-foreground">System:</span> {d.affectedSystem as string}</div>
        ) : null}
      </div>
    );
  }

  if (step === 2) {
    const dept = d.department as Record<string, unknown>;
    const cat = d.category as Record<string, unknown> | null;
    const tags = d.tags as string[] | undefined;
    return (
      <div className="text-xs space-y-1">
        <div>
          <span className="text-muted-foreground">Department:</span>{" "}
          <span className="text-blue-400 font-medium">{dept?.name as string}</span>{" "}
          <span className="text-muted-foreground">({((dept?.confidence as number) * 100).toFixed(0)}%)</span>
        </div>
        {cat ? (
          <div><span className="text-muted-foreground">Category:</span> {cat.name as string}</div>
        ) : null}
        <div><span className="text-muted-foreground">Priority:</span> <span className="text-orange-400">{d.suggestedPriority as string}</span></div>
        {tags && tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            <span className="text-muted-foreground">Tags:</span>
            {tags.map((tag, i) => (
              <span key={i} className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs">{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="text-muted-foreground italic">{d.reasoning as string}</div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="text-xs space-y-1">
        <div>
          <span className="text-muted-foreground">Overall:</span>{" "}
          <span className={`font-medium ${(d.overallConfidence as number) >= 0.75 ? "text-green-400" : "text-yellow-400"}`}>
            {((d.overallConfidence as number) * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Decision:</span>{" "}
          <span className={d.passed ? "text-green-400" : "text-yellow-400"}>
            {d.passed ? "PASSED" : "NEEDS CLARIFICATION"}
          </span>
        </div>
        {d.clarifyingQuestion ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-yellow-700">
            {d.clarifyingQuestion as string}
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="text-xs space-y-1">
        <div><span className="text-muted-foreground">Subject:</span> <span className="text-green-400">{d.subject as string}</span></div>
        <div><span className="text-muted-foreground">Priority:</span> <span className="text-orange-400">{d.priority as string}</span></div>
        <div><span className="text-muted-foreground">Display ID:</span> {d.displayId as string}</div>
        <div><span className="text-muted-foreground">Team:</span> {d.assignedTeamId as string}</div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="text-xs space-y-1">
        <div><span className="text-muted-foreground">Ticket ID:</span> <span className="text-cyan-400 font-mono">{d.ticketId as string}</span></div>
        <div><span className="text-muted-foreground">Ticket #:</span> <span className="text-white font-medium">{d.ticketNumber as number}</span></div>
        <div><span className="text-muted-foreground">Display ID:</span> {d.displayId as string}</div>
        <div><span className="text-muted-foreground">SLA Created:</span> <span className={d.slaCreated ? "text-green-400" : "text-red-400"}>{d.slaCreated ? "Yes" : "No"}</span></div>
      </div>
    );
  }

  return null;
}
