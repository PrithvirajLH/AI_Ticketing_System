"use client";

import { useState } from "react";
import { PipelineInputForm } from "@/components/debug/pipeline-input";
import { StepCard } from "@/components/debug/step-card";
import { PipelineResult } from "@/components/debug/pipeline-result";

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

interface DebugResult {
  steps: StepData[];
  finalStatus: "created" | "needs_clarification" | "error";
  totalLatencyMs: number;
  ticket?: Record<string, unknown>;
  clarifyingQuestion?: string;
  errorMessage?: string;
}

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string, userId: string) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          userId: userId || undefined,
          channel: "PORTAL",
        }),
      });

      const data = await res.json();

      if (data.error && !data.steps) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        <div>
          <h1>AI Pipeline Debug</h1>
          <p className="text-muted-foreground mt-1">
            Test the 4-agent classification pipeline. See input/output for each step.
          </p>
        </div>

        <PipelineInputForm onSubmit={handleSubmit} isLoading={isLoading} />

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <span className="inline-block animate-spin mr-2">&#9696;</span>
            Running pipeline — this takes ~10-15 seconds...
          </div>
        ) : null}

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Pipeline Steps ({result.steps.length}/5)
            </h2>

            <div className="space-y-3">
              {result.steps.map((step) => (
                <StepCard key={step.step} data={step} />
              ))}
            </div>

            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide pt-2">
              Result
            </h2>
            <PipelineResult
              finalStatus={result.finalStatus}
              totalLatencyMs={result.totalLatencyMs}
              ticket={result.ticket}
              clarifyingQuestion={result.clarifyingQuestion}
              errorMessage={result.errorMessage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
