"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, X, ArrowRightLeft } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onAssignToMe: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onAssignToMe,
  onClear,
  isProcessing,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="text-sm font-medium">
        {selectedCount} ticket{selectedCount !== 1 ? "s" : ""} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <Button
        size="sm"
        variant="outline"
        onClick={onAssignToMe}
        disabled={isProcessing}
        className="h-7"
      >
        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
        Assign to Me
      </Button>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="h-7 text-muted-foreground"
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Clear
      </Button>
    </div>
  );
}
