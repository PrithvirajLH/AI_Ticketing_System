"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircleDot,
  UserPlus,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
} from "lucide-react";

// Hardcoded — replace with auth
const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

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
  NEW: "New", TRIAGED: "Triaged", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
  WAITING_ON_REQUESTER: "Waiting on Requester", WAITING_ON_VENDOR: "Waiting on Vendor",
  RESOLVED: "Resolved", CLOSED: "Closed", REOPENED: "Reopened",
};

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string;
  assigneeId: string | null;
  assigneeName: string | null;
  teamId: string | null;
  teamName: string | null;
  onChanged: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function TicketActions({
  ticketId,
  currentStatus,
  assigneeId,
  assigneeName,
  teamId,
  teamName,
  onChanged,
}: TicketActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [members, setMembers] = useState<{ id: string; displayName: string }[]>([]);

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  useEffect(() => {
    fetch("/api/teams").then((r) => r.json()).then((d) => setTeams(d.teams ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/teams/${teamId}/members`).then((r) => r.json()).then((d) => setMembers(d.members ?? [])).catch(() => {});
  }, [teamId]);

  async function handleTransition(newStatus: string) {
    setIsUpdating(true);
    setError(null);
    const res = await fetch(`/api/tickets/${ticketId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, userId: CURRENT_USER_ID }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else onChanged();
    setIsUpdating(false);
  }

  async function handleAssign(newAssigneeId: string | null) {
    setIsUpdating(true);
    await fetch(`/api/tickets/${ticketId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: newAssigneeId, userId: CURRENT_USER_ID }),
    });
    onChanged();
    setIsUpdating(false);
  }

  async function handleTransfer(newTeamId: string) {
    if (newTeamId === teamId) return;
    setIsUpdating(true);
    await fetch(`/api/tickets/${ticketId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: newTeamId, userId: CURRENT_USER_ID }),
    });
    onChanged();
    setIsUpdating(false);
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Status */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CircleDot className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
          </div>

          {/* Current status — clearly shown */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="text-xs">{STATUS_LABELS[currentStatus] ?? currentStatus}</Badge>
          </div>

          {/* Transition options */}
          {allowed.length > 0 ? (
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Move to:</p>
              <div className="flex flex-wrap gap-1.5">
                {allowed.map((s) => {
                  const needsAssignee = ["IN_PROGRESS", "ASSIGNED", "RESOLVED"].includes(s) && !assigneeId;
                  const btnColor = s === "RESOLVED" ? "border-green-300 text-green-700 hover:bg-green-50"
                    : s === "CLOSED" ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                    : s === "REOPENED" ? "border-red-300 text-red-700 hover:bg-red-50"
                    : s.startsWith("WAITING") ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                    : "border-blue-300 text-blue-700 hover:bg-blue-50";

                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      className={`h-7 text-xs ${btnColor}`}
                      onClick={() => handleTransition(s)}
                      disabled={isUpdating || needsAssignee}
                      title={needsAssignee ? "Assign someone first" : `Change status to ${STATUS_LABELS[s]}`}
                    >
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {STATUS_LABELS[s] ?? s}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null}
        </div>

        <Separator />

        {/* Assignment */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <UserPlus className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignment</span>
          </div>

          {assigneeName ? (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(assigneeName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{assigneeName}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Unassigned</p>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAssign(CURRENT_USER_ID)}
              disabled={isUpdating || assigneeId === CURRENT_USER_ID}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign to Me
            </Button>
            {members.length > 0 ? (
              <select
                onChange={(e) => { if (e.target.value) handleAssign(e.target.value); }}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1 min-w-0"
                defaultValue=""
              >
                <option value="" disabled>Reassign...</option>
                {assigneeId && assigneeName && !members.some((m) => m.id === assigneeId) ? (
                  <option value={assigneeId}>{assigneeName}</option>
                ) : null}
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <Separator />

        {/* Transfer */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transfer</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">{teamName ?? "No team"}</span>
            <span className="text-muted-foreground text-xs">→</span>
            <select
              onChange={(e) => { if (e.target.value) handleTransfer(e.target.value); e.target.value = ""; }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1 min-w-0"
              defaultValue=""
              disabled={isUpdating}
            >
              <option value="" disabled>Transfer to...</option>
              {teams.filter((t) => t.id !== teamId).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
