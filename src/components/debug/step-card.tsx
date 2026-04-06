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
    <div className={`border-l-4 ${isError ? "border-red-500" : borderColor} bg-gray-900 rounded-r p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-gray-800 text-gray-300 text-xs font-mono px-2 py-1 rounded">
            Step {data.step}
          </span>
          <h3 className="text-white font-medium text-sm">
            {STEP_LABELS[data.step] ?? data.name}
          </h3>
          <span className="text-gray-500 text-xs font-mono">
            {data.agentName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasTools ? (
            <span className="bg-gray-800 text-blue-400 text-xs px-2 py-0.5 rounded">
              {data.toolsCalled.length} tool{data.toolsCalled.length > 1 ? "s" : ""}
            </span>
          ) : null}
          <span className={`text-xs font-mono ${data.latencyMs > 5000 ? "text-yellow-400" : "text-gray-400"}`}>
            {(data.latencyMs / 1000).toFixed(1)}s
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${isError ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
            {isError ? "FAIL" : "OK"}
          </span>
        </div>
      </div>

      {isError && data.error ? (
        <div className="bg-red-950 border border-red-800 rounded p-2 text-red-300 text-xs font-mono">
          {data.error}
        </div>
      ) : null}

      {hasTools ? (
        <div className="flex gap-1 flex-wrap">
          {data.toolsCalled.map((tool, i) => (
            <span key={i} className="bg-blue-950 text-blue-300 text-xs font-mono px-2 py-0.5 rounded">
              {tool}()
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <button
          onClick={() => setExpandedInput(!expandedInput)}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
        >
          <span>{expandedInput ? "▼" : "▶"}</span>
          <span>Input to Agent</span>
        </button>
        {expandedInput ? (
          <pre className="mt-1 bg-gray-950 rounded p-2 text-xs text-gray-400 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
            {data.input}
          </pre>
        ) : null}
      </div>

      {hasParsed ? (
        <div>
          <button
            onClick={() => setExpandedOutput(!expandedOutput)}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            <span>{expandedOutput ? "▼" : "▶"}</span>
            <span>Agent Response (parsed)</span>
          </button>
          {expandedOutput ? (
            <pre className="mt-1 bg-gray-950 rounded p-2 text-xs text-green-400 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
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
      <div className="text-xs text-gray-300 space-y-1">
        <div><span className="text-gray-500">Intent:</span> {d.intent as string}</div>
        <div><span className="text-gray-500">Type:</span> <span className="text-purple-400">{d.requestType as string}</span></div>
        {urgency && urgency.length > 0 ? (
          <div><span className="text-gray-500">Urgency:</span> <span className="text-yellow-400">{urgency.join(", ")}</span></div>
        ) : null}
        {d.affectedSystem ? (
          <div><span className="text-gray-500">System:</span> {d.affectedSystem as string}</div>
        ) : null}
      </div>
    );
  }

  if (step === 2) {
    const dept = d.department as Record<string, unknown>;
    const cat = d.category as Record<string, unknown> | null;
    const tags = d.tags as string[] | undefined;
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <div>
          <span className="text-gray-500">Department:</span>{" "}
          <span className="text-blue-400 font-medium">{dept?.name as string}</span>{" "}
          <span className="text-gray-500">({((dept?.confidence as number) * 100).toFixed(0)}%)</span>
        </div>
        {cat ? (
          <div><span className="text-gray-500">Category:</span> {cat.name as string}</div>
        ) : null}
        <div><span className="text-gray-500">Priority:</span> <span className="text-orange-400">{d.suggestedPriority as string}</span></div>
        {tags && tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            <span className="text-gray-500">Tags:</span>
            {tags.map((tag, i) => (
              <span key={i} className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs">{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="text-gray-500 italic">{d.reasoning as string}</div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <div>
          <span className="text-gray-500">Overall:</span>{" "}
          <span className={`font-medium ${(d.overallConfidence as number) >= 0.75 ? "text-green-400" : "text-yellow-400"}`}>
            {((d.overallConfidence as number) * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Decision:</span>{" "}
          <span className={d.passed ? "text-green-400" : "text-yellow-400"}>
            {d.passed ? "PASSED" : "NEEDS CLARIFICATION"}
          </span>
        </div>
        {d.clarifyingQuestion ? (
          <div className="bg-yellow-950 border border-yellow-800 rounded p-2 text-yellow-300">
            {d.clarifyingQuestion as string}
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <div><span className="text-gray-500">Subject:</span> <span className="text-green-400">{d.subject as string}</span></div>
        <div><span className="text-gray-500">Priority:</span> <span className="text-orange-400">{d.priority as string}</span></div>
        <div><span className="text-gray-500">Display ID:</span> {d.displayId as string}</div>
        <div><span className="text-gray-500">Team:</span> {d.assignedTeamId as string}</div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <div><span className="text-gray-500">Ticket ID:</span> <span className="text-cyan-400 font-mono">{d.ticketId as string}</span></div>
        <div><span className="text-gray-500">Ticket #:</span> <span className="text-white font-medium">{d.ticketNumber as number}</span></div>
        <div><span className="text-gray-500">Display ID:</span> {d.displayId as string}</div>
        <div><span className="text-gray-500">SLA Created:</span> <span className={d.slaCreated ? "text-green-400" : "text-red-400"}>{d.slaCreated ? "Yes" : "No"}</span></div>
      </div>
    );
  }

  return null;
}
