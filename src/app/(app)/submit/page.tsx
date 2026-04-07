"use client";

import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { ExamplePrompts } from "@/components/chat/example-prompts";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { TicketCreated } from "@/components/chat/ticket-created";

const LOADING_STATES = [
  { text: "Understanding your request..." },
  { text: "Finding the right department..." },
  { text: "Checking classification confidence..." },
  { text: "Generating ticket draft..." },
  { text: "Routing to the right team..." },
  { text: "Almost there..." },
];

type ViewState =
  | { phase: "input" }
  | { phase: "processing" }
  | { phase: "created"; ticket: CreatedTicket; classification: ClassificationInfo }
  | { phase: "error"; message: string }
  | { phase: "clarification"; question: string; originalText: string };

interface CreatedTicket {
  id: string;
  number: number;
  displayId: string | null;
  subject: string;
  description: string;
  priority: string;
  tags: string[];
}

interface ClassificationInfo {
  department: string;
  departmentConfidence: number;
  category: string | null;
  intent: string;
  requestType: string;
  reasoning: string;
  urgency: string;
  routingMethod: string;
}

// Hardcoded for now — replace with auth later
const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

export default function SubmitPage() {
  const [view, setView] = useState<ViewState>({ phase: "input" });
  const [lastText, setLastText] = useState("");

  const classify = useCallback(async (text: string) => {
    setLastText(text);

    setView({ phase: "processing" });

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

      const completedSteps = data.steps ?? [];

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

      // Pipeline already created the ticket at Step 6
      if (data.finalStatus === "created" && data.ticket) {
        // Extract classification from pipeline steps
        const completedSteps = data.steps ?? [];
        const step1 = completedSteps.find((s: { step: number }) => s.step === 1);
        const step2 = completedSteps.find((s: { step: number }) => s.step === 2);
        const step3 = completedSteps.find((s: { step: number }) => s.step === 3);
        const step4 = completedSteps.find((s: { step: number }) => s.step === 4);
        const step5 = completedSteps.find((s: { step: number }) => s.step === 5);

        const intent = step1?.parsed as { intent?: string; requestType?: string; urgencySignals?: string[] } | undefined;
        const classification = step2?.parsed as { department?: { name?: string; confidence?: number }; category?: { name?: string }; reasoning?: string } | undefined;
        const confidence = step3?.parsed as { overallConfidence?: number } | undefined;
        const draft = step4?.parsed as { tags?: string[]; description?: string } | undefined;
        const routing = step5?.parsed as { team?: string; method?: string } | undefined;

        setView({
          phase: "created",
          ticket: {
            id: data.ticket.id ?? "",
            number: data.ticket.number ?? 0,
            displayId: data.ticket.displayId ?? null,
            subject: data.ticket.subject ?? "",
            description: draft?.description ?? data.ticket.description ?? "",
            priority: data.ticket.priority ?? "P3",
            tags: draft?.tags ?? [],
          },
          classification: {
            department: routing?.team ?? classification?.department?.name ?? "Unknown",
            departmentConfidence: classification?.department?.confidence ?? confidence?.overallConfidence ?? 0,
            category: classification?.category?.name ?? null,
            intent: intent?.intent ?? "",
            requestType: intent?.requestType ?? "QUESTION",
            reasoning: classification?.reasoning ?? "",
            urgency: intent?.urgencySignals?.length ? intent.urgencySignals.join(", ") : "None",
            routingMethod: routing?.method ?? "ai_classification",
          },
        });
      } else {
        setView({ phase: "error", message: "No ticket created" });
      }
    } catch (err) {
      setView({
        phase: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  }, []);

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

        {/* Multi-step loader overlay */}
        <MultiStepLoader
          loadingStates={LOADING_STATES}
          loading={view.phase === "processing"}
          duration={2000}
          loop={false}
        />

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

        {/* Created */}
        {view.phase === "created" ? (
          <TicketCreated ticket={view.ticket} classification={view.classification} onNewTicket={reset} />
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
