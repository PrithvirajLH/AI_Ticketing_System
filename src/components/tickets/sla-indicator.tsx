import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";

interface SlaIndicatorProps {
  dueAt: string | null;
  firstResponseDueAt: string | null;
  firstResponseAt: string | null;
  status: string;
}

type SlaState = "on_track" | "at_risk" | "breached" | "paused" | "met";

function getSlaState(dueAt: string | null, status: string): SlaState {
  if (!dueAt) return "on_track";

  const paused = status === "WAITING_ON_REQUESTER" || status === "WAITING_ON_VENDOR";
  if (paused) return "paused";

  const resolved = status === "RESOLVED" || status === "CLOSED";
  if (resolved) return "met";

  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const hoursLeft = (due - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) return "breached";
  if (hoursLeft < 4) return "at_risk";
  return "on_track";
}

function formatTimeLeft(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) {
    const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    return `${hours}h overdue`;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m left`;
  }
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function SlaIndicator({ dueAt, firstResponseDueAt, firstResponseAt, status }: SlaIndicatorProps) {
  const activeDue = !firstResponseAt && firstResponseDueAt ? firstResponseDueAt : dueAt;
  const slaState = getSlaState(activeDue, status);
  const label = !firstResponseAt && firstResponseDueAt ? "First response" : "Resolution";

  if (slaState === "met" || !activeDue) return null;

  const timeLeft = formatTimeLeft(activeDue);

  if (slaState === "breached") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {timeLeft}
          </span>
        </TooltipTrigger>
        <TooltipContent>{label} SLA breached</TooltipContent>
      </Tooltip>
    );
  }

  if (slaState === "at_risk") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {timeLeft}
          </span>
        </TooltipTrigger>
        <TooltipContent>{label} SLA at risk</TooltipContent>
      </Tooltip>
    );
  }

  if (slaState === "paused") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Paused
          </span>
        </TooltipTrigger>
        <TooltipContent>SLA paused — waiting on external party</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {timeLeft}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label} due: {new Date(activeDue).toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}
