"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, X, CircleDot, AlertTriangle } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onAssignToMe: () => void;
  onBulkAction: (action: string, value: string) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onAssignToMe,
  onBulkAction,
  onClear,
  isProcessing,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="text-sm font-medium">
        {selectedCount} ticket{selectedCount !== 1 ? "s" : ""} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <Button size="sm" variant="outline" onClick={onAssignToMe} disabled={isProcessing} className="h-7">
        <UserPlus className="h-3.5 w-3.5 mr-1" />
        Assign to Me
      </Button>

      <div className="h-4 w-px bg-border" />

      {/* Bulk Status */}
      <div className="flex items-center gap-1">
        <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          onChange={(e) => { if (e.target.value) { onBulkAction("status", e.target.value); e.target.value = ""; } }}
          disabled={isProcessing}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          defaultValue=""
        >
          <option value="" disabled>Set Status...</option>
          <option value="TRIAGED">Triaged</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Bulk Priority */}
      <div className="flex items-center gap-1">
        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          onChange={(e) => { if (e.target.value) { onBulkAction("priority", e.target.value); e.target.value = ""; } }}
          disabled={isProcessing}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          defaultValue=""
        >
          <option value="" disabled>Set Priority...</option>
          <option value="P1">P1 Urgent</option>
          <option value="P2">P2 High</option>
          <option value="P3">P3 Normal</option>
          <option value="P4">P4 Low</option>
        </select>
      </div>

      <div className="flex-1" />

      <Button size="sm" variant="ghost" onClick={onClear} className="h-7 text-muted-foreground">
        <X className="h-3.5 w-3.5 mr-1" />
        Clear
      </Button>
    </div>
  );
}
