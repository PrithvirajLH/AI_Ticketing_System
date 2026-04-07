"use client";

import { Check, Loader2, Circle } from "lucide-react";

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

interface ProcessingStepsProps {
  steps: PipelineStep[];
}

export function ProcessingSteps({ steps }: ProcessingStepsProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5">
            {step.status === "done" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : step.status === "running" ? (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            ) : step.status === "error" ? (
              <Circle className="h-4 w-4 text-red-500 fill-red-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm ${
                step.status === "running"
                  ? "text-foreground font-medium"
                  : step.status === "done"
                    ? "text-muted-foreground"
                    : step.status === "error"
                      ? "text-red-500"
                      : "text-muted-foreground/50"
              }`}
            >
              {step.name}
            </p>
            {step.detail ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {step.detail}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
