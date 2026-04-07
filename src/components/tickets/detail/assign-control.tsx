"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";

interface AssignControlProps {
  ticketId: string;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  teamId: string | null;
  userId: string;
  onAssigned: () => void;
}

interface TeamMember {
  id: string;
  displayName: string;
}

export function AssignControl({
  ticketId,
  currentAssigneeId,
  currentAssigneeName,
  teamId,
  userId,
  onAssigned,
}: AssignControlProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    async function loadMembers() {
      try {
        const res = await fetch(`/api/teams/${teamId}/members`);
        const data = await res.json();
        setMembers(data.members ?? []);
      } catch {
        // ignore
      }
    }
    loadMembers();
  }, [teamId]);

  // Build full options list — ensure current assignee is always included
  const options = useMemo(() => {
    const list: TeamMember[] = [...members];
    if (currentAssigneeId && currentAssigneeName && !list.some((m) => m.id === currentAssigneeId)) {
      list.unshift({ id: currentAssigneeId, displayName: currentAssigneeName });
    }
    return list;
  }, [members, currentAssigneeId, currentAssigneeName]);

  async function handleAssign(assigneeId: string | null) {
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId, userId }),
      });

      if (res.ok) {
        onAssigned();
      }
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="space-y-2">
      {currentAssigneeName ? (
        <p className="text-sm">
          Assigned to <span className="font-medium">{currentAssigneeName}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Unassigned</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAssign(userId)}
          disabled={isAssigning || currentAssigneeId === userId}
        >
          {isAssigning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <UserPlus className="h-4 w-4 mr-1" />
          )}
          Assign to Me
        </Button>

        {options.length > 0 ? (
          <Select
            onValueChange={(v) => handleAssign(v === "unassigned" ? null : (v as string ?? null))}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Reassign..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {options.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  );
}
