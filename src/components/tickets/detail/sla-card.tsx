"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";

interface SlaData {
  firstResponseDueAt: string | null;
  firstResponseAt: string | null;
  firstResponseBreachedAt: string | null;
  resolutionDueAt: string | null;
  resolvedAt: string | null;
  resolutionBreachedAt: string | null;
  priority: string;
}

interface SlaCardProps {
  ticketId: string;
  status: string;
}

type SlaState = "on_track" | "at_risk" | "breached" | "met" | "paused";

function getSlaState(dueAt: string | null, completedAt: string | null, breachedAt: string | null, status: string): SlaState {
  if (completedAt) return "met";
  if (breachedAt) return "breached";
  if (!dueAt) return "on_track";
  if (["WAITING_ON_REQUESTER", "WAITING_ON_VENDOR"].includes(status)) return "paused";

  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) return "breached";
  if (diff < 4 * 3600000) return "at_risk";
  return "on_track";
}

function formatDueDate(dateStr: string): string {
  const raw = dateStr;
  const date = new Date(raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimeLeft(dateStr: string): string {
  const raw = dateStr;
  const date = new Date(raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z");
  const diff = date.getTime() - Date.now();

  if (diff < 0) {
    const hours = Math.abs(Math.floor(diff / 3600000));
    if (hours < 1) return `${Math.abs(Math.floor(diff / 60000))}m overdue`;
    if (hours < 24) return `${hours}h overdue`;
    return `${Math.floor(hours / 24)}d overdue`;
  }

  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

const STATE_CONFIG: Record<SlaState, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  on_track: { icon: Clock, color: "text-green-600", bg: "bg-green-50", label: "On Track" },
  at_risk: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", label: "At Risk" },
  breached: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Breached" },
  met: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Met" },
  paused: { icon: PauseCircle, color: "text-gray-500", bg: "bg-gray-50", label: "Paused" },
};

export function SlaCard({ ticketId, status }: SlaCardProps) {
  const [sla, setSla] = useState<SlaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/sla`);
        const data = await res.json();
        setSla(data.sla ?? null);
      } catch { /* ignore */ }
      setIsLoading(false);
    }
    load();
  }, [ticketId]);

  // Re-render every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  if (isLoading) return null;
  if (!sla) return null;
  if (!sla.firstResponseDueAt && !sla.resolutionDueAt) return null;

  const frState = getSlaState(sla.firstResponseDueAt, sla.firstResponseAt, sla.firstResponseBreachedAt, status);
  const resState = getSlaState(sla.resolutionDueAt, sla.resolvedAt, sla.resolutionBreachedAt, status);

  const frConfig = STATE_CONFIG[frState];
  const resConfig = STATE_CONFIG[resState];
  const FrIcon = frConfig.icon;
  const ResIcon = resConfig.icon;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-cyan-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SLA</span>
        </div>

        {/* First Response */}
        {sla.firstResponseDueAt ? (
          <div className={`rounded-lg p-3 ${frConfig.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">First Response</span>
              <div className={`flex items-center gap-1 text-xs font-semibold ${frConfig.color}`}>
                <FrIcon className="h-3.5 w-3.5" />
                {frConfig.label}
              </div>
            </div>
            {frState === "met" ? (
              <p className="text-xs text-muted-foreground">
                Responded {sla.firstResponseAt ? formatDueDate(sla.firstResponseAt) : ""}
              </p>
            ) : frState === "paused" ? (
              <p className="text-xs text-muted-foreground">SLA paused — waiting on external party</p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Due {formatDueDate(sla.firstResponseDueAt)}</p>
                <span className={`text-xs font-medium ${frConfig.color}`}>
                  {formatTimeLeft(sla.firstResponseDueAt)}
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Resolution */}
        {sla.resolutionDueAt ? (
          <div className={`rounded-lg p-3 ${resConfig.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Resolution</span>
              <div className={`flex items-center gap-1 text-xs font-semibold ${resConfig.color}`}>
                <ResIcon className="h-3.5 w-3.5" />
                {resConfig.label}
              </div>
            </div>
            {resState === "met" ? (
              <p className="text-xs text-muted-foreground">
                Resolved {sla.resolvedAt ? formatDueDate(sla.resolvedAt) : ""}
              </p>
            ) : resState === "paused" ? (
              <p className="text-xs text-muted-foreground">SLA paused — waiting on external party</p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Due {formatDueDate(sla.resolutionDueAt)}</p>
                <span className={`text-xs font-medium ${resConfig.color}`}>
                  {formatTimeLeft(sla.resolutionDueAt)}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
