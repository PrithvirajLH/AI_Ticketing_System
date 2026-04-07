"use client";

import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { ExamplePrompts } from "@/components/chat/example-prompts";
import { ProcessingSteps, type PipelineStep } from "@/components/chat/processing-steps";
import { TicketPreview } from "@/components/chat/ticket-preview";
import { TicketCreated } from "@/components/chat/ticket-created";

type ViewState =
  | { phase: "input" }
  | { phase: "processing"; steps: PipelineStep[] }
  | { phase: "preview"; ticket: TicketData; confidence: number; teamName: string; categoryName: string; steps: StepData[] }
  | { phase: "created"; ticket: CreatedTicket }
  | { phase: "error"; message: string }
  | { phase: "clarification"; question: string; originalText: string };

interface TicketData {
  subject: string;
  description: string;
  priority: string;
  channel: string;
  assignedTeamId: string;
  categoryId: string | null;
  displayId: string;
  tags: string[];
}

interface CreatedTicket {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  priority: string;
}

interface StepData {
  parsed: unknown;
  [key: string]: unknown;
}

// Hardcoded for now — replace with auth later
const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

export default function SubmitPage() {
  const [view, setView] = useState<ViewState>({ phase: "input" });
  const [lastText, setLastText] = useState("");

  const classify = useCallback(async (text: string) => {
    setLastText(text);

    const steps: PipelineStep[] = [
      { name: "Understanding your request", status: "running" },
      { name: "Finding the right department", status: "pending" },
      { name: "Checking confidence", status: "pending" },
      { name: "Generating ticket draft", status: "pending" },
    ];

    setView({ phase: "processing", steps: [...steps] });

    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          userId: CURRENT_USER_ID,
          channel: "PORTAL",
        }),
      });

      const data = await res.json();

      if (data.error && !data.steps) {
        setView({ phase: "error", message: data.error });
        return;
      }

      // Update steps based on response
      const completedSteps = data.steps ?? [];
      for (let i = 0; i < steps.length; i++) {
        const completed = completedSteps[i];
        if (completed) {
          steps[i] = {
            name: steps[i].name,
            status: completed.status === "success" ? "done" : "error",
            detail:
              i === 0 && completed.parsed
                ? (completed.parsed as { intent?: string })?.intent
                : i === 1 && completed.parsed
                  ? `${(completed.parsed as { department?: { name?: string } })?.department?.name} (${((completed.parsed as { department?: { confidence?: number } })?.department?.confidence ?? 0) * 100}%)`
                  : undefined,
          };
        }
        setView({ phase: "processing", steps: [...steps] });
      }

      if (data.finalStatus === "needs_clarification") {
        setView({
          phase: "clarification",
          question: data.clarifyingQuestion,
          originalText: text,
        });
        return;
      }

      if (data.finalStatus === "error") {
        setView({ phase: "error", message: data.errorMessage ?? "Pipeline failed" });
        return;
      }

      // Find ticket draft from step 4 and classification from step 2
      const step4 = completedSteps.find(
        (s: { step: number }) => s.step === 4
      );
      if (step4?.parsed) {
        const ticket = step4.parsed as TicketData;
        const step3 = completedSteps.find(
          (s: { step: number }) => s.step === 3
        );
        const step2 = completedSteps.find(
          (s: { step: number }) => s.step === 2
        );
        const confidence =
          (step3?.parsed as { overallConfidence?: number })
            ?.overallConfidence ?? 0.8;

        // Extract team and category names from classification
        const classification = step2?.parsed as {
          department?: { name?: string };
          category?: { name?: string };
        } | undefined;
        const teamName = classification?.department?.name ?? ticket.assignedTeamId;
        const categoryName = classification?.category?.name ?? ticket.categoryId ?? "—";

        setView({
          phase: "preview",
          ticket,
          confidence,
          teamName,
          categoryName,
          steps: completedSteps,
        });
      } else {
        setView({ phase: "error", message: "No ticket draft generated" });
      }
    } catch (err) {
      setView({
        phase: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  }, []);

  const submitTicket = useCallback(async () => {
    if (view.phase !== "preview") return;

    const { ticket } = view;

    setView((prev) =>
      prev.phase === "preview" ? { ...prev, phase: "preview" } : prev
    );

    try {
      const res = await fetch("/api/ai/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticket,
          requesterId: CURRENT_USER_ID,
        }),
      });

      const data = await res.json();

      if (data.status === "created") {
        setView({ phase: "created", ticket: data.ticket });
      } else {
        setView({ phase: "error", message: data.error ?? "Failed to create ticket" });
      }
    } catch (err) {
      setView({
        phase: "error",
        message: err instanceof Error ? err.message : "Submit failed",
      });
    }
  }, [view]);

  const reset = useCallback(() => {
    setView({ phase: "input" });
    setLastText("");
  }, []);

  return (
    <div className="flex items-center justify-center p-6 min-h-full">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        {view.phase === "input" ? (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1>How can I help you?</h1>
            <p className="text-muted-foreground">
              Describe your issue or request in plain language. Our AI will route
              it to the right team.
            </p>
          </div>
        ) : null}

        {/* Input + Examples */}
        {view.phase === "input" ? (
          <div className="space-y-5">
            <ChatInput onSubmit={classify} isLoading={false} />
            <ExamplePrompts onSelect={(text) => classify(text)} />
          </div>
        ) : null}

        {/* Processing */}
        {view.phase === "processing" ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              {lastText}
            </div>
            <ProcessingSteps steps={view.steps} />
          </div>
        ) : null}

        {/* Clarification */}
        {view.phase === "clarification" ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              {view.originalText}
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                I need a bit more info:
              </p>
              <p className="text-sm mt-1">{view.question}</p>
            </div>
            <ChatInput
              onSubmit={(answer) =>
                classify(`${view.originalText}\n\nAdditional info: ${answer}`)
              }
              isLoading={false}
              placeholder="Type your answer..."
            />
          </div>
        ) : null}

        {/* Preview */}
        {view.phase === "preview" ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              {lastText}
            </div>
            <TicketPreview
              ticket={view.ticket}
              teamName={view.teamName}
              categoryName={view.categoryName}
              confidence={view.confidence}
              onConfirm={submitTicket}
              onRetry={() => classify(lastText)}
              isSubmitting={false}
            />
          </div>
        ) : null}

        {/* Created */}
        {view.phase === "created" ? (
          <TicketCreated ticket={view.ticket} onNewTicket={reset} />
        ) : null}

        {/* Error */}
        {view.phase === "error" ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-500">{view.message}</p>
            </div>
            <button
              onClick={reset}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
