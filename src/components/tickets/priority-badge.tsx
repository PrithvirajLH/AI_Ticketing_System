import { Badge } from "@/components/ui/badge";

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  P1: { label: "P1 Urgent", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  P2: { label: "P2 High", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  P3: { label: "P3 Normal", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  P4: { label: "P4 Low", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

interface PriorityBadgeProps {
  priority: string;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    className: "bg-gray-500/10 text-gray-500",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {compact ? priority : config.label}
    </Badge>
  );
}
