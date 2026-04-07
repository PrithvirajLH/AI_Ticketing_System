"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["TRIAGED", "ASSIGNED"],
  TRIAGED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "WAITING_ON_REQUESTER", "WAITING_ON_VENDOR", "RESOLVED"],
  IN_PROGRESS: ["WAITING_ON_REQUESTER", "WAITING_ON_VENDOR", "RESOLVED"],
  WAITING_ON_REQUESTER: ["IN_PROGRESS", "WAITING_ON_VENDOR", "RESOLVED"],
  WAITING_ON_VENDOR: ["IN_PROGRESS", "WAITING_ON_REQUESTER", "RESOLVED"],
  RESOLVED: ["REOPENED", "CLOSED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["TRIAGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"],
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  TRIAGED: "Triaged",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  WAITING_ON_REQUESTER: "Waiting on Requester",
  WAITING_ON_VENDOR: "Waiting on Vendor",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

interface StatusActionsProps {
  ticketId: string;
  currentStatus: string;
  hasAssignee: boolean;
  userId: string;
  onStatusChanged: () => void;
}

export function StatusActions({
  ticketId,
  currentStatus,
  hasAssignee,
  userId,
  onStatusChanged,
}: StatusActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  async function handleTransition(newStatus: string | null) {
    if (!newStatus || isUpdating) return;
    setError(null);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onStatusChanged();
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  if (allowed.length === 0) return null;

  // Show primary action as button, rest in dropdown
  const primaryAction = allowed[0];
  const needsAssignee = ["IN_PROGRESS", "ASSIGNED", "RESOLVED"].includes(primaryAction);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleTransition(primaryAction)}
          disabled={isUpdating || (needsAssignee && !hasAssignee)}
          title={needsAssignee && !hasAssignee ? "Assign someone first" : undefined}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {STATUS_LABELS[primaryAction] ?? primaryAction}
        </Button>

        {allowed.length > 1 ? (
          <Select onValueChange={(v) => handleTransition(v as string | null)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="More actions..." />
            </SelectTrigger>
            <SelectContent>
              {allowed.slice(1).map((s) => {
                const needsAgent = ["IN_PROGRESS", "ASSIGNED", "RESOLVED"].includes(s);
                return (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={needsAgent && !hasAssignee}
                  >
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
